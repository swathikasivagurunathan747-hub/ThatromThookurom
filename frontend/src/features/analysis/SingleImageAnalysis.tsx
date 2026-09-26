import { useState, useRef, useEffect, useCallback } from 'react';
import {
  UploadCloud,
  Sparkles,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RefreshCw,
  Trash2,
  AlertCircle,
  Loader2,
  Share2,
  ArrowRight,
  ShieldAlert,
  FileImage,
  Eye,
  Plus,
  FolderPlus,
} from 'lucide-react';
import { analyzeSingleImage } from '../../services/analysisService';
import type { SingleImageAnalysisResult } from '../../types';
import { AnalysisLoadingState } from './AnalysisLoadingState';
import { AnalysisResultView, type AnalysisResultData } from './AnalysisResultView';
import { ReportModal } from '../reports/ReportModal';

const SUPPORTED_EXTENSIONS = ['.tif', '.tiff', '.png', '.jpg', '.jpeg', '.jp2'];
const SUPPORTED_MIME_TYPES = [
  'image/tiff',
  'image/x-tiff',
  'image/png',
  'image/jpeg',
  'image/jp2',
  'image/jpx',
];

const SUGGESTED_QUERIES = [
  'What type of land use is visible?',
  'Identify the major built-up areas.',
  'What vegetation is present?',
  'Describe the important features in this image.',
];

const LOADING_PHASES = [
  'Uploading image to cloud storage...',
  'Ingesting spectral bands...',
  'Processing satellite imagery...',
  'Synthesizing visual intelligence...',
];

export interface SingleImageAnalysisProps {
  onAnalysisComplete?: (
    result: SingleImageAnalysisResult,
    meta: { file?: File; previewUrl?: string }
  ) => void;
  onOpenReportModal?: (data: AnalysisResultData) => void;
}

