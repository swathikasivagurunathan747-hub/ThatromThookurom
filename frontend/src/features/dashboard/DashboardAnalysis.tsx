import { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  Sparkles,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Trash2,
  AlertCircle,
  Loader2,
  ShieldAlert,
  FileImage,
  ChevronDown,
  ChevronUp,
  GitCompare,
  FileText,
  Printer,
} from 'lucide-react';
import {
  runAgenticAnalysis,
  runAgenticAnalysisDevMock,
} from '../../services/analysisService';
import type { AgenticAnalysisResult } from '../../types';
import { AnalysisLoadingState } from '../analysis/AnalysisLoadingState';
import { ReportModal } from '../reports/ReportModal';
import type { AnalysisResultData } from '../analysis/AnalysisResultView';

const SUPPORTED_EXTENSIONS = ['.tif', '.tiff', '.png', '.jpg', '.jpeg', '.jp2'];
const SUPPORTED_MIME_TYPES = [
  'image/tiff',
  'image/x-tiff',
  'image/png',
  'image/jpeg',
  'image/jp2',
  'image/jpx',
];

const SUGGESTED_QUERIES_SINGLE = [
  'Describe what is visible in this satellite image.',
  'Identify the major built-up areas.',
  'What vegetation is present?',
  'What type of land use is visible?',
];

const SUGGESTED_QUERIES_DUAL = [
  'What changed between these two images?',
  'Has urbanization increased?',
  'Where has vegetation decreased?',
  'Where has construction occurred?',
  'Identify major land-use changes.',
];

const LOADING_PHASES = [
  'Uploading imagery to cloud storage...',
  'Ingesting satellite scene metadata...',
  'Routing to specialist EO models...',
  'Processing satellite imagery...',
  'Synthesizing intelligence response...',
];

export interface DashboardAnalysisProps {
  onAnalysisComplete?: (
    result: AgenticAnalysisResult,
    meta: { files: File[]; previewUrls: string[] }
  ) => void;
  onOpenReportModal?: (data: AnalysisResultData) => void;
}

