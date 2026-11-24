import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  AudioLines,
  BookmarkPlus,
  BookOpen,
  Check,
  CheckCircle2,
  ClipboardPaste,
  ExternalLink,
  FastForward,
  Globe,
  Home,
  Link2,
  List,
  Minus,
  Moon,
  MoreVertical,
  Play,
  Plus,
  RotateCcw,
  Search,
  SkipBack,
  SkipForward,
  Sliders,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Timer,
  Trash2,
  Volume2,
  Volume1,
  X,
} from 'lucide-react';
import { ChapterFilter, ChapterListenStatus, SleepMode, UiTheme } from '../model/types';
import { chapTitle, PASTE_STEPS, RAW_SOURCES } from '../model/mockData';
import { StoryIds } from '../model/storyIds';
import { usePlayer } from '../state/usePlayerStore';
import { CoverArt } from './CoverArt';
import { SwipeableBottomSheet } from './SwipeableBottomSheet';
import { M3ExpressiveSlider, M3ExpressiveSwitch } from './M3Expressive';

export const PlayerSheetModal: React.FC = () => {
  const {
    ui,
    scheme,
    closeSheet,
    setChapter,
    setChapterFilter,
    filteredChapterItems,
    setSpeed,
    setPitch,
    setVoice,
    setPlayerVolume,
    setKaraokeFont,
    skipSentence,
    replay,
    toggleAutoNext,
    toggleLoop,
    toggleVoiceProfile,
    setSmartSleep,
    setSleepTimer,
  } = usePlayer();

  const [customMinutes, setCustomMinutes] = useState(() => Math.min(180, Math.max(5, ui.sleepTimer ?? 30)));

  if (!ui.sheet || !ui.isPlayerOpen) return null;

  const chapters = filteredChapterItems();

  return (
    <SwipeableBottomSheet
      onClose={closeSheet}
      backgroundColor={scheme.surfaceContainerLow}
      textColor={scheme.onSurface}
      handleColor={scheme.outlineVariant}
      className="max-h-[84dvh] rounded-t-[28px]"
    >
      <div className="overflow-y-auto thin-scrollbar px-5 pb-7 pt-2">
          {ui.sheet === 'chapters' && (
            <div>
              <h3 className="text-[22px] font-medium mb-3">Danh sách chương</h3>
              <div className="flex gap-2 mb-3 flex-wrap">
                {[
                  { id: ChapterFilter.ALL, label: 'Tất cả' },
                  { id: ChapterFilter.LISTENING, label: 'Đang nghe' },
                  { id: ChapterFilter.HEARD, label: 'Đã nghe' },
                ].map((f) => {
                  const selected = ui.chapterFilter === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setChapterFilter(f.id)}
                      className="px-3.5 py-1.5 rounded-full text-xs font-medium border transition cursor-pointer flex items-center gap-1.5"
                      style={{
                        backgroundColor: selected ? scheme.secondaryContainer : 'transparent',
                        color: selected ? scheme.onSecondaryContainer : scheme.onSurfaceVariant,
                        borderColor: selected ? 'transparent' : scheme.outlineVariant,
                      }}
                    >
                      {selected && <Check className="w-3.5 h-3.5" />}
                      {f.label}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-1 max-h-[55vh] overflow-y-auto thin-scrollbar">
                {chapters.map((item) => {
                  const sub = [
                    item.title || chapTitle(item.index),
                    item.isCurrent && ui.isPlaying
                      ? 'Đang phát'
                      : item.status === ChapterListenStatus.IN_PROGRESS && item.progress > 0
                        ? `${Math.round(item.progress * 100)}%`
                        : item.status === ChapterListenStatus.COMPLETED
                          ? 'Đã nghe'
                          : null,
                  ]
                    .filter(Boolean)
                    .join(' · ');

                  return (
                    <button
                      key={`${item.chapterId}-${item.index}`}
                      type="button"
                      onClick={() => setChapter(item.index)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition cursor-pointer"
                      style={{
                        backgroundColor: item.isCurrent ? `${scheme.primaryContainer}59` : 'transparent',
                      }}
                    >
                      <div className="shrink-0">
                        {item.isCurrent ? (
                          <Play className="w-5 h-5 fill-current" style={{ color: scheme.primary }} />
                        ) : item.status === ChapterListenStatus.COMPLETED ? (
                          <CheckCircle2 className="w-5 h-5" style={{ color: scheme.primary }} />
                        ) : (
                          <List className="w-5 h-5" style={{ color: scheme.onSurfaceVariant }} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-sm font-medium"
                          style={{
                            color:
                              item.status === ChapterListenStatus.COMPLETED && !item.isCurrent
                                ? scheme.onSurfaceVariant
                                : scheme.onSurface,
                          }}
                        >
                          Chương {item.index}
                        </div>
                        <div className="text-xs truncate" style={{ color: scheme.onSurfaceVariant }}>
                          {sub}
                        </div>
                      </div>
                      {(item.isCurrent || item.status === ChapterListenStatus.IN_PROGRESS) && (
                        <div className="w-12 h-1 rounded-full overflow-hidden shrink-0" style={{ backgroundColor: scheme.surfaceVariant }}>
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.round((item.isCurrent ? ui.progress : item.progress) * 100)}%`,
                              backgroundColor: scheme.primary,
                            }}
                          />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {ui.sheet === 'speed' && (
            <div className="space-y-4 pb-1">
              <div>
                <h3 className="text-[22px] font-medium">Tốc độ &amp; độ cao giọng</h3>
                <p className="text-xs mt-0.5" style={{ color: scheme.onSurfaceVariant }}>
                  Kéo thanh trượt để chỉnh nhịp độ và cao độ giọng đọc
                </p>
              </div>

              {/* Tốc độ đọc */}
              <div className="rounded-3xl p-4 space-y-2" style={{ backgroundColor: scheme.surfaceContainerHigh }}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[15px] font-semibold">Tốc độ đọc</span>
                  <div className="flex items-center gap-2">
                    {ui.speed !== 1 && (
                      <button
                        type="button"
                        onClick={() => setSpeed(1)}
                        className="px-2.5 py-0.5 rounded-full text-xs font-medium border cursor-pointer active:scale-95 transition-transform"
                        style={{ borderColor: scheme.outlineVariant, color: scheme.onSurfaceVariant }}
                      >
                        1.0x
                      </button>
                    )}
                    <span
                      className="px-3 py-1 rounded-full text-sm font-bold tabular-nums"
                      style={{ backgroundColor: scheme.primaryContainer, color: scheme.onPrimaryContainer }}
                    >
                      {Number(ui.speed.toFixed(2))}x
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    aria-label="Giảm tốc độ"
                    disabled={ui.speed <= 0}
                    onClick={() => setSpeed(ui.speed - 0.05)}
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-35 active:scale-90 transition-transform"
                    style={{ backgroundColor: scheme.secondaryContainer, color: scheme.onSecondaryContainer }}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <M3ExpressiveSlider
                      value={ui.speed}
                      min={0}
                      max={4}
                      step={0.05}
                      stopCount={9}
                      scheme={scheme}
                      ariaLabel="Tốc độ đọc"
                      onChange={(v) => setSpeed(v)}
                    />
                  </div>
                  <button
                    type="button"
                    aria-label="Tăng tốc độ"
                    disabled={ui.speed >= 4}
                    onClick={() => setSpeed(ui.speed + 0.05)}
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-35 active:scale-90 transition-transform"
                    style={{ backgroundColor: scheme.secondaryContainer, color: scheme.onSecondaryContainer }}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex justify-between text-[11px] font-medium px-1" style={{ color: scheme.onSurfaceVariant }}>
                  <span>0x</span>
                  <span>1x</span>
                  <span>2x</span>
                  <span>3x</span>
                  <span>4x</span>
                </div>
              </div>

              {/* Độ cao giọng */}
              <div className="rounded-3xl p-4 space-y-2" style={{ backgroundColor: scheme.surfaceContainerHigh }}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[15px] font-semibold">Độ cao giọng</span>
                  <div className="flex items-center gap-2">
                    {ui.pitch !== 1 && (
                      <button
                        type="button"
                        onClick={() => setPitch(1)}
                        className="px-2.5 py-0.5 rounded-full text-xs font-medium border cursor-pointer active:scale-95 transition-transform"
                        style={{ borderColor: scheme.outlineVariant, color: scheme.onSurfaceVariant }}
                      >
                        1.0x
                      </button>
                    )}
                    <span
                      className="px-3 py-1 rounded-full text-sm font-bold tabular-nums"
                      style={{ backgroundColor: scheme.primaryContainer, color: scheme.onPrimaryContainer }}
                    >
                      {Number(ui.pitch.toFixed(2))}x
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    aria-label="Giảm độ cao giọng"
                    disabled={ui.pitch <= 0}
                    onClick={() => setPitch(ui.pitch - 0.05)}
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-35 active:scale-90 transition-transform"
                    style={{ backgroundColor: scheme.secondaryContainer, color: scheme.onSecondaryContainer }}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <M3ExpressiveSlider
                      value={ui.pitch}
                      min={0}
                      max={2}
                      step={0.05}
                      stopCount={9}
                      scheme={scheme}
                      ariaLabel="Độ cao giọng"
                      onChange={(v) => setPitch(v)}
                    />
                  </div>
                  <button
                    type="button"
                    aria-label="Tăng độ cao giọng"
                    disabled={ui.pitch >= 2}
                    onClick={() => setPitch(ui.pitch + 0.05)}
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-35 active:scale-90 transition-transform"
                    style={{ backgroundColor: scheme.secondaryContainer, color: scheme.onSecondaryContainer }}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex justify-between text-[11px] font-medium px-1" style={{ color: scheme.onSurfaceVariant }}>
                  <span>0x (Trầm)</span>
                  <span>0.5x</span>
                  <span>1.0x</span>
                  <span>1.5x</span>
                  <span>2.0x (Cao)</span>
                </div>
              </div>
            </div>
          )}

          {ui.sheet === 'voice' && (
            <div>
              <h3 className="text-[22px] font-medium mb-3">Giọng đọc</h3>
              {ui.voiceGroups.length === 0 ? (
                <p className="text-sm py-4" style={{ color: scheme.onSurfaceVariant }}>
                  Không tìm thấy giọng đang bật. Vào Cài đặt → Quản lý giọng đọc để bật hoặc cấu hình provider.
                </p>
              ) : (
                <div className="space-y-3">
                  {ui.voiceGroups.map((g) => (
                    <div key={g.name}>
                      <div className="text-xs font-medium px-1 mb-1.5" style={{ color: scheme.primary }}>
                        {g.name}
                      </div>
                      <div className="space-y-1">
                        {g.voices.map((v) => {
                          const selected = v.id === ui.selectedVoice;
                          return (
                            <button
                              key={v.id}
                              type="button"
                              onClick={() => setVoice(v.id)}
                              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition cursor-pointer"
                              style={{
                                backgroundColor: selected ? `${scheme.primaryContainer}50` : 'transparent',
                              }}
                            >
                              <div className="min-w-0 pr-2">
                                <div className="text-sm font-medium">{v.label}</div>
                                <div className="text-xs" style={{ color: scheme.onSurfaceVariant }}>
                                  {v.sub}
                                </div>
                              </div>
                              {selected && <Check className="w-5 h-5 shrink-0" style={{ color: scheme.primary }} />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {ui.sheet === 'reading' && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: scheme.primaryContainer, color: scheme.onPrimaryContainer }}
                >
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Điều khiển phát</h3>
                  <p className="text-xs" style={{ color: scheme.onSurfaceVariant }}>
                    Âm thanh, lời truyện và hẹn giờ
                  </p>
                </div>
              </div>

              {/* Card 1: Volume & Font */}
              <div className="rounded-3xl p-4 space-y-3" style={{ backgroundColor: scheme.surfaceContainerHigh }}>
                <div className="flex items-center gap-2 font-semibold text-[15px]">
                  <Volume2 className="w-5 h-5" style={{ color: scheme.primary }} />
                  <span>Âm thanh &amp; lời truyện</span>
                </div>
                <div>
                  <div className="text-xs font-medium mb-1">Âm lượng {Math.round(ui.playerVolume * 100)}%</div>
                  <div className="flex items-center gap-2">
                    <Volume1 className="w-5 h-5 shrink-0" style={{ color: scheme.onSurfaceVariant }} />
                    <div className="flex-1 min-w-0">
                      <M3ExpressiveSlider
                        value={ui.playerVolume}
                        min={0}
                        max={1}
                        step={0.05}
                        stopCount={11}
                        scheme={scheme}
                        ariaLabel="Âm lượng"
                        onChange={setPlayerVolume}
                      />
                    </div>
                    <Volume2 className="w-5 h-5 shrink-0" style={{ color: scheme.onSurfaceVariant }} />
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium mb-1">Cỡ chữ lời truyện {ui.karaokeFontSize}px</div>
                  <M3ExpressiveSlider
                    value={ui.karaokeFontSize}
                    min={16}
                    max={48}
                    step={1}
                    stopCount={9}
                    scheme={scheme}
                    ariaLabel="Cỡ chữ lời truyện"
                    onChange={setKaraokeFont}
                  />
                </div>
              </div>

              {/* Card 2: Quick Actions & Switches */}
              <div className="rounded-3xl p-4 space-y-2.5" style={{ backgroundColor: scheme.surfaceContainerHigh }}>
                <div className="flex items-center gap-2 font-semibold text-[15px] mb-1">
                  <FastForward className="w-5 h-5" style={{ color: scheme.primary }} />
                  <span>Thao tác nhanh</span>
                </div>
                <button
                  type="button"
                  onClick={() => skipSentence(-1)}
                  className="w-full h-12 rounded-2xl flex items-center justify-center gap-2 text-sm font-medium cursor-pointer"
                  style={{ backgroundColor: scheme.secondaryContainer, color: scheme.onSecondaryContainer }}
                >
                  <SkipBack className="w-4 h-4" />
                  <span>Câu trước</span>
                </button>
                <button
                  type="button"
                  onClick={replay}
                  className="w-full h-12 rounded-2xl flex items-center justify-center gap-2 text-sm font-medium cursor-pointer"
                  style={{ backgroundColor: scheme.secondaryContainer, color: scheme.onSecondaryContainer }}
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Nghe lại câu hiện tại</span>
                </button>
                <button
                  type="button"
                  onClick={() => skipSentence(1)}
                  className="w-full h-12 rounded-2xl flex items-center justify-center gap-2 text-sm font-medium cursor-pointer"
                  style={{ backgroundColor: scheme.secondaryContainer, color: scheme.onSecondaryContainer }}
                >
                  <SkipForward className="w-4 h-4" />
                  <span>Câu sau</span>
                </button>

                <div className="pt-2 space-y-2">
                  <ToggleRow
                    title="Tự động chuyển chương"
                    subtitle="Phát tiếp khi hết chương"
                    checked={ui.autoNextChapter}
                    onChange={toggleAutoNext}
                  />
                  <ToggleRow
                    title="Lặp chương"
                    subtitle="Phát lại từ đầu khi kết thúc"
                    checked={ui.loop}
                    onChange={toggleLoop}
                  />
                  <ToggleRow
                    title="Nhớ giọng theo truyện"
                    checked={ui.voiceProfileEnabled}
                    onChange={toggleVoiceProfile}
                  />
                </div>
              </div>

              {/* Card 3: Sleep Timer */}
              <div className="rounded-3xl p-4 space-y-3" style={{ backgroundColor: scheme.surfaceContainerHigh }}>
                <div className="flex items-center gap-2 font-semibold text-[15px]">
                  <Moon className="w-5 h-5" style={{ color: scheme.primary }} />
                  <span>Hẹn giờ ngủ tùy chỉnh</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { mode: SleepMode.END_SENTENCE, label: 'Dừng cuối câu' },
                    { mode: SleepMode.END_CHAPTER, label: 'Dừng cuối chương' },
                  ].map((item) => {
                    const selected = ui.sleepMode === item.mode;
                    return (
                      <button
                        key={item.mode}
                        type="button"
                        onClick={() => setSmartSleep(selected ? SleepMode.OFF : item.mode)}
                        className="px-3.5 py-1.5 rounded-full text-xs font-medium border cursor-pointer"
                        style={{
                          backgroundColor: selected ? scheme.primaryContainer : 'transparent',
                          color: selected ? scheme.onPrimaryContainer : scheme.onSurfaceVariant,
                          borderColor: selected ? 'transparent' : scheme.outlineVariant,
                        }}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-center gap-4 pt-1">
                  <button
                    type="button"
                    onClick={() => setCustomMinutes((m) => Math.max(5, m - 5))}
                    className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer"
                    style={{ backgroundColor: scheme.secondaryContainer, color: scheme.onSecondaryContainer }}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <div className="w-28 text-center">
                    <div className="text-3xl font-bold">{customMinutes}</div>
                    <div className="text-xs" style={{ color: scheme.onSurfaceVariant }}>
                      phút
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCustomMinutes((m) => Math.min(180, m + 5))}
                    className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer"
                    style={{ backgroundColor: scheme.secondaryContainer, color: scheme.onSecondaryContainer }}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <M3ExpressiveSlider
                  value={customMinutes}
                  min={5}
                  max={180}
                  step={5}
                  stopCount={11}
                  scheme={scheme}
                  ariaLabel="Hẹn giờ ngủ"
                  onChange={setCustomMinutes}
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSleepTimer(null)}
                    className="flex-1 h-11 rounded-full border text-sm font-medium cursor-pointer"
                    style={{ borderColor: scheme.outlineVariant, color: scheme.onSurface }}
                  >
                    Tắt hẹn giờ
                  </button>
                  <button
                    type="button"
                    onClick={() => setSleepTimer(customMinutes)}
                    className="flex-1 h-11 rounded-full flex items-center justify-center gap-1.5 text-sm font-medium cursor-pointer"
                    style={{ backgroundColor: scheme.primary, color: scheme.onPrimary }}
                  >
                    <Timer className="w-4 h-4" />
                    <span>Bắt đầu</span>
                  </button>
                </div>

                {ui.sleepTimer !== null && (
                  <p className="text-xs font-medium" style={{ color: scheme.primary }}>
                    Còn khoảng {ui.sleepTimer} phút
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
    </SwipeableBottomSheet>
  );
};

const ToggleRow: React.FC<{ title: string; subtitle?: string; checked: boolean; onChange: () => void }> = ({
  title,
  subtitle,
  checked,
  onChange,
}) => {
  const { scheme } = usePlayer();
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="pr-3">
        <div className="text-sm font-medium">{title}</div>
        {subtitle && (
          <div className="text-xs" style={{ color: scheme.onSurfaceVariant }}>
            {subtitle}
          </div>
        )}
      </div>
      <M3ExpressiveSwitch checked={checked} onChange={onChange} scheme={scheme} ariaLabel={title} />
    </div>
  );
};

export const PasteSheetModal: React.FC = () => {
  const {
    ui,
    scheme,
    closePaste,
    setPasteUrl,
    markClipboardEmpty,
    clearPasteResult,
    analyzeLink,
    openPlayer,
    saveToLibrary,
  } = usePlayer();

  if (!ui.pasteOpen) return null;
  const p = ui.paste;
  const url = p.url.trim();
  const validUrl = StoryIds.isAllowedUrl(url);
  const host = StoryIds.hostOf(url);
  const hasErr = Boolean(p.error || p.clipErr || (url.length > 0 && !validUrl));

  const pasteFromClipboard = async () => {
    try {
      const clip = (await navigator.clipboard.readText()).trim();
      if (StoryIds.isAllowedUrl(clip)) setPasteUrl(clip);
      else markClipboardEmpty();
    } catch {
      markClipboardEmpty();
    }
  };

  return (
    <SwipeableBottomSheet
      onClose={closePaste}
      backgroundColor={scheme.surface}
      textColor={scheme.onSurface}
      handleColor={scheme.outlineVariant}
      className="max-h-[88dvh] rounded-t-[30px]"
    >
      <div className="px-5 pb-6 pt-1 overflow-y-auto thin-scrollbar">

        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-[46px] h-[46px] rounded-2xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: scheme.primaryContainer, color: scheme.onPrimaryContainer }}
          >
            <Link2 className="w-5 h-5" />
          </div>
          <h3 className="flex-1 text-xl font-bold">
            {p.result ? 'Truyện đã sẵn sàng' : p.analyzing ? 'Đang mở liên kết' : 'Mở truyện từ liên kết'}
          </h3>
          <button type="button" onClick={closePaste} className="p-2 rounded-full cursor-pointer" aria-label="Đóng">
            <X className="w-5 h-5" />
          </button>
        </div>

        {p.result ? (
          <div className="space-y-3">
            <div
              className="rounded-3xl p-3 border flex items-center gap-3.5"
              style={{ backgroundColor: scheme.surfaceContainer, borderColor: `${scheme.outlineVariant}a6` }}
            >
              <CoverArt
                colorHex={p.result.story.color}
                imageUrl={p.result.story.coverUrl}
                fallbackKey={p.result.story.id}
                className="w-[82px] h-[112px] rounded-[18px] shrink-0"
              />
              <div className="flex-1 min-w-0">
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium mb-2"
                  style={{ backgroundColor: scheme.primaryContainer, color: scheme.onPrimaryContainer }}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Đã nhận diện
                </span>
                <div className="text-base font-bold line-clamp-2">{p.result.story.title}</div>
                <div className="text-sm truncate mt-1" style={{ color: scheme.onSurfaceVariant }}>
                  {p.result.story.author || p.result.source}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                closePaste();
                openPlayer(p.result!.story);
              }}
              className="w-full h-14 rounded-[18px] flex items-center justify-center gap-2 font-medium text-sm cursor-pointer"
              style={{ backgroundColor: scheme.primary, color: scheme.onPrimary }}
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Nghe ngay</span>
            </button>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={clearPasteResult}
                className="text-sm font-medium px-3 py-2 cursor-pointer"
                style={{ color: scheme.primary }}
              >
                Liên kết khác
              </button>
              <button
                type="button"
                onClick={() => saveToLibrary(p.result!.story)}
                className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 cursor-pointer"
                style={{ color: scheme.primary }}
              >
                <BookmarkPlus className="w-4 h-4" />
                <span>Lưu thư viện</span>
              </button>
            </div>
          </div>
        ) : p.analyzing ? (
          <div
            className="rounded-3xl px-5 py-6 flex flex-col items-center text-center"
            style={{ backgroundColor: scheme.surfaceContainer }}
          >
            <div
              className="w-8 h-8 rounded-full border-3 border-t-transparent animate-spin mb-4"
              style={{ borderColor: scheme.primary, borderTopColor: 'transparent' }}
            />
            <div className="text-base font-semibold">Đang tìm nội dung truyện</div>
            {host && (
              <div className="text-sm mt-1" style={{ color: scheme.onSurfaceVariant }}>
                {host}
              </div>
            )}
            <div className="w-full h-1.5 rounded-full overflow-hidden mt-4" style={{ backgroundColor: scheme.surfaceVariant }}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, (p.step / PASTE_STEPS.length) * 100)}%`,
                  backgroundColor: scheme.primary,
                }}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3.5">
            <div
              className="rounded-3xl p-3 border"
              style={{
                backgroundColor: scheme.surfaceContainer,
                borderColor: hasErr ? scheme.error : `${scheme.outlineVariant}b3`,
              }}
            >
              <div
                className="flex items-center gap-2 rounded-[18px] px-3 py-2.5 border"
                style={{
                  backgroundColor: scheme.surface,
                  borderColor: hasErr ? scheme.error : scheme.outlineVariant,
                }}
              >
                <Link2 className="w-5 h-5 shrink-0" style={{ color: scheme.onSurfaceVariant }} />
                <input
                  type="url"
                  value={p.url}
                  onChange={(e) => setPasteUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && validUrl) analyzeLink(url);
                  }}
                  placeholder="Dán liên kết truyện hoặc chương"
                  className="flex-1 bg-transparent outline-none text-sm"
                />
                {p.url ? (
                  <button type="button" onClick={() => setPasteUrl('')} className="p-1 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                ) : (
                  <button type="button" onClick={pasteFromClipboard} className="p-1 cursor-pointer" title="Dán">
                    <ClipboardPaste className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-xs mt-2 px-1" style={{ color: hasErr ? scheme.error : scheme.onSurfaceVariant }}>
                {p.error
                  ? p.error
                  : p.clipErr
                    ? 'Bộ nhớ tạm không có liên kết hợp lệ'
                    : url && !validUrl
                      ? 'Chỉ hỗ trợ liên kết HTTPS hợp lệ'
                      : host || 'App tự nhận diện nguồn và chương đầu'}
              </p>
              {!p.url && (
                <div className="flex justify-end mt-1">
                  <button
                    type="button"
                    onClick={pasteFromClipboard}
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full cursor-pointer"
                    style={{ color: scheme.primary }}
                  >
                    <ClipboardPaste className="w-4 h-4" />
                    <span>Dán từ bộ nhớ</span>
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              disabled={!validUrl}
              onClick={() => analyzeLink(url)}
              className="w-full h-14 rounded-[18px] flex items-center justify-center gap-2 font-medium text-sm transition disabled:opacity-40 cursor-pointer"
              style={{ backgroundColor: scheme.primary, color: scheme.onPrimary }}
            >
              <Sparkles className="w-5 h-5" />
              <span>Mở truyện</span>
            </button>
          </div>
        )}
      </div>
    </SwipeableBottomSheet>
  );
};

export const EpubImportModal: React.FC = () => {
  const { ui, scheme, clearEpubImport, listenImportedEpub, saveImportedEpub } = usePlayer();
  const e = ui.epubImport;
  if (!e.importing && !e.result && !e.error) return null;

  return (
    <SwipeableBottomSheet
      onClose={clearEpubImport}
      canClose={!e.importing}
      backgroundColor={scheme.surface}
      textColor={scheme.onSurface}
      handleColor={scheme.outlineVariant}
      className="max-h-[88dvh] rounded-t-[30px]"
    >
      <div className="px-5 pb-6 pt-1 overflow-y-auto thin-scrollbar">

        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-[46px] h-[46px] rounded-2xl flex items-center justify-center shrink-0"
            style={{
              backgroundColor: e.error ? scheme.errorContainer : scheme.primaryContainer,
              color: e.error ? scheme.onErrorContainer : scheme.onPrimaryContainer,
            }}
          >
            {e.importing ? (
              <div
                className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: scheme.primary, borderTopColor: 'transparent' }}
              />
            ) : (
              <BookOpen className="w-5 h-5" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold">
              {e.importing ? 'Đang nhập EPUB' : e.error ? 'Không thể nhập EPUB' : 'Sách đã sẵn sàng'}
            </h3>
            <p className="text-sm truncate" style={{ color: scheme.onSurfaceVariant }}>
              {e.fileName || 'Sách ngoại tuyến'}
            </p>
          </div>
          {!e.importing && (
            <button type="button" onClick={clearEpubImport} className="p-2 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {e.importing && (
          <div className="rounded-3xl p-6 text-center" style={{ backgroundColor: scheme.surfaceContainer }}>
            <div className="w-full h-1.5 rounded-full overflow-hidden mb-4" style={{ backgroundColor: scheme.surfaceVariant }}>
              <div className="h-full w-2/3 animate-pulse rounded-full" style={{ backgroundColor: scheme.primary }} />
            </div>
            <div className="text-base font-semibold">Đang đọc mục lục và trích ảnh bìa…</div>
            <p className="text-sm mt-1" style={{ color: scheme.onSurfaceVariant }}>
              Tệp được kiểm tra an toàn trước khi thêm vào thư viện.
            </p>
          </div>
        )}

        {e.error && (
          <div className="space-y-3.5">
            <div
              className="rounded-2xl p-4 text-sm"
              style={{ backgroundColor: scheme.errorContainer, color: scheme.onErrorContainer }}
            >
              {e.error}
            </div>
            <button
              type="button"
              onClick={clearEpubImport}
              className="w-full h-13 rounded-[17px] font-medium text-sm cursor-pointer"
              style={{ backgroundColor: scheme.primary, color: scheme.onPrimary }}
            >
              Đóng
            </button>
          </div>
        )}

        {e.result && (
          <div className="space-y-3">
            <div
              className="rounded-3xl p-3 border flex items-center gap-3.5"
              style={{ backgroundColor: scheme.surfaceContainer, borderColor: `${scheme.outlineVariant}a6` }}
            >
              <CoverArt
                colorHex={e.result.story.color}
                imageUrl={e.result.story.coverUrl}
                fallbackKey={e.result.story.id}
                label={e.result.story.title}
                className="w-[92px] h-[132px] rounded-[18px] shrink-0"
              />
              <div className="flex-1 min-w-0">
                <span
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium mb-2"
                  style={{ backgroundColor: scheme.primaryContainer, color: scheme.onPrimaryContainer }}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  EPUB ngoại tuyến
                </span>
                <div className="text-base font-bold line-clamp-3">{e.result.story.title}</div>
                <div className="text-sm truncate mt-1" style={{ color: scheme.onSurfaceVariant }}>
                  {e.result.story.author || 'Không rõ tác giả'}
                </div>
                <div className="text-xs font-semibold mt-1" style={{ color: scheme.primary }}>
                  {e.result.story.totalChapters} chương
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={listenImportedEpub}
              className="w-full h-14 rounded-[18px] flex items-center justify-center gap-2 font-medium text-sm cursor-pointer"
              style={{ backgroundColor: scheme.primary, color: scheme.onPrimary }}
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Nghe ngay</span>
            </button>

            <button
              type="button"
              onClick={() => saveImportedEpub(true)}
              className="w-full h-13 rounded-[17px] border flex items-center justify-center gap-2 font-medium text-sm cursor-pointer"
              style={{ borderColor: scheme.outlineVariant, color: scheme.primary }}
            >
              <BookmarkPlus className="w-4 h-4" />
              <span>Lưu vào thư viện</span>
            </button>
          </div>
        )}
      </div>
    </SwipeableBottomSheet>
  );
};

export const DeleteDialogModal: React.FC = () => {
  const { ui, scheme, askDelete, deleteFromLibrary } = usePlayer();
  const story = ui.storyToDelete;
  if (!story) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/55 backdrop-blur-[2px] animate-backdrop-in"
      onClick={() => askDelete(null)}
    >
      <div
        className="w-full max-w-[380px] rounded-[28px] p-6 shadow-2xl animate-dialog-in"
        style={{ backgroundColor: scheme.surfaceContainerHigh, color: scheme.onSurface }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="w-[52px] h-[52px] rounded-[17px] flex items-center justify-center mb-4"
          style={{ backgroundColor: scheme.errorContainer, color: scheme.onErrorContainer }}
        >
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-bold">Xoá toàn bộ dữ liệu truyện?</h3>
        <p className="text-sm mt-2.5 leading-relaxed" style={{ color: scheme.onSurfaceVariant }}>
          Bạn có chắc chắn muốn xóa truyện “{story.title}”? Thao tác sẽ xoá lịch sử, tiến độ, lịch sử chương, dữ liệu tải trước, cache và tệp EPUB trong app. Không thể hoàn tác.
        </p>
        <div className="flex justify-end gap-2.5 mt-6">
          <button
            type="button"
            onClick={() => askDelete(null)}
            className="px-4 py-2.5 rounded-full text-sm font-medium cursor-pointer"
            style={{ color: scheme.primary }}
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={() => deleteFromLibrary(story.id)}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-medium cursor-pointer"
            style={{ backgroundColor: scheme.errorContainer, color: scheme.onErrorContainer }}
          >
            <Trash2 className="w-4 h-4" />
            <span>Xóa</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const SourceBrowserModal: React.FC = () => {
  const {
    ui,
    scheme,
    sourceBrowserOpen,
    closeSourceBrowser,
    selectWebSearchSource,
    analyzeFromSearch,
    setUiTheme,
    openPlayer,
  } = usePlayer();
  const [query, setQuery] = useState('');

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return RAW_SOURCES.map((d) => {
      const clean = d.replace(/^www\./, '');
      const cat =
        ['docln.sbs', 'ln.hako.vn', 'plnovel.com', 'valvrareteam.net'].includes(d)
          ? 'Truyện Nhật'
          : ['wattpad.com', 'www.wattpad.com', 'webnovel.com', 'webnovel.vn', 'wuxiaworld.com', 'inkitt.com', 'noveltoon.mobi', 'noveltoon.vn', 'www.loppytoon.com'].includes(d)
            ? 'Truyện Anh'
            : ['metruyensangtac.com', 'sangtacviet.xyz', 'tacgiaviet.com', 'teenfic.net', 'vietnamthuquan.eu'].includes(d)
              ? 'Truyện Việt'
              : 'Truyện Trung';
      return { domain: d, clean, cat, letter: clean[0]?.toUpperCase() || 'T' };
    }).filter((item) => !q || item.domain.includes(q) || item.cat.toLowerCase().includes(q));
  }, [query]);

  if (!sourceBrowserOpen) return null;

  const isDark = scheme.isDark;
  const pageBg = isDark ? '#0f1216' : scheme.surface;
  const cardBg = isDark ? '#181c22' : scheme.surfaceContainerLowest;
  const cardBorder = isDark ? '#272c35' : scheme.outlineVariant;
  const barBg = isDark ? '#1c2028' : scheme.surfaceContainerHigh;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-center animate-page-in"
      style={{ backgroundColor: scheme.surface, color: scheme.onSurface }}
      onTouchStart={(e) => {
        if (e.touches.length === 1 && e.touches[0].clientX < 36) {
          (e.currentTarget as HTMLElement).dataset.edgeStartX = String(e.touches[0].clientX);
          (e.currentTarget as HTMLElement).dataset.edgeStartY = String(e.touches[0].clientY);
        } else {
          delete (e.currentTarget as HTMLElement).dataset.edgeStartX;
        }
      }}
      onTouchEnd={(e) => {
        const sx = Number((e.currentTarget as HTMLElement).dataset.edgeStartX || 0);
        const sy = Number((e.currentTarget as HTMLElement).dataset.edgeStartY || 0);
        delete (e.currentTarget as HTMLElement).dataset.edgeStartX;
        if (!sx || e.changedTouches.length === 0) return;
        const dx = e.changedTouches[0].clientX - sx;
        const dy = Math.abs(e.changedTouches[0].clientY - sy);
        if (dx > 72 && dx > dy * 1.4) closeSourceBrowser();
      }}
    >
      <div className="w-full max-w-[480px] h-full flex flex-col relative overflow-hidden" style={{ backgroundColor: pageBg }}>
        {/* Android In-App Browser Chrome Header */}
        <header
          className="px-3 py-2 flex items-center gap-2 shrink-0"
          style={{
            paddingTop: 'max(0.5rem, var(--safe-top, env(safe-area-inset-top)))',
            backgroundColor: scheme.surface,
            color: scheme.onSurface,
          }}
        >
          <button
            type="button"
            onClick={closeSourceBrowser}
            className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
            aria-label="Đóng trình duyệt"
          >
            <Home className="w-5 h-5" />
          </button>
          <div
            className="flex-1 h-10 rounded-full px-3.5 flex items-center gap-2.5 min-w-0"
            style={{ backgroundColor: scheme.surfaceContainerHigh }}
          >
            <SlidersHorizontal className="w-4 h-4 shrink-0" style={{ color: scheme.onSurfaceVariant }} />
            <span className="text-[14px] truncate" style={{ color: scheme.onSurface }}>
              file:///android_asset/browser_home.html
            </span>
          </div>
          <button
            type="button"
            onClick={closeSourceBrowser}
            className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
            aria-label="Tùy chọn"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </header>

        {/* Browser Home Content mirroring browser_home.html */}
        <div
          className="flex-1 overflow-y-auto thin-scrollbar px-4 pt-4 pb-24"
          style={{ backgroundColor: pageBg, color: isDark ? '#eef1f6' : scheme.onSurface }}
        >
          {/* Search Input Pill */}
          <div
            className="h-12 rounded-full px-4 flex items-center gap-3 mb-4"
            style={{ backgroundColor: barBg }}
          >
            <Search className="w-[18px] h-[18px] shrink-0" style={{ color: isDark ? '#9aa2b1' : scheme.onSurfaceVariant }} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm kiếm..."
              className="flex-1 bg-transparent outline-none text-[15px]"
              style={{ color: isDark ? '#eef1f6' : scheme.onSurface }}
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} className="p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Count & Theme Row */}
          <div className="flex items-center justify-between mb-3.5 px-1">
            <span className="text-[14px]" style={{ color: isDark ? '#b4bccb' : scheme.onSurfaceVariant }}>
              <strong style={{ color: isDark ? '#ffffff' : scheme.onSurface }}>{items.length}</strong> / {RAW_SOURCES.length} nguồn
            </span>
            <div className="flex items-center gap-2">
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  style={{ color: scheme.primary }}
                  className="text-xs font-medium cursor-pointer"
                >
                  Đặt lại
                </button>
              )}
              <button
                type="button"
                onClick={() => setUiTheme(isDark ? UiTheme.LIGHT : UiTheme.DARK)}
                className="w-10 h-10 rounded-full border flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
                style={{
                  backgroundColor: barBg,
                  borderColor: cardBorder,
                  color: isDark ? '#e2e6ef' : scheme.onSurface,
                }}
                title="Đổi giao diện Sáng / Tối"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Single-Column Source Cards */}
          <div className="flex flex-col gap-3">
            {items.map((item) => {
              const tagColors =
                item.cat === 'Truyện Nhật'
                  ? { bg: isDark ? '#540d38' : '#ffd8eb', fg: isDark ? '#ff9dd1' : '#83004f' }
                  : item.cat === 'Truyện Anh'
                    ? { bg: isDark ? '#0a3a66' : '#cbe6ff', fg: isDark ? '#8ec8ff' : '#004d80' }
                    : item.cat === 'Truyện Việt'
                      ? { bg: isDark ? '#094324' : '#c4f3d0', fg: isDark ? '#7ceaa9' : '#00532b' }
                      : { bg: isDark ? '#523003' : '#ffe6cc', fg: isDark ? '#ffb866' : '#873600' };

              return (
                <div
                  key={item.domain}
                  className="rounded-[20px] px-3.5 py-3 border flex items-center justify-between gap-3"
                  style={{
                    backgroundColor: cardBg,
                    borderColor: cardBorder,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      selectWebSearchSource(item.domain);
                      closeSourceBrowser();
                    }}
                    className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer"
                  >
                    <SourceFavicon domain={item.domain} letter={item.letter} isDark={isDark} />
                    <div className="min-w-0">
                      <div className="text-[15px] font-semibold truncate">{item.domain}</div>
                      <span
                        className="inline-block text-[11px] font-medium px-2 py-0.5 rounded-[7px] mt-1"
                        style={{ backgroundColor: tagColors.bg, color: tagColors.fg }}
                      >
                        {item.cat}
                      </span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      closeSourceBrowser();
                      analyzeFromSearch(`https://${item.domain}/truyen/tac-pham-noi-bat`);
                    }}
                    className="w-11 h-11 rounded-[14px] flex items-center justify-center shrink-0 cursor-pointer active:scale-90 transition-transform"
                    style={{
                      backgroundColor: '#0a58ca',
                      color: '#ffffff',
                    }}
                    title={`Mở https://${item.domain}`}
                  >
                    <ExternalLink className="w-[18px] h-[18px]" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Floating Audio Waveform Bubble matching Android browser overlay */}
        {ui.activeStory && ui.activeStory.id !== '__empty__' && (
          <button
            type="button"
            aria-label="Mở trình phát"
            onClick={() => {
              closeSourceBrowser();
              openPlayer(ui.activeStory!);
            }}
            className="absolute right-4 w-14 h-14 rounded-full shadow-lg flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
            style={{
              bottom: 'max(1.25rem, var(--safe-bottom, env(safe-area-inset-bottom)))',
              backgroundColor: scheme.primaryContainer,
              color: scheme.onPrimaryContainer,
            }}
          >
            <AudioLines className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
};

const SourceFavicon: React.FC<{ domain: string; letter: string; isDark: boolean }> = ({
  domain,
  isDark,
}) => {
  const tileBg = isDark ? '#232830' : '#eef2f7';
  if (domain === 'aatruyen.net') {
    return (
      <div className="w-11 h-11 rounded-[12px] p-1 flex items-center justify-center shrink-0" style={{ backgroundColor: tileBg }}>
        <div translate="no" className="notranslate w-full h-full rounded-[8px] bg-[#1aa6b7] flex items-center justify-center text-[7px] font-bold text-white tracking-tight">
          AA TRUYỆN
        </div>
      </div>
    );
  }
  if (domain === 'aztruyen.top') {
    return (
      <div className="w-11 h-11 rounded-[12px] p-1 flex items-center justify-center shrink-0" style={{ backgroundColor: tileBg }}>
        <div className="w-full h-full rounded-[8px] bg-[#ffd54f] flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-[#1565c0]" />
        </div>
      </div>
    );
  }
  if (domain === 'docln.sbs') {
    return (
      <div className="w-11 h-11 rounded-[12px] p-1 flex items-center justify-center shrink-0" style={{ backgroundColor: tileBg }}>
        <div translate="no" className="notranslate w-full h-full rounded-[8px] bg-[#f4b942] flex items-center justify-center text-xs font-extrabold text-[#9e1c20]">
          LN
        </div>
      </div>
    );
  }
  if (domain === 'inkitt.com') {
    return (
      <div className="w-11 h-11 rounded-[12px] p-1 flex items-center justify-center shrink-0" style={{ backgroundColor: tileBg }}>
        <div translate="no" className="notranslate w-full h-full rounded-[8px] bg-[#111318] flex items-center justify-center font-serif text-lg font-bold text-white">
          I
        </div>
      </div>
    );
  }
  if (domain === 'www.chivi.app') {
    return (
      <div className="w-11 h-11 rounded-[12px] p-1 flex items-center justify-center shrink-0" style={{ backgroundColor: tileBg }}>
        <div className="w-full h-full rounded-[8px] bg-[#cde2d8] flex items-center justify-center font-bold text-sm text-[#2e4c41]">
          字
        </div>
      </div>
    );
  }

  return (
    <div className="w-11 h-11 rounded-[12px] flex items-center justify-center shrink-0" style={{ backgroundColor: tileBg }}>
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#e2e8f0] to-[#94a3b8] flex items-center justify-center shadow-inner">
        <Globe className="w-4 h-4 text-[#475569]" />
      </div>
    </div>
  );
};
