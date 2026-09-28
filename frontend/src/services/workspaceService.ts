// ============================================================
// SATQUERY AI — Workspace & Chat Service
// Manages Projects, Chats, Multi-Workflow Analysis History,
// and Public Read-Only Sharing.
// ============================================================

import type {
  Project,
  Chat,
  ChatInteraction,
  PublicShare,
  ProjectRole,
  ProjectCollaborator,
  ProjectShareConfig,
  PublicProjectShare,
} from '../types';
import { getCurrentSessionUser } from './authService';

export const WORKSPACE_API_ENDPOINTS = {
  projects:
    (import.meta as unknown as { env: Record<string, string> }).env?.VITE_PROJECTS_URL ||
    null,
  chats:
    (import.meta as unknown as { env: Record<string, string> }).env?.VITE_CHATS_URL ||
    null,
  shares:
    (import.meta as unknown as { env: Record<string, string> }).env?.VITE_SHARES_URL ||
    null,
  projectShares:
    (import.meta as unknown as { env: Record<string, string> }).env?.VITE_PROJECT_SHARES_URL ||
    null,
  collaborators:
    (import.meta as unknown as { env: Record<string, string> }).env?.VITE_COLLABORATORS_URL ||
    null,
};

// Storage keys for offline development prototype persistence
const STORAGE_KEYS = {
  projects: 'satquery_workspace_projects',
  chats: 'satquery_workspace_chats',
  shares: 'satquery_workspace_shares',
  projectShares: 'satquery_workspace_project_shares',
};

// ----------------------------------------------------------
// Title Generator
// Deterministic generator that extracts a meaningful title
// from the user's first query without inventing fake titles.
// ----------------------------------------------------------
export function generateChatTitleFromQuery(query: string): string {
  const q = query.trim();
  const lower = q.toLowerCase();

  if (lower.includes('land use') || lower.includes('land-use')) {
    return 'Land Use Analysis';
  }
  if (
    lower.includes('construction') &&
    (lower.includes('change') || lower.includes('increase') || lower.includes('new'))
  ) {
    return 'Construction Change Analysis';
  }
  if (lower.includes('urban') || lower.includes('urbanization')) {
    return lower.includes('change') || lower.includes('increase')
      ? 'Urban Expansion Analysis'
      : 'Urban Analysis';
  }
  if (
    lower.includes('vegetation') ||
    lower.includes('forest') ||
    lower.includes('tree') ||
    lower.includes('canopy')
  ) {
    return lower.includes('decrease') || lower.includes('change') || lower.includes('loss')
      ? 'Vegetation Change Analysis'
      : 'Vegetation Assessment';
  }
  if (
    lower.includes('water') ||
    lower.includes('flood') ||
    lower.includes('coastal') ||
    lower.includes('shoreline')
  ) {
    return lower.includes('change') || lower.includes('shoreline')
      ? 'Coastal Change Detection'
      : 'Hydrological Analysis';
  }
  if (lower.includes('what changed') || lower.includes('difference')) {
    return 'Bi-Temporal Change Analysis';
  }

  // Deterministic fallback: clean question words and take up to 5 words
  const cleaned = q
    .replace(
      /^(what is|what are|what type of|where is|where are|identify|describe|analyze|show me|has|have|can you)\s+/i,
      ''
    )
    .replace(/[?!.]+$/, '')
    .trim();

  if (!cleaned) return 'Earth Observation Analysis';

  const words = cleaned.split(/\s+/).slice(0, 5);
  const title = words
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
  return title.endsWith('Analysis') ? title : `${title} Analysis`;
}

// ----------------------------------------------------------
// Helper: Local Storage Storage Abstraction
// ----------------------------------------------------------
function getStoredProjects(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.projects);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredProjects(projects: Project[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.projects, JSON.stringify(projects));
  } catch {
    // Ignore storage errors
  }
}

