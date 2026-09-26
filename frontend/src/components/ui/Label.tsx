// Compact uppercase operational label

import React from 'react';

interface LabelProps {
  children: React.ReactNode;
  className?: string;
  accent?: boolean;
}

export function Label({ children, className = '', accent = false }: LabelProps) {
  return (
    <span
      className={`text-[9px] font-medium tracking-[0.1em] uppercase select-none ${
        accent ? 'text-[#C29B53]' : 'text-[#8a9092]'
      } ${className}`}
    >
      {children}
    </span>
  );
}
