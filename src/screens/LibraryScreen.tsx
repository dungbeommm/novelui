import React, { useRef, useState } from 'react';
import { BookMarked, BookOpen, Check, ClipboardPaste, MoreVertical, Trash2, Upload } from 'lucide-react';
import { StorySourceType } from '../model/types';
import { placeholderStory } from '../model/mockData';
import { usePlayer } from '../state/usePlayerStore';
import { CoverArt } from '../components/CoverArt';

export const LibraryScreen: React.FC = () => {
  const { ui, scheme, libraryStories, setLibFilter, openPaste, openPlayer, askDelete, importEpubFile } = usePlayer();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const stories = libraryStories();
  const readingCount = ui.historyItems.filter((h) => h.id !== placeholderStory.id && h.progress > 0).length;
  const hasMini = Boolean(ui.activeStory && ui.activeStory.id !== placeholderStory.id && ui.hiddenMiniPlayerStoryId !== ui.activeStory.id);
  const bottomInset = hasMini ? 196 : 110;

  return (
    <div className="h-full flex flex-col relative">
      <input
        ref={fileInputRef}
        type="file"
        accept=".epub,application/epub+zip"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) importEpubFile(f);
          e.target.value = '';
        }}
      />

      {/* Header */}
      <div className="px-[18px] pt-3.5 shrink-0">
        <div className="flex items-center">
          <div className="flex-1">
            <h1 className="text-[26px] font-bold leading-tight" style={{ color: scheme.onSurface }}>
              Thư viện
            </h1>
            <p className="text-sm mt-0.5" style={{ color: scheme.onSurfaceVariant }}>
              {ui.libraryItems.length} truyện · {readingCount} đang nghe
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Nhập EPUB"
              aria-label="Nhập EPUB"
              className="w-11 h-11 rounded-full flex items-center justify-center cursor-pointer transition active:scale-95"
              style={{ backgroundColor: scheme.secondaryContainer, color: scheme.onSecondaryContainer }}
            >
              <Upload className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={openPaste}
              title="Dán liên kết"
              aria-label="Dán liên kết"
              className="w-11 h-11 rounded-full flex items-center justify-center cursor-pointer transition active:scale-95"
              style={{ backgroundColor: scheme.primaryContainer, color: scheme.onPrimaryContainer }}
            >
              <ClipboardPaste className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex gap-2 mt-4 mb-3.5">
          {[
            { id: 'all' as const, label: 'Tất cả', count: ui.libraryItems.length },
            { id: 'reading' as const, label: 'Đang nghe', count: readingCount },
          ].map((f) => {
            const selected = ui.libFilter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setLibFilter(f.id)}
                className="px-3.5 py-1.5 rounded-full text-sm font-medium border inline-flex items-center gap-1.5 cursor-pointer transition"
                style={{
                  backgroundColor: selected ? scheme.secondaryContainer : 'transparent',
                  color: selected ? scheme.onSecondaryContainer : scheme.onSurfaceVariant,
                  borderColor: selected ? 'transparent' : scheme.outlineVariant,
                }}
              >
                {selected && <Check className="w-4 h-4" />}
                <span>
                  {f.label} {f.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid or Empty State */}
      <div
        className="flex-1 overflow-y-auto thin-scrollbar px-4"
        style={{ paddingBottom: `calc(${bottomInset}px + var(--safe-bottom, env(safe-area-inset-bottom)))` }}
      >
        {stories.length === 0 ? (
          <div className="h-full flex items-center justify-center px-2">
            <div
              className="w-full max-w-sm rounded-[28px] border px-7 py-8 flex flex-col items-center text-center"
              style={{
                backgroundColor: `${scheme.surfaceVariant}6b`,
                borderColor: `${scheme.outlineVariant}8c`,
              }}
            >
              <div
                className="w-[76px] h-[76px] rounded-3xl flex items-center justify-center mb-4"
                style={{ backgroundColor: scheme.primaryContainer, color: scheme.onPrimaryContainer }}
              >
                <BookMarked className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold">Bắt đầu thư viện của bạn</h3>
              <p className="text-sm mt-1.5 mb-5" style={{ color: scheme.onSurfaceVariant }}>
                Dán liên kết truyện online hoặc nhập sách EPUB từ thiết bị.
              </p>
              <button
                type="button"
                onClick={openPaste}
                className="w-full h-11 rounded-full flex items-center justify-center gap-2 text-sm font-medium cursor-pointer mb-2"
                style={{ backgroundColor: scheme.primary, color: scheme.onPrimary }}
              >
                <ClipboardPaste className="w-[18px] h-[18px]" />
                <span>Dán liên kết</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-11 rounded-full border flex items-center justify-center gap-2 text-sm font-medium cursor-pointer"
                style={{ borderColor: scheme.outlineVariant, color: scheme.primary }}
              >
                <Upload className="w-[18px] h-[18px]" />
                <span>Nhập EPUB</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3.5">
            {stories.map((story) => {
              const menuOpen = menuOpenId === story.id;
              return (
                <div
                  key={story.id}
                  onClick={() => openPlayer(story)}
                  className="cursor-pointer group relative min-w-0"
                >
                  <div className="relative">
                    <CoverArt
                      colorHex={story.color}
                      imageUrl={story.coverUrl}
                      fallbackKey={story.id}
                      className="w-full aspect-[0.70] rounded-[20px] transition-transform group-active:scale-[0.98]"
                    />
                    {story.sourceType === StorySourceType.EPUB && (
                      <div
                        className="absolute top-2.5 left-2.5 px-2 py-1 rounded-[9px] inline-flex items-center gap-1 text-[11px] font-medium backdrop-blur-sm"
                        style={{ backgroundColor: `${scheme.surface}eb`, color: scheme.onSurface }}
                      >
                        <BookOpen className="w-3 h-3" />
                        <span>EPUB</span>
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <button
                        type="button"
                        aria-label="Tuỳ chọn truyện"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenId(menuOpen ? null : story.id);
                        }}
                        className="w-10 h-10 rounded-[13px] flex items-center justify-center cursor-pointer shadow-sm active:scale-90 transition-transform"
                        style={{ backgroundColor: scheme.secondaryContainer, color: scheme.onSecondaryContainer }}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {menuOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-20"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuOpenId(null);
                            }}
                          />
                          <div
                            className="absolute right-0 mt-1.5 w-44 rounded-2xl py-1.5 shadow-xl z-30 border"
                            style={{
                              backgroundColor: scheme.surfaceContainerHigh,
                              borderColor: scheme.outlineVariant,
                            }}
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setMenuOpenId(null);
                                askDelete(story);
                              }}
                              className="w-full px-3.5 py-2.5 flex items-center gap-2.5 text-sm font-medium text-left cursor-pointer"
                              style={{ color: scheme.error }}
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Xoá khỏi thư viện</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="pt-2 px-1 pb-2.5">
                    <div
                      className="text-sm font-semibold truncate text-center"
                      style={{ color: scheme.onSurface }}
                    >
                      {story.title}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
