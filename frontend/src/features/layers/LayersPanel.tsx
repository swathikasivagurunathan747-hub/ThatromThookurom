import { Check } from 'lucide-react';
import { Panel, PanelHeader } from '../../components/ui/Panel';
import { Label } from '../../components/ui/Label';
import type { ImageryLayer, LayerType } from '../../types';

interface LayersPanelProps {
  layers: ImageryLayer[];
  activeLayer: LayerType;
  onLayerChange: (layer: LayerType) => void;
}

export function LayersPanel({ layers, activeLayer, onLayerChange }: LayersPanelProps) {
  return (
    <Panel className="w-[212px]">
      <PanelHeader>Layers</PanelHeader>
      <div className="flex flex-col gap-1">
        {layers.map((layer) => (
          <button
            key={layer.id}
            disabled={!layer.available}
            onClick={() => layer.available && onLayerChange(layer.id)}
            className={`
              flex items-center gap-2 p-1.5 rounded-sm transition-all duration-150 w-full text-left
              ${!layer.available ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
              ${
                activeLayer === layer.id
                  ? 'bg-[rgba(194, 155, 83,0.08)]'
                  : 'hover:bg-white/[0.03]'
              }
            `}
          >
            {/* Thumbnail */}
            {layer.thumbnailUrl ? (
              <img
                src={layer.thumbnailUrl}
                alt={layer.shortLabel}
                className="layer-thumb"
                style={{
                  filter:
                    layer.id === 'nir'
                      ? 'hue-rotate(100deg) saturate(1.4) brightness(0.85)'
                      : layer.id === 'ndvi'
                      ? 'hue-rotate(60deg) saturate(2) brightness(0.8)'
                      : layer.id === 'change'
                      ? 'grayscale(0.6) contrast(1.4)'
                      : 'saturate(0.8) brightness(0.85)',
                }}
              />
            ) : (
              <div className="layer-thumb bg-white/[0.05]" />
            )}

            {/* Label + description */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-[10px] font-medium ${
                    activeLayer === layer.id ? 'text-[#C29B53]' : 'text-[#ededed]'
                  }`}
                >
                  {layer.label}
                </span>
              </div>
              <Label>{layer.description}</Label>
            </div>

            {/* Active check */}
            <div className="shrink-0">
              {activeLayer === layer.id ? (
                <Check size={10} className="text-[#C29B53]" strokeWidth={2} />
              ) : (
                <div className="w-2.5 h-2.5 rounded-sm border border-white/[0.1]" />
              )}
            </div>
          </button>
        ))}
      </div>
    </Panel>
  );
}
