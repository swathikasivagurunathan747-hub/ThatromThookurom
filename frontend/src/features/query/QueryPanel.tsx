import { useState } from 'react';
import { ChevronDown, Zap, Loader, Target, Layers } from 'lucide-react';
import { Panel, PanelHeader, PanelDivider } from '../../components/ui/Panel';
import { Label } from '../../components/ui/Label';
import type { AnalysisMode, LayerType } from '../../types';

const MODES: { id: AnalysisMode; label: string; description: string }[] = [
  {
    id: 'change_detection',
    label: 'Change Detection',
    description: 'Multi-temporal difference analysis',
  },
  {
    id: 'single',
    label: 'Single Image Analysis',
    description: 'Land cover classification',
  },
  {
    id: 'classification',
    label: 'Vegetation Analysis',
    description: 'NDVI & biomass estimation',
  },
];

const EXAMPLE_QUERIES: Record<AnalysisMode, string> = {
  change_detection: 'What changed in this area between the two dates?',
  single: 'Classify the land cover types visible in this image.',
  classification: 'Identify and map vegetation density across the AOI.',
};

interface QueryPanelProps {
  onAnalyze: (query: string, mode: AnalysisMode, layer: LayerType) => void;
  loading: boolean;
}

export function QueryPanel({ onAnalyze, loading }: QueryPanelProps) {
  const [query, setQuery] = useState(EXAMPLE_QUERIES['change_detection']);
  const [mode, setMode] = useState<AnalysisMode>('change_detection');
  const [modeOpen, setModeOpen] = useState(false);

  const handleModeSelect = (m: AnalysisMode) => {
    setMode(m);
    setQuery(EXAMPLE_QUERIES[m]);
    setModeOpen(false);
  };

  const handleAnalyze = () => {
    if (!query.trim() || loading) return;
    onAnalyze(query, mode, 'rgb');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleAnalyze();
    }
  };

  const currentMode = MODES.find((m) => m.id === mode)!;

  return (
    <Panel className="w-[272px]">
      <PanelHeader>Query</PanelHeader>

      {/* Context chips */}
      <div className="flex gap-1.5 mb-2.5">
        <div
          className="flex items-center gap-1 px-1.5 py-0.5"
          style={{
            background: 'rgba(194, 155, 83,0.08)',
            border: '1px solid rgba(194, 155, 83,0.2)',
            borderRadius: '2px',
          }}
        >
          <Target size={8} strokeWidth={1.5} style={{ color: '#C29B53' }} />
          <span className="text-[7.5px] font-mono text-[#C29B53]">AOI 1.24 km²</span>
        </div>
        <div
          className="flex items-center gap-1 px-1.5 py-0.5"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '2px',
          }}
        >
          <Layers size={8} strokeWidth={1.5} style={{ color: '#8a9092' }} />
          <span className="text-[7.5px] font-mono text-[#8a9092]">2 scenes</span>
        </div>
      </div>

      {/* Query textarea */}
      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={3}
        placeholder="Enter your analysis query…"
        className="w-full resize-none text-[11px] leading-[1.6] bg-white/[0.025] rounded-sm px-2.5 py-2 outline-none transition-colors placeholder:text-[#8a9092]/40 font-[inherit]"
        style={{
          color: '#d4d8da',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'rgba(194, 155, 83,0.35)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
        }}
      />
      <div className="flex items-center justify-end mt-1 mb-2.5">
        <span className="text-[7.5px] font-mono text-[#8a9092]/40">⌘↵ to run</span>
      </div>

      <PanelDivider />

      {/* Mode selector */}
      <div className="mb-3">
        <Label className="mb-1.5 block">Analysis Mode</Label>
        <div className="relative">
          <button
            onClick={() => setModeOpen(!modeOpen)}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-sm text-[10px] transition-colors"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#d4d8da',
            }}
          >
            <div className="flex flex-col items-start">
              <span>{currentMode.label}</span>
              <span className="text-[7.5px] text-[#8a9092]">{currentMode.description}</span>
            </div>
            <ChevronDown
              size={10}
              style={{ color: '#8a9092', transform: modeOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
            />
          </button>

          {modeOpen && (
            <div
              className="absolute top-full left-0 right-0 mt-0.5 z-50 shadow-[0_8px_24px_rgba(0,0,0,0.6)]"
              style={{
                background: 'rgba(10,13,15,0.97)',
                border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: '2px',
                padding: '3px',
              }}
            >
              {MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleModeSelect(m.id)}
                  className="w-full text-left px-2 py-1.5 rounded-sm transition-colors"
                  style={{
                    background: m.id === mode ? 'rgba(194, 155, 83,0.08)' : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (m.id !== mode) e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  }}
                  onMouseLeave={(e) => {
                    if (m.id !== mode) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div
                    className="text-[10px] font-medium"
                    style={{ color: m.id === mode ? '#C29B53' : '#8a9092' }}
                  >
                    {m.label}
                  </div>
                  <div className="text-[8px] text-[#8a9092]/60 mt-0.5">{m.description}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Analyze button */}
      <button
        onClick={handleAnalyze}
        disabled={loading || !query.trim()}
        className="w-full flex items-center justify-center gap-2 h-8 rounded-sm text-[10px] font-semibold tracking-[0.1em] uppercase transition-all duration-150"
        style={{
          background: loading || !query.trim()
            ? 'rgba(255,255,255,0.04)'
            : '#C29B53',
          color: loading || !query.trim() ? '#8a9092' : '#050708',
          cursor: loading || !query.trim() ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? (
          <>
            <Loader size={11} style={{ animation: 'spin 1s linear infinite' }} />
            <span>Processing…</span>
          </>
        ) : (
          <>
            <Zap size={11} strokeWidth={2} />
            <span>Analyze</span>
          </>
        )}
      </button>

      {/* Hint */}
      <p className="mt-2 text-[7.5px] leading-relaxed" style={{ color: '#8a9092', opacity: 0.55 }}>
        Query processed against active scene and selected AOI. Results generated by the SatQuery AI pipeline.
      </p>
    </Panel>
  );
}
