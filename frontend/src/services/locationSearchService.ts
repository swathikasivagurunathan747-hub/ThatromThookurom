// ============================================================
// SATQUERY AI — Location Search & Geocoding Service
// Uses open, keyless Nominatim (OpenStreetMap) geocoding.
// Strictly requires NO Google Maps API or paid API keys.
// ============================================================

export interface LocationSearchResult {
  id: string;
  name: string;
  displayName: string;
  latitude: number;
  longitude: number;
  type?: string;
  boundingBox?: [number, number, number, number]; // [south, north, west, east]
}

export interface SearchLocationsResponse {
  success: boolean;
  data?: LocationSearchResult[];
  error?: string;
}

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/search';

/**
 * Searches for geographic locations (cities, towns, landmarks, water bodies, roads)
 * using the keyless Nominatim open geocoding endpoint.
 *
 * @param query Search string entered by the user
 * @param signal Optional AbortSignal to cancel stale in-flight requests
 */
export async function searchLocations(
  query: string,
  signal?: AbortSignal
): Promise<SearchLocationsResponse> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) {
    return { success: true, data: [] };
  }

  const params = new URLSearchParams({
    format: 'json',
    q: trimmed,
    limit: '5',
    addressdetails: '1',
  });

  try {
    const response = await fetch(`${NOMINATIM_BASE_URL}?${params.toString()}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal,
    });

    if (!response.ok) {
      return {
        success: false,
        error: 'Location search unavailable. Please try again.',
      };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawList: any[] = await response.json();

    if (!Array.isArray(rawList)) {
      return {
        success: false,
        error: 'Location search unavailable. Please try again.',
      };
    }

    if (rawList.length === 0) {
      return {
        success: true,
        data: [],
      };
    }

    const results: LocationSearchResult[] = rawList.map((item) => {
      const lat = parseFloat(item.lat);
      const lng = parseFloat(item.lon);

      let boundingBox: [number, number, number, number] | undefined = undefined;
      if (Array.isArray(item.boundingbox) && item.boundingbox.length === 4) {
        boundingBox = [
          parseFloat(item.boundingbox[0]), // south
          parseFloat(item.boundingbox[1]), // north
          parseFloat(item.boundingbox[2]), // west
          parseFloat(item.boundingbox[3]), // east
        ];
      }

      // Extract short name vs full display address
      const shortName =
        item.name ||
        item.display_name?.split(',')[0]?.trim() ||
        trimmed;

      return {
        id: String(item.place_id || `${lat}_${lng}`),
        name: shortName,
        displayName: item.display_name || shortName,
        latitude: lat,
        longitude: lng,
        type: item.type || item.class,
        boundingBox,
      };
    });

    return {
      success: true,
      data: results,
    };
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return { success: true, data: [] };
    }
    return {
      success: false,
      error: 'Location search unavailable. Please try again.',
    };
  }
}