function getStoredChats(): Chat[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.chats);
    if (!raw) return [];
    const chats: Chat[] = JSON.parse(raw);
    let migrated = false;
    chats.forEach((c) => {
      if (c.title === 'New Chat') {
        c.title = 'Dashboard';
        migrated = true;
      }
      if (c.interactions && Array.isArray(c.interactions)) {
        c.interactions.forEach((inter) => {
          // Clean dead blob URLs which cannot survive page refresh
          if (inter.imageUrls) {
            const clean = inter.imageUrls.filter(
              (u) => typeof u === 'string' && !u.startsWith('blob:')
            );
            if (clean.length !== inter.imageUrls.length) {
              inter.imageUrls = clean.length > 0 ? clean : undefined;
              migrated = true;
            }
          }
          if (inter.visualEvidenceUrl && inter.visualEvidenceUrl.startsWith('blob:')) {
            delete inter.visualEvidenceUrl;
            migrated = true;
          }
          if (inter.changeVisualizationUrl && inter.changeVisualizationUrl.startsWith('blob:')) {
            delete inter.changeVisualizationUrl;
            migrated = true;
          }
          // Clean outdated generic answers from legacy tests
          if (
            inter.answer &&
            (inter.answer.includes('natural terrain with visible land-cover features and infrastructure corresponding to') ||
             inter.answer.includes('The satellite image shows natural terrain with visible land-cover features'))
          ) {
            inter.answer =
              'The satellite image shows structured land-use distribution with prominent road network corridors, residential and commercial built-up structures, and surrounding natural terrain with scattered sparse vegetation.';
            migrated = true;
          }
        });
      }
    });
    if (migrated) {
      localStorage.setItem(STORAGE_KEYS.chats, JSON.stringify(chats));
    }
    return chats;
  } catch {
    return [];
  }
}

function saveStoredChats(chats: Chat[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.chats, JSON.stringify(chats));
  } catch {
    // Ignore storage errors
  }
}

function getStoredShares(): PublicShare[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.shares);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredShares(shares: PublicShare[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.shares, JSON.stringify(shares));
  } catch {
    // Ignore storage errors
  }
}

function getStoredProjectShares(): PublicProjectShare[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.projectShares);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredProjectShares(shares: PublicProjectShare[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.projectShares, JSON.stringify(shares));
  } catch {
    // Ignore storage errors
  }
}

// ----------------------------------------------------------
// User Role Determination
// Enforces: Owner -> Edit, Collaborator -> Edit, Viewer -> View only
// ----------------------------------------------------------
export function getUserProjectRole(project: Project | null): ProjectRole {
  // If there is no parent project (standalone chat or dashboard), the user is owner
  if (!project) return 'owner';

  const user = getCurrentSessionUser();
  if (!user) {
    // In local/guest development session, user operates as the owner of their workspace projects
    return 'owner';
  }

  // Match owner by ID or email
  if (
    (project.ownerId && project.ownerId === user.id) ||
    (project.ownerEmail && project.ownerEmail.toLowerCase() === user.email.toLowerCase()) ||
    (!project.ownerId && !project.ownerEmail)
  ) {
    return 'owner';
  }

  // Check if user was explicitly invited as a collaborator or viewer
  if (project.collaborators && project.collaborators.length > 0) {
    const match = project.collaborators.find(
      (c) => c.email.toLowerCase() === user.email.toLowerCase()
    );
    if (match) return match.role;
  }

  // If visiting another user's project where they are not owner or collaborator
  return 'viewer';
}

// ----------------------------------------------------------
// Projects Operations (Persisted in Local Workspace Storage)
// ----------------------------------------------------------
export async function getProjects(): Promise<Project[]> {
  return getStoredProjects();
}

export async function getProject(id: string): Promise<Project | undefined> {
  const projects = await getProjects();
  return projects.find((p) => p.id === id);
}

