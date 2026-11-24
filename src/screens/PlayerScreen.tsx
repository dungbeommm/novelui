import React, { useEffect, useRef, useState } from 'react';
import {
  AlignLeft,
  ChevronDown,
  FastForward,
  Gauge,
  List,
  Mic,
  MoreVertical,
  Pause,
  Play,
  Repeat,
  Rewind,
  RotateCcw,
} from 'lucide-react';
import { usePlayer } from '../state/usePlayerStore';
import { CoverArt } from '../components/CoverArt';
import { WaveSeekBar } from '../components/WaveSeekBar';
import { extractCoverSeedColor } from '../theme/materialTheme';

function fmtMs(ms: number): string {
  const sec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export const PlayerScreen: React.FC = () => {
  const {
    ui,
    scheme,
    closePlayer,
    togglePlay,
    toggleKaraoke,
    prevChapter,
    nextChapter,
    replay,
    toggleLoop,
    seekTo,
    seekToSentence,
    openSheet,
  } = usePlayer();

  const [rendered, setRendered] = useState(ui.isPlayerOpen);
  const [closing, setClosing] = useState(false);
  const [closeStartY, setCloseStartY] = useState(0);
  const lastStoryRef = useRef(ui.activeStory);
  if (ui.activeStory) lastStoryRef.current = ui.activeStory;
  const story = ui.activeStory ?? lastStoryRef.current;

  const [ambientHex, setAmbientHex] = useState(story?.color || scheme.primary);
  const [dragValue, setDragValue] = useState<number | null>(null);
  const [chromeVisible, setChromeVisible] = useState(true);
  const [animateModeSwap, setAnimateModeSwap] = useState(false);
  const prevKaraokeRef = useRef(ui.isKaraoke);
  const lastKaraokeSnapRef = useRef(ui.isKaraoke);
  if (ui.isPlayerOpen) lastKaraokeSnapRef.current = ui.isKaraoke;
  const showKaraoke = closing ? lastKaraokeSnapRef.current : ui.isKaraoke;

  const karaokeRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const karaokeScrollRef = useRef<HTMLDivElement | null>(null);

  // Touch gesture refs for swipe-down dismiss and horizontal chapter swipe
  const touchStartRef = useRef<{ x: number; y: number; time: number; onCover: boolean; onKaraokeHeader: boolean; atScrollTop: boolean } | null>(null);
  const gestureModeRef = useRef<'none' | 'pullDown' | 'coverX'>('none');
  const didSwipeCoverRef = useRef(false);
  const pullYRef = useRef(0);
  const [pullY, setPullY] = useState(0);
  const [coverDragX, setCoverDragX] = useState(0);
  const [isDraggingGesture, setIsDraggingGesture] = useState(false);
  const usingTouchRef = useRef(false);

  useEffect(() => {
    if (ui.isPlayerOpen) {
      setRendered(true);
      setClosing(false);
      setCloseStartY(0);
      setAnimateModeSwap(false);
      setPullY(0);
      pullYRef.current = 0;
      prevKaraokeRef.current = ui.isKaraoke;
      return;
    }
    if (!rendered) return;
    setCloseStartY(pullYRef.current);
    setClosing(true);
    const id = window.setTimeout(() => {
      setRendered(false);
      setClosing(false);
      setCloseStartY(0);
      setPullY(0);
      pullYRef.current = 0;
    }, 260);
    return () => window.clearTimeout(id);
  }, [ui.isPlayerOpen, rendered]);

  // Reset Karaoke chrome visibility & trigger swap animation when toggling between Cover and Karaoke
  useEffect(() => {
    if (!ui.isPlayerOpen) return;
    if (prevKaraokeRef.current !== ui.isKaraoke) {
      prevKaraokeRef.current = ui.isKaraoke;
      setAnimateModeSwap(true);
      if (ui.isKaraoke) setChromeVisible(true);
    }
  }, [ui.isKaraoke, ui.isPlayerOpen]);

  useEffect(() => {
    if (!story) return;
    setAmbientHex(story.color || scheme.primary);
    extractCoverSeedColor(story.coverUrl, story.color || scheme.primary).then(setAmbientHex);
  }, [story?.id, story?.coverUrl, story?.color, scheme.primary]);

  // Debounced seek commit matching PlayerScreen.kt
  useEffect(() => {
    if (dragValue === null) return;
    const id = window.setTimeout(() => {
      seekTo(dragValue);
      setDragValue(null);
    }, 180);
    return () => window.clearTimeout(id);
  }, [dragValue, seekTo]);

  // Auto-scroll active karaoke line
  useEffect(() => {
    if (!ui.isKaraoke) return;
    const el = karaokeRefs.current[ui.activeSentenceIndex];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [ui.isKaraoke, ui.activeSentenceIndex]);

  if (!rendered || !story) return null;

  const chapterName = ui.chapterTitle || `Chương ${ui.chapterNumber}`;
  const supporting = story.author || story.title;
  const blurAlpha = Math.min(0.36, Math.max(0.08, 0.08 + ui.playerBlur * 0.0035));

  const beginTouch = (clientX: number, clientY: number, target: EventTarget | null) => {
    if (closing) return;
    const el = target as HTMLElement | null;
    if (el?.closest('button, input, canvas')) return;
    const onCover = Boolean(el?.closest('[data-player-cover]'));
    const onKaraokeHeader = Boolean(el?.closest('[data-karaoke-header]'));
    const atScrollTop = !karaokeScrollRef.current || karaokeScrollRef.current.scrollTop <= 2;
    touchStartRef.current = { x: clientX, y: clientY, time: performance.now(), onCover, onKaraokeHeader, atScrollTop };
    gestureModeRef.current = 'none';
    didSwipeCoverRef.current = false;
  };

  const moveTouch = (clientX: number, clientY: number, preventDefault?: () => void) => {
    const start = touchStartRef.current;
    if (!start) return;
    const dx = clientX - start.x;
    const dy = clientY - start.y;

    if (gestureModeRef.current === 'none') {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      if (!ui.isKaraoke && start.onCover && Math.abs(dx) > Math.abs(dy) * 1.15) {
        gestureModeRef.current = 'coverX';
        didSwipeCoverRef.current = true;
        setIsDraggingGesture(true);
      } else if (
        dy > 8 &&
        Math.abs(dy) > Math.abs(dx) * 1.1 &&
        (!ui.isKaraoke || start.onKaraokeHeader || start.atScrollTop)
      ) {
        gestureModeRef.current = 'pullDown';
        setIsDraggingGesture(true);
      } else {
        touchStartRef.current = null;
        return;
      }
    }

    if (gestureModeRef.current === 'pullDown') {
      if (dy > 0) {
        preventDefault?.();
        const nextPull = Math.min(240, dy * (ui.isKaraoke ? 0.5 : 0.9));
        pullYRef.current = nextPull;
        setPullY(nextPull);
      }
    } else if (gestureModeRef.current === 'coverX') {
      preventDefault?.();
      setCoverDragX(Math.max(-110, Math.min(110, dx * 0.85)));
    }
  };

  const endTouch = () => {
    const start = touchStartRef.current;
    const mode = gestureModeRef.current;
    const dt = start ? performance.now() - start.time : 999;
    touchStartRef.current = null;
    gestureModeRef.current = 'none';
    setIsDraggingGesture(false);

    if (didSwipeCoverRef.current) {
      window.setTimeout(() => {
        didSwipeCoverRef.current = false;
      }, 60);
    }

    if (mode === 'pullDown') {
      const quick = dt < 260;
      const threshold = ui.isKaraoke ? 64 : 85;
      const quickThreshold = ui.isKaraoke ? 32 : 42;
      if (pullYRef.current > threshold || (quick && pullYRef.current > quickThreshold)) {
        if (ui.isKaraoke) {
          pullYRef.current = 0;
          setPullY(0);
          toggleKaraoke();
        } else {
          closePlayer();
        }
        setCoverDragX(0);
        return;
      }
    } else if (mode === 'coverX') {
      const quick = dt < 280;
      if ((coverDragX < -52 || (quick && coverDragX < -28)) && ui.playback.hasNext) {
        nextChapter();
      } else if ((coverDragX > 52 || (quick && coverDragX > 28)) && ui.playback.hasPrevious) {
        prevChapter();
      }
    }

    pullYRef.current = 0;
    setPullY(0);
    setCoverDragX(0);
  };

  return (
    <div
      className={`fixed inset-0 z-40 flex flex-col overflow-hidden ${
        closing
          ? 'animate-player-down pointer-events-none'
          : isDraggingGesture
            ? ''
            : pullY === 0
              ? 'animate-player-up transition-transform duration-200 ease-out'
              : 'transition-transform duration-200 ease-out'
      }`}
      style={
        {
          backgroundColor: scheme.surface,
          color: scheme.onSurface,
          transform: !closing && pullY > 0 ? `translateY(${pullY}px)` : undefined,
          borderTopLeftRadius: !closing && pullY > 6 ? 28 : 0,
          borderTopRightRadius: !closing && pullY > 6 ? 28 : 0,
          '--close-start-y': `${closeStartY}px`,
          '--close-start-radius': closeStartY > 6 ? '28px' : '0px',
        } as React.CSSProperties
      }
      onTouchStart={(e) => {
        usingTouchRef.current = true;
        if (e.touches.length === 1) beginTouch(e.touches[0].clientX, e.touches[0].clientY, e.target);
      }}
      onTouchMove={(e) => {
        if (e.touches.length === 1) {
          moveTouch(e.touches[0].clientX, e.touches[0].clientY, () => {
            if (e.cancelable) e.preventDefault();
          });
        }
      }}
      onTouchEnd={endTouch}
      onTouchCancel={endTouch}
      onMouseDown={(e) => {
        if (usingTouchRef.current) return;
        beginTouch(e.clientX, e.clientY, e.target);
      }}
      onMouseMove={(e) => {
        if (!usingTouchRef.current && touchStartRef.current) moveTouch(e.clientX, e.clientY);
      }}
      onMouseUp={() => {
        if (usingTouchRef.current) {
          usingTouchRef.current = false;
          return;
        }
        endTouch();
      }}
    >
      {/* Blurred cover background layer */}
      {ui.playerBlur > 0 && story.coverUrl && (
        <div
          className="absolute inset-0 pointer-events-none scale-115 bg-cover bg-center"
          style={{
            backgroundImage: `url(${story.coverUrl})`,
            opacity: blurAlpha,
            filter: `blur(${Math.max(12, ui.playerBlur * 1.4)}px)`,
          }}
        />
      )}

      {/* Ambient tint gradient */}
      <div
        className="absolute inset-0 pointer-events-none transition-colors duration-350"
        style={{
          background: `linear-gradient(180deg, ${ambientHex}57 0%, ${ambientHex}1f 45%, transparent 100%)`,
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col max-w-[480px] w-full mx-auto h-full">
        {!showKaraoke ? (
          <div
            key="cover-player"
            className={`flex-1 flex flex-col px-[22px] h-full ${animateModeSwap ? 'animate-karaoke-in' : ''}`}
            style={{
              paddingTop: 'max(0.75rem, var(--safe-top, env(safe-area-inset-top)))',
              paddingBottom: 'max(1.25rem, var(--safe-bottom, env(safe-area-inset-bottom)))',
            }}
          >
            {/* Header */}
            <div className="flex items-center pb-2">
              <button
                type="button"
                onClick={closePlayer}
                aria-label="Đóng"
                className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 cursor-pointer active:scale-90 transition-transform"
                style={{ backgroundColor: scheme.primaryContainer, color: scheme.onPrimaryContainer }}
              >
                <ChevronDown className="w-5 h-5" />
              </button>
              <div className="flex-1 text-center min-w-0 px-2">
                <div className="text-base font-medium" style={{ color: scheme.onSurface }}>
                  Đang phát
                </div>
                <div className="text-sm truncate" style={{ color: scheme.onSurfaceVariant }}>
                  {story.title}
                </div>
              </div>
              <div className="w-11" />
            </div>

            {/* Cover Art (tap to play/pause, swipe left/right for chapter) */}
            <div className="flex-1 min-h-0 flex items-center justify-center py-2">
              <div
                data-player-cover
                onClick={() => {
                  if (didSwipeCoverRef.current) {
                    didSwipeCoverRef.current = false;
                    return;
                  }
                  togglePlay();
                }}
                className={`w-[min(82vw,38dvh,340px)] aspect-square cursor-pointer select-none ${
                  isDraggingGesture ? '' : 'transition-transform duration-350 ease-[cubic-bezier(0.22,1.2,0.36,1)]'
                }`}
                style={{
                  transform: `translateX(${coverDragX}px) scale(${ui.isPlaying ? 1 : 0.94})`,
                }}
              >
                <CoverArt
                  colorHex={story.color}
                  imageUrl={story.coverUrl}
                  fallbackKey={story.id}
                  label={story.title}
                  className="w-full h-full rounded-[22px] shadow-xl"
                />
              </div>
            </div>

            {/* Title & Actions */}
            <div className="flex items-center gap-2 pt-3">
              <div className="flex-1 min-w-0">
                <div className="text-[22px] font-semibold leading-tight truncate">{chapterName}</div>
                <div className="text-base truncate mt-0.5" style={{ color: scheme.onSurfaceVariant }}>
                  {supporting}
                </div>
              </div>
              <button
                type="button"
                aria-label="Chọn giọng đọc"
                onClick={() => openSheet('voice')}
                className="w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0 cursor-pointer"
                style={{ backgroundColor: scheme.secondaryContainer, color: scheme.onSecondaryContainer }}
              >
                <Mic className="w-5 h-5" />
              </button>
              <button
                type="button"
                aria-label="Thêm"
                onClick={() => openSheet('reading')}
                className="w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0 cursor-pointer"
                style={{ backgroundColor: scheme.secondaryContainer, color: scheme.onSecondaryContainer }}
              >
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>

            {/* WaveSeekBar + Timestamps */}
            <div className="mt-2.5">
              <WaveSeekBar
                value={dragValue ?? ui.progress}
                onChange={setDragValue}
                activeColor={scheme.primary}
                inactiveColor={scheme.surfaceVariant}
                thumbColor={scheme.primary}
                animate={ui.isPlaying}
              />
              <div className="flex justify-between text-xs font-medium mt-1" style={{ color: scheme.onSurfaceVariant }}>
                <span>{fmtMs(Math.round((dragValue ?? ui.progress) * Math.max(1000, ui.durationMs)))}</span>
                <span>{fmtMs(Math.max(1000, ui.durationMs))}</span>
              </div>
            </div>

            {/* 5-button Transport Row */}
            <div className="flex items-center justify-between mt-3">
              <button
                type="button"
                aria-label="Nghe lại"
                onClick={replay}
                className="w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition active:scale-95"
                style={{ backgroundColor: scheme.secondaryContainer, color: scheme.onSecondaryContainer }}
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              <button
                type="button"
                aria-label="Chương trước"
                disabled={!ui.playback.hasPrevious}
                onClick={prevChapter}
                className="w-14 h-14 rounded-2xl flex items-center justify-center cursor-pointer disabled:opacity-35 transition active:scale-95"
                style={{ backgroundColor: scheme.secondaryContainer, color: scheme.onSecondaryContainer }}
              >
                <Rewind className="w-5 h-5 fill-current" />
              </button>

              <button
                type="button"
                aria-label={ui.isPlaying ? 'Tạm dừng' : 'Phát'}
                onClick={togglePlay}
                className="w-[84px] h-[84px] rounded-full flex items-center justify-center cursor-pointer transition-transform active:scale-95"
                style={{ backgroundColor: scheme.primary, color: scheme.onPrimary }}
              >
                {ui.isPlaying ? (
                  <Pause className="w-8 h-8 fill-current" />
                ) : (
                  <Play className="w-8 h-8 fill-current ml-1" />
                )}
              </button>

              <button
                type="button"
                aria-label="Chương sau"
                disabled={!ui.playback.hasNext}
                onClick={nextChapter}
                className="w-14 h-14 rounded-2xl flex items-center justify-center cursor-pointer disabled:opacity-35 transition active:scale-95"
                style={{ backgroundColor: scheme.secondaryContainer, color: scheme.onSecondaryContainer }}
              >
                <FastForward className="w-5 h-5 fill-current" />
              </button>

              <button
                type="button"
                aria-label="Lặp"
                onClick={toggleLoop}
                className="w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition active:scale-95"
                style={{
                  backgroundColor: ui.loop ? scheme.primaryContainer : scheme.secondaryContainer,
                  color: ui.loop ? scheme.onPrimaryContainer : scheme.onSecondaryContainer,
                }}
              >
                <Repeat className="w-5 h-5" />
              </button>
            </div>

            {/* Bottom Pills: Danh sách / Tốc độ / Lời truyện */}
            <div className="flex items-center gap-2.5 mt-[18px]">
              <button
                type="button"
                onClick={() => openSheet('chapters')}
                className="flex-1 h-[52px] rounded-[18px] flex items-center justify-center gap-2 text-sm font-medium cursor-pointer"
                style={{ backgroundColor: scheme.secondaryContainer, color: scheme.onSecondaryContainer }}
              >
                <List className="w-5 h-5" />
                <span>Danh sách</span>
              </button>

              <button
                type="button"
                aria-label="Tốc độ đọc"
                onClick={() => openSheet('speed')}
                className="w-[54px] h-[52px] rounded-2xl flex flex-col items-center justify-center shrink-0 cursor-pointer"
                style={{ backgroundColor: scheme.secondaryContainer, color: scheme.onSecondaryContainer }}
              >
                <Gauge className="w-5 h-5" />
                <span className="text-[10px] font-semibold mt-0.5">{ui.speed}x</span>
              </button>

              <button
                type="button"
                onClick={toggleKaraoke}
                className="flex-1 h-[52px] rounded-[18px] flex items-center justify-center gap-2 text-sm font-medium cursor-pointer"
                style={{ backgroundColor: scheme.secondaryContainer, color: scheme.onSecondaryContainer }}
              >
                <AlignLeft className="w-5 h-5" />
                <span>Lời truyện</span>
              </button>
            </div>
          </div>
        ) : (
          /* KaraokeView */
          <div
            key="karaoke-player"
            className="flex-1 flex flex-col px-[18px] h-full animate-karaoke-in"
            style={{
              paddingTop: 'max(0.75rem, var(--safe-top, env(safe-area-inset-top)))',
              paddingBottom: 'max(1rem, var(--safe-bottom, env(safe-area-inset-bottom)))',
            }}
          >
            <div
              data-karaoke-header
              className="flex items-center gap-3 pb-2 transition-opacity duration-200"
              style={{ opacity: chromeVisible ? 1 : 0, pointerEvents: chromeVisible ? 'auto' : 'none' }}
            >
              <button
                type="button"
                onClick={toggleKaraoke}
                aria-label="Đóng lời truyện"
                className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 cursor-pointer active:scale-90 transition-transform"
                style={{ backgroundColor: scheme.primaryContainer, color: scheme.onPrimaryContainer }}
              >
                <ChevronDown className="w-5 h-5" />
              </button>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{story.title}</div>
                <div className="text-xs truncate" style={{ color: scheme.onSurfaceVariant }}>
                  {chapterName}
                </div>
              </div>
            </div>

            {/* Lyric Sentences List */}
            <div
              ref={karaokeScrollRef}
              onClick={(e) => {
                if (!chromeVisible && e.target === e.currentTarget) {
                  setChromeVisible(true);
                }
              }}
              className="flex-1 overflow-y-auto no-scrollbar py-24 space-y-1 karaoke-mask"
            >
              {(ui.sentences.length > 0 ? ui.sentences : ['Không có nội dung chương']).map((line, i) => {
                const active = i === ui.activeSentenceIndex;
                return (
                  <button
                    key={i}
                    ref={(el) => {
                      karaokeRefs.current[i] = el;
                    }}
                    type="button"
                    onClick={() => {
                      if (active) setChromeVisible((v) => !v);
                      else {
                        if (!chromeVisible) setChromeVisible(true);
                        seekToSentence(i);
                      }
                    }}
                    className="w-full flex items-center py-3.5 px-1 rounded-[18px] text-left transition-all duration-200 cursor-pointer"
                    style={{
                      transform: active ? 'scale(1)' : 'scale(0.96)',
                      transformOrigin: 'left center',
                    }}
                  >
                    <div
                      className="w-1 h-8 rounded-full shrink-0 mr-3.5 transition-colors"
                      style={{ backgroundColor: active ? scheme.primary : 'transparent' }}
                    />
                    <span
                      className="flex-1 font-semibold leading-[1.34] transition-colors duration-200"
                      style={{
                        fontSize: `${ui.karaokeFontSize}px`,
                        color: active ? scheme.onSurface : `${scheme.onSurface}57`,
                      }}
                    >
                      {line}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Karaoke Mini Control Bar */}
            <div
              className="rounded-[28px] px-2.5 py-2 flex items-center transition-opacity duration-200"
              style={{
                backgroundColor: scheme.surfaceContainerHigh,
                opacity: chromeVisible ? 1 : 0,
                pointerEvents: chromeVisible ? 'auto' : 'none',
              }}
            >
              <div className="relative w-[60px] h-[60px] flex items-center justify-center shrink-0">
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 60 60">
                  <circle cx="30" cy="30" r="26" fill="none" stroke={scheme.surfaceVariant} strokeWidth="4" />
                  {ui.progress > 0 && (
                    <circle
                      cx="30"
                      cy="30"
                      r="26"
                      fill="none"
                      stroke={scheme.primary}
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 26}
                      strokeDashoffset={2 * Math.PI * 26 * (1 - Math.min(1, Math.max(0, ui.progress)))}
                    />
                  )}
                </svg>
                <CoverArt
                  colorHex={story.color}
                  imageUrl={story.coverUrl}
                  fallbackKey={story.id}
                  className="w-[50px] h-[50px] rounded-full"
                />
              </div>

              <div className="flex-1 min-w-0 px-2.5">
                <div className="text-[15px] font-semibold truncate">{story.title}</div>
                <div className="text-xs truncate" style={{ color: scheme.onSurfaceVariant }}>
                  {chapterName}
                </div>
              </div>

              <button
                type="button"
                aria-label="Chương trước"
                disabled={!ui.playback.hasPrevious}
                onClick={prevChapter}
                className="w-10 h-10 flex items-center justify-center rounded-full disabled:opacity-35 cursor-pointer"
              >
                <Rewind className="w-6 h-6 fill-current" />
              </button>

              <button
                type="button"
                aria-label={ui.isPlaying ? 'Tạm dừng' : 'Phát'}
                onClick={togglePlay}
                className="w-[52px] h-[52px] mx-1 rounded-full flex items-center justify-center cursor-pointer"
                style={{ backgroundColor: scheme.primary, color: scheme.onPrimary }}
              >
                {ui.isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
              </button>

              <button
                type="button"
                aria-label="Chương sau"
                disabled={!ui.playback.hasNext}
                onClick={nextChapter}
                className="w-10 h-10 flex items-center justify-center rounded-full disabled:opacity-35 cursor-pointer"
              >
                <FastForward className="w-6 h-6 fill-current" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
