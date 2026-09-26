import { Crosshair } from 'lucide-react';
import { Panel, PanelHeader } from '../../components/ui/Panel';
import { Label } from '../../components/ui/Label';
import type { Evidence } from '../../types';

interface EvidencePanelProps {
  evidence: Evidence[];
}

export function EvidencePanel({ evidence }: EvidencePanelProps) {
  if (!evidence.length) return null;

  return (
    <Panel className="w-[272px]">
      <PanelHeader>Visual Evidence</PanelHeader>

      <div className="flex flex-col gap-3">
        {evidence.map((ev) => (
          <div key={ev.id}>
            {/* Image with highlight overlay */}
            {ev.thumbnailUrl && (
              <div
                className="relative overflow-hidden rounded-sm mb-2"
                style={{ height: '88px' }}
              >
                <img
                  src={ev.thumbnailUrl}
                  alt={ev.label}
                  className="w-full h-full object-cover"
                  style={{ filter: 'brightness(0.75) saturate(0.9)' }}
                />
                {/* Detection overlay */}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(to bottom, transparent 40%, rgba(5,7,8,0.7) 100%)',
                  }}
                />
                {/* Detection box */}
                <div
                  className="absolute"
                  style={{
                    top: '20%',
                    left: '35%',
                    width: '30%',
                    height: '35%',
                    border: '1px solid rgba(184,61,40,0.85)',
                    borderRadius: '1px',
                  }}
                >
                  <div
                    className="absolute -top-0.5 -left-0.5 w-1.5 h-1.5 border-t border-l"
                    style={{ borderColor: 'rgba(184,61,40,0.85)' }}
                  />
                  <div
                    className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 border-t border-r"
                    style={{ borderColor: 'rgba(184,61,40,0.85)' }}
                  />
                  <div
                    className="absolute -bottom-0.5 -left-0.5 w-1.5 h-1.5 border-b border-l"
                    style={{ borderColor: 'rgba(184,61,40,0.85)' }}
                  />
                  <div
                    className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 border-b border-r"
                    style={{ borderColor: 'rgba(184,61,40,0.85)' }}
                  />
                </div>

                {/* Label badge */}
                <div className="absolute bottom-1.5 left-1.5">
                  <span
                    className="text-[8px] font-mono text-[#ededed] px-1.5 py-0.5 tracking-wide"
                    style={{
                      background: 'rgba(184,61,40,0.75)',
                      borderRadius: '1px',
                    }}
                  >
                    DETECTION
                  </span>
                </div>

                {/* Confidence */}
                {ev.confidence !== undefined && (
                  <div className="absolute top-1.5 right-1.5">
                    <span
                      className="text-[8px] font-mono text-[#6A9971] px-1.5 py-0.5"
                      style={{
                        background: 'rgba(5,7,8,0.75)',
                        border: '1px solid rgba(106,153,113,0.4)',
                        borderRadius: '1px',
                      }}
                    >
                      {ev.confidence}%
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Metadata */}
            <div className="text-[10px] text-[#ededed] font-medium mb-0.5">{ev.label}</div>
            <div className="text-[9px] text-[#8a9092] mb-1.5">{ev.description}</div>

            {/* Coordinates */}
            <div className="flex items-center gap-1.5">
              <Crosshair size={9} className="text-[#C29B53]" strokeWidth={1.5} />
              <span className="text-[9px] font-mono text-[#C29B53]">
                {ev.coordinates.lat.toFixed(4)}° N, {ev.coordinates.lng.toFixed(4)}° E
              </span>
            </div>

            {ev.category && (
              <div className="mt-1.5 flex items-center gap-1.5">
                <Label>Category</Label>
                <span className="text-[9px] font-mono text-[#8a9092] capitalize">{ev.category}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </Panel>
  );
}
