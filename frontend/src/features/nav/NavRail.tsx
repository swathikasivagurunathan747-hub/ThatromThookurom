import type React from 'react';
import {
  LayoutDashboard,
  ScanSearch,
  GitCompare,
  Database,
  History,
  Settings,
  Plus,
} from 'lucide-react';

export type NavItem = 'dashboard' | 'analyze' | 'compare' | 'datasets' | 'history' | 'settings';

interface NavRailProps {
  active?: NavItem;
  onChange: (item: NavItem) => void;
  onDashboard?: () => void;
  onNewChat?: () => void;
  isDashboardActive?: boolean;
}

type IconComponent = React.FC<{ size?: number; strokeWidth?: number }>;

const NAV_ITEMS: { id: NavItem; icon: IconComponent; label: string }[] = [
  { id: 'analyze', icon: ScanSearch as IconComponent, label: 'Analyze' },
  { id: 'compare', icon: GitCompare as IconComponent, label: 'Bi-Temporal' },
  { id: 'datasets', icon: Database as IconComponent, label: 'Datasets' },
  { id: 'history', icon: History as IconComponent, label: 'History' },
  { id: 'settings', icon: Settings as IconComponent, label: 'Settings' },
];

export function NavRail({
  active,
  onChange,
  onDashboard,
  onNewChat,
  isDashboardActive,
}: NavRailProps) {
  const handleDashboardClick = onDashboard || onNewChat;

  return (
    <nav
      className="flex flex-col items-center pt-3 pb-4 gap-1.5 shrink-0 select-none relative"
      style={{
        width: '56px',
        background: 'rgba(6, 8, 10, 0.98)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        zIndex: 40,
      }}
    >
      {/* Side Primary Action: Dashboard */}
      {handleDashboardClick && (
        <div className="w-full flex justify-center pb-2.5 mb-1.5 border-b border-white/10">
          <button
            type="button"
            title="Dashboard"
            onClick={handleDashboardClick}
            className={`w-10 h-10 flex items-center justify-center rounded-xl bg-[#C29B53] hover:bg-[#CCA563] text-black shadow-[0_2px_8px_rgba(0,0,0,0.3)] transition-all group relative cursor-pointer active:scale-95 ${
              isDashboardActive ? 'ring-1 ring-white/20 shadow-[0_0_8px_rgba(194, 155, 83,0.25)]' : ''
            }`}
          >
            <LayoutDashboard size={18} strokeWidth={2.2} />
            {/* Tooltip */}
            <div className="absolute left-[calc(100%+12px)] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50">
              <div
                className="text-[11px] font-mono tracking-[0.14em] uppercase font-bold text-white px-3 py-1.5 rounded-lg"
                style={{
                  background: 'rgba(0,0,0,0.95)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.85)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                Dashboard
              </div>
            </div>
          </button>
        </div>
      )}
      {NAV_ITEMS.map(({ id, icon: Icon, label }) => {
        const isActive = active === id;
        return (
          <div key={id} className="relative w-full flex justify-center">
            {/* Active left indicator */}
            {isActive && (
              <div
                className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r-full bg-[#C29B53] shadow-[0_0_12px_#C29B53]"
                style={{ height: '24px', width: '3px' }}
              />
            )}
            <button
              title={label}
              onClick={() => onChange(id)}
              className={`
                w-10 h-10 flex items-center justify-center rounded-xl
                transition-all duration-150 group relative cursor-pointer
                ${
                  isActive
                    ? 'bg-[#C29B53]/15 text-[#C29B53] border border-[#C29B53]/30 shadow-[0_0_15px_rgba(194, 155, 83,0.25)]'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.08] border border-transparent'
                }
              `}
            >
              <Icon size={19} strokeWidth={isActive ? 2 : 1.75} />

              {/* Tooltip */}
              <div
                className="absolute left-[calc(100%+12px)] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50"
              >
                <div
                  className="text-[11px] font-mono tracking-[0.14em] uppercase font-bold text-white px-3 py-1.5 rounded-lg"
                  style={{
                    background: 'rgba(0,0,0,0.92)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.8)',
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  {label}
                </div>
              </div>
            </button>
          </div>
        );
      })}

      {/* Bottom ISRO Clearance Watermark */}
      <div className="mt-auto pt-4 flex flex-col items-center gap-2">
        <div
          title="ISRO Level-3 Clearance"
          className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center text-[10px] font-mono font-bold text-[#C29B53]"
        >
          EO
        </div>
      </div>
    </nav>
  );
}
