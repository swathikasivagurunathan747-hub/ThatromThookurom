import React, { useState } from 'react';
import { Map, Image as ImageIcon, GitCompare, Sparkles } from 'lucide-react';
import { MapBasedAnalysis } from './MapBasedAnalysis';
import { SingleImageAnalysis } from './SingleImageAnalysis';
import { BiTemporalAnalysis } from './BiTemporalAnalysis';
import { AerospaceBackground } from '../../components/ui/AerospaceBackground';
import { ReportModal } from '../reports/ReportModal';
import type { AnalysisResultData } from './AnalysisResultView';

export type AnalyzerMode = 'map-aoi' | 'single-map' | 'temporal';

interface AnalyzerHubProps {
  initialMode?: AnalyzerMode;
  onLocationChange?: (locationName?: string) => void;
}

export function AnalyzerHub({
  initialMode = 'map-aoi',
  onLocationChange,
}: AnalyzerHubProps) {
  const [mode, setMode] = useState<AnalyzerMode>(initialMode);
  const [reportData, setReportData] = useState<AnalysisResultData | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const handleOpenReport = (data: AnalysisResultData) => {
    setReportData(data);
    setIsReportOpen(true);
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-[#050708] flex flex-col font-sans">
      {/* ── TOP ANALYZER SUB-NAV SELECTOR BAR ── */}
      <div
        className="relative z-40 flex items-center justify-between px-4 sm:px-6 py-2.5 shrink-0 select-none backdrop-blur-xl bg-black/80 border-b border-white/10"
        style={{ height: '48px' }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold tracking-wider uppercase text-zinc-300">
            <Sparkles size={14} className="text-[#C29B53]" />
            <span className="hidden sm:inline">ANALYZER WORKSPACE</span>
          </div>
        </div>

        {/* 3-Mode Pill Switcher */}
        <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl border border-white/10 font-mono text-xs">
          <button
            type="button"
            onClick={() => setMode('single-map')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              mode === 'single-map'
                ? 'bg-[#C29B53] text-black font-bold shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ImageIcon size={13} />
            <span>Single Map</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('map-aoi')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              mode === 'map-aoi'
                ? 'bg-[#C29B53] text-black font-bold shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Map size={13} />
            <span>Map AOI</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('temporal')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              mode === 'temporal'
                ? 'bg-[#C29B53] text-black font-bold shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <GitCompare size={13} />
            <span>Temporal</span>
          </button>
        </div>
      </div>

      {/* ── WORKSPACE VIEWPORT ── */}
      <div className="flex-1 relative overflow-hidden">
        {mode === 'map-aoi' && (
          <div className="absolute inset-0">
            <MapBasedAnalysis
              onLocationChange={onLocationChange}
              onOpenReportModal={handleOpenReport}
            />
          </div>
        )}

        {mode === 'single-map' && (
          <div className="absolute inset-0 overflow-y-auto">
            <div className="relative min-h-full w-full bg-black text-white font-sans overflow-x-hidden select-none p-4 sm:p-8">
              <AerospaceBackground />
              <div className="relative z-20 max-w-4xl mx-auto">
                <SingleImageAnalysis onOpenReportModal={handleOpenReport} />
              </div>
            </div>
          </div>
        )}

        {mode === 'temporal' && (
          <div className="absolute inset-0 overflow-y-auto">
            <div className="relative min-h-full w-full bg-black text-white font-sans overflow-x-hidden select-none p-4 sm:p-8">
              <AerospaceBackground />
              <div className="relative z-20 max-w-5xl mx-auto">
                <BiTemporalAnalysis onOpenReportModal={handleOpenReport} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── PRINTABLE REPORT MODAL ── */}
      {reportData && (
        <ReportModal
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          data={reportData}
        />
      )}
    </div>
  );
}
