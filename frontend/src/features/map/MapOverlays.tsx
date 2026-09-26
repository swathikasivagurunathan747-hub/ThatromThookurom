// Map overlays: layer badge, AOI badge, coordinate readout
// Floats OVER the leaflet map canvas, pointer-events-none by default

import { MapPin, Crosshair } from 'lucide-react';
import type { AOI, LayerType } from '../../types';

interface MapOverlaysProps {
  aoi: AOI;
  activeLayer: LayerType;
  mouseCoords?: { lat: number; lng: number };
}

const LAYER_BADGE: Record<LayerType, { label: string; color: string; bg: string }> = {
  rgb: { label: 'RGB / TRUE COLOR', color: '#C29B53', bg: 'rgba(194, 155, 83,0.12)' },
  nir: { label: 'FALSE COLOR / NIR', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  ndvi: { label: 'NDVI INDEX', color: '#6A9971', bg: 'rgba(106,153,113,0.12)' },
  change: { label: 'CHANGE MAP', color: '#B83D28', bg: 'rgba(184,61,40,0.12)' },
};

export function MapOverlays({ aoi, activeLayer, mouseCoords }: MapOverlaysProps) {
  const badge = LAYER_BADGE[activeLayer];

  return (
    <div className="absolute inset-0 z-10 pointer-events-none">

      {/* ── Top center — active layer badge ── */}
      <div className="absolute top-2.5 left-1/2 -translate-x-1/2">
        <div
          className="flex items-center gap-1.5 px-2.5 py-1"
          style={{
            background: 'rgba(5,7,8,0.84)',
            border: `1px solid ${badge.color}30`,
            borderRadius: '2px',
          }}
        >
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: badge.color }}
          />
          <span
            className="text-[8.5px] font-mono tracking-[0.13em] uppercase font-medium"
            style={{ color: badge.color }}
          >
            {badge.label}
          </span>
        </div>
      </div>

      {/* ── Top right — scene/date label ── */}
      <div className="absolute top-2.5 right-3">
        <div
          className="px-2 py-1"
          style={{
            background: 'rgba(5,7,8,0.78)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '2px',
          }}
        >
          <span className="text-[8px] font-mono text-[#4a5254] tracking-wide">
            COASTAL_CITY_001 &nbsp;·&nbsp; 2025-08-14 10:24 UTC &nbsp;·&nbsp; Sentinel-2A
          </span>
        </div>
      </div>

      {/* ── Bottom left — AOI info + cursor coords ── */}
      <div className="absolute bottom-9 left-2 flex flex-col gap-1">
        {/* AOI chip */}
        <div
          className="flex items-center gap-2 px-2.5 py-1"
          style={{
            background: 'rgba(5,7,8,0.84)',
            border: '1px solid rgba(194, 155, 83,0.2)',
            borderRadius: '2px',
          }}
        >
          <MapPin size={9} strokeWidth={1.5} style={{ color: '#C29B53' }} />
          <span className="text-[8px] font-mono text-[#C29B53] tracking-wide uppercase">
            AOI
          </span>
          <span className="text-[8px] font-mono text-[#d4d8da]">
            {aoi.areaSqKm.toFixed(2)} km²
          </span>
          <span className="text-[8px] font-mono" style={{ color: '#4a5254' }}>|</span>
          <span className="text-[8px] font-mono text-[#8a9092]">
            {aoi.coordinates.lat.toFixed(4)}° N &nbsp; {aoi.coordinates.lng.toFixed(4)}° E
          </span>
        </div>

        {/* Cursor coordinates */}
        {mouseCoords && (
          <div
            className="flex items-center gap-1.5 px-2 py-0.5"
            style={{
              background: 'rgba(5,7,8,0.8)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '2px',
            }}
          >
            <Crosshair size={8} strokeWidth={1.5} style={{ color: '#4a5254' }} />
            <span className="text-[8px] font-mono tabular-nums" style={{ color: '#6a7274' }}>
              {mouseCoords.lat.toFixed(6)}° N &nbsp; {mouseCoords.lng.toFixed(6)}° E
            </span>
          </div>
        )}
      </div>

      {/* ── Subtle corner markers for professional feel ── */}
      <div
        className="absolute top-1 left-1 w-3 h-3 pointer-events-none"
        style={{
          borderTop: '1px solid rgba(194, 155, 83,0.2)',
          borderLeft: '1px solid rgba(194, 155, 83,0.2)',
        }}
      />
      <div
        className="absolute top-1 right-1 w-3 h-3 pointer-events-none"
        style={{
          borderTop: '1px solid rgba(194, 155, 83,0.2)',
          borderRight: '1px solid rgba(194, 155, 83,0.2)',
        }}
      />
      <div
        className="absolute bottom-1 left-1 w-3 h-3 pointer-events-none"
        style={{
          borderBottom: '1px solid rgba(194, 155, 83,0.2)',
          borderLeft: '1px solid rgba(194, 155, 83,0.2)',
        }}
      />
      <div
        className="absolute bottom-1 right-1 w-3 h-3 pointer-events-none"
        style={{
          borderBottom: '1px solid rgba(194, 155, 83,0.2)',
          borderRight: '1px solid rgba(194, 155, 83,0.2)',
        }}
      />
    </div>
  );
}
