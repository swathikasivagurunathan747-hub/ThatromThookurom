// Small AOI chip that hovers near the upper-left of the map
// Shows AOI name + area + coordinates

import { Target } from 'lucide-react';
import type { AOI } from '../../types';

interface AoiInfoChipProps {
  aoi: AOI;
}

export function AoiInfoChip({ aoi }: AoiInfoChipProps) {
  return (
    <div
      className="flex items-center gap-2 px-2.5 py-1.5"
      style={{
        background: 'rgba(5,7,8,0.88)',
        border: '1px solid rgba(194, 155, 83,0.2)',
        borderRadius: '2px',
      }}
    >
      <Target size={10} className="text-[#C29B53] shrink-0" strokeWidth={1.5} />
      <div>
        <div className="flex items-center gap-2">
          <span className="text-[8px] font-mono text-[#C29B53] tracking-[0.1em] uppercase">AOI</span>
          <span className="text-[8px] font-mono text-[#ededed]">{aoi.areaSqKm.toFixed(2)} km²</span>
        </div>
        <div className="text-[7.5px] font-mono text-[#8a9092] mt-0.5">
          {aoi.coordinates.lat.toFixed(4)}° N &nbsp; {aoi.coordinates.lng.toFixed(4)}° E
        </div>
      </div>
    </div>
  );
}