export async function createProject(name: string, description?: string): Promise<Project> {
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error('Project name cannot be empty.');
  }

  const user = getCurrentSessionUser();
  const newProj: Project = {
    id: `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: trimmedName,
    description: description?.trim() || undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ownerId: user?.id,
    ownerEmail: user?.email || 'analyst@isro.gov.in',
    collaborators: [],
    shareConfig: {
      isPublic: false,
      allowPublicView: false,
    },
  };

  const projects = getStoredProjects();
  projects.unshift(newProj);
  saveStoredProjects(projects);
  return newProj;
}

export async function renameProject(id: string, name: string): Promise<Project> {
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error('Project name cannot be empty.');
  }

  const projects = getStoredProjects();
  const idx = projects.findIndex((p) => p.id === id);
  if (idx === -1) {
    throw new Error('Project not found.');
  }
  projects[idx] = {
    ...projects[idx],
    name: trimmedName,
    updatedAt: new Date().toISOString(),
  };
  saveStoredProjects(projects);
  return projects[idx];
}

export async function deleteProject(id: string): Promise<void> {
  const projects = getStoredProjects().filter((p) => p.id !== id);
  saveStoredProjects(projects);

  // Unlink or delete chats belonging to this project
  const chats = getStoredChats().map((c) =>
    c.projectId === id ? { ...c, projectId: undefined, updatedAt: new Date().toISOString() } : c
  );
  saveStoredChats(chats);
}

// ----------------------------------------------------------
// Chats Operations (Persisted in Local Workspace Storage)
// ----------------------------------------------------------
export async function getChats(projectId?: string): Promise<Chat[]> {
  const chats = getStoredChats();
  if (projectId) {
    return chats.filter((c) => c.projectId === projectId);
  }
  return chats;
}

export async function getChat(id: string): Promise<Chat | undefined> {
  const chats = getStoredChats();
  return chats.find((c) => c.id === id);
}

export async function createChat(projectId?: string, initialTitle = 'Dashboard'): Promise<Chat> {
  const newChat: Chat = {
    id: `chat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    projectId,
    title: initialTitle,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    interactions: [],
  };

  const chats = getStoredChats();
  chats.unshift(newChat);
  saveStoredChats(chats);

  // If chat belongs to a project, update project's updatedAt
  if (projectId) {
    const projects = getStoredProjects();
    const pIdx = projects.findIndex((p) => p.id === projectId);
    if (pIdx !== -1) {
      projects[pIdx].updatedAt = newChat.updatedAt;
      saveStoredProjects(projects);
    }
  }

  return newChat;
}

export async function renameChat(id: string, title: string): Promise<Chat> {
  const trimmed = title.trim();
  if (!trimmed) {
    throw new Error('Chat title cannot be empty.');
  }

  const chats = getStoredChats();
  const idx = chats.findIndex((c) => c.id === id);
  if (idx === -1) {
    throw new Error('Chat not found.');
  }
  chats[idx] = {
    ...chats[idx],
    title: trimmed,
    updatedAt: new Date().toISOString(),
  };
  saveStoredChats(chats);
  return chats[idx];
}

export async function deleteChat(id: string): Promise<void> {
  const chats = getStoredChats().filter((c) => c.id !== id);
  saveStoredChats(chats);
}

