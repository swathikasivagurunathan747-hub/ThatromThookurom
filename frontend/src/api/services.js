import { apiRequest } from "./api";

/**
 * ============================================================
 * SATQUERY AI — Centralized Backend API Services
 * Base URL: https://sat-backend-bbaq.onrender.com
 * ============================================================
 */

// 0. Binary Image Upload Service
// Uploads satellite image to backend /api/upload (Supabase Storage satquery-evidence bucket)
export const uploadImage = async (file, options = {}) => {
  const formData = new FormData();
  formData.append("file", file);
  if (options.modality) {
    formData.append("modality", options.modality);
  }
  if (options.sensor_type) {
    formData.append("sensor_type", options.sensor_type);
  }
  if (options.bounds) {
    formData.append(
      "bounds",
      typeof options.bounds === "string" ? options.bounds : JSON.stringify(options.bounds)
    );
  }

  return apiRequest("/api/upload", {
    method: "POST",
    body: formData,
  });
};

// 1. Authentication Service
// Calls backend authentication endpoint if deployed, otherwise handles gracefully.
export const loginUser = (data) =>
  apiRequest("/login", {
    method: "POST",
    body: JSON.stringify(data),
  });

// 2. Single Image & Agentic Analysis Service
// Maps to the deployed /api/query/execute endpoint
export const analyzeImage = async (data) => {
  // If structured as ExecuteQueryRequest
  if (data && typeof data === "object" && data.raw_query && Array.isArray(data.image_inputs)) {
    return apiRequest("/api/query/execute", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Handle standard image/query input payload
  const rawQuery = data?.query || data?.raw_query || "Describe what is visible in this satellite scene.";
  const fileName = data?.fileName || data?.imageName || (data?.imageFile && data.imageFile.name) || "satellite_scene.png";

  const imageInput = {
    image_id: data?.image_id || null,
    url: data?.url || null,
    storage_path: data?.storage_path || null,
    file_name: fileName,
    format: data?.format || "PNG",
    modality: data?.modality || "OPTICAL",
    sensor_type: data?.sensor_type || "Sentinel-2",
    bounds: data?.bounds || null,
  };

  const payload = {
    raw_query: rawQuery,
    image_inputs: data?.image_inputs || [imageInput],
    project_context: data?.project_context || (data?.area ? { aoi: data.area } : null),
    session_id: data?.session_id || null,
  };

  return apiRequest("/api/query/execute", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

// 3. Bi-Temporal / Change Detection Analysis Service
export const detectChange = async (data) => {
  const rawQuery =
    data?.query ||
    data?.raw_query ||
    "Compare these two satellite scenes and identify what changed, including built-up expansion and vegetation loss.";

  const file1Name = data?.file1Name || (data?.image1 && data.image1.name) || "t1_pre_event.png";
  const file2Name = data?.file2Name || (data?.image2 && data.image2.name) || "t2_post_event.png";

  const defaultImageInputs = [
    {
      image_id: data?.image1_id || data?.image_id1 || null,
      url: data?.url1 || data?.image1_url || null,
      storage_path: data?.storage_path1 || null,
      file_name: file1Name,
      format: data?.format1 || "PNG",
      modality: "BITEMPORAL_OPTICAL",
      sensor_type: data?.sensor_type || "Sentinel-2",
      timestamp: data?.timestamp1 || "2022-01-01",
    },
    {
      image_id: data?.image2_id || data?.image_id2 || null,
      url: data?.url2 || data?.image2_url || null,
      storage_path: data?.storage_path2 || null,
      file_name: file2Name,
      format: data?.format2 || "PNG",
      modality: "BITEMPORAL_OPTICAL",
      sensor_type: data?.sensor_type || "Sentinel-2",
      timestamp: data?.timestamp2 || "2024-01-01",
    },
  ];

  const payload = {
    raw_query: rawQuery,
    image_inputs: data?.image_inputs || defaultImageInputs,
    project_context: data?.project_context || null,
    session_id: data?.session_id || null,
  };

  return apiRequest("/api/query/execute", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

// 4. Trace & Analysis History Service
// Calls deployed /api/traces endpoint (with /history fallback)
export const getHistory = async () => {
  try {
    return await apiRequest("/api/traces", {
      method: "GET",
    });
  } catch {
    return await apiRequest("/history", {
      method: "GET",
    });
  }
};

// 5. Specialist Agents Catalog
export const getAgents = () =>
  apiRequest("/api/agents", {
    method: "GET",
  });

// 6. Trace Detail by ID
export const getTraceDetail = (traceId) =>
  apiRequest(`/api/trace/${encodeURIComponent(traceId)}`, {
    method: "GET",
  });

// 7. System Health Check
export const checkHealth = () =>
  apiRequest("/health", {
    method: "GET",
  });

// 8. Database Health Check
export const checkDbHealth = () =>
  apiRequest("/api/db/health", {
    method: "GET",
  });