export function DashboardAnalysis({ onAnalysisComplete, onOpenReportModal }: DashboardAnalysisProps = {}) {
  // Image 1 State (Required Primary)
  const [file1, setFile1] = useState<File | null>(null);
  const [previewUrl1, setPreviewUrl1] = useState<string | null>(null);
  const [localReportData, setLocalReportData] = useState<AnalysisResultData | null>(null);
  const [isLocalReportOpen, setIsLocalReportOpen] = useState(false);
  const [zoomLevel1, setZoomLevel1] = useState<number>(1);
  const [dragActive1, setDragActive1] = useState<boolean>(false);

  // Image 2 State (Optional Second)
  const [file2, setFile2] = useState<File | null>(null);
  const [previewUrl2, setPreviewUrl2] = useState<string | null>(null);
  const [zoomLevel2, setZoomLevel2] = useState<number>(1);
  const [dragActive2, setDragActive2] = useState<boolean>(false);

  // Query & Analysis State
  const [query, setQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingPhaseIndex, setLoadingPhaseIndex] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AgenticAnalysisResult | null>(null);
  const [showDetails, setShowDetails] = useState<boolean>(false);

  // Explicit Dev Mock Toggle (default OFF — live mode strictly enforced)
  const [forceMock, setForceMock] = useState<boolean>(false);

  const fileInputRef1 = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // Auto-scroll down smoothly to result when ready
  useEffect(() => {
    if (result && !loading && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [result, loading]);

  // Cleanup object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl1?.startsWith('blob:')) URL.revokeObjectURL(previewUrl1);
      if (previewUrl2?.startsWith('blob:')) URL.revokeObjectURL(previewUrl2);
    };
  }, [previewUrl1, previewUrl2]);

  // Loading animation phases
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      setLoadingPhaseIndex(0);
      interval = setInterval(() => {
        setLoadingPhaseIndex((prev) => (prev + 1) % LOADING_PHASES.length);
      }, 700);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const validateFile = (file: File): boolean => {
    setError(null);
    const fileName = file.name.toLowerCase();
    const hasValidExt = SUPPORTED_EXTENSIONS.some((ext) => fileName.endsWith(ext));
    const hasValidMime =
      SUPPORTED_MIME_TYPES.includes(file.type) || file.type.startsWith('image/');

    if (!hasValidExt && !hasValidMime) {
      setError(
        `Unsupported file format (${file.name}). SatQuery accepts GeoTIFF (.tif, .tiff), JPEG2000 (.jp2), PNG, and JPEG.`
      );
      return false;
    }
    return true;
  };

  const handleSelectFile1 = (f: File) => {
    if (!validateFile(f)) return;
    if (previewUrl1?.startsWith('blob:')) URL.revokeObjectURL(previewUrl1);
    setFile1(f);
    setPreviewUrl1(URL.createObjectURL(f));
    setZoomLevel1(1);
    setError(null);
  };

  const handleSelectFile2 = (f: File) => {
    if (!validateFile(f)) return;
    if (previewUrl2?.startsWith('blob:')) URL.revokeObjectURL(previewUrl2);
    setFile2(f);
    setPreviewUrl2(URL.createObjectURL(f));
    setZoomLevel2(1);
    setError(null);
  };

  const handleRemoveFile1 = () => {
    if (previewUrl1?.startsWith('blob:')) URL.revokeObjectURL(previewUrl1);
    setFile1(null);
    setPreviewUrl1(null);
    setZoomLevel1(1);
    if (fileInputRef1.current) fileInputRef1.current.value = '';
  };

  const handleRemoveFile2 = () => {
    if (previewUrl2?.startsWith('blob:')) URL.revokeObjectURL(previewUrl2);
    setFile2(null);
    setPreviewUrl2(null);
    setZoomLevel2(1);
    if (fileInputRef2.current) fileInputRef2.current.value = '';
  };

  const handleClearAll = () => {
    handleRemoveFile1();
    handleRemoveFile2();
    setQuery('');
    setResult(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!file1) {
      setError('Please upload at least one satellite image.');
      return;
    }

    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setError('Please enter a question about your satellite imagery.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const imagesToSubmit = file2 ? [file1, file2] : [file1];

    try {
      const res = forceMock
        ? await runAgenticAnalysisDevMock({
            images: imagesToSubmit,
            queryText: trimmedQuery,
          })
        : await runAgenticAnalysis({
            images: imagesToSubmit,
            queryText: trimmedQuery,
          });

      if (!res.success || !res.data) {
        setError(res.error || 'Analysis service unavailable. Please try again.');
        return;
      }

      setResult(res.data);

      if (onAnalysisComplete) {
        const previewUrls = [previewUrl1, previewUrl2].filter(Boolean) as string[];
        onAnalysisComplete(res.data, {
          files: imagesToSubmit,
          previewUrls,
        });
      }
    } catch (err: any) {
      console.error('SatQuery analysis error:', err);
      setError(err?.message || 'Analysis service unavailable. Please check backend connectivity.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey || !e.shiftKey)) {
      e.preventDefault();
      handleAnalyze();
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const activeSuggestedQueries = file2 ? SUGGESTED_QUERIES_DUAL : SUGGESTED_QUERIES_SINGLE;

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 font-sans select-none text-left">
      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef1}
        type="file"
        accept=".tif,.tiff,.png,.jpg,.jpeg,.jp2,image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleSelectFile1(e.target.files[0])}
      />
      <input
        ref={fileInputRef2}
        type="file"
        accept=".tif,.tiff,.png,.jpg,.jpeg,.jp2,image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleSelectFile2(e.target.files[0])}
      />

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10 mb-8">
        <div>
          <div className="text-[11px] font-mono tracking-[0.2em] uppercase text-[#C29B53] font-semibold flex items-center gap-2">
            <span>SATQUERY AI</span>
            <span className="text-zinc-600">·</span>
            <span>Intelligent Analysis Workspace</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-white mt-1">
            AI-Powered Satellite Analysis
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Upload 1 or 2 satellite images and ask SatQuery anything. The Agentic AI automatically determines the appropriate workflow.
          </p>
        </div>

        {/* Developer Sandbox / Demo Mode Switch */}
        <div className="flex items-center gap-2 bg-white/[0.04] border border-white/10 px-3 py-1.5 rounded-xl self-start sm:self-auto">
          <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 cursor-pointer flex items-center gap-2">
            <span>Demo Mode</span>
            <input
              type="checkbox"
              checked={forceMock}
              onChange={(e) => setForceMock(e.target.checked)}
              className="rounded accent-[#C29B53] cursor-pointer"
            />
          </label>
          {forceMock && (
            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
              MOCK
            </span>
          )}
        </div>
      </div>

      {/* Demo Mode Warning Banner */}
      {forceMock && (
        <div className="mb-6 p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-2 font-mono">
          <ShieldAlert size={15} className="shrink-0 text-amber-400" />
          <span>
            DEMO / MOCK MODE ACTIVE: Simulated responses enabled for offline UI testing. Real backend calls to the Agentic AI router are bypassed.
          </span>
        </div>
      )}

      {/* Error Alert Banner */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle size={16} className="shrink-0 text-red-400 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-200 font-mono text-[11px] cursor-pointer shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── DUAL UPLOAD WORKSPACE ── */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="text-xs font-mono font-bold uppercase tracking-[0.16em] text-zinc-300 flex items-center gap-2">
            <span>Upload Satellite Imagery</span>
            <span className="text-zinc-600">·</span>
            <span className="text-[11px] font-normal text-zinc-400">
              {file1 && file2
                ? '2 images loaded (Temporal comparison enabled)'
                : file1
                ? '1 image loaded (Single-image observation)'
                : '1 or 2 images'}
            </span>
          </div>

          {(file1 || file2) && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-[11px] font-mono text-zinc-400 hover:text-red-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 size={12} />
              <span>Clear All</span>
            </button>
          )}
        </div>

        {/* Dynamic Grid: 1 image large, 2 images side-by-side */}
        <div
          className={`grid gap-5 ${
            file1 && file2
              ? 'grid-cols-1 md:grid-cols-2'
              : file1
              ? 'grid-cols-1 lg:grid-cols-3'
              : 'grid-cols-1 md:grid-cols-2'
          }`}
        >
          {/* ── CARD 1: PRIMARY SCENE ── */}
          <div
            className={`rounded-2xl border transition-all ${
              file1 && !file2 ? 'lg:col-span-2' : ''
            } ${
              dragActive1
                ? 'border-[#C29B53] bg-[#C29B53]/10 ring-2 ring-[#C29B53]/40'
                : previewUrl1
                ? 'border-white/15 bg-black/60 shadow-2xl'
                : 'border-dashed border-white/20 bg-white/[0.02] hover:border-[#C29B53]/50 hover:bg-white/[0.04]'
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive1(true);
            }}
            onDragLeave={() => setDragActive1(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive1(false);
              if (e.dataTransfer.files?.[0]) handleSelectFile1(e.dataTransfer.files[0]);
            }}
          >
            {previewUrl1 && file1 ? (
              <div className="p-4 sm:p-5 flex flex-col h-full">
                {/* Card Header */}
                <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider bg-[#C29B53]/20 text-[#C29B53] border border-[#C29B53]/30 uppercase">
                      Image 01
                    </span>
                    <span className="text-xs font-mono text-zinc-300 truncate max-w-[180px] sm:max-w-xs">
                      {file1.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setZoomLevel1((z) => Math.min(z + 0.25, 3))}
                      title="Zoom in"
                      className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] text-zinc-300 hover:text-white cursor-pointer"
                    >
                      <ZoomIn size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setZoomLevel1((z) => Math.max(z - 0.25, 0.75))}
                      title="Zoom out"
                      className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] text-zinc-300 hover:text-white cursor-pointer"
                    >
                      <ZoomOut size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setZoomLevel1(1)}
                      title="Reset zoom"
                      className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] text-zinc-300 hover:text-white cursor-pointer"
                    >
                      <RotateCcw size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveFile1}
                      title="Remove image"
                      className="p-1.5 rounded-lg bg-red-950/20 hover:bg-red-950/50 text-red-400 border border-red-500/20 ml-1 cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Preview Canvas */}
                <div className="relative flex-1 min-h-[260px] sm:min-h-[300px] rounded-xl overflow-hidden bg-black/90 flex items-center justify-center p-2 border border-white/5">
                  <img
                    src={previewUrl1}
                    alt="Image 01 Preview"
                    style={{ transform: `scale(${zoomLevel1})`, transition: 'transform 0.15s ease-out' }}
                    className="max-h-[340px] max-w-full object-contain"
                  />
                </div>

                {/* Card Footer */}
                <div className="flex items-center justify-between pt-3 text-[11px] font-mono text-zinc-500">
                  <span>Size: {formatFileSize(file1.size)}</span>
                  <button
                    type="button"
                    onClick={() => fileInputRef1.current?.click()}
                    className="text-[#C29B53] hover:underline cursor-pointer"
                  >
                    Replace Image
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef1.current?.click()}
                className="p-8 sm:p-12 flex flex-col items-center justify-center text-center cursor-pointer min-h-[260px]"
              >
                <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-[#C29B53] mb-3 group-hover:scale-105 transition-transform shadow-lg">
                  <UploadCloud size={28} />
                </div>
                <div className="text-xs font-mono font-bold tracking-wider uppercase text-white">
                  Upload Primary Scene
                </div>
                <div className="text-xs text-zinc-400 mt-1">
                  Drop satellite image or click to browse
                </div>
                <div className="mt-4 flex flex-wrap justify-center gap-1.5 text-[9px] font-mono text-zinc-400">
                  <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/10">GeoTIFF</span>
                  <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/10">JP2</span>
                  <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/10">PNG / JPG</span>
                </div>
              </div>
            )}
          </div>

          {/* ── CARD 2: OPTIONAL SECOND SCENE ── */}
          <div
            className={`rounded-2xl border transition-all ${
              file1 && !file2 ? 'lg:col-span-1' : ''
            } ${
              dragActive2
                ? 'border-[#C29B53] bg-[#C29B53]/10 ring-2 ring-[#C29B53]/40'
                : previewUrl2
                ? 'border-white/15 bg-black/60 shadow-2xl'
                : 'border-dashed border-white/15 bg-white/[0.015] hover:border-[#C29B53]/40 hover:bg-white/[0.03]'
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive2(true);
            }}
            onDragLeave={() => setDragActive2(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive2(false);
              if (e.dataTransfer.files?.[0]) handleSelectFile2(e.dataTransfer.files[0]);
            }}
          >
            {previewUrl2 && file2 ? (
              <div className="p-4 sm:p-5 flex flex-col h-full">
                {/* Card Header */}
                <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">
                      Image 02
                    </span>
                    <span className="text-xs font-mono text-zinc-300 truncate max-w-[180px] sm:max-w-xs">
                      {file2.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setZoomLevel2((z) => Math.min(z + 0.25, 3))}
                      title="Zoom in"
                      className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] text-zinc-300 hover:text-white cursor-pointer"
                    >
                      <ZoomIn size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setZoomLevel2((z) => Math.max(z - 0.25, 0.75))}
                      title="Zoom out"
                      className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] text-zinc-300 hover:text-white cursor-pointer"
                    >
                      <ZoomOut size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setZoomLevel2(1)}
                      title="Reset zoom"
                      className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] text-zinc-300 hover:text-white cursor-pointer"
                    >
                      <RotateCcw size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveFile2}
                      title="Remove image"
                      className="p-1.5 rounded-lg bg-red-950/20 hover:bg-red-950/50 text-red-400 border border-red-500/20 ml-1 cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Preview Canvas */}
                <div className="relative flex-1 min-h-[260px] sm:min-h-[300px] rounded-xl overflow-hidden bg-black/90 flex items-center justify-center p-2 border border-white/5">
                  <img
                    src={previewUrl2}
                    alt="Image 02 Preview"
                    style={{ transform: `scale(${zoomLevel2})`, transition: 'transform 0.15s ease-out' }}
                    className="max-h-[340px] max-w-full object-contain"
                  />
                </div>

                {/* Card Footer */}
                <div className="flex items-center justify-between pt-3 text-[11px] font-mono text-zinc-500">
                  <span>Size: {formatFileSize(file2.size)}</span>
                  <button
                    type="button"
                    onClick={() => fileInputRef2.current?.click()}
                    className="text-[#C29B53] hover:underline cursor-pointer"
                  >
                    Replace Image
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef2.current?.click()}
                className="p-8 sm:p-12 flex flex-col items-center justify-center text-center cursor-pointer min-h-[260px]"
              >
                <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-zinc-400 mb-3 group-hover:scale-105 transition-transform shadow-lg">
                  <GitCompare size={26} className="text-[#C29B53]/70" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-bold tracking-wider uppercase text-zinc-200">
                    Upload Second Scene
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase bg-[#C29B53]/15 text-[#C29B53] border border-[#C29B53]/30">
                    Optional
                  </span>
                </div>
                <div className="text-xs text-zinc-400 mt-1 max-w-xs">
                  {file1
                    ? 'Add a second scene to compare changes over time'
                    : 'Optional second image for bi-temporal comparison'}
                </div>
                <div className="mt-4 flex flex-wrap justify-center gap-1.5 text-[9px] font-mono text-zinc-400">
                  <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/10">Temporal Compare</span>
                  <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/10">Change Detection</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── NATURAL-LANGUAGE QUESTION BOX ── */}
      <div className="rounded-2xl p-6 sm:p-7 backdrop-blur-2xl bg-black/60 border border-white/15 shadow-[0_20px_80px_rgba(0,0,0,0.85)] mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[#C29B53]" />
            <span className="text-xs font-mono font-bold uppercase tracking-[0.16em] text-white">
              Ask SatQuery
            </span>
          </div>
          <span className="text-[11px] font-mono text-zinc-400">
            SatQuery will automatically determine the best analysis for your request
          </span>
        </div>

        <div className="relative">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            rows={3}
            placeholder={
              file2
                ? 'Ask anything about what changed between these two scenes (e.g., What changed between these images? Where has vegetation decreased? Has urbanization increased?)'
                : 'Ask anything about your satellite image (e.g., Describe what is visible in this satellite image. Identify major built-up areas. What type of land use is visible?)'
            }
            className="w-full bg-black/50 border border-white/15 rounded-xl p-4 text-sm font-sans text-white placeholder-zinc-500 focus:outline-none focus:border-[#C29B53] focus:ring-1 focus:ring-[#C29B53] transition-all resize-none disabled:opacity-50"
          />
        </div>

        {/* Suggested Queries */}
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
            Suggested:
          </span>
          {activeSuggestedQueries.map((sq, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setQuery(sq)}
              disabled={loading}
              className="text-[11px] font-mono text-zinc-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 px-2.5 py-1 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              {sq}
            </button>
          ))}
        </div>

        {/* Action Button */}
        <div className="mt-5 flex items-center justify-between pt-4 border-t border-white/10">
          <div className="text-[11px] font-mono text-zinc-400 hidden sm:block">
            Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white">Enter</kbd> to analyze
          </div>

          <button
            type="button"
            onClick={handleAnalyze}
            disabled={loading || !file1 || !query.trim()}
            style={{ background: '#C29B53', color: '#000000' }}
            className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-mono font-bold uppercase tracking-wider hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Analyzing…</span>
              </>
            ) : (
              <>
                <Sparkles size={15} />
                <span>Analyze with SatQuery</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── LOADING PROGRESSION STATE ── */}
      {loading && (
        <div className="mb-8 flex justify-center animate-fade-in">
          <AnalysisLoadingState
            title="Analyzing satellite data..."
            subtitle="Processing your request with multi-agent orchestration... This may take a few moments."
          />
        </div>
      )}

      {/* ── REAL AI RESULT CARD ── */}
      {result && !loading && (
        <div
          ref={resultRef}
          className="rounded-2xl p-6 sm:p-8 backdrop-blur-2xl bg-black/60 border border-white/15 shadow-[0_20px_80px_rgba(0,0,0,0.85)] space-y-6 animate-fade-in"
        >
          {/* Result Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider bg-[#C29B53]/15 text-[#C29B53] border border-[#C29B53]/30 uppercase flex items-center gap-1.5">
                <Sparkles size={12} />
                <span>
                  {result.workflow === 'bitemporal'
                    ? 'Bi-Temporal Change Analysis'
                    : 'Single Image Visual Analysis'}
                </span>
              </span>

              {result.confidence !== undefined && (
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/30 border border-emerald-500/30 px-2 py-0.5 rounded">
                  Confidence: {result.confidence}%
                </span>
              )}

              {result.isDemoMode && (
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  DEMO MODE
                </span>
              )}
            </div>

            <span className="text-[10px] font-mono text-zinc-400">
              {new Date(result.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          {/* User Question */}
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-1">
              Your Question
            </div>
            <p className="text-base sm:text-lg font-medium text-white italic">
              &ldquo;{result.query}&rdquo;
            </p>
          </div>

          {/* AI Answer */}
          <div className="pt-3 border-t border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={14} className="text-[#C29B53]" />
              <span className="text-xs font-mono font-bold tracking-[0.2em] uppercase text-[#C29B53]">
                SatQuery Findings
              </span>
            </div>
            <p className="text-sm text-zinc-100 leading-relaxed font-sans whitespace-pre-wrap">
              {result.answer}
            </p>
          </div>

          {/* Visual Evidence / Change Visualization */}
          {(result.visualEvidenceUrl || result.changeVisualizationUrl) && (
            <div className="pt-3 border-t border-white/10">
              <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
                <FileImage size={12} className="text-[#C29B53]" />
                <span>
                  {result.changeVisualizationUrl
                    ? 'Change Visualization Map'
                    : 'Visual Evidence'}
                </span>
              </div>
              <div className="rounded-xl overflow-hidden border border-white/15 bg-black/80 max-h-[380px] flex items-center justify-center p-2 shadow-inner">
                <img
                  src={result.changeVisualizationUrl || result.visualEvidenceUrl}
                  alt="SatQuery Analysis Evidence"
                  className="max-h-[360px] max-w-full object-contain rounded-lg"
                />
              </div>
            </div>
          )}

          {/* Detected Changes (Bi-Temporal) */}
          {result.detectedChanges && result.detectedChanges.length > 0 && (
            <div className="pt-3 border-t border-white/10">
              <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-2">
                Detected Changes ({result.detectedChanges.length})
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {result.detectedChanges.map((change, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between"
                  >
                    <span className="text-xs text-white font-medium">{change.label}</span>
                    {change.category && (
                      <span className="text-[10px] font-mono text-zinc-400 px-2 py-0.5 rounded bg-white/[0.04]">
                        {change.category}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metrics (Bi-Temporal) */}
          {result.metrics && (
            <div className="pt-3 border-t border-white/10 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {result.metrics.changeAreaKm2 !== undefined && (
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                  <div className="text-[10px] font-mono uppercase text-zinc-400">Total Changed</div>
                  <div className="text-lg font-bold font-mono text-white mt-0.5">
                    {result.metrics.changeAreaKm2.toFixed(2)} km²
                  </div>
                </div>
              )}
              {result.metrics.mainChange && (
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                  <div className="text-[10px] font-mono uppercase text-zinc-400">Primary Transition</div>
                  <div className="text-lg font-bold font-mono text-[#C29B53] mt-0.5">
                    {result.metrics.mainChange}
                  </div>
                </div>
              )}
              {result.metrics.confidence !== undefined && (
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                  <div className="text-[10px] font-mono uppercase text-zinc-400">Confidence</div>
                  <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
                    {result.metrics.confidence}%
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Detected Categories (Single Image) */}
          {result.detectedCategories && result.detectedCategories.length > 0 && (
            <div className="pt-3 border-t border-white/10">
              <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-2">
                Identified Land Categories
              </div>
              <div className="flex flex-wrap gap-1.5">
                {result.detectedCategories.map((cat, i) => (
                  <span
                    key={i}
                    className="text-xs font-mono px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10 text-zinc-300"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Expandable Analysis Details (Subtle model metadata for debugging) */}
          <div className="pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
            >
              <span>{showDetails ? 'Hide' : 'View'} analysis details</span>
              {showDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>

            {showDetails && (
              <div className="mt-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/5 font-mono text-[11px] text-zinc-400 space-y-1">
                <div>Workflow: <span className="text-white">{result.workflow}</span></div>
                {result.model && <div>Model selected by Agent: <span className="text-[#C29B53]">{result.model}</span></div>}
                {result.processingTimeMs && <div>Processing Time: <span className="text-white">{result.processingTimeMs} ms</span></div>}
                <div>Interaction ID: <span className="text-zinc-500">{result.id}</span></div>
              </div>
            )}
          </div>

          {/* Action Buttons: Generate Report & Print Report */}
          <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                Analysis Complete · Multi-agent intelligence
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  const rData: AnalysisResultData = {
                    id: result.id,
                    trace_id: result.id,
                    query: result.query,
                    final_answer: result.answer,
                    answer: result.answer,
                    confidence: result.confidence,
                    changeDetected: result.detectedChanges?.map((c) => c.label).join(', ') || result.metrics?.mainChange,
                    affectedArea: result.metrics?.changeAreaKm2 ? `${result.metrics.changeAreaKm2} km²` : undefined,
                    beforeImageUrl: result.beforeImageUrl || previewUrl1 || undefined,
                    afterImageUrl: result.afterImageUrl || previewUrl2 || undefined,
                    visualEvidenceUrl: result.visualEvidenceUrl,
                    changeVisualizationUrl: result.changeVisualizationUrl,
                    detectedCategories: result.detectedCategories,
                    isDemoMode: result.isDemoMode,
                  };
                  if (onOpenReportModal) {
                    onOpenReportModal(rData);
                  } else {
                    setLocalReportData(rData);
                    setIsLocalReportOpen(true);
                  }
                }}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-[#C29B53] hover:bg-[#CCA563] text-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow active:scale-95"
              >
                <FileText size={14} />
                <span>Generate Report</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const rData: AnalysisResultData = {
                    id: result.id,
                    trace_id: result.id,
                    query: result.query,
                    final_answer: result.answer,
                    answer: result.answer,
                    confidence: result.confidence,
                    changeDetected: result.detectedChanges?.map((c) => c.label).join(', ') || result.metrics?.mainChange,
                    affectedArea: result.metrics?.changeAreaKm2 ? `${result.metrics.changeAreaKm2} km²` : undefined,
                    beforeImageUrl: result.beforeImageUrl || previewUrl1 || undefined,
                    afterImageUrl: result.afterImageUrl || previewUrl2 || undefined,
                    visualEvidenceUrl: result.visualEvidenceUrl,
                    changeVisualizationUrl: result.changeVisualizationUrl,
                    detectedCategories: result.detectedCategories,
                    isDemoMode: result.isDemoMode,
                  };
                  if (onOpenReportModal) {
                    onOpenReportModal(rData);
                  } else {
                    setLocalReportData(rData);
                    setIsLocalReportOpen(true);
                  }
                }}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-mono font-semibold text-zinc-200 hover:text-white bg-white/[0.08] hover:bg-white/[0.15] border border-white/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer size={14} />
                <span>Print Report</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Local Report Modal */}
      {localReportData && (
        <ReportModal
          isOpen={isLocalReportOpen}
          onClose={() => setIsLocalReportOpen(false)}
          data={localReportData}
        />
      )}
    </div>
  );
}
