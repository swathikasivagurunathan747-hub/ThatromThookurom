// ============================================================
// SATQUERY AI — Mock AOI Data
// Replace with real geometry from the AOI selection service.
// ============================================================

import type { AOI } from '../types';

export const MOCK_AOI: AOI = {
  id: 'aoi_coastal_001',
  label: 'Eastern Coastal Zone',
  areaSqKm: 1.24,
  coordinates: {
    lat: 13.0841,
    lng: 80.2719,
  },
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [80.265, 13.078],
        [80.278, 13.078],
        [80.278, 13.091],
        [80.265, 13.091],
        [80.265, 13.078],
      ],
    ],
  },
};
