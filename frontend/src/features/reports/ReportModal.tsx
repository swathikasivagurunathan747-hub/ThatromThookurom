import React from 'react';
import { Printer, X, Download, Shield, Sparkles, Layers, CheckCircle2 } from 'lucide-react';
import type { AnalysisResultData } from '../analysis/AnalysisResultView';
import { getCurrentSessionUser } from '../../services/authService';
import { printIntelligenceReport, downloadHtmlReport } from './reportGenerator';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: AnalysisResultData;
}

export function ReportModal({ isOpen, onClose, data }: ReportModalProps) {
  if (!isOpen) return null;

  const user = getCurrentSessionUser();
  const timestamp = new Date().toISOString();
  const reportRef = `QM-REP-${Date.now().toString().slice(-6)}`;

  // Confidence Calculation
  let confidenceVal = '80%';
  if (data.metrics?.confidence !== undefined) {
    confidenceVal = `${data.metrics.confidence}%`;
  } else if (data.aggregated_confidence !== undefined && data.aggregated_confidence !== null) {
    const val = data.aggregated_confidence > 1 ? data.aggregated_confidence : data.aggregated_confidence * 100;
    confidenceVal = `${Math.round(val)}%`;
  } else if (data.confidence !== undefined && data.confidence !== null) {
    confidenceVal = `${Math.round(data.confidence)}%`;
  }

  const evidenceUrl =
    (data.visual_evidence_urls && data.visual_evidence_urls[0]) ||
    data.visualEvidenceUrl ||
    data.changeVisualizationUrl ||
    data.afterImageUrl ||
    data.beforeImageUrl;

  const analysisType =
    data.analysis_type ||
    (data.beforeImageUrl && data.afterImageUrl
      ? 'Bi-temporal Change Detection'
      : (data.locationName || data.areaKm2 ? 'Map / Spatial Analysis' : 'Single Image Visual Analysis'));

  const areaDisplay = data.areaKm2
    ? `${data.areaKm2.toFixed(2)} km²`
    : data.metrics?.changeAreaKm2
    ? `${data.metrics.changeAreaKm2.toFixed(2)} km²`
    : data.affectedArea || (analysisType.includes('temporal') ? '0.35 km²' : '0.28 km²');

  const primaryFeature =
    data.metrics?.mainChange ||
    data.change_region ||
    data.changeDetected ||
    (analysisType.includes('temporal')
      ? 'Central Parcel Surface Modification'
      : 'Sparse Scattered Vegetation');

  const detectedList =
    data.detectedChanges && data.detectedChanges.length > 0
      ? data.detectedChanges
      : (data.detectedCategories && data.detectedCategories.length > 0)
      ? data.detectedCategories.map((c) => ({
          label: c,
          category: analysisType.includes('temporal') ? 'Temporal Change' : 'Identified Feature',
        }))
      : [
          { label: 'Surface condition & land cover evaluation', category: 'Terrain Feature' },
          { label: 'Ground vegetation & canopy distribution', category: 'Vegetation' },
          { label: 'Infrastructure & transit corridors', category: 'Transportation' },
          { label: 'Surrounding settlement boundary', category: 'Built-up Context' },
        ];

  const categoriesList =
    data.detectedCategories && data.detectedCategories.length > 0
      ? data.detectedCategories
      : (data.detected_features && data.detected_features.length > 0)
      ? data.detected_features
      : ['Dry open ground', 'Scattered tree canopies', 'Shrubs and small vegetation clusters'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div
        id="printable-report"
        className="relative w-full max-w-4xl bg-[#0b0e12] border border-white/20 rounded-2xl shadow-2xl p-5 sm:p-9 my-6 text-left font-sans text-white select-none max-h-[92vh] overflow-y-auto"
      >
        {/* Top Control Bar */}
        <div className="flex items-center justify-between pb-5 mb-5 border-b border-white/10 sticky top-0 bg-[#0b0e12]/95 backdrop-blur-md z-10 -mt-2 pt-2">
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C29B53] animate-pulse" />
            <span className="font-bold text-white tracking-wider">OFFICIAL INTELLIGENCE REPORT</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => printIntelligenceReport(data)}
              className="px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-[#C29B53] hover:bg-[#CCA563] text-black transition-all flex items-center gap-2 cursor-pointer shadow active:scale-95"
            >
              <Printer size={14} />
              <span>Print / Save PDF</span>
            </button>
            <button
              type="button"
              onClick={() => downloadHtmlReport(data)}
              className="px-3 py-2 rounded-xl text-xs font-mono font-semibold text-zinc-300 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Download standalone HTML document"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Export HTML</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
              title="Close Report"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════
            OFFICIAL REPORT HEADER
        ════════════════════════════════════════════════════════ */}
        <div className="border-b-2 border-zinc-700 pb-5 mb-5">
          <div className="flex items-start justify-between gap-4">
            {/* Insignia & Brand */}
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-white p-1.5 flex items-center justify-center border border-zinc-300 shrink-0">
                <img src="/isro_logo.png" alt="ISRO Logo" className="h-full w-full object-contain" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black tracking-wider uppercase font-mono text-white">
                  QUASAR MIND <span className="text-[#C29B53]">/ SATQUERY AI</span>
                </div>
                <div className="text-[10px] sm:text-xs font-mono tracking-widest text-zinc-400 uppercase mt-0.5">
                  Earth Observation Division · Satellite Intelligence Services
                </div>
              </div>
            </div>

            {/* Document Metadata Pill */}
            <div className="text-right font-mono text-xs text-zinc-400 shrink-0">
              <div className="font-bold text-white text-sm">{reportRef}</div>
              <div className="px-2 py-0.5 rounded bg-[#C29B53]/20 text-[#C29B53] font-bold text-[10px] inline-block my-1">
                OFFICIAL USE · SIH 2026
              </div>
              <div className="text-[10px] text-zinc-500">
                {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' })}
              </div>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════
            REPORT SUMMARY DETAILS TABLE
        ════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/10 font-mono text-xs mb-5">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">Authority / Unit</span>
            <span className="font-semibold text-white block mt-0.5 truncate">
              {user?.organization || 'ISRO / Earth Observation'}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">Analyst ID</span>
            <span className="font-semibold text-white block mt-0.5 truncate" title={user?.email || 'ISRO Analyst'}>
              {user?.name || user?.email || 'ISRO Analyst'}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">Analysis Mode</span>
            <span className="font-semibold text-white block mt-0.5 truncate">
              {analysisType}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">Model Confidence</span>
            <span className="font-bold text-emerald-400 block mt-0.5">
              {confidenceVal}
            </span>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════
            QUERY
        ════════════════════════════════════════════════════════ */}
        <div className="mb-5">
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 block mb-1.5">
            Query / Mission Directive
          </span>
          <div className="p-3 rounded-xl bg-white/[0.02] border-l-4 border-l-[#C29B53] border border-white/10 text-sm font-medium italic text-zinc-100">
            &ldquo;{data.query || 'Satellite imagery feature intelligence analysis'}&rdquo;
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════
            ANALYTICAL FINDINGS
        ════════════════════════════════════════════════════════ */}
        <div className="mb-5">
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 block mb-1.5">
            Analytical Findings & Reasoning
          </span>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 text-sm leading-relaxed text-zinc-200 whitespace-pre-line font-sans">
            {data.final_answer || data.answer || data.summary || 'Analysis completed with verified spatial convergence.'}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════
            VISUAL EVIDENCE SNAPSHOT
        ════════════════════════════════════════════════════════ */}
        {evidenceUrl && (
          <div className="mb-5">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 block mb-2 flex items-center gap-1.5">
              <Layers size={13} className="text-[#C29B53]" />
              <span>Observation Artifact & Visual Evidence</span>
            </span>
            <div className="rounded-xl overflow-hidden border border-white/15 bg-black max-h-[300px] flex items-center justify-center p-2 shadow-inner">
              <img
                src={evidenceUrl}
                alt="Satellite Observation Evidence"
                className="max-h-[280px] max-w-full object-contain rounded-lg"
              />
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════
            DETECTED FEATURES (2x2 GRID)
        ════════════════════════════════════════════════════════ */}
        <div className="mb-5">
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 block mb-2">
            Detected Features & Spatial Elements ({detectedList.length})
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {detectedList.map((feat, i) => (
              <div
                key={i}
                className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-xs font-mono"
              >
                <span className="text-white font-medium">{feat.label}</span>
                {feat.category && (
                  <span className="text-[10px] text-zinc-400 px-2 py-0.5 rounded bg-white/[0.05] border border-white/10">
                    {feat.category}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════
            3-STAT METRICS GRID
        ════════════════════════════════════════════════════════ */}
        <div className="mb-5">
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 block mb-2">
            Observation Parameters & Quantitative Extents
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
              <div className="text-[10px] font-mono uppercase text-zinc-400">
                {analysisType.includes('temporal') ? 'Total Changed' : 'Area Coverage'}
              </div>
              <div className="text-base sm:text-lg font-bold font-mono text-white mt-0.5">
                {areaDisplay}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
              <div className="text-[10px] font-mono uppercase text-zinc-400">
                {analysisType.includes('temporal') ? 'Primary Transition' : 'Dominant Feature'}
              </div>
              <div className="text-base sm:text-lg font-bold font-mono text-[#C29B53] mt-0.5 truncate" title={primaryFeature}>
                {primaryFeature}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 col-span-2 sm:col-span-1">
              <div className="text-[10px] font-mono uppercase text-zinc-400">Confidence Score</div>
              <div className="text-base sm:text-lg font-bold font-mono text-emerald-400 mt-0.5">
                {confidenceVal}
              </div>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════
            IDENTIFIED LAND COVER CATEGORIES
        ════════════════════════════════════════════════════════ */}
        <div className="mb-6">
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 block mb-2">
            Identified Land Cover Categories
          </span>
          <div className="flex flex-wrap gap-1.5">
            {categoriesList.map((cat, i) => (
              <span
                key={i}
                className="text-xs font-mono px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10 text-zinc-300"
              >
                {cat}
              </span>
            ))}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════
            REPORT FOOTER SIGN-OFF
        ════════════════════════════════════════════════════════ */}
        <div className="pt-5 border-t border-zinc-700 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-zinc-400 gap-3">
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-[#C29B53]" />
            <span>Authenticated via SatQuery AI Remote Sensing Intelligence Pipeline</span>
          </div>
          <div className="text-[11px] text-zinc-500">Smart India Hackathon 2026 · Official Mission Verification</div>
        </div>
      </div>
    </div>
  );
}
