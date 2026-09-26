// ============================================================
// SATQUERY AI — Public Project Share View
// Renders a read-only snapshot of an entire project workspace
// with all member chats, satellite analyses, evidence, and metrics.
// Visitors cannot edit, chat, delete, or modify anything.
// ============================================================

import { useEffect, useState } from 'react';
import {
  Folder,
  MessageSquare,
  Lock,
  ArrowLeft,
  Calendar,
  Layers,
  Eye,
  AlertCircle,
  Loader2,
  Sparkles,
  Clock,
  Globe,
  Image as ImageIcon,
  MapPin,
  GitCompare,
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { getPublicProjectShare, formatRelativeTime } from '../../services/workspaceService';
import type { PublicProjectShare, Chat } from '../../types';
import { AerospaceBackground } from '../../components/ui/AerospaceBackground';

interface PublicProjectShareViewProps {
  token: string;
  onNavigateApp: () => void;
}

export function PublicProjectShareView({ token, onNavigateApp }: PublicProjectShareViewProps) {
  const [loading, setLoading] = useState(true);
  const [projectShare, setProjectShare] = useState<PublicProjectShare | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    getPublicProjectShare(token).then((res) => {
      if (!active) return;
      if (res.success && res.data) {
        setProjectShare(res.data);
        const chats = res.data.snapshot.chats || [];
        if (chats.length > 0) {
          setSelectedChatId(chats[0].id);
        }
      } else {
        setError(res.error || 'Shared project not found or link has expired.');
      }
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [token]);

  const project = projectShare?.snapshot.project;
  const chats = projectShare?.snapshot.chats || [];
  const selectedChat: Chat | undefined = chats.find((c) => c.id === selectedChatId) || chats[0];

  const totalInteractions = chats.reduce((acc, c) => acc + (c.interactions?.length || 0), 0);

  return (
    <div className="relative min-h-screen w-full bg-black text-white font-sans overflow-x-hidden select-none">
      <AerospaceBackground />

      {/* Top Banner: Read-Only Project Disclaimer */}
      <div className="relative z-30 w-full bg-[#C29B53]/10 border-b border-[#C29B53]/20 py-2.5 px-4 sm:px-8 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-2 text-xs font-mono text-[#C29B53]">
          <Lock size={13} />
          <span className="font-bold uppercase tracking-wider">
            Public Project Workspace — Read Only
          </span>
          <span className="hidden sm:inline text-zinc-500">·</span>
          <span className="hidden sm:inline text-zinc-400">
            You are browsing a public snapshot of this project and its satellite intelligence chats.
          </span>
        </div>

        <button
          type="button"
          onClick={onNavigateApp}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-semibold text-white bg-white/[0.08] hover:bg-white/[0.14] border border-white/20 transition-all cursor-pointer"
        >
          <ArrowLeft size={12} />
          <span>Launch SatQuery</span>
        </button>
      </div>

      {/* Main Container */}
      <div className="relative z-20 max-w-6xl mx-auto py-8 px-4 sm:px-6">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-center">
            <Loader2 size={36} className="text-[#C29B53] animate-spin mb-4" />
            <div className="text-sm font-mono text-zinc-400">
              Retrieving public project workspace snapshot…
            </div>
          </div>
        ) : error || !projectShare || !project ? (
          <div className="py-20 text-center max-w-md mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-red-950/40 border border-red-500/40 flex items-center justify-center mx-auto mb-4 text-red-400">
              <AlertCircle size={24} />
            </div>
            <h2 className="text-xl font-bold uppercase tracking-tight text-white mb-2 font-mono">
              Project Not Found
            </h2>
            <p className="text-xs text-zinc-400 font-mono mb-6 leading-relaxed">
              {error || 'This project share link is invalid, private, or has expired.'}
            </p>
            <button
              type="button"
              onClick={onNavigateApp}
              className="px-6 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-[#C29B53] text-black hover:bg-[#CCA563] transition-all cursor-pointer"
            >
              Go to SatQuery Workspace
            </button>
          </div>
        ) : (
          <div className="space-y-6 text-left">
            {/* ── PROJECT HERO CARD ── */}
            <div className="rounded-2xl p-6 sm:p-8 backdrop-blur-2xl bg-black/60 border border-white/15 shadow-[0_20px_80px_rgba(0,0,0,0.85)]">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-[10px] font-mono font-semibold tracking-[0.2em] uppercase text-[#C29B53] mb-2">
                    <Folder size={12} />
                    <span>Shared Project Container</span>
                    <span className="text-zinc-600">·</span>
                    <span className="text-zinc-400">Read-Only Snapshot</span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white uppercase tracking-tight">
                    {project.name}
                  </h1>

                  {project.description ? (
                    <p className="text-sm text-zinc-300 mt-2 max-w-3xl leading-relaxed">
                      {project.description}
                    </p>
                  ) : (
                    <p className="text-xs text-zinc-500 italic mt-1 font-mono">
                      No project description provided.
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 mt-4 text-xs font-mono text-zinc-400">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={12} />
                      Shared {new Date(projectShare.createdAt).toLocaleDateString()}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1.5">
                      <MessageSquare size={12} />
                      {chats.length} chat{chats.length === 1 ? '' : 's'}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1.5">
                      <Layers size={12} />
                      {totalInteractions} total analysis item{totalInteractions === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>

                {/* Provenance badge */}
                <div className="shrink-0">
                  {projectShare.isBackendGenerated ? (
                    <div className="px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono flex items-center gap-1.5">
                      <ShieldCheck size={13} className="text-emerald-400" />
                      <span>Verified Server Snapshot</span>
                    </div>
                  ) : (
                    <div className="px-3 py-1.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-[11px] font-mono flex items-center gap-1.5">
                      <ShieldAlert size={13} className="text-amber-400" />
                      <span>Preview Snapshot</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── PROJECT CHATS & ANALYSES BROWSER ── */}
            {chats.length === 0 ? (
              <div className="rounded-2xl p-12 border border-dashed border-white/15 bg-black/40 text-center flex flex-col items-center justify-center">
                <MessageSquare size={24} className="text-zinc-600 mb-2" />
                <p className="text-sm font-bold text-white uppercase font-mono">
                  No Analysis Chats in This Project
                </p>
                <p className="text-xs text-zinc-500 font-mono mt-1">
                  The author has not yet saved any analysis sessions in this project snapshot.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Chat Selector Column */}
                <div className="lg:col-span-4 rounded-2xl p-4 bg-black/60 border border-white/15 backdrop-blur-2xl space-y-3">
                  <div className="text-xs font-mono font-bold uppercase tracking-[0.16em] text-zinc-400 px-2 flex items-center justify-between">
                    <span>Project Chats</span>
                    <span className="text-[10px] bg-white/[0.06] px-2 py-0.5 rounded text-zinc-400">
                      {chats.length}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {chats.map((c) => {
                      const isSelected = (selectedChat?.id || '') === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setSelectedChatId(c.id)}
                          className={`w-full text-left p-3 rounded-xl transition-all border cursor-pointer ${
                            isSelected
                              ? 'bg-[#C29B53]/15 border-[#C29B53]/40 text-white shadow-sm'
                              : 'bg-white/[0.02] border-white/5 text-zinc-400 hover:text-white hover:bg-white/[0.05]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <MessageSquare
                              size={13}
                              className={isSelected ? 'text-[#C29B53]' : 'text-zinc-500'}
                            />
                            <div className="font-semibold text-xs truncate flex-1">{c.title}</div>
                          </div>
                          <div className="text-[10px] font-mono text-zinc-500 mt-1 flex items-center justify-between">
                            <span>{c.interactions?.length || 0} interaction(s)</span>
                            <span>{formatRelativeTime(c.updatedAt)}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Chat Feed Column */}
                <div className="lg:col-span-8 space-y-6">
                  {selectedChat ? (
                    <>
                      {/* Active Chat Header */}
                      <div className="rounded-2xl px-6 py-4 bg-black/60 border border-white/15 backdrop-blur-2xl flex items-center justify-between">
                        <div>
                          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                            Active Chat View
                          </div>
                          <h2 className="text-lg font-bold text-white mt-0.5">
                            {selectedChat.title}
                          </h2>
                        </div>
                        <div className="text-xs font-mono text-zinc-400 flex items-center gap-1.5">
                          <Clock size={12} />
                          <span>Updated {formatRelativeTime(selectedChat.updatedAt)}</span>
                        </div>
                      </div>

                      {/* Interactions List */}
                      {selectedChat.interactions && selectedChat.interactions.length > 0 ? (
                        <div className="space-y-6">
                          {selectedChat.interactions.map((interaction, idx) => (
                            <div
                              key={interaction.id || idx}
                              className="rounded-2xl p-6 sm:p-8 backdrop-blur-2xl bg-black/60 border border-white/15 shadow-[0_20px_80px_rgba(0,0,0,0.85)] space-y-5"
                            >
                              {/* Header */}
                              <div className="flex items-center justify-between pb-3 border-b border-white/10 flex-wrap gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider bg-[#C29B53]/15 text-[#C29B53] border border-[#C29B53]/30 uppercase flex items-center gap-1.5">
                                    {interaction.type === 'single' ? (
                                      <>
                                        <ImageIcon size={11} />
                                        <span>Single Image</span>
                                      </>
                                    ) : interaction.type === 'map' ? (
                                      <>
                                        <MapPin size={11} />
                                        <span>Map AOI</span>
                                      </>
                                    ) : (
                                      <>
                                        <GitCompare size={11} />
                                        <span>Bi-Temporal</span>
                                      </>
                                    )}
                                  </span>
                                  {interaction.isDemoMode && (
                                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                      DEMO RESULT
                                    </span>
                                  )}
                                </div>

                                <div className="text-[10px] font-mono text-zinc-400 flex items-center gap-2">
                                  {interaction.createdByName && (
                                    <span>Analyzed by {interaction.createdByName} ·</span>
                                  )}
                                  <span>
                                    {new Date(interaction.timestamp).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </div>
                              </div>

                              {/* Question */}
                              <div>
                                <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-1">
                                  Query
                                </div>
                                <p className="text-base sm:text-lg font-medium text-white italic">
                                  &ldquo;{interaction.query}&rdquo;
                                </p>
                              </div>

                              {/* Input Imagery */}
                              {interaction.imageUrls && interaction.imageUrls.length > 0 && (
                                <div className="pt-3 border-t border-white/10">
                                  <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
                                    <Eye size={12} />
                                    <span>Satellite Input Imagery</span>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {interaction.imageUrls.map((url, i) => (
                                      <div
                                        key={i}
                                        className="rounded-xl overflow-hidden border border-white/10 bg-black/80 max-h-[220px] flex items-center justify-center p-1"
                                      >
                                        <img
                                          src={url}
                                          alt={`Satellite Input ${i + 1}`}
                                          className="max-h-full max-w-full object-contain"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* AI Answer */}
                              <div className="pt-3 border-t border-white/10">
                                <div className="flex items-center gap-2 mb-2">
                                  <Sparkles size={14} className="text-[#C29B53]" />
                                  <span className="text-xs font-mono font-bold tracking-[0.2em] uppercase text-[#C29B53]">
                                    SatQuery Result
                                  </span>
                                </div>
                                <p className="text-sm text-zinc-100 leading-relaxed font-sans">
                                  {interaction.answer}
                                </p>
                              </div>

                              {/* Visual Evidence */}
                              {(interaction.visualEvidenceUrl ||
                                interaction.changeVisualizationUrl) && (
                                <div className="pt-3 border-t border-white/10">
                                  <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
                                    <Layers size={12} className="text-[#C29B53]" />
                                    <span>
                                      {interaction.changeVisualizationUrl
                                        ? 'Change Visualization Output'
                                        : 'Visual Evidence'}
                                    </span>
                                  </div>
                                  <div className="rounded-xl overflow-hidden border border-white/15 bg-black/90 max-h-[300px] flex items-center justify-center p-1">
                                    <img
                                      src={
                                        interaction.changeVisualizationUrl ||
                                        interaction.visualEvidenceUrl
                                      }
                                      alt="Evidence output"
                                      className="max-h-full max-w-full object-contain"
                                    />
                                  </div>
                                </div>
                              )}

                              {/* Supporting Metrics */}
                              {interaction.metrics && (
                                <div className="pt-3 border-t border-white/10 flex flex-wrap items-center gap-3 text-xs font-mono">
                                  {interaction.metrics.changeAreaKm2 !== undefined && (
                                    <div className="px-3 py-1 rounded-lg bg-white/[0.04] border border-white/10">
                                      <span className="text-zinc-400">Area: </span>
                                      <span className="text-[#C29B53] font-bold">
                                        {interaction.metrics.changeAreaKm2} km²
                                      </span>
                                    </div>
                                  )}
                                  {interaction.metrics.confidence !== undefined && (
                                    <div className="px-3 py-1 rounded-lg bg-white/[0.04] border border-white/10">
                                      <span className="text-zinc-400">Confidence: </span>
                                      <span className="text-emerald-400 font-bold">
                                        {interaction.metrics.confidence}%
                                      </span>
                                    </div>
                                  )}
                                  {interaction.metrics.mainChange && (
                                    <div className="px-3 py-1 rounded-lg bg-white/[0.04] border border-white/10">
                                      <span className="text-zinc-400">Main: </span>
                                      <span className="text-white font-bold">
                                        {interaction.metrics.mainChange}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-2xl p-10 border border-dashed border-white/10 bg-black/40 text-center text-xs font-mono text-zinc-500">
                          This chat has no recorded queries.
                        </div>
                      )}
                    </>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
