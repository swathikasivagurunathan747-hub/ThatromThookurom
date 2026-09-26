// ============================================================
// SATQUERY AI — Scene Service
// Currently uses mock data. Replace fetch() calls with real
// API endpoints when backend is available.
//
// API CONTRACT (future):
//   GET  /api/scenes              → Scene[]
//   GET  /api/scenes/:id          → Scene
//   POST /api/scenes/upload       → UploadedFile
// ============================================================

import { MOCK_SCENES, MOCK_ACTIVE_SCENE } from '../mock/scenes';
import type { Scene } from '../types';

const SIMULATED_DELAY_MS = 800;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchScenes(): Promise<Scene[]> {
  await delay(SIMULATED_DELAY_MS);
  // TODO: return await fetch('/api/scenes').then(r => r.json());
  return MOCK_SCENES;
}

export async function fetchSceneById(id: string): Promise<Scene | undefined> {
  await delay(SIMULATED_DELAY_MS);
  // TODO: return await fetch(`/api/scenes/${id}`).then(r => r.json());
  return MOCK_SCENES.find((s) => s.id === id);
}

export async function fetchActiveScene(): Promise<Scene> {
  await delay(SIMULATED_DELAY_MS);
  // TODO: return await fetch('/api/scenes/active').then(r => r.json());
  return MOCK_ACTIVE_SCENE;
}
