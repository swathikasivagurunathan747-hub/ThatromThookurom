// ============================================================
// SATQUERY AI — Satellite Map
// Uses Esri World Imagery tiles with Leaflet basemap.
// Overlaid with transparent Esri World Boundaries, Places &
// Transportation reference layers for crisp geographic labels.
// ============================================================

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { AOI, LayerType, MapAreaSelection } from '../../types';

const TILE_URLS: Record<LayerType, string> = {
  rgb: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  nir: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  ndvi: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  change: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
};

// Transparent reference and boundary overlay tiles
const LABEL_TILE_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}';
const TRANSPORT_TILE_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}';

// CSS filters for layer simulation (replace with real tile layers from backend)
const LAYER_FILTERS: Record<LayerType, string> = {
  rgb: 'none',
  nir: 'hue-rotate(100deg) saturate(1.4) brightness(0.9)',
  ndvi: 'hue-rotate(60deg) saturate(2) brightness(0.85) sepia(0.2)',
  change: 'grayscale(0.6) contrast(1.4) brightness(0.8)',
};

export interface SearchLocationMarker {
  lat: number;
  lng: number;
  label: string;
  coordinatesText?: string;
}

export interface SatelliteMapProps {
  center: [number, number];
  zoom?: number;
  aoi?: AOI | null;
  activeLayer?: LayerType;
  showLabels?: boolean;
  onMapReady?: (map: L.Map) => void;
  detectionMarkers?: Array<{ lat: number; lng: number; label: string }>;
  isSelectingArea?: boolean;
  onAreaSelected?: (area: MapAreaSelection) => void;
  selectedArea?: MapAreaSelection | null;
  searchLocationMarker?: SearchLocationMarker | null;
  onMapClick?: (coords: { lat: number; lng: number }) => void;
}

