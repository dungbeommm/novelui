import React, { useEffect, useState } from 'react';
import { ArrowRight, Headphones, Link2, Play, Settings, X } from 'lucide-react';
import { Story, StorySourceType, Tab } from '../model/types';
import { placeholderStory } from '../model/mockData';
import { usePlayer } from '../state/usePlayerStore';
import { AppLogo } from '../components/AppLogo';
import { CoverArt } from '../components/CoverArt';

const getStoryWebLabel = (story: Story): string => {
  if (story.sourceType === StorySourceType.EPUB) return 'EPUB';
  const raw = (story.source || '').trim();
  if (raw) return raw.replace(/^www\./, '');
  if (story.storyUrl) {
    try {
      return new URL(story.storyUrl).hostname.replace(/^www\./, '');
    } catch {
      // ignore invalid url
    }
  }
  return story.author;
};

export const HomeScreen: React.FC = () => {
  const {
    ui,
    scheme,
    setTab,
    setLibFilter,
    openPaste,
    openPlayer,
    analyzeFromSearch,
    isLinkQuery,
    historyStories,
    allStories,
    trendingStories,
  } = usePlayer();

  const [clipboardLink, setClipboardLink] = useState<string | null>(null);

  useEffect(() => {
    // Check clipboard safely if permission already granted
    if (navigator.permissions?.query) {
      navigator.permissions
        .query({ name: 'clipboard-read' as PermissionName })
        .then((res) => {
          if (res.state === 'granted') {
            navigator.clipboard.readText().then((txt) => {
              const trimmed = txt.trim();
              if (isLinkQuery(trimmed)) setClipboardLink(trimmed);
            }).catch(() => {});
          }
        })
        .catch(() => {});
    }
  }, [isLinkQuery]);

  const continuation =
    (ui.activeStory && ui.activeStory.id !== placeholderStory.id ? ui.activeStory : null) ??
    historyStories()[0] ??
    allStories()[0] ??
    placeholderStory;

  const explore = allStories();
  const trending = trendingStories();
  const hasMini = Boolean(ui.activeStory && ui.activeStory.id !== placeholderStory.id && ui.hiddenMiniPlayerStoryId !== ui.activeStory.id);
  const bottomInset = hasMini ? 196 : 110;
  const isEmpty = continuation.id === placeholderStory.id;

  return (
    <div
      className="h-full overflow-y-auto thin-scrollbar px-[18px] pt-3.5"
      style={{ paddingBottom: `calc(${bottomInset}px + var(--safe-bottom, env(safe-area-inset-bottom)))` }}
    >
      {/* HomeHeader */}
      <header className="flex items-center">
        <div
          className="w-[52px] h-[52px] rounded-[17px] flex items-center justify-center shrink-0"
          style={{ backgroundColor: scheme.primaryContainer, color: scheme.onPrimaryContainer }}
        >
          <AppLogo className="w-[30px] h-[30px]" />
        </div>
        <h1 className="flex-1 ml-3.5 text-2xl font-bold tracking-tight" style={{ color: scheme.onSurface }}>
          NovelBook
        </h1>
        <button
          type="button"
          onClick={() => setTab(Tab.SETTINGS)}
          aria-label="Cài đặt"
          className="w-12 h-12 rounded-2xl flex items-center justify-center transition active:scale-95 cursor-pointer"
          style={{ backgroundColor: scheme.secondaryContainer, color: scheme.onSecondaryContainer }}
        >
          <Settings className="w-5 h-5" />
        </button>
      </header>

      {/* ClipboardLinkCard */}
      {clipboardLink && (
        <div
          className="mt-4 rounded-[18px] px-3 py-2.5 flex items-center gap-2.5"
          style={{ backgroundColor: scheme.secondaryContainer, color: scheme.onSecondaryContainer }}
        >
          <Link2 className="w-5 h-5 shrink-0" />
          <span className="flex-1 text-sm font-medium truncate">Đã tìm thấy liên kết trong bộ nhớ</span>
          <button
            type="button"
            onClick={() => {
              analyzeFromSearch(clipboardLink);
              setClipboardLink(null);
            }}
            className="text-sm font-semibold px-2.5 py-1 cursor-pointer"
            style={{ color: scheme.primary }}
          >
            Mở
          </button>
          <button
            type="button"
            onClick={() => setClipboardLink(null)}
            className="p-1.5 rounded-full cursor-pointer"
            aria-label="Bỏ qua"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* AddStoryCard */}
      <div className={clipboardLink ? 'mt-3' : 'mt-6'}>
        <button
          type="button"
          onClick={openPaste}
          className="w-full rounded-[28px] p-[18px] flex items-center text-left transition active:scale-[0.99] cursor-pointer"
          style={{ backgroundColor: scheme.primaryContainer, color: scheme.onPrimaryContainer }}
        >
          <div
            className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${scheme.onPrimaryContainer}1a` }}
          >
            <Link2 className="w-[26px] h-[26px]" />
          </div>
          <div className="flex-1 min-w-0 ml-3.5">
            <div className="text-base font-semibold">Thêm truyện từ liên kết</div>
            <div className="text-[12.5px] opacity-85 mt-0.5">
              Dán link, app tự tải chương và chuẩn bị giọng đọc.
            </div>
          </div>
        </button>
      </div>

      {/* Section: Tiếp tục nghe */}
      <section className="mt-5">
        <h2 className="text-base font-medium mb-3" style={{ color: scheme.onSurface }}>
          Tiếp tục nghe
        </h2>
        <div
          onClick={() => (isEmpty ? openPaste() : openPlayer(continuation))}
          className="w-full rounded-[28px] p-3.5 flex items-center gap-4 cursor-pointer transition active:scale-[0.99]"
          style={{ backgroundColor: scheme.surfaceContainerLow }}
        >
          <CoverArt
            colorHex={continuation.color}
            imageUrl={continuation.coverUrl}
            fallbackKey={continuation.id}
            className="w-24 h-[122px] rounded-2xl shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <Headphones className="w-4 h-4" style={{ color: scheme.primary }} />
              <span className="text-[11px] font-bold tracking-wider" style={{ color: scheme.primary }}>
                {isEmpty ? 'BẮT ĐẦU' : 'ĐANG NGHE'}
              </span>
            </div>
            <div
              className="text-[20px] leading-snug font-semibold mt-1.5 line-clamp-2"
              style={{ color: scheme.onSurface }}
            >
              {continuation.title}
            </div>
            <div className="text-xs mt-1 truncate" style={{ color: scheme.onSurfaceVariant }}>
              {isEmpty
                ? 'Dán liên kết truyện đầu tiên'
                : `Chương ${continuation.currentChapter}${continuation.totalChapters > 0 ? `/${continuation.totalChapters}` : ''}`}
            </div>
            <div className="w-full h-[5px] rounded-full overflow-hidden mt-3.5" style={{ backgroundColor: scheme.surfaceVariant }}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${isEmpty ? 0 : Math.round(Math.min(1, Math.max(0, continuation.progress)) * 100)}%`,
                  backgroundColor: scheme.primary,
                }}
              />
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (isEmpty) openPaste();
                else openPlayer(continuation);
              }}
              className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium cursor-pointer"
              style={{ backgroundColor: scheme.secondaryContainer, color: scheme.onSecondaryContainer }}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isEmpty ? 'Thêm truyện' : 'Nghe tiếp'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Section: Tủ sách của bạn */}
      {explore.length > 0 && (
        <section className="mt-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-medium" style={{ color: scheme.onSurface }}>
              Tủ sách của bạn
            </h2>
            <button
              type="button"
              onClick={() => {
                setLibFilter('all');
                setTab(Tab.LIBRARY);
              }}
              className="inline-flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-full cursor-pointer active:scale-95 transition-transform"
              style={{ backgroundColor: scheme.primaryContainer, color: scheme.onPrimaryContainer }}
            >
              <span>Xem tất cả</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div
            data-no-tab-swipe
            className="flex gap-3.5 overflow-x-auto no-scrollbar pb-1 snap-x snap-mandatory touch-pan-x"
          >
            {explore.map((story) => (
              <button
                key={story.id}
                type="button"
                onClick={() => openPlayer(story)}
                className="w-36 shrink-0 text-left cursor-pointer group snap-start"
              >
                <CoverArt
                  colorHex={story.color}
                  imageUrl={story.coverUrl}
                  fallbackKey={story.id}
                  className="w-36 h-[184px] rounded-2xl transition-transform group-active:scale-95"
                />
                <div
                  className="text-sm font-semibold mt-2 truncate text-center"
                  style={{ color: scheme.onSurface }}
                >
                  {story.title}
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Section: Được nghe gần đây */}
      {trending.length > 0 && (
        <section className="mt-5">
          <h2 className="text-base font-medium mb-3" style={{ color: scheme.onSurface }}>
            Được nghe gần đây
          </h2>
          <div className="space-y-2">
            {trending.slice(0, 3).map((story, idx) => {
              const isTop = idx === 0;
              return (
                <div
                  key={story.id}
                  onClick={() => openPlayer(story)}
                  className="rounded-[20px] px-3 py-2.5 flex items-center gap-3 cursor-pointer transition-transform active:scale-[0.985]"
                  style={{
                    backgroundColor: scheme.surfaceContainerLow,
                  }}
                >
                  <div
                    className="w-7 h-7 rounded-[10px] flex items-center justify-center text-xs font-bold tabular-nums shrink-0"
                    style={{
                      backgroundColor: isTop ? scheme.primaryContainer : scheme.surfaceContainerHigh,
                      color: isTop ? scheme.onPrimaryContainer : scheme.onSurfaceVariant,
                    }}
                  >
                    {idx + 1}
                  </div>
                  <CoverArt
                    colorHex={story.color}
                    imageUrl={story.coverUrl}
                    fallbackKey={story.id}
                    className="w-11 h-[56px] rounded-[11px] shrink-0 shadow-sm"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-semibold truncate leading-snug" style={{ color: scheme.onSurface }}>
                      {story.title}
                    </div>
                    <div className="text-xs truncate mt-0.5" style={{ color: scheme.onSurfaceVariant }}>
                      <span translate="no" className="notranslate">
                        {getStoryWebLabel(story)}
                      </span>
                      {story.totalChapters > 0 ? ` · ${story.totalChapters} chương` : ''}
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label="Phát"
                    onClick={(e) => {
                      e.stopPropagation();
                      openPlayer(story);
                    }}
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 cursor-pointer transition-transform active:scale-90"
                    style={{
                      backgroundColor: isTop ? scheme.primary : scheme.primaryContainer,
                      color: isTop ? scheme.onPrimary : scheme.onPrimaryContainer,
                    }}
                  >
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};
