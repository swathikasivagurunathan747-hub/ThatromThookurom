// ============================================================
// SATQUERY AI — Core Type Definitions
// These interfaces define the data contracts between the
// frontend and the backend/AI pipeline.
// Replace mock implementations in services/mock/ with real
// API calls when the backend is ready.
// ============================================================

export type LayerType = 'rgb' | 'nir' | 'ndvi' | 'change';

export type AnalysisMode = 'single' | 'change_detection' | 'classification';

export type SystemStatus = 'online' | 'offline' | 'degraded' | 'processing';

// ----------------------------------------------------------
// Scene
// ----------------------------------------------------------
export interface Scene {
  id: string;
  name: string;
  sensor: string;
  platform: string;
  acquisitionDate: string; // ISO 8601
  acquisitionTime: string; // HH:MM UTC
  resolution: number; // meters
  cloudCover: number; // percent
  coordinates: {
    lat: number;
    lng: number;
  };
  bbox: [number, number, number, number]; // [minLat, minLng, maxLat, maxLng]
  thumbnailUrl?: string;
  imageUrl?: string;
  fileFormat?: string;
  fileSizeBytes?: number;
}

// ----------------------------------------------------------
// AOI — Area of Interest
// ----------------------------------------------------------
export interface AOI {
  id: string;
  label: string;
  areaSqKm: number;
  coordinates: {
    lat: number;
    lng: number;
  };
  // GeoJSON polygon geometry for rendering
  geometry: {
    type: 'Polygon';
    coordinates: [number, number][][];
  };
}

// ----------------------------------------------------------
// Imagery Layers
// ----------------------------------------------------------
export interface ImageryLayer {
  id: LayerType;
  label: string;
  shortLabel: string;
  description: string;
  thumbnailUrl?: string;
  active: boolean;
  available: boolean;
}

// ----------------------------------------------------------
// Upload
// ----------------------------------------------------------
export interface UploadedFile {
  id: string;
  filename: string;
  format: string;
  sizeBytes: number;
  uploadedAt: string;
  status: 'pending' | 'processing' | 'ready' | 'error';
  sceneId?: string;
}

// ----------------------------------------------------------
// Query
// ----------------------------------------------------------
export interface AnalysisQuery {
  id: string;
  text: string;
  mode: AnalysisMode;
  sceneId?: string;
  beforeSceneId?: string;
  afterSceneId?: string;
  aoiId?: string;
  layer: LayerType;
  submittedAt?: string;
}

// ----------------------------------------------------------
// Analysis Result
// ----------------------------------------------------------
export interface AnalysisResult {
  id: string;
  queryId: string;
  title: string;
  summary: string;
  confidence: number; // 0–100
  processingTimeMs: number;
  generatedAt: string;
  mode: AnalysisMode;
  keyFinding: string;
  modelVersion?: string;
  detectedChanges?: DetectedChange[];
  evidence?: Evidence[];
}

// ----------------------------------------------------------
// Single Image Analysis
// ----------------------------------------------------------
export interface SingleImageAnalysisResult {
  id: string;
  query: string;
  answer: string;
  visualEvidenceUrl?: string;
  confidence?: number;
  detectedCategories?: string[];
  processingTimeMs?: number;
  timestamp: string;
  isDemoMode?: boolean;
}

export interface SingleImageAnalysisResponse {
  success: boolean;
  data?: SingleImageAnalysisResult;
  error?: string;
}

// ----------------------------------------------------------
// Map-Based Analysis
// ----------------------------------------------------------
export interface MapAreaSelection {
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  center: {
    lat: number;
    lng: number;
  };
  areaKm2: number;
}

export interface MapAnalysisResult {
  id: string;
  query: string;
  answer: string;
  area: MapAreaSelection;
  visualEvidenceUrl?: string;
  confidence?: number;
  detectedCategories?: string[];
  markers?: Array<{ lat: number; lng: number; label: string }>;
  processingTimeMs?: number;
  timestamp: string;
  isDemoMode?: boolean;
  // Backend execution details
  workflow?: string;
  model?: string;
  dataset?: string;
  beforeImageUrl?: string;
  afterImageUrl?: string;
  detectedChanges?: Array<{
    id?: string;
    label: string;
    category?: string;
    description?: string;
  }>;
  metrics?: {
    changeAreaKm2?: number;
    confidence?: number;
    mainChange?: string;
  };
}

