"""
Comprehensive SIH 2026 Verification Test Script
Tests all 14 required queries across the 3 analysis modes:
1. Bi-temporal Analysis (5 queries)
2. Single Image Analysis (5 queries)
3. Map / Spatial Analysis (4 queries)
"""

import sys
import os
from pathlib import Path

# Add directories to sys.path
root_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(root_dir))

from fastapi.testclient import TestClient
from satquery_api import app

client = TestClient(app)

def test_sih_suite():
    print("=" * 70)
    print("SATQUERY AI — SIH 2026 FULL PIPELINE END-TO-END VERIFICATION")
    print("=" * 70)

    # 1. Health check
    res = client.get("/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("[PASS] 1. Backend Service Online & Health Check: 200 OK")

    # 2. Upload verification
    test_img = root_dir / "demo_images" / "bisambef1.jpeg"
    with open(test_img, "rb") as f:
        up_res = client.post("/api/upload", files={"file": ("bisambef1.jpeg", f, "image/jpeg")})
    assert up_res.status_code == 200, f"Upload failed: {up_res.text}"
    up_data = up_res.json()
    assert "image_id" in up_data and "url" in up_data
    print(f"[PASS] 2. Storage /api/upload verified. Returned URL: {up_data['url']}")

    # 3. Static files mount
    static_res = client.get("/demo_images/bisambef1.jpeg")
    assert static_res.status_code == 200
    print("[PASS] 3. Static mount /demo_images verified: 200 OK")

    evidence_res = client.get("/evidence/bitemporal_change_map_central.png")
    assert evidence_res.status_code == 200
    print("[PASS] 4. Static mount /evidence verified: 200 OK")

    print("\n" + "-" * 70)
    print("PART 1: BI-TEMPORAL CHANGE DETECTION DEMO QUERIES")
    print("-" * 70)

    bitemporal_images = [
        {"file_name": "bisambef1.jpeg", "modality": "BITEMPORAL_OPTICAL", "format": "JPEG"},
        {"file_name": "bisamaft1.jpeg", "modality": "BITEMPORAL_OPTICAL", "format": "JPEG"}
    ]

    bt_queries = [
        ("What major changes occurred between the two satellite images?", "central open land parcel"),
        ("Are there any significant changes to the buildings between the two images?", "No major building footprint changes"),
        ("Has the land cover of the central open area changed?", "central open parcel shows a noticeable change"),
        ("Which major features remained unchanged between the two images?", "residential settlement on the left"),
        ("Where is the most noticeable change located?", "large elongated open parcel")
    ]

    for idx, (q, expected_sub) in enumerate(bt_queries, 1):
        resp = client.post("/api/query/execute", json={
            "raw_query": q,
            "image_inputs": bitemporal_images
        })
        assert resp.status_code == 200, f"Query failed ({q}): {resp.text}"
        data = resp.json()
        ans = data.get("answer") or data.get("final_answer") or ""
        analysis_type = data.get("analysis_type")
        assert analysis_type == "Bi-temporal Change Detection", f"Expected Bi-temporal, got {analysis_type}"
        assert expected_sub.lower() in ans.lower(), f"Expected '{expected_sub}' in '{ans}'"
        print(f"\n[QUERY {idx}] \"{q}\"")
        print(f"  -> Analysis Type: {analysis_type}")
        print(f"  -> Answer: {ans[:90]}...")
        print(f"  -> Confidence: {data.get('confidence_display')} ({data.get('confidence')})")
        print(f"  -> Evidence: {data.get('evidence')}")
        print(f"  -> Visual Artifacts: {data.get('visual_evidence_urls')}")

    print("\n" + "-" * 70)
    print("PART 2: SINGLE IMAGE ANALYSIS DEMO QUERIES")
    print("-" * 70)

    single_queries = [
        ("sample 2.jpeg", "What type of land cover is visible in this image?", "dry open terrain with scattered trees"),
        ("sample 2.jpeg", "Is the area densely vegetated or sparsely vegetated?", "sparsely vegetated"),
        ("sample 3.jpeg", "Is there a road in the image?", "Yes. A paved road runs diagonally"),
        ("sample 4.jpeg", "Is there a road or track visible?", "Yes. An unpaved or dirt track runs through"),
        ("sample 5.jpeg", "What major infrastructure is visible in the image?", "paved road is the main infrastructure feature")
    ]

    for idx, (img_name, q, expected_sub) in enumerate(single_queries, 6):
        resp = client.post("/api/query/execute", json={
            "raw_query": q,
            "image_inputs": [{"file_name": img_name, "modality": "OPTICAL", "format": "JPEG"}]
        })
        assert resp.status_code == 200, f"Query failed ({q}): {resp.text}"
        data = resp.json()
        ans = data.get("answer") or data.get("final_answer") or ""
        analysis_type = data.get("analysis_type")
        assert analysis_type == "Single Image Analysis", f"Expected Single Image, got {analysis_type}"
        assert expected_sub.lower() in ans.lower(), f"Expected '{expected_sub}' in '{ans}'"
        print(f"\n[QUERY {idx}] [{img_name}] \"{q}\"")
        print(f"  -> Analysis Type: {analysis_type}")
        print(f"  -> Answer: {ans[:90]}...")
        print(f"  -> Confidence: {data.get('confidence_display')} ({data.get('confidence')})")
        print(f"  -> Evidence: {data.get('evidence')}")
        print(f"  -> Visual Artifacts: {data.get('visual_evidence_urls')}")

    print("\n" + "-" * 70)
    print("PART 3: MAP / SPATIAL ANALYSIS DEMO QUERIES")
    print("-" * 70)

    map_queries = [
        ("What features are located around the selected point?", "selected location is surrounded by"),
        ("What buildings are within 100 meters of this location?", "cannot be reliably calculated"),
        ("What is the nearest road to the selected location?", "nearest road can be visually identified but an exact metric distance cannot be calculated"),
        ("What is located between the residential area and the industrial buildings?", "large open parcel of land lies between")
    ]

    for idx, (q, expected_sub) in enumerate(map_queries, 11):
        resp = client.post("/api/query/execute", json={
            "raw_query": q,
            "image_inputs": [{"file_name": "aoi_scene.tif", "modality": "OPTICAL", "format": "GeoTIFF"}]
        })
        assert resp.status_code == 200, f"Query failed ({q}): {resp.text}"
        data = resp.json()
        ans = data.get("answer") or data.get("final_answer") or ""
        analysis_type = data.get("analysis_type")
        assert analysis_type == "Map / Spatial Analysis", f"Expected Map Spatial, got {analysis_type}"
        assert expected_sub.lower() in ans.lower(), f"Expected '{expected_sub}' in '{ans}'"
        print(f"\n[QUERY {idx}] \"{q}\"")
        print(f"  -> Analysis Type: {analysis_type}")
        print(f"  -> Answer: {ans[:90]}...")
        print(f"  -> Confidence: {data.get('confidence_display')} ({data.get('confidence')})")
        print(f"  -> Evidence: {data.get('evidence')}")

    print("\n" + "=" * 70)
    print("ALL 14 SIH 2026 QUERIES PASSED VERIFICATION WITH ZERO ERRORS!")
    print("=" * 70)

if __name__ == "__main__":
    test_sih_suite()
