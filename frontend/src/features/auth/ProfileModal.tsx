import React from 'react';
import { User, Shield, Building, Mail, Key, LogOut, X, CheckCircle2 } from 'lucide-react';
import { getCurrentSessionUser, logoutUser } from '../../services/authService';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export function ProfileModal({ isOpen, onClose, onLogout }: ProfileModalProps) {
  if (!isOpen) return null;

  const user = getCurrentSessionUser();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-[#090d10] border border-white/20 rounded-2xl shadow-2xl p-6 sm:p-7 text-left font-sans text-white select-none">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#C29B53]/15 border border-[#C29B53]/30 flex items-center justify-center text-[#C29B53]">
              <Shield size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-white">
                Institutional Profile
              </h3>
              <p className="text-[10px] font-mono text-zinc-400">
                Verified Credentials & Authorizations
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        {/* User Card */}
        <div className="my-5 p-4 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-full bg-[#C29B53]/20 border border-[#C29B53]/40 flex items-center justify-center text-[#C29B53] font-mono text-base font-bold shrink-0">
            {(user?.name || user?.email || 'IA').slice(0, 2).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <div className="text-sm font-bold text-white truncate font-sans">
              {user?.name || 'ISRO Analyst'}
            </div>
            <div className="text-xs font-mono text-[#C29B53] truncate mt-0.5">
              {user?.email || 'user@isro.gov.in'}
            </div>
          </div>
        </div>

        {/* Credentials & Details */}
        <div className="space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-2 text-zinc-400">
              <Building size={13} className="text-[#C29B53]" />
              <span>Organization</span>
            </div>
            <span className="font-semibold text-zinc-200">
              {user?.organization || 'ISRO / Earth Observation'}
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-2 text-zinc-400">
              <Key size={13} className="text-[#C29B53]" />
              <span>Role / Access</span>
            </div>
            <span className="font-semibold text-zinc-200">
              {user?.role || 'Remote Sensing Analyst'}
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-2 text-zinc-400">
              <CheckCircle2 size={13} className="text-[#6A9971]" />
              <span>Clearance Level</span>
            </div>
            <span className="text-emerald-400 font-bold">
              Level 3 (SIH Verified)
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onLogout}
            className="px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-red-950/40 hover:bg-red-950/70 text-red-300 border border-red-500/40 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut size={13} />
            <span>Sign Out</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/15 transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
