import React, { useEffect, useState } from 'react';
import { usePlayer } from '../state/usePlayerStore';

const SCREEN_W = 404;
const SCREEN_H = 892; // 6.59" (~19.9:9 / 20:9) logical viewport
const BEZEL = 11;
const FRAME_W = SCREEN_W + BEZEL * 2; // 426
const FRAME_H = SCREEN_H + BEZEL * 2; // 914

function formatClock(date: Date): string {
  const h = date.getHours();
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export const PhoneFrame: React.FC<{
  children: React.ReactNode;
  screenRef?: React.RefObject<HTMLDivElement | null>;
}> = ({ children, screenRef }) => {
  const { scheme } = usePlayer();
  const [viewport, setViewport] = useState(() =>
    typeof window === 'undefined'
      ? { w: 1280, h: 960, coarse: false }
      : {
          w: window.innerWidth,
          h: window.innerHeight,
          coarse: window.matchMedia('(pointer: coarse)').matches,
        },
  );
  const [clock, setClock] = useState(() => formatClock(new Date()));

  useEffect(() => {
    const update = () => {
      setViewport({
        w: window.innerWidth,
        h: window.innerHeight,
        coarse: window.matchMedia('(pointer: coarse)').matches,
      });
    };
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setClock(formatClock(new Date())), 15000);
    return () => window.clearInterval(id);
  }, []);

  const isRealMobilePhone = viewport.coarse && viewport.w <= 480;

  if (isRealMobilePhone) {
    return (
      <div
        ref={screenRef}
        className="h-[100dvh] w-full flex justify-center relative overflow-hidden"
        style={
          {
            backgroundColor: scheme.surface,
            color: scheme.onSurface,
            '--safe-top': 'env(safe-area-inset-top, 0px)',
            '--safe-bottom': 'env(safe-area-inset-bottom, 0px)',
          } as React.CSSProperties
        }
      >
        <div className="w-full max-w-[480px] h-full relative flex flex-col overflow-hidden">
          {children}
          <div id="phone-viewport-portal" />
        </div>
      </div>
    );
  }

  const padX = 24;
  const padY = 24;
  const scale = Math.min(1, (viewport.w - padX) / FRAME_W, (viewport.h - padY) / FRAME_H);
  const statusFg = scheme.isDark ? '#F2F3F7' : '#14161A';

  return (
    <div
      className="h-[100dvh] w-full flex items-center justify-center relative overflow-hidden select-none"
      style={{
        background: scheme.isDark
          ? `radial-gradient(circle at 50% 25%, ${scheme.primaryContainer}36 0%, #0b0d11 65%, #060709 100%)`
          : `radial-gradient(circle at 50% 25%, ${scheme.primaryContainer}55 0%, ${scheme.surfaceContainerLow} 65%, ${scheme.surfaceContainer} 100%)`,
      }}
    >
      {/* Scaled 6.59" Smartphone Chassis */}
      <div
        className="relative shrink-0"
        style={{
          width: FRAME_W,
          height: FRAME_H,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        {/* Left Alert Slider */}
        <div
          className="absolute -left-[2.5px] top-[146px] w-[3px] h-[28px] rounded-l-sm"
          style={{ background: 'linear-gradient(180deg, #525660, #2c2e35)' }}
        />

        {/* Right Volume Rocker & Power Button */}
        <div
          className="absolute -right-[2.5px] top-[168px] w-[3px] h-[78px] rounded-r-sm"
          style={{ background: 'linear-gradient(180deg, #525660, #2c2e35)' }}
        />
        <div
          className="absolute -right-[2.5px] top-[272px] w-[3px] h-[46px] rounded-r-sm"
          style={{ background: 'linear-gradient(180deg, #525660, #2c2e35)' }}
        />

        {/* Metallic Outer Frame */}
        <div
          className="w-full h-full rounded-[51px] relative"
          style={{
            padding: BEZEL,
            background: 'linear-gradient(145deg, #3b3e47 0%, #181a1f 42%, #111216 70%, #2d3038 100%)',
            boxShadow: scheme.isDark
              ? '0 32px 90px -18px rgba(0, 0, 0, 0.85), inset 0 0 0 1px rgba(255, 255, 255, 0.14)'
              : '0 32px 84px -18px rgba(15, 23, 42, 0.36), inset 0 0 0 1px rgba(255, 255, 255, 0.22)',
          }}
        >
          {/* Inner Black Bezel Rim */}
          <div className="w-full h-full rounded-[41px] bg-[#060709] p-[1.5px] relative">
            {/* Top Earpiece Micro-Slit */}
            <div className="absolute top-[2px] left-1/2 -translate-x-1/2 w-14 h-[2.5px] rounded-full bg-white/10 z-[95] pointer-events-none" />

            {/* 6.59" Active AMOLED Screen */}
            <div
              ref={screenRef}
              id="phone-screen"
              className="w-full h-full rounded-[40px] relative flex flex-col overflow-hidden [transform:translateZ(0)] select-auto"
              style={
                {
                  backgroundColor: scheme.surface,
                  color: scheme.onSurface,
                  '--safe-top': '38px',
                  '--safe-bottom': '18px',
                } as React.CSSProperties
              }
            >
              {/* Android Status Bar + Punch-Hole Camera */}
              <div
                className="pointer-events-none absolute top-0 left-0 right-0 h-[38px] px-6 flex items-center justify-between z-[90]"
                style={{ color: statusFg }}
              >
                <span className="text-[13px] font-semibold tracking-tight leading-none">{clock}</span>

                {/* Centered Punch-Hole Front Camera */}
                <div className="absolute left-1/2 top-[11px] -translate-x-1/2 w-[13px] h-[13px] rounded-full bg-[#090a0d] ring-1 ring-white/10 flex items-center justify-center">
                  <div className="w-[5px] h-[5px] rounded-full bg-[#1a2438]/70 translate-x-[1px] -translate-y-[1px]" />
                </div>

                {/* Right Status Icons: 5G + Signal + Wi-Fi + Battery */}
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="text-[10px] font-bold tracking-tighter">5G</span>
                  <svg className="w-3.5 h-3" viewBox="0 0 16 12" fill="currentColor" aria-hidden="true">
                    <rect x="1" y="8.5" width="2.2" height="3" rx="0.6" />
                    <rect x="4.8" y="6.2" width="2.2" height="5.3" rx="0.6" />
                    <rect x="8.6" y="3.8" width="2.2" height="7.7" rx="0.6" />
                    <rect x="12.4" y="1.2" width="2.2" height="10.3" rx="0.6" />
                  </svg>
                  <svg className="w-3.5 h-3" viewBox="0 0 16 12" fill="none" stroke="currentColor" aria-hidden="true">
                    <path d="M1.8 4.2a9.8 9.8 0 0 1 12.4 0" strokeWidth="1.6" strokeLinecap="round" />
                    <path d="M4.3 6.9a6.2 6.2 0 0 1 7.4 0" strokeWidth="1.6" strokeLinecap="round" />
                    <circle cx="8" cy="10" r="1.2" fill="currentColor" stroke="none" />
                  </svg>
                  <div className="flex items-center gap-1">
                    <div
                      className="w-[21px] h-[11px] rounded-[3.5px] border-[1.4px] p-[1.5px] flex items-center relative"
                      style={{ borderColor: statusFg }}
                    >
                      <div className="h-full w-[88%] rounded-[1.5px]" style={{ backgroundColor: statusFg }} />
                      <div
                        className="absolute -right-[2.8px] top-1/2 -translate-y-1/2 w-[1.6px] h-[4.5px] rounded-r-full"
                        style={{ backgroundColor: statusFg }}
                      />
                    </div>
                    <span className="text-[10.5px] font-semibold">90%</span>
                  </div>
                </div>
              </div>

              {/* App Content */}
              {children}

              {/* Portal Target for Bottom Sheets inside Phone Screen */}
              <div id="phone-viewport-portal" />

              {/* Android Bottom Gesture Bar */}
              <div
                className="pointer-events-none absolute bottom-0 left-0 right-0 h-[18px] flex items-center justify-center z-[90]"
                style={{ color: statusFg }}
              >
                <div className="w-[116px] h-[4px] rounded-full bg-current opacity-35" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
