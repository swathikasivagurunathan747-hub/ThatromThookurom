import { useEffect, useState } from 'react';
import {
  Sparkles,
  Lock,
  ArrowLeft,
  Calendar,
  Layers,
  Eye,
  AlertCircle,
  Loader2,
  TrendingUp,
} from 'lucide-react';
import { getPublicShare } from '../../services/workspaceService';
import type { PublicShare } from '../../types';
import { AerospaceBackground } from '../../components/ui/AerospaceBackground';

interface PublicShareViewProps {
  token: string;
  onNavigateApp: () => void;
}

export function PublicShareView({ token, onNavigateApp }: PublicShareViewProps) {
  const [loading, setLoading] = useState(true);
  const [share, setShare] = useState<PublicShare | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    getPublicShare(token).then((res) => {
      if (!active) return;
      if (res.success && res.data) {
        setShare(res.data);
      } else {
        setError(res.error || 'Shared analysis not found or link has expired.');
      }
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [token]);

  return (
    <div className="relative min-h-screen w-full bg-black text-white font-sans overflow-x-hidden select-none">
      <AerospaceBackground />

      {/* Top Banner: Read-Only Disclaimer */}
      <div className="relative z-30 w-full bg-[#C29B53]/10 border-b border-[#C29B53]/20 py-2.5 px-4 sm:px-8 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-2 text-xs font-mono text-[#C29B53]">
          <Lock size={13} />
          <span className="font-bold uppercase tracking-wider">
            Shared Publicly — Read Only
          </span>
          <span className="hidden sm:inline text-zinc-500">·</span>
          <span className="hidden sm:inline text-zinc-400">
            You are viewing a shared SatQuery Earth-observation analysis snapshot.
          </span>
        </div>

        <button
          type="button"
          onClick={onNavigateApp}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-semibold text-white bg-white/[0.08] hover:bg-white/[0.14] border border-white/20 transition-all cursor-pointer"
        >
          <ArrowLeft size={12} />
          <span>Launch SatQuery</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="relative z-20 max-w-4xl mx-auto py-10 px-4 sm:px-6">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <Loader2 size={32} className="text-[#C29B53] animate-spin mb-4" />
            <div className="text-sm font-mono text-zinc-400">
              Retrieving shared satellite intelligence session…
            </div>
          </div>
        ) : error || !share ? (
          <div className="py-16 text-center max-w-md mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-red-950/40 border border-red-500/40 flex items-center justify-center mx-auto mb-4 text-red-400">
              <AlertCircle size={24} />
            </div>
            <h2 className="text-xl font-bold uppercase tracking-tight text-white mb-2">
              Analysis Not Found
            </h2>
            <p className="text-xs text-zinc-400 font-mono mb-6 leading-relaxed">
              {error || 'This public share token is invalid or has expired.'}
            </p>
            <button
              type="button"
              onClick={onNavigateApp}
              className="px-6 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-[#C29B53] text-black hover:bg-[#CCA563] transition-all cursor-pointer"
            >
              Go to SatQuery Workspace
            </button>
          </div>
        ) : (
          /* Shared Analysis Session */
          <div className="space-y-8 text-left">
            {/* Header Card */}
            <div className="rounded-2xl p-6 sm:p-8 backdrop-blur-2xl bg-black/60 border border-white/15 shadow-[0_20px_80px_rgba(0,0,0,0.85)]">
              <div className="flex items-center gap-2 text-[11px] font-mono tracking-[0.2em] uppercase text-[#C29B53] font-semibold mb-2">
                <span>🛰 SATQUERY AI</span>
                {share.snapshot.projectName && (
                  <>
                    <span className="text-zinc-600">·</span>
                    <span className="text-zinc-400">{share.snapshot.projectName}</span>
                  </>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {share.snapshot.title}
              </h1>
              <div className="flex items-center gap-4 mt-3 text-xs font-mono text-zinc-500">
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} />
                  {new Date(share.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
                <span>·</span>
                <span>{share.snapshot.interactions.length} analysis interaction(s)</span>
              </div>
            </div>

            {/* Chronological Interactions */}
            <div className="space-y-6">
              {share.snapshot.interactions.map((interaction, idx) => (
                <div
                  key={interaction.id || idx}
                  className="rounded-2xl p-6 sm:p-8 backdrop-blur-2xl bg-black/60 border border-white/15 shadow-[0_20px_80px_rgba(0,0,0,0.85)] space-y-6"
                >
                  {/* Interaction Meta */}
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider bg-[#C29B53]/15 text-[#C29B53] border border-[#C29B53]/30 uppercase">
                      {interaction.type === 'single'
                        ? 'Single Image Analysis'
                        : interaction.type === 'map'
                        ? 'Map-Based AOI Analysis'
                        : 'Bi-Temporal Change Analysis'}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">
                      Step {idx + 1} of {share.snapshot.interactions.length}
                    </span>
                  </div>

                  {/* Question */}
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-1">
                      User Question
                    </div>
                    <p className="text-base sm:text-lg font-medium text-white italic">
                      &ldquo;{interaction.query}&rdquo;
                    </p>
                  </div>

                  {/* Visual Inputs if present */}
                  {interaction.imageUrls && interaction.imageUrls.length > 0 && (
                    <div className="pt-4 border-t border-white/10">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
                        <Eye size={12} />
                        <span>Analyzed Imagery</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {interaction.imageUrls.map((url, i) => (
                          <div
                            key={i}
                            className="rounded-xl overflow-hidden border border-white/10 bg-black/80 max-h-[260px] flex items-center justify-center p-1"
                          >
                            <img
                              src={url}
                              alt={`Input Scene ${i + 1}`}
                              className="max-h-full max-w-full object-contain"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Explanation */}
                  <div className="pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={14} className="text-[#C29B53]" />
                      <span className="text-xs font-mono font-bold tracking-[0.2em] uppercase text-[#C29B53]">
                        SatQuery AI Result
                      </span>
                    </div>
                    <p className="text-sm sm:text-base text-zinc-100 leading-relaxed font-sans">
                      {interaction.answer}
                    </p>
                  </div>

                  {/* Visual Evidence / Change Visualization */}
                  {(interaction.visualEvidenceUrl || interaction.changeVisualizationUrl) && (
                    <div className="pt-4 border-t border-white/10">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
                        <Layers size={12} className="text-[#C29B53]" />
                        <span>
                          {interaction.changeVisualizationUrl
                            ? 'Change Visualization Output'
                            : 'Visual Evidence'}
                        </span>
                      </div>
                      <div className="rounded-xl overflow-hidden border border-white/15 bg-black/90 max-h-[320px] flex items-center justify-center p-1">
                        <img
                          src={
                            interaction.changeVisualizationUrl || interaction.visualEvidenceUrl
                          }
                          alt="Evidence or Change Map"
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    </div>
                  )}

                  {/* Detected Changes */}
                  {interaction.detectedChanges && interaction.detectedChanges.length > 0 && (
                    <div className="pt-4 border-t border-white/10">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-2">
                        Detected Changes
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {interaction.detectedChanges.map((change, cIdx) => (
                          <div
                            key={cIdx}
                            className="p-2.5 rounded-lg bg-white/[0.03] border border-white/10"
                          >
                            <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#C29B53]" />
                              <span>{change.label}</span>
                            </div>
                            {change.category && (
                              <span className="text-[10px] font-mono text-zinc-500 pl-3">
                                {change.category}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Metrics */}
                  {interaction.metrics && (
                    <div className="pt-4 border-t border-white/10 flex flex-wrap items-center gap-3 text-xs font-mono">
                      {interaction.metrics.changeAreaKm2 !== undefined && (
                        <div className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 flex items-center gap-1.5">
                          <span className="text-zinc-400">Change Area:</span>
                          <span className="text-[#C29B53] font-bold">
                            {interaction.metrics.changeAreaKm2} km²
                          </span>
                        </div>
                      )}
                      {interaction.metrics.confidence !== undefined && (
                        <div className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 flex items-center gap-1.5">
                          <span className="text-zinc-400">Confidence:</span>
                          <span className="text-emerald-400 font-bold">
                            {interaction.metrics.confidence}%
                          </span>
                        </div>
                      )}
                      {interaction.metrics.mainChange && (
                        <div className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 flex items-center gap-1.5">
                          <span className="text-zinc-400">Main:</span>
                          <span className="text-white font-bold">
                            {interaction.metrics.mainChange}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Read-Only Disclaimer Footer */}
            <div className="pt-8 text-center text-xs text-zinc-500 font-mono">
              🔒 Read-only view. Want to run your own satellite queries?{' '}
              <button
                type="button"
                onClick={onNavigateApp}
                className="text-[#C29B53] underline hover:text-white transition-colors cursor-pointer"
              >
                Open SatQuery
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
