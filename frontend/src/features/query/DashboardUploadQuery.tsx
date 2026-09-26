import { DashboardAnalysis } from '../dashboard/DashboardAnalysis';
import { AerospaceBackground } from '../../components/ui/AerospaceBackground';
import type { AgenticAnalysisResult } from '../../types';

export interface DashboardUploadQueryProps {
  onAnalyze?: (query: string, mode?: string, layer?: string, files?: File[]) => void;
  loading?: boolean;
  onAnalysisComplete?: (
    result: AgenticAnalysisResult,
    meta: { files: File[]; previewUrls: string[] }
  ) => void;
}

export function DashboardUploadQuery({
  onAnalyze: _onAnalyze,
  loading: _loading,
  onAnalysisComplete,
}: DashboardUploadQueryProps) {
  return (
    <div className="relative min-h-screen w-full bg-black text-white font-sans overflow-x-hidden select-none">
      {/* ════════════════════════════════════════════════════════
          DYNAMIC CINEMATIC AEROSPACE BACKGROUND
      ════════════════════════════════════════════════════════ */}
      <AerospaceBackground />

      {/* ════════════════════════════════════════════════════════
          INTELLIGENT AGENTIC AI ANALYSIS WORKSPACE
      ════════════════════════════════════════════════════════ */}
      <div className="relative z-20 w-full">
        <DashboardAnalysis onAnalysisComplete={onAnalysisComplete} />
      </div>
    </div>
  );
}
