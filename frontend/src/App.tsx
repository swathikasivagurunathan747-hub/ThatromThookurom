// ============================================================
// SATQUERY AI — Main Application
// Satellite remote-sensing intelligence workstation.
//
// Architecture:
//   - All mock data lives in src/mock/
//   - All service interfaces live in src/services/
//   - All types live in src/types/
//   - Feature components live in src/features/
//   - Replace service calls with real API when backend is ready
// ============================================================

import { useState, useCallback, useEffect } from 'react';
import type { LayerType, AnalysisResult, Project, Chat } from './types';

// Data / Services
import { MOCK_ACTIVE_SCENE } from './mock/scenes';
import { MOCK_AOI } from './mock/aoi';
import { MOCK_LAYERS } from './mock/layers';
import { MOCK_ANALYSIS_RESULT, MOCK_HISTORY, MOCK_DATASETS } from './mock/analysis';
import { submitQuery } from './services/analysisService';
import { getHistory } from './api/services';
import {
  getProjects,
  getChats,
  createProject,
  renameProject,
  deleteProject,
  createChat,
  renameChat,
  deleteChat,
} from './services/workspaceService';

// UI Components
import { TelemetryBar } from './features/telemetry/TelemetryBar';
import { NavRail } from './features/nav/NavRail';
import { SatelliteMap } from './features/map/SatelliteMap';
import { MapOverlays } from './features/map/MapOverlays';
import { MapBasedAnalysis } from './features/analysis/MapBasedAnalysis';
import { BiTemporalAnalysis } from './features/analysis/BiTemporalAnalysis';
import { AnalyzerHub } from './features/analysis/AnalyzerHub';
import { AerospaceBackground } from './components/ui/AerospaceBackground';
import { DatasetsWorkspace } from './features/datasets/DatasetsWorkspace';
import { HistoryPanel } from './features/history/HistoryPanel';
import { SettingsPanel } from './features/settings/SettingsPanel';
import { LoginPage } from './features/auth/LoginPage';
import { SignupPage } from './features/auth/SignupPage';
import { ProfileModal } from './features/auth/ProfileModal';
import { getCurrentSessionUser, isAuthenticated, logoutUser, type User } from './services/authService';

// Workspace Management Components (Step 4)
import { WorkspaceSidebar } from './features/workspace/WorkspaceSidebar';
import { ChatWorkspace } from './features/workspace/ChatWorkspace';
import { ProjectView } from './features/workspace/ProjectView';
import { PublicShareView } from './features/workspace/PublicShareView';
import { PublicProjectShareView } from './features/workspace/PublicProjectShareView';
import { ProjectModal } from './features/workspace/ProjectModal';
import { RenameModal } from './features/workspace/RenameModal';
import { DeleteConfirmModal } from './features/workspace/DeleteConfirmModal';
import { CollaborateModal } from './features/workspace/CollaborateModal';
import { ProjectShareModal } from './features/workspace/ProjectShareModal';

type NavItem = 'dashboard' | 'analyze' | 'compare' | 'datasets' | 'history' | 'settings';
type AppRoute = 'app' | 'login' | 'signup' | 'share' | 'project-share';

// ── Processing steps shown while analysis runs ──
const PROCESSING_STEPS = [
  'Ingesting scene metadata',
  'Preprocessing spectral bands',
  'Running change detection model',
  'Computing confidence scores',
  'Generating visual evidence',
];

function parseCurrentRoute(): {
  route: AppRoute;
  shareToken?: string;
  projectShareToken?: string;
} {
  const path = window.location.pathname;
  const hash = window.location.hash;
  if (path === '/login' || hash === '#/login') return { route: 'login' };
  if (path === '/signup' || hash === '#/signup') return { route: 'signup' };

  if (path.startsWith('/share/project/')) {
    return { route: 'project-share', projectShareToken: path.replace('/share/project/', '') };
  }
  if (hash.startsWith('#/share/project/')) {
    return { route: 'project-share', projectShareToken: hash.replace('#/share/project/', '') };
  }

  if (path.startsWith('/share/')) {
    return { route: 'share', shareToken: path.replace('/share/', '') };
  }
  if (hash.startsWith('#/share/')) {
    return { route: 'share', shareToken: hash.replace('#/share/', '') };
  }

  // Strictly enforce login first: unauthenticated access defaults to login
  if (!isAuthenticated()) {
    return { route: 'login' };
  }

  return { route: 'app' };
}

