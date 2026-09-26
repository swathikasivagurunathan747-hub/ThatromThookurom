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
  Layers,
  SlidersHorizontal,
  Columns,
  Calendar,
  Plus,
  FolderPlus,
} from 'lucide-react';
import { analyzeBiTemporalImages } from '../../services/analysisService';
import type { BiTemporalAnalysisResult } from '../../types';
import { AnalysisLoadingState } from './AnalysisLoadingState';
import { ReportModal } from '../reports/ReportModal';
import type { AnalysisResultData } from './AnalysisResultView';
import { FileText, Printer } from 'lucide-react';

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
  'What changed between these two images?',
  'Has urbanization increased?',
  'Where has vegetation decreased?',
  'Where has construction occurred?',
  'Identify major land-use changes.',
];

const LOADING_PHASES = [
  'Uploading pre & post scenes to cloud storage...',
  'Aligning temporal coordinate grids...',
  'Computing differential spectral indices...',
  'Detecting structural & canopy change...',
  'Synthesizing bi-temporal intelligence...',
];

export interface BiTemporalAnalysisProps {
  onAnalysisComplete?: (
    result: BiTemporalAnalysisResult,
    meta: {
      file1?: File;
      file2?: File;
      previewUrl1?: string;
      previewUrl2?: string;
    }
  ) => void;
  onOpenReportModal?: (data: AnalysisResultData) => void;
}

