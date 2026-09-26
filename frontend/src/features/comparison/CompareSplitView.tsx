import { useState, useRef } from 'react';

import { Label } from '../../components/ui/Label';
import type { Scene, LayerType } from '../../types';

interface CompareSplitViewProps {
  beforeScene: Scene;
  afterScene: Scene;
  activeLayer: LayerType;
  onLayerChange: (l: LayerType) => void;
}

const MODES: { id: LayerType; label: string }[] = [
  { id: 'rgb', label: 'RGB' },
  { id: 'ndvi', label: 'NDVI' },
  { id: 'change', label: 'CHG' },
];

const LAYER_FILTERS: Record<LayerType, string> = {
  rgb: 'brightness(0.85) saturate(0.9)',
  nir: 'hue-rotate(100deg) saturate(1.4) brightness(0.85)',
  ndvi: 'hue-rotate(60deg) saturate(2) brightness(0.8)',
  change: 'grayscale(0.5) contrast(1.5) brightness(0.75)',
};

const LEGEND = [
  { color: '#B83D28', label: 'New built-up' },
  { color: '#6A9971', label: 'Vegetation loss' },
  { color: '#C29B53', label: 'Water change' },
  { color: '#8a9092', label: 'No change' },
];

export function CompareSplitView({ beforeScene, afterScene, activeLayer, onLayerChange }: CompareSplitViewProps) {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex flex-col gap-3 w-full max-w-2xl mx-auto">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2.5 backdrop-blur-xl bg-black/75 border border-white/15 rounded-xl shadow-lg"
      >
        <span className="text-[9px] font-semibold tracking-[0.14em] uppercase text-[#8a9092]">
          Compare / Change Map
        </span>
        {/* Mode pills */}
        <div
          className="flex items-center gap-0.5 p-0.5 rounded-sm"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => onLayerChange(m.id)}
              className={`px-2.5 py-0.5 rounded-sm text-[9px] font-mono tracking-wide transition-colors ${
                activeLayer === m.id
                  ? 'bg-[#C29B53] text-[#050708] font-medium'
                  : 'text-[#8a9092] hover:text-[#ededed]'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Split imagery */}
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-2xl border border-white/15 shadow-2xl"
        style={{ height: '340px' }}
      >
        {/* BEFORE — full width, clipped */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
        >
          <img
            src={beforeScene.imageUrl}
            alt="Before"
            className="w-full h-full object-cover"
            style={{ filter: 'brightness(0.8) saturate(0.9)' }}
          />
          {/* Before label */}
          <div
            className="absolute top-3 left-3 px-2.5 py-1 backdrop-blur-md bg-black/80 border border-white/15 rounded-lg"
          >
            <span className="text-[9px] font-mono text-zinc-300 font-semibold">
              BEFORE · {beforeScene.acquisitionDate}
            </span>
          </div>
        </div>

        {/* AFTER — full width, clipped from other side */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}
        >
          <img
            src={afterScene.imageUrl}
            alt="After"
            className="w-full h-full object-cover"
            style={{ filter: LAYER_FILTERS[activeLayer] }}
          />
          {/* After label */}
          <div
            className="absolute top-3 right-3 px-2.5 py-1 backdrop-blur-md bg-black/80 border border-white/15 rounded-lg"
          >
            <span className="text-[9px] font-mono text-[#C29B53] font-semibold">
              AFTER · {afterScene.acquisitionDate}
            </span>
          </div>
        </div>

        {/* Divider line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-[#C29B53] pointer-events-none z-10"
          style={{ left: `${sliderPos}%` }}
        />

        {/* Drag handle */}
        <div
          className="absolute top-1/2 -translate-y-1/2 z-20 pointer-events-none"
          style={{ left: `${sliderPos}%`, transform: `translateX(-50%) translateY(-50%)` }}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center bg-black/90 border border-[#C29B53] shadow-sm"
          >
            <svg width="12" height="12" viewBox="0 0 10 10" fill="none">
              <path d="M3 5H7M3 3L1 5L3 7M7 3L9 5L7 7" stroke="#C29B53" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Slider */}
      <div
        className="px-4 py-3 backdrop-blur-xl bg-black/75 border border-white/15 rounded-xl shadow-lg"
      >
        <div className="flex items-center justify-between mb-1.5">
          <Label>Comparison position</Label>
          <span className="text-[9px] font-mono text-[#C29B53]">{sliderPos.toFixed(0)}%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[7.5px] font-mono text-[#8a9092] w-12 text-right shrink-0">
            {beforeScene.acquisitionDate.slice(5)}
          </span>
          <input
            type="range"
            min={5}
            max={95}
            value={sliderPos}
            onChange={(e) => setSliderPos(Number(e.target.value))}
            className="compare-slider flex-1"
          />
          <span className="text-[7.5px] font-mono text-[#8a9092] w-12 shrink-0">
            {afterScene.acquisitionDate.slice(5)}
          </span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-2">
          <Label>Legend</Label>
          <div className="flex items-center gap-3 flex-wrap">
            {LEGEND.map((item) => (
              <div key={item.label} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-sm" style={{ background: item.color, opacity: 0.85 }} />
                <span className="text-[8px] text-[#8a9092]">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