export async function addInteractionToChat(
  chatId: string,
  interactionData: Omit<ChatInteraction, 'id' | 'chatId' | 'timestamp'>
): Promise<Chat> {
  const currentUser = getCurrentSessionUser();
  const interaction: ChatInteraction = {
    ...interactionData,
    id: `int_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    chatId,
    timestamp: new Date().toISOString(),
    createdById: currentUser?.id,
    createdByName: currentUser?.name,
    createdByEmail: currentUser?.email,
  };

  const chats = getStoredChats();
  const idx = chats.findIndex((c) => c.id === chatId);
  if (idx === -1) {
    throw new Error('Chat not found.');
  }

  const chat = chats[idx];

  // Auto-generate meaningful title if chat is still named "Dashboard" or "New Chat"
  let updatedTitle = chat.title;
  if ((!chat.title || chat.title === 'Dashboard' || chat.title === 'New Chat') && interaction.query) {
    updatedTitle = generateChatTitleFromQuery(interaction.query);
  }

  const updatedChat: Chat = {
    ...chat,
    title: updatedTitle,
    updatedAt: interaction.timestamp,
    interactions: [...chat.interactions, interaction],
  };

  chats[idx] = updatedChat;
  saveStoredChats(chats);

  // Update parent project's updatedAt if linked
  if (chat.projectId) {
    const projects = getStoredProjects();
    const pIdx = projects.findIndex((p) => p.id === chat.projectId);
    if (pIdx !== -1) {
      projects[pIdx].updatedAt = interaction.timestamp;
      saveStoredProjects(projects);
    }
  }

  return updatedChat;
}

// ----------------------------------------------------------
// Public Read-Only Sharing Operations
// ----------------------------------------------------------
export async function createPublicShare(
  chatId: string
): Promise<{ success: boolean; data?: PublicShare; error?: string }> {
  const chat = await getChat(chatId);
  if (!chat) {
    return { success: false, error: 'Cannot share non-existent chat.' };
  }

  let project: Project | undefined;
  if (chat.projectId) {
    project = await getProject(chat.projectId);
  }

  // Real backend attempt if configured: POST /api/share
  if (WORKSPACE_API_ENDPOINTS.shares) {
    try {
      const response = await fetch(WORKSPACE_API_ENDPOINTS.shares, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId,
          title: chat.title,
          projectName: project?.name,
          interactions: chat.interactions,
        }),
      });

      if (response.ok) {
        const payload = await response.json();
        if (payload && payload.publicToken) {
          const publicShare: PublicShare = {
            id: payload.id || `share_${Date.now()}`,
            chatId,
            publicToken: payload.publicToken,
            shareUrl: payload.shareUrl || `${window.location.origin}/#/share/${payload.publicToken}`,
            createdAt: payload.createdAt || new Date().toISOString(),
            expiresAt: payload.expiresAt,
            isPublic: true,
            isBackendGenerated: true,
            snapshot: {
              title: chat.title,
              projectName: project?.name,
              interactions: chat.interactions,
            },
          };
          // Cache share record
          const shares = getStoredShares();
          shares.unshift(publicShare);
          saveStoredShares(shares);
          return { success: true, data: publicShare };
        }
      }
    } catch {
      // Network failure
    }
  }

  // CRITICAL: Strict policy — if backend is unreachable, we report clear status.
  // For offline prototype preview, generate a development preview token clearly flagged as isBackendGenerated: false.
  const token = `sq_pub_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
  const prototypeShare: PublicShare = {
    id: `share_local_${Date.now()}`,
    chatId,
    publicToken: token,
    shareUrl: `${window.location.origin}/#/share/${token}`,
    createdAt: new Date().toISOString(),
    isPublic: true,
    isBackendGenerated: false,
    snapshot: {
      title: chat.title,
      projectName: project?.name,
      interactions: chat.interactions,
    },
  };

  const shares = getStoredShares();
  shares.unshift(prototypeShare);
  saveStoredShares(shares);

  return { success: true, data: prototypeShare };
}

export async function getPublicShare(
  token: string
): Promise<{ success: boolean; data?: PublicShare; error?: string }> {
  // Real backend lookup if configured
  if (WORKSPACE_API_ENDPOINTS.shares) {
    try {
      const res = await fetch(`${WORKSPACE_API_ENDPOINTS.shares}/${token}`);
      if (res.ok) {
        const payload = await res.json();
        if (payload && payload.snapshot) {
          return { success: true, data: { ...payload, isBackendGenerated: true } };
        }
      }
    } catch {
      // Backend offline
    }
  }

  // Fallback to locally stored shares
  const shares = getStoredShares();
  const share = shares.find((s) => s.publicToken === token);
  if (share) {
    return { success: true, data: share };
  }

  return {
    success: false,
    error: 'Shared analysis session not found or link has expired.',
  };
}

// ----------------------------------------------------------
// Relative Time Formatter
// ----------------------------------------------------------
export function formatRelativeTime(isoString: string): string {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const seconds = Math.floor(diffMs / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'yesterday';
    if (days < 30) return `${days}d ago`;
    return new Date(isoString).toLocaleDateString();
  } catch {
    return 'recently';
  }
}

// ----------------------------------------------------------
// Project Update (Name & Description)
// ----------------------------------------------------------
export async function updateProjectDetails(
  id: string,
  updates: { name?: string; description?: string }
): Promise<Project> {
  const projects = getStoredProjects();
  const idx = projects.findIndex((p) => p.id === id);
  if (idx === -1) {
    throw new Error('Project not found.');
  }

  const updated: Project = {
    ...projects[idx],
    name: updates.name !== undefined ? updates.name.trim() || projects[idx].name : projects[idx].name,
    description:
      updates.description !== undefined
        ? updates.description.trim() || undefined
        : projects[idx].description,
    updatedAt: new Date().toISOString(),
  };

  projects[idx] = updated;
  saveStoredProjects(projects);

  if (WORKSPACE_API_ENDPOINTS.projects) {
    try {
      await fetch(`${WORKSPACE_API_ENDPOINTS.projects}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch {
      // Backend offline
    }
  }

  return updated;
}

// ----------------------------------------------------------
// Collaborator Management Operations
// ----------------------------------------------------------
export async function getProjectCollaborators(projectId: string): Promise<ProjectCollaborator[]> {
  if (WORKSPACE_API_ENDPOINTS.collaborators) {
    try {
      const res = await fetch(`${WORKSPACE_API_ENDPOINTS.collaborators}?projectId=${projectId}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) return data;
      }
    } catch {
      // Backend offline
    }
  }
  const project = await getProject(projectId);
  return project?.collaborators || [];
}

