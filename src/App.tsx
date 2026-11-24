import React, { useEffect, useRef, useState } from 'react';
import { Tab } from './model/types';
import { PlayerProvider, usePlayer } from './state/usePlayerStore';
import { HomeScreen } from './screens/HomeScreen';
import { LibraryScreen } from './screens/LibraryScreen';
import { SearchScreen } from './screens/SearchScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { PlayerScreen } from './screens/PlayerScreen';
import { FloatingDock } from './components/FloatingDock';
import { PhoneFrame } from './components/PhoneFrame';
import {
  DeleteDialogModal,
  EpubImportModal,
  PasteSheetModal,
  PlayerSheetModal,
  SourceBrowserModal,
} from './components/Modals';

const MAIN_TABS = [Tab.HOME, Tab.LIBRARY, Tab.SEARCH] as const;

const NovelBookShell: React.FC = () => {
  const { ui, scheme, themeReveal, clearError, setTab, triggerHaptic, sourceBrowserOpen } = usePlayer();

  useEffect(() => {
    if (!ui.errorMessage) return;
    const id = window.setTimeout(clearError, 3600);
    return () => window.clearTimeout(id);
  }, [ui.errorMessage, clearError]);

  const settingsOpen = ui.currentTab === Tab.SETTINGS;
  const rawIdx = MAIN_TABS.indexOf(ui.currentTab as (typeof MAIN_TABS)[number]);
  const lastMainIdxRef = useRef(0);
  if (rawIdx >= 0) lastMainIdxRef.current = rawIdx;
  const activeTabIdx = rawIdx >= 0 ? rawIdx : lastMainIdxRef.current;

  const [swipeDx, setSwipeDx] = useState(0);
  const [swipingTabs, setSwipingTabs] = useState(false);
  const pagerTouchRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const pagerLockRef = useRef<'none' | 'horizontal' | 'vertical'>('none');
  const phoneScreenRef = useRef<HTMLDivElement | null>(null);

  const canSwipeTabs =
    !settingsOpen && !ui.isPlayerOpen && !ui.pasteOpen && !sourceBrowserOpen && !ui.storyToDelete;

  const revealPos = (() => {
    if (!themeReveal.active) return { x: '50%', y: '50%' };
    const rect = phoneScreenRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) {
      return { x: `${themeReveal.x}px`, y: `${themeReveal.y}px` };
    }
    const px = ((themeReveal.x - rect.left) / rect.width) * 100;
    const py = ((themeReveal.y - rect.top) / rect.height) * 100;
    return { x: `${px}%`, y: `${py}%` };
  })();

  return (
    <PhoneFrame screenRef={phoneScreenRef}>
      {/* Main Mobile-First Viewport */}
      <div
        className="w-full h-full relative flex flex-col overflow-hidden"
        style={{
          backgroundColor: scheme.surface,
          paddingTop: 'var(--safe-top, env(safe-area-inset-top))',
        }}
      >
        {/* Main Pager Tabs with Horizontal Touch Swipe */}
        <div
          className="flex-1 h-full overflow-hidden relative"
          onTouchStart={(e) => {
            if (!canSwipeTabs || e.touches.length !== 1) return;
            const target = e.target as HTMLElement | null;
            if (target?.closest('[data-no-tab-swipe], input, textarea, select, [role="slider"]')) return;
            pagerTouchRef.current = {
              x: e.touches[0].clientX,
              y: e.touches[0].clientY,
              time: performance.now(),
            };
            pagerLockRef.current = 'none';
          }}
          onTouchMove={(e) => {
            const start = pagerTouchRef.current;
            if (!start || e.touches.length !== 1) return;
            const dx = e.touches[0].clientX - start.x;
            const dy = e.touches[0].clientY - start.y;

            if (pagerLockRef.current === 'none') {
              if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
              if (Math.abs(dx) > Math.abs(dy) * 1.35) {
                pagerLockRef.current = 'horizontal';
                setSwipingTabs(true);
              } else {
                pagerLockRef.current = 'vertical';
                pagerTouchRef.current = null;
                return;
              }
            }

            if (pagerLockRef.current === 'horizontal') {
              const atLeftEdge = activeTabIdx === 0 && dx > 0;
              const atRightEdge = activeTabIdx === MAIN_TABS.length - 1 && dx < 0;
              setSwipeDx(atLeftEdge || atRightEdge ? dx * 0.25 : dx);
            }
          }}
          onTouchEnd={() => {
            const start = pagerTouchRef.current;
            const locked = pagerLockRef.current;
            const dt = start ? performance.now() - start.time : 999;
            pagerTouchRef.current = null;
            pagerLockRef.current = 'none';
            setSwipingTabs(false);

            if (locked === 'horizontal') {
              const quick = dt < 260;
              if ((swipeDx < -64 || (quick && swipeDx < -32)) && activeTabIdx < MAIN_TABS.length - 1) {
                triggerHaptic('tick');
                setTab(MAIN_TABS[activeTabIdx + 1]);
              } else if ((swipeDx > 64 || (quick && swipeDx > 32)) && activeTabIdx > 0) {
                triggerHaptic('tick');
                setTab(MAIN_TABS[activeTabIdx - 1]);
              }
            }
            setSwipeDx(0);
          }}
          onTouchCancel={() => {
            pagerTouchRef.current = null;
            pagerLockRef.current = 'none';
            setSwipingTabs(false);
            setSwipeDx(0);
          }}
        >
          <div
            className={`flex h-full w-full ${
              swipingTabs ? '' : 'transition-transform duration-280 ease-[cubic-bezier(0.2,0,0,1)]'
            }`}
            style={{ transform: `translateX(calc(-${activeTabIdx * 100}% + ${swipeDx}px))` }}
          >
            <div className="w-full h-full shrink-0 overflow-hidden">
              <HomeScreen />
            </div>
            <div className="w-full h-full shrink-0 overflow-hidden relative">
              <LibraryScreen />
            </div>
            <div className="w-full h-full shrink-0 overflow-hidden">
              <SearchScreen />
            </div>
          </div>

          {/* Settings Overlay */}
          {settingsOpen && (
            <div
              className="absolute inset-0 z-20 animate-page-in"
              style={{ backgroundColor: scheme.surface }}
            >
              <SettingsScreen />
            </div>
          )}
        </div>

        {/* Snackbar */}
        {ui.errorMessage && (
          <div
            className="fixed left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-[420px]"
            style={{ top: 'calc(0.5rem + var(--safe-top, 0px))' }}
          >
            <div
              className="rounded-2xl px-4 py-3 shadow-lg flex items-center justify-between gap-3 text-sm"
              style={{
                backgroundColor: scheme.onSurface,
                color: scheme.surface,
              }}
            >
              <span className="line-clamp-2">{ui.errorMessage}</span>
              <button
                type="button"
                onClick={clearError}
                className="font-semibold shrink-0 cursor-pointer"
                style={{ color: scheme.primaryContainer }}
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Floating MiniPlayer + WaterDropTabBar */}
      <FloatingDock />

      {/* Full-screen Morphing Player + Karaoke */}
      <PlayerScreen />

      {/* Sheets & Dialogs */}
      <PlayerSheetModal />
      <PasteSheetModal />
      <EpubImportModal />
      <DeleteDialogModal />
      <SourceBrowserModal />

      {/* Theme Reveal Overlay */}
      {themeReveal.active && (
        <div
          className="theme-reveal-overlay fixed inset-0 z-[100] pointer-events-none"
          style={
            {
              backgroundColor: themeReveal.color,
              '--reveal-x': revealPos.x,
              '--reveal-y': revealPos.y,
            } as React.CSSProperties
          }
        />
      )}
    </PhoneFrame>
  );
};

export const App: React.FC = () => (
  <PlayerProvider>
    <NovelBookShell />
  </PlayerProvider>
);

export default App;
