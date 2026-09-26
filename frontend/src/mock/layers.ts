// ============================================================
// SATQUERY AI — Mock Imagery Layers
// Replace thumbnailUrl with real band-composite tile URLs.
// ============================================================

import type { ImageryLayer } from '../types';

export const MOCK_LAYERS: ImageryLayer[] = [
  {
    id: 'rgb',
    label: 'RGB / True Color',
    shortLabel: 'RGB',
    description: 'Natural color composite (B4-B3-B2)',
    thumbnailUrl: 'https://images.pexels.com/photos/38127420/pexels-photo-38127420.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=60&w=90',
    active: true,
    available: true,
  },
  {
    id: 'nir',
    label: 'False Color / NIR',
    shortLabel: 'NIR',
    description: 'Near-infrared composite (B8-B4-B3)',
    thumbnailUrl: 'https://images.pexels.com/photos/972942/pexels-photo-972942.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=60&w=90',
    active: false,
    available: true,
  },
  {
    id: 'ndvi',
    label: 'NDVI',
    shortLabel: 'NDVI',
    description: 'Normalized Difference Vegetation Index',
    thumbnailUrl: 'https://images.pexels.com/photos/7312525/pexels-photo-7312525.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=60&w=90',
    active: false,
    available: true,
  },
  {
    id: 'change',
    label: 'Change Map',
    shortLabel: 'CHG',
    description: 'Binary change detection output',
    thumbnailUrl: 'https://images.pexels.com/photos/12530972/pexels-photo-12530972.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=60&w=90',
    active: false,
    available: true,
  },
];
