import { TrendingUp, TrendingDown, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { Panel, PanelHeader, PanelDivider } from '../../components/ui/Panel';
import { Label } from '../../components/ui/Label';
import type { AnalysisResult } from '../../types';
import { useState } from 'react';

interface AnalysisPanelProps {
  result: AnalysisResult;
}

function ConfidenceMeter({ value }: { value: number }) {
  const color = value >= 85 ? '#6A9971' : value >= 60 ? '#C29B53' : '#B83D28';
  const segments = 20;
  const filled = Math.round((value / 100) * segments);
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <Label>Model Confidence</Label>
        <span className="text-[11px] font-mono font-semibold tabular-nums" style={{ color }}>
          {value}%
        </span>
      </div>
      {/* Segmented bar */}
      <div className="flex gap-0.5 h-1">
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            className="flex-1 rounded-full transition-all duration-500"
            style={{
              background: i < filled ? color : 'rgba(255,255,255,0.07)',
              opacity: i < filled ? 0.7 + (i / filled) * 0.3 : 1,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function AnalysisPanel({ result }: AnalysisPanelProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Panel className="w-[272px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5">
        <PanelHeader>Analysis Result</PanelHeader>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-[#8a9092] hover:text-[#ededed] transition-colors"
        >
          {collapsed ? <ChevronDown size={11} /> : <ChevronUp size={11} />}
        </button>
      </div>

      {/* Finding banner */}
      <div
        className="flex items-start gap-2 px-2 py-1.5 rounded-sm mb-2.5"
        style={{ background: 'rgba(184,61,40,0.07)', border: '1px solid rgba(184,61,40,0.18)' }}
      >
        <AlertTriangle size={10} strokeWidth={1.5} style={{ color: '#B83D28', marginTop: '1px', flexShrink: 0 }} />
        <span className="text-[8.5px] font-semibold tracking-[0.1em] uppercase text-[#B83D28]">
          {result.title}
        </span>
      </div>

      {/* Summary text */}
      <p className="text-[9.5px] leading-[1.65] mb-3" style={{ color: '#8a9092' }}>
        {result.summary}
      </p>

      {/* Key metrics row */}
      <div
        className="grid grid-cols-3 mb-3 overflow-hidden rounded-sm"
        style={{ border: '1px solid rgba(255,255,255,0.065)' }}
      >
        <div className="flex flex-col items-center py-2 px-1.5" style={{ borderRight: '1px solid rgba(255,255,255,0.065)' }}>
          <Label className="mb-1">Confidence</Label>
          <span className="text-[14px] font-mono font-semibold text-[#6A9971]">
            {result.confidence}%
          </span>
        </div>
        <div
          className="flex flex-col items-center py-2 px-1.5 text-center"
          style={{ borderRight: '1px solid rgba(255,255,255,0.065)' }}
        >
          <Label className="mb-1">Key Change</Label>
          <span className="text-[9px] font-medium text-[#d4d8da] leading-tight">
            {result.keyFinding}
          </span>
        </div>
        <div className="flex flex-col items-center py-2 px-1.5">
          <Label className="mb-1">Area</Label>
          <span className="text-[10.5px] font-mono text-[#d4d8da]">
            ~{result.detectedChanges?.[0]?.deltaKm2.toFixed(2)} km²
          </span>
        </div>
      </div>

      {/* Confidence meter */}
      <ConfidenceMeter value={result.confidence} />

      {!collapsed && result.detectedChanges && result.detectedChanges.length > 0 && (
        <>
          <PanelDivider />
          <PanelHeader>Detected Changes</PanelHeader>

          <div className="flex flex-col gap-2">
            {result.detectedChanges.map((change) => {
              const isPositive = change.deltaKm2 > 0;
              const Icon = isPositive ? TrendingUp : TrendingDown;
              const valueColor = isPositive ? '#B83D28' : '#6A9971';
              const barWidth = Math.abs(change.deltaKm2 / 0.5) * 100; // max ~0.5 km²

              return (
                <div key={change.id}>
                  <div className="flex items-center gap-2 mb-1">
                    {/* Dot */}
                    <div
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: change.color ?? '#8a9092' }}
                    />
                    {/* Label */}
                    <span className="text-[9.5px] text-[#8a9092] flex-1 min-w-0 truncate">
                      {change.label}
                    </span>
                    {/* Value */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Icon size={9} strokeWidth={2} style={{ color: valueColor }} />
                      <span
                        className="text-[10px] font-mono font-medium tabular-nums"
                        style={{ color: valueColor }}
                      >
                        {change.deltaKm2 > 0 ? '+' : ''}
                        {change.deltaKm2.toFixed(2)} km²
                      </span>
                    </div>
                  </div>
                  {/* Mini bar */}
                  <div className="h-px w-full bg-white/[0.05] rounded-full overflow-hidden ml-3.5">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(barWidth, 100)}%`,
                        background: change.color ?? '#8a9092',
                        opacity: 0.6,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer metadata */}
          <div
            className="mt-3 pt-2 flex items-center justify-between"
            style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
          >
            <div>
              <Label>Model</Label>
              <span className="ml-1.5 text-[8.5px] font-mono text-[#8a9092]/60">
                {result.modelVersion}
              </span>
            </div>
            <span className="text-[8px] font-mono text-[#8a9092]/50">
              {new Date(result.generatedAt).toISOString().slice(11, 19)} UTC
            </span>
          </div>
        </>
      )}
    </Panel>
  );
}
