import { useEffect, useState, useRef } from 'react';
import {
  Settings,
  Satellite,
  User as UserIcon,
  ChevronDown,
  LogOut,
  Shield,
  Activity,
} from 'lucide-react';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { checkHealth } from '../../api/services';
import type { Scene } from '../../types';
import type { User } from '../../services/authService';

interface TelemetryBarProps {
  scene: Scene;
  aoiArea: number;
  hideDetails?: boolean;
  centerTitle?: string;
  activeNavItem?: string;
  user?: User | null;
  onNavChange?: (nav: 'dashboard' | 'chat' | 'analyzer') => void;
  onDashboardClick?: () => void;
  onSettingsClick?: () => void;
  onProfileClick?: () => void;
  onLogoutClick?: () => void;
  onLoginClick?: () => void;
}

function TelemetryField({
  label,
  value,
  accent = false,
  mono = true,
}: {
  label: string;
  value: string;
  accent?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5 px-3.5 border-l border-white/[0.08] first:border-l-0">
      <span
        className="text-[10px] tracking-[0.12em] uppercase font-semibold shrink-0"
        style={{ color: '#7a8284' }}
      >
        {label}
      </span>
      <span
        className={`text-[12px] font-semibold tracking-wide shrink-0 ${
          mono ? 'font-mono' : ''
        } ${accent ? 'text-[#C29B53]' : 'text-[#e2e6e8]'}`}
      >
        {value}
      </span>
    </div>
  );
}

