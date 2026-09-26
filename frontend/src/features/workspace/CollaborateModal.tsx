// ============================================================
// SATQUERY AI — Collaborate Modal
// Manages authenticated project collaboration, role assignments
// (Collaborator vs Viewer), and collaborator member lifecycle.
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  X,
  UserPlus,
  ShieldCheck,
  Eye,
  Trash2,
  AlertCircle,
  Check,
  Loader2,
  Info,
  Crown,
} from 'lucide-react';
import {
  getProject,
  inviteCollaborator,
  removeCollaborator,
  updateCollaboratorRole,
  getUserProjectRole,
} from '../../services/workspaceService';
import type { Project, ProjectCollaborator, ProjectRole } from '../../types';

interface CollaborateModalProps {
  isOpen: boolean;
  projectId: string;
  onClose: () => void;
  onCollaboratorsUpdated?: () => void;
}

export function CollaborateModal({
  isOpen,
  projectId,
  onClose,
  onCollaboratorsUpdated,
}: CollaborateModalProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'collaborator' | 'viewer'>('collaborator');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isBackendDelivered, setIsBackendDelivered] = useState<boolean | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const p = await getProject(projectId);
    setProject(p || null);
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setSuccessMessage(null);
      setIsBackendDelivered(null);
      setInviteEmail('');
      loadData();
    }
  }, [isOpen, loadData]);

  if (!isOpen) return null;

  const userRole: ProjectRole = getUserProjectRole(project);
  const isOwner = userRole === 'owner';

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inviteEmail.trim();
    if (!trimmed) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setErrorMessage('Please enter a valid email format (e.g. colleague@agency.gov).');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await inviteCollaborator(projectId, trimmed, inviteRole);
      if (res.success && res.data) {
        setIsBackendDelivered(Boolean(res.isBackendDelivered));
        if (res.isBackendDelivered) {
          setSuccessMessage(`Invitation dispatched to ${trimmed} as ${inviteRole}.`);
        } else {
          setSuccessMessage(
            `Added ${trimmed} to project collaborators (Backend offline: saved to local session).`
          );
        }
        setInviteEmail('');
        await loadData();
        onCollaboratorsUpdated?.();
      } else {
        setErrorMessage(res.error || 'Failed to invite collaborator.');
      }
    } catch {
      setErrorMessage('Service error while sending invitation.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoleChange = async (collabId: string, newRole: 'collaborator' | 'viewer') => {
    try {
      await updateCollaboratorRole(projectId, collabId, newRole);
      await loadData();
      onCollaboratorsUpdated?.();
    } catch {
      setErrorMessage('Failed to update collaborator role.');
    }
  };

  const handleRemove = async (collabId: string, collabEmail: string) => {
    if (!window.confirm(`Remove ${collabEmail} from this project?`)) {
      return;
    }
    try {
      await removeCollaborator(projectId, collabId);
      await loadData();
      onCollaboratorsUpdated?.();
    } catch {
      setErrorMessage('Failed to remove collaborator.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-xl rounded-2xl bg-[#090d10] border border-white/15 p-6 shadow-2xl text-left flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2 text-white font-mono font-bold text-sm uppercase tracking-wider">
            <Users size={16} className="text-[#C29B53]" />
            <span>Project Collaboration</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto py-4 space-y-6 flex-1 pr-1 custom-scrollbar">
          {/* Project Title and Instructions */}
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-zinc-400">
              Project Workspace
            </div>
            <div className="text-base font-bold text-white mt-0.5 font-sans">
              {project?.name || 'Loading project…'}
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Invite team members by email to collaborate on this project. Collaborators can run
              analyses and modify the workspace; Viewers have read-only access.
            </p>
          </div>

          {/* Feedback messages */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs font-mono flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs font-mono flex items-start gap-2">
              <Check size={14} className="shrink-0 text-emerald-400 mt-0.5" />
              <div className="flex-1">
                <div>{successMessage}</div>
                {isBackendDelivered === false && (
                  <div className="text-[10px] text-emerald-400/80 mt-1">
                    Backend collaboration API (/api/collaborators) is currently offline. Member is
                    active for this local browser environment.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Invite Section (Only Owner & Collaborator can invite) */}
          {isOwner || userRole === 'collaborator' ? (
            <form
              onSubmit={handleSendInvite}
              className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-3"
            >
              <div className="text-xs font-mono font-semibold uppercase tracking-wider text-[#C29B53] flex items-center gap-1.5">
                <UserPlus size={13} />
                <span>Invite New Member</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="analyst@agency.gov"
                  disabled={submitting}
                  className="flex-1 px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-xs text-white placeholder:text-zinc-600 font-mono outline-none focus:border-[#C29B53] transition-colors"
                />

                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'collaborator' | 'viewer')}
                  disabled={submitting}
                  aria-label="Collaborator role"
                  className="px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-xs text-zinc-200 font-mono outline-none focus:border-[#C29B53] cursor-pointer"
                >
                  <option value="collaborator">Collaborator (Edit)</option>
                  <option value="viewer">Viewer (View only)</option>
                </select>

                <button
                  type="submit"
                  disabled={submitting || !inviteEmail.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-[#C29B53] hover:bg-[#CCA563] text-black transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Sending…</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={13} />
                      <span>Invite</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500">
                <Info size={11} className="shrink-0" />
                <span>
                  Collaborators can execute queries and add chats. Viewers can inspect findings but
                  cannot edit.
                </span>
              </div>
            </form>
          ) : (
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 text-xs font-mono text-zinc-400 flex items-center gap-2">
              <Eye size={14} className="text-zinc-500" />
              <span>You have Viewer access on this project. Only project editors can invite members.</span>
            </div>
          )}

          {/* Members List */}
          <div className="space-y-2">
            <div className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center justify-between">
              <span>Project Members</span>
              <span className="text-zinc-500 font-mono text-[11px]">
                {(project?.collaborators?.length || 0) + 1} member
                {(project?.collaborators?.length || 0) + 1 === 1 ? '' : 's'}
              </span>
            </div>

            {loading ? (
              <div className="py-6 text-center text-xs font-mono text-zinc-500">
                Loading members…
              </div>
            ) : (
              <div className="space-y-2">
                {/* Project Owner */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/10">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      {project?.ownerEmail
                        ? project.ownerEmail.substring(0, 2).toUpperCase()
                        : 'OW'}
                    </div>
                    <div className="min-w-0 truncate">
                      <div className="text-xs font-semibold text-white truncate flex items-center gap-1.5">
                        <span>{project?.ownerEmail || 'Project Owner'}</span>
                        <Crown size={12} className="text-amber-400 shrink-0" />
                      </div>
                      <div className="text-[10px] font-mono text-zinc-500">
                        {isOwner ? 'You (Project Creator)' : 'Project Owner'}
                      </div>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-mono uppercase tracking-wider font-semibold">
                    Owner
                  </span>
                </div>

                {/* Collaborators */}
                {project?.collaborators && project.collaborators.length > 0 ? (
                  project.collaborators.map((collab: ProjectCollaborator) => {
                    const initials = collab.email.substring(0, 2).toUpperCase();
                    return (
                      <div
                        key={collab.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/10"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-[#C29B53]/15 border border-[#C29B53]/30 text-[#C29B53] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0 truncate">
                            <div className="text-xs font-semibold text-white truncate">
                              {collab.name || collab.email}
                            </div>
                            <div className="text-[10px] font-mono text-zinc-500 truncate">
                              {collab.email} · Added{' '}
                              {new Date(collab.addedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isOwner ? (
                            <select
                              value={collab.role}
                              onChange={(e) =>
                                handleRoleChange(
                                  collab.id,
                                  e.target.value as 'collaborator' | 'viewer'
                                )
                              }
                              aria-label={`Role for ${collab.email}`}
                              className="px-2 py-1 rounded-lg bg-black/60 border border-white/15 text-[11px] text-zinc-300 font-mono outline-none focus:border-[#C29B53] cursor-pointer"
                            >
                              <option value="collaborator">Collaborator</option>
                              <option value="viewer">Viewer</option>
                            </select>
                          ) : (
                            <span
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono uppercase tracking-wider font-semibold border ${
                                collab.role === 'collaborator'
                                  ? 'bg-[#C29B53]/10 border-[#C29B53]/25 text-[#C29B53]'
                                  : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                              }`}
                            >
                              {collab.role === 'collaborator' ? 'Collaborator' : 'Viewer'}
                            </span>
                          )}

                          {isOwner && (
                            <button
                              type="button"
                              onClick={() => handleRemove(collab.id, collab.email)}
                              title="Remove member"
                              className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-950/20 transition-colors cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-white/10 text-center text-xs font-mono text-zinc-500">
                    No collaborators added yet. Invite colleagues above.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-zinc-500 shrink-0">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-[#C29B53]" />
            <span>Authenticated Role Enforcement Active</span>
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
