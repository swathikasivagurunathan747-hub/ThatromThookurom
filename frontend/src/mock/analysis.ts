// ============================================================
// SATQUERY AI — Mock Analysis & Change Detection Results
// Replace with real AI model response objects.
// ============================================================

import type {
  AnalysisResult,
  ChangeDetectionResult,
  Evidence,
  HistoryEntry,
  Dataset,
} from '../types';

export const MOCK_ANALYSIS_RESULT: AnalysisResult = {
  id: 'result_001',
  queryId: 'query_001',
  title: 'NEW BUILT-UP AREA DETECTED',
  summary:
    'Between 2025-05-10 and 2025-08-14, a significant increase in built-up structures is observed near the eastern coastline. Spectral analysis indicates conversion of bare land and sparse vegetation to impervious surfaces across an approximately 0.42 km² zone.',
  confidence: 92,
  processingTimeMs: 3240,
  generatedAt: '2025-08-14T11:02:44Z',
  mode: 'change_detection',
  keyFinding: 'Built-up Area',
  modelVersion: 'SatQuery-CD-v2.1',
  detectedChanges: [
    {
      id: 'chg_001',
      category: 'urban',
      label: 'Built-up area increase',
      deltaKm2: 0.42,
      deltaPercent: 33.9,
      severity: 'high',
      color: '#B83D28',
    },
    {
      id: 'chg_002',
      category: 'vegetation',
      label: 'Vegetation decrease',
      deltaKm2: -0.18,
      deltaPercent: -14.5,
      severity: 'medium',
      color: '#6A9971',
    },
    {
      id: 'chg_003',
      category: 'bare',
      label: 'Bare land reduction',
      deltaKm2: -0.12,
      deltaPercent: -9.7,
      severity: 'low',
      color: '#8A7062',
    },
  ],
  evidence: [
    {
      id: 'ev_001',
      label: 'New construction site',
      description: 'New construction detected — zoomed view',
      coordinates: { lat: 13.0841, lng: 80.2719 },
      thumbnailUrl:
        'https://images.pexels.com/photos/37822408/pexels-photo-37822408.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=160&w=240',
      highlightedUrl:
        'https://images.pexels.com/photos/37822408/pexels-photo-37822408.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=160&w=240',
      category: 'urban',
      confidence: 94,
    },
  ],
};

export const MOCK_CHANGE_DETECTION: ChangeDetectionResult = {
  id: 'cd_001',
  beforeSceneId: 'scene_coastal_002',
  afterSceneId: 'scene_coastal_001',
  beforeDate: '2025-05-10',
  afterDate: '2025-08-14',
  aoiId: 'aoi_coastal_001',
  totalAreaChangedKm2: 0.42,
  changeCategories: MOCK_ANALYSIS_RESULT.detectedChanges!,
  changeMapUrl: undefined, // will be set by backend
  confidenceScore: 92,
  generatedAt: '2025-08-14T11:02:44Z',
};

export const MOCK_EVIDENCE: Evidence[] = MOCK_ANALYSIS_RESULT.evidence!;

export const MOCK_HISTORY: HistoryEntry[] = [
  {
    id: 'hist_001',
    type: 'change_detection',
    label: 'Change detection — COASTAL_CITY_001',
    summary: 'Built-up area +0.42 km² detected',
    timestamp: '2025-08-14T11:02:44Z',
    sceneId: 'scene_coastal_001',
    resultId: 'result_001',
  },
  {
    id: 'hist_002',
    type: 'analysis',
    label: 'Single-image analysis — COASTAL_CITY_001',
    summary: 'Urban classification complete',
    timestamp: '2025-08-14T10:44:12Z',
    sceneId: 'scene_coastal_001',
  },
  {
    id: 'hist_003',
    type: 'upload',
    label: 'Upload — coastal_aug14.tif',
    summary: '245 MB GeoTIFF ingested',
    timestamp: '2025-08-14T10:31:08Z',
    sceneId: 'scene_coastal_001',
  },
  {
    id: 'hist_004',
    type: 'analysis',
    label: 'NDVI analysis — URBAN_DELTA_003',
    summary: 'Vegetation stress index generated',
    timestamp: '2025-08-12T08:17:55Z',
    sceneId: 'scene_urban_003',
  },
  {
    id: 'hist_005',
    type: 'change_detection',
    label: 'Change detection — URBAN_DELTA_003',
    summary: 'Flooding extent mapped',
    timestamp: '2025-07-23T14:29:30Z',
    sceneId: 'scene_urban_003',
  },
];

export const MOCK_DATASETS: Dataset[] = [
  {
    id: 'ds_001',
    name: 'Chennai Coastal Survey',
    sceneCount: 12,
    dateRange: { from: '2025-01-01', to: '2025-08-14' },
    sensors: ['Sentinel-2A', 'Sentinel-2B'],
    region: 'Tamil Nadu, India',
    status: 'available',
    thumbnailUrl:
      'https://images.pexels.com/photos/38127420/pexels-photo-38127420.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=80&w=120',
  },
  {
    id: 'ds_002',
    name: 'Kolkata Delta Monitoring',
    sceneCount: 8,
    dateRange: { from: '2025-03-01', to: '2025-07-31' },
    sensors: ['Landsat-9'],
    region: 'West Bengal, India',
    status: 'available',
    thumbnailUrl:
      'https://images.pexels.com/photos/11208696/pexels-photo-11208696.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=80&w=120',
  },
  {
    id: 'ds_003',
    name: 'Eastern Region Archive',
    sceneCount: 34,
    dateRange: { from: '2024-01-01', to: '2024-12-31' },
    sensors: ['Sentinel-2A', 'Landsat-8'],
    region: 'Eastern India',
    status: 'archived',
    thumbnailUrl:
      'https://images.pexels.com/photos/19049358/pexels-photo-19049358.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=80&w=120',
  },
];
