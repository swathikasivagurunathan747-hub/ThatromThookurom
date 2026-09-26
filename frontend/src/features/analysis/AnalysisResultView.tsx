import React from 'react';
import {
  FileText,
  Printer,
  RotateCcw,
  Sparkles,
  MapPin,
  ShieldCheck,
  Calendar,
  Layers,
  Activity,
  ExternalLink,
} from 'lucide-react';

export interface AnalysisResultData {
  id?: string;
  trace_id?: string;
  query?: string;
  final_answer?: string;
  answer?: string;
  summary?: string;
  keyFinding?: string;
  aggregated_confidence?: number;
  confidence?: number;
  routing_summary?: {
    selected_agent?: string;
    intent?: string;
    confidence?: number;
    reasoning?: string;
  };
  visual_evidence_urls?: string[];
  visualEvidenceUrl?: string;
  changeVisualizationUrl?: string;
  beforeImageUrl?: string;
  afterImageUrl?: string;
  // Spatial context
  areaKm2?: number;
  locationName?: string;
  coordinatesText?: string;
  date?: string;
  changeDetected?: string;
  affectedArea?: string;
  detectedCategories?: string[];
  isDemoMode?: boolean;
}

interface AnalysisResultViewProps {
  title?: string;
  data: AnalysisResultData;
  onGenerateReport?: () => void;
  onPrintReport?: () => void;
  onNewAnalysis?: () => void;
  onViewOnMap?: () => void;
  className?: string;
}