export default function App() {
  const [routeState, setRouteState] = useState(parseCurrentRoute);
  const route = routeState.route;
  const shareToken = routeState.shareToken;
  const projectShareToken = routeState.projectShareToken;

  const [currentUser, setCurrentUser] = useState<User | null>(getCurrentSessionUser);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [navItem, setNavItem] = useState<NavItem>('dashboard');

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    navigateTo('login');
  };

  // ── Workspace State (Projects & Chats) ──
  const [projects, setProjects] = useState<Project[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  // Modals
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [projectToRename, setProjectToRename] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [projectToShare, setProjectToShare] = useState<Project | null>(null);
  const [projectToCollaborate, setProjectToCollaborate] = useState<Project | null>(null);
  const [chatToRename, setChatToRename] = useState<Chat | null>(null);
  const [chatToDelete, setChatToDelete] = useState<Chat | null>(null);
  const [historyEntries, setHistoryEntries] = useState(MOCK_HISTORY);

  useEffect(() => {
    if (navItem === 'history') {
      getHistory().then((data) => {
        const traces = Array.isArray(data) ? data : (data?.traces || []);
        if (traces.length > 0) {
          const mapped = traces.map((t: any) => ({
            id: t.trace_id || t.request_id || String(Math.random()),
            query: t.query || 'Satellite Analysis Query',
            timestamp: t.created_at || new Date().toISOString(),
            type: (t.query?.toLowerCase().includes('change') ? 'change_detection' : 'analysis') as 'analysis' | 'change_detection',
            resultSummary: `Status: ${t.status || 'SUCCESS'} · Duration: ${Math.round(t.total_duration_ms || 0)}ms`,
          }));
          setHistoryEntries(mapped);
        }
      }).catch(() => {
        // Fallback to existing mock history
      });
    }
  }, [navItem]);

  const loadWorkspaceData = useCallback(async () => {
    const [pList, cList] = await Promise.all([getProjects(), getChats()]);
    setProjects(pList);
    setChats(cList);
    return { projects: pList, chats: cList };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [pList, cList] = await Promise.all([getProjects(), getChats()]);
      if (!mounted) return;
      setProjects(pList);
      setChats(cList);
      if (!activeChatId && !activeProjectId) {
        if (cList.length > 0) {
          setActiveChatId(cList[0].id);
        } else {
          const initChat = await createChat(undefined, 'Dashboard');
          if (mounted) {
            setChats([initChat]);
            setActiveChatId(initChat.id);
          }
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setRouteState(parseCurrentRoute());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (newRoute: AppRoute, token?: string) => {
    if (newRoute === 'project-share' && token) {
      setRouteState({ route: newRoute, projectShareToken: token });
    } else {
      setRouteState({ route: newRoute, shareToken: token });
    }
    const path =
      newRoute === 'login'
        ? '/login'
        : newRoute === 'signup'
        ? '/signup'
        : newRoute === 'share' && token
        ? `/#/share/${token}`
        : newRoute === 'project-share' && token
        ? `/#/share/project/${token}`
        : '/';
    try {
      window.history.pushState({}, '', path);
    } catch {
      // Ignore if pushState fails
    }
  };

  const [activeLayer, setActiveLayer] = useState<LayerType>('rgb');
  const [layers, setLayers] = useState(MOCK_LAYERS);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    MOCK_ANALYSIS_RESULT
  );
  const [loading, setLoading] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [mouseCoords, setMouseCoords] = useState<{ lat: number; lng: number } | undefined>(
    undefined
  );
  const [showSettings, setShowSettings] = useState(false);
  const [mapLocationContext, setMapLocationContext] = useState<string | undefined>(undefined);

  // Detection markers from evidence
  const detectionMarkers =
    analysisResult?.evidence?.map((ev) => ({
      lat: ev.coordinates.lat,
      lng: ev.coordinates.lng,
      label: ev.label,
    })) ?? [];

  // Layer switch
  const handleLayerChange = useCallback((layerId: LayerType) => {
    setActiveLayer(layerId);
    setLayers((prev) => prev.map((l) => ({ ...l, active: l.id === layerId })));
  }, []);

  // Query submission with simulated step progress
  const handleAnalyze = useCallback(
    async (
      queryText: string,
      mode: AnalysisResult['mode'] = 'change_detection',
      layer: LayerType = 'rgb'
    ) => {
      setNavItem('analyze');
      setLoading(true);
      setAnalysisResult(null);
      setProcessingStep(0);

      const stepInterval = setInterval(() => {
        setProcessingStep((s) => Math.min(s + 1, PROCESSING_STEPS.length - 1));
      }, 480);

      try {
        const result = await submitQuery({
          id: `q_${Date.now()}`,
          text: queryText,
          mode,
          sceneId: MOCK_ACTIVE_SCENE.id,
          aoiId: MOCK_AOI.id,
          layer,
        });
        setAnalysisResult(result);
      } catch (err) {
        console.error('Analysis failed:', err);
      } finally {
        clearInterval(stepInterval);
        setLoading(false);
        setProcessingStep(0);
      }
    },
    []
  );

  // Map ready — attach mouse tracking
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleMapReady = useCallback((map: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    map.on('mousemove', (e: any) => {
      setMouseCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
    });
    map.on('mouseout', () => setMouseCoords(undefined));
  }, []);

  const handleNavChange = (item: NavItem) => {
    setNavItem(item);
    setShowSettings(item === 'settings');
    // When clicking direct NavRail item, return to direct workflow mode
    setActiveChatId(null);
    setActiveProjectId(null);
  };

  const handleOpenDashboard = async () => {
    setShowSettings(false);
    setActiveProjectId(null);
    setNavItem('dashboard');
    if (chats.length > 0) {
      setActiveChatId(chats[0].id);
    } else {
      const newChat = await createChat(undefined, 'Dashboard');
      await loadWorkspaceData();
      setActiveChatId(newChat.id);
    }
  };

  const handleNewChat = async () => {
    const newChat = await createChat(activeProjectId || undefined, 'Dashboard');
    await loadWorkspaceData();
    setActiveChatId(newChat.id);
  };

  // Route: Public Read-Only Analysis Share
  if (route === 'share' && shareToken) {
    return (
      <PublicShareView
        token={shareToken}
        onNavigateApp={() => navigateTo('app')}
      />
    );
  }

  // Route: Public Read-Only Project Share
  if (route === 'project-share' && projectShareToken) {
    return (
      <PublicProjectShareView
        token={projectShareToken}
        onNavigateApp={() => navigateTo('app')}
      />
    );
  }

  // Route: Login or Unauthenticated fallback
  if (route === 'login' || (!currentUser && route !== 'signup' && route !== 'share' && route !== 'project-share')) {
    return (
      <LoginPage
        onSuccess={() => {
          const u = getCurrentSessionUser();
          setCurrentUser(u);
          navigateTo('app');
          setNavItem('dashboard');
        }}
        onNavigateSignup={() => navigateTo('signup')}
      />
    );
  }

  // Route: Signup
  if (route === 'signup') {
    return (
      <SignupPage
        onSuccess={() => {
          const u = getCurrentSessionUser();
          setCurrentUser(u);
          navigateTo('app');
          setNavItem('dashboard');
        }}
        onNavigateLogin={() => navigateTo('login')}
      />
    );
  }

  const isWorkspaceActive = Boolean(activeChatId) || Boolean(activeProjectId);

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{ height: '100dvh', width: '100vw', background: '#050708' }}
    >
      {/* ── TOP TELEMETRY BAR ── */}
      <TelemetryBar
        scene={MOCK_ACTIVE_SCENE}
        aoiArea={MOCK_AOI.areaSqKm}
        activeNavItem={navItem === 'analyze' ? 'analyzer' : activeChatId ? 'chat' : navItem}
        user={currentUser}
        hideDetails={
          navItem === 'analyze' ||
          navItem === 'dashboard' ||
          navItem === 'compare' ||
          navItem === 'datasets' ||
          isWorkspaceActive
        }
        centerTitle={
          navItem === 'analyze'
            ? mapLocationContext
              ? `📍 ${mapLocationContext}`
              : 'ANALYZER'
            : navItem === 'datasets'
            ? 'DATASETS'
            : navItem === 'compare'
            ? 'BI-TEMPORAL ANALYSIS'
            : undefined
        }
        onDashboardClick={handleOpenDashboard}
        onNavChange={(nav) => {
          if (nav === 'dashboard') {
            handleOpenDashboard();
          } else if (nav === 'chat') {
            handleOpenDashboard();
          } else if (nav === 'analyzer') {
            setActiveChatId(null);
            setActiveProjectId(null);
            setNavItem('analyze');
          }
        }}
        onProfileClick={() => setIsProfileOpen(true)}
        onSettingsClick={() => {
          const next = !showSettings;
          setShowSettings(next);
          if (next) setNavItem('settings');
        }}
        onLogoutClick={handleLogout}
        onLoginClick={() => navigateTo('login')}
      />

      {/* ── MAIN WORKSPACE CONTAINER ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* ── WORKSPACE SIDEBAR (Projects & Chats) ── */}
        <WorkspaceSidebar
          projects={projects}
          chats={chats}
          activeProjectId={activeProjectId}
          activeChatId={activeChatId}
          onSelectProject={(id) => {
            setActiveProjectId(id);
            setActiveChatId(null);
          }}
          onSelectChat={(id) => {
            setActiveChatId(id);
            const ch = chats.find((c) => c.id === id);
            setActiveProjectId(ch?.projectId || null);
          }}
          onNewChat={handleNewChat}
          onNewProject={() => setIsNewProjectOpen(true)}
          onRenameProject={(p) => setProjectToRename(p)}
          onDeleteProject={(p) => setProjectToDelete(p)}
          onShareProject={(p) => setProjectToShare(p)}
          onCollaborateProject={(p) => setProjectToCollaborate(p)}
          onRenameChat={(c) => setChatToRename(c)}
          onDeleteChat={(c) => setChatToDelete(c)}
          onOpenSettings={() => setShowSettings(true)}
          onLoginClick={() => navigateTo('login')}
        />

        {/* ── NAV RAIL (Compact direct workflow shortcuts) ── */}
        <NavRail
          active={isWorkspaceActive ? undefined : navItem}
          onChange={handleNavChange}
          onDashboard={handleOpenDashboard}
          onNewChat={handleNewChat}
          isDashboardActive={Boolean(activeChatId) || navItem === 'dashboard'}
        />

        {/* ── WORKSPACE CONTENT CANVAS ── */}
        <div className="flex-1 relative overflow-hidden" style={{ cursor: 'crosshair' }}>
          {/* BACKGROUND SATELLITE MAP (Only active during direct legacy map modes - NEVER on datasets) */}
          {navItem !== 'dashboard' &&
            navItem !== 'analyze' &&
            navItem !== 'compare' &&
            navItem !== 'datasets' &&
            !isWorkspaceActive && (
              <div className="absolute inset-0 z-0">
                <SatelliteMap
                  center={[MOCK_ACTIVE_SCENE.coordinates.lat, MOCK_ACTIVE_SCENE.coordinates.lng]}
                  zoom={14}
                  aoi={MOCK_AOI}
                  activeLayer={activeLayer}
                  onMapReady={handleMapReady}
                  detectionMarkers={detectionMarkers}
                />
              </div>
            )}

          {/* MAP OVERLAYS */}
          {navItem !== 'dashboard' &&
            navItem !== 'analyze' &&
            navItem !== 'compare' &&
            navItem !== 'datasets' &&
            !isWorkspaceActive && (
              <MapOverlays
                aoi={MOCK_AOI}
                activeLayer={activeLayer}
                mouseCoords={mouseCoords}
              />
            )}

          {/* ══════════════════════════════════════
              ACTIVE CHAT WORKSPACE (Step 4)
          ══════════════════════════════════════ */}
          {activeChatId && (
            <div className="absolute inset-0 z-30 bg-black overflow-y-auto pointer-events-auto">
              <div className="relative min-h-full w-full bg-black text-white font-sans overflow-x-hidden select-none">
                <AerospaceBackground />
                <div className="relative z-20 w-full">
                  <ChatWorkspace
                    chatId={activeChatId}
                    onOpenProject={(pId) => {
                      setActiveProjectId(pId);
                      setActiveChatId(null);
                    }}
                    onChatDeleted={() => {
                      setActiveChatId(null);
                      loadWorkspaceData();
                    }}
                    onChatUpdated={loadWorkspaceData}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════
              ACTIVE PROJECT WORKSPACE (Step 4)
          ══════════════════════════════════════ */}
          {!activeChatId && activeProjectId && (
            <div className="absolute inset-0 z-30 bg-black overflow-y-auto pointer-events-auto">
              <div className="relative min-h-full w-full bg-black text-white font-sans overflow-x-hidden select-none">
                <AerospaceBackground />
                <div className="relative z-20 w-full">
                  <ProjectView
                    projectId={activeProjectId}
                    onOpenChat={(cId) => setActiveChatId(cId)}
                    onProjectUpdated={loadWorkspaceData}
                    onProjectDeleted={() => {
                      setActiveProjectId(null);
                      loadWorkspaceData();
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════
              DIRECT WORKFLOW MODES (When no chat/project active)
          ══════════════════════════════════════ */}
          {!isWorkspaceActive && (
            <>
              {/* UNIFIED ANALYZER HUB MODE (Single Map, Map AOI, Temporal Analysis) */}
              {navItem === 'analyze' && (
                <div className="absolute inset-0 z-30 pointer-events-auto">
                  <AnalyzerHub
                    initialMode="map-aoi"
                    onLocationChange={(loc) => setMapLocationContext(loc)}
                  />
                </div>
              )}

              {/* BI-TEMPORAL ANALYSIS MODE */}
              {navItem === 'compare' && (
                <div className="absolute inset-0 z-30 bg-black overflow-y-auto pointer-events-auto">
                  <div className="relative min-h-full w-full bg-black text-white font-sans overflow-x-hidden select-none">
                    <AerospaceBackground />
                    <div className="relative z-20 w-full">
                      <BiTemporalAnalysis />
                    </div>
                  </div>
                </div>
              )}

              {/* DATASETS MODE */}
              {navItem === 'datasets' && (
                <div className="absolute inset-0 z-30 bg-black overflow-y-auto pointer-events-auto">
                  <DatasetsWorkspace />
                </div>
              )}

              {/* HISTORY MODE */}
              {navItem === 'history' && (
                <div className="absolute top-3 left-3 z-30 pointer-events-auto fade-in">
                  <HistoryPanel entries={historyEntries} />
                </div>
              )}
            </>
          )}

          {/* ══════════════════════════════════════
              SETTINGS PANEL
          ══════════════════════════════════════ */}
          {(navItem === 'settings' || showSettings) && (
            <SettingsPanel
              onClose={() => {
                setShowSettings(false);
                if (navItem === 'settings') setNavItem('dashboard');
              }}
            />
          )}

          {/* Dim overlay while processing */}
          {loading && (
            <div
              className="absolute inset-0 z-20 pointer-events-none"
              style={{ background: 'rgba(5,7,8,0.15)' }}
            />
          )}
        </div>
      </div>

      {/* ── WORKSPACE MODALS ── */}
      <ProjectModal
        isOpen={isNewProjectOpen}
        onClose={() => setIsNewProjectOpen(false)}
        onSubmit={async (name, desc) => {
          const newProj = await createProject(name, desc);
          await loadWorkspaceData();
          setActiveProjectId(newProj.id);
          setActiveChatId(null);
        }}
      />

      <RenameModal
        isOpen={projectToRename !== null}
        initialValue={projectToRename?.name || ''}
        itemType="Project"
        onClose={() => setProjectToRename(null)}
        onSubmit={async (newName) => {
          if (!projectToRename) return;
          await renameProject(projectToRename.id, newName);
          await loadWorkspaceData();
        }}
      />

      <DeleteConfirmModal
        isOpen={projectToDelete !== null}
        itemTitle={projectToDelete?.name || ''}
        itemType="Project"
        onClose={() => setProjectToDelete(null)}
        onConfirm={async () => {
          if (!projectToDelete) return;
          await deleteProject(projectToDelete.id);
          if (activeProjectId === projectToDelete.id) {
            setActiveProjectId(null);
          }
          await loadWorkspaceData();
        }}
      />

      <RenameModal
        isOpen={chatToRename !== null}
        initialValue={chatToRename?.title || ''}
        itemType="Chat"
        onClose={() => setChatToRename(null)}
        onSubmit={async (newTitle) => {
          if (!chatToRename) return;
          await renameChat(chatToRename.id, newTitle);
          await loadWorkspaceData();
        }}
      />

      <DeleteConfirmModal
        isOpen={chatToDelete !== null}
        itemTitle={chatToDelete?.title || ''}
        itemType="Chat"
        onClose={() => setChatToDelete(null)}
        onConfirm={async () => {
          if (!chatToDelete) return;
          await deleteChat(chatToDelete.id);
          if (activeChatId === chatToDelete.id) {
            setActiveChatId(null);
          }
          await loadWorkspaceData();
        }}
      />

      {/* Project Sharing and Collaboration Modals */}
      {projectToShare && (
        <ProjectShareModal
          isOpen={projectToShare !== null}
          projectId={projectToShare.id}
          onClose={() => setProjectToShare(null)}
          onOpenCollaborate={() => {
            const p = projectToShare;
            setProjectToShare(null);
            setProjectToCollaborate(p);
          }}
        />
      )}

      {projectToCollaborate && (
        <CollaborateModal
          isOpen={projectToCollaborate !== null}
          projectId={projectToCollaborate.id}
          onClose={() => setProjectToCollaborate(null)}
          onCollaboratorsUpdated={async () => {
            await loadWorkspaceData();
          }}
        />
      )}

      {/* Institutional User Profile & Credentials Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onLogout={handleLogout}
      />
    </div>
  );
}
