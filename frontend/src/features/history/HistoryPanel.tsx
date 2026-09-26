import { ScanSearch, GitCompare, Upload, Search } from 'lucide-react';
import { Panel, PanelHeader } from '../../components/ui/Panel';
import { Label } from '../../components/ui/Label';
import type { HistoryEntry } from '../../types';

interface HistoryPanelProps {
  entries: HistoryEntry[];
  onSelect?: (entry: HistoryEntry) => void;
}

type IconComp = React.FC<{ size?: number; strokeWidth?: number; className?: string }>;
const ENTRY_ICONS: Record<HistoryEntry['type'], IconComp> = {
  analysis: ScanSearch as IconComp,
  change_detection: GitCompare as IconComp,
  upload: Upload as IconComp,
  query: Search as IconComp,
};

const ENTRY_COLORS: Record<HistoryEntry['type'], string> = {
  analysis: '#C29B53',
  change_detection: '#B83D28',
  upload: '#6A9971',
  query: '#8a9092',
};

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function HistoryPanel({ entries, onSelect }: HistoryPanelProps) {
  return (
    <Panel className="w-[260px]">
      <PanelHeader action={
        <span className="text-[8px] font-mono text-[#8a9092]">{entries.length} entries</span>
      }>
        History
      </PanelHeader>

      <div className="flex flex-col gap-0.5 max-h-[400px] overflow-y-auto">
        {entries.map((entry, i) => {
          const Icon = ENTRY_ICONS[entry.type];
          const color = ENTRY_COLORS[entry.type];
          return (
            <button
              key={entry.id}
              onClick={() => onSelect?.(entry)}
              className="flex items-start gap-2 px-1.5 py-2 rounded-sm hover:bg-white/[0.04] transition-colors w-full text-left group"
            >
              {/* Timeline line */}
              <div className="flex flex-col items-center shrink-0 pt-0.5">
                <div
                  className="w-5 h-5 rounded-sm flex items-center justify-center"
                  style={{ background: `${color}18`, border: `1px solid ${color}40` }}
                >
                  <span style={{ color }}>
                    <Icon size={9} strokeWidth={1.5} />
                  </span>
                </div>
                {i < entries.length - 1 && (
                  <div className="w-px flex-1 mt-1" style={{ background: 'rgba(255,255,255,0.05)', minHeight: '12px' }} />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pb-1">
                <div className="text-[10px] text-[#ededed] leading-tight truncate">{entry.label}</div>
                {entry.summary && (
                  <div className="text-[8.5px] text-[#8a9092] mt-0.5 truncate">{entry.summary}</div>
                )}
                <div className="mt-0.5">
                  <Label>{formatRelativeTime(entry.timestamp)}</Label>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}
