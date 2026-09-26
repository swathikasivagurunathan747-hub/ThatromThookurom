import React from 'react';

export function AerospaceBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
      {/* 1. Cinematic SpaceX Earth Orbit Photography */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-75 transition-opacity duration-1000"
        style={{
          backgroundImage: `url('/spacex_earth_cinematic.jpg')`,
        }}
      />

      {/* 2. Deep Atmospheric Glow & Radial Contrast Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 72% 32%, rgba(194, 155, 83, 0.22) 0%, transparent 55%), radial-gradient(circle at 20% 80%, rgba(30, 80, 120, 0.15) 0%, transparent 45%), radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.65) 60%, rgba(0,0,0,0.92) 100%), linear-gradient(180deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.15) 45%, rgba(0,0,0,0.85) 100%)',
        }}
      />

      {/* 3. Deep Cosmic Starfield (Twinkling Points of Light) */}
      <div className="absolute inset-0">
        <span className="absolute top-[12%] left-[18%] w-1 h-1 rounded-full bg-white shadow-[0_0_6px_#fff] animate-twinkle-1" />
        <span className="absolute top-[8%] left-[45%] w-1.5 h-1.5 rounded-full bg-[#C29B53] shadow-[0_0_8px_#C29B53] animate-twinkle-2" />
        <span className="absolute top-[22%] left-[82%] w-1 h-1 rounded-full bg-white shadow-[0_0_6px_#fff] animate-twinkle-3" />
        <span className="absolute top-[48%] left-[9%] w-1 h-1 rounded-full bg-white/80 animate-twinkle-1" />
        <span className="absolute top-[75%] left-[25%] w-1.5 h-1.5 rounded-full bg-[#C29B53] shadow-[0_0_8px_#C29B53] animate-twinkle-2" />
        <span className="absolute top-[85%] left-[78%] w-1 h-1 rounded-full bg-white shadow-[0_0_6px_#fff] animate-twinkle-3" />
        <span className="absolute top-[35%] left-[92%] w-1 h-1 rounded-full bg-white/70 animate-twinkle-1" />
      </div>

      {/* 4. Animated Orbital Telemetry System */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Slow Rotating Primary Orbital Ring */}
        <div className="w-[850px] h-[850px] rounded-full border border-[#C29B53]/15 animate-orbit-slow absolute">
          <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[#C29B53] shadow-[0_0_12px_#C29B53] animate-pulse" />
          <span className="absolute top-1/2 -right-1.5 -translate-y-1/2 text-[8px] font-mono text-[#C29B53]/40 tracking-widest">
            090°
          </span>
          <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 text-[8px] font-mono text-[#C29B53]/40 tracking-widest">
            180°
          </span>
          <span className="absolute top-1/2 -left-1.5 -translate-y-1/2 text-[8px] font-mono text-[#C29B53]/40 tracking-widest">
            270°
          </span>
        </div>

        {/* Counter-Rotating Secondary Ring */}
        <div className="w-[1100px] h-[1100px] rounded-full border border-dashed border-white/10 animate-orbit-reverse absolute">
          <span className="absolute top-[15%] left-[85%] w-2 h-2 rounded-full bg-white/80 shadow-[0_0_8px_#fff]" />
        </div>

        {/* Outer Orbital Grid Ring */}
        <div className="w-[1400px] h-[1400px] rounded-full border border-white/5 absolute" />

        {/* Dynamic Radar Sweep Arm */}
        <div className="w-[850px] h-[850px] absolute animate-radar-sweep">
          <div
            className="w-1/2 h-full absolute right-0 top-0 origin-left"
            style={{
              background:
                'conic-gradient(from 0deg at 0% 50%, rgba(194, 155, 83, 0.18) 0deg, transparent 40deg)',
            }}
          />
        </div>
      </div>

      {/* 5. Dynamic Satellite Constellation Pass Trajectories */}
      <svg className="absolute inset-0 w-full h-full opacity-35">
        {/* Polar Orbit Trajectory */}
        <path
          d="M 200,0 Q 400,450 700,900"
          stroke="#C29B53"
          strokeWidth="0.75"
          strokeDasharray="6 8"
        />

        {/* Equatorial Scan Trajectory */}
        <path
          d="M 0,550 Q 800,250 1600,650"
          stroke="#ffffff"
          strokeWidth="0.5"
          strokeDasharray="4 12"
        />
      </svg>

      {/* Floating Constellation Beacon Pills */}
      <div className="absolute top-[18%] left-[40px] hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 border border-[#C29B53]/30 backdrop-blur-md">
        <span className="w-1.5 h-1.5 rounded-full bg-[#C29B53] animate-ping" />
        <span className="text-[9px] font-mono tracking-widest uppercase text-[#C29B53] font-semibold">
          SENTINEL-2A · SUN-SYNC 786 KM
        </span>
      </div>

      <div className="absolute bottom-[16%] right-[6%] hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 border border-white/20 backdrop-blur-md">
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        <span className="text-[9px] font-mono tracking-widest uppercase text-zinc-300 font-semibold">
          RISAT-1A · C-BAND SAR 536 KM
        </span>
      </div>

      {/* 6. Precision Corner Aerospace Coordinate Reticles */}
      <div className="absolute top-4 left-4 text-[9px] font-mono text-zinc-500 tracking-widest hidden md:block">
        <div>[ ORB_SYS // LIVE_TELEM ]</div>
        <div className="text-[#C29B53]/60">13.0827°N 80.2707°E</div>
      </div>

      <div className="absolute top-4 right-4 text-[9px] font-mono text-zinc-500 tracking-widest text-right hidden md:block">
        <div>EO_AI_SURVEILLANCE</div>
        <div className="text-[#C29B53]/60">VLM_ACTIVE // 24-BND</div>
      </div>
    </div>
  );
}
