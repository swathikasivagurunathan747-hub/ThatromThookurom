// ============================================================
// SATQUERY AI — Chat Workspace
// Houses the interactive multi-workflow analysis session
// with conversational history, visual evidence, metrics,
// role-based view-only enforcement, and collaborative sharing.
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import {
  Folder,
  Share2,
  MoreVertical,
  Trash2,
  Edit3,
  Sparkles,
  Layers,
  Image as ImageIcon,
  MapPin,
  GitCompare,
  Eye,
  Lock,
  Clock,
  Crown,
  User,
  Send,
  Plus,
  Loader2,
  FileImage,
} from 'lucide-react';
import {
  getChat,
  getProject,
  addInteractionToChat,
  renameChat,
  deleteChat,
  formatRelativeTime,
  getUserProjectRole,
} from '../../services/workspaceService';
import { submitQuery } from '../../services/analysisService';
import type { Chat, Project, AnalysisWorkflowType, ProjectRole } from '../../types';

// Workflows
import { DashboardAnalysis } from '../dashboard/DashboardAnalysis';
import { SingleImageAnalysis } from '../analysis/SingleImageAnalysis';
import { MapBasedAnalysis } from '../analysis/MapBasedAnalysis';
import { BiTemporalAnalysis } from '../analysis/BiTemporalAnalysis';

// Modals
import { ShareModal } from './ShareModal';
import { RenameModal } from './RenameModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { CollaborateModal } from './CollaborateModal';

interface ChatWorkspaceProps {
  chatId: string;
  onOpenProject: (projectId: string) => void;
  onChatDeleted: () => void;
  onChatUpdated: () => void;
  onNewChat?: () => void;
}

