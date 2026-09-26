// ============================================================
// SATQUERY AI — Workspace & Chat Type Definitions
// Defines data models for Projects, Chats, Multi-Workflow
// Analysis Interactions, Collaborator Management, and Public Sharing.
// ============================================================

export type ProjectRole = 'owner' | 'collaborator' | 'viewer';

export interface ProjectCollaborator {
  id: string;
  email: string;
  name?: string;
  role: 'collaborator' | 'viewer';
  avatarUrl?: string;
  addedAt: string;
}

export interface ProjectShareConfig {
  isPublic: boolean;
  publicToken?: string;
  shareUrl?: string;
  allowPublicView: boolean;
  updatedAt?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  ownerId?: string;
  ownerEmail?: string;
  collaborators?: ProjectCollaborator[];
  shareConfig?: ProjectShareConfig;
}

export type AnalysisWorkflowType = 'single' | 'map' | 'bitemporal';

export interface ChatInteraction {
  id: string;
  chatId: string;
  type: AnalysisWorkflowType;
  query: string;
  timestamp: string;
  // Creator attribution
  createdById?: string;
  createdByName?: string;
  createdByEmail?: string;
  // Inputs
  imageUrls?: string[];
  area?: {
    bounds?: { north: number; south: number; east: number; west: number };
    center: { lat: number; lng: number };
    areaKm2: number;
  };
  // Outputs / Evidence
  answer: string;
  visualEvidenceUrl?: string;
  changeVisualizationUrl?: string;
  beforeImageUrl?: string;
  afterImageUrl?: string;
  confidence?: number;
  detectedCategories?: string[];
  detectedChanges?: Array<{ label: string; category?: string; description?: string }>;
  metrics?: {
    changeAreaKm2?: number;
    confidence?: number;
    mainChange?: string;
  };
  isDemoMode?: boolean;
}

export interface Chat {
  id: string;
  projectId?: string; // Belongs to at most one project
  title: string;
  createdAt: string;
  updatedAt: string;
  interactions: ChatInteraction[];
}

export interface PublicShare {
  id: string;
  chatId: string;
  publicToken: string;
  shareUrl?: string;
  createdAt: string;
  expiresAt?: string;
  isPublic: boolean;
  isBackendGenerated: boolean;
  snapshot: {
    title: string;
    projectName?: string;
    interactions: ChatInteraction[];
  };
}

export interface PublicProjectShare {
  id: string;
  projectId: string;
  publicToken: string;
  shareUrl?: string;
  createdAt: string;
  expiresAt?: string;
  isPublic: boolean;
  isBackendGenerated: boolean;
  snapshot: {
    project: Project;
    chats: Chat[];
  };
}
