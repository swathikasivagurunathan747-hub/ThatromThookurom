// ============================================================
// SATQUERY AI — GIS Location Coordinate Control
// Allows entering decimal Latitude & Longitude, validates bounds,
// and moves the Leaflet map to the specified coordinates.
// ============================================================

import React, { useState, useEffect } from 'react';
import { Navigation, AlertCircle, X, Compass, ChevronDown, ChevronUp } from 'lucide-react';

export interface LocationControlProps {
  latitude: string;
  longitude: string;
  onLatitudeChange: (val: string) => void;
  onLongitudeChange: (val: string) => void;
  onGoToLocation: (lat: number, lng: number) => void;
  onClear: () => void;
  hasActiveMarker?: boolean;
  className?: string;
  locationLabel?: string;
}

export function formatLatitude(lat: number): string {
  const dir = lat >= 0 ? 'N' : 'S';
  return `${Math.abs(lat).toFixed(4)}° ${dir}`;
}

export function formatLongitude(lng: number): string {
  const dir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lng).toFixed(4)}° ${dir}`;
}

export function formatCoordinates(lat: number, lng: number): string {
  return `${formatLatitude(lat)} · ${formatLongitude(lng)}`;
}

export function LocationControl({
  latitude,
  longitude,
  onLatitudeChange,
  onLongitudeChange,
  onGoToLocation,
  onClear,
  hasActiveMarker = false,
  className = '',
  locationLabel,
}: LocationControlProps) {
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Clear validation error when user alters either coordinate field
  useEffect(() => {
    setInlineError(null);
  }, [latitude, longitude]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const trimmedLat = latitude.trim();
    const trimmedLng = longitude.trim();

    if (!trimmedLat) {
      setInlineError('Enter a valid latitude (-90 to 90).');
      return;
    }
    const lat = Number(trimmedLat);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      setInlineError('Enter a valid latitude (-90 to 90).');
      return;
    }

    if (!trimmedLng) {
      setInlineError('Enter a valid longitude (-180 to 180).');
      return;
    }
    const lng = Number(trimmedLng);
    if (isNaN(lng) || lng < -180 || lng > 180) {
      setInlineError('Enter a valid longitude (-180 to 180).');
      return;
    }

    setInlineError(null);
    onGoToLocation(lat, lng);
  };

  const handleClear = () => {
    setInlineError(null);
    onClear();
  };

  return (
    <div
      className={`relative w-full sm:w-80 md:w-96 text-left pointer-events-auto bg-black/85 backdrop-blur-xl border border-white/20 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.7)] transition-all ${className}`}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Compass size={13} className="text-[#C29B53]" />
          <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-zinc-200">
            LOCATION
          </span>
          {locationLabel && (
            <span className="text-[10px] font-mono text-zinc-400 truncate max-w-[120px] bg-white/[0.06] px-1.5 py-0.5 rounded">
              {locationLabel}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {hasActiveMarker && (
            <button
              type="button"
              onClick={handleClear}
              className="px-2 py-0.5 rounded text-[10px] font-mono font-medium text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer flex items-center gap-1"
              title="Clear temporary location marker"
            >
              <X size={11} />
              <span>CLEAR</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer sm:hidden"
            title={isExpanded ? 'Collapse coordinates' : 'Expand coordinates'}
          >
            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {/* Inputs & Actions Body */}
      {isExpanded && (
        <form onSubmit={handleSubmit} className="p-3 flex flex-col gap-2.5">
          {/* Coordinates Inputs Row */}
          <div className="grid grid-cols-2 gap-2">
            {/* Latitude */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="gis-latitude"
                className="text-[10px] font-mono font-semibold tracking-wider uppercase text-zinc-400"
              >
                Latitude
              </label>
              <input
                id="gis-latitude"
                type="text"
                value={latitude}
                onChange={(e) => onLatitudeChange(e.target.value)}
                placeholder="e.g. 13.0827"
                className="w-full px-2.5 py-1.5 text-xs text-white placeholder:text-zinc-600 font-mono bg-white/[0.04] border border-white/15 rounded-lg outline-none focus:border-[#C29B53] focus:bg-white/[0.07] transition-all"
              />
            </div>

            {/* Longitude */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="gis-longitude"
                className="text-[10px] font-mono font-semibold tracking-wider uppercase text-zinc-400"
              >
                Longitude
              </label>
              <input
                id="gis-longitude"
                type="text"
                value={longitude}
                onChange={(e) => onLongitudeChange(e.target.value)}
                placeholder="e.g. 80.2707"
                className="w-full px-2.5 py-1.5 text-xs text-white placeholder:text-zinc-600 font-mono bg-white/[0.04] border border-white/15 rounded-lg outline-none focus:border-[#C29B53] focus:bg-white/[0.07] transition-all"
              />
            </div>
          </div>

          {/* Clean Inline Validation Error */}
          {inlineError && (
            <div className="px-2 py-1.5 rounded-lg bg-red-950/60 border border-red-500/40 text-red-200 text-[11px] font-mono flex items-center gap-1.5 animate-fade-in">
              <AlertCircle size={12} className="text-red-400 shrink-0" />
              <span>{inlineError}</span>
            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center justify-between gap-2 pt-0.5">
            <span className="text-[9.5px] font-mono text-zinc-500">
              -90 to +90 · -180 to +180
            </span>

            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold tracking-wider uppercase text-black bg-[#C29B53] hover:bg-[#CCA563] transition-all shadow-sm active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
            >
              <Navigation size={11} className="shrink-0" />
              <span>GO TO LOCATION</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
