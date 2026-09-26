import { useState, useCallback } from 'react';
import L from 'leaflet';
import {
  Sparkles,
  MousePointerClick,
  RotateCcw,
  AlertCircle,
  Loader2,
  Share2,
  ArrowRight,
  Eye,
  CheckCircle2,
  MapPin,
  ChevronDown,
  ChevronUp,
  X,
  BookmarkPlus,
  Compass,
} from 'lucide-react';
import { SatelliteMap } from '../map/SatelliteMap';
import { MapSearchBar } from '../map/MapSearchBar';
import { LocationControl, formatCoordinates } from '../map/LocationControl';
import { analyzeMapArea } from '../../services/analysisService';
import { addInteractionToChat, createChat, getChats } from '../../services/workspaceService';
import type { LocationSearchResult } from '../../services/locationSearchService';
import type { MapAreaSelection, MapAnalysisResult } from '../../types';
import { MOCK_ACTIVE_SCENE } from '../../mock/scenes';
import { AnalysisLoadingState } from './AnalysisLoadingState';
import { AnalysisResultView, type AnalysisResultData } from './AnalysisResultView';
import { ReportModal } from '../reports/ReportModal';

const SUGGESTED_QUERIES = [
  'What is present in this area?',
  'What type of land use is visible?',
  'Identify major built-up areas.',
  'Describe the vegetation in this region.',
  'Are there signs of urban expansion?',
  'Identify water bodies in this area.',
];

const LOADING_PHASES = [
  'Understanding your question...',
  'Selecting the appropriate analysis...',
  'Processing satellite imagery...',
  'Generating response...',
];

const DEFAULT_PRESET_AOI: MapAreaSelection = {
  bounds: {
    north: 28.665,
    south: 28.585,
    east: 77.265,
    west: 77.165,
  },
  center: {
    lat: 28.6139,
    lng: 77.209,
  },
  areaKm2: 24.6,
  zoomLevel: 14,
};

export interface MapBasedAnalysisProps {
  onAnalysisComplete?: (result: MapAnalysisResult) => void;
  onLocationChange?: (locationName?: string) => void;
  onOpenShare?: () => void;
  onOpenReportModal?: (data: AnalysisResultData) => void;
}

