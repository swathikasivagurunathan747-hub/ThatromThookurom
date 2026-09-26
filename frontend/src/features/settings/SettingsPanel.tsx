// ============================================================
// SATQUERY AI — Settings Panel
// Comprehensive system configuration, map visualization preferences,
// analysis parameters, API connection controls, and user account.
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  Settings,
  X,
  Radio,
  Sliders,
  Database,
  Cpu,
  User,
  Info,
  Check,
  RotateCcw,
  Loader2,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Layers,
  Activity,
  LogOut,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import {
  getSettings,
  saveSettings,
  resetSettings,
  testApiConnection,
  type SatQuerySettings,
} from '../../services/settingsService';
import { getCurrentSessionUser, logoutUser } from '../../services/authService';

interface SettingsPanelProps {
  onClose: () => void;
}

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const [settings, setSettings] = useState<SatQuerySettings>(getSettings());
  const [testingApi, setTestingApi] = useState(false);
  const [apiStatusMessage, setApiStatusMessage] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<boolean>(true);
  const [saveToast, setSaveToast] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  // Sync with current user session if available
  useEffect(() => {
    const sessionUser = getCurrentSessionUser();
    if (sessionUser && sessionUser.name) {
      setSettings((prev) => ({
        ...prev,
        userName: sessionUser.name,
        userRole: sessionUser.role || prev.userRole,
      }));
    }
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const updateSetting = <K extends keyof SatQuerySettings>(key: K, value: SatQuerySettings[K]) => {
    const updated = saveSettings({ [key]: value });
    setSettings(updated);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 1400);
  };

  const handleReset = () => {
    const defaults = resetSettings();
    setSettings(defaults);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 1400);
  };

  const handleTestApi = async () => {
    setTestingApi(true);
    setApiStatusMessage(null);
    const res = await testApiConnection(settings.apiEndpoint);
    setTestingApi(false);
    setApiSuccess(res.success);
    setApiStatusMessage(res.message);
  };

  const handleSignOut = () => {
    logoutUser();
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div
        className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-[#070b0e]/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.9)] overflow-hidden font-sans text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── HEADER ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#C29B53]/15 border border-[#C29B53]/30 text-[#C29B53] shadow-sm">
              <Settings size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold font-mono tracking-[0.16em] uppercase text-white">
                  SETTINGS
                </h1>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-white/[0.08] text-zinc-400 border border-white/10">
                  SYSTEM PREFERENCES
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-sans mt-0.5">
                Configure map telemetry, inference models, backend endpoints, and analyst profile.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 rounded-lg text-xs font-mono text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-colors cursor-pointer flex items-center gap-1.5"
              title="Reset all settings to default values"
            >
              <RotateCcw size={12} />
              <span className="hidden sm:inline">Reset Defaults</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close settings"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── SCROLLABLE BODY ── */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-7 divide-y divide-white/10">
          {/* ════════════════════════════════════════════════════════
              1. 🛰️ MAP & VISUALIZATION
          ════════════════════════════════════════════════════════ */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-base">🛰️</span>
              <h2 className="text-xs font-bold font-mono tracking-[0.16em] uppercase text-white">
                MAP &amp; VISUALIZATION
              </h2>
            </div>

            <div className="bg-white/[0.02] border border-white/10 rounded-xl divide-y divide-white/5">
              {/* Show AOI Boundary */}
              <div className="flex items-center justify-between p-3.5 sm:px-4">
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-zinc-200">Show AOI Boundary</span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    Highlight active Area of Interest bounding polygons
                  </span>
                </div>
                <Toggle
                  checked={settings.showAoiBoundary}
                  onChange={(v) => updateSetting('showAoiBoundary', v)}
                />
              </div>

              {/* Detection Markers */}
              <div className="flex items-center justify-between p-3.5 sm:px-4">
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-zinc-200">Detection Markers</span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    Display detected targets, infrastructure, and changes
                  </span>
                </div>
                <Toggle
                  checked={settings.detectionMarkers}
                  onChange={(v) => updateSetting('detectionMarkers', v)}
                />
              </div>

              {/* Scale Bar */}
              <div className="flex items-center justify-between p-3.5 sm:px-4">
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-zinc-200">Scale Bar</span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    Show metric distance reference scale on lower map canvas
                  </span>
                </div>
                <Toggle
                  checked={settings.scaleBar}
                  onChange={(v) => updateSetting('scaleBar', v)}
                />
              </div>

              {/* Coordinate Overlay */}
              <div className="flex items-center justify-between p-3.5 sm:px-4">
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-zinc-200">Coordinate Overlay</span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    Display real-time cursor latitude and longitude readout
                  </span>
                </div>
                <Toggle
                  checked={settings.coordinateOverlay}
                  onChange={(v) => updateSetting('coordinateOverlay', v)}
                />
              </div>

              {/* Satellite Grid */}
              <div className="flex items-center justify-between p-3.5 sm:px-4">
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-zinc-200">Satellite Grid</span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    Overlay MGRS / UTM geographic coordinate grid lines
                  </span>
                </div>
                <Toggle
                  checked={settings.satelliteGrid}
                  onChange={(v) => updateSetting('satelliteGrid', v)}
                />
              </div>

              {/* Map Theme */}
              <div className="flex items-center justify-between p-3.5 sm:px-4">
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-zinc-200">Map Theme</span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    Color palette and tile presentation layer
                  </span>
                </div>
                <select
                  value={settings.mapTheme}
                  onChange={(e) => updateSetting('mapTheme', e.target.value as SatQuerySettings['mapTheme'])}
                  className="bg-black/80 border border-white/20 text-xs font-mono text-white rounded-lg px-3 py-1.5 outline-none focus:border-[#C29B53] cursor-pointer"
                >
                  <option value="dark">Dark</option>
                  <option value="satellite">Satellite Hybrid</option>
                  <option value="midnight">Midnight Contrast</option>
                  <option value="topo">Topographic</option>
                </select>
              </div>
            </div>
          </section>

          {/* ════════════════════════════════════════════════════════
              2. 🤖 ANALYSIS
          ════════════════════════════════════════════════════════ */}
          <section className="pt-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-base">🤖</span>
              <h2 className="text-xs font-bold font-mono tracking-[0.16em] uppercase text-white">
                ANALYSIS
              </h2>
            </div>

            <div className="bg-white/[0.02] border border-white/10 rounded-xl divide-y divide-white/5">
              {/* Auto-analyze on Upload */}
              <div className="flex items-center justify-between p-3.5 sm:px-4">
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-zinc-200">Auto-analyze on Upload</span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    Automatically initiate classification upon scene ingest
                  </span>
                </div>
                <Toggle
                  checked={settings.autoAnalyzeOnUpload}
                  onChange={(v) => updateSetting('autoAnalyzeOnUpload', v)}
                />
              </div>

              {/* Default Analysis */}
              <div className="flex items-center justify-between p-3.5 sm:px-4">
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-zinc-200">Default Analysis</span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    Primary workflow when querying geospatial scenes
                  </span>
                </div>
                <select
                  value={settings.defaultAnalysis}
                  onChange={(e) => updateSetting('defaultAnalysis', e.target.value as SatQuerySettings['defaultAnalysis'])}
                  className="bg-black/80 border border-white/20 text-xs font-mono text-white rounded-lg px-3 py-1.5 outline-none focus:border-[#C29B53] cursor-pointer"
                >
                  <option value="vqa">VQA (Visual QA)</option>
                  <option value="change">Change Detection</option>
                  <option value="classification">Classification</option>
                  <option value="segmentation">Segmentation</option>
                </select>
              </div>

              {/* Show Confidence Scores */}
              <div className="flex items-center justify-between p-3.5 sm:px-4">
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-zinc-200">Show Confidence Scores</span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    Display model certainty percentage alongside predictions
                  </span>
                </div>
                <Toggle
                  checked={settings.showConfidenceScores}
                  onChange={(v) => updateSetting('showConfidenceScores', v)}
                />
              </div>

              {/* Confidence Threshold Slider */}
              <div className="p-3.5 sm:px-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-zinc-200">Confidence Threshold</span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      Filter detections below this model confidence level
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#C29B53]/15 text-[#C29B53] border border-[#C29B53]/30">
                    {settings.confidenceThreshold}%
                  </span>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <span className="text-[10px] font-mono text-zinc-500">10%</span>
                  <input
                    type="range"
                    min={10}
                    max={95}
                    step={5}
                    value={settings.confidenceThreshold}
                    onChange={(e) => updateSetting('confidenceThreshold', Number(e.target.value))}
                    className="w-full accent-[#C29B53] cursor-pointer"
                  />
                  <span className="text-[10px] font-mono text-zinc-500">95%</span>
                </div>
              </div>
            </div>
          </section>

          {/* ════════════════════════════════════════════════════════
              3. 🗺️ DATA & MODEL
          ════════════════════════════════════════════════════════ */}
          <section className="pt-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-base">🗺️</span>
              <h2 className="text-xs font-bold font-mono tracking-[0.16em] uppercase text-white">
                DATA &amp; MODEL
              </h2>
            </div>

            <div className="bg-white/[0.02] border border-white/10 rounded-xl divide-y divide-white/5">
              {/* Default Dataset */}
              <div className="flex items-center justify-between p-3.5 sm:px-4">
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-zinc-200">Default Dataset</span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    Baseline catalog for image ingestion and queries
                  </span>
                </div>
                <select
                  value={settings.defaultDataset}
                  onChange={(e) => updateSetting('defaultDataset', e.target.value)}
                  className="bg-black/80 border border-white/20 text-xs font-mono text-white rounded-lg px-3 py-1.5 outline-none focus:border-[#C29B53] cursor-pointer"
                >
                  <option value="Auto">Auto</option>
                  <option value="Sentinel-2">Sentinel-2 L2A</option>
                  <option value="Landsat-8">Landsat 8-9</option>
                  <option value="PlanetScope">PlanetScope 3m</option>
                  <option value="WorldView">WorldView-3</option>
                </select>
              </div>

              {/* Default Sensor */}
              <div className="flex items-center justify-between p-3.5 sm:px-4">
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-zinc-200">Default Sensor</span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    Primary multispectral instrument specification
                  </span>
                </div>
                <select
                  value={settings.defaultSensor}
                  onChange={(e) => updateSetting('defaultSensor', e.target.value)}
                  className="bg-black/80 border border-white/20 text-xs font-mono text-white rounded-lg px-3 py-1.5 outline-none focus:border-[#C29B53] cursor-pointer"
                >
                  <option value="Sentinel-2">Sentinel-2</option>
                  <option value="MSI">MSI (Multispectral)</option>
                  <option value="OLI-TIRS">OLI-TIRS</option>
                  <option value="SuperDove">SuperDove</option>
                  <option value="Hyperion">Hyperion</option>
                </select>
              </div>

              {/* Inference Mode */}
              <div className="flex items-center justify-between p-3.5 sm:px-4">
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-zinc-200">Inference Mode</span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    Compute pipeline execution target
                  </span>
                </div>
                <select
                  value={settings.inferenceMode}
                  onChange={(e) => updateSetting('inferenceMode', e.target.value as SatQuerySettings['inferenceMode'])}
                  className="bg-black/80 border border-white/20 text-xs font-mono text-white rounded-lg px-3 py-1.5 outline-none focus:border-[#C29B53] cursor-pointer"
                >
                  <option value="server">Server</option>
                  <option value="local">Local (ONNX)</option>
                  <option value="edge">Edge Hybrid</option>
                  <option value="cloud">Cloud TPU</option>
                </select>
              </div>
            </div>
          </section>

          {/* ════════════════════════════════════════════════════════
              4. 🔌 API CONFIGURATION
          ════════════════════════════════════════════════════════ */}
          <section className="pt-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-base">🔌</span>
              <h2 className="text-xs font-bold font-mono tracking-[0.16em] uppercase text-white">
                API CONFIGURATION
              </h2>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-4">
              {/* Backend Status Row */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-300">Backend Status</span>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-mono font-bold tracking-wider text-emerald-400">
                    CONNECTED
                  </span>
                  {apiStatusMessage && (
                    <span className="text-[11px] font-mono text-zinc-400">
                      ({apiStatusMessage})
                    </span>
                  )}
                </div>
              </div>

              {/* API Endpoint Input */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="api-endpoint-input"
                  className="text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-400"
                >
                  API Endpoint
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="api-endpoint-input"
                    type="text"
                    value={settings.apiEndpoint}
                    onChange={(e) => updateSetting('apiEndpoint', e.target.value)}
                    placeholder="http://localhost:8000"
                    className="flex-1 px-3 py-2 text-xs font-mono text-white bg-black/70 border border-white/15 rounded-lg outline-none focus:border-[#C29B53] transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleTestApi}
                    disabled={testingApi}
                    className="px-4 py-2 rounded-lg text-xs font-mono font-bold tracking-wider uppercase text-black bg-[#C29B53] hover:bg-[#CCA563] transition-all shrink-0 cursor-pointer active:scale-98 disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                  >
                    {testingApi ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        <span>TESTING…</span>
                      </>
                    ) : (
                      <span>TEST CONNECTION</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* ════════════════════════════════════════════════════════
              5. 👤 ACCOUNT
          ════════════════════════════════════════════════════════ */}
          <section className="pt-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-base">👤</span>
              <h2 className="text-xs font-bold font-mono tracking-[0.16em] uppercase text-white">
                ACCOUNT
              </h2>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/[0.08] border border-[#C29B53]/50 flex items-center justify-center text-[#C29B53] font-mono font-bold text-sm shadow-sm">
                    {settings.userName ? settings.userName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white font-sans">
                        {settings.userName || 'Your Username'}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#C29B53]/15 text-[#C29B53] border border-[#C29B53]/30">
                        {settings.userRole}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500">
                      Authorized Geospatial Analyst Session
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!confirmSignOut ? (
                    <button
                      type="button"
                      onClick={() => setConfirmSignOut(true)}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold text-red-300 hover:text-white bg-red-950/40 hover:bg-red-900/50 border border-red-500/40 transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <LogOut size={12} />
                      <span>SIGN OUT</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 animate-fade-in">
                      <span className="text-[11px] font-mono text-red-300">Sign out now?</span>
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="px-2.5 py-1 rounded text-[11px] font-mono font-bold bg-red-600 hover:bg-red-500 text-white cursor-pointer"
                      >
                        YES
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmSignOut(false)}
                        className="px-2.5 py-1 rounded text-[11px] font-mono text-zinc-400 hover:text-white bg-white/10 cursor-pointer"
                      >
                        CANCEL
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Editable user details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/5">
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="user-name-input"
                    className="text-[10px] font-mono uppercase tracking-wider text-zinc-400"
                  >
                    User Name
                  </label>
                  <input
                    id="user-name-input"
                    type="text"
                    value={settings.userName}
                    onChange={(e) => updateSetting('userName', e.target.value)}
                    className="px-3 py-1.5 text-xs font-mono text-white bg-black/60 border border-white/15 rounded-lg outline-none focus:border-[#C29B53]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="user-role-input"
                    className="text-[10px] font-mono uppercase tracking-wider text-zinc-400"
                  >
                    Role
                  </label>
                  <input
                    id="user-role-input"
                    type="text"
                    value={settings.userRole}
                    onChange={(e) => updateSetting('userRole', e.target.value)}
                    className="px-3 py-1.5 text-xs font-mono text-white bg-black/60 border border-white/15 rounded-lg outline-none focus:border-[#C29B53]"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ════════════════════════════════════════════════════════
              6. ℹ️ ABOUT
          ════════════════════════════════════════════════════════ */}
          <section className="pt-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-base">ℹ️</span>
              <h2 className="text-xs font-bold font-mono tracking-[0.16em] uppercase text-white">
                ABOUT
              </h2>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold font-mono tracking-wider text-white">
                    SATQUERY AI
                  </h3>
                  <p className="text-[11px] text-zinc-400 font-sans mt-0.5">
                    Agentic AI-driven satellite imagery analysis and natural-language earth observation.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-zinc-500 block">Version</span>
                  <span className="text-xs font-mono font-bold text-[#C29B53]">v0.1.0-dev</span>
                </div>
              </div>

              {/* Status matrix */}
              <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-white/5">
                <div className="p-2.5 rounded-lg bg-black/50 border border-white/10 flex items-center justify-between">
                  <span className="text-xs font-mono text-zinc-300">Frontend</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-[10px] font-mono font-bold text-emerald-400">Connected</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-black/50 border border-white/10 flex items-center justify-between">
                  <span className="text-xs font-mono text-zinc-300">Backend</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-[10px] font-mono font-bold text-emerald-400">Connected</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-black/50 border border-white/10 flex items-center justify-between">
                  <span className="text-xs font-mono text-zinc-300">AI Models</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-[10px] font-mono font-bold text-emerald-400">Loaded</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* ── FOOTER BAR ── */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-white/10 bg-black/40">
          <div className="flex items-center gap-2">
            {saveToast && (
              <span className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 animate-fade-in">
                <Check size={13} />
                <span>Preference saved</span>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-black bg-[#C29B53] hover:bg-[#CCA563] transition-all shadow-sm active:scale-[0.98] cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// Minimal toggle switch component matching SatQuery design
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`
        relative inline-flex h-6 w-14 items-center rounded-full transition-all duration-200 cursor-pointer outline-none
        ${
          checked
            ? 'bg-[#C29B53] '
            : 'bg-zinc-800 border border-white/10'
        }
      `}
    >
      <span
        className={`
          text-[9px] font-mono font-bold absolute tracking-wider
          ${checked ? 'left-2 text-black' : 'right-2 text-zinc-500'}
        `}
      >
        {checked ? 'ON' : 'OFF'}
      </span>
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow-md
          ${checked ? 'translate-x-8' : 'translate-x-1'}
        `}
      />
    </button>
  );
}
