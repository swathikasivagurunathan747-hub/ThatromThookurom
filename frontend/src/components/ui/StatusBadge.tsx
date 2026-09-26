type Status = 'online' | 'offline' | 'processing' | 'degraded' | 'ready' | 'archived' | 'connecting';

const STATUS_CONFIG: Record<Status, { color: string; label: string; dot: string }> = {
  online: { color: 'text-[#6A9971]', label: 'SYSTEM ONLINE', dot: 'bg-[#6A9971]' },
  offline: { color: 'text-[#B83D28]', label: 'SYSTEM OFFLINE', dot: 'bg-[#B83D28]' },
  connecting: { color: 'text-[#C29B53]', label: 'CONNECTING...', dot: 'bg-[#C29B53]' },
  processing: { color: 'text-[#C29B53]', label: 'PROCESSING', dot: 'bg-[#C29B53]' },
  degraded: { color: 'text-orange-400', label: 'DEGRADED', dot: 'bg-orange-400' },
  ready: { color: 'text-[#6A9971]', label: 'READY', dot: 'bg-[#6A9971]' },
  archived: { color: 'text-[#8a9092]', label: 'ARCHIVED', dot: 'bg-[#8a9092]' },
};

interface StatusBadgeProps {
  status: Status;
  customLabel?: string;
  showDot?: boolean;
}

export function StatusBadge({ status, customLabel, showDot = true }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[9px] tracking-[0.1em] font-medium uppercase ${cfg.color}`}>
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} animate-pulse`} />
      )}
      {customLabel ?? cfg.label}
    </span>
  );
}
