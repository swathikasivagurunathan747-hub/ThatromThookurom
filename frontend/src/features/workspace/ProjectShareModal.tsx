// ============================================================
// SATQUERY AI — Project Share Modal
// Generates persistent or local read-only project snapshot links
// and manages project public view settings.
// ============================================================

import { useState, useEffect } from 'react';
import {
  Share2,
  Copy,
  Check,
  X,
  Globe,
  Lock,
  Users,
  AlertCircle,
  Loader2,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import {
  getProject,
  createPublicProjectShare,
  updateProjectShareConfig,
} from '../../services/workspaceService';
import type { Project, PublicProjectShare } from '../../types';

interface ProjectShareModalProps {
  isOpen: boolean;
  projectId: string;
  onClose: () => void;
  onOpenCollaborate?: () => void;
}

export function ProjectShareModal({
  isOpen,
  projectId,
  onClose,
  onOpenCollaborate,
}: ProjectShareModalProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [shareData, setShareData] = useState<PublicProjectShare | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setCopied(false);
      getProject(projectId).then((p) => {
        setProject(p || null);
        if (p?.shareConfig?.isPublic && p.shareConfig.publicToken && p.shareConfig.shareUrl) {
          setShareData({
            id: `pshare_${p.id}`,
            projectId: p.id,
            publicToken: p.shareConfig.publicToken,
            shareUrl: p.shareConfig.shareUrl,
            createdAt: p.shareConfig.updatedAt || new Date().toISOString(),
            isPublic: true,
            isBackendGenerated: false,
            snapshot: {
              project: p,
              chats: [],
            },
          });
        } else {
          setShareData(null);
        }
      });
    }
  }, [isOpen, projectId]);

  if (!isOpen) return null;

  const handleCreatePublicLink = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await createPublicProjectShare(projectId);
      if (res.success && res.data) {
        setShareData(res.data);
        const updatedP = await getProject(projectId);
        setProject(updatedP || null);
      } else {
        setError(res.error || 'Failed to generate project share link.');
      }
    } catch {
      setError('Service error creating public link.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisablePublicLink = async () => {
    setLoading(true);
    setError(null);
    try {
      await updateProjectShareConfig(projectId, false);
      setShareData(null);
      const updatedP = await getProject(projectId);
      setProject(updatedP || null);
    } catch {
      setError('Failed to update project share configuration.');
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

  const isPublicEnabled = Boolean(project?.shareConfig?.allowPublicView || shareData?.isPublic);
  const collaboratorCount = project?.collaborators?.length || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-xl rounded-2xl bg-[#090d10] border border-white/15 p-6 shadow-2xl text-left flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2 text-white font-mono font-bold text-sm uppercase tracking-wider">
            <Share2 size={16} className="text-[#C29B53]" />
            <span>Share Project Workspace</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="py-4 space-y-5">
          {/* Project Title and Overview */}
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-zinc-400">
              Project Container
            </div>
            <div className="text-base font-bold text-white mt-0.5 font-sans">
              &ldquo;{project?.name || 'Project'}&rdquo;
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Public project links allow anyone with the URL to view this project and all its chats
              in strictly read-only mode.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs font-mono flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Sharing Options Section */}
          <div className="space-y-3">
            {/* Option A: Public Read-Only Link */}
            <div
              className={`p-4 rounded-xl border transition-all ${
                isPublicEnabled
                  ? 'bg-white/[0.03] border-[#C29B53]/40 shadow-sm'
                  : 'bg-white/[0.01] border-white/10'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-lg mt-0.5 ${
                      isPublicEnabled
                        ? 'bg-[#C29B53]/15 text-[#C29B53]'
                        : 'bg-white/[0.05] text-zinc-400'
                    }`}
                  >
                    <Globe size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
                      <span>Public Project Link</span>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-semibold uppercase ${
                          isPublicEnabled
                            ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {isPublicEnabled ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      Anyone with the link can view this project, its questions, satellite imagery,
                      AI results, and visual metrics. Viewers cannot run queries, modify, or delete
                      items.
                    </p>
                  </div>
                </div>

                <div>
                  {isPublicEnabled ? (
                    <button
                      type="button"
                      onClick={handleDisablePublicLink}
                      disabled={loading}
                      className="px-3 py-1.5 rounded-lg text-xs font-mono text-zinc-400 hover:text-red-400 hover:bg-red-950/30 border border-white/10 transition-colors cursor-pointer"
                    >
                      Disable Link
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleCreatePublicLink}
                      disabled={loading}
                      className="px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-[#C29B53] hover:bg-[#CCA563] text-black transition-all shadow-sm disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      {loading ? (
                        <>
                          <Loader2 size={13} className="animate-spin" />
                          <span>Generating…</span>
                        </>
                      ) : (
                        <>
                          <Globe size={13} />
                          <span>Enable Link</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Link Input + Copy Button when enabled */}
              {isPublicEnabled && shareData && (
                <div className="mt-4 pt-3 border-t border-white/10 space-y-3">
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
                      className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
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
                      <span>Persistent link stored on backend server.</span>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/40 text-amber-200 text-[10px] font-mono flex items-start gap-2">
                      <ShieldAlert size={13} className="shrink-0 text-amber-400 mt-0.5" />
                      <span>
                        Backend sharing service (/api/share/project) is currently offline. Link
                        generated for local browser preview.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Option B: Team Collaboration Shortcut */}
            <div className="p-4 rounded-xl bg-white/[0.01] border border-white/10 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-white/[0.05] text-[#C29B53] mt-0.5">
                  <Users size={18} />
                </div>
                <div>
                  <div className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                    Team Collaboration
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">
                    Invite authenticated users by email to view or edit this project with role
                    permissions.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCollaborate?.();
                }}
                className="px-4 py-2 rounded-xl text-xs font-mono font-semibold uppercase tracking-wider bg-white/[0.05] hover:bg-white/[0.1] text-zinc-200 hover:text-white border border-white/15 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <span>Manage</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* Access Summary */}
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 font-mono text-xs space-y-1.5">
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">
              Access Summary
            </div>
            <div className="flex items-center justify-between text-zinc-300 text-[11px]">
              <span className="text-zinc-500">Owner:</span>
              <span className="text-white font-medium">{project?.ownerEmail || 'Unknown'}</span>
            </div>
            <div className="flex items-center justify-between text-zinc-300 text-[11px]">
              <span className="text-zinc-500">Collaborators:</span>
              <span className="text-white font-medium">
                {collaboratorCount} {collaboratorCount === 1 ? 'member' : 'members'}
              </span>
            </div>
            <div className="flex items-center justify-between text-zinc-300 text-[11px]">
              <span className="text-zinc-500">Public Link:</span>
              <span className={isPublicEnabled ? 'text-emerald-400' : 'text-zinc-500'}>
                {isPublicEnabled ? 'Enabled (Read-Only)' : 'Disabled'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-zinc-500 shrink-0">
          <div className="flex items-center gap-1.5">
            <Lock size={12} className="text-[#C29B53]" />
            <span>Public visitors cannot modify project contents</span>
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