export interface MapAnalysisResponse {
  success: boolean;
  data?: MapAnalysisResult;
  error?: string;
}

// ----------------------------------------------------------
// Bi-Temporal / Change Analysis (Step 3)
// ----------------------------------------------------------
export interface BiTemporalAnalysisResult {
  id: string;
  query: string;
  answer: string;
  changeVisualizationUrl?: string;
  beforeImageUrl?: string;
  afterImageUrl?: string;
  detectedChanges?: Array<{
    id?: string;
    label: string;
    category?: string;
    description?: string;
  }>;
  metrics?: {
    changeAreaKm2?: number;
    confidence?: number;
    mainChange?: string;
  };
  processingTimeMs?: number;
  timestamp: string;
  isDemoMode?: boolean;
}

export interface BiTemporalAnalysisResponse {
  success: boolean;
  data?: BiTemporalAnalysisResult;
  error?: string;
}

// ----------------------------------------------------------
// Agentic AI Dashboard Analysis
// ----------------------------------------------------------
export interface AgenticAnalysisResult {
  id: string;
  query: string;
  workflow: 'single' | 'bitemporal' | 'map' | string;
  model?: string;
  answer: string;
  visualEvidenceUrl?: string;
  changeVisualizationUrl?: string;
  beforeImageUrl?: string;
  afterImageUrl?: string;
  imageUrls?: string[];
  detectedChanges?: Array<{
    id?: string;
    label: string;
    category?: string;
    description?: string;
  }>;
  detectedCategories?: string[];
  metrics?: {
    changeAreaKm2?: number;
    confidence?: number;
    mainChange?: string;
  };
  confidence?: number;
  processingTimeMs?: number;
  timestamp: string;
  isDemoMode?: boolean;
}

export interface AgenticAnalysisResponse {
  success: boolean;
  data?: AgenticAnalysisResult;
  error?: string;
}

// ----------------------------------------------------------
// Change Detection
// ----------------------------------------------------------
export interface DetectedChange {
  id: string;
  category: string;
  label: string;
  deltaKm2: number; // positive = increase, negative = decrease
  deltaPercent?: number;
  severity: 'low' | 'medium' | 'high';
  color?: string;
}

export interface ChangeDetectionResult {
  id: string;
  beforeSceneId: string;
  afterSceneId: string;
  beforeDate: string;
  afterDate: string;
  aoiId?: string;
  totalAreaChangedKm2: number;
  changeCategories: DetectedChange[];
  changeMapUrl?: string;
  confidenceScore: number;
  generatedAt: string;
}

// ----------------------------------------------------------
// Visual Evidence
// ----------------------------------------------------------
export interface Evidence {
  id: string;
  label: string;
  description: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  thumbnailUrl?: string;
  highlightedUrl?: string;
  bboxPx?: [number, number, number, number]; // px within image
  category?: string;
  confidence?: number;
}

// ----------------------------------------------------------
// Comparison
// ----------------------------------------------------------
export interface ComparisonResult {
  id: string;
  beforeScene: Scene;
  afterScene: Scene;
  mode: LayerType;
  sliderPosition: number; // 0–100
  changeMapUrl?: string;
  legend?: LegendItem[];
}

export interface LegendItem {
  label: string;
  color: string;
  description?: string;
}

// ----------------------------------------------------------
// System
// ----------------------------------------------------------
export interface SystemInfo {
  status: SystemStatus;
  utcTime: string;
  activeScene?: string;
  processingQueue: number;
  version: string;
}

// ----------------------------------------------------------
// Dataset (for Datasets panel)
// ----------------------------------------------------------
export interface Dataset {
  id: string;
  name: string;
  sceneCount: number;
  dateRange: { from: string; to: string };
  sensors: string[];
  region: string;
  status: 'available' | 'processing' | 'archived';
  thumbnailUrl?: string;
}

// ----------------------------------------------------------
// History entry
// ----------------------------------------------------------
export interface HistoryEntry {
  id: string;
  type: 'analysis' | 'change_detection' | 'upload' | 'query';
  label: string;
  summary?: string;
  timestamp: string;
  sceneId?: string;
  resultId?: string;
}

export * from './workspace';