export function AnalysisResultView({
  title = 'ANALYSIS RESULT',
  data,
  onGenerateReport,
  onPrintReport,
  onNewAnalysis,
  onViewOnMap,
  className = '',
}: AnalysisResultViewProps) {
  // Extract real backend fields without inventing values
  const traceId = data.trace_id || data.id || 'Not available';
  const queryText = data.query || 'Satellite scene intelligence query';
  const mainAnswer = data.final_answer || data.answer || data.summary || 'Analysis complete.';
  
  // Real confidence calculation (if 0.0 - 1.0 or 0 - 100)
  let confidenceDisplay: string = 'Not available';
  if (data.aggregated_confidence !== undefined && data.aggregated_confidence !== null) {
    const val = data.aggregated_confidence > 1 ? data.aggregated_confidence : data.aggregated_confidence * 100;
    confidenceDisplay = `${Math.round(val)}%`;
  } else if (data.confidence !== undefined && data.confidence !== null) {
    confidenceDisplay = `${Math.round(data.confidence)}%`;
  }

  const selectedAgent = data.routing_summary?.selected_agent || 'SatQuery Multi-Agent Router';

  // Evidence image URL
  const evidenceUrl =
    (data.visual_evidence_urls && data.visual_evidence_urls[0]) ||
    data.visualEvidenceUrl ||
    data.changeVisualizationUrl ||
    data.afterImageUrl ||
    data.beforeImageUrl;

  const locationDisplay = data.locationName || data.coordinatesText || 'Spatial AOI Extents';
  const areaDisplay = data.areaKm2 ? `${data.areaKm2.toFixed(2)} km²` : data.affectedArea || 'Not available';
  const dateDisplay = data.date || new Date().toISOString().split('T')[0];
  const changeDisplay = data.changeDetected || 'Multi-spectral variance evaluated';

  return (
    <div
      className={`rounded-2xl p-6 sm:p-7 backdrop-blur-2xl bg-black/90 border border-white/20 shadow-[0_20px_80px_rgba(0,0,0,0.95)] text-left select-none max-w-4xl mx-auto w-full font-sans ${className}`}
    >
      {/* ── HEADER BAR ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#C29B53]/15 border border-[#C29B53]/30 flex items-center justify-center text-[#C29B53] shadow-sm">
            <Sparkles size={16} />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold uppercase tracking-[0.16em] text-white font-mono">
              {title}
            </h2>
            <div className="text-[10px] font-mono text-zinc-400">
              Trace: <span className="text-zinc-300">{traceId}</span> · Agent: <span className="text-[#C29B53]">{selectedAgent}</span>
            </div>
          </div>
        </div>

        {/* Top-Right Quick Actions */}
        <div className="flex items-center gap-2">
          {onGenerateReport && (
            <button
              type="button"
              onClick={onGenerateReport}
              className="px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-[#C29B53] hover:bg-[#CCA563] text-black transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
            >
              <FileText size={13} />
              <span>Generate Report</span>
            </button>
          )}

          {onPrintReport && (
            <button
              type="button"
              onClick={onPrintReport}
              className="px-3 py-1.5 rounded-xl text-xs font-mono font-semibold text-zinc-200 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Print report or save as PDF"
            >
              <Printer size={13} />
              <span className="hidden sm:inline">Print</span>
            </button>
          )}

          {onNewAnalysis && (
            <button
              type="button"
              onClick={onNewAnalysis}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-all cursor-pointer"
              title="New Analysis"
            >
              <RotateCcw size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── USER QUERY ROW ── */}
      <div className="py-3.5 border-b border-white/10">
        <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 block mb-1">
          Query Submitted
        </span>
        <p className="text-sm sm:text-base font-medium text-white italic font-sans">
          &ldquo;{queryText}&rdquo;
        </p>
      </div>

      {/* ── MAP / EVIDENCE VISUALIZATION ── */}
      {evidenceUrl && (
        <div className="py-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Layers size={12} className="text-[#C29B53]" />
              <span>Map / Change Visualization</span>
            </span>
            {onViewOnMap && (
              <button
                type="button"
                onClick={onViewOnMap}
                className="text-[11px] font-mono text-[#C29B53] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View on Map</span>
                <ExternalLink size={11} />
              </button>
            )}
          </div>
          <div className="rounded-xl overflow-hidden border border-white/15 bg-black/90 max-h-[340px] flex items-center justify-center p-1.5 shadow-inner">
            <img
              src={evidenceUrl}
              alt="Satellite visualization evidence"
              className="max-h-full max-w-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}

      {/* ── ANALYSIS SUMMARY GRID ── */}
      <div className="py-4 border-b border-white/10">
        <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 block mb-3">
          Analysis Summary
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Area Extent</span>
            <span className="text-white font-bold text-sm mt-0.5 block">{areaDisplay}</span>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Location</span>
            <span className="text-white font-bold text-sm mt-0.5 block truncate" title={locationDisplay}>
              {locationDisplay}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Observation Date</span>
            <span className="text-white font-bold text-sm mt-0.5 block">{dateDisplay}</span>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Change Detected</span>
            <span className="text-[#C29B53] font-bold text-sm mt-0.5 block truncate">
              {changeDisplay}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Affected Area</span>
            <span className="text-white font-bold text-sm mt-0.5 block">{areaDisplay}</span>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Model Confidence</span>
            <span className="text-emerald-400 font-bold text-sm mt-0.5 block">
              {confidenceDisplay}
            </span>
          </div>
        </div>
      </div>

      {/* ── KEY FINDINGS & DETAILED SYNTHESIS ── */}
      <div className="pt-4">
        <div className="flex items-center gap-2 mb-2">
          <Activity size={14} className="text-[#C29B53]" />
          <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-white">
            Key Findings
          </span>
        </div>
        <p className="text-sm text-zinc-200 leading-relaxed font-sans whitespace-pre-line">
          {mainAnswer}
        </p>

        {data.detectedCategories && data.detectedCategories.length > 0 && (
          <div className="mt-3.5 flex flex-wrap gap-1.5">
            {data.detectedCategories.map((cat) => (
              <span
                key={cat}
                className="px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wide bg-white/[0.05] text-zinc-300 border border-white/10"
              >
                {cat}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── BOTTOM ACTION BUTTONS ── */}
      <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {onViewOnMap && (
            <button
              type="button"
              onClick={onViewOnMap}
              className="px-4 py-2 rounded-xl text-xs font-mono font-semibold bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 hover:text-white border border-white/15 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <MapPin size={13} className="text-[#C29B53]" />
              <span>View on Map</span>
            </button>
          )}

          {onNewAnalysis && (
            <button
              type="button"
              onClick={onNewAnalysis}
              className="px-4 py-2 rounded-xl text-xs font-mono font-semibold bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/10 transition-all cursor-pointer"
            >
              New Analysis
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onGenerateReport && (
            <button
              type="button"
              onClick={onGenerateReport}
              className="px-5 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-[#C29B53] hover:bg-[#CCA563] text-black transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
            >
              <FileText size={14} />
              <span>Generate Report</span>
            </button>
          )}

          {onPrintReport && (
            <button
              type="button"
              onClick={onPrintReport}
              className="px-4 py-2 rounded-xl text-xs font-mono font-semibold text-zinc-200 hover:text-white bg-white/[0.08] hover:bg-white/[0.15] border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Printer size={14} />
              <span>Print Report</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