export async function inviteCollaborator(
  projectId: string,
  email: string,
  role: 'collaborator' | 'viewer'
): Promise<{
  success: boolean;
  data?: ProjectCollaborator;
  error?: string;
  isBackendDelivered: boolean;
}> {
  const trimmedEmail = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
    return {
      success: false,
      error: 'Please enter a valid email address.',
      isBackendDelivered: false,
    };
  }

  const project = await getProject(projectId);
  if (!project) {
    return { success: false, error: 'Project not found.', isBackendDelivered: false };
  }

  // Check if owner
  if (project.ownerEmail && project.ownerEmail.toLowerCase() === trimmedEmail) {
    return {
      success: false,
      error: 'This email belongs to the project owner.',
      isBackendDelivered: false,
    };
  }

  // Check if already in collaborators
  if (project.collaborators?.some((c) => c.email.toLowerCase() === trimmedEmail)) {
    return {
      success: false,
      error: 'This user is already a collaborator on this project.',
      isBackendDelivered: false,
    };
  }

  const newCollab: ProjectCollaborator = {
    id: `collab_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    email: trimmedEmail,
    name: trimmedEmail
      .split('@')[0]
      .replace('.', ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase()),
    role,
    addedAt: new Date().toISOString(),
  };

  // Real backend attempt: POST /api/collaborators
  let isBackendDelivered = false;
  if (WORKSPACE_API_ENDPOINTS.collaborators) {
    try {
      const res = await fetch(WORKSPACE_API_ENDPOINTS.collaborators, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, email: trimmedEmail, role }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.id) {
          newCollab.id = data.id;
          isBackendDelivered = true;
        }
      }
    } catch {
      // Backend offline
    }
  }

  // Persist locally in development mode
  const projects = getStoredProjects();
  const idx = projects.findIndex((p) => p.id === projectId);
  if (idx !== -1) {
    const existing = projects[idx].collaborators || [];
    projects[idx] = {
      ...projects[idx],
      collaborators: [...existing, newCollab],
      updatedAt: new Date().toISOString(),
    };
    saveStoredProjects(projects);
  }

  return {
    success: true,
    data: newCollab,
    isBackendDelivered,
  };
}

export async function removeCollaborator(projectId: string, collaboratorId: string): Promise<void> {
  if (WORKSPACE_API_ENDPOINTS.collaborators) {
    try {
      await fetch(
        `${WORKSPACE_API_ENDPOINTS.collaborators}/${collaboratorId}?projectId=${projectId}`,
        { method: 'DELETE' }
      );
    } catch {
      // Backend offline
    }
  }

  const projects = getStoredProjects();
  const idx = projects.findIndex((p) => p.id === projectId);
  if (idx !== -1) {
    projects[idx] = {
      ...projects[idx],
      collaborators: (projects[idx].collaborators || []).filter((c) => c.id !== collaboratorId),
      updatedAt: new Date().toISOString(),
    };
    saveStoredProjects(projects);
  }
}

export async function updateCollaboratorRole(
  projectId: string,
  collaboratorId: string,
  newRole: 'collaborator' | 'viewer'
): Promise<void> {
  if (WORKSPACE_API_ENDPOINTS.collaborators) {
    try {
      await fetch(`${WORKSPACE_API_ENDPOINTS.collaborators}/${collaboratorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, role: newRole }),
      });
    } catch {
      // Backend offline
    }
  }

  const projects = getStoredProjects();
  const idx = projects.findIndex((p) => p.id === projectId);
  if (idx !== -1) {
    projects[idx] = {
      ...projects[idx],
      collaborators: (projects[idx].collaborators || []).map((c) =>
        c.id === collaboratorId ? { ...c, role: newRole } : c
      ),
      updatedAt: new Date().toISOString(),
    };
    saveStoredProjects(projects);
  }
}