export function BiTemporalAnalysis({ onAnalysisComplete, onOpenReportModal }: BiTemporalAnalysisProps = {}) {
  // Image 1 State (Before)
  const [file1, setFile1] = useState<File | null>(null);
  const [previewUrl1, setPreviewUrl1] = useState<string | null>(null);
  const [zoomLevel1, setZoomLevel1] = useState<number>(1);
  const [dragActive1, setDragActive1] = useState<boolean>(false);
  const [date1, setDate1] = useState<string>('');
  const [localReportData, setLocalReportData] = useState<AnalysisResultData | null>(null);
  const [isLocalReportOpen, setIsLocalReportOpen] = useState(false);

  // Image 2 State (After)
  const [file2, setFile2] = useState<File | null>(null);
  const [previewUrl2, setPreviewUrl2] = useState<string | null>(null);
  const [zoomLevel2, setZoomLevel2] = useState<number>(1);
  const [dragActive2, setDragActive2] = useState<boolean>(false);
  const [date2, setDate2] = useState<string>('');

  // Comparison View Mode in Results: 'side-by-side' (required baseline) or 'slider' (optional)
  const [comparisonMode, setComparisonMode] = useState<'side-by-side' | 'slider'>('side-by-side');
  const [sliderPosition, setSliderPosition] = useState<number>(50);

  // Query & Analysis State
  const [query, setQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingPhaseIndex, setLoadingPhaseIndex] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BiTemporalAnalysisResult | null>(null);

  // Explicit Dev Mock Toggle (default false — live mode strictly enforced)
  const [forceMock, setForceMock] = useState<boolean>(false);

  const fileInputRef1 = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);

  // Clean up object URLs on unmount or replace
  useEffect(() => {
    return () => {
      if (previewUrl1 && previewUrl1.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl1);
      }
      if (previewUrl2 && previewUrl2.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl2);
      }
    };
  }, [previewUrl1, previewUrl2]);

  // Loading animation phases
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      setLoadingPhaseIndex(0);
      interval = setInterval(() => {
        setLoadingPhaseIndex((prev) => (prev + 1) % LOADING_PHASES.length);
      }, 800);
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
      setError('Please upload a supported image (GeoTIFF, TIFF, PNG, JPG, or JP2).');
      return false;
    }
    return true;
  };

  const handleSelectFile1 = useCallback((selectedFile: File) => {
    if (!validateFile(selectedFile)) return;
    if (previewUrl1 && previewUrl1.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl1);
    }
    const url = URL.createObjectURL(selectedFile);
    setFile1(selectedFile);
    setPreviewUrl1(url);
    setZoomLevel1(1);
    setError(null);
    setResult(null);
  }, [previewUrl1]);

  const handleSelectFile2 = useCallback((selectedFile: File) => {
    if (!validateFile(selectedFile)) return;
    if (previewUrl2 && previewUrl2.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl2);
    }
    const url = URL.createObjectURL(selectedFile);
    setFile2(selectedFile);
    setPreviewUrl2(url);
    setZoomLevel2(1);
    setError(null);
    setResult(null);
  }, [previewUrl2]);

  const handleRemoveImage1 = () => {
    if (previewUrl1 && previewUrl1.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl1);
    }
    setFile1(null);
    setPreviewUrl1(null);
    setZoomLevel1(1);
    setDate1('');
    setResult(null);
    setError(null);
    if (fileInputRef1.current) {
      fileInputRef1.current.value = '';
    }
  };

  const handleRemoveImage2 = () => {
    if (previewUrl2 && previewUrl2.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl2);
    }
    setFile2(null);
    setPreviewUrl2(null);
    setZoomLevel2(1);
    setDate2('');
    setResult(null);
    setError(null);
    if (fileInputRef2.current) {
      fileInputRef2.current.value = '';
    }
  };

  const handleAnalyze = async () => {
    if (!file1) {
      setError('Please upload the first satellite image.');
      return;
    }
    if (!file2) {
      setError('Please upload the second satellite image.');
      return;
    }
    if (!query.trim()) {
      setError('Enter a question about the changes.');
      return;
    }
    if (loading) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await analyzeBiTemporalImages({
        image1File: file1,
        image2File: file2,
        queryText: query,
        forceMock,
      });

      if (res.success && res.data) {
        setResult(res.data);
        onAnalysisComplete?.(res.data, {
          file1: file1 || undefined,
          file2: file2 || undefined,
          previewUrl1: previewUrl1 || undefined,
          previewUrl2: previewUrl2 || undefined,
        });
      } else {
        setError(res.error || "We couldn't complete the change analysis. Please try again.");
      }
    } catch {
      setError('Analysis service unavailable. Please try again.');
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
    handleRemoveImage1();
    handleRemoveImage2();
    setQuery('');
    setResult(null);
    setError(null);
    setComparisonMode('side-by-side');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 font-sans select-none">
      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef1}
        type="file"
        accept=".tif,.tiff,.png,.jpg,.jpeg,.jp2,image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleSelectFile1(e.target.files[0]);
          }
        }}
      />
      <input
        ref={fileInputRef2}
        type="file"
        accept=".tif,.tiff,.png,.jpg,.jpeg,.jp2,image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleSelectFile2(e.target.files[0]);
          }
        }}
      />

      {/* ════════════════════════════════════════════════════════
          WORKFLOW HEADER & DEMO SWITCH
      ════════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10 mb-8 text-left">
        <div>
          <div className="text-[11px] font-mono tracking-[0.2em] uppercase text-[#C29B53] font-semibold flex items-center gap-2">
            <span>Workflow Step 3</span>
            <span className="text-zinc-600">·</span>
            <span>Bi-Temporal Change Detection</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-white mt-1">
            Bi-Temporal Analysis
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Compare two satellite images and ask SatQuery what changed.
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
            DEMO / MOCK — NOT REAL MODEL OUTPUT: Simulated responses are active for offline testing. Live backend pipeline is bypassed.
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
          DUAL IMAGE WORKSPACE: TWO VISUALLY EQUAL CARDS
      ════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ── CARD 01 (BEFORE IMAGE) ── */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider bg-[#C29B53]/15 text-[#C29B53] border border-[#C29B53]/30">
                IMAGE 01
              </span>
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                First Scene
              </span>
            </div>
            {date1 ? (
              <span className="text-[11px] font-mono text-zinc-300 flex items-center gap-1">
                <Calendar size={11} className="text-[#C29B53]" />
                {date1}
              </span>
            ) : null}
          </div>

          {!previewUrl1 ? (
            /* Upload Dropzone 01 */
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive1(true);
              }}
              onDragLeave={() => setDragActive1(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive1(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleSelectFile1(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef1.current?.click()}
              className={`
                h-[280px] sm:h-[320px] rounded-2xl p-6 border-2 border-dashed transition-all
                flex flex-col items-center justify-center text-center cursor-pointer group
                backdrop-blur-2xl bg-black/50 shadow-[0_20px_60px_rgba(0,0,0,0.8)]
                ${
                  dragActive1
                    ? 'border-[#C29B53] bg-[#C29B53]/10 shadow-sm'
                    : 'border-white/20 hover:border-[#C29B53]/60 hover:bg-white/[0.04]'
                }
              `}
            >
              <div className="w-14 h-14 rounded-2xl bg-white/[0.05] border border-white/15 group-hover:border-[#C29B53]/40 flex items-center justify-center mb-3 transition-all shadow-inner group-hover:scale-105">
                <UploadCloud size={26} className="text-[#C29B53]" />
              </div>
              <p className="text-base font-bold text-white font-sans tracking-wide">
                Upload first image
              </p>
              <p className="text-xs text-zinc-400 font-mono mt-1">
                Drop or click to browse
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 text-[9px] font-mono text-zinc-500">
                <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/10">GeoTIFF</span>
                <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/10">JP2</span>
                <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/10">PNG / JPG</span>
              </div>
            </div>
          ) : (
            /* Preview State 01 */
            <div className="rounded-2xl backdrop-blur-2xl bg-black/60 border border-white/15 overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.85)] flex flex-col h-[280px] sm:h-[320px]">
              {/* Toolbar */}
              <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-white/10 bg-white/[0.02]">
                <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-300 truncate">
                  <FileImage size={14} className="text-[#C29B53] shrink-0" />
                  <span className="font-semibold truncate text-white max-w-[150px]">{file1?.name}</span>
                  {file1 && (
                    <span className="text-zinc-500 text-[10px] shrink-0">
                      ({formatFileSize(file1.size)})
                    </span>
                  )}
                </div>
                {/* Inspection Zoom Controls */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setZoomLevel1((z) => Math.max(0.6, z - 0.2))}
                    title="Zoom Out"
                    className="p-1 rounded-md bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
                  >
                    <ZoomOut size={12} />
                  </button>
                  <span className="text-[10px] font-mono text-zinc-400 w-8 text-center">
                    {Math.round(zoomLevel1 * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoomLevel1((z) => Math.min(3.0, z + 0.2))}
                    title="Zoom In"
                    className="p-1 rounded-md bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
                  >
                    <ZoomIn size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomLevel1(1)}
                    title="Reset Fit"
                    className="p-1 rounded-md bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
                  >
                    <RotateCcw size={12} />
                  </button>
                </div>
              </div>

              {/* Viewport */}
              <div className="relative flex-1 bg-black/90 flex items-center justify-center overflow-hidden">
                <img
                  src={previewUrl1}
                  alt="Satellite Scene 01"
                  style={{
                    transform: `scale(${zoomLevel1})`,
                    transition: 'transform 0.15s ease-out',
                  }}
                  className="max-h-full max-w-full object-contain pointer-events-none"
                />
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between px-3.5 py-2 border-t border-white/10 bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={date1}
                    onChange={(e) => setDate1(e.target.value)}
                    placeholder="Acquisition date (optional)"
                    className="bg-transparent border-b border-white/10 hover:border-white/30 focus:border-[#C29B53] text-[11px] font-mono text-zinc-300 placeholder:text-zinc-600 outline-none px-1 py-0.5 w-36 transition-colors"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef1.current?.click()}
                    className="px-2.5 py-1 rounded-md text-[11px] font-mono text-zinc-300 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <RefreshCw size={11} />
                    <span>Replace</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveImage1}
                    className="px-2.5 py-1 rounded-md text-[11px] font-mono text-red-400 hover:text-red-300 bg-red-950/20 hover:bg-red-950/40 border border-red-500/20 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 size={11} />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── CARD 02 (AFTER IMAGE) ── */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider bg-[#C29B53]/15 text-[#C29B53] border border-[#C29B53]/30">
                IMAGE 02
              </span>
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                Second Scene
              </span>
            </div>
            {date2 ? (
              <span className="text-[11px] font-mono text-zinc-300 flex items-center gap-1">
                <Calendar size={11} className="text-[#C29B53]" />
                {date2}
              </span>
            ) : null}
          </div>

          {!previewUrl2 ? (
            /* Upload Dropzone 02 */
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive2(true);
              }}
              onDragLeave={() => setDragActive2(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive2(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleSelectFile2(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef2.current?.click()}
              className={`
                h-[280px] sm:h-[320px] rounded-2xl p-6 border-2 border-dashed transition-all
                flex flex-col items-center justify-center text-center cursor-pointer group
                backdrop-blur-2xl bg-black/50 shadow-[0_20px_60px_rgba(0,0,0,0.8)]
                ${
                  dragActive2
                    ? 'border-[#C29B53] bg-[#C29B53]/10 shadow-sm'
                    : 'border-white/20 hover:border-[#C29B53]/60 hover:bg-white/[0.04]'
                }
              `}
            >
              <div className="w-14 h-14 rounded-2xl bg-white/[0.05] border border-white/15 group-hover:border-[#C29B53]/40 flex items-center justify-center mb-3 transition-all shadow-inner group-hover:scale-105">
                <UploadCloud size={26} className="text-[#C29B53]" />
              </div>
              <p className="text-base font-bold text-white font-sans tracking-wide">
                Upload second image
              </p>
              <p className="text-xs text-zinc-400 font-mono mt-1">
                Drop or click to browse
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 text-[9px] font-mono text-zinc-500">
                <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/10">GeoTIFF</span>
                <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/10">JP2</span>
                <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/10">PNG / JPG</span>
              </div>
            </div>
          ) : (
            /* Preview State 02 */
            <div className="rounded-2xl backdrop-blur-2xl bg-black/60 border border-white/15 overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.85)] flex flex-col h-[280px] sm:h-[320px]">
              {/* Toolbar */}
              <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-white/10 bg-white/[0.02]">
                <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-300 truncate">
                  <FileImage size={14} className="text-[#C29B53] shrink-0" />
                  <span className="font-semibold truncate text-white max-w-[150px]">{file2?.name}</span>
                  {file2 && (
                    <span className="text-zinc-500 text-[10px] shrink-0">
                      ({formatFileSize(file2.size)})
                    </span>
                  )}
                </div>
                {/* Inspection Zoom Controls */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setZoomLevel2((z) => Math.max(0.6, z - 0.2))}
                    title="Zoom Out"
                    className="p-1 rounded-md bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
                  >
                    <ZoomOut size={12} />
                  </button>
                  <span className="text-[10px] font-mono text-zinc-400 w-8 text-center">
                    {Math.round(zoomLevel2 * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoomLevel2((z) => Math.min(3.0, z + 0.2))}
                    title="Zoom In"
                    className="p-1 rounded-md bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
                  >
                    <ZoomIn size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomLevel2(1)}
                    title="Reset Fit"
                    className="p-1 rounded-md bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
                  >
                    <RotateCcw size={12} />
                  </button>
                </div>
              </div>

              {/* Viewport */}
              <div className="relative flex-1 bg-black/90 flex items-center justify-center overflow-hidden">
                <img
                  src={previewUrl2}
                  alt="Satellite Scene 02"
                  style={{
                    transform: `scale(${zoomLevel2})`,
                    transition: 'transform 0.15s ease-out',
                  }}
                  className="max-h-full max-w-full object-contain pointer-events-none"
                />
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between px-3.5 py-2 border-t border-white/10 bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={date2}
                    onChange={(e) => setDate2(e.target.value)}
                    placeholder="Acquisition date (optional)"
                    className="bg-transparent border-b border-white/10 hover:border-white/30 focus:border-[#C29B53] text-[11px] font-mono text-zinc-300 placeholder:text-zinc-600 outline-none px-1 py-0.5 w-36 transition-colors"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef2.current?.click()}
                    className="px-2.5 py-1 rounded-md text-[11px] font-mono text-zinc-300 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <RefreshCw size={11} />
                    <span>Replace</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveImage2}
                    className="px-2.5 py-1 rounded-md text-[11px] font-mono text-red-400 hover:text-red-300 bg-red-950/20 hover:bg-red-950/40 border border-red-500/20 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 size={11} />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          QUERY INPUT SECTION (Ask SatQuery)
      ════════════════════════════════════════════════════════ */}
      <div className="mt-8 rounded-2xl p-6 sm:p-8 backdrop-blur-2xl bg-black/60 border border-white/15 shadow-[0_20px_80px_rgba(0,0,0,0.85)] text-left">
        <div className="mb-4">
          <label className="block text-sm font-bold uppercase tracking-wider text-white font-mono">
            Ask SatQuery
          </label>
          <p className="text-xs text-zinc-400 mt-1">
            Ask any natural-language question about what changed between these two images.
          </p>
        </div>

        {/* Textarea */}
        <div className="relative">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What changed between these two images?"
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
            disabled={!file1 || !file2 || !query.trim() || loading}
            className={`
              w-full sm:w-auto px-8 py-3.5 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-[0.18em] font-mono
              flex items-center justify-center gap-2.5 transition-all
              ${
                !file1 || !file2 || !query.trim() || loading
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
            title="Analyzing multi-temporal imagery..."
            subtitle="Comparing satellite acquisitions and running change detection... This may take a few moments."
          />
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          ANALYSIS RESULT STATE
      ════════════════════════════════════════════════════════ */}
      {result && !loading && (
        <div className="mt-8 rounded-2xl p-6 sm:p-8 backdrop-blur-2xl bg-black/80 border border-white/20 shadow-[0_20px_80px_rgba(0,0,0,0.9)] text-left animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-[#C29B53]" />
              <h2 className="text-base font-bold uppercase tracking-[0.16em] text-white font-mono">
                Analysis Result
              </h2>
            </div>
            {result.isDemoMode && (
              <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                SIMULATION RESULT (DEMO)
              </span>
            )}
          </div>

          {/* Section 1: User Question */}
          <div className="my-5">
            <div className="text-[11px] font-mono uppercase tracking-widest text-zinc-400 mb-1">
              Question
            </div>
            <p className="text-base sm:text-lg font-medium text-white italic">
              &ldquo;{result.query}&rdquo;
            </p>
          </div>

          {/* Section 2: AI-Generated Answer */}
          <div className="pt-5 border-t border-white/10 my-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono font-bold tracking-[0.2em] uppercase text-[#C29B53]">
                SATQUERY AI
              </span>
            </div>
            <p className="text-sm sm:text-base text-zinc-100 leading-relaxed font-sans">
              {result.answer}
            </p>
          </div>

          {/* Section 3: Temporal Comparison (Side-by-side baseline with optional Split Slider) */}
          <div className="pt-5 border-t border-white/10 my-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Layers size={14} className="text-[#C29B53]" />
                <span className="text-xs font-mono font-bold tracking-[0.2em] uppercase text-zinc-300">
                  Temporal Comparison
                </span>
              </div>

              {/* View Toggle: Side-by-Side (Baseline) vs Split Slider */}
              <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-lg border border-white/10">
                <button
                  type="button"
                  onClick={() => setComparisonMode('side-by-side')}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                    comparisonMode === 'side-by-side'
                      ? 'bg-[#C29B53] text-black font-bold shadow'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Columns size={11} />
                  <span>Side-by-Side</span>
                </button>
                <button
                  type="button"
                  onClick={() => setComparisonMode('slider')}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                    comparisonMode === 'slider'
                      ? 'bg-[#C29B53] text-black font-bold shadow'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <SlidersHorizontal size={11} />
                  <span>Split Slider</span>
                </button>
              </div>
            </div>

            {/* View Render */}
            {comparisonMode === 'side-by-side' ? (
              /* Side-by-Side Comparison (Baseline) */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Before Image */}
                <div className="rounded-xl overflow-hidden border border-white/15 bg-black/90">
                  <div className="px-3 py-2 bg-white/[0.03] border-b border-white/10 flex items-center justify-between text-xs font-mono">
                    <span className="text-zinc-300 font-bold text-[11px] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C29B53]" />
                      BEFORE · Image 01
                    </span>
                    {date1 && <span className="text-zinc-400 text-[10px]">{date1}</span>}
                  </div>
                  <div className="h-[220px] sm:h-[260px] flex items-center justify-center p-2">
                    <img
                      src={result.beforeImageUrl || previewUrl1 || undefined}
                      alt="Before Acquisition"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                </div>

                {/* After Image */}
                <div className="rounded-xl overflow-hidden border border-white/15 bg-black/90">
                  <div className="px-3 py-2 bg-white/[0.03] border-b border-white/10 flex items-center justify-between text-xs font-mono">
                    <span className="text-zinc-300 font-bold text-[11px] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      AFTER · Image 02
                    </span>
                    {date2 && <span className="text-zinc-400 text-[10px]">{date2}</span>}
                  </div>
                  <div className="h-[220px] sm:h-[260px] flex items-center justify-center p-2">
                    <img
                      src={result.afterImageUrl || previewUrl2 || undefined}
                      alt="After Acquisition"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* Split Slider Mode (Optional interactive slider) */
              <div className="rounded-xl overflow-hidden border border-white/15 bg-black/90 relative">
                <div className="relative h-[280px] sm:h-[340px] w-full overflow-hidden">
                  {/* Before Image (Bottom Layer) */}
                  <img
                    src={result.beforeImageUrl || previewUrl1 || undefined}
                    alt="Before Layer"
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                  />
                  {/* After Image (Top Layer clipped by slider) */}
                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
                  >
                    <img
                      src={result.afterImageUrl || previewUrl2 || undefined}
                      alt="After Layer"
                      className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                    />
                  </div>
                  {/* Slider Divider Line */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-[#C29B53] cursor-ew-resize pointer-events-none"
                    style={{ left: `${sliderPosition}%` }}
                  >
                    <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-black border-2 border-[#C29B53] flex items-center justify-center text-[9px] font-mono text-white shadow-lg">
                      ⇆
                    </div>
                  </div>
                  {/* Interactive Slider Input Overlay */}
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={sliderPosition}
                    onChange={(e) => setSliderPosition(Number(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
                    aria-label="Image comparison slider"
                  />
                </div>
                {/* Slider Footer */}
                <div className="px-4 py-2 bg-white/[0.03] border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-zinc-400">
                  <span>BEFORE (Image 01)</span>
                  <span className="text-zinc-600">Drag horizontally to compare</span>
                  <span>AFTER (Image 02)</span>
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Detected Changes (Rendered only if actually returned by backend) */}
          {result.detectedChanges && result.detectedChanges.length > 0 && (
            <div className="pt-5 border-t border-white/10 my-5">
              <div className="text-xs font-mono font-bold tracking-[0.2em] uppercase text-zinc-300 mb-3">
                Detected Changes
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {result.detectedChanges.map((change, idx) => (
                  <div
                    key={change.id || idx}
                    className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C29B53] shrink-0" />
                      <span className="text-xs font-semibold text-white truncate">
                        {change.label}
                      </span>
                    </div>
                    {change.category && (
                      <span className="text-[10px] font-mono text-zinc-500 mt-1 pl-3.5">
                        {change.category}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 5: Change Visualization (Rendered only if returned by backend) */}
          {result.changeVisualizationUrl && (
            <div className="pt-5 border-t border-white/10 my-5">
              <div className="text-xs font-mono font-bold tracking-[0.2em] uppercase text-zinc-300 mb-3">
                Change Visualization
              </div>
              <div className="relative rounded-xl overflow-hidden border border-white/15 bg-black/90 max-h-[380px] flex items-center justify-center">
                <img
                  src={result.changeVisualizationUrl}
                  alt="Change Visualization Output"
                  className="w-full h-auto max-h-[380px] object-contain"
                />
              </div>
            </div>
          )}

          {/* Section 6: Result Metrics (Rendered only if returned by backend) */}
          {result.metrics && (result.metrics.changeAreaKm2 !== undefined || result.metrics.confidence !== undefined || result.metrics.mainChange !== undefined) && (
            <div className="pt-5 border-t border-white/10 my-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {result.metrics.changeAreaKm2 !== undefined && (
                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-center">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                      Change Area
                    </div>
                    <div className="text-lg font-mono font-bold text-[#C29B53] mt-1">
                      {result.metrics.changeAreaKm2} km²
                    </div>
                  </div>
                )}
                {result.metrics.confidence !== undefined && (
                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-center">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                      Confidence
                    </div>
                    <div className="text-lg font-mono font-bold text-emerald-400 mt-1">
                      {result.metrics.confidence}%
                    </div>
                  </div>
                )}
                {result.metrics.mainChange !== undefined && (
                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-center">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                      Main Change
                    </div>
                    <div className="text-lg font-sans font-bold text-white mt-1 truncate">
                      {result.metrics.mainChange}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section 7: Result Actions */}
          <div className="mt-8 pt-5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleNewAnalysis}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-mono font-bold tracking-wider uppercase text-white bg-white/[0.08] hover:bg-white/[0.14] border border-white/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <RefreshCw size={13} />
              <span>New Analysis</span>
            </button>

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
                    confidence: result.metrics?.confidence || 92,
                    changeDetected: result.detectedChanges?.map((c) => c.label).join(', ') || result.metrics?.mainChange,
                    affectedArea: result.metrics?.changeAreaKm2 ? `${result.metrics.changeAreaKm2} km²` : undefined,
                    beforeImageUrl: result.beforeImageUrl || previewUrl1 || undefined,
                    afterImageUrl: result.afterImageUrl || previewUrl2 || undefined,
                    changeVisualizationUrl: result.changeVisualizationUrl,
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
                    confidence: result.metrics?.confidence || 92,
                    changeDetected: result.detectedChanges?.map((c) => c.label).join(', ') || result.metrics?.mainChange,
                    affectedArea: result.metrics?.changeAreaKm2 ? `${result.metrics.changeAreaKm2} km²` : undefined,
                    beforeImageUrl: result.beforeImageUrl || previewUrl1 || undefined,
                    afterImageUrl: result.afterImageUrl || previewUrl2 || undefined,
                    changeVisualizationUrl: result.changeVisualizationUrl,
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
