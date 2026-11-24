import React, { useRef, useState } from 'react';
import { Home, Library, Search, Play, Pause, Rewind, FastForward } from 'lucide-react';
import { Tab } from '../model/types';
import { placeholderStory } from '../model/mockData';
import { usePlayer } from '../state/usePlayerStore';
import { CoverArt } from './CoverArt';

export const FloatingDock: React.FC = () => {
  const {
    ui,
    scheme,
    setTab,
    openPlayer,
    togglePlay,
    prevChapter,
    nextChapter,
    hideMiniPlayer,
    triggerHaptic,
  } = usePlayer();

  const active = ui.activeStory;
  const hasMini =
    Boolean(active) &&
    active!.id !== placeholderStory.id &&
    ui.hiddenMiniPlayerStoryId !== active!.id;
  const settingsOpen = ui.currentTab === Tab.SETTINGS;

  const mainTabs: { tab: Tab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { tab: Tab.HOME, label: 'Trang chủ', icon: Home },
    { tab: Tab.LIBRARY, label: 'Thư viện', icon: Library },
    { tab: Tab.SEARCH, label: 'Tìm kiếm', icon: Search },
  ];

  const selectedIndex = mainTabs.findIndex((t) => t.tab === ui.currentTab);
  const prevIndexRef = useRef(selectedIndex >= 0 ? selectedIndex : 0);
  const moveDirRef = useRef(0);
  if (selectedIndex >= 0 && selectedIndex !== prevIndexRef.current) {
    moveDirRef.current = selectedIndex - prevIndexRef.current;
    prevIndexRef.current = selectedIndex;
  }

  // Mini-player swipe gesture state (up -> open player, down -> dismiss, left/right -> chapter)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const didDragRef = useRef(false);

  if (ui.isPlayerOpen || settingsOpen) return null;

  const bigCorner = hasMini ? 34 : 30;
  const linkCorner = hasMini ? 16 : bigCorner;

  const progress = Math.min(1, Math.max(0, ui.progress));
  const ringRadius = 26;
  const circumference = 2 * Math.PI * ringRadius;
  const dashOffset = circumference * (1 - progress);

  // Asymmetric WaterDrop edge timings: leading edge springs fast, trailing edge stretches & catches up
  const movingRight = moveDirRef.current > 0;
  const leftDur = movingRight ? '360ms' : '190ms';
  const rightDur = movingRight ? '190ms' : '360ms';

  const finishMiniDrag = (x: number, y: number, dt: number) => {
    const quick = dt < 280;
    if (y < -28 || (quick && y < -16)) {
      if (active) openPlayer(active);
    } else if (y > 38 || (quick && y > 22)) {
      hideMiniPlayer();
    } else if ((x > 42 || (quick && x > 24)) && ui.playback.hasPrevious) {
      prevChapter();
    } else if ((x < -42 || (quick && x < -24)) && ui.playback.hasNext) {
      nextChapter();
    }
  };

  return (
    <div
      className="pointer-events-none fixed bottom-0 left-0 right-0 z-30 flex flex-col items-center"
      style={{ paddingBottom: 'max(0.5rem, var(--safe-bottom, env(safe-area-inset-bottom)))' }}
    >
      <div className="w-[86%] max-w-[420px] flex flex-col items-center">
        {hasMini && active && (
          <div
            className={`pointer-events-auto w-full mb-1.5 touch-none select-none animate-mini-in ${
              isDragging ? '' : 'transition-[transform,opacity,border-radius] duration-250 ease-out'
            }`}
            style={{
              backgroundColor: scheme.surfaceContainerHigh,
              borderTopLeftRadius: bigCorner,
              borderTopRightRadius: bigCorner,
              borderBottomLeftRadius: linkCorner,
              borderBottomRightRadius: linkCorner,
              transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)`,
              opacity: Math.max(0.25, 1 - Math.max(0, dragOffset.y) / 110),
            }}
            onPointerDown={(e) => {
              if ((e.target as HTMLElement).closest('button')) return;
              didDragRef.current = false;
              dragStartRef.current = { x: e.clientX, y: e.clientY, time: performance.now() };
              try {
                e.currentTarget.setPointerCapture(e.pointerId);
              } catch {
                // ignore
              }
            }}
            onPointerMove={(e) => {
              if (!dragStartRef.current) return;
              const dx = e.clientX - dragStartRef.current.x;
              const dy = e.clientY - dragStartRef.current.y;
              if (Math.abs(dx) > 7 || Math.abs(dy) > 7) {
                didDragRef.current = true;
                setIsDragging(true);
              }
              if (!didDragRef.current) return;
              if (Math.abs(dy) > Math.abs(dx)) {
                setDragOffset({ x: 0, y: Math.max(-64, Math.min(84, dy)) });
              } else {
                setDragOffset({ x: Math.max(-84, Math.min(84, dx)), y: 0 });
              }
            }}
            onPointerUp={(e) => {
              if (!dragStartRef.current) return;
              const dt = performance.now() - dragStartRef.current.time;
              const dx = e.clientX - dragStartRef.current.x;
              const dy = e.clientY - dragStartRef.current.y;
              const x = Math.abs(dy) > Math.abs(dx) ? 0 : dx;
              const y = Math.abs(dy) > Math.abs(dx) ? dy : 0;
              dragStartRef.current = null;
              setIsDragging(false);
              setDragOffset({ x: 0, y: 0 });
              try {
                if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                  e.currentTarget.releasePointerCapture(e.pointerId);
                }
              } catch {
                // ignore
              }
              if (didDragRef.current) {
                finishMiniDrag(x, y, dt);
              }
            }}
            onPointerCancel={(e) => {
              dragStartRef.current = null;
              didDragRef.current = false;
              setIsDragging(false);
              setDragOffset({ x: 0, y: 0 });
              try {
                if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                  e.currentTarget.releasePointerCapture(e.pointerId);
                }
              } catch {
                // ignore
              }
            }}
          >
            <div
              onClick={() => {
                if (didDragRef.current) {
                  didDragRef.current = false;
                  return;
                }
                openPlayer(active);
              }}
              className="flex items-center px-2.5 py-2.5 cursor-pointer active:opacity-90"
            >
              {/* Circular Cover + Progress Ring */}
              <div className="relative w-[60px] h-[60px] flex items-center justify-center shrink-0">
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 60 60">
                  <circle
                    cx="30"
                    cy="30"
                    r={ringRadius}
                    fill="none"
                    stroke={scheme.surfaceVariant}
                    strokeWidth="4"
                  />
                  {progress > 0 && (
                    <circle
                      cx="30"
                      cy="30"
                      r={ringRadius}
                      fill="none"
                      stroke={scheme.primary}
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={dashOffset}
                    />
                  )}
                </svg>
                <CoverArt
                  colorHex={active.color}
                  imageUrl={active.coverUrl}
                  fallbackKey={active.id}
                  className="w-[50px] h-[50px] rounded-full"
                />
              </div>

              {/* Story & Chapter Titles */}
              <div className="flex-1 min-w-0 px-2.5">
                <div className="text-[15px] font-medium truncate" style={{ color: scheme.onSurface }}>
                  {active.title}
                </div>
                <div className="text-xs truncate mt-0.5" style={{ color: scheme.onSurfaceVariant }}>
                  {ui.chapterTitle ||
                    `Chương ${ui.chapterNumber}${active.totalChapters > 0 ? `/${active.totalChapters}` : ''}`}
                </div>
              </div>

              {/* Mini Controls */}
              <button
                type="button"
                aria-label="Chương trước"
                disabled={!ui.playback.hasPrevious}
                onClick={(e) => {
                  e.stopPropagation();
                  prevChapter();
                }}
                className="w-10 h-10 flex items-center justify-center rounded-full disabled:opacity-35 transition active:scale-90 cursor-pointer"
                style={{ color: scheme.onSurface }}
              >
                <Rewind className="w-6 h-6 fill-current" />
              </button>

              <button
                type="button"
                aria-label={ui.isPlaying ? 'Tạm dừng' : 'Phát'}
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlay();
                }}
                className="w-[52px] h-[52px] mx-1 rounded-full flex items-center justify-center transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-90 cursor-pointer"
                style={{ backgroundColor: scheme.primary, color: scheme.onPrimary }}
              >
                {ui.isPlaying ? (
                  <Pause className="w-6 h-6 fill-current" />
                ) : (
                  <Play className="w-6 h-6 fill-current ml-0.5" />
                )}
              </button>

              <button
                type="button"
                aria-label="Chương sau"
                disabled={!ui.playback.hasNext}
                onClick={(e) => {
                  e.stopPropagation();
                  nextChapter();
                }}
                className="w-10 h-10 flex items-center justify-center rounded-full disabled:opacity-35 transition active:scale-90 cursor-pointer"
                style={{ color: scheme.onSurface }}
              >
                <FastForward className="w-6 h-6 fill-current" />
              </button>
            </div>
          </div>
        )}

        {/* WaterDropTabBar Navigation Dock */}
        <nav
          aria-label="Điều hướng chính"
          className="pointer-events-auto w-full px-1.5 py-1.5 transition-[border-radius,background-color] duration-300 ease-[cubic-bezier(0.2,0,0,1)]"
            style={{
              backgroundColor: scheme.surfaceContainer,
              borderTopLeftRadius: hasMini ? linkCorner : bigCorner,
              borderTopRightRadius: hasMini ? linkCorner : bigCorner,
              borderBottomLeftRadius: bigCorner,
              borderBottomRightRadius: bigCorner,
            }}
          >
            <div className="relative grid grid-cols-3 items-center">
              {/* Liquid Water-Drop Blob Indicator */}
              {selectedIndex >= 0 && (
                <div
                  className="absolute top-[2px] h-[34px] rounded-full pointer-events-none"
                  style={{
                    backgroundColor: scheme.primaryContainer,
                    left: `calc(${(selectedIndex + 0.5) * (100 / 3)}% - 29px)`,
                    right: `calc(${(2.5 - selectedIndex) * (100 / 3)}% - 29px)`,
                    transitionProperty: 'left, right',
                    transitionDuration: `${leftDur}, ${rightDur}`,
                    transitionTimingFunction: 'cubic-bezier(0.22, 1.18, 0.36, 1)',
                  }}
                />
              )}

              {mainTabs.map(({ tab, label, icon: Icon }) => {
                const selected = ui.currentTab === tab;
                const fg = selected ? scheme.onPrimaryContainer : scheme.onSurfaceVariant;
                return (
                  <button
                    key={tab}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => {
                      triggerHaptic('tick');
                      setTab(tab);
                    }}
                    className="relative z-10 flex flex-col items-center justify-center py-0.5 cursor-pointer select-none active:scale-95 transition-transform duration-150"
                  >
                    <div className="w-[58px] h-[34px] rounded-full flex items-center justify-center" style={{ color: fg }}>
                      <Icon
                        className={`w-[22px] h-[22px] transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                          selected ? 'scale-110' : 'scale-100'
                        }`}
                      />
                    </div>
                    <span
                      className="text-[12px] font-medium leading-tight mt-0.5 truncate max-w-full transition-colors duration-200"
                      style={{ color: selected ? scheme.primary : fg }}
                    >
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </nav>
      </div>
    </div>
  );
};
