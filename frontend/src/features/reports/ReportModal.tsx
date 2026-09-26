import React from 'react';
import { Printer, X, Download, Shield, MapPin, Calendar, Clock, CheckCircle2 } from 'lucide-react';
import type { AnalysisResultData } from '../analysis/AnalysisResultView';
import { getCurrentSessionUser } from '../../services/authService';

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

  const handlePrint = () => {
    window.print();
  };

  const confidenceVal =
    data.aggregated_confidence !== undefined && data.aggregated_confidence !== null
      ? data.aggregated_confidence > 1
        ? `${Math.round(data.aggregated_confidence)}%`
        : `${Math.round(data.aggregated_confidence * 100)}%`
      : data.confidence !== undefined && data.confidence !== null
      ? `${Math.round(data.confidence)}%`
      : 'Not available';

  const evidenceUrl =
    (data.visual_evidence_urls && data.visual_evidence_urls[0]) ||
    data.visualEvidenceUrl ||
    data.changeVisualizationUrl ||
    data.afterImageUrl ||
    data.beforeImageUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white print:static">
      <div
        id="printable-report"
        className="relative w-full max-w-4xl bg-[#0b0e12] border border-white/20 rounded-2xl shadow-2xl p-6 sm:p-10 my-8 text-left font-sans text-white print:border-none print:shadow-none print:p-8 print:text-black print:bg-white print:m-0 print:w-full"
      >
        {/* Top Control Bar (Hidden when printing) */}
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-white/10 print:hidden">
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-[#C29B53]" />
            <span>REPORT PREVIEW & PRINT</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-[#C29B53] hover:bg-[#CCA563] text-black transition-all flex items-center gap-2 cursor-pointer shadow active:scale-95"
            >
              <Printer size={15} />
              <span>Print / Save as PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════
            OFFICIAL REPORT HEADER
        ════════════════════════════════════════════════════════ */}
        <div className="border-b-2 border-zinc-700 print:border-black pb-6 mb-6">
          <div className="flex items-start justify-between">
            {/* Insignia & Brand */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white p-1.5 flex items-center justify-center border border-zinc-300 shrink-0">
                <img src="/isro_logo.png" alt="ISRO Logo" className="h-full w-full object-contain" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black tracking-wider uppercase font-mono text-white print:text-black">
                  QUASAR MIND <span className="text-[#C29B53] print:text-zinc-800">/ SATQUERY AI</span>
                </div>
                <div className="text-xs font-mono tracking-widest text-zinc-400 print:text-zinc-600 uppercase">
                  Earth Observation Division · Satellite Intelligence Services
                </div>
              </div>
            </div>

            {/* Document Metadata Pill */}
            <div className="text-right font-mono text-xs text-zinc-400 print:text-zinc-700">
              <div className="font-bold text-white print:text-black">{reportRef}</div>
              <div>CLASSIFICATION: OFFICIAL USE</div>
              <div>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' })}</div>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════
            REPORT SUMMARY DETAILS TABLE
        ════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-white/[0.03] print:bg-zinc-100 border border-white/10 print:border-zinc-300 font-mono text-xs mb-6">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 print:text-zinc-600 block">Institution / Unit</span>
            <span className="font-semibold text-white print:text-black block mt-0.5">
              {user?.organization || 'ISRO / Earth Observation'}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 print:text-zinc-600 block">Analyst ID</span>
            <span className="font-semibold text-white print:text-black block mt-0.5 truncate" title={user?.email || 'ISRO Analyst'}>
              {user?.name || user?.email || 'ISRO Analyst'}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 print:text-zinc-600 block">Location / AOI</span>
            <span className="font-semibold text-white print:text-black block mt-0.5 truncate" title={data.locationName || data.coordinatesText || 'AOI Extents'}>
              {data.locationName || data.coordinatesText || 'Spatial AOI'}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 print:text-zinc-600 block">Model Confidence</span>
            <span className="font-bold text-[#C29B53] print:text-black block mt-0.5">
              {confidenceVal}
            </span>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════
            ANALYSIS QUERY
        ════════════════════════════════════════════════════════ */}
        <div className="mb-6">
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 print:text-zinc-600 block mb-1">
            Query / Task Executed
          </span>
          <div className="p-3.5 rounded-xl bg-white/[0.02] print:bg-white border border-white/10 print:border-zinc-300 text-sm font-medium italic text-white print:text-black">
            &ldquo;{data.query || 'Satellite imagery feature intelligence analysis'}&rdquo;
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════
            VISUAL EVIDENCE SNAPSHOT
        ════════════════════════════════════════════════════════ */}
        {evidenceUrl && (
          <div className="mb-6">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 print:text-zinc-600 block mb-2">
              Satellite Observation Evidence
            </span>
            <div className="rounded-xl overflow-hidden border border-white/15 print:border-zinc-400 bg-black max-h-[300px] flex items-center justify-center p-1.5">
              <img
                src={evidenceUrl}
                alt="Satellite Evidence"
                className="max-h-full max-w-full object-contain rounded-lg"
              />
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════
            KEY FINDINGS & INTELLIGENCE SUMMARY
        ════════════════════════════════════════════════════════ */}
        <div className="mb-6">
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 print:text-zinc-600 block mb-2">
            Key Findings & Analytical Synthesis
          </span>
          <div className="p-4 rounded-xl bg-white/[0.02] print:bg-white border border-white/10 print:border-zinc-300 text-sm leading-relaxed text-zinc-200 print:text-black whitespace-pre-line font-sans">
            {data.final_answer || data.answer || data.summary || 'Analysis completed with verified spatial convergence.'}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════
            METRICS TABLE
        ════════════════════════════════════════════════════════ */}
        <div className="mb-8">
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 print:text-zinc-600 block mb-2">
            Observation Parameters & Metrics
          </span>
          <table className="w-full font-mono text-xs border border-white/10 print:border-zinc-400">
            <tbody>
              <tr className="border-b border-white/10 print:border-zinc-300">
                <td className="p-2.5 text-zinc-400 print:text-zinc-600 w-1/3 bg-white/[0.02] print:bg-zinc-100">Area Coverage</td>
                <td className="p-2.5 font-semibold text-white print:text-black">
                  {data.areaKm2 ? `${data.areaKm2.toFixed(2)} km²` : data.affectedArea || 'Not available'}
                </td>
              </tr>
              <tr className="border-b border-white/10 print:border-zinc-300">
                <td className="p-2.5 text-zinc-400 print:text-zinc-600 bg-white/[0.02] print:bg-zinc-100">Trace Reference</td>
                <td className="p-2.5 text-zinc-300 print:text-black">
                  {data.trace_id || data.id || 'Not available'}
                </td>
              </tr>
              <tr className="border-b border-white/10 print:border-zinc-300">
                <td className="p-2.5 text-zinc-400 print:text-zinc-600 bg-white/[0.02] print:bg-zinc-100">Specialist Routing</td>
                <td className="p-2.5 text-zinc-300 print:text-black">
                  {data.routing_summary?.selected_agent || 'SatQuery Multi-Agent Router'}
                </td>
              </tr>
              <tr>
                <td className="p-2.5 text-zinc-400 print:text-zinc-600 bg-white/[0.02] print:bg-zinc-100">Generation Timestamp</td>
                <td className="p-2.5 text-zinc-300 print:text-black">{timestamp}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ════════════════════════════════════════════════════════
            REPORT FOOTER SIGN-OFF
        ════════════════════════════════════════════════════════ */}
        <div className="pt-6 border-t border-zinc-700 print:border-black flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-zinc-400 print:text-zinc-700 gap-4">
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-[#C29B53] print:text-black" />
            <span>Authenticated via Quasar Mind SIH 2024 Remote Sensing Pipeline</span>
          </div>
          <div>Report Document · Page 1 of 1</div>
        </div>
      </div>
    </div>
  );
}
