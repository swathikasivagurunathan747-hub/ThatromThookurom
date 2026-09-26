import { useState, useRef } from 'react';
import { Upload, CloudSun, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import { Panel, PanelHeader, PanelDivider } from '../../components/ui/Panel';
import { Label } from '../../components/ui/Label';
import type { Scene } from '../../types';

interface ScenePanelProps {
  scene: Scene;
}

function MetaRow({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <Label>{label}</Label>
      <span
        className={`text-[10px] font-mono shrink-0 ${accent ? 'text-[#C29B53]' : 'text-[#d4d8da]'}`}
      >
        {value}
      </span>
    </div>
  );
}

export function ScenePanel({ scene }: ScenePanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [uploadedName, setUploadedName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) setUploadedName(file.name);
    // TODO: await uploadService.upload(file) → ingest scene
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setUploadedName(file.name);
    // TODO: await uploadService.upload(file) → ingest scene
  };

  return (
    <Panel className="w-[216px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5">
        <PanelHeader>Scene</PanelHeader>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-[#8a9092] hover:text-[#c8cccf] transition-colors"
        >
          {collapsed ? <ChevronDown size={11} /> : <ChevronUp size={11} />}
        </button>
      </div>

      {/* Thumbnail */}
      {scene.thumbnailUrl && (
        <div
          className="mb-2.5 overflow-hidden relative"
          style={{
            height: '84px',
            borderRadius: '2px',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <img
            src={scene.thumbnailUrl}
            alt={scene.name}
            className="w-full h-full object-cover"
            style={{ filter: 'brightness(0.82) saturate(0.85)' }}
          />
          {/* Scene name overlay */}
          <div
            className="absolute bottom-0 left-0 right-0 px-2 py-1"
            style={{ background: 'linear-gradient(transparent, rgba(5,7,8,0.9))' }}
          >
            <span className="text-[8px] font-mono text-[#8a9092] tracking-wide">
              {scene.name}
            </span>
          </div>
        </div>
      )}

      {!collapsed && (
        <>
          {/* Metadata */}
          <div className="flex flex-col gap-1.5">
            <MetaRow
              label="Acquired"
              value={`${scene.acquisitionDate} ${scene.acquisitionTime} UTC`}
              accent
            />
            <MetaRow label="Sensor" value={scene.sensor} />
            <MetaRow label="Platform" value={scene.platform.split(' ')[0]} />
            <MetaRow label="Resolution" value={`${scene.resolution} m / px`} />
            <div className="flex items-center justify-between gap-2">
              <Label>Coordinates</Label>
              <div className="text-right">
                <div className="text-[10px] font-mono text-[#d4d8da]">
                  {scene.coordinates.lat.toFixed(4)}° N
                </div>
                <div className="text-[10px] font-mono text-[#d4d8da]">
                  {scene.coordinates.lng.toFixed(4)}° E
                </div>
              </div>
            </div>
          </div>

          {/* Cloud cover */}
          <div className="mt-2.5">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1">
                <CloudSun size={9} strokeWidth={1.5} className="text-[#6A9971]" />
                <Label>Cloud Cover</Label>
              </div>
              <span className="text-[9px] font-mono text-[#6A9971]">{scene.cloudCover}%</span>
            </div>
            <div className="h-0.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#6A9971] progress-bar"
                style={{ width: `${scene.cloudCover}%` }}
              />
            </div>
            <div className="mt-1 text-[8px] text-[#8a9092]/60">Optimal acquisition quality</div>
          </div>

          <PanelDivider />

          {/* Upload section */}
          <div>
            <PanelHeader>Upload Imagery</PanelHeader>
            <div
              className={`upload-zone rounded-sm p-3 cursor-pointer text-center ${dragging ? 'dragging' : ''}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".tif,.tiff,.jpg,.jpeg,.png"
                onChange={handleFileChange}
              />

              {uploadedName ? (
                <div className="flex flex-col items-center gap-1">
                  <CheckCircle2 size={12} className="text-[#6A9971]" strokeWidth={1.5} />
                  <div
                    className="text-[9px] font-mono text-[#6A9971] truncate max-w-full"
                    title={uploadedName}
                  >
                    {uploadedName.length > 22 ? uploadedName.slice(0, 20) + '…' : uploadedName}
                  </div>
                  <div className="text-[8px] text-[#8a9092]/60">Click to replace</div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5">
                  <Upload size={11} strokeWidth={1.5} className="text-[#C29B53]" />
                  <div className="text-[9px] text-[#8a9092]">
                    Drop file or click to browse
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap justify-center">
                    {['GeoTIFF', 'TIFF', 'JPG', 'PNG'].map((fmt) => (
                      <span
                        key={fmt}
                        className="text-[7.5px] font-mono tracking-wide"
                        style={{ color: '#C29B53', opacity: 0.8 }}
                      >
                        {fmt}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </Panel>
  );
}