export function TelemetryBar({
  scene,
  aoiArea,
  hideDetails = false,
  centerTitle,
  activeNavItem = 'dashboard',
  user,
  onNavChange,
  onDashboardClick,
  onSettingsClick,
  onProfileClick,
  onLogoutClick,
  onLoginClick,
}: TelemetryBarProps) {
  const [utc, setUtc] = useState('');
  const [backendStatus, setBackendStatus] = useState<'connecting' | 'online' | 'offline'>('connecting');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Live UTC Clock
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const h = String(now.getUTCHours()).padStart(2, '0');
      const m = String(now.getUTCMinutes()).padStart(2, '0');
      const s = String(now.getUTCSeconds()).padStart(2, '0');
      setUtc(`${h}:${m}:${s} UTC`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Live Backend /health check
  useEffect(() => {
    let mounted = true;
    const runHealthCheck = async () => {
      try {
        const res = await checkHealth();
        if (mounted) {
          setBackendStatus('online');
        }
      } catch {
        if (mounted) {
          setBackendStatus('offline');
        }
      }
    };
    runHealthCheck();
    const interval = setInterval(runHealthCheck, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header
      className="flex items-center justify-between px-4 shrink-0 select-none"
      style={{
        height: '48px',
        background: 'rgba(5, 7, 9, 0.99)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        zIndex: 50,
      }}
    >
      {/* ── LEFT: ISRO Insignia & Quasar Mind / SatQuery Wordmark (Clickable -> Dashboard) ── */}
      <div
        onClick={onDashboardClick}
        className="flex items-center gap-3 cursor-pointer group"
        title="Return to Dashboard"
      >
        <div className="w-7 h-7 rounded-lg bg-white/95 p-1 flex items-center justify-center shadow-sm border border-white/30 shrink-0 group-hover:scale-105 transition-transform">
          <img src="/isro_logo.png" alt="ISRO Logo" className="h-full w-full object-contain" />
        </div>
        <div className="flex items-center gap-1.5 font-mono">
          <span className="text-sm font-bold tracking-[0.18em] uppercase text-white group-hover:text-zinc-200 transition-colors">
            QUASAR MIND
          </span>
          <span className="text-zinc-600 text-xs font-light">/</span>
          <span
            className="text-xs font-bold tracking-[0.16em] uppercase"
            style={{ color: '#C29B53' }}
          >
            SATQUERY AI
          </span>
        </div>
      </div>

      {/* ── CENTER: TOP NAVIGATION LINKS ── */}
      <nav className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl border border-white/10 font-mono text-xs">
        <button
          type="button"
          onClick={() => onNavChange?.('dashboard')}
          className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
            activeNavItem === 'dashboard'
              ? 'bg-[#C29B53] text-black font-bold shadow-sm'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Dashboard
        </button>
        <button
          type="button"
          onClick={() => onNavChange?.('chat')}
          className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
            activeNavItem === 'chat'
              ? 'bg-[#C29B53] text-black font-bold shadow-sm'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Chat Query AI
        </button>
        <button
          type="button"
          onClick={() => onNavChange?.('analyzer')}
          className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
            activeNavItem === 'analyzer' || activeNavItem === 'analyze'
              ? 'bg-[#C29B53] text-black font-bold shadow-sm'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Analyzer
        </button>
      </nav>

      {/* ── RIGHT: Live System Status + UTC + Profile Dropdown ── */}
      <div className="flex items-center gap-3.5" style={{ minWidth: '220px', justifyContent: 'flex-end' }}>
        {/* Real Backend Status Indicator */}
        <StatusBadge status={backendStatus} />

        <span
          className="text-[11px] font-mono tabular-nums font-medium hidden sm:inline"
          style={{ color: '#7a8284' }}
        >
          {utc}
        </span>

        {/* ── PROFILE DROPDOWN (Shown when Authenticated) ── */}
        {user ? (
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs text-white transition-all cursor-pointer"
            >
              <div className="w-5 h-5 rounded-full bg-[#C29B53]/20 border border-[#C29B53]/40 flex items-center justify-center text-[#C29B53] font-mono text-[10px] font-bold shrink-0">
                {(user.name || user.email || 'U').slice(0, 1).toUpperCase()}
              </div>
              <span className="font-mono text-[11px] max-w-[100px] truncate hidden sm:inline">
                {user.name || user.email.split('@')[0]}
              </span>
              <ChevronDown size={12} className="text-zinc-400" />
            </button>

            {/* Dropdown Menu */}
            {profileDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-[#0b0e12] border border-white/15 shadow-2xl py-2 z-50 font-mono text-xs text-left animate-fade-in">
                {/* User Info Header */}
                <div className="px-3.5 py-2 border-b border-white/10">
                  <div className="font-bold text-white truncate font-sans">{user.name || 'ISRO Analyst'}</div>
                  <div className="text-[10px] text-zinc-400 truncate mt-0.5">{user.email}</div>
                  <div className="text-[9px] text-[#C29B53] uppercase tracking-wider mt-1">
                    {user.organization || 'ISRO / Earth Observation'}
                  </div>
                </div>

                {/* Profile Action */}
                <button
                  type="button"
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    onProfileClick?.();
                  }}
                  className="w-full px-3.5 py-2 text-zinc-300 hover:text-white hover:bg-white/[0.06] flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Shield size={13} className="text-[#C29B53]" />
                  <span>Profile</span>
                </button>

                {/* Settings Action */}
                <button
                  type="button"
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    onSettingsClick?.();
                  }}
                  className="w-full px-3.5 py-2 text-zinc-300 hover:text-white hover:bg-white/[0.06] flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Settings size={13} />
                  <span>Settings</span>
                </button>

                {/* Logout Action */}
                <div className="pt-1 mt-1 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      onLogoutClick?.();
                    }}
                    className="w-full px-3.5 py-2 text-red-400 hover:text-red-300 hover:bg-red-950/30 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <LogOut size={13} />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Sign In Button (Only shown if unauthenticated on public view) */
          onLoginClick && (
            <button
              onClick={onLoginClick}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/[0.05] hover:bg-[rgba(194,155,83,0.15)] border border-white/[0.08] hover:border-[rgba(194,155,83,0.3)] text-xs text-[#d4d8da] hover:text-[#C29B53] transition-all cursor-pointer"
              title="Sign In"
            >
              <UserIcon size={13} />
              <span className="font-medium text-[11px]">Sign In</span>
            </button>
          )
        )}
      </div>
    </header>
  );
}
