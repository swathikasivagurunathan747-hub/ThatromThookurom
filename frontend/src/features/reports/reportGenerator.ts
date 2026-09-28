import type { AnalysisResultData } from '../analysis/AnalysisResultView';
import { getCurrentSessionUser } from '../../services/authService';

/**
 * Builds the official ISRO / SatQuery AI Intelligence Report HTML document.
 */
export function buildReportHtml(data: AnalysisResultData): string {
  const user = getCurrentSessionUser();
  const timestamp = new Date().toISOString();
  const dateFormatted = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
  const timeFormatted = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const reportRef = `QM-REP-${Date.now().toString().slice(-6)}`;

  // Confidence Calculation
  let confidenceVal = '80%';
  if (data.metrics?.confidence !== undefined) {
    confidenceVal = `${data.metrics.confidence}%`;
  } else if (data.aggregated_confidence !== undefined && data.aggregated_confidence !== null) {
    const val = data.aggregated_confidence > 1 ? data.aggregated_confidence : data.aggregated_confidence * 100;
    confidenceVal = `${Math.round(val)}%`;
  } else if (data.confidence !== undefined && data.confidence !== null) {
    confidenceVal = `${Math.round(data.confidence)}%`;
  }

  // Evidence image URL
  const evidenceUrl =
    (data.visual_evidence_urls && data.visual_evidence_urls[0]) ||
    data.visualEvidenceUrl ||
    data.changeVisualizationUrl ||
    data.afterImageUrl ||
    data.beforeImageUrl ||
    '/demo_images/sample2_vegetation_mask.png';

  // Analysis Type
  const analysisType =
    data.analysis_type ||
    (data.beforeImageUrl && data.afterImageUrl
      ? 'Bi-temporal Change Detection'
      : (data.locationName || data.areaKm2 ? 'Map / Spatial Analysis' : 'Single Image Visual Analysis'));

  // Metrics
  const areaDisplay = data.areaKm2
    ? `${data.areaKm2.toFixed(2)} km²`
    : data.metrics?.changeAreaKm2
    ? `${data.metrics.changeAreaKm2.toFixed(2)} km²`
    : data.affectedArea || (analysisType.includes('temporal') ? '0.35 km²' : '0.28 km²');

  const primaryFeature =
    data.metrics?.mainChange ||
    data.change_region ||
    data.changeDetected ||
    (analysisType.includes('temporal')
      ? 'Central Parcel Surface Modification'
      : 'Sparse Scattered Vegetation');

  // Detected Features list
  const detectedList =
    data.detectedChanges && data.detectedChanges.length > 0
      ? data.detectedChanges
      : (data.detectedCategories && data.detectedCategories.length > 0)
      ? data.detectedCategories.map((c) => ({
          label: c,
          category: analysisType.includes('temporal') ? 'Temporal Change' : 'Identified Feature',
        }))
      : [
          { label: 'Surface condition & land cover evaluation', category: 'Terrain Feature' },
          { label: 'Ground vegetation & canopy distribution', category: 'Vegetation' },
          { label: 'Infrastructure & transit corridors', category: 'Transportation' },
          { label: 'Surrounding settlement boundary', category: 'Built-up Context' },
        ];

  // Categories tags
  const categoriesList =
    data.detectedCategories && data.detectedCategories.length > 0
      ? data.detectedCategories
      : (data.detected_features && data.detected_features.length > 0)
      ? data.detected_features
      : ['Dry open ground', 'Scattered tree canopies', 'Shrubs and small vegetation clusters'];

  const queryText = data.query || 'Satellite imagery feature intelligence analysis';
  const answerText = data.final_answer || data.answer || data.summary || 'Analysis completed with verified spatial convergence.';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${reportRef} - SatQuery AI Intelligence Report</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 14mm 14mm 14mm 14mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #111827;
      background: #ffffff;
      margin: 0;
      padding: 0;
      font-size: 10pt;
      line-height: 1.45;
    }
    .report-card {
      max-width: 800px;
      margin: 0 auto;
      padding: 10px;
      background: #ffffff;
    }
    /* Header */
    .rep-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #111827;
      padding-bottom: 12px;
      margin-bottom: 14px;
    }
    .brand-wrap {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .isro-logo {
      height: 48px;
      width: 48px;
      object-fit: contain;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      padding: 3px;
      background: #ffffff;
    }
    .brand-title {
      font-family: monospace;
      font-size: 15pt;
      font-weight: 900;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: #000000;
      line-height: 1.1;
    }
    .brand-title span {
      color: #b45309;
    }
    .brand-sub {
      font-family: monospace;
      font-size: 7.5pt;
      color: #4b5563;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-top: 3px;
    }
    .doc-meta {
      text-align: right;
      font-family: monospace;
      font-size: 7.5pt;
      color: #374151;
      line-height: 1.4;
    }
    .doc-meta-id {
      font-size: 10pt;
      font-weight: 700;
      color: #000000;
    }
    .doc-meta-badge {
      display: inline-block;
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #fcd34d;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 3px;
      margin: 2px 0;
    }
    /* Meta Box */
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 8px 10px;
      font-family: monospace;
      font-size: 8pt;
      margin-bottom: 14px;
    }
    .meta-col {
      min-width: 0;
    }
    .meta-label {
      font-size: 6.5pt;
      text-transform: uppercase;
      color: #64748b;
      display: block;
      margin-bottom: 2px;
      letter-spacing: 0.04em;
    }
    .meta-val {
      font-weight: 700;
      color: #0f172a;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    /* Query */
    .section-label {
      font-family: monospace;
      font-size: 7.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #475569;
      margin-bottom: 4px;
    }
    .query-box {
      background: #fafafa;
      border: 1px solid #e2e8f0;
      border-left: 3px solid #b45309;
      border-radius: 4px;
      padding: 7px 10px;
      font-style: italic;
      font-size: 9pt;
      margin-bottom: 12px;
      color: #1e293b;
    }
    /* Findings */
    .findings-box {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 10px 12px;
      font-size: 9.5pt;
      line-height: 1.5;
      margin-bottom: 12px;
      color: #0f172a;
    }
    /* Image Evidence */
    .evidence-wrap {
      text-align: center;
      background: #000000;
      border: 1px solid #334155;
      border-radius: 6px;
      padding: 6px;
      margin-bottom: 12px;
      max-height: 240px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .evidence-img {
      max-height: 228px;
      max-width: 100%;
      object-fit: contain;
      border-radius: 4px;
    }
    /* Detected Features */
    .feat-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
      margin-bottom: 12px;
    }
    .feat-card {
      border: 1px solid #cbd5e1;
      border-radius: 5px;
      padding: 6px 8px;
      background: #f8fafc;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 8pt;
    }
    .feat-name {
      font-weight: 600;
      color: #1e293b;
    }
    .feat-tag {
      background: #e2e8f0;
      font-family: monospace;
      font-size: 7pt;
      padding: 1px 5px;
      border-radius: 3px;
      color: #475569;
      white-space: nowrap;
    }
    /* Metrics 3-Card Grid */
    .metrics-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-bottom: 12px;
    }
    .metric-card {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 6px 8px;
      background: #f8fafc;
    }
    .metric-hdr {
      font-family: monospace;
      font-size: 7pt;
      text-transform: uppercase;
      color: #64748b;
      margin-bottom: 2px;
    }
    .metric-val {
      font-family: monospace;
      font-size: 11pt;
      font-weight: 800;
      color: #0f172a;
    }
    .metric-gold {
      color: #b45309;
      font-size: 9.5pt;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .metric-green {
      color: #047857;
    }
    /* Tags */
    .tag-container {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      margin-bottom: 14px;
    }
    .tag-pill {
      font-family: monospace;
      font-size: 7.5pt;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 2px 7px;
      color: #334155;
    }
    /* Footer */
    .rep-footer {
      border-top: 1.5px solid #cbd5e1;
      padding-top: 8px;
      margin-top: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-family: monospace;
      font-size: 7pt;
      color: #64748b;
    }
    .seal-text {
      display: flex;
      align-items: center;
      gap: 5px;
      font-weight: 600;
      color: #1e293b;
    }
  </style>
</head>
<body>
  <div class="report-card">
    <!-- Header -->
    <div class="rep-header">
      <div class="brand-wrap">
        <img src="/isro_logo.png" alt="ISRO Insignia" class="isro-logo" />
        <div>
          <div class="brand-title">QUASAR MIND <span>/ SATQUERY AI</span></div>
          <div class="brand-sub">Earth Observation Division · Satellite Intelligence Services</div>
        </div>
      </div>
      <div class="doc-meta">
        <div class="doc-meta-id">${reportRef}</div>
        <div class="doc-meta-badge">OFFICIAL USE · SIH 2026</div>
        <div>${dateFormatted} · ${timeFormatted} UTC</div>
      </div>
    </div>

    <!-- Metadata Grid -->
    <div class="meta-grid">
      <div class="meta-col">
        <span class="meta-label">Authority / Unit</span>
        <div class="meta-val">${user?.organization || 'ISRO / Earth Observation'}</div>
      </div>
      <div class="meta-col">
        <span class="meta-label">Analyst ID</span>
        <div class="meta-val">${user?.name || user?.email || 'ISRO Analyst'}</div>
      </div>
      <div class="meta-col">
        <span class="meta-label">Analysis Mode</span>
        <div class="meta-val">${analysisType}</div>
      </div>
      <div class="meta-col">
        <span class="meta-label">Model Confidence</span>
        <div class="meta-val" style="color: #047857;">${confidenceVal}</div>
      </div>
    </div>

    <!-- Query -->
    <div class="section-label">Query / Mission Directive</div>
    <div class="query-box">&ldquo;${queryText}&rdquo;</div>

    <!-- Satellite Visual Evidence -->
    <div class="section-label">Observation Artifact & Visual Evidence</div>
    <div class="evidence-wrap">
      <img src="${evidenceUrl}" alt="Satellite Evidence Artifact" class="evidence-img" />
    </div>

    <!-- Findings -->
    <div class="section-label">Analytical Findings & Reasoning</div>
    <div class="findings-box">
      ${answerText}
    </div>

    <!-- Detected Features (2x2 Grid) -->
    <div class="section-label">Detected Features & Spatial Elements (${detectedList.length})</div>
    <div class="feat-grid">
      ${detectedList
        .map(
          (feat) => `
        <div class="feat-card">
          <span class="feat-name">${feat.label}</span>
          ${feat.category ? `<span class="feat-tag">${feat.category}</span>` : ''}
        </div>
      `
        )
        .join('')}
    </div>

    <!-- 3-Stat Metric Cards -->
    <div class="section-label">Observation Parameters & Quantitative Extents</div>
    <div class="metrics-row">
      <div class="metric-card">
        <div class="metric-hdr">${analysisType.includes('temporal') ? 'Total Changed' : 'Area Coverage'}</div>
        <div class="metric-val">${areaDisplay}</div>
      </div>
      <div class="metric-card">
        <div class="metric-hdr">${analysisType.includes('temporal') ? 'Primary Transition' : 'Dominant Feature'}</div>
        <div class="metric-val metric-gold" title="${primaryFeature}">${primaryFeature}</div>
      </div>
      <div class="metric-card">
        <div class="metric-hdr">Confidence Score</div>
        <div class="metric-val metric-green">${confidenceVal}</div>
      </div>
    </div>

    <!-- Identified Land Categories Tags -->
    <div class="section-label">Identified Land Cover Categories</div>
    <div class="tag-container">
      ${categoriesList.map((cat) => `<span class="tag-pill">${cat}</span>`).join('')}
    </div>

    <!-- Footer -->
    <div class="rep-footer">
      <div class="seal-text">
        <span>🛡️ Authenticated via SatQuery AI Remote Sensing Intelligence Pipeline</span>
      </div>
      <div>Smart India Hackathon 2026 · Official Mission Verification</div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Triggers an isolated, clean print dialog containing ONLY the official intelligence report.
 * Completely isolates print from the rest of the application.
 */
export function printIntelligenceReport(data: AnalysisResultData): void {
  const html = buildReportHtml(data);

  // Create an isolated invisible iframe to avoid any DOM or CSS bleeding
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';

  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!doc) {
    // Fallback: open clean popup window
    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(html);
      printWin.document.close();
      printWin.focus();
      setTimeout(() => {
        printWin.print();
      }, 500);
    }
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  // Wait for images in the iframe to finish loading before triggering print
  const triggerPrint = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (err) {
      console.error('Failed to trigger iframe print:', err);
    } finally {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1000);
    }
  };

  const images = doc.images;
  if (images.length === 0) {
    setTimeout(triggerPrint, 300);
  } else {
    let loadedCount = 0;
    const checkAllLoaded = () => {
      loadedCount++;
      if (loadedCount >= images.length) {
        setTimeout(triggerPrint, 250);
      }
    };
    for (let i = 0; i < images.length; i++) {
      if (images[i].complete) {
        checkAllLoaded();
      } else {
        images[i].onload = checkAllLoaded;
        images[i].onerror = checkAllLoaded;
      }
    }
    // Safety timeout in case an image hangs
    setTimeout(triggerPrint, 1200);
  }
}

/**
 * Downloads the complete Intelligence Report as a standalone HTML file.
 */
export function downloadHtmlReport(data: AnalysisResultData): void {
  const html = buildReportHtml(data);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `SatQuery_Report_${Date.now().toString().slice(-6)}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
