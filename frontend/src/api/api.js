export const LOCAL_API_URL = "http://localhost:8000";
export const REMOTE_API_URL = "https://sat-backend-bbaq.onrender.com";

// Prioritize local FastAPI backend for reliable hackathon demo
const envUrl = import.meta.env.VITE_API_URL;
export const API_BASE_URL = (envUrl && !envUrl.includes("onrender.com")) ? envUrl : LOCAL_API_URL;

export async function apiRequest(endpoint, options = {}) {
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  const defaultHeaders = isFormData
    ? {}
    : { "Content-Type": "application/json" };

  const primaryUrl = API_BASE_URL;
  const secondaryUrl =
    primaryUrl === LOCAL_API_URL ? REMOTE_API_URL : LOCAL_API_URL;

  const headers = {
    ...defaultHeaders,
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(`${primaryUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      // If primary returned a 5xx error (e.g. broken remote Supabase), attempt fallback to secondary URL
      if (response.status >= 500 && secondaryUrl) {
        console.warn(`Primary backend returned ${response.status}. Attempting secondary: ${secondaryUrl}`);
        try {
          const fallbackRes = await fetch(`${secondaryUrl}${endpoint}`, {
            ...options,
            headers,
          });
          if (fallbackRes.ok) {
            const ct = fallbackRes.headers.get("content-type");
            return ct && ct.includes("application/json") ? fallbackRes.json() : fallbackRes.text();
          }
        } catch {}
      }
      throw new Error(
        `API Error ${response.status}: ${errorText || response.statusText}`
      );
    }

    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      return response.json();
    }

    return response.text();
  } catch (primaryErr) {
    if (secondaryUrl) {
      try {
        console.warn(`Primary backend failed (${primaryErr.message}). Attempting fallback: ${secondaryUrl}`);
        const fallbackRes = await fetch(`${secondaryUrl}${endpoint}`, {
          ...options,
          headers,
        });
        if (!fallbackRes.ok) {
          const errTxt = await fallbackRes.text();
          throw new Error(`API Error ${fallbackRes.status}: ${errTxt || fallbackRes.statusText}`);
        }
        const ct = fallbackRes.headers.get("content-type");
        if (ct && ct.includes("application/json")) {
          return fallbackRes.json();
        }
        return fallbackRes.text();
      } catch {
        throw primaryErr;
      }
    }
    throw primaryErr;
  }
}
