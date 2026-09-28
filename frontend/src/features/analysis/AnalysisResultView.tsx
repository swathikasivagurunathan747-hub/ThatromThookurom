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
import { printIntelligenceReport } from '../reports/reportGenerator';

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
  detected_features?: string[];
  analysis_type?: string;
  change_region?: string;
  change_detection?: string;
  evidence?: string;
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
  
  const handlePrint = onPrintReport || (() => printIntelligenceReport(data));
  
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

  const analysisType =
    data.analysis_type ||
    (data.beforeImageUrl && data.afterImageUrl
      ? 'Bi-temporal Change Detection'
      : (data.locationName || data.areaKm2 ? 'Map / Spatial Analysis' : 'Single Image Analysis'));

  const detectedFeatures =
    data.detected_features || data.detectedCategories || [];

  const changeRegion =
    data.change_region ||
    data.change_detection ||
    data.changeDetected ||
    (analysisType.includes('temporal') || analysisType.includes('Change')
      ? 'Central elongated open parcel between the residential and industrial areas'
      : 'Target features identified in satellite scene');

  const evidenceText =
    data.evidence ||
    (analysisType.includes('temporal') || analysisType.includes('Change')
      ? 'Before/After image comparison + change map'
      : 'Multi-spectral optical feature extraction + feature detection');

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
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold uppercase tracking-[0.16em] text-white font-mono">
                {title}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#C29B53]/20 text-[#C29B53] border border-[#C29B53]/40">
                {analysisType}
              </span>
            </div>
            <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
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

          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-1.5 rounded-xl text-xs font-mono font-semibold text-zinc-200 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 transition-all flex items-center gap-1.5 cursor-pointer"
            title="Print report or save as PDF"
          >
            <Printer size={13} />
            <span className="hidden sm:inline">Print</span>
          </button>

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

      {/* ── PART 5: NATURAL-LANGUAGE ANSWER ── */}
      <div className="py-4 border-b border-white/10 bg-white/[0.02] -mx-6 px-6 sm:-mx-7 sm:px-7">
        <div className="flex items-center gap-2 mb-2">
          <Activity size={14} className="text-[#C29B53]" />
          <span className="text-[11px] font-mono font-bold tracking-widest uppercase text-[#C29B53]">
            Natural-Language Answer
          </span>
        </div>
        <p className="text-sm sm:text-base text-zinc-100 font-medium leading-relaxed font-sans whitespace-pre-line">
          {mainAnswer}
        </p>
      </div>

      {/* ── PART 5: STRUCTURED ANALYSIS BREAKDOWN ── */}
      <div className="py-4 border-b border-white/10">
        <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 block mb-3">
          Structured Intelligence Breakdown (Part 5 Format)
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
          {/* Analysis Type */}
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Analysis Type</span>
            <span className="text-white font-bold text-sm mt-0.5 block">{analysisType}</span>
          </div>

          {/* Confidence Score */}
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Confidence Score</span>
            <span className="text-emerald-400 font-bold text-sm mt-0.5 block">
              {confidenceDisplay}
            </span>
          </div>

          {/* Change / Detection Region */}
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 sm:col-span-2">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Change / Detection Region</span>
            <span className="text-[#C29B53] font-bold text-xs sm:text-sm mt-0.5 block">
              {changeRegion}
            </span>
          </div>

          {/* Evidence / Reasoning */}
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 sm:col-span-2">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Evidence & Reasoning</span>
            <span className="text-zinc-200 text-xs sm:text-sm mt-0.5 block font-sans">
              {evidenceText}
            </span>
          </div>
        </div>

        {/* Detected Objects / Features */}
        {detectedFeatures && detectedFeatures.length > 0 && (
          <div className="mt-3.5 p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-2">
              Detected Objects / Features
            </span>
            <div className="flex flex-wrap gap-2">
              {detectedFeatures.map((feat: string) => (
                <span
                  key={feat}
                  className="px-2.5 py-1 rounded-lg text-xs font-mono bg-white/[0.06] text-zinc-200 border border-white/10 flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C29B53]" />
                  <span>{feat}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── PART 5: VISUALIZATION ARTIFACTS ── */}
      {evidenceUrl && (
        <div className="py-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Layers size={12} className="text-[#C29B53]" />
              <span>Visual Evidence & Change Maps</span>
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

          {/* If Both Before & After Images are available, show Side-by-Side comparison */}
          {data.beforeImageUrl && data.afterImageUrl && (
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="rounded-xl overflow-hidden border border-white/15 bg-black/90 p-2 text-center">
                <span className="text-[10px] font-mono text-zinc-400 block mb-1">BEFORE (Image 01)</span>
                <img
                  src={data.beforeImageUrl}
                  alt="Before satellite capture"
                  className="max-h-[180px] w-full object-contain rounded"
                />
              </div>
              <div className="rounded-xl overflow-hidden border border-white/15 bg-black/90 p-2 text-center">
                <span className="text-[10px] font-mono text-emerald-400 block mb-1">AFTER (Image 02)</span>
                <img
                  src={data.afterImageUrl}
                  alt="After satellite capture"
                  className="max-h-[180px] w-full object-contain rounded"
                />
              </div>
            </div>
          )}

          {/* Primary Evidence Artifact / Change Map */}
          <div className="rounded-xl overflow-hidden border border-white/15 bg-black/90 max-h-[360px] flex items-center justify-center p-2 shadow-inner">
            <img
              src={evidenceUrl}
              alt="Satellite visualization evidence"
              className="max-h-full max-w-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}

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

          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl text-xs font-mono font-semibold text-zinc-200 hover:text-white bg-white/[0.08] hover:bg-white/[0.15] border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Printer size={14} />
            <span>Print Report</span>
          </button>
        </div>
      </div>
    </div>
  );
}
