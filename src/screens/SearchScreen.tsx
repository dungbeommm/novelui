import React, { useMemo, useState } from 'react';
import {
  Check,
  ChevronDown,
  Globe,
  Info,
  Link2,
  Play,
  Plus,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { WebSearchHit } from '../model/types';
import { placeholderStory } from '../model/mockData';
import { CoverDefaults } from '../model/storyIds';
import { usePlayer } from '../state/usePlayerStore';
import { CoverArt } from '../components/CoverArt';
import { SwipeableBottomSheet } from '../components/SwipeableBottomSheet';

export const SearchScreen: React.FC = () => {
  const {
    ui,
    scheme,
    setSearchQuery,
    selectWebSearchSource,
    searchWeb,
    loadWebSuggestions,
    playFirstChapter,
    analyzeFromSearch,
    isLinkQuery,
    openSourceBrowser,
    setWikiCvLoggedIn,
  } = usePlayer();

  const [sourceSheetOpen, setSourceSheetOpen] = useState(false);

  const q = ui.searchQuery;
  const isLink = isLinkQuery(q);
  const selectedClean = ui.selectedWebSearchSource.replace(/^www\./, '');
  const hasMini = Boolean(ui.activeStory && ui.activeStory.id !== placeholderStory.id && ui.hiddenMiniPlayerStoryId !== ui.activeStory.id);
  const bottomInset = hasMini ? 196 : 110;

  const submitSearch = () => {
    if (isLink) analyzeFromSearch(q);
    else if (q.trim()) searchWeb(q);
  };

  const sortedSources = useMemo(() => {
    return [...new Set(ui.webSearchSources)].sort((a, b) =>
      a === ui.selectedWebSearchSource ? -1 : b === ui.selectedWebSearchSource ? 1 : 0,
    );
  }, [ui.webSearchSources, ui.selectedWebSearchSource]);

  const exactCount = ui.webResults.filter((h) => h.exact).length;

  return (
    <div className="h-full flex flex-col">
      {/* Pinned Top Controls */}
      <div className="px-[18px] pt-3.5 pb-1.5 shrink-0">
        <h1 className="text-2xl font-bold mb-4" style={{ color: scheme.onSurface }}>
          Tìm kiếm
        </h1>

      {/* Pill Search Field */}
      <div
        className="h-14 rounded-full px-4 flex items-center gap-3 mb-3 transition-colors"
        style={{ backgroundColor: scheme.surfaceContainerHigh }}
      >
        <Search className="w-5 h-5 shrink-0" style={{ color: scheme.primary }} />
        <input
          type="text"
          value={q}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submitSearch();
          }}
          placeholder="Nhập tên truyện, tác giả hoặc dán link"
          className="flex-1 bg-transparent outline-none text-sm"
          style={{ color: scheme.onSurface }}
        />
        {q && (
          <button type="button" onClick={() => setSearchQuery('')} className="p-1.5 rounded-full cursor-pointer">
            <X className="w-4 h-4" style={{ color: scheme.onSurfaceVariant }} />
          </button>
        )}
      </div>

      {/* Source Picker + Browser Shortcut */}
      <div className="flex items-center gap-3 mb-2">
        <button
          type="button"
          onClick={() => setSourceSheetOpen(true)}
          className="flex-1 h-14 rounded-2xl px-3 flex items-center gap-2.5 cursor-pointer"
          style={{ backgroundColor: scheme.secondaryContainer, color: scheme.onSecondaryContainer }}
        >
          <SourceBadge domain={ui.selectedWebSearchSource} size={28} />
          <span className="flex-1 text-left text-[15px] font-semibold truncate">
            Nguồn: {selectedClean || 'Chọn web'}
          </span>
          <ChevronDown className="w-5 h-5 shrink-0" />
        </button>

        <button
          type="button"
          aria-label="Mở trình duyệt"
          onClick={() => openSourceBrowser()}
          className="w-[52px] h-[52px] rounded-[17px] flex items-center justify-center shrink-0 cursor-pointer transition active:scale-95"
          style={{ backgroundColor: scheme.primaryContainer, color: scheme.onPrimaryContainer }}
        >
          <Globe className="w-7 h-7" />
        </button>
      </div>

      {/* WikiCV Login Prompt */}
      {selectedClean === 'wikicv.org' && (
        <div className="pl-2 mb-2">
          {!ui.wikiCvLoggedIn ? (
            <>
              <button
                type="button"
                onClick={() => setWikiCvLoggedIn(true)}
                className="inline-flex items-center gap-1.5 text-sm font-medium py-1 cursor-pointer"
                style={{ color: scheme.primary }}
              >
                <Globe className="w-4 h-4" />
                <span>Đăng nhập / quản lý tài khoản trong app</span>
              </button>
              <p className="text-[11px]" style={{ color: scheme.onSurfaceVariant }}>
                Phiên đăng nhập WikiCV được lưu trong app và dùng chung khi tìm, mở và đọc truyện.
              </p>
            </>
          ) : (
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs font-medium" style={{ color: scheme.primary }}>
                Đã kết nối tài khoản WikiCV
              </span>
              <button
                type="button"
                onClick={() => setWikiCvLoggedIn(false)}
                className="text-xs underline cursor-pointer"
                style={{ color: scheme.onSurfaceVariant }}
              >
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      )}

        {!isLink && !q.trim() && (
          <div className="flex items-center justify-between pt-2 pb-1">
            <h2 className="text-base font-medium">Đề xuất từ {selectedClean || 'web'}</h2>
            <button
              type="button"
              onClick={loadWebSuggestions}
              disabled={ui.webSuggestionsLoading}
              className="p-2 rounded-full cursor-pointer"
              aria-label="Tải lại đề xuất"
            >
              <RefreshCw className={`w-4 h-4 ${ui.webSuggestionsLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        )}

        {!isLink && q.trim() && (
          <div className="pt-2 pb-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-[18px] h-[18px]" style={{ color: scheme.primary }} />
                <span className="text-sm font-semibold">Kết quả từ web</span>
              </div>
              {ui.webSearching ? (
                <div
                  className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: scheme.primary, borderTopColor: 'transparent' }}
                />
              ) : (
                <button type="button" onClick={() => searchWeb(q)} className="p-1 cursor-pointer" aria-label="Tìm lại">
                  <RefreshCw className="w-4 h-4" style={{ color: scheme.onSurfaceVariant }} />
                </button>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {exactCount > 0 && <Pill text={`${exactCount} đúng tên`} color={scheme.primary} />}
              {ui.webResults.length > 0 && <Pill text={`${ui.webResults.length} kết quả`} color={scheme.onSurfaceVariant} />}
              {ui.webSearching ? (
                <Pill
                  text={ui.webSitesSearched > 0 ? `Đang quét ${ui.webSitesSearched} nguồn` : 'Đang quét…'}
                  color={scheme.tertiary}
                />
              ) : (
                ui.webSitesSearched > 0 && <Pill text={`${ui.webSitesSearched} nguồn`} color={scheme.onSurfaceVariant} />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Scrollable Stories Area */}
      <div
        className="flex-1 min-h-0 overflow-y-auto thin-scrollbar px-[18px] pt-1"
        style={{ paddingBottom: `calc(${bottomInset}px + var(--safe-bottom, env(safe-area-inset-bottom)))` }}
      >
      {isLink ? (
        <div className="rounded-2xl p-4 mt-2" style={{ backgroundColor: scheme.surfaceContainer }}>
          <div className="flex items-center gap-2.5">
            <Link2 className="w-5 h-5" style={{ color: scheme.primary }} />
            <span className="text-sm font-semibold">Đây là một liên kết</span>
          </div>
          <p className="text-xs mt-1.5 line-clamp-2 break-all" style={{ color: scheme.onSurfaceVariant }}>
            {q}
          </p>
          <button
            type="button"
            onClick={() => analyzeFromSearch(q)}
            className="w-full mt-3 h-11 rounded-full flex items-center justify-center gap-2 text-sm font-medium cursor-pointer"
            style={{ backgroundColor: scheme.primary, color: scheme.onPrimary }}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Phân tích và nghe ngay</span>
          </button>
        </div>
      ) : !q.trim() ? (
        <div className="space-y-2.5">
          {ui.webSuggestionsLoading
            ? [0, 1, 2].map((i) => <SkeletonRow key={i} />)
            : ui.webSuggestions.map((hit) => (
                <WebHitCard
                  key={hit.url}
                  hit={hit}
                  opening={ui.webOpeningUrl === hit.url}
                  onPlay={() => playFirstChapter(hit)}
                  onOpenLink={() => analyzeFromSearch(hit.url)}
                />
              ))}
        </div>
      ) : (
        <div className="space-y-2.5">
          {ui.webSearching && ui.webResults.length === 0 ? (
            [0, 1, 2].map((i) => <SkeletonRow key={i} />)
          ) : ui.webResults.length > 0 ? (
            ui.webResults.map((hit) => (
              <WebHitCard
                key={hit.url}
                hit={hit}
                opening={ui.webOpeningUrl === hit.url}
                onPlay={() => playFirstChapter(hit)}
                onOpenLink={() => analyzeFromSearch(hit.url)}
              />
            ))
          ) : (
            <div className="pt-8 flex flex-col items-center text-center">
              <div className="p-3 rounded-full mb-3" style={{ backgroundColor: `${scheme.primary}1a`, color: scheme.primary }}>
                <Info className="w-5 h-5" />
              </div>
              <div className="text-sm font-semibold">Nhấn Enter để tìm “{q}” trên {selectedClean}</div>
              <button
                type="button"
                onClick={() => searchWeb(q)}
                className="mt-3.5 px-5 py-2 rounded-full border text-sm font-medium inline-flex items-center gap-2 cursor-pointer"
                style={{ borderColor: scheme.outlineVariant, color: scheme.primary }}
              >
                <Search className="w-4 h-4" />
                <span>Tìm trên web</span>
              </button>
            </div>
          )}
        </div>
      )}
      </div>

      {/* SearchSourceSheet Modal */}
      {sourceSheetOpen && (
        <SwipeableBottomSheet
          onClose={() => setSourceSheetOpen(false)}
          backgroundColor={scheme.surface}
          textColor={scheme.onSurface}
          handleColor={scheme.outlineVariant}
          className="max-h-[80dvh] rounded-t-[28px]"
        >
          <div className="px-4 pb-5 pt-1 flex flex-col min-h-0 flex-auto overflow-hidden">
            <div className="flex items-center mb-3.5 shrink-0">
              <div className="flex-1">
                <h3 className="text-[22px] font-medium">Chọn nguồn tìm kiếm</h3>
                <p className="text-[13px] mt-0.5" style={{ color: scheme.onSurfaceVariant }}>
                  {ui.webSearchSources.length} nguồn · Chạm để chọn nhanh
                </p>
              </div>
              <button type="button" onClick={() => setSourceSheetOpen(false)} className="p-2 cursor-pointer" aria-label="Đóng">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-auto min-h-0 overflow-y-auto thin-scrollbar grid grid-cols-2 gap-2.5 content-start auto-rows-max pb-3">
              {sortedSources.map((domain) => {
                const isSelected = domain === ui.selectedWebSearchSource;
                return (
                  <button
                    key={domain}
                    type="button"
                    onClick={() => {
                      selectWebSearchSource(domain);
                      setSourceSheetOpen(false);
                    }}
                    className="w-full min-w-0 rounded-[18px] px-2.5 py-3 border-[1.5px] flex items-center gap-2 text-left cursor-pointer transition active:scale-[0.98]"
                    style={{
                      backgroundColor: isSelected ? scheme.primaryContainer : scheme.surfaceContainerLowest,
                      color: isSelected ? scheme.onPrimaryContainer : scheme.onSurface,
                      borderColor: isSelected ? scheme.primary : scheme.outlineVariant,
                    }}
                  >
                    <SourceBadge domain={domain} size={32} />
                    <div translate="no" className="flex-1 min-w-0 text-[13px] font-medium truncate notranslate">
                      {domain.replace(/^www\./, '')}
                    </div>
                    {isSelected && <Check className="w-4 h-4 shrink-0" style={{ color: scheme.primary }} />}
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t shrink-0" style={{ borderColor: scheme.outlineVariant }}>
              <button
                type="button"
                onClick={() => {
                  setSourceSheetOpen(false);
                  openSourceBrowser();
                }}
                className="w-full h-11 rounded-full border flex items-center justify-center gap-2 text-sm font-medium cursor-pointer active:scale-[0.99] transition"
                style={{ borderColor: scheme.outlineVariant, color: scheme.onSurface }}
              >
                <Plus className="w-4 h-4" />
                <span>Thêm nguồn bằng trình duyệt</span>
              </button>
            </div>
          </div>
        </SwipeableBottomSheet>
      )}
    </div>
  );
};

const SourceBadge: React.FC<{ domain: string; size?: number }> = ({ domain, size = 28 }) => {
  const { scheme } = usePlayer();
  const clean = domain.replace(/^www\./, '').toLowerCase();
  const initial = (clean[0] || '?').toUpperCase();

  // Sites that display stylized book/layers emblems in the Android source sheet
  if (clean.includes('metruyenchuvn')) {
    return (
      <div
        className="rounded-[11px] flex items-center justify-center shrink-0"
        style={{ width: size, height: size, backgroundColor: scheme.primaryContainer, color: scheme.primary }}
      >
        <svg viewBox="0 0 24 24" className="w-[58%] h-[58%]" fill="currentColor">
          <path d="M18 4H8a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h10a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1Zm-1 13H8V6h9v11Z" />
          <path d="M5 7H4v11a2 2 0 0 0 2 2h11v-1H6a1 1 0 0 1-1-1V7Z" />
        </svg>
      </div>
    );
  }
  if (clean.includes('truyendich')) {
    return (
      <div
        className="rounded-[11px] flex items-center justify-center shrink-0"
        style={{ width: size, height: size, backgroundColor: scheme.primaryContainer, color: scheme.primary }}
      >
        <svg viewBox="0 0 24 24" className="w-[58%] h-[58%]" fill="currentColor">
          <path d="M12 6.5c-2.2-1.4-5-1.5-7.5-.7-.6.2-1 .7-1 1.4v10.2c0 .9.9 1.6 1.8 1.3 2.2-.7 4.7-.6 6.7.6 2-.2 4.5-1.3 6.7-.6.9.3 1.8-.4 1.8-1.3V7.2c0-.7-.4-1.2-1-1.4-2.5-.8-5.3-.7-7.5.7Z" />
        </svg>
      </div>
    );
  }
  if (clean.includes('truyennet')) {
    return (
      <div
        className="rounded-[11px] flex items-center justify-center shrink-0"
        style={{ width: size, height: size, backgroundColor: scheme.primaryContainer, color: scheme.primary }}
      >
        <svg viewBox="0 0 24 24" className="w-[58%] h-[58%]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 5v10l9 4" />
          <path d="M10 4v9l8 3.5" />
          <path d="M14 4v7l5 2" />
        </svg>
      </div>
    );
  }

  return (
    <div
      translate="no"
      className="notranslate rounded-[11px] flex items-center justify-center shrink-0 border-[1.75px] p-[2px] overflow-hidden"
      style={{
        width: size,
        height: size,
        borderColor: scheme.primary,
        color: scheme.primary,
      }}
    >
      <div
        translate="no"
        className="notranslate w-full h-full rounded-full border-[1.5px] flex items-center justify-center font-bold leading-none overflow-hidden"
        style={{ borderColor: scheme.primary, fontSize: Math.max(11, Math.round(size * 0.44)) }}
      >
        <span translate="no" className="notranslate">
          {initial}
        </span>
      </div>
    </div>
  );
};

const Pill: React.FC<{ text: string; color: string }> = ({ text, color }) => (
  <span
    className="text-[11px] font-medium px-2.5 py-0.5 rounded-full"
    style={{ backgroundColor: `${color}24`, color }}
  >
    {text}
  </span>
);

const WebHitCard: React.FC<{
  hit: WebSearchHit;
  opening: boolean;
  onPlay: () => void;
  onOpenLink: () => void;
}> = ({ hit, opening, onPlay, onOpenLink }) => {
  const { scheme } = usePlayer();
  return (
    <div
      onClick={() => !opening && onPlay()}
      className="rounded-[20px] p-2.5 flex items-center gap-3 cursor-pointer transition active:scale-[0.99]"
      style={{
        backgroundColor: hit.exact ? `${scheme.primary}12` : scheme.surfaceContainerLow,
      }}
    >
      <CoverArt
        colorHex={CoverDefaults.colorForKey(hit.url)}
        imageUrl={hit.coverUrl}
        fallbackKey={hit.url}
        className="w-16 h-[84px] rounded-xl shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium line-clamp-2" style={{ color: scheme.onSurface }}>
          {hit.title}
        </div>
        {hit.author && (
          <div className="text-xs truncate mt-0.5" style={{ color: scheme.onSurfaceVariant }}>
            {hit.author}
          </div>
        )}
        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          {hit.exact ? (
            <Pill text="Đúng tên" color={scheme.primary} />
          ) : (
            hit.matchLabel && <Pill text={hit.matchLabel} color={scheme.onSurfaceVariant} />
          )}
          {hit.source && (
            <span className="text-[11px] truncate" style={{ color: scheme.onSurfaceVariant }}>
              {hit.source}
            </span>
          )}
          {hit.mirrors.length > 0 && (
            <span className="text-[11px]" style={{ color: scheme.onSurfaceVariant }}>
              +{hit.mirrors.length} nguồn
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        aria-label="Xem liên kết"
        onClick={(e) => {
          e.stopPropagation();
          onOpenLink();
        }}
        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 cursor-pointer"
        style={{ color: scheme.onSurfaceVariant }}
      >
        <Link2 className="w-[18px] h-[18px]" />
      </button>

      {opening ? (
        <div className="w-12 h-12 flex items-center justify-center shrink-0">
          <div
            className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: scheme.primary, borderTopColor: 'transparent' }}
          />
        </div>
      ) : (
        <button
          type="button"
          aria-label="Nghe chương 1"
          onClick={(e) => {
            e.stopPropagation();
            onPlay();
          }}
          className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 cursor-pointer"
          style={{ backgroundColor: scheme.primary, color: scheme.onPrimary }}
        >
          <Play className="w-5 h-5 fill-current ml-0.5" />
        </button>
      )}
    </div>
  );
};

const SkeletonRow: React.FC = () => {
  const { scheme } = usePlayer();
  return (
    <div
      className="rounded-2xl p-2.5 flex items-center gap-3 opacity-60"
      style={{ backgroundColor: scheme.surfaceContainerLow }}
    >
      <div className="w-14 h-14 rounded-lg shrink-0" style={{ backgroundColor: `${scheme.onSurface}1a` }} />
      <div className="flex-1 space-y-2">
        <div className="w-3/4 h-3.5 rounded-full" style={{ backgroundColor: `${scheme.onSurface}1a` }} />
        <div className="w-1/2 h-3 rounded-full" style={{ backgroundColor: `${scheme.onSurface}1a` }} />
      </div>
    </div>
  );
};
