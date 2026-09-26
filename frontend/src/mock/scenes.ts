// ============================================================
// SATQUERY AI — Mock Scene Data
// Replace with real API calls to the scene catalog service.
// ============================================================

import type { Scene } from '../types';

export const MOCK_SCENES: Scene[] = [
  {
    id: 'scene_coastal_001',
    name: 'COASTAL_CITY_001',
    sensor: 'Sentinel-2A',
    platform: 'ESA Sentinel-2',
    acquisitionDate: '2025-08-14',
    acquisitionTime: '10:24',
    resolution: 10,
    cloudCover: 4.2,
    coordinates: { lat: 13.0827, lng: 80.2707 },
    bbox: [13.07, 80.25, 13.10, 80.29],
    thumbnailUrl: 'https://images.pexels.com/photos/38127420/pexels-photo-38127420.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=200&w=280',
    imageUrl: 'https://images.pexels.com/photos/38127420/pexels-photo-38127420.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
    fileFormat: 'GeoTIFF',
    fileSizeBytes: 245_000_000,
  },
  {
    id: 'scene_coastal_002',
    name: 'COASTAL_CITY_002',
    sensor: 'Sentinel-2A',
    platform: 'ESA Sentinel-2',
    acquisitionDate: '2025-05-10',
    acquisitionTime: '10:18',
    resolution: 10,
    cloudCover: 1.8,
    coordinates: { lat: 13.0827, lng: 80.2707 },
    bbox: [13.07, 80.25, 13.10, 80.29],
    thumbnailUrl: 'https://images.pexels.com/photos/19049358/pexels-photo-19049358.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=200&w=280',
    imageUrl: 'https://images.pexels.com/photos/19049358/pexels-photo-19049358.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
    fileFormat: 'GeoTIFF',
    fileSizeBytes: 238_000_000,
  },
  {
    id: 'scene_urban_003',
    name: 'URBAN_DELTA_003',
    sensor: 'Landsat-9',
    platform: 'USGS Landsat-9',
    acquisitionDate: '2025-07-22',
    acquisitionTime: '05:44',
    resolution: 30,
    cloudCover: 12.1,
    coordinates: { lat: 22.5726, lng: 88.3639 },
    bbox: [22.55, 88.34, 22.60, 88.39],
    thumbnailUrl: 'https://images.pexels.com/photos/11208696/pexels-photo-11208696.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=200&w=280',
    imageUrl: 'https://images.pexels.com/photos/11208696/pexels-photo-11208696.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
    fileFormat: 'GeoTIFF',
    fileSizeBytes: 180_000_000,
  },
];

export const MOCK_ACTIVE_SCENE = MOCK_SCENES[0];
export const MOCK_BEFORE_SCENE = MOCK_SCENES[1];
export const MOCK_AFTER_SCENE = MOCK_SCENES[0];
