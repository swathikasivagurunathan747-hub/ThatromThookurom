import { useState } from 'react';
import { Panel, PanelHeader } from '../../components/ui/Panel';
import { Label } from '../../components/ui/Label';
import type { Scene, LayerType } from '../../types';

interface ComparisonPanelProps {
  beforeScene: Scene;
  afterScene: Scene;
  activeLayer: LayerType;
  onLayerChange: (layer: LayerType) => void;
}

const COMPARE_MODES: { id: LayerType; label: string }[] = [
  { id: 'rgb', label: 'RGB' },
  { id: 'ndvi', label: 'NDVI' },
  { id: 'change', label: 'CHG' },
];

const LEGEND_ITEMS = [
  { color: '#B83D28', label: 'New Change' },
  { color: '#6A9971', label: 'Loss' },
  { color: '#8a9092', label: 'No Change' },
];

const IMAGE_FILTERS: Record<LayerType, string> = {
  rgb: 'brightness(0.85) saturate(0.9)',
  nir: 'hue-rotate(100deg) saturate(1.4) brightness(0.85)',
  ndvi: 'hue-rotate(60deg) saturate(2) brightness(0.8)',
  change: 'grayscale(0.5) contrast(1.5) brightness(0.75)',
};

export function ComparisonPanel({
  beforeScene,
  afterScene,
  activeLayer,
  onLayerChange,
}: ComparisonPanelProps) {
  const [sliderPos, setSliderPos] = useState(50);

  return (
    <Panel className="w-full max-w-[480px]">
      {/* Header row */}
      <div className="flex items-center justify-between mb-2.5">
        <PanelHeader>Compare / Change Map</PanelHeader>

        {/* Mode pills */}
        <div
          className="flex items-center gap-0.5 p-0.5 rounded-sm"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          {COMPARE_MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => onLayerChange(m.id)}
              className={`
                px-2 py-0.5 rounded-sm text-[9px] font-mono tracking-wide transition-colors
                ${
                  activeLayer === m.id
                    ? 'bg-[#C29B53] text-[#050708] font-medium'
                    : 'text-[#8a9092] hover:text-[#ededed]'
                }
              `}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Before / After thumbnails */}
      <div className="flex gap-2 mb-2.5">
        {/* Before */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <Label accent>Before</Label>
            <span className="text-[9px] font-mono text-[#8a9092]">{beforeScene.acquisitionDate}</span>
          </div>
          <div className="overflow-hidden rounded-sm" style={{ height: '72px' }}>
            <img
              src={beforeScene.thumbnailUrl}
              alt="Before"
              className="w-full h-full object-cover"
              style={{ filter: IMAGE_FILTERS['rgb'] }}
            />
          </div>
        </div>

        {/* After */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <Label accent>After</Label>
            <span className="text-[9px] font-mono text-[#8a9092]">{afterScene.acquisitionDate}</span>
          </div>
          <div className="overflow-hidden rounded-sm" style={{ height: '72px' }}>
            <img
              src={afterScene.thumbnailUrl}
              alt="After"
              className="w-full h-full object-cover"
              style={{ filter: IMAGE_FILTERS[activeLayer] }}
            />
          </div>
        </div>
      </div>

      {/* Slider */}
      <div className="mb-2.5">
        <div className="flex items-center justify-between mb-1">
          <Label>Comparison Slider</Label>
          <span className="text-[9px] font-mono text-[#8a9092]">{sliderPos}%</span>
        </div>
        <div className="relative flex items-center">
          <span className="text-[8px] font-mono text-[#8a9092] mr-2 w-8 text-right shrink-0">
            {beforeScene.acquisitionDate.slice(5)}
          </span>
          <input
            type="range"
            min={0}
            max={100}
            value={sliderPos}
            onChange={(e) => setSliderPos(Number(e.target.value))}
            className="compare-slider flex-1"
          />
          <span className="text-[8px] font-mono text-[#8a9092] ml-2 w-8 shrink-0">
            {afterScene.acquisitionDate.slice(5)}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4">
        <Label>Legend</Label>
        <div className="flex items-center gap-3">
          {LEGEND_ITEMS.map((item) => (
            <div key={item.label} className="flex items-center gap-1">
              <div
                className="w-2 h-2 rounded-sm"
                style={{ background: item.color, opacity: 0.85 }}
              />
              <span className="text-[8.5px] text-[#8a9092]">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}
