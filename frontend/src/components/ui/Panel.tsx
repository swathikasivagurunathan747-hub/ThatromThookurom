// Floating panel base — dark translucent, thin border

import React from 'react';

interface PanelProps {
  children: React.ReactNode;
  className?: string;
  noPad?: boolean;
}

export function Panel({ children, className = '', noPad = false }: PanelProps) {
  return (
    <div
      className={`panel shadow-[0_4px_24px_rgba(0,0,0,0.5)] ${noPad ? '' : 'p-3'} ${className}`}
    >
      {children}
    </div>
  );
}

interface PanelHeaderProps {
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export function PanelHeader({ children, className = '', action }: PanelHeaderProps) {
  return (
    <div className={`flex items-center justify-between mb-2.5 ${className}`}>
      <span className="text-[9px] font-semibold tracking-[0.14em] uppercase text-[#8a9092]">
        {children}
      </span>
      {action}
    </div>
  );
}

interface PanelDividerProps {
  className?: string;
}

export function PanelDivider({ className = '' }: PanelDividerProps) {
  return <div className={`border-t border-white/[0.06] my-2.5 ${className}`} />;
}
