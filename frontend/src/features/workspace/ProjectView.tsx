// ============================================================
// SATQUERY AI — Project View
// Supports View Mode vs Edit Mode, role-based permission gating
// (Owner/Collaborator vs Viewer), project metadata editing,
// project sharing modal, and collaborator management.
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import {
  Folder,
  Plus,
  MessageSquare,
  Clock,
  MoreVertical,
  Trash2,
  Edit3,
  Calendar,
  Layers,
  Users,
  Share2,
  ShieldCheck,
  Eye,
  Crown,
  Lock,
  Globe,
  Check,
} from 'lucide-react';
import {
  getProject,
  getChats,
  createChat,
  deleteChat,
  renameChat,
  updateProjectDetails,
  formatRelativeTime,
  getUserProjectRole,
} from '../../services/workspaceService';
import type { Project, Chat, ProjectRole } from '../../types';
import { RenameModal } from './RenameModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { CollaborateModal } from './CollaborateModal';
import { ProjectShareModal } from './ProjectShareModal';

interface ProjectViewProps {
  projectId: string;
  onOpenChat: (chatId: string) => void;
  onProjectUpdated: () => void;
  onProjectDeleted: () => void;
}

export function ProjectView({
  projectId,
  onOpenChat,
  onProjectUpdated,
  onProjectDeleted,
}: ProjectViewProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  // View / Edit Mode state
  const [mode, setMode] = useState<'view' | 'edit'>('view');

  // Inline metadata editing
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descValue, setDescValue] = useState('');
  const [descSaving, setDescSaving] = useState(false);

  // Modals
  const [isRenameProjectOpen, setIsRenameProjectOpen] = useState(false);
  const [isDeleteProjectOpen, setIsDeleteProjectOpen] = useState(false);
  const [chatToRename, setChatToRename] = useState<Chat | null>(null);
  const [chatToDelete, setChatToDelete] = useState<Chat | null>(null);
  const [activeMenuChatId, setActiveMenuChatId] = useState<string | null>(null);
  const [isCollaborateOpen, setIsCollaborateOpen] = useState(false);
  const [isShareProjectOpen, setIsShareProjectOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [p, cList] = await Promise.all([getProject(projectId), getChats(projectId)]);
    setProject(p || null);
    setChats(cList);
    if (p) {
      setDescValue(p.description || '');
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Evaluate role from authenticated session & project members
  const userRole: ProjectRole = getUserProjectRole(project);
  const canEdit = userRole === 'owner' || userRole === 'collaborator';
  const isOwner = userRole === 'owner';

  // Ensure viewers cannot stay in Edit Mode
  useEffect(() => {
    if (!canEdit && mode === 'edit') {
      setMode('view');
    }
  }, [canEdit, mode]);

  const handleCreateNewChat = async () => {
    if (!canEdit) return;
    const newChat = await createChat(projectId, 'Dashboard');
    onOpenChat(newChat.id);
  };

  const handleDeleteChat = async () => {
    if (!chatToDelete) return;
    await deleteChat(chatToDelete.id);
    setChatToDelete(null);
    loadData();
  };

  const handleSaveDescription = async () => {
    if (!project) return;
    setDescSaving(true);
    try {
      await updateProjectDetails(project.id, { description: descValue });
      await loadData();
      setIsEditingDesc(false);
      onProjectUpdated();
    } finally {
      setDescSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-zinc-500 font-mono text-xs">
        Loading project workspace…
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
        <Folder size={32} className="text-zinc-600 mb-3" />
        <h2 className="text-lg font-bold text-white uppercase font-mono">Project Not Found</h2>
        <p className="text-xs text-zinc-400 mt-1">This project may have been deleted.</p>
      </div>
    );
  }

  const isPublicShareActive = Boolean(project.shareConfig?.allowPublicView);
  const collaborators = project.collaborators || [];

  return (
    <div className="flex-1 overflow-y-auto p-6 sm:p-10 text-left font-sans select-none max-w-5xl mx-auto w-full">
      {/* ── ROLE / MODE BANNER ── */}
      <div className="mb-6">
        {mode === 'edit' ? (
          <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs font-mono flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="font-bold uppercase tracking-wider text-amber-300">
                Edit Mode Active
              </span>
              <span className="text-amber-200/80 hidden sm:inline">
                — You have authorized permissions ({userRole}) to modify project parameters and chats.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setMode('view')}
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-white text-[11px] font-mono transition-colors cursor-pointer"
            >
              Switch to View Mode
            </button>
          </div>
        ) : !canEdit ? (
          <div className="p-3 rounded-2xl bg-blue-950/40 border border-blue-500/30 text-blue-200 text-xs font-mono flex items-center gap-2">
            <Eye size={14} className="text-blue-400 shrink-0" />
            <span>
              READ-ONLY MODE: You have Viewer access. You can inspect chats and visual evidence but
              cannot modify contents or run new analyses.
            </span>
          </div>
        ) : (
          <div className="p-2.5 rounded-2xl bg-white/[0.02] border border-white/10 text-zinc-400 text-xs font-mono flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye size={13} className="text-[#C29B53]" />
              <span>View Mode — Project metadata and structure are protected.</span>
            </div>
            <button
              type="button"
              onClick={() => setMode('edit')}
              className="text-[#C29B53] hover:underline font-semibold cursor-pointer"
            >
              Enable Edit Mode
            </button>
          </div>
        )}
      </div>

      {/* ── PROJECT HEADER CONTAINER ── */}
      <div className="rounded-2xl p-6 sm:p-8 backdrop-blur-2xl bg-black/60 border border-white/15 shadow-[0_20px_80px_rgba(0,0,0,0.85)] mb-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="flex-1 min-w-0">
            {/* Top metadata tags */}
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono font-semibold tracking-[0.18em] uppercase">
              <span className="flex items-center gap-1.5 text-[#C29B53]">
                <Folder size={13} />
                <span>Project Container</span>
              </span>

              <span className="text-zinc-600">·</span>

              {/* Role badge */}
              <span
                className={`px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                  isOwner
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                    : canEdit
                    ? 'bg-[#C29B53]/10 border-[#C29B53]/30 text-[#C29B53]'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                }`}
              >
                {isOwner && <Crown size={10} />}
                <span>Role: {userRole}</span>
              </span>

              {/* Public link status badge */}
              {isPublicShareActive && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 flex items-center gap-1">
                  <Globe size={10} />
                  <span>Public Link Active</span>
                </span>
              )}
            </div>

            {/* Project Title */}
            <div className="flex items-center gap-3 mt-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white uppercase tracking-tight truncate">
                {project.name}
              </h1>
              {mode === 'edit' && canEdit && (
                <button
                  type="button"
                  onClick={() => setIsRenameProjectOpen(true)}
                  title="Rename Project"
                  className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
                >
                  <Edit3 size={14} />
                </button>
              )}
            </div>

            {/* Project Description */}
            <div className="mt-2.5">
              {mode === 'edit' && isEditingDesc ? (
                <div className="space-y-2 max-w-2xl">
                  <textarea
                    value={descValue}
                    onChange={(e) => setDescValue(e.target.value)}
                    placeholder="Describe this project's remote-sensing objectives…"
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-[#C29B53]/50 text-xs text-zinc-200 font-mono outline-none"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSaveDescription}
                      disabled={descSaving}
                      className="px-3 py-1.5 rounded-lg bg-[#C29B53] hover:bg-[#CCA563] text-black text-xs font-mono font-bold uppercase transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Check size={12} />
                      <span>Save Description</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDescValue(project.description || '');
                        setIsEditingDesc(false);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 text-xs font-mono uppercase transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <p className="text-sm text-zinc-300 max-w-2xl leading-relaxed">
                    {project.description || (
                      <span className="text-xs text-zinc-500 italic font-mono">
                        No description provided.
                      </span>
                    )}
                  </p>
                  {mode === 'edit' && canEdit && (
                    <button
                      type="button"
                      onClick={() => setIsEditingDesc(true)}
                      className="text-[11px] font-mono text-[#C29B53] hover:underline cursor-pointer shrink-0 mt-0.5"
                    >
                      Edit
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Dates */}
            <div className="flex items-center gap-4 mt-4 text-xs font-mono text-zinc-500">
              <span className="flex items-center gap-1.5">
                <Calendar size={12} />
                Created {new Date(project.createdAt).toLocaleDateString()}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1.5">
                <Clock size={12} />
                Updated {formatRelativeTime(project.updatedAt)}
              </span>
            </div>
          </div>

          {/* Action & Toggle Controls */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 shrink-0">
            {/* View Mode / Edit Mode Switch */}
            <div className="flex items-center p-1 rounded-xl bg-black/60 border border-white/15 shadow-inner">
              <button
                type="button"
                onClick={() => setMode('view')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                  mode === 'view'
                    ? 'bg-[#C29B53] text-black shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Eye size={12} />
                <span>View Mode</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (canEdit) setMode('edit');
                }}
                disabled={!canEdit}
                title={!canEdit ? 'Viewers cannot switch to Edit Mode' : 'Switch to Edit Mode'}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                  mode === 'edit'
                    ? 'bg-amber-400 text-black shadow-sm'
                    : canEdit
                    ? 'text-zinc-400 hover:text-white cursor-pointer'
                    : 'text-zinc-600 cursor-not-allowed opacity-50'
                }`}
              >
                {!canEdit ? <Lock size={12} /> : <Edit3 size={12} />}
                <span>Edit Mode</span>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {canEdit && mode === 'edit' && (
                <button
                  type="button"
                  onClick={handleCreateNewChat}
                  className="px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-[#C29B53] hover:bg-[#CCA563] text-black transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>New Chat</span>
                </button>
              )}

              {/* Share Project Modal trigger */}
              <button
                type="button"
                onClick={() => setIsShareProjectOpen(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-mono font-semibold uppercase tracking-wider bg-white/[0.05] hover:bg-white/[0.1] text-zinc-200 hover:text-white border border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Share2 size={13} className="text-[#C29B53]" />
                <span>Share</span>
              </button>

              {/* Project Collaborate Modal trigger */}
              <button
                type="button"
                onClick={() => setIsCollaborateOpen(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-mono font-semibold uppercase tracking-wider bg-white/[0.05] hover:bg-white/[0.1] text-zinc-200 hover:text-white border border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Users size={13} className="text-[#C29B53]" />
                <span>Members ({collaborators.length + 1})</span>
              </button>

              {/* Delete Project (Owner Only in Edit Mode) */}
              {isOwner && mode === 'edit' && (
                <button
                  type="button"
                  onClick={() => setIsDeleteProjectOpen(true)}
                  title="Delete Project Container"
                  className="p-2 rounded-xl bg-red-950/20 hover:bg-red-950/40 text-red-400 hover:text-red-300 border border-red-500/20 transition-colors cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── COLLABORATOR AVATARS STRIP ── */}
        <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-3">
            <span className="text-zinc-500 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-[#C29B53]" />
              <span>Project Access:</span>
            </span>

            {/* Owner pill */}
            <div
              title={`Owner: ${project.ownerEmail || 'Unknown'}`}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px]"
            >
              <Crown size={11} />
              <span className="truncate max-w-[120px]">
                {project.ownerEmail ? project.ownerEmail.split('@')[0] : 'Owner'}
              </span>
            </div>

            {/* Collaborators pills */}
            {collaborators.slice(0, 3).map((collab) => (
              <div
                key={collab.id}
                title={`${collab.email} (${collab.role})`}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/[0.04] border border-white/10 text-zinc-300 text-[11px]"
              >
                <span className="w-4 h-4 rounded-full bg-[#C29B53]/20 text-[#C29B53] font-bold text-[9px] flex items-center justify-center">
                  {collab.email[0].toUpperCase()}
                </span>
                <span className="truncate max-w-[100px]">{collab.name || collab.email}</span>
                <span className="text-[9px] text-zinc-500 uppercase">({collab.role[0]})</span>
              </div>
            ))}

            {collaborators.length > 3 && (
              <span className="text-[11px] text-zinc-500">+{collaborators.length - 3} more</span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsCollaborateOpen(true)}
            className="text-[#C29B53] hover:underline text-[11px] font-mono cursor-pointer"
          >
            + Invite Collaborator
          </button>
        </div>
      </div>

      {/* ── PROJECT CHATS SECTION ── */}
      <div>
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-[0.16em] text-white">
              Project Chats & Analyses
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/[0.06] text-zinc-300 border border-white/10">
              {chats.length}
            </span>
          </div>

          {canEdit && mode === 'edit' && chats.length > 0 && (
            <button
              type="button"
              onClick={handleCreateNewChat}
              className="text-xs font-mono text-[#C29B53] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus size={13} />
              <span>Add Chat</span>
            </button>
          )}
        </div>

        {chats.length === 0 ? (
          /* Empty state */
          <div className="rounded-2xl p-12 border-2 border-dashed border-white/15 text-center flex flex-col items-center justify-center bg-black/40 backdrop-blur-md">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-zinc-500 mb-3">
              <MessageSquare size={22} />
            </div>
            <p className="text-base font-bold text-white font-sans">
              This project has no chats yet.
            </p>
            <p className="text-xs text-zinc-400 font-mono mt-1 mb-5">
              {canEdit
                ? 'Start an analysis session tied to this study.'
                : 'Project owner or collaborators have not published chats yet.'}
            </p>
            {canEdit && (
              <button
                type="button"
                onClick={handleCreateNewChat}
                className="px-5 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-[#C29B53] hover:bg-[#CCA563] text-black transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} />
                <span>Create First Chat</span>
              </button>
            )}
          </div>
        ) : (
          /* Chats grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => onOpenChat(chat.id)}
                className="group relative rounded-xl p-5 bg-black/60 hover:bg-white/[0.04] border border-white/10 hover:border-[#C29B53]/50 transition-all cursor-pointer shadow-lg backdrop-blur-md text-left flex flex-col justify-between min-h-[140px]"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-[#C29B53]/10 border border-[#C29B53]/20 flex items-center justify-center text-[#C29B53] shrink-0">
                        <MessageSquare size={13} />
                      </div>
                      <h3 className="text-sm font-bold text-white group-hover:text-[#C29B53] transition-colors truncate">
                        {chat.title}
                      </h3>
                    </div>

                    {/* Context Menu Button (Only available in Edit Mode for authorized editors) */}
                    {canEdit && mode === 'edit' && (
                      <div
                        className="relative"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuChatId(activeMenuChatId === chat.id ? null : chat.id);
                        }}
                      >
                        <button
                          type="button"
                          className="p-1 rounded text-zinc-500 hover:text-white hover:bg-white/[0.08]"
                        >
                          <MoreVertical size={14} />
                        </button>

                        {/* Dropdown Menu */}
                        {activeMenuChatId === chat.id && (
                          <div
                            className="absolute right-0 top-full mt-1 w-32 rounded-xl bg-[#090d10] border border-white/15 shadow-2xl py-1 z-30 font-mono text-[11px]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuChatId(null);
                                setChatToRename(chat);
                              }}
                              className="w-full px-3 py-1.5 text-left text-zinc-300 hover:text-white hover:bg-white/[0.06] flex items-center gap-2 cursor-pointer"
                            >
                              <Edit3 size={12} />
                              <span>Rename</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuChatId(null);
                                setChatToDelete(chat);
                              }}
                              className="w-full px-3 py-1.5 text-left text-red-400 hover:bg-red-950/30 flex items-center gap-2 cursor-pointer"
                            >
                              <Trash2 size={12} />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Latest query preview */}
                  <p className="text-xs text-zinc-400 line-clamp-2 mt-3 font-sans">
                    {chat.interactions.length > 0
                      ? `“${chat.interactions[chat.interactions.length - 1].query}”`
                      : 'No queries performed yet.'}
                  </p>
                </div>

                {/* Card footer */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5 text-[10px] font-mono text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Clock size={11} />
                    {formatRelativeTime(chat.updatedAt)}
                  </span>
                  <span className="flex items-center gap-1 text-zinc-400">
                    <Layers size={11} />
                    {chat.interactions.length} interaction
                    {chat.interactions.length === 1 ? '' : 's'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── MODALS ── */}
      <RenameModal
        isOpen={isRenameProjectOpen}
        initialValue={project.name}
        itemType="Project"
        onClose={() => setIsRenameProjectOpen(false)}
        onSubmit={async (newName) => {
          const { renameProject } = await import('../../services/workspaceService');
          await renameProject(project.id, newName);
          onProjectUpdated();
          loadData();
        }}
      />

      <RenameModal
        isOpen={chatToRename !== null}
        initialValue={chatToRename?.title || ''}
        itemType="Chat"
        onClose={() => setChatToRename(null)}
        onSubmit={async (newName) => {
          if (!chatToRename) return;
          await renameChat(chatToRename.id, newName);
          setChatToRename(null);
          loadData();
        }}
      />

      <DeleteConfirmModal
        isOpen={isDeleteProjectOpen}
        itemTitle={project.name}
        itemType="Project"
        onClose={() => setIsDeleteProjectOpen(false)}
        onConfirm={async () => {
          const { deleteProject } = await import('../../services/workspaceService');
          await deleteProject(project.id);
          onProjectDeleted();
        }}
      />

      <DeleteConfirmModal
        isOpen={chatToDelete !== null}
        itemTitle={chatToDelete?.title || ''}
        itemType="Chat"
        onClose={() => setChatToDelete(null)}
        onConfirm={handleDeleteChat}
      />

      <CollaborateModal
        isOpen={isCollaborateOpen}
        projectId={project.id}
        onClose={() => setIsCollaborateOpen(false)}
        onCollaboratorsUpdated={() => {
          loadData();
          onProjectUpdated();
        }}
      />

      <ProjectShareModal
        isOpen={isShareProjectOpen}
        projectId={project.id}
        onClose={() => setIsShareProjectOpen(false)}
        onOpenCollaborate={() => setIsCollaborateOpen(true)}
      />
    </div>
  );
}
