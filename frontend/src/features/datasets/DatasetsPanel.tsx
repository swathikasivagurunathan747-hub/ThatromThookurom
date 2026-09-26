import { Database, ChevronRight } from 'lucide-react';
import { Panel, PanelHeader } from '../../components/ui/Panel';

import { StatusBadge } from '../../components/ui/StatusBadge';
import type { Dataset } from '../../types';

interface DatasetsPanelProps {
  datasets: Dataset[];
  onSelect?: (dataset: Dataset) => void;
}

export function DatasetsPanel({ datasets, onSelect }: DatasetsPanelProps) {
  return (
    <Panel className="w-[260px]">
      <PanelHeader action={
        <span className="text-[8px] font-mono text-[#8a9092]">{datasets.length} datasets</span>
      }>
        Datasets
      </PanelHeader>

      <div className="flex flex-col gap-1.5 max-h-[400px] overflow-y-auto">
        {datasets.map((ds) => (
          <button
            key={ds.id}
            onClick={() => onSelect?.(ds)}
            className="flex items-start gap-2 p-2 rounded-sm hover:bg-white/[0.04] transition-colors w-full text-left group"
            style={{ border: '1px solid rgba(255,255,255,0.05)', borderRadius: '2px' }}
          >
            {/* Thumbnail */}
            {ds.thumbnailUrl ? (
              <img
                src={ds.thumbnailUrl}
                alt={ds.name}
                className="w-10 h-7 object-cover rounded-sm shrink-0"
                style={{ filter: 'brightness(0.8) saturate(0.8)' }}
              />
            ) : (
              <div className="w-10 h-7 bg-white/[0.05] rounded-sm shrink-0 flex items-center justify-center">
                <Database size={12} className="text-[#8a9092]" />
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-1">
                <span className="text-[10px] text-[#ededed] font-medium leading-tight truncate">
                  {ds.name}
                </span>
                <ChevronRight
                  size={10}
                  className="text-[#8a9092] group-hover:text-[#C29B53] transition-colors shrink-0 mt-0.5"
                />
              </div>
              <div className="text-[8.5px] text-[#8a9092] mt-0.5 truncate">{ds.region}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[8px] font-mono text-[#8a9092]">{ds.sceneCount} scenes</span>
                <span className="text-[8px] font-mono text-[#8a9092]">·</span>
                <span className="text-[8px] font-mono text-[#8a9092]">
                  {ds.dateRange.from.slice(0, 7)} → {ds.dateRange.to.slice(0, 7)}
                </span>
              </div>
              <div className="mt-1">
                <StatusBadge
                  status={ds.status === 'available' ? 'online' : ds.status === 'processing' ? 'processing' : 'archived'}
                  customLabel={ds.status.toUpperCase()}
                  showDot={false}
                />
              </div>
            </div>
          </button>
        ))}
      </div>
    </Panel>
  );
}
