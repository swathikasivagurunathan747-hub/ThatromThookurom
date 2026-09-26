import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, Circle } from 'lucide-react';

interface AnalysisLoadingStateProps {
  title?: string;
  subtitle?: string;
  activePhaseIndex?: number;
  className?: string;
}

const DEFAULT_PHASES = [
  'Query received',
  'Processing satellite data',
  'Running analysis',
  'Preparing results',
];

export function AnalysisLoadingState({
  title = 'Analyzing satellite data...',
  subtitle = 'Processing your request... This may take a few moments.',
  activePhaseIndex,
  className = '',
}: AnalysisLoadingStateProps) {
  const [internalPhase, setInternalPhase] = useState(0);

  useEffect(() => {
    if (activePhaseIndex !== undefined) return;
    const interval = setInterval(() => {
      setInternalPhase((prev) => (prev < DEFAULT_PHASES.length - 1 ? prev + 1 : prev));
    }, 1800);
    return () => clearInterval(interval);
  }, [activePhaseIndex]);

  const currentPhase = activePhaseIndex !== undefined ? activePhaseIndex : internalPhase;

  return (
    <div
      className={`relative rounded-2xl p-8 backdrop-blur-2xl bg-black/85 border border-white/15 shadow-[0_20px_80px_rgba(0,0,0,0.95)] text-center max-w-lg mx-auto w-full select-none ${className}`}
    >
      {/* Restrained Orbital Radar Spinner */}
      <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
        {/* Outer orbital track */}
        <div className="absolute inset-0 rounded-full border border-white/10" />
        {/* Mid spinning track with gold accent */}
        <div className="absolute inset-2 rounded-full border border-t-[#C29B53] border-r-transparent border-b-white/10 border-l-transparent animate-spin" />
        {/* Inner reverse spin */}
        <div
          className="absolute inset-4 rounded-full border border-b-[#C29B53]/80 border-t-transparent border-l-transparent border-r-transparent animate-spin"
          style={{ animationDirection: 'reverse', animationDuration: '3s' }}
        />
        {/* Center glowing core */}
        <div className="w-2.5 h-2.5 rounded-full bg-[#C29B53] shadow-[0_0_12px_#C29B53]" />
      </div>

      {/* Main Title & Subtitle */}
      <h3 className="text-base sm:text-lg font-bold uppercase tracking-[0.16em] text-white font-mono mb-2">
        {title}
      </h3>
      <p className="text-xs text-zinc-400 font-sans mb-6 leading-relaxed">
        {subtitle}
      </p>

      {/* Lifecycle Progress Steps */}
      <div className="space-y-2.5 max-w-xs mx-auto text-left font-mono text-xs">
        {DEFAULT_PHASES.map((phase, idx) => {
          const isDone = idx < currentPhase;
          const isCurrent = idx === currentPhase;
          const isPending = idx > currentPhase;

          return (
            <div
              key={phase}
              className={`flex items-center gap-2.5 transition-colors duration-300 ${
                isCurrent
                  ? 'text-[#C29B53] font-semibold'
                  : isDone
                  ? 'text-zinc-300'
                  : 'text-zinc-600'
              }`}
            >
              {isDone && (
                <CheckCircle2 size={13} className="text-[#6A9971] shrink-0" />
              )}
              {isCurrent && (
                <span className="relative flex h-2.5 w-2.5 shrink-0 ml-0.5 mr-0.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C29B53] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#C29B53]" />
                </span>
              )}
              {isPending && (
                <Circle size={12} className="text-zinc-700 shrink-0" />
              )}
              <span className="tracking-wide text-[11px]">{phase}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
