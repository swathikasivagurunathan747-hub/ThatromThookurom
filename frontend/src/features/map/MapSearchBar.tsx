// ============================================================
// SATQUERY AI — Map Search Bar Component
// Provides debounced geocoding search for geographic orientation,
// city navigation, and landmark lookup inside the map canvas.
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Loader2, MapPin, AlertCircle, Navigation } from 'lucide-react';
import { searchLocations, type LocationSearchResult } from '../../services/locationSearchService';

interface MapSearchBarProps {
  onSelectLocation: (location: LocationSearchResult) => void;
  className?: string;
}

export function MapSearchBar({ onSelectLocation, className = '' }: MapSearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounced search logic
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setError(null);
      setLoading(false);
      setIsOpen(false);
      setSelectedIndex(-1);
      return;
    }

    setLoading(true);
    setError(null);

    // Cancel prior request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timer = setTimeout(async () => {
      try {
        const res = await searchLocations(trimmed, controller.signal);
        if (controller.signal.aborted) return;

        if (res.success && res.data) {
          setResults(res.data);
          setIsOpen(true);
          setSelectedIndex(-1);
          if (res.data.length === 0) {
            setError('Location not found.');
          } else {
            setError(null);
          }
        } else {
          setResults([]);
          setError(res.error || 'Location search unavailable. Please try again.');
          setIsOpen(true);
        }
      } catch {
        if (!controller.signal.aborted) {
          setResults([]);
          setError('Location search unavailable. Please try again.');
          setIsOpen(true);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = useCallback(
    (loc: LocationSearchResult) => {
      setQuery(loc.name);
      setIsOpen(false);
      setResults([]);
      setError(null);
      setSelectedIndex(-1);
      onSelectLocation(loc);
    },
    [onSelectLocation]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSelectedIndex(-1);
      return;
    }

    if (!isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        handleSelect(results[selectedIndex]);
      } else if (results.length > 0) {
        handleSelect(results[0]);
      }
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setError(null);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full sm:w-80 md:w-96 text-left pointer-events-auto ${className}`}
    >
      {/* Input Box */}
      <div className="relative flex items-center bg-black/85 backdrop-blur-xl border border-white/20 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.7)] transition-all focus-within:border-[#C29B53]">
        <div className="pl-3.5 pr-1.5 text-zinc-400 shrink-0">
          {loading ? (
            <Loader2 size={14} className="animate-spin text-[#C29B53]" />
          ) : (
            <Search size={14} />
          )}
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0 || error) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search city, town, road, landmark…"
          aria-label="Search map location"
          className="w-full py-2.5 pr-9 text-xs text-white placeholder:text-zinc-500 font-mono bg-transparent outline-none"
        />

        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Clear search"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 py-1.5 bg-[#090d10]/95 backdrop-blur-2xl border border-white/15 rounded-xl shadow-2xl z-50 overflow-hidden font-sans animate-fade-in">
          {error ? (
            <div className="p-3 text-xs font-mono text-zinc-400 flex items-center gap-2">
              <AlertCircle size={14} className="text-amber-400 shrink-0" />
              <span>{error}</span>
            </div>
          ) : results.length > 0 ? (
            <div className="max-h-64 overflow-y-auto divide-y divide-white/5">
              {results.map((loc, idx) => {
                const isSelected = selectedIndex === idx;
                return (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => handleSelect(loc)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full text-left px-3.5 py-2.5 transition-all flex items-start gap-2.5 cursor-pointer ${
                      isSelected
                        ? 'bg-[#C29B53]/15 text-white'
                        : 'text-zinc-300 hover:bg-white/[0.05] hover:text-white'
                    }`}
                  >
                    <div
                      className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                        isSelected
                          ? 'bg-[#C29B53]/20 text-[#C29B53]'
                          : 'bg-white/[0.04] text-zinc-400'
                      }`}
                    >
                      <MapPin size={12} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold truncate flex items-center gap-1.5">
                        <span>{loc.name}</span>
                        {loc.type && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/[0.06] text-zinc-400 uppercase">
                            {loc.type}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-zinc-500 truncate mt-0.5">
                        {loc.displayName}
                      </div>
                    </div>

                    <Navigation
                      size={11}
                      className={`shrink-0 mt-1 opacity-0 transition-opacity ${
                        isSelected ? 'opacity-100 text-[#C29B53]' : ''
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