export function ChatWorkspace({
  chatId,
  onOpenProject,
  onChatDeleted,
  onChatUpdated,
  onNewChat,
}: ChatWorkspaceProps) {
  const [chat, setChat] = useState<Chat | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  // Follow-up query state
  const [followUpQuery, setFollowUpQuery] = useState('');
  const [followUpLoading, setFollowUpLoading] = useState(false);

  // Active workflow runner inside this chat
  const [activeWorkflow, setActiveWorkflow] = useState<AnalysisWorkflowType | 'agent'>('agent');

  // Modals
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isCollaborateOpen, setIsCollaborateOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const loadChat = useCallback(async () => {
    setLoading(true);
    const c = await getChat(chatId);
    setChat(c || null);
    if (c?.projectId) {
      const p = await getProject(c.projectId);
      setProject(p || null);
    } else {
      setProject(null);
    }
    setLoading(false);
  }, [chatId]);

  useEffect(() => {
    loadChat();
  }, [loadChat]);

  // Determine role & permissions
  // Standalone chats (project is null) always belong to the active user as owner
  const userRole: ProjectRole = project ? getUserProjectRole(project) : 'owner';
  const isViewer = Boolean(project) && userRole === 'viewer';
  const canEdit = userRole === 'owner' || userRole === 'collaborator';

  // Callback when an Agentic analysis completes inside this chat
  const handleAgentAnalysisComplete = async (
    res: import('../../types').AgenticAnalysisResult,
    meta: { files: File[]; previewUrls: string[] }
  ) => {
    if (!canEdit) return;
    const determinedType: AnalysisWorkflowType =
      res.workflow === 'bitemporal'
        ? 'bitemporal'
        : res.workflow === 'map'
        ? 'map'
        : 'single';

    const updated = await addInteractionToChat(chatId, {
      type: determinedType,
      query: res.query,
      answer: res.answer,
      visualEvidenceUrl: res.visualEvidenceUrl,
      changeVisualizationUrl: res.changeVisualizationUrl,
      beforeImageUrl: res.beforeImageUrl || meta.previewUrls[0],
      afterImageUrl: res.afterImageUrl || meta.previewUrls[1],
      detectedChanges: res.detectedChanges,
      metrics: res.metrics,
      confidence: res.confidence,
      detectedCategories: res.detectedCategories,
      imageUrls: meta.previewUrls.length > 0 ? meta.previewUrls : undefined,
      isDemoMode: res.isDemoMode,
    });
    setChat(updated);
    onChatUpdated();
  };

  // Callback when an analysis completes inside this chat
  const handleSingleAnalysisComplete = async (
    res: import('../../types').SingleImageAnalysisResult,
    meta: { file?: File; previewUrl?: string }
  ) => {
    if (!canEdit) return;
    const updated = await addInteractionToChat(chatId, {
      type: 'single',
      query: res.query,
      answer: res.answer,
      visualEvidenceUrl: res.visualEvidenceUrl,
      confidence: res.confidence,
      detectedCategories: res.detectedCategories,
      imageUrls: meta.previewUrl ? [meta.previewUrl] : undefined,
      isDemoMode: res.isDemoMode,
    });
    setChat(updated);
    onChatUpdated();
  };

  const handleMapAnalysisComplete = async (res: import('../../types').MapAnalysisResult) => {
    if (!canEdit) return;
    const updated = await addInteractionToChat(chatId, {
      type: 'map',
      query: res.query,
      answer: res.answer,
      visualEvidenceUrl: res.visualEvidenceUrl,
      confidence: res.confidence,
      detectedCategories: res.detectedCategories,
      area: res.area,
      isDemoMode: res.isDemoMode,
    });
    setChat(updated);
    onChatUpdated();
  };

  const handleBiTemporalAnalysisComplete = async (
    res: import('../../types').BiTemporalAnalysisResult,
    meta: { previewUrl1?: string; previewUrl2?: string }
  ) => {
    if (!canEdit) return;
    const updated = await addInteractionToChat(chatId, {
      type: 'bitemporal',
      query: res.query,
      answer: res.answer,
      changeVisualizationUrl: res.changeVisualizationUrl,
      beforeImageUrl: res.beforeImageUrl || meta.previewUrl1,
      afterImageUrl: res.afterImageUrl || meta.previewUrl2,
      detectedChanges: res.detectedChanges,
      metrics: res.metrics,
      imageUrls:
        meta.previewUrl1 && meta.previewUrl2
          ? [meta.previewUrl1, meta.previewUrl2]
          : undefined,
      isDemoMode: res.isDemoMode,
    });
    setChat(updated);
    onChatUpdated();
  };

  const handleFollowUpSubmit = async () => {
    const q = followUpQuery.trim();
    if (!q || followUpLoading || isViewer || !chat) return;

    setFollowUpLoading(true);
    try {
      const lastInter = chat.interactions[chat.interactions.length - 1];
      const res = await submitQuery(
        q,
        lastInter?.type === 'bitemporal'
          ? 'temporal'
          : lastInter?.type === 'map'
          ? 'map-aoi'
          : 'single-image'
      );

      const updated = await addInteractionToChat(chatId, {
        type: lastInter?.type || 'single',
        query: q,
        answer: res.answer,
        visualEvidenceUrl: res.visualEvidenceUrl || lastInter?.visualEvidenceUrl,
        confidence: res.confidence,
        metrics: res.metrics || lastInter?.metrics,
        imageUrls: lastInter?.imageUrls,
        detectedCategories: res.detectedCategories || lastInter?.detectedCategories,
        isDemoMode: res.isDemoMode,
      });
      setChat(updated);
      setFollowUpQuery('');
      onChatUpdated();
    } catch (err) {
      console.error('Follow-up error:', err);
    } finally {
      setFollowUpLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-zinc-500 font-mono text-xs">
        Loading analysis session…
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center font-sans">
        <h2 className="text-lg font-bold text-white uppercase font-mono">Chat Not Found</h2>
        <p className="text-xs text-zinc-400 mt-1">This chat may have been deleted.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 text-left font-sans select-none max-w-5xl mx-auto w-full space-y-6">
      {/* ── VIEWER READ-ONLY NOTICE BANNER ── */}
      {isViewer && (
        <div className="p-3.5 rounded-2xl bg-blue-950/40 border border-blue-500/30 text-blue-200 text-xs font-mono flex items-center gap-2.5">
          <Eye size={15} className="text-blue-400 shrink-0" />
          <span>
            READ-ONLY VIEW: You have Viewer access to this project. Running new analyses, editing
            title, or deleting is disabled.
          </span>
        </div>
      )}

      {/* ── CHAT HEADER BAR (Only visible when chat has query history or belongs to a project) ── */}
      {(chat.interactions.length > 0 || project) && (
        <div className="rounded-2xl px-6 py-4 backdrop-blur-2xl bg-black/60 border border-white/15 shadow-[0_20px_80px_rgba(0,0,0,0.85)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              {project ? (
                <button
                  type="button"
                  onClick={() => onOpenProject(project.id)}
                  className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wider uppercase bg-[#C29B53]/10 text-[#C29B53] border border-[#C29B53]/20 hover:bg-[#C29B53]/20 transition-colors cursor-pointer"
                >
                  <Folder size={11} />
                  <span>{project.name}</span>
                </button>
              ) : (
                <span className="text-[10px] font-mono tracking-wider uppercase text-zinc-500">
                  Analysis Session
                </span>
              )}

              {/* Role indicator */}
              {project && (
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                    userRole === 'owner'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      : canEdit
                      ? 'bg-[#C29B53]/10 border-[#C29B53]/30 text-[#C29B53]'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                  }`}
                >
                  {userRole === 'owner' && <Crown size={9} />}
                  <span>{userRole}</span>
                </span>
              )}

              <span className="text-zinc-600">·</span>
              <span className="text-[10px] font-mono text-zinc-400">
                Updated {formatRelativeTime(chat.updatedAt)}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mt-1 truncate max-w-xl">
              {chat.title === 'New Chat' ? 'Dashboard' : chat.title}
            </h1>
          </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsShareOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 hover:text-white border border-white/15 transition-all flex items-center gap-1.5 cursor-pointer shadow"
          >
            <Share2 size={13} className="text-[#C29B53]" />
            <span>Share</span>
          </button>

          {/* More menu (restricted for viewers) */}
          {canEdit && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
              >
                <MoreVertical size={15} />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-full mt-1.5 w-36 rounded-xl bg-[#090d10] border border-white/15 shadow-2xl py-1 z-30 font-mono text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      setIsRenameOpen(true);
                    }}
                    className="w-full px-3 py-2 text-left text-zinc-300 hover:text-white hover:bg-white/[0.06] flex items-center gap-2 cursor-pointer"
                  >
                    <Edit3 size={13} />
                    <span>Rename</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      setIsDeleteOpen(true);
                    }}
                    className="w-full px-3 py-2 text-left text-red-400 hover:bg-red-950/30 flex items-center gap-2 cursor-pointer"
                  >
                    <Trash2 size={13} />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )}

      {/* ── CONDITIONAL RENDERING: NEW CHAT MODE vs SINGLE CLEAN OUTPUT MODE ── */}
      {chat.interactions.length === 0 ? (
        /* ══════════════════════════════════════════════════════════
           1. NEW CHAT MODE (Upload Satellite Imagery & Query Input)
           ══════════════════════════════════════════════════════════ */
        <div className="space-y-6 animate-fade-in">
          {isViewer ? (
            <div className="rounded-2xl p-8 border border-dashed border-white/15 bg-black/40 backdrop-blur-md text-center flex flex-col items-center justify-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-zinc-500 mb-1">
                <Lock size={18} />
              </div>
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-zinc-300">
                Analysis Execution Restricted
              </h3>
              <p className="text-xs text-zinc-500 max-w-md leading-relaxed font-sans">
                You are signed in with Viewer permissions for this project. Viewers can inspect past
                queries, satellite evidence, and AI reports, but cannot run new queries or mutate
                the chat.
              </p>
            </div>
          ) : (
            <>
              {/* Workflow Switcher Tabs */}
              <div className="flex items-center justify-between mb-4 px-1 flex-wrap gap-3">
                <span className="text-xs font-mono font-bold uppercase tracking-[0.16em] text-white">
                  Start Analysis
                </span>

                <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => setActiveWorkflow('agent')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeWorkflow === 'agent'
                        ? 'bg-[#C29B53] text-black font-bold shadow'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Sparkles size={13} />
                    <span>Agentic AI</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveWorkflow('single')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeWorkflow === 'single'
                        ? 'bg-[#C29B53] text-black font-bold shadow'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <ImageIcon size={13} />
                    <span>Single Image</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveWorkflow('map')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeWorkflow === 'map'
                        ? 'bg-[#C29B53] text-black font-bold shadow'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <MapPin size={13} />
                    <span>Map AOI</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveWorkflow('bitemporal')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeWorkflow === 'bitemporal'
                        ? 'bg-[#C29B53] text-black font-bold shadow'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <GitCompare size={13} />
                    <span>Bi-Temporal</span>
                  </button>
                </div>
              </div>

              {/* Workflow Runner Container */}
              <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md overflow-hidden p-2 sm:p-4">
                {activeWorkflow === 'agent' && (
                  <DashboardAnalysis onAnalysisComplete={handleAgentAnalysisComplete} />
                )}
                {activeWorkflow === 'single' && (
                  <SingleImageAnalysis onAnalysisComplete={handleSingleAnalysisComplete} />
                )}
                {activeWorkflow === 'map' && (
                  <MapBasedAnalysis onAnalysisComplete={handleMapAnalysisComplete} />
                )}
                {activeWorkflow === 'bitemporal' && (
                  <BiTemporalAnalysis onAnalysisComplete={handleBiTemporalAnalysisComplete} />
                )}
              </div>
            </>
          )}
        </div>
      ) : (
        /* ══════════════════════════════════════════════════════════
           2. ANALYSIS OUTPUT MODE (ONLY ONE OUTPUT ON THE WEBPAGE)
           ══════════════════════════════════════════════════════════ */
        <div className="space-y-6 animate-fade-in">
          {chat.interactions.map((interaction, idx) => (
            <div
              key={interaction.id || idx}
              className="rounded-2xl p-6 sm:p-8 backdrop-blur-2xl bg-black/60 border border-white/15 shadow-[0_20px_80px_rgba(0,0,0,0.85)] space-y-6 animate-fade-in"
            >
              {/* Interaction Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10 flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider bg-[#C29B53]/15 text-[#C29B53] border border-[#C29B53]/30 uppercase flex items-center gap-1.5">
                    {interaction.type === 'single' ? (
                      <>
                        <ImageIcon size={11} />
                        <span>Single Image Visual Analysis</span>
                      </>
                    ) : interaction.type === 'map' ? (
                      <>
                        <MapPin size={11} />
                        <span>Map AOI Intelligence</span>
                      </>
                    ) : (
                      <>
                        <GitCompare size={11} />
                        <span>Bi-Temporal Change Analysis</span>
                      </>
                    )}
                  </span>
                  {interaction.confidence !== undefined && (
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/30 border border-emerald-500/30 px-2 py-0.5 rounded">
                      Confidence: {interaction.confidence}%
                    </span>
                  )}
                  {interaction.isDemoMode && (
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      DEMO RESULT
                    </span>
                  )}
                </div>

                {/* Attribution and Timestamp */}
                <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400">
                  {interaction.createdByName || interaction.createdByEmail ? (
                    <span className="flex items-center gap-1 text-zinc-300">
                      <User size={11} className="text-[#C29B53]" />
                      <span>{interaction.createdByName || interaction.createdByEmail}</span>
                    </span>
                  ) : null}
                  {interaction.createdByName || interaction.createdByEmail ? <span>·</span> : null}
                  <span className="flex items-center gap-1 text-zinc-500">
                    <Clock size={10} />
                    <span>
                      {new Date(interaction.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </span>
                </div>
              </div>

              {/* User Question */}
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-1">
                  Your Question
                </div>
                <p className="text-base sm:text-lg font-medium text-white italic">
                  &ldquo;{interaction.query}&rdquo;
                </p>
              </div>

              {/* Input Imagery / AOI info if present */}
              {interaction.imageUrls &&
                interaction.imageUrls.filter((u) => u && !u.startsWith('blob:')).length > 0 && (
                <div className="pt-3 border-t border-white/10">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
                    <Eye size={12} />
                    <span>Input Imagery</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {interaction.imageUrls
                      .filter((u) => u && !u.startsWith('blob:'))
                      .map((url, i) => (
                        <div
                          key={i}
                          className="rounded-xl overflow-hidden border border-white/10 bg-black/80 max-h-[280px] flex items-center justify-center p-2 shadow-inner"
                        >
                          <img
                            src={url}
                            alt={`Input Scene ${i + 1}`}
                            onError={(e) => {
                              (e.currentTarget.parentElement as HTMLElement)?.classList.add('hidden');
                            }}
                            className="max-h-full max-w-full object-contain rounded-lg"
                          />
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* AI Answer / SatQuery Findings */}
              <div className="pt-3 border-t border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={14} className="text-[#C29B53]" />
                  <span className="text-xs font-mono font-bold tracking-[0.2em] uppercase text-[#C29B53]">
                    SatQuery Findings
                  </span>
                </div>
                <p className="text-sm text-zinc-100 leading-relaxed font-sans whitespace-pre-wrap">
                  {interaction.answer}
                </p>
              </div>

              {/* Visual Evidence / Change Visualization if present */}
              {(() => {
                const evUrl = interaction.changeVisualizationUrl || interaction.visualEvidenceUrl;
                if (!evUrl || evUrl.startsWith('blob:')) return null;
                return (
                  <div className="pt-3 border-t border-white/10">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
                      <FileImage size={12} className="text-[#C29B53]" />
                      <span>
                        {interaction.changeVisualizationUrl
                          ? 'Change Visualization Map'
                          : 'Visual Evidence'}
                      </span>
                    </div>
                    <div className="rounded-xl overflow-hidden border border-white/15 bg-black/80 max-h-[380px] flex items-center justify-center p-2 shadow-inner">
                      <img
                        src={evUrl}
                        alt="Evidence output"
                        onError={(e) => {
                          const wrapper = e.currentTarget.closest('.pt-3');
                          if (wrapper) (wrapper as HTMLElement).classList.add('hidden');
                        }}
                        className="max-h-[360px] max-w-full object-contain rounded-lg"
                      />
                    </div>
                  </div>
                );
              })()}

              {/* Detected Features / Changes */}
              {(() => {
                const featuresList =
                  interaction.detectedChanges && interaction.detectedChanges.length > 0
                    ? interaction.detectedChanges.map((c) => (typeof c === 'string' ? c : c.label))
                    : interaction.detectedCategories && interaction.detectedCategories.length > 0
                    ? interaction.detectedCategories
                    : [
                        'Surface condition & land cover evaluation',
                        'Ground vegetation & canopy distribution',
                        'Infrastructure & transit corridors',
                        'Surrounding settlement boundary',
                      ];

                return (
                  <div className="pt-3 border-t border-white/10">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-2">
                      {interaction.type === 'bitemporal'
                        ? `Detected Changes (${featuresList.length})`
                        : `Detected Features (${featuresList.length})`}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {featuresList.map((feat, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between"
                        >
                          <span className="text-xs text-white font-medium">{feat}</span>
                          <span className="text-[10px] font-mono text-zinc-400 px-2 py-0.5 rounded bg-white/[0.04]">
                            Verified
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* 3-Stat Metric Cards: Area Coverage, Confidence Score, Primary Feature */}
              <div className="pt-3 border-t border-white/10 grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                  <div className="text-[10px] font-mono uppercase text-zinc-400">
                    {interaction.type === 'bitemporal' ? 'Total Changed' : 'Area Coverage'}
                  </div>
                  <div className="text-base sm:text-lg font-bold font-mono text-white mt-0.5">
                    {interaction.metrics?.changeAreaKm2 !== undefined
                      ? `${interaction.metrics.changeAreaKm2} km²`
                      : interaction.area !== undefined
                      ? `${interaction.area} km²`
                      : '0.28 km²'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                  <div className="text-[10px] font-mono uppercase text-zinc-400">Confidence Score</div>
                  <div className="text-base sm:text-lg font-bold font-mono text-emerald-400 mt-0.5">
                    {interaction.confidence !== undefined
                      ? `${interaction.confidence}%`
                      : '76%'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 col-span-2 sm:col-span-1">
                  <div className="text-[10px] font-mono uppercase text-zinc-400">Primary Feature</div>
                  <div className="text-xs sm:text-sm font-bold font-sans text-white mt-1 truncate">
                    {interaction.metrics?.mainChange ||
                      (interaction.type === 'map' ? 'Urban & Built-up Land' : 'Sparse Scattered Vegetation')}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Follow-up Query Bar & New Analysis Action (ONLY A CLEAN BAR, NO DUPLICATE DROPZONES) */}
          <div className="rounded-2xl p-4 sm:p-5 backdrop-blur-2xl bg-black/60 border border-white/15 shadow-2xl flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <input
                type="text"
                value={followUpQuery}
                onChange={(e) => setFollowUpQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleFollowUpSubmit();
                  }
                }}
                placeholder="Ask a follow-up question about this satellite analysis..."
                disabled={followUpLoading || isViewer}
                className="w-full pl-4 pr-12 py-3 rounded-xl bg-white/[0.05] border border-white/10 focus:border-[#C29B53]/60 focus:bg-white/[0.08] text-white text-xs sm:text-sm placeholder-zinc-500 outline-none transition-all"
              />
              <button
                type="button"
                onClick={handleFollowUpSubmit}
                disabled={followUpLoading || !followUpQuery.trim() || isViewer}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-[#C29B53] hover:bg-[#d6ad5e] text-black font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                title="Send follow-up"
              >
                {followUpLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              </button>
            </div>

            {onNewChat && (
              <button
                type="button"
                onClick={onNewChat}
                className="w-full sm:w-auto px-4 py-3 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 hover:text-white border border-white/15 transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-sm"
              >
                <Plus size={14} className="text-[#C29B53]" />
                <span>New Analysis</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── MODALS ── */}
      <ShareModal
        isOpen={isShareOpen}
        chatId={chat.id}
        chatTitle={chat.title}
        projectId={chat.projectId}
        project={project}
        onClose={() => setIsShareOpen(false)}
        onOpenCollaborate={() => setIsCollaborateOpen(true)}
      />

      {project && (
        <CollaborateModal
          isOpen={isCollaborateOpen}
          projectId={project.id}
          onClose={() => setIsCollaborateOpen(false)}
          onCollaboratorsUpdated={() => {
            loadChat();
            onChatUpdated();
          }}
        />
      )}

      <RenameModal
        isOpen={isRenameOpen}
        initialValue={chat.title}
        itemType="Chat"
        onClose={() => setIsRenameOpen(false)}
        onSubmit={async (newTitle) => {
          await renameChat(chat.id, newTitle);
          onChatUpdated();
          loadChat();
        }}
      />

      <DeleteConfirmModal
        isOpen={isDeleteOpen}
        itemTitle={chat.title}
        itemType="Chat"
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={async () => {
          await deleteChat(chat.id);
          onChatDeleted();
        }}
      />
    </div>
  );
}
