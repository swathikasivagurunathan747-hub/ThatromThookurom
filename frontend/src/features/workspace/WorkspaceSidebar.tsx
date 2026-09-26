import { useState } from 'react';
import {
  Plus,
  FolderPlus,
  Folder,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  Trash2,
  Edit3,
  Settings,
  User as UserIcon,
  ChevronLeft,
  Menu,
  Clock,
  Sparkles,
  Users,
  Share2,
} from 'lucide-react';
import type { Project, Chat } from '../../types';
import { formatRelativeTime } from '../../services/workspaceService';
import { getCurrentSessionUser } from '../../services/authService';

interface WorkspaceSidebarProps {
  projects: Project[];
  chats: Chat[];
  activeProjectId: string | null;
  activeChatId: string | null;
  onSelectProject: (id: string) => void;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onNewProject: () => void;
  onRenameProject: (project: Project) => void;
  onDeleteProject: (project: Project) => void;
  onShareProject?: (project: Project) => void;
  onCollaborateProject?: (project: Project) => void;
  onRenameChat: (chat: Chat) => void;
  onDeleteChat: (chat: Chat) => void;
  onOpenSettings: () => void;
  onLoginClick?: () => void;
}

export function WorkspaceSidebar({
  projects,
  chats,
  activeProjectId,
  activeChatId,
  onSelectProject,
  onSelectChat,
  onNewChat,
  onNewProject,
  onRenameProject,
  onDeleteProject,
  onShareProject,
  onCollaborateProject,
  onRenameChat,
  onDeleteChat,
  onOpenSettings,
  onLoginClick,
}: WorkspaceSidebarProps) {
  // Collapsible sections
  const [projectsCollapsed, setProjectsCollapsed] = useState(false);
  const [chatsCollapsed, setChatsCollapsed] = useState(false);

  // Active context menus
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Sidebar collapse state
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Authenticated user profile
  const user = getCurrentSessionUser();

  // Standalone chats (those not assigned to a project)
  const standaloneChats = chats.filter((c) => !c.projectId);

  const sidebarContent = (
    <div className="flex flex-col h-full select-none text-left">
      {/* ── TOP HEADER: BRANDING & COLLAPSE ── */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#C29B53]/15 border border-[#C29B53]/30 flex items-center justify-center text-[#C29B53] shadow-sm">
            <Sparkles size={16} />
          </div>
          <div>
            <div className="text-xs font-mono font-bold tracking-[0.2em] uppercase text-white">
              SATQUERY
            </div>
            <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
              Earth Observation
            </div>
          </div>
        </div>

        {/* Desktop Collapse Button */}
        <button
          type="button"
          onClick={() => setIsCollapsed(true)}
          title="Collapse Sidebar"
          className="hidden md:flex p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      {/* ── TOP ACTION BUTTONS: + NEW CHAT & + NEW PROJECT ── */}
      <div className="p-3 space-y-2 border-b border-white/10">
        <button
          type="button"
          onClick={() => {
            onNewChat();
            setMobileDrawerOpen(false);
          }}
          style={{ background: '#C29B53', color: '#000000' }}
          className="w-full py-2.5 px-3.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider hover:brightness-110 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>New Chat</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onNewProject();
            setMobileDrawerOpen(false);
          }}
          style={{ background: 'rgba(255,255,255,0.06)' }}
          className="w-full py-2 px-3.5 rounded-xl text-xs font-mono text-zinc-200 hover:text-white hover:bg-white/[0.12] border border-white/15 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <FolderPlus size={15} className="text-[#C29B53]" />
          <span>New Project</span>
        </button>
      </div>

      {/* ── SCROLLABLE LISTS: PROJECTS & CHATS ── */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-5">
        {/* PROJECTS SECTION */}
        <div>
          <div className="flex items-center justify-between px-2 py-1">
            <button
              type="button"
              onClick={() => setProjectsCollapsed(!projectsCollapsed)}
              className="flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-[0.14em] text-zinc-300 hover:text-white transition-colors cursor-pointer"
            >
              {projectsCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
              <span>Projects</span>
              <span className="text-[10px] text-zinc-500 font-normal ml-1">
                ({projects.length})
              </span>
            </button>
            <button
              type="button"
              onClick={onNewProject}
              title="Create New Project"
              className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
            >
              <Plus size={13} />
            </button>
          </div>

          {!projectsCollapsed && (
            <div className="mt-1 space-y-0.5">
              {projects.length === 0 ? (
                <div className="px-3 py-3 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                  <div className="text-[11px] font-mono text-zinc-500">No projects yet.</div>
                  <button
                    type="button"
                    onClick={onNewProject}
                    className="mt-1 text-[10px] font-mono text-[#C29B53] hover:underline"
                  >
                    + New Project
                  </button>
                </div>
              ) : (
                projects.map((proj) => {
                  const isActive = activeProjectId === proj.id;
                  const menuOpen = activeMenuId === `proj_${proj.id}`;
                  return (
                    <div
                      key={proj.id}
                      onClick={() => {
                        onSelectProject(proj.id);
                        setMobileDrawerOpen(false);
                      }}
                      className={`group relative flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-sans transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#C29B53]/15 text-[#C29B53] border border-[#C29B53]/30 shadow-sm font-semibold'
                          : 'text-zinc-300 hover:text-white hover:bg-white/[0.05] border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Folder
                          size={13}
                          className={`shrink-0 ${isActive ? 'text-[#C29B53]' : 'text-zinc-500 group-hover:text-zinc-300'}`}
                        />
                        <div className="min-w-0 flex-1 truncate">
                          <div className="truncate flex items-center gap-1.5">
                            <span className="truncate">{proj.name}</span>
                            {((proj.collaborators && proj.collaborators.length > 0) ||
                              proj.shareConfig?.isPublic) && (
                              <Users
                                size={11}
                                className="shrink-0 text-[#C29B53] opacity-80"
                                title="Shared or Collaborative Project"
                              />
                            )}
                          </div>
                          <div className="text-[9px] font-mono text-zinc-500 flex items-center gap-1">
                            <Clock size={9} />
                            <span>{formatRelativeTime(proj.updatedAt)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Context menu button */}
                      <div
                        className="relative"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(menuOpen ? null : `proj_${proj.id}`);
                        }}
                      >
                        <button
                          type="button"
                          className="p-1 rounded text-zinc-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical size={13} />
                        </button>

                        {menuOpen && (
                          <div
                            className="absolute right-0 top-full mt-1 w-32 rounded-xl bg-[#090d10] border border-white/15 shadow-2xl py-1 z-30 font-mono text-[11px]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                onRenameProject(proj);
                              }}
                              className="w-full px-3 py-1.5 text-left text-zinc-300 hover:text-white hover:bg-white/[0.06] flex items-center gap-2 cursor-pointer"
                            >
                              <Edit3 size={11} />
                              <span>Rename</span>
                            </button>
                            {onShareProject && (
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onShareProject(proj);
                                }}
                                className="w-full px-3 py-1.5 text-left text-zinc-300 hover:text-white hover:bg-white/[0.06] flex items-center gap-2 cursor-pointer"
                              >
                                <Share2 size={11} />
                                <span>Share</span>
                              </button>
                            )}
                            {onCollaborateProject && (
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onCollaborateProject(proj);
                                }}
                                className="w-full px-3 py-1.5 text-left text-zinc-300 hover:text-white hover:bg-white/[0.06] flex items-center gap-2 cursor-pointer"
                              >
                                <Users size={11} />
                                <span>Collaborate</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                onDeleteProject(proj);
                              }}
                              className="w-full px-3 py-1.5 text-left text-red-400 hover:bg-red-950/30 flex items-center gap-2 cursor-pointer"
                            >
                              <Trash2 size={11} />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* CHATS SECTION */}
        <div>
          <div className="flex items-center justify-between px-2 py-1">
            <button
              type="button"
              onClick={() => setChatsCollapsed(!chatsCollapsed)}
              className="flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-[0.14em] text-zinc-300 hover:text-white transition-colors cursor-pointer"
            >
              {chatsCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
              <span>Chats</span>
              <span className="text-[10px] text-zinc-500 font-normal ml-1">
                ({standaloneChats.length})
              </span>
            </button>
            <button
              type="button"
              onClick={onNewChat}
              title="Create New Chat"
              className="p-1 rounded-md text-[#C29B53] hover:text-white hover:bg-[#C29B53]/20 transition-colors cursor-pointer"
            >
              <Plus size={13} />
            </button>
          </div>

          {!chatsCollapsed && (
            <div className="mt-1 space-y-0.5">
              {standaloneChats.length === 0 ? (
                <div className="px-3 py-3 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                  <div className="text-[11px] font-mono text-zinc-500">No chats yet.</div>
                  <button
                    type="button"
                    onClick={onNewChat}
                    className="mt-1 text-[10px] font-mono text-[#C29B53] hover:underline"
                  >
                    + New Chat
                  </button>
                </div>
              ) : (
                standaloneChats.map((chat) => {
                  const isActive = activeChatId === chat.id;
                  const menuOpen = activeMenuId === `chat_${chat.id}`;
                  return (
                    <div
                      key={chat.id}
                      onClick={() => {
                        onSelectChat(chat.id);
                        setMobileDrawerOpen(false);
                      }}
                      className={`group relative flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-sans transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#C29B53]/15 text-[#C29B53] border border-[#C29B53]/30 shadow-sm font-semibold'
                          : 'text-zinc-300 hover:text-white hover:bg-white/[0.05] border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <MessageSquare
                          size={13}
                          className={`shrink-0 ${isActive ? 'text-[#C29B53]' : 'text-zinc-500 group-hover:text-zinc-300'}`}
                        />
                        <div className="min-w-0 flex-1 truncate">
                          <div className="truncate">{chat.title}</div>
                          <div className="text-[9px] font-mono text-zinc-500 flex items-center gap-1">
                            <Clock size={9} />
                            <span>{formatRelativeTime(chat.updatedAt)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Context menu button */}
                      <div
                        className="relative"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(menuOpen ? null : `chat_${chat.id}`);
                        }}
                      >
                        <button
                          type="button"
                          className="p-1 rounded text-zinc-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical size={13} />
                        </button>

                        {menuOpen && (
                          <div
                            className="absolute right-0 top-full mt-1 w-28 rounded-xl bg-[#090d10] border border-white/15 shadow-2xl py-1 z-30 font-mono text-[11px]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                onRenameChat(chat);
                              }}
                              className="w-full px-3 py-1.5 text-left text-zinc-300 hover:text-white hover:bg-white/[0.06] flex items-center gap-2 cursor-pointer"
                            >
                              <Edit3 size={11} />
                              <span>Rename</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                onDeleteChat(chat);
                              }}
                              className="w-full px-3 py-1.5 text-left text-red-400 hover:bg-red-950/30 flex items-center gap-2 cursor-pointer"
                            >
                              <Trash2 size={11} />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── BOTTOM FOOTER: PROFILE & SETTINGS ── */}
      <div className="p-3 border-t border-white/10 space-y-1">
        {/* Settings button */}
        <button
          type="button"
          onClick={() => {
            onOpenSettings();
            setMobileDrawerOpen(false);
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-mono text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
        >
          <Settings size={14} />
          <span>Settings</span>
        </button>

        {/* User profile card (uses actual user session) */}
        {user ? (
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="w-7 h-7 rounded-lg bg-[#C29B53]/20 border border-[#C29B53]/30 flex items-center justify-center text-[#C29B53] shrink-0 font-mono text-xs font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1 truncate text-left">
              <div className="text-xs font-bold text-white truncate">{user.name}</div>
              <div className="text-[10px] font-mono text-zinc-400 truncate">
                {user.role || user.organization || user.email}
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={onLoginClick}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-mono text-[#C29B53] hover:bg-[#C29B53]/10 transition-colors cursor-pointer"
          >
            <UserIcon size={14} />
            <span>Sign In / Profile</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* ── MOBILE TRIGGER ── */}
      <div className="md:hidden fixed top-2 left-2 z-50">
        <button
          type="button"
          onClick={() => setMobileDrawerOpen(true)}
          aria-label="Open Workspace Menu"
          className="p-2 rounded-xl bg-black/80 border border-white/15 text-white shadow-xl backdrop-blur-md"
        >
          <Menu size={18} />
        </button>
      </div>

      {/* ── MOBILE DRAWER OVERLAY ── */}
      {mobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] bg-[#070a0c] border-r border-white/15 z-50 shadow-2xl h-full">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* ── DESKTOP COLLAPSED TRIGGER (when user collapsed sidebar) ── */}
      {isCollapsed && (
        <div className="hidden md:flex flex-col items-center py-3 px-1 border-r border-white/10 bg-[#06080a] shrink-0 w-12 z-30 justify-between">
          <div className="space-y-3 flex flex-col items-center">
            <button
              type="button"
              onClick={() => setIsCollapsed(false)}
              title="Expand Workspace Sidebar"
              className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-[#C29B53] border border-white/10 transition-all cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
            <button
              type="button"
              onClick={onNewChat}
              title="New Chat"
              className="p-2 rounded-xl bg-[#C29B53] text-black transition-all cursor-pointer"
            >
              <Plus size={16} />
            </button>
            <button
              type="button"
              onClick={onNewProject}
              title="New Project"
              className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border border-white/10 transition-colors cursor-pointer"
            >
              <FolderPlus size={15} />
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenSettings}
            title="Settings"
            className="p-2 rounded-xl text-zinc-500 hover:text-white transition-colors"
          >
            <Settings size={16} />
          </button>
        </div>
      )}

      {/* ── DESKTOP EXPANDED SIDEBAR (Standard width 260px) ── */}
      {!isCollapsed && (
        <aside
          className="hidden md:flex flex-col w-[260px] shrink-0 h-full select-none"
          style={{
            background: '#07090b',
            borderRight: '1px solid rgba(255,255,255,0.12)',
            zIndex: 40,
            boxShadow: '4px 0 24px rgba(0,0,0,0.5)',
          }}
        >
          {sidebarContent}
        </aside>
      )}
    </>
  );
}