export function MapBasedAnalysis({
  onAnalysisComplete,
  onLocationChange,
  onOpenShare,
  onOpenReportModal,
}: MapBasedAnalysisProps = {}) {
  // Area Selection State
  const [isSelectingArea, setIsSelectingArea] = useState<boolean>(false);
  const [selectedArea, setSelectedArea] = useState<MapAreaSelection | null>(null);
  const [localReportData, setLocalReportData] = useState<AnalysisResultData | null>(null);
  const [isLocalReportOpen, setIsLocalReportOpen] = useState(false);

  // Query & Analysis State
  const [query, setQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingPhaseIndex, setLoadingPhaseIndex] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MapAnalysisResult | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);
  const [savedToChatSuccess, setSavedToChatSuccess] = useState<boolean>(false);

  // Development-only Demo Mode toggle (default OFF — live mode strictly enforced)
  const [forceMock, setForceMock] = useState<boolean>(false);

  // Map navigation & GIS coordinate location state
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
    displayName?: string;
  } | null>(null);
  const [inputLat, setInputLat] = useState<string>('');
  const [inputLng, setInputLng] = useState<string>('');

  const handleSelectLocation = useCallback(
    (loc: LocationSearchResult) => {
      setSelectedLocation({
        latitude: loc.latitude,
        longitude: loc.longitude,
        displayName: loc.name,
      });
      setInputLat(loc.latitude.toString());
      setInputLng(loc.longitude.toString());

      onLocationChange?.(loc.name);

      if (mapInstance) {
        if (loc.boundingBox) {
          const [south, north, west, east] = loc.boundingBox;
          mapInstance.fitBounds(
            [
              [south, west],
              [north, east],
            ],
            { maxZoom: 15, duration: 1.2 }
          );
        } else {
          const currentZoom = mapInstance.getZoom();
          const navZoom = currentZoom >= 14 ? currentZoom : 14;
          mapInstance.flyTo([loc.latitude, loc.longitude], navZoom, { duration: 1.2 });
        }
      }
    },
    [mapInstance, onLocationChange]
  );

  const handleGoToCoordinates = useCallback(
    (lat: number, lng: number) => {
      setSelectedLocation({
        latitude: lat,
        longitude: lng,
      });
      setInputLat(lat.toString());
      setInputLng(lng.toString());

      if (mapInstance) {
        const currentZoom = mapInstance.getZoom();
        const navZoom = currentZoom >= 14 ? currentZoom : 14;
        mapInstance.flyTo([lat, lng], navZoom, { duration: 1.2 });
      }
    },
    [mapInstance]
  );

  const handleMapClick = useCallback(
    ({ lat, lng }: { lat: number; lng: number }) => {
      setSelectedLocation({
        latitude: lat,
        longitude: lng,
      });
      setInputLat(lat.toString());
      setInputLng(lng.toString());
    },
    []
  );

  const handleClearLocation = useCallback(() => {
    setSelectedLocation(null);
    setInputLat('');
    setInputLng('');
  }, []);

  // Handle phased loading progression
  const startLoadingAnimation = useCallback(() => {
    setLoadingPhaseIndex(0);
    const interval = setInterval(() => {
      setLoadingPhaseIndex((prev) => (prev + 1) % LOADING_PHASES.length);
    }, 750);
    return interval;
  }, []);

  // Handle Area Selection callback from SatelliteMap
  const handleAreaSelected = useCallback((area: MapAreaSelection) => {
    setSelectedArea(area);
    setIsSelectingArea(false);
    setError(null);
    setResult(null);
    setSavedToChatSuccess(false);
  }, []);

  const handleStartSelection = () => {
    setIsSelectingArea(true);
    setError(null);
    setResult(null);
    setSavedToChatSuccess(false);
  };

  const handleCancelSelection = () => {
    setIsSelectingArea(false);
  };

  const handleClearArea = () => {
    setSelectedArea(null);
    setIsSelectingArea(false);
    setResult(null);
    setError(null);
    setSavedToChatSuccess(false);
  };

  const handleAnalyze = async () => {
    if (!selectedArea) {
      setError('Please select an area on the map to begin analysis.');
      return;
    }
    const targetQuery =
      query.trim() ||
      `Analyze land cover, built-up structures, and environmental features in this ${selectedArea.areaKm2.toFixed(2)} km² area.`;

    if (loading) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setSavedToChatSuccess(false);

    const interval = startLoadingAnimation();

    try {
      const res = await analyzeMapArea({
        area: selectedArea,
        queryText: targetQuery,
        forceMock,
      });

      if (res.success && res.data) {
        setResult(res.data);
        onAnalysisComplete?.(res.data);

        // Automatically associate with project or active chat in background
        try {
          const existingChats = await getChats();
          const targetChat =
            existingChats.length > 0
              ? existingChats[0]
              : await createChat(undefined, 'Map Analysis');

          await addInteractionToChat(targetChat.id, {
            type: 'map',
            query: res.data.query,
            answer: res.data.answer,
            visualEvidenceUrl: res.data.visualEvidenceUrl,
            confidence: res.data.confidence,
            detectedCategories: res.data.detectedCategories,
            area: res.data.area,
            isDemoMode: res.data.isDemoMode,
          });
        } catch {
          // Non-blocking workspace save
        }
      } else {
        setError(res.error || 'Analysis service unavailable. Please try again.');
      }
    } catch {
      setError('Analysis service unavailable. Please ensure the SatQuery backend is running.');
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey || !e.shiftKey)) {
      e.preventDefault();
      handleAnalyze();
    }
  };

  const handleNewAnalysis = () => {
    setResult(null);
    setQuery('');
    setError(null);
    setSavedToChatSuccess(false);
  };

  const handleSaveToChat = async () => {
    if (!result) return;
    try {
      const existingChats = await getChats();
      const targetChat =
        existingChats.length > 0
          ? existingChats[0]
          : await createChat(undefined, 'Map Analysis');

      await addInteractionToChat(targetChat.id, {
        type: 'map',
        query: result.query,
        answer: result.answer,
        visualEvidenceUrl: result.visualEvidenceUrl,
        confidence: result.confidence,
        detectedCategories: result.detectedCategories,
        area: result.area,
        isDemoMode: result.isDemoMode,
      });
      setSavedToChatSuccess(true);
    } catch {
      // Ignored
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-[#050708] font-sans">
      {/* ════════════════════════════════════════════════════════
          1. DOMINANT SATELLITE MAP (HERO ELEMENT: 85-90% DOMINANCE)
      ════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 z-0">
        <SatelliteMap
          center={[MOCK_ACTIVE_SCENE.coordinates.lat, MOCK_ACTIVE_SCENE.coordinates.lng]}
          zoom={14}
          onMapReady={(map) => setMapInstance(map)}
          isSelectingArea={isSelectingArea}
          onAreaSelected={handleAreaSelected}
          selectedArea={selectedArea}
          detectionMarkers={result?.markers}
          searchLocationMarker={
            selectedLocation
              ? {
                  lat: selectedLocation.latitude,
                  lng: selectedLocation.longitude,
                  label:
                    selectedLocation.displayName ||
                    `${selectedLocation.latitude.toFixed(4)}, ${selectedLocation.longitude.toFixed(4)}`,
                  coordinatesText: formatCoordinates(
                    selectedLocation.latitude,
                    selectedLocation.longitude
                  ),
                }
              : null
          }
          onMapClick={handleMapClick}
        />
      </div>

      {/* ════════════════════════════════════════════════════════
          2. MINIMAL TOP FLOATING HUD CONTROLS
      ════════════════════════════════════════════════════════ */}
      <div className="absolute top-3.5 left-4 right-4 z-30 pointer-events-none flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        {/* Top-Left: Map Search Bar & GIS Coordinate Control */}
        <div className="pointer-events-auto flex flex-col gap-2">
          <MapSearchBar onSelectLocation={handleSelectLocation} />
          <LocationControl
            latitude={inputLat}
            longitude={inputLng}
            onLatitudeChange={setInputLat}
            onLongitudeChange={setInputLng}
            onGoToLocation={handleGoToCoordinates}
            onClear={handleClearLocation}
            hasActiveMarker={!!selectedLocation}
            locationLabel={selectedLocation?.displayName}
          />
        </div>

        {/* Top-Center: Location Context Pill */}
        {selectedLocation ? (
          <div className="hidden md:flex pointer-events-auto items-center gap-2 bg-black/85 backdrop-blur-xl border border-[#C29B53]/40 px-3.5 py-1.5 rounded-full shadow-2xl animate-fade-in">
            <span className="text-[#C29B53] text-xs">📍</span>
            <div className="flex items-center gap-2 text-[11px] font-mono">
              {selectedLocation.displayName && (
                <span className="font-bold text-white uppercase tracking-wider">
                  {selectedLocation.displayName}
                </span>
              )}
              {selectedLocation.displayName && <span className="text-zinc-500">·</span>}
              <span className="text-zinc-200">
                {formatCoordinates(selectedLocation.latitude, selectedLocation.longitude)}
              </span>
            </div>
            <button
              type="button"
              onClick={handleClearLocation}
              className="ml-1 text-zinc-400 hover:text-white p-0.5 rounded transition-colors cursor-pointer"
              title="Clear location indicator"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <div className="hidden md:flex pointer-events-auto items-center gap-2 bg-black/80 backdrop-blur-xl border border-white/15 px-3 py-1.5 rounded-full shadow-2xl">
            <Compass size={13} className="text-[#C29B53]" />
            <span className="text-[11px] font-mono tracking-wider uppercase text-zinc-200">
              MAP ANALYSIS
            </span>
          </div>
        )}

        {/* Top-Right: Minimal Map Top Control (Area Selection Pill) */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* State 1: No Area Selected */}
          {!selectedArea && !isSelectingArea && (
            <div className="flex items-center gap-3 bg-black/80 backdrop-blur-xl border border-white/15 px-3.5 py-1.5 rounded-xl shadow-2xl">
              <span className="text-xs font-mono text-zinc-300 hidden lg:inline">
                SELECT AN AREA TO ANALYZE
              </span>
              <button
                type="button"
                onClick={handleStartSelection}
                className="px-3 py-1 rounded-lg text-xs font-mono font-bold tracking-wider uppercase text-[#C29B53] bg-[#C29B53]/15 hover:bg-[#C29B53]/25 border border-[#C29B53]/40 hover:border-[#C29B53]/70 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <MousePointerClick size={13} />
                <span>SELECT AREA</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedArea(DEFAULT_PRESET_AOI);
                  if (mapInstance) {
                    mapInstance.flyTo([DEFAULT_PRESET_AOI.center.lat, DEFAULT_PRESET_AOI.center.lng], 13);
                  }
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-mono text-zinc-300 hover:text-[#C29B53] bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 hover:border-[#C29B53]/40 transition-colors cursor-pointer flex items-center gap-1"
                title="Select 24.6 km² New Delhi metropolitan AOI"
              >
                <span>USE PRESET (24.6 km²)</span>
              </button>
            </div>
          )}

          {/* State 2: User is Drawing AOI */}
          {isSelectingArea && (
            <div className="flex items-center gap-3 bg-black/85 backdrop-blur-xl border border-amber-500/40 px-3.5 py-1.5 rounded-xl shadow-2xl">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-xs font-mono font-semibold text-amber-300">
                  DRAW AN AREA ON THE MAP
                </span>
              </div>
              <button
                type="button"
                onClick={handleCancelSelection}
                className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium text-zinc-300 hover:text-white bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 transition-all cursor-pointer flex items-center gap-1"
              >
                <X size={12} />
                <span>CANCEL</span>
              </button>
            </div>
          )}

          {/* State 3: Area Has Been Selected */}
          {selectedArea && !isSelectingArea && (
            <div className="flex items-center gap-3 bg-black/80 backdrop-blur-xl border border-white/15 px-3.5 py-1.5 rounded-xl shadow-2xl">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-[#C29B53]" />
                <span className="text-xs font-mono font-semibold text-white">
                  AREA SELECTED
                </span>
                <span className="text-xs font-mono text-[#C29B53] bg-[#C29B53]/10 px-2 py-0.5 rounded border border-[#C29B53]/20">
                  {selectedArea.areaKm2.toFixed(2)} km²
                </span>
              </div>
              <button
                type="button"
                onClick={handleClearArea}
                className="px-2.5 py-1 rounded-lg text-[11px] font-mono text-zinc-400 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 transition-colors cursor-pointer flex items-center gap-1"
              >
                <RotateCcw size={11} />
                <span>CHANGE</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          3. FLOATING ERROR BANNER
      ════════════════════════════════════════════════════════ */}
      {error && (
        <div className="absolute top-18 left-1/2 -translate-x-1/2 z-40 w-full max-w-lg px-4 pointer-events-auto animate-fade-in">
          <div className="p-4 rounded-xl bg-red-950/85 backdrop-blur-xl border border-red-500/50 text-red-200 text-xs flex items-start justify-between gap-3 shadow-2xl">
            <div className="flex items-start gap-2.5">
              <AlertCircle size={16} className="shrink-0 text-red-400 mt-0.5" />
              <div className="flex flex-col gap-1">
                <span className="leading-relaxed font-sans">{error}</span>
                <button
                  type="button"
                  onClick={handleAnalyze}
                  className="self-start text-[11px] font-mono text-red-300 underline hover:text-white cursor-pointer"
                >
                  Retry Analysis
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-200 font-mono text-[11px] cursor-pointer shrink-0"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          4. ASK SATQUERY PANEL / AI RESULT CARD (BOTTOM HERO)
      ════════════════════════════════════════════════════════ */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-full max-w-2xl px-4 pointer-events-auto">
        {!result ? (
          /* ── ASK SATQUERY PANEL ── */
          <div className="rounded-2xl p-5 sm:p-6 backdrop-blur-2xl bg-black/85 border border-white/15 shadow-[0_20px_80px_rgba(0,0,0,0.95)] text-left transition-all">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-[#C29B53]" />
                <h2 className="text-sm font-bold font-mono uppercase tracking-[0.16em] text-white">
                  ASK SATQUERY
                </h2>
              </div>
              {selectedArea && (
                <span className="text-[11px] font-mono text-[#C29B53] bg-[#C29B53]/10 px-2 py-0.5 rounded-full border border-[#C29B53]/30">
                  {selectedArea.areaKm2.toFixed(2)} km² Target
                </span>
              )}
            </div>

            <p className="text-xs text-zinc-400 font-sans mb-3.5">
              What would you like to know about this area?
            </p>

            {/* Natural-Language Textarea */}
            <div className="relative">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={!selectedArea || loading}
                placeholder={
                  !selectedArea
                    ? 'Select an area on the map to enable analysis.'
                    : 'Ask any natural-language question about this region...'
                }
                rows={2}
                className={`
                  w-full rounded-xl p-3.5 text-sm text-white outline-none transition-all resize-none font-sans leading-relaxed
                  ${
                    !selectedArea
                      ? 'bg-white/[0.02] border border-white/5 placeholder:text-zinc-600 cursor-not-allowed'
                      : 'bg-white/[0.04] border border-white/15 focus:border-[#C29B53] focus:bg-white/[0.07] placeholder:text-zinc-500'
                  }
                `}
              />
            </div>

            {/* Suggested Question Chips (Active only after AOI selection) */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {SUGGESTED_QUERIES.slice(0, 4).map((sq) => (
                <button
                  key={sq}
                  type="button"
                  onClick={() => selectedArea && setQuery(sq)}
                  disabled={!selectedArea || loading}
                  className={`
                    text-[11px] font-sans px-2.5 py-1 rounded-lg border transition-all text-left
                    ${
                      selectedArea && !loading
                        ? 'bg-white/[0.03] hover:bg-white/[0.08] text-zinc-300 hover:text-white border-white/10 hover:border-[#C29B53]/40 cursor-pointer'
                        : 'bg-white/[0.01] text-zinc-600 border-white/5 cursor-not-allowed'
                    }
                  `}
                >
                  {sq}
                </button>
              ))}
            </div>

            {/* Bottom Row: Helper Note + ANALYZE AOI Button */}
            <div className="mt-4 pt-3.5 border-t border-white/10 flex items-center justify-between gap-3 flex-wrap">
              <div>
                {selectedArea ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-zinc-400">Selected Area:</span>
                    <span className="text-xs font-mono font-bold text-[#C29B53] bg-[#C29B53]/15 px-2.5 py-0.5 rounded-lg border border-[#C29B53]/30">
                      {selectedArea.areaKm2.toFixed(2)} km²
                    </span>
                  </div>
                ) : (
                  <span className="text-[11px] font-mono text-zinc-500">
                    Draw an area on the map to enable analysis
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleAnalyze}
                disabled={!selectedArea || loading}
                className={`
                  px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-[0.16em] font-mono
                  flex items-center justify-center gap-2 transition-all shrink-0
                  ${
                    !selectedArea || loading
                      ? 'bg-zinc-800 text-zinc-500 border border-white/5 cursor-not-allowed'
                      : 'bg-[#C29B53] hover:bg-[#CCA563] text-black shadow-sm active:scale-[0.99] cursor-pointer'
                  }
                `}
              >
                {loading ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>ANALYZING…</span>
                  </>
                ) : (
                  <>
                    <span>ANALYZE AOI</span>
                    <ArrowRight size={13} />
                  </>
                )}
              </button>
            </div>
          </div>
        ) : loading ? (
          /* ── PROCESSING STATE ── */
          <div className="animate-fade-in flex justify-center">
            <AnalysisLoadingState
              title="Analyzing satellite data..."
              subtitle={`Processing your ${selectedArea?.areaKm2 ? selectedArea.areaKm2.toFixed(2) + ' km² ' : ''}AOI request... This may take a few moments.`}
            />
          </div>
        ) : (
          /* ── STANDARDIZED REAL RESULT VIEW ── */
          <AnalysisResultView
            title="MAP AOI ANALYSIS RESULT"
            data={{
              id: result.id,
              trace_id: result.id,
              query: result.query,
              final_answer: result.answer,
              answer: result.answer,
              confidence: result.confidence,
              areaKm2: result.area?.areaKm2 || selectedArea?.areaKm2,
              locationName: selectedLocation?.displayName,
              coordinatesText: result.area ? `${result.area.center.lat.toFixed(4)}°N, ${result.area.center.lng.toFixed(4)}°E` : undefined,
              visualEvidenceUrl: result.visualEvidenceUrl,
              detectedCategories: result.detectedCategories,
              changeDetected: result.detectedChanges?.map((c) => c.label).join(', '),
              isDemoMode: result.isDemoMode,
            }}
            onGenerateReport={() => {
              const rData: AnalysisResultData = {
                id: result.id,
                trace_id: result.id,
                query: result.query,
                final_answer: result.answer,
                answer: result.answer,
                confidence: result.confidence,
                areaKm2: result.area?.areaKm2 || selectedArea?.areaKm2,
                locationName: selectedLocation?.displayName,
                coordinatesText: result.area ? `${result.area.center.lat.toFixed(4)}°N, ${result.area.center.lng.toFixed(4)}°E` : undefined,
                visualEvidenceUrl: result.visualEvidenceUrl,
                detectedCategories: result.detectedCategories,
                changeDetected: result.detectedChanges?.map((c) => c.label).join(', '),
                isDemoMode: result.isDemoMode,
              };
              if (onOpenReportModal) {
                onOpenReportModal(rData);
              } else {
                setLocalReportData(rData);
                setIsLocalReportOpen(true);
              }
            }}
            onPrintReport={() => {
              const rData: AnalysisResultData = {
                id: result.id,
                trace_id: result.id,
                query: result.query,
                final_answer: result.answer,
                answer: result.answer,
                confidence: result.confidence,
                areaKm2: result.area?.areaKm2 || selectedArea?.areaKm2,
                locationName: selectedLocation?.displayName,
                coordinatesText: result.area ? `${result.area.center.lat.toFixed(4)}°N, ${result.area.center.lng.toFixed(4)}°E` : undefined,
                visualEvidenceUrl: result.visualEvidenceUrl,
                detectedCategories: result.detectedCategories,
                changeDetected: result.detectedChanges?.map((c) => c.label).join(', '),
                isDemoMode: result.isDemoMode,
              };
              if (onOpenReportModal) {
                onOpenReportModal(rData);
              } else {
                setLocalReportData(rData);
                setIsLocalReportOpen(true);
              }
            }}
            onNewAnalysis={handleNewAnalysis}
          />
        )}
      </div>

      {/* Local Report Modal if not opened globally */}
      {localReportData && (
        <ReportModal
          isOpen={isLocalReportOpen}
          onClose={() => setIsLocalReportOpen(false)}
          data={localReportData}
        />
      )}

      {/* Development-Only Demo Mode Switch (Discreet bottom-right corner) */}
      <div className="absolute bottom-2 right-2 z-20 pointer-events-auto">
        <label className="text-[9px] font-mono text-zinc-600 hover:text-zinc-400 cursor-pointer flex items-center gap-1.5 bg-black/50 px-2 py-1 rounded">
          <span>Demo Fallback</span>
          <input
            type="checkbox"
            checked={forceMock}
            onChange={(e) => setForceMock(e.target.checked)}
            className="rounded accent-[#C29B53] cursor-pointer"
          />
        </label>
      </div>
    </div>
  );
}