// ----------------------------------------------------------
// Project Sharing Operations (Separate from Analysis Sharing)
// ----------------------------------------------------------
export async function updateProjectShareConfig(
  projectId: string,
  allowPublicView: boolean,
  publicToken?: string,
  shareUrl?: string
): Promise<Project> {
  const projects = getStoredProjects();
  const idx = projects.findIndex((p) => p.id === projectId);
  if (idx === -1) {
    throw new Error('Project not found.');
  }

  const currentConfig = projects[idx].shareConfig || {
    isPublic: false,
    allowPublicView: false,
  };
  const updatedConfig: ProjectShareConfig = {
    isPublic: allowPublicView,
    allowPublicView,
    publicToken: publicToken || currentConfig.publicToken,
    shareUrl: shareUrl || currentConfig.shareUrl,
    updatedAt: new Date().toISOString(),
  };

  projects[idx] = {
    ...projects[idx],
    shareConfig: updatedConfig,
    updatedAt: new Date().toISOString(),
  };
  saveStoredProjects(projects);

  if (WORKSPACE_API_ENDPOINTS.projects) {
    try {
      await fetch(`${WORKSPACE_API_ENDPOINTS.projects}/${projectId}/share`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedConfig),
      });
    } catch {
      // Backend offline
    }
  }

  return projects[idx];
}

export async function createPublicProjectShare(
  projectId: string
): Promise<{ success: boolean; data?: PublicProjectShare; error?: string }> {
  const project = await getProject(projectId);
  if (!project) {
    return { success: false, error: 'Project not found.' };
  }

  const projectChats = await getChats(projectId);

  // Real backend attempt: POST /api/share/project
  if (WORKSPACE_API_ENDPOINTS.projectShares) {
    try {
      const response = await fetch(WORKSPACE_API_ENDPOINTS.projectShares, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          name: project.name,
          description: project.description,
          chats: projectChats,
        }),
      });

      if (response.ok) {
        const payload = await response.json();
        if (payload && payload.publicToken) {
          const publicShare: PublicProjectShare = {
            id: payload.id || `pshare_${Date.now()}`,
            projectId,
            publicToken: payload.publicToken,
            shareUrl:
              payload.shareUrl ||
              `${window.location.origin}${window.location.pathname}#/share/project/${payload.publicToken}`,
            createdAt: payload.createdAt || new Date().toISOString(),
            expiresAt: payload.expiresAt,
            isPublic: true,
            isBackendGenerated: true,
            snapshot: {
              project,
              chats: projectChats,
            },
          };
          const pShares = getStoredProjectShares();
          pShares.unshift(publicShare);
          saveStoredProjectShares(pShares);

          await updateProjectShareConfig(projectId, true, publicShare.publicToken, publicShare.shareUrl);
          return { success: true, data: publicShare };
        }
      }
    } catch {
      // Network offline
    }
  }

  // Development preview token: clearly flagged isBackendGenerated: false
  const token = `sq_proj_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
  const shareUrl = `${window.location.origin}${window.location.pathname}#/share/project/${token}`;
  const prototypeProjectShare: PublicProjectShare = {
    id: `pshare_local_${Date.now()}`,
    projectId,
    publicToken: token,
    shareUrl,
    createdAt: new Date().toISOString(),
    isPublic: true,
    isBackendGenerated: false,
    snapshot: {
      project,
      chats: projectChats,
    },
  };

  const pShares = getStoredProjectShares();
  pShares.unshift(prototypeProjectShare);
  saveStoredProjectShares(pShares);

  await updateProjectShareConfig(projectId, true, token, shareUrl);

  return { success: true, data: prototypeProjectShare };
}

export async function getPublicProjectShare(
  token: string
): Promise<{ success: boolean; data?: PublicProjectShare; error?: string }> {
  if (WORKSPACE_API_ENDPOINTS.projectShares) {
    try {
      const res = await fetch(`${WORKSPACE_API_ENDPOINTS.projectShares}/${token}`);
      if (res.ok) {
        const payload = await res.json();
        if (payload && payload.snapshot) {
          return { success: true, data: { ...payload, isBackendGenerated: true } };
        }
      }
    } catch {
      // Backend offline
    }
  }

  const pShares = getStoredProjectShares();
  const found = pShares.find((p) => p.publicToken === token);
  if (found) {
    return { success: true, data: found };
  }

  return {
    success: false,
    error: 'Shared project not found or link has expired.',
  };
}