export function SatelliteMap({
  center,
  zoom = 14,
  aoi,
  activeLayer = 'rgb',
  showLabels = true,
  onMapReady,
  detectionMarkers = [],
  isSelectingArea = false,
  onAreaSelected,
  selectedArea = null,
  searchLocationMarker = null,
  onMapClick,
}: SatelliteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const labelLayerRef = useRef<L.TileLayer | null>(null);
  const transportLayerRef = useRef<L.TileLayer | null>(null);
  const aoiLayerRef = useRef<L.Polygon | L.Rectangle | null>(null);
  const aoiLabelRef = useRef<L.Marker | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const searchMarkerRef = useRef<L.Marker | null>(null);
  const tempRectRef = useRef<L.Rectangle | null>(null);
  const startLatLngRef = useRef<L.LatLng | null>(null);
  const isMouseDownRef = useRef<boolean>(false);

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center,
      zoom,
      zoomControl: false,
      attributionControl: false,
    });

    // Base Tile layer (ArcGIS World Imagery)
    const tile = L.tileLayer(TILE_URLS[activeLayer], {
      maxZoom: 19,
      tileSize: 256,
      zIndex: 1,
    }).addTo(map);
    tileLayerRef.current = tile;

    // Transparent Reference Layer (Boundaries & Places: Cities, Towns, Water bodies)
    const labelLayer = L.tileLayer(LABEL_TILE_URL, {
      maxZoom: 19,
      tileSize: 256,
      zIndex: 10,
      opacity: 0.92,
    }).addTo(map);
    labelLayerRef.current = labelLayer;

    // Transparent Transportation Layer (Roads, Highways)
    const transportLayer = L.tileLayer(TRANSPORT_TILE_URL, {
      maxZoom: 19,
      tileSize: 256,
      zIndex: 11,
      opacity: 0.85,
    }).addTo(map);
    transportLayerRef.current = transportLayer;

    // Zoom control — bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Scale bar
    L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);

    mapRef.current = map;
    onMapReady?.(map);

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Toggle label layers visibility
  useEffect(() => {
    if (!labelLayerRef.current || !transportLayerRef.current) return;
    const opacity = showLabels ? 0.92 : 0;
    const transOpacity = showLabels ? 0.85 : 0;
    labelLayerRef.current.setOpacity(opacity);
    transportLayerRef.current.setOpacity(transOpacity);
  }, [showLabels]);

  // Update tile filter when layer changes
  useEffect(() => {
    if (!tileLayerRef.current) return;
    const container = tileLayerRef.current.getContainer();
    if (container) {
      (container as HTMLElement).style.filter = LAYER_FILTERS[activeLayer];
    }
  }, [activeLayer]);

  // Handle Search Location Marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (searchMarkerRef.current) {
      searchMarkerRef.current.remove();
      searchMarkerRef.current = null;
    }

    if (searchLocationMarker) {
      const { lat, lng, label, coordinatesText } = searchLocationMarker;

      const customIcon = L.divIcon({
        className: 'satquery-search-pin',
        html: `
          <div style="
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            transform: translate(-50%, -100%);
            pointer-events: none;
          ">
            <div style="
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              font-size: 10px;
              font-weight: 700;
              letter-spacing: 0.08em;
              text-transform: uppercase;
              color: #ffffff;
              background: rgba(9, 13, 16, 0.95);
              border: 1px solid rgba(194, 155, 83, 0.6);
              padding: 4px 8px;
              border-radius: 6px;
              white-space: nowrap;
              box-shadow: 0 4px 16px rgba(0,0,0,0.7), 0 0 12px rgba(194, 155, 83, 0.4);
              margin-bottom: 4px;
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 2px;
            ">
              <div style="display: flex; align-items: center; gap: 4px;">
                <span style="color: #C29B53; font-size: 11px;">📍</span>
                <span>${label}</span>
              </div>
              ${
                coordinatesText
                  ? `<div style="font-size: 9px; color: #94a3b8; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 400; letter-spacing: 0.03em;">${coordinatesText}</div>`
                  : `<div style="font-size: 9px; color: #94a3b8; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 400; letter-spacing: 0.03em;">${lat.toFixed(4)}, ${lng.toFixed(4)}</div>`
              }
            </div>
            <div style="
              width: 14px;
              height: 14px;
              border-radius: 50%;
              background: #C29B53;
              border: 2px solid #ffffff;
              box-shadow: 0 0 16px #C29B53, 0 0 24px rgba(194, 155, 83, 0.8);
              position: relative;
            ">
              <div style="
                position: absolute;
                inset: -6px;
                border-radius: 50%;
                border: 2px solid #C29B53;
                opacity: 0.8;
                animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
              "></div>
            </div>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker([lat, lng], {
        icon: customIcon,
        zIndexOffset: 2000,
      }).addTo(map);

      searchMarkerRef.current = marker;
    }
  }, [searchLocationMarker]);

  // Handle AOI display (either custom selectedArea or fallback aoi)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clean up previous AOI layers
    if (aoiLayerRef.current) {
      aoiLayerRef.current.remove();
      aoiLayerRef.current = null;
    }
    if (aoiLabelRef.current) {
      aoiLabelRef.current.remove();
      aoiLabelRef.current = null;
    }

    if (selectedArea) {
      // Render custom selected rectangle
      const bounds = L.latLngBounds(
        [selectedArea.bounds.south, selectedArea.bounds.west],
        [selectedArea.bounds.north, selectedArea.bounds.east]
      );
      const rect = L.rectangle(bounds, {
        color: '#C29B53',
        weight: 2,
        fillColor: '#C29B53',
        fillOpacity: 0.12,
        className: 'aoi-polygon',
      }).addTo(map);
      aoiLayerRef.current = rect;

      // Label at top-left corner
      const labelPos = L.latLng(selectedArea.bounds.north, selectedArea.bounds.west);
      const labelMarker = L.marker(labelPos, {
        icon: L.divIcon({
          html: `<div style="
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 9px;
            font-weight: bold;
            color: #050708;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            background: #C29B53;
            padding: 3px 7px;
            border-radius: 4px;
            white-space: nowrap;
            box-shadow: 0 0 12px rgba(194, 155, 83,0.5);
          ">AOI SELECTED · ${selectedArea.areaKm2.toFixed(2)} km²</div>`,
          className: '',
          iconAnchor: [0, 24],
        }),
      }).addTo(map);
      aoiLabelRef.current = labelMarker;
    } else if (aoi) {
      // Fallback: render default AOI polygon
      const coords = aoi.geometry.coordinates[0].map(
        ([lng, lat]) => [lat, lng] as [number, number]
      );
      const polygon = L.polygon(coords, {
        color: '#C29B53',
        weight: 1.5,
        fillColor: '#C29B53',
        fillOpacity: 0.07,
        className: 'aoi-polygon',
      }).addTo(map);
      aoiLayerRef.current = polygon;

      const aoiCenter = polygon.getBounds().getCenter();
      const labelMarker = L.marker(aoiCenter, {
        icon: L.divIcon({
          html: `<div style="
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 8px;
            color: #C29B53;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            background: rgba(5,7,8,0.7);
            border: 1px solid rgba(194, 155, 83,0.3);
            padding: 2px 5px;
            border-radius: 2px;
            white-space: nowrap;
          ">AOI — ${aoi.label}</div>`,
          className: '',
          iconAnchor: [40, 0],
        }),
      }).addTo(map);
      aoiLabelRef.current = labelMarker;
    }
  }, [selectedArea, aoi]);

  // Interactive Area Selection / Drawing
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!isSelectingArea) {
      map.dragging.enable();
      if (containerRef.current) {
        containerRef.current.style.cursor = '';
      }
      return;
    }

    // Entering selection mode: set cursor to crosshair
    if (containerRef.current) {
      containerRef.current.style.cursor = 'crosshair';
    }

    const onMouseDown = (e: L.LeafletMouseEvent) => {
      isMouseDownRef.current = true;
      startLatLngRef.current = e.latlng;
      // Temporarily disable map panning only during the active drag operation
      map.dragging.disable();

      if (tempRectRef.current) {
        tempRectRef.current.remove();
        tempRectRef.current = null;
      }

      tempRectRef.current = L.rectangle(L.latLngBounds(e.latlng, e.latlng), {
        color: '#C29B53',
        weight: 1.5,
        fillColor: '#C29B53',
        fillOpacity: 0.15,
        dashArray: '5, 5',
      }).addTo(map);
    };

    const onMouseMove = (e: L.LeafletMouseEvent) => {
      if (!isMouseDownRef.current || !startLatLngRef.current || !tempRectRef.current) return;
      const bounds = L.latLngBounds(startLatLngRef.current, e.latlng);
      tempRectRef.current.setBounds(bounds);
    };

    const onMouseUp = (e: L.LeafletMouseEvent) => {
      if (!isMouseDownRef.current || !startLatLngRef.current) return;
      isMouseDownRef.current = false;

      // Restore normal map pan/zoom interaction immediately after selection
      map.dragging.enable();

      const start = startLatLngRef.current;
      const end = e.latlng;
      startLatLngRef.current = null;

      if (tempRectRef.current) {
        tempRectRef.current.remove();
        tempRectRef.current = null;
      }

      // Check for minimal meaningful drag
      const distance = start.distanceTo(end);
      if (distance > 20) {
        const bounds = L.latLngBounds(start, end);
        const north = bounds.getNorth();
        const south = bounds.getSouth();
        const east = bounds.getEast();
        const west = bounds.getWest();
        const center = bounds.getCenter();

        // Approximate area calculation in km²
        const R = 6371; // Earth radius km
        const dLat = ((north - south) * Math.PI) / 180;
        const dLng = ((east - west) * Math.PI) / 180;
        const heightKm = Math.abs(dLat * R);
        const widthKm = Math.abs(dLng * R * Math.cos((center.lat * Math.PI) / 180));
        const areaKm2 = Math.max(0.01, heightKm * widthKm);

        onAreaSelected?.({
          bounds: { north, south, east, west },
          center: { lat: center.lat, lng: center.lng },
          areaKm2,
        });
      }
    };

    map.on('mousedown', onMouseDown);
    map.on('mousemove', onMouseMove);
    map.on('mouseup', onMouseUp);

    return () => {
      map.off('mousedown', onMouseDown);
      map.off('mousemove', onMouseMove);
      map.off('mouseup', onMouseUp);
      map.dragging.enable();
      if (tempRectRef.current) {
        tempRectRef.current.remove();
        tempRectRef.current = null;
      }
    };
  }, [isSelectingArea, onAreaSelected]);

  // Click on map to capture coordinates (active only when NOT in area selection mode)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || isSelectingArea) return;

    const handleClick = (e: L.LeafletMouseEvent) => {
      onMapClick?.({
        lat: Number(e.latlng.lat.toFixed(5)),
        lng: Number(e.latlng.lng.toFixed(5)),
      });
    };

    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [isSelectingArea, onMapClick]);

  // Detection markers
  useEffect(() => {
    if (!mapRef.current) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    detectionMarkers.forEach(({ lat, lng, label }) => {
      const icon = L.divIcon({
        html: `<div class="detection-marker"></div>`,
        className: '',
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      });
      const marker = L.marker([lat, lng], { icon })
        .addTo(mapRef.current!)
        .bindPopup(
          `<div style="font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:10px;color:#ededed;background:#0a0d0f;border:1px solid rgba(255,255,255,0.1);padding:6px 8px;border-radius:4px;">${label}</div>`,
          { className: 'satquery-popup' }
        );
      markersRef.current.push(marker);
    });
  }, [detectionMarkers]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ background: '#0a0d0f' }}
    />
  );
}
