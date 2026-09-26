// ============================================================
// SATQUERY AI — Share Modal
// Provides two distinct sharing pathways:
// 1. Public Read-Only Analysis Link
// 2. Project Collaboration with role-based member management
// ============================================================

import { useState, useEffect } from 'react';
import {
  Share2,
  Copy,
  Check,
  X,
  ShieldAlert,
  Globe,
  AlertCircle,
  Loader2,
  Users,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { createPublicShare, getProject } from '../../services/workspaceService';
import type { PublicShare, Project } from '../../types';

interface ShareModalProps {
  isOpen: boolean;
  chatId: string;
  chatTitle: string;
  projectId?: string;
  project?: Project | null;
  onClose: () => void;
  onOpenCollaborate?: () => void;
}

export function ShareModal({
  isOpen,
  chatId,
  chatTitle,
  projectId,
  project: initialProject,
  onClose,
  onOpenCollaborate,
}: ShareModalProps) {
  const [loading, setLoading] = useState(false);
  const [shareData, setShareData] = useState<PublicShare | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [project, setProject] = useState<Project | null>(initialProject || null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setCopied(false);
      if (projectId && !initialProject) {
        getProject(projectId).then((p) => setProject(p || null));
      } else if (initialProject) {
        setProject(initialProject);
      }
    }
  }, [isOpen, projectId, initialProject]);

  if (!isOpen) return null;

  const handleCreateLink = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await createPublicShare(chatId);
      if (res.success && res.data) {
        setShareData(res.data);
      } else {
        setError(res.error || 'Failed to create share link.');
      }
    } catch {
      setError('Backend sharing service unavailable.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!shareData?.shareUrl) return;
    navigator.clipboard.writeText(shareData.shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const collaboratorCount = project?.collaborators?.length || 0;
  const isPublicLinkActive = Boolean(shareData);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-lg rounded-2xl bg-[#090d10] border border-white/15 p-6 shadow-2xl text-left flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2 text-white font-mono font-bold text-sm uppercase tracking-wider">
            <Share2 size={16} className="text-[#C29B53]" />
            <span>Share Analysis</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto py-4 space-y-5 flex-1 pr-1 custom-scrollbar">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-zinc-400">
              Analysis Chat
            </div>
            <div className="text-base font-bold text-white mt-0.5 font-sans">
              &ldquo;{chatTitle}&rdquo;
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Select between publishing a read-only public analysis link or collaborating with
              team members.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs font-mono flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* ── OPTION 1: PUBLIC ANALYSIS LINK (READ-ONLY) ── */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5">
                <div className="p-2 rounded-lg bg-[#C29B53]/10 text-[#C29B53] shrink-0 mt-0.5">
                  <Globe size={16} />
                </div>
                <div>
                  <div className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                    Option 1: Public Analysis Link (Read-Only)
                  </div>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    Generate a public read-only link. Anyone with the link can view imagery,
                    questions, AI responses, metrics, and visual evidence. Viewers cannot edit, chat,
                    or modify your project.
                  </p>
                </div>
              </div>
            </div>

            {/* Action or Copy Box */}
            {!shareData ? (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleCreateLink}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-[#C29B53] hover:bg-[#CCA563] text-black transition-all shadow-sm disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Generating…</span>
                    </>
                  ) : (
                    <>
                      <Share2 size={13} />
                      <span>Create Public Link</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="pt-2 space-y-2.5">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareData.shareUrl}
                    className="flex-1 px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-xs text-zinc-200 font-mono select-all outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopy}
                    className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                      copied
                        ? 'bg-emerald-500 text-black shadow-sm'
                        : 'bg-[#C29B53] hover:bg-[#CCA563] text-black shadow-sm'
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check size={13} />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>

                {shareData.isBackendGenerated ? (
                  <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
                    <Globe size={12} />
                    <span>Persistent public link active.</span>
                  </div>
                ) : (
                  <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-500/40 text-amber-200 text-[10px] font-mono flex items-center gap-1.5">
                    <ShieldAlert size={12} className="text-amber-400 shrink-0" />
                    <span>Backend service offline: Local session preview link generated.</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── OPTION 2: PROJECT COLLABORATION ── */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-3">
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-lg bg-white/[0.05] text-[#C29B53] shrink-0 mt-0.5">
                <Users size={16} />
              </div>
              <div className="flex-1">
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                  Option 2: Project Collaboration
                </div>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Collaborate with others on this project. Invite users by email to view or edit
                  this project and its analyses.
                </p>

                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenCollaborate?.();
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-mono font-semibold uppercase tracking-wider bg-white/[0.05] hover:bg-white/[0.1] text-zinc-200 hover:text-white border border-white/15 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Users size={13} />
                    <span>Manage Collaboration</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── ACCESS SUMMARY ── */}
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 font-mono text-xs space-y-1.5">
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">
              Access Summary
            </div>
            <div className="flex items-center justify-between text-zinc-300 text-[11px]">
              <span className="text-zinc-500">Owner:</span>
              <span className="text-white font-medium">{project?.ownerEmail || 'Current User'}</span>
            </div>
            <div className="flex items-center justify-between text-zinc-300 text-[11px]">
              <span className="text-zinc-500">Collaborators:</span>
              <span className="text-white font-medium">
                {collaboratorCount} {collaboratorCount === 1 ? 'member' : 'members'}
              </span>
            </div>
            <div className="flex items-center justify-between text-zinc-300 text-[11px]">
              <span className="text-zinc-500">Public Link:</span>
              <span className={isPublicLinkActive ? 'text-emerald-400' : 'text-zinc-500'}>
                {isPublicLinkActive ? 'Enabled (Read-Only)' : 'Disabled'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-zinc-500 shrink-0">
          <div className="flex items-center gap-1.5">
            <Lock size={12} className="text-[#C29B53]" />
            <span>Public visitors are strictly read-only</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-zinc-300 hover:text-white text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