export function SingleImageAnalysis({ onAnalysisComplete, onOpenReportModal }: SingleImageAnalysisProps = {}) {
  // Image & File State
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [localReportData, setLocalReportData] = useState<AnalysisResultData | null>(null);
  const [isLocalReportOpen, setIsLocalReportOpen] = useState(false);

  // Query & Analysis State
  const [query, setQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingPhaseIndex, setLoadingPhaseIndex] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SingleImageAnalysisResult | null>(null);

  // Explicit Dev Mock Toggle (default false — live mode)
  const [forceMock, setForceMock] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Handle loading phases animation
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

  // File validation
  const validateFile = (selectedFile: File): boolean => {
    setError(null);
    const fileName = selectedFile.name.toLowerCase();
    const hasValidExt = SUPPORTED_EXTENSIONS.some((ext) => fileName.endsWith(ext));
    const hasValidMime =
      SUPPORTED_MIME_TYPES.includes(selectedFile.type) ||
      selectedFile.type.startsWith('image/');

    if (!hasValidExt && !hasValidMime) {
      setError(
        'Please upload a supported image (GeoTIFF, TIFF, PNG, JPG, or JP2).'
      );
      return false;
    }
    return true;
  };

  const handleSelectFile = useCallback((selectedFile: File) => {
    if (!validateFile(selectedFile)) return;

    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    const url = URL.createObjectURL(selectedFile);
    setFile(selectedFile);
    setPreviewUrl(url);
    setZoomLevel(1);
    setError(null);
    setResult(null);
  }, [previewUrl]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleSelectFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleSelectFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveImage = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(null);
    setPreviewUrl(null);
    setZoomLevel(1);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError('Please upload a supported image.');
      return;
    }
    if (!query.trim()) {
      setError('Enter a question about the image.');
      return;
    }
    if (loading) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await analyzeSingleImage({
        imageFile: file,
        queryText: query,
        forceMock,
      });

      if (res.success && res.data) {
        setResult(res.data);
        onAnalysisComplete?.(res.data, {
          file: file || undefined,
          previewUrl: previewUrl || undefined,
        });
      } else {
        setError(res.error || "We couldn't analyze this image. Please try again.");
      }
    } catch {
      setError('Analysis service unavailable. Please check backend connection.');
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

  const handleNewAnalysis = () => {
    setResult(null);
    setQuery('');
    setError(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 font-sans select-none">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".tif,.tiff,.png,.jpg,.jpeg,.jp2,image/*"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* ════════════════════════════════════════════════════════
          WORKFLOW HEADER & DEMO SWITCH
      ════════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10 mb-8 text-left">
        <div>
          <div className="text-[11px] font-mono tracking-[0.2em] uppercase text-[#C29B53] font-semibold flex items-center gap-2">
            <span>Workflow Step 1</span>
            <span className="text-zinc-600">·</span>
            <span>Natural-Language Earth Observation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-white mt-1">
            Single Image Analysis
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Upload a satellite image and ask SatQuery anything about it.
          </p>
        </div>

        {/* Developer Sandbox / Demo Mode Switch (Explicitly Gated) */}
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

      {/* Explicit Mock Mode Warning Banner */}
      {forceMock && (
        <div className="mb-6 p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-2 text-left font-mono">
          <ShieldAlert size={15} className="shrink-0 text-amber-400" />
          <span>
            DEMO / MOCK MODE ACTIVE: Simulated responses are enabled for offline development. Real backend calls to /api/analysis/single are bypassed.
          </span>
        </div>
      )}

      {/* Error Alert Banner */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-start justify-between gap-3 text-left">
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

      {/* ════════════════════════════════════════════════════════
          WORKFLOW STEP: IMAGE UPLOAD OR PREVIEW
      ════════════════════════════════════════════════════════ */}
      {!previewUrl ? (
        /* EMPTY STATE: LARGE DRAG-AND-DROP UPLOAD AREA */
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative rounded-2xl p-10 sm:p-14 border-2 border-dashed transition-all
            flex flex-col items-center justify-center text-center cursor-pointer group
            backdrop-blur-2xl bg-black/50 shadow-[0_20px_80px_rgba(0,0,0,0.8)]
            ${
              dragActive
                ? 'border-[#C29B53] bg-[#C29B53]/10 shadow-sm'
                : 'border-white/20 hover:border-[#C29B53]/60 hover:bg-white/[0.04]'
            }
          `}
        >
          <div className="w-16 h-16 rounded-2xl bg-white/[0.05] border border-white/15 group-hover:border-[#C29B53]/40 flex items-center justify-center mb-4 transition-all shadow-inner group-hover:scale-105">
            <UploadCloud size={30} className="text-[#C29B53]" />
          </div>

          <p className="text-lg font-bold text-white font-sans tracking-wide">
            Drop satellite image here
          </p>
          <p className="text-xs text-zinc-400 font-mono mt-1">
            or click to browse
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-[10px] font-mono text-zinc-400">
            <span className="px-2.5 py-1 rounded-md bg-white/[0.05] border border-white/10">
              GeoTIFF (.tif, .tiff)
            </span>
            <span className="px-2.5 py-1 rounded-md bg-white/[0.05] border border-white/10">
              JPEG2000 (.jp2)
            </span>
            <span className="px-2.5 py-1 rounded-md bg-white/[0.05] border border-white/10">
              PNG / JPG
            </span>
          </div>
        </div>
      ) : (
        /* PREVIEW STATE: IMAGE PREVIEW WITH CONTROLS */
        <div className="rounded-2xl backdrop-blur-2xl bg-black/60 border border-white/15 overflow-hidden shadow-[0_20px_80px_rgba(0,0,0,0.85)]">
          {/* Top Preview Toolbar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-white/[0.02]">
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-300 truncate">
              <FileImage size={15} className="text-[#C29B53] shrink-0" />
              <span className="font-semibold truncate text-white">{file?.name}</span>
              {file && (
                <span className="text-zinc-500 shrink-0">
                  ({formatFileSize(file.size)})
                </span>
              )}
            </div>

            {/* Inspection Zoom Controls */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.2))}
                title="Zoom Out"
                className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
              >
                <ZoomOut size={14} />
              </button>
              <span className="text-[10px] font-mono text-zinc-400 w-9 text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(3.0, z + 0.2))}
                title="Zoom In"
                className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
              >
                <ZoomIn size={14} />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(1)}
                title="Reset Fit"
                className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 hover:text-white border border-white/10 transition-colors cursor-pointer ml-1"
              >
                <RotateCcw size={14} />
              </button>
            </div>
          </div>

          {/* Centered Large Image Viewport */}
          <div className="relative w-full h-[320px] sm:h-[420px] bg-black/80 flex items-center justify-center overflow-hidden">
            <img
              src={previewUrl}
              alt="Satellite Scene Preview"
              style={{
                transform: `scale(${zoomLevel})`,
                transition: 'transform 0.15s ease-out',
              }}
              className="max-h-full max-w-full object-contain pointer-events-none"
            />
          </div>

          {/* Bottom Preview Actions Bar */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-white/10 bg-white/[0.02]">
            <span className="text-[11px] font-mono text-zinc-400">
              Ready for query reasoning
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg text-xs font-mono text-zinc-300 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw size={12} />
                <span>Replace</span>
              </button>
              <button
                type="button"
                onClick={handleRemoveImage}
                className="px-3 py-1.5 rounded-lg text-xs font-mono text-red-400 hover:text-red-300 bg-red-950/20 hover:bg-red-950/40 border border-red-500/20 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 size={12} />
                <span>Remove</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          WORKFLOW STEP: QUERY INPUT (ALWAYS VISIBLE ONCE IMAGE LOADED OR PREPARING)
      ════════════════════════════════════════════════════════ */}
      <div className="mt-8 rounded-2xl p-6 sm:p-8 backdrop-blur-2xl bg-black/60 border border-white/15 shadow-[0_20px_80px_rgba(0,0,0,0.85)] text-left">
        <div className="mb-4">
          <label className="block text-sm font-bold uppercase tracking-wider text-white font-mono">
            Ask SatQuery
          </label>
          <p className="text-xs text-zinc-400 mt-1">
            Type any natural-language question regarding this scene
          </p>
        </div>

        {/* Textarea */}
        <div className="relative">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What would you like to know about this image?"
            rows={3}
            className="w-full bg-white/[0.04] border border-white/15 focus:border-[#C29B53] focus:bg-white/[0.07] rounded-xl p-4 text-sm text-white placeholder:text-zinc-500 outline-none transition-all resize-none font-sans leading-relaxed"
          />
          <div className="flex items-center justify-between mt-1 px-1 text-[11px] font-mono text-zinc-500">
            <span>Press Enter to analyze</span>
            <span>{query.length} chars</span>
          </div>
        </div>

        {/* Suggested Queries */}
        <div className="mt-5">
          <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-2">
            Suggested questions:
          </div>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUERIES.map((sq) => (
              <button
                key={sq}
                type="button"
                onClick={() => setQuery(sq)}
                className="text-xs font-sans px-3 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/10 hover:border-[#C29B53]/40 transition-all cursor-pointer text-left"
              >
                {sq}
              </button>
            ))}
          </div>
        </div>

        {/* Primary ANALYZE Button */}
        <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-end">
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={!file || !query.trim() || loading}
            className={`
              w-full sm:w-auto px-8 py-3.5 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-[0.18em] font-mono
              flex items-center justify-center gap-2.5 transition-all
              ${
                !file || !query.trim() || loading
                  ? 'bg-zinc-800 text-zinc-500 border border-white/5 cursor-not-allowed'
                  : 'bg-[#C29B53] hover:bg-[#CCA563] text-black shadow-sm  active:scale-[0.99] cursor-pointer'
              }
            `}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Analyzing…</span>
              </>
            ) : (
              <>
                <span>ANALYZE</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          LOADING STATE
      ════════════════════════════════════════════════════════ */}
      {loading && (
        <div className="mt-8 flex justify-center animate-fade-in">
          <AnalysisLoadingState
            title="Analyzing satellite imagery..."
            subtitle="Running vision-language reasoning pipeline... This may take a few moments."
          />
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          STANDARDIZED REAL RESULT VIEW
      ════════════════════════════════════════════════════════ */}
      {result && !loading && (
        <div className="mt-8 animate-fade-in">
          <AnalysisResultView
            title="SINGLE MAP ANALYSIS RESULT"
            data={{
              id: result.id,
              trace_id: result.id,
              query: result.query,
              final_answer: result.answer,
              answer: result.answer,
              confidence: result.confidence,
              visualEvidenceUrl: result.visualEvidenceUrl || previewUrl || undefined,
              detectedCategories: result.detectedCategories,
              isDemoMode: result.isDemoMode,
            }}
            onGenerateReport={() => {
              const rData: AnalysisResultData = {
                id: result.id,
                trace_id: result.id,
                query: result.query,
                final_answer: result.answer,
                answer: result.answer,
                confidence: result.confidence,
                visualEvidenceUrl: result.visualEvidenceUrl || previewUrl || undefined,
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
            onPrintReport={() => {
              const rData: AnalysisResultData = {
                id: result.id,
                trace_id: result.id,
                query: result.query,
                final_answer: result.answer,
                answer: result.answer,
                confidence: result.confidence,
                visualEvidenceUrl: result.visualEvidenceUrl || previewUrl || undefined,
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
            onNewAnalysis={handleNewAnalysis}
          />
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
