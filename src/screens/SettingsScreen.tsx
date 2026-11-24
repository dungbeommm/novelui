import React, { useRef, useState } from 'react';
import {
  ArrowLeft,
  BarChart3,
  BookOpenText,
  Check,
  CheckCircle2,
  ChevronRight,
  CloudDownload,
  DatabaseBackup,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  Flame,
  Globe,
  HardDrive,
  HardDriveUpload,
  Image as ImageIcon,
  Info,
  KeyRound,
  Lock,
  Mic,
  Moon,
  Palette,
  Puzzle,
  RefreshCw,
  Send,
  Server,
  Shield,
  Smartphone,
  Sparkles,
  Sun,
  Trash2,
  Upload,
  User,
  Volume2,
  Wallpaper,
  Zap,
} from 'lucide-react';
import { ColorMode, UiTheme } from '../model/types';
import { MONET, VOICE_MODEL_PACKAGES, placeholderStory } from '../model/mockData';
import { usePlayer } from '../state/usePlayerStore';
import { VoiceClonePage, VoiceManagerPage } from './VoiceManagerPage';
import { M3ExpressiveSlider, M3ExpressiveSwitch } from '../components/M3Expressive';

interface CategoryItem {
  id: string;
  title: string;
  subtitle: string;
  icon: React.FC<{ className?: string; style?: React.CSSProperties }>;
}

interface CategoryGroup {
  cardTitle: string;
  items: CategoryItem[];
}

const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    cardTitle: 'Cá nhân',
    items: [
      { id: 'account', title: 'Tài khoản', subtitle: 'Đăng nhập, hồ sơ, bảo mật', icon: User },
    ],
  },
  {
    cardTitle: 'Đọc & nghe',
    items: [
      { id: 'appearance', title: 'Giao diện', subtitle: 'Chủ đề, màu sắc, ngôn ngữ ứng dụng', icon: Palette },
      { id: 'reader_voice', title: 'Trình đọc & giọng AI', subtitle: 'Phông chữ, trích xuất chương, giọng & phát âm', icon: BookOpenText },
      { id: 'stats', title: 'Thống kê', subtitle: 'Thời gian đọc, tiến độ, chuỗi ngày', icon: BarChart3 },
    ],
  },
  {
    cardTitle: 'Dữ liệu',
    items: [
      { id: 'storage', title: 'Lưu trữ', subtitle: 'Tải ngoại tuyến, bộ nhớ đệm, xuất file', icon: HardDrive },
      { id: 'backup', title: 'Đồng bộ & sao lưu', subtitle: 'Thiết bị khác, sao lưu, khôi phục', icon: DatabaseBackup },
    ],
  },
  {
    cardTitle: 'Hệ thống',
    items: [
      { id: 'browser', title: 'Trình duyệt & kết nối', subtitle: 'Chặn quảng cáo, DNS, WARP', icon: Globe },
      { id: 'extensions', title: 'Tiện ích mở rộng', subtitle: 'Cài đặt, bật tắt, quyền truy cập', icon: Puzzle },
    ],
  },
  {
    cardTitle: 'Thông tin',
    items: [
      { id: 'about', title: 'Giới thiệu & hỗ trợ', subtitle: 'Phiên bản, hướng dẫn, báo lỗi', icon: Info },
    ],
  },
];

const PROFILE_STORAGE_KEY = 'novelbook_profile_v1';

interface LocalProfile {
  signedIn: boolean;
  name: string;
  email: string;
  appLock: boolean;
  hideLockscreenHistory: boolean;
}

function loadProfile(): LocalProfile {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as LocalProfile;
  } catch {
    // ignore storage read error
  }
  return {
    signedIn: true,
    name: 'Độc giả NovelBook',
    email: 'docgia@novelbook.app',
    appLock: false,
    hideLockscreenHistory: false,
  };
}

export const SettingsScreen: React.FC = () => {
  const {
    ui,
    scheme,
    goBack,
    setUiTheme,
    setColorMode,
    setSeed,
    setPlayerBlur,
    setHapticEnabled,
    setHapticIntensity,
    toggleVoiceProfile,
    setContentLanguage,
    setContentExtractionMode,
    toggleTtsSource,
    onGeminiKeyChange,
    applyGeminiApiKey,
    clearGeminiApiKey,
    onZaloKeyChange,
    applyZaloApiKey,
    clearZaloApiKey,
    setVoice,
    addPronunciation,
    removePronunciation,
    setAdBlockEnabled,
    setDnsProvider,
    openSourceBrowser,
    exportBackupJson,
    importBackupJson,
    setKaraokeFont,
    toggleAutoNext,
  } = usePlayer();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [navDir, setNavDir] = useState<'forward' | 'back'>('forward');
  const [readerVoiceTab, setReaderVoiceTab] = useState<'reading' | 'models' | 'providers' | 'pronunciation'>('reading');
  const [appLanguage, setAppLanguage] = useState<'vi' | 'en'>('vi');
  const [readingFont, setReadingFont] = useState<'system' | 'serif' | 'sans'>('system');
  const [smoothScroll, setSmoothScroll] = useState(true);

  const [profile, setProfile] = useState<LocalProfile>(() => loadProfile());
  const [profileSavedMsg, setProfileSavedMsg] = useState<string | null>(null);

  const [blurDraft, setBlurDraft] = useState(ui.playerBlur);
  const [hapticDraft, setHapticDraft] = useState(ui.hapticIntensity);
  const [karaokeFontDraft, setKaraokeFontDraft] = useState(ui.karaokeFontSize);
  const [geminiVisible, setGeminiVisible] = useState(false);
  const [zaloVisible, setZaloVisible] = useState(false);
  const [pronFrom, setPronFrom] = useState('');
  const [pronTo, setPronTo] = useState('');
  const [pronStoryOnly, setPronStoryOnly] = useState(false);

  const [warpEnabled, setWarpEnabled] = useState(false);
  const [adblockDownloaded, setAdblockDownloaded] = useState(false);
  const [adblockExtEnabled, setAdblockExtEnabled] = useState(true);
  const [parserExtEnabled, setParserExtEnabled] = useState(true);
  const [geckoDownloaded, setGeckoDownloaded] = useState(false);
  const [geckoExtEnabled, setGeckoExtEnabled] = useState(false);
  const [parserUpdating, setParserUpdating] = useState(false);
  const [permDomAccess, setPermDomAccess] = useState(true);
  const [permScriptInject, setPermScriptInject] = useState(true);

  const [cacheClearedMsg, setCacheClearedMsg] = useState<string | null>(null);
  const [offlineAutoDownload, setOfflineAutoDownload] = useState(true);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const [bugType, setBugType] = useState<'audio' | 'chapter' | 'ui'>('audio');
  const [bugText, setBugText] = useState('');
  const [bugSentMsg, setBugSentMsg] = useState<string | null>(null);

  const restoreInputRef = useRef<HTMLInputElement | null>(null);

  const bottomInset = 28;
  const allCategories = CATEGORY_GROUPS.flatMap((g) => g.items);
  const selectedCategory = allCategories.find((c) => c.id === selectedId);
  const toolbarTitle =
    selectedId === 'reader_voice'
      ? 'Trình đọc & giọng AI'
      : selectedId === 'voice_clone'
        ? 'Nhân bản giọng nói'
        : selectedCategory?.title ?? 'Cài đặt';

  const navigateTo = (id: string | null) => {
    setNavDir(id === null ? 'back' : 'forward');
    setSelectedId(id);
  };

  const handleBack = () => {
    if (selectedId === 'voice_clone') {
      setNavDir('back');
      setSelectedId('reader_voice');
    } else if (selectedId !== null) {
      navigateTo(null);
    } else {
      goBack();
    }
  };

  const saveProfile = (next: LocalProfile, msg?: string) => {
    setProfile(next);
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore storage write error
    }
    if (msg) {
      setProfileSavedMsg(msg);
      window.setTimeout(() => setProfileSavedMsg(null), 2400);
    }
  };

  const handleExport = () => {
    const json = exportBackupJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'NovelBook-backup.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const realStories = ui.libraryItems.filter((s) => s.id !== placeholderStory.id);
  const recentStories = ui.historyItems.filter((s) => s.id !== placeholderStory.id);
  const totalChaptersHeard = realStories.reduce((sum, s) => sum + Math.max(0, (s.currentChapter || 1) - 1), 0);
  const totalListeningMin = Math.max(
    recentStories.length * 18,
    Math.round(
      realStories.reduce((sum, s) => sum + (s.positionMs || 0) / 60000 + Math.max(0, s.currentChapter - 1) * 6, 0)
    )
  );
  const avgProgress =
    realStories.length > 0
      ? Math.round((realStories.reduce((sum, s) => sum + Math.min(1, Math.max(0, s.progress)), 0) / realStories.length) * 100)
      : 0;
  const epubSizeMb = (
    realStories.reduce((sum, s) => sum + (s.fileSizeBytes || 0), 0) /
    (1024 * 1024)
  ).toFixed(1);

  return (
    <div
      className="h-full flex flex-col"
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
        if (dx > 72 && dx > dy * 1.4) handleBack();
      }}
    >
      <input
        ref={restoreInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            f.text().then(importBackupJson);
          }
          e.target.value = '';
        }}
      />

      {/* Top Toolbar */}
      <div className="px-4 py-3 flex items-center shrink-0">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Quay lại"
          className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 cursor-pointer active:scale-90 transition-transform"
          style={{
            backgroundColor: scheme.primaryContainer,
            color: scheme.onPrimaryContainer,
          }}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1
          className={`ml-3 ${selectedId ? 'text-[22px] font-medium' : 'text-[26px] font-bold'}`}
          style={{ color: scheme.onSurface }}
        >
          {toolbarTitle}
        </h1>
      </div>

      {/* Body */}
      {selectedId === 'reader_voice' ? (
        <div
          key="reader_voice"
          className={`flex-1 flex flex-col min-h-0 ${navDir === 'back' ? 'animate-page-back' : 'animate-page-in'}`}
        >
          {/* Reader & Voice Sub-tabs */}
          <div className="px-4 pb-2.5 shrink-0">
            <div
              className="p-1 rounded-full grid grid-cols-4 gap-1 border"
              style={{ backgroundColor: scheme.surfaceContainerLow, borderColor: scheme.outlineVariant }}
            >
              {[
                { id: 'reading' as const, label: 'Đọc truyện' },
                { id: 'models' as const, label: 'Mô hình' },
                { id: 'providers' as const, label: 'Nguồn TTS' },
                { id: 'pronunciation' as const, label: 'Phát âm' },
              ].map((t) => {
                const active = readerVoiceTab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setReaderVoiceTab(t.id)}
                    className="h-9 rounded-full text-[11.5px] font-medium transition cursor-pointer truncate px-1"
                    style={{
                      backgroundColor: active ? scheme.primaryContainer : 'transparent',
                      color: active ? scheme.onPrimaryContainer : scheme.onSurfaceVariant,
                    }}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {readerVoiceTab === 'models' ? (
            <VoiceManagerPage onOpenClone={() => navigateTo('voice_clone')} />
          ) : (
            <div
              className="flex-1 overflow-y-auto thin-scrollbar px-4 pt-1"
              style={{ paddingBottom: `calc(${bottomInset}px + var(--safe-bottom, env(safe-area-inset-bottom)))` }}
            >
              {readerVoiceTab === 'reading' ? (
                <div className="space-y-3">
                  {/* Font & Cuộn trang */}
                  <div className="rounded-[28px] p-4 space-y-4" style={{ backgroundColor: scheme.surfaceContainerLow }}>
                    <div>
                      <div className="text-[15px] font-medium mb-1">Phông chữ & cỡ chữ</div>
                      <div className="text-[13px] mb-1.5" style={{ color: scheme.onSurfaceVariant }}>
                        Cỡ chữ đọc / Karaoke: {karaokeFontDraft}px
                      </div>
                      <M3ExpressiveSlider
                        value={karaokeFontDraft}
                        min={14}
                        max={34}
                        step={1}
                        stopCount={10}
                        scheme={scheme}
                        ariaLabel="Cỡ chữ đọc"
                        onChange={(val) => {
                          setKaraokeFontDraft(val);
                          setKaraokeFont(val);
                        }}
                      />
                      <div className="grid grid-cols-3 gap-2 mt-3">
                        {[
                          { id: 'system' as const, label: 'Mặc định' },
                          { id: 'serif' as const, label: 'Serif' },
                          { id: 'sans' as const, label: 'Sans' },
                        ].map((f) => {
                          const active = readingFont === f.id;
                          return (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() => setReadingFont(f.id)}
                              className="h-10 rounded-[14px] border text-xs font-medium cursor-pointer"
                              style={{
                                backgroundColor: active ? scheme.secondaryContainer : scheme.surfaceContainerLowest,
                                color: active ? scheme.onSecondaryContainer : scheme.onSurfaceVariant,
                                borderColor: active ? scheme.primary : scheme.outlineVariant,
                              }}
                            >
                              {f.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <Divider color={scheme.outlineVariant} />

                    <div className="space-y-2">
                      <div className="text-[15px] font-medium">Cuộn trang & chuyển chương</div>
                      <SettingsSwitchRow
                        title="Cuộn mượt theo câu đang đọc"
                        subtitle="Tự canh giữa dòng hiện tại trong chế độ đọc"
                        checked={smoothScroll}
                        onChange={() => setSmoothScroll((v) => !v)}
                      />
                      <SettingsSwitchRow
                        title="Tự động chuyển sang chương tiếp theo"
                        subtitle="Đọc liên tục khi hết chương hiện tại"
                        checked={ui.autoNextChapter}
                        onChange={toggleAutoNext}
                      />
                    </div>
                  </div>

                  {/* Ngôn ngữ & Trích xuất chương */}
                  <div className="rounded-[28px] p-4 space-y-4" style={{ backgroundColor: scheme.surfaceContainerLow }}>
                    <div>
                      <div className="text-[15px] font-medium">Ngôn ngữ trang truyện</div>
                      <p className="text-xs mt-1" style={{ color: scheme.onSurfaceVariant }}>
                        Điều chỉnh ngôn ngữ yêu cầu HTTP/WebView và xử lý văn bản (17.713 từ mở rộng).
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2.5">
                        {[
                          { id: 'AUTO', label: 'Tự động' },
                          { id: 'VIETNAMESE', label: 'Tiếng Việt' },
                          { id: 'ENGLISH', label: 'English' },
                          { id: 'CHINESE', label: '中文' },
                        ].map((lang) => {
                          const selected = ui.contentLanguage === lang.id;
                          return (
                            <button
                              key={lang.id}
                              type="button"
                              onClick={() => setContentLanguage(lang.id)}
                              className="px-3.5 py-1.5 rounded-full text-xs font-medium border inline-flex items-center gap-1.5 cursor-pointer"
                              style={{
                                backgroundColor: selected ? scheme.secondaryContainer : 'transparent',
                                color: selected ? scheme.onSecondaryContainer : scheme.onSurfaceVariant,
                                borderColor: selected ? 'transparent' : scheme.outlineVariant,
                              }}
                            >
                              {selected && <Check className="w-3.5 h-3.5" />}
                              <span>{lang.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <Divider color={scheme.outlineVariant} />

                    <div className="space-y-1.5">
                      <div className="text-[15px] font-medium mb-1">Trích xuất chương</div>
                      {[
                        {
                          id: 'SMART',
                          title: 'Chính xác tự động',
                          desc: 'So sánh parser nguồn với DOM và chọn nội dung sạch, đầy đủ hơn',
                        },
                        {
                          id: 'SOURCE_FIRST',
                          title: 'Ưu tiên nguồn',
                          desc: 'Dùng selector riêng của website; fallback khi nội dung bị rỗng',
                        },
                        {
                          id: 'GENERIC_FIRST',
                          title: 'Ưu tiên DOM',
                          desc: 'Phân tích trang đã render; phù hợp link lạ hoặc website đổi giao diện',
                        },
                      ].map((m) => {
                        const selected = ui.contentExtractionMode === m.id;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setContentExtractionMode(m.id)}
                            className="w-full p-2.5 rounded-2xl flex items-center gap-3 text-left cursor-pointer"
                          >
                            <div
                              className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                              style={{ borderColor: selected ? scheme.primary : scheme.outline }}
                            >
                              {selected && <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: scheme.primary }} />}
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-medium">{m.title}</div>
                              <div className="text-xs" style={{ color: scheme.onSurfaceVariant }}>
                                {m.desc}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : readerVoiceTab === 'providers' ? (
                <div className="space-y-3">
                  {/* TTS Sources */}
                  <div className="rounded-[28px] p-4 space-y-2.5" style={{ backgroundColor: scheme.surfaceContainerLow }}>
                    <div className="text-base font-medium">Nguồn giọng đọc</div>
                    <p className="text-xs leading-relaxed" style={{ color: scheme.onSurfaceVariant }}>
                      Tắt một nguồn sẽ ẩn toàn bộ giọng của nguồn đó khỏi danh sách chọn giọng và ngừng dùng khi phát.
                    </p>
                    {ui.ttsSources.map((src) => (
                      <SettingsSwitchRow
                        key={src.key}
                        title={src.name}
                        subtitle={!src.configured ? 'Chưa cấu hình' : `${src.voices} giọng`}
                        checked={src.enabled}
                        onChange={() => toggleTtsSource(src.key, !src.enabled)}
                      />
                    ))}
                    <Divider color={scheme.outlineVariant} />
                    <SettingsSwitchRow
                      title="Nhớ giọng theo từng truyện"
                      subtitle="Tự động áp dụng lại giọng đã chọn khi mở lại truyện"
                      checked={ui.voiceProfileEnabled}
                      onChange={toggleVoiceProfile}
                    />
                  </div>

                  {/* TikTok TTS */}
                  <div className="rounded-[28px] p-4 space-y-2.5" style={{ backgroundColor: scheme.surfaceContainerLow }}>
                    <div className="text-base font-medium">TikTok TTS · trực tuyến</div>
                    <p className="text-xs leading-relaxed" style={{ color: scheme.onSurfaceVariant }}>
                      Có giọng tiếng Việt nam/nữ và tiếng Anh trong danh sách Giọng đọc AI. Tốc độ nghe do bộ phát điều khiển.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setVoice('tiktok:BV074_streaming')}
                        className="flex-1 h-10 rounded-full border text-xs font-medium cursor-pointer"
                        style={{ borderColor: scheme.outlineVariant, color: scheme.primary }}
                      >
                        {ui.selectedVoice === 'tiktok:BV074_streaming' ? 'Đang dùng · Nữ' : 'Chọn giọng nữ'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setVoice('tiktok:BV075_streaming')}
                        className="flex-1 h-10 rounded-full border text-xs font-medium cursor-pointer"
                        style={{ borderColor: scheme.outlineVariant, color: scheme.primary }}
                      >
                        {ui.selectedVoice === 'tiktok:BV075_streaming' ? 'Đang dùng · Nam' : 'Chọn giọng nam'}
                      </button>
                    </div>
                  </div>

                  <CredentialCard
                    title="Gemini TTS"
                    icon={<Sparkles className="w-5 h-5" />}
                    connected={ui.geminiKeyOk}
                    value={ui.geminiApiKey}
                    visible={geminiVisible}
                    onToggleVisible={() => setGeminiVisible((v) => !v)}
                    onChange={onGeminiKeyChange}
                    onSave={applyGeminiApiKey}
                    onClear={clearGeminiApiKey}
                    checking={ui.geminiKeyChecking}
                    status={ui.geminiKeyStatus}
                    label="API key"
                  />

                  <CredentialCard
                    title="Zalo AI TTS"
                    icon={<Mic className="w-5 h-5" />}
                    connected={ui.zaloKeyOk}
                    value={ui.zaloApiKey}
                    visible={zaloVisible}
                    onToggleVisible={() => setZaloVisible((v) => !v)}
                    onChange={onZaloKeyChange}
                    onSave={applyZaloApiKey}
                    onClear={clearZaloApiKey}
                    checking={ui.zaloKeyChecking}
                    status={ui.zaloKeyStatus}
                    label="API key Zalo AI"
                  />
                </div>
              ) : (
                <div className="rounded-[28px] p-4 space-y-3" style={{ backgroundColor: scheme.surfaceContainerLow }}>
                  <div className="text-base font-medium">Quy tắc phát âm tuỳ chỉnh</div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={pronFrom}
                      onChange={(e) => setPronFrom(e.target.value)}
                      placeholder="Từ gốc"
                      className="flex-1 min-w-0 h-11 px-3 rounded-xl border bg-transparent text-sm outline-none"
                      style={{ borderColor: scheme.outlineVariant }}
                    />
                    <input
                      type="text"
                      value={pronTo}
                      onChange={(e) => setPronTo(e.target.value)}
                      placeholder="Đọc thành"
                      className="flex-1 min-w-0 h-11 px-3 rounded-xl border bg-transparent text-sm outline-none"
                      style={{ borderColor: scheme.outlineVariant }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pronStoryOnly}
                        onChange={(e) => setPronStoryOnly(e.target.checked)}
                        className="w-4 h-4 accent-current"
                      />
                      <span>Chỉ truyện đang nghe</span>
                    </label>
                    <button
                      type="button"
                      disabled={!pronFrom.trim() || !pronTo.trim()}
                      onClick={() => {
                        addPronunciation(pronFrom, pronTo, pronStoryOnly);
                        setPronFrom('');
                        setPronTo('');
                      }}
                      className="px-4 h-10 rounded-full text-sm font-medium disabled:opacity-40 cursor-pointer"
                      style={{ backgroundColor: scheme.primary, color: scheme.onPrimary }}
                    >
                      Thêm
                    </button>
                  </div>
                  <div className="space-y-1 pt-1">
                    {ui.pronunciationRules.length === 0 ? (
                      <p className="text-xs py-2" style={{ color: scheme.onSurfaceVariant }}>
                        Chưa có quy tắc nào. Thêm cặp từ viết tắt hoặc tên riêng để AI đọc chuẩn hơn.
                      </p>
                    ) : (
                      ui.pronunciationRules.slice(-8).reverse().map((r) => (
                        <div key={r.id} className="flex items-center justify-between py-2 px-1">
                          <div>
                            <div className="text-sm font-medium">
                              {r.from} → {r.to}
                            </div>
                            {r.storyId && (
                              <div className="text-xs" style={{ color: scheme.onSurfaceVariant }}>
                                Riêng một truyện
                              </div>
                            )}
                          </div>
                          <button type="button" onClick={() => removePronunciation(r.id)} className="p-2 cursor-pointer">
                            <Trash2 className="w-4 h-4" style={{ color: scheme.error }} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : selectedId === 'voice_clone' ? (
        <div
          key="voice_clone"
          className={`flex-1 flex flex-col min-h-0 ${navDir === 'back' ? 'animate-page-back' : 'animate-page-in'}`}
        >
          <VoiceClonePage />
        </div>
      ) : (
        <div
          key={selectedId ?? 'root'}
          className={`flex-1 overflow-y-auto thin-scrollbar px-4 pt-1 ${
            navDir === 'back' ? 'animate-page-back' : 'animate-page-in'
          }`}
          style={{ paddingBottom: `calc(${bottomInset}px + var(--safe-bottom, env(safe-area-inset-bottom)))` }}
        >
          {selectedId === null ? (
            <div className="space-y-4">
              {CATEGORY_GROUPS.map((group) => (
                <div key={group.cardTitle}>
                  <div
                    className="text-[13px] font-semibold px-2 pb-1.5"
                    style={{ color: scheme.primary }}
                  >
                    {group.cardTitle}
                  </div>
                  <div className="space-y-0.5">
                    {group.items.map((cat, idx) => {
                      const Icon = cat.icon;
                      const isFirst = idx === 0;
                      const isLast = idx === group.items.length - 1;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => navigateTo(cat.id)}
                          className="w-full px-[18px] py-[15px] flex items-center gap-4 text-left transition active:scale-[0.99] cursor-pointer"
                          style={{
                            backgroundColor: scheme.surfaceContainerLow,
                            borderTopLeftRadius: isFirst ? 20 : 4,
                            borderTopRightRadius: isFirst ? 20 : 4,
                            borderBottomLeftRadius: isLast ? 20 : 4,
                            borderBottomRightRadius: isLast ? 20 : 4,
                          }}
                        >
                          <Icon className="w-[22px] h-[22px] shrink-0" style={{ color: scheme.onSurfaceVariant }} />
                          <div className="flex-1 min-w-0">
                            <div className="text-base font-medium" style={{ color: scheme.onSurface }}>
                              {cat.title}
                            </div>
                            <div className="text-[13px] truncate" style={{ color: scheme.onSurfaceVariant }}>
                              {cat.subtitle}
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 shrink-0 opacity-50" style={{ color: scheme.onSurfaceVariant }} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : selectedId === 'account' ? (
            <div className="space-y-3">
              <div className="rounded-[28px] p-4 space-y-4" style={{ backgroundColor: scheme.surfaceContainerLow }}>
                <div className="flex items-center gap-3.5">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold shrink-0"
                    style={{ backgroundColor: scheme.primaryContainer, color: scheme.onPrimaryContainer }}
                  >
                    {(profile.name.trim()[0] || 'N').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-semibold truncate">{profile.signedIn ? profile.name : 'Chế độ khách'}</div>
                    <div className="text-xs truncate mt-0.5" style={{ color: scheme.onSurfaceVariant }}>
                      {profile.signedIn ? profile.email : 'Đăng nhập để đồng bộ tiến độ đọc'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      saveProfile(
                        { ...profile, signedIn: !profile.signedIn },
                        !profile.signedIn ? 'Đã đăng nhập tài khoản' : 'Đã chuyển sang chế độ khách'
                      )
                    }
                    className="px-3.5 h-9 rounded-full text-xs font-medium cursor-pointer shrink-0"
                    style={{
                      backgroundColor: profile.signedIn ? scheme.surfaceContainerHigh : scheme.primary,
                      color: profile.signedIn ? scheme.onSurface : scheme.onPrimary,
                    }}
                  >
                    {profile.signedIn ? 'Đăng xuất' : 'Đăng nhập'}
                  </button>
                </div>

                {profile.signedIn && (
                  <>
                    <Divider color={scheme.outlineVariant} />
                    <div className="space-y-2.5">
                      <div className="text-[15px] font-medium">Hồ sơ cá nhân</div>
                      <input
                        type="text"
                        value={profile.name}
                        onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                        placeholder="Tên hiển thị"
                        className="w-full h-11 px-3.5 rounded-xl border bg-transparent text-sm outline-none"
                        style={{ borderColor: scheme.outlineVariant }}
                      />
                      <input
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                        placeholder="Email tài khoản"
                        className="w-full h-11 px-3.5 rounded-xl border bg-transparent text-sm outline-none"
                        style={{ borderColor: scheme.outlineVariant }}
                      />
                      <button
                        type="button"
                        onClick={() => saveProfile(profile, 'Đã lưu thông tin hồ sơ')}
                        className="h-10 px-5 rounded-full text-sm font-medium cursor-pointer"
                        style={{ backgroundColor: scheme.primary, color: scheme.onPrimary }}
                      >
                        Lưu hồ sơ
                      </button>
                    </div>
                  </>
                )}

                {profileSavedMsg && (
                  <p className="text-xs font-medium" style={{ color: scheme.primary }}>
                    {profileSavedMsg}
                  </p>
                )}
              </div>

              <div className="rounded-[28px] p-4 space-y-2.5" style={{ backgroundColor: scheme.surfaceContainerLow }}>
                <div className="flex items-center gap-2 text-[15px] font-medium">
                  <Lock className="w-4 h-4" style={{ color: scheme.primary }} />
                  <span>Bảo mật & riêng tư</span>
                </div>
                <SettingsSwitchRow
                  title="Khoá ứng dụng"
                  subtitle="Yêu cầu xác thực khi mở lại ứng dụng"
                  checked={profile.appLock}
                  onChange={() => saveProfile({ ...profile, appLock: !profile.appLock })}
                />
                <SettingsSwitchRow
                  title="Ẩn tên truyện trên màn hình khoá"
                  subtitle="Chỉ hiển thị trình phát thu gọn khi khoá máy"
                  checked={profile.hideLockscreenHistory}
                  onChange={() => saveProfile({ ...profile, hideLockscreenHistory: !profile.hideLockscreenHistory })}
                />
              </div>
            </div>
          ) : selectedId === 'appearance' ? (
            <div
              className="rounded-[28px] p-4 space-y-4"
              style={{ backgroundColor: scheme.surfaceContainerLow }}
            >
              {/* Sáng tối */}
              <div>
                <div className="text-[15px] font-medium mb-2.5">Sáng tối</div>
                <div
                  className="p-1 rounded-[24px] border grid grid-cols-3 relative overflow-hidden"
                  style={{ backgroundColor: scheme.surfaceContainerLowest, borderColor: scheme.outlineVariant }}
                >
                  <div
                    className="absolute top-1 bottom-1 rounded-[20px] transition-all duration-350 ease-[cubic-bezier(0.22,1.18,0.36,1)] pointer-events-none"
                    style={{
                      backgroundColor: scheme.primaryContainer,
                      width: 'calc(33.3333% - 4px)',
                      left: `calc(${
                        [UiTheme.DARK, UiTheme.LIGHT, UiTheme.SYSTEM].indexOf(ui.uiTheme) * 33.3333
                      }% + 2px)`,
                    }}
                  />
                  {[
                    { mode: UiTheme.DARK, label: 'Tối', icon: Moon },
                    { mode: UiTheme.LIGHT, label: 'Sáng', icon: Sun },
                    { mode: UiTheme.SYSTEM, label: 'Máy', icon: Smartphone },
                  ].map(({ mode, label, icon: Icon }) => {
                    const active = ui.uiTheme === mode;
                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setUiTheme(mode, {
                            x: rect.left + rect.width / 2,
                            y: rect.top + rect.height / 2,
                          });
                        }}
                        className="relative z-10 h-[72px] rounded-[20px] flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer active:scale-95"
                        style={{
                          color: active ? scheme.onPrimaryContainer : scheme.onSurfaceVariant,
                        }}
                      >
                        <Icon className="w-[22px] h-[22px]" />
                        <span
                          className="text-[13px] font-medium"
                          style={{ color: active ? scheme.primary : scheme.onSurfaceVariant }}
                        >
                          {label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <Divider color={scheme.outlineVariant} />

              {/* Ngôn ngữ ứng dụng */}
              <div>
                <div className="text-[15px] font-medium mb-2">Ngôn ngữ ứng dụng</div>
                <div className="flex gap-2">
                  {[
                    { id: 'vi' as const, label: 'Tiếng Việt' },
                    { id: 'en' as const, label: 'English' },
                  ].map((lang) => {
                    const active = appLanguage === lang.id;
                    return (
                      <button
                        key={lang.id}
                        type="button"
                        onClick={() => setAppLanguage(lang.id)}
                        className="px-4 h-9 rounded-full text-xs font-medium border inline-flex items-center gap-1.5 cursor-pointer"
                        style={{
                          backgroundColor: active ? scheme.secondaryContainer : 'transparent',
                          color: active ? scheme.onSecondaryContainer : scheme.onSurfaceVariant,
                          borderColor: active ? 'transparent' : scheme.outlineVariant,
                        }}
                      >
                        {active && <Check className="w-3.5 h-3.5" />}
                        <span>{lang.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <Divider color={scheme.outlineVariant} />

              {/* Nền Player */}
              <div>
                <div className="text-[15px] font-medium mb-1.5">Nền Player</div>
                <div className="text-[13px] mb-1.5" style={{ color: scheme.onSurfaceVariant }}>
                  Độ mờ nền: {blurDraft}% · 0 = tắt nền
                </div>
                <M3ExpressiveSlider
                  value={blurDraft}
                  min={0}
                  max={60}
                  step={1}
                  stopCount={12}
                  scheme={scheme}
                  ariaLabel="Độ mờ nền"
                  onChange={(val) => {
                    setBlurDraft(val);
                    setPlayerBlur(val);
                  }}
                />
              </div>

              <Divider color={scheme.outlineVariant} />

              {/* Phản hồi rung */}
              <div className="space-y-2.5">
                <div className="text-[15px] font-medium">Phản hồi rung</div>
                <SettingsSwitchRow
                  title="Rung khi thao tác"
                  subtitle="Nút, vuốt, cuộn, đổi tab và thao tác quay lại"
                  checked={ui.hapticEnabled}
                  onChange={() => setHapticEnabled(!ui.hapticEnabled)}
                />
                {ui.hapticEnabled && (
                  <div>
                    <div className="text-[13px] mb-1" style={{ color: scheme.onSurfaceVariant }}>
                      Cường độ: {hapticDraft < 34 ? 'Nhẹ' : hapticDraft < 68 ? 'Vừa' : 'Mạnh'} · {hapticDraft}%
                    </div>
                    <M3ExpressiveSlider
                      value={hapticDraft}
                      min={1}
                      max={100}
                      step={1}
                      stopCount={11}
                      scheme={scheme}
                      ariaLabel="Cường độ rung"
                      onChange={(val) => {
                        setHapticDraft(val);
                        setHapticIntensity(val);
                      }}
                    />
                  </div>
                )}
              </div>

              <Divider color={scheme.outlineVariant} />

              {/* Nguồn màu */}
              <div className="space-y-2.5">
                <div className="text-[15px] font-medium mb-1">Nguồn màu</div>
                {[
                  { mode: ColorMode.SYSTEM_WALLPAPER, label: 'Hình nền điện thoại', icon: Wallpaper },
                  { mode: ColorMode.CUSTOM_SEED, label: 'Tự chọn màu', icon: Palette },
                  { mode: ColorMode.COVER_ART, label: 'Theo ảnh bìa truyện', icon: ImageIcon },
                ].map(({ mode, label, icon: Icon }) => {
                  const selected = ui.colorMode === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setColorMode(mode)}
                      className="w-full p-2.5 rounded-[20px] border-[1.5px] flex items-center gap-3 text-left transition cursor-pointer active:scale-[0.99]"
                      style={{
                        backgroundColor: selected ? scheme.secondaryContainer : scheme.surfaceContainerLowest,
                        borderColor: selected ? scheme.primary : scheme.outlineVariant,
                      }}
                    >
                      <div
                        className="w-11 h-11 rounded-[14px] flex items-center justify-center shrink-0 transition-colors"
                        style={{
                          backgroundColor: selected ? scheme.secondary : scheme.surfaceVariant,
                          color: selected ? scheme.onSecondary : scheme.onSurfaceVariant,
                        }}
                      >
                        {mode === ColorMode.SYSTEM_WALLPAPER ? (
                          <WallpaperFrameIcon />
                        ) : (
                          <Icon className="w-5 h-5" />
                        )}
                      </div>
                      <span className="flex-1 text-[15px] font-medium">{label}</span>
                      {selected && <Check className="w-5 h-5 mr-1" style={{ color: scheme.primary }} />}
                    </button>
                  );
                })}

                {ui.colorMode === ColorMode.CUSTOM_SEED && (
                  <div className="pt-2">
                    <div className="text-xs mb-2.5" style={{ color: scheme.onSurfaceVariant }}>
                      Chọn màu gốc
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      {Object.entries(MONET).map(([name, hex]) => {
                        const selected = name === ui.monetSeed;
                        return (
                          <button
                            key={name}
                            type="button"
                            onClick={() => setSeed(name)}
                            aria-label={name}
                            className="w-[42px] h-[42px] rounded-full flex items-center justify-center transition-transform cursor-pointer"
                            style={{
                              backgroundColor: hex,
                              border: `${selected ? 3 : 1}px solid ${selected ? scheme.onSurface : scheme.outlineVariant}`,
                              transform: selected ? 'scale(1.12)' : 'scale(1)',
                            }}
                          >
                            {selected && <Check className="w-[18px] h-[18px] text-white drop-shadow" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : selectedId === 'stats' ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { label: 'Thời gian nghe', value: `${totalListeningMin} phút`, icon: Volume2 },
                  { label: 'Tiến độ trung bình', value: `${avgProgress}%`, icon: BarChart3 },
                  { label: 'Chương đã nghe', value: `${totalChaptersHeard} chương`, icon: BookOpenText },
                  { label: 'Chuỗi ngày liên tiếp', value: `${Math.max(1, recentStories.length)} ngày`, icon: Flame },
                ].map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={stat.label}
                      className="rounded-[22px] p-3.5 space-y-2"
                      style={{ backgroundColor: scheme.surfaceContainerLow }}
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: scheme.primaryContainer, color: scheme.onPrimaryContainer }}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="text-lg font-bold tabular-nums">{stat.value}</div>
                      <div className="text-xs" style={{ color: scheme.onSurfaceVariant }}>
                        {stat.label}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="rounded-[28px] p-4 space-y-3" style={{ backgroundColor: scheme.surfaceContainerLow }}>
                <div className="text-[15px] font-medium">Tiến độ theo truyện</div>
                {realStories.length === 0 ? (
                  <p className="text-xs" style={{ color: scheme.onSurfaceVariant }}>
                    Chưa có dữ liệu đọc truyện.
                  </p>
                ) : (
                  realStories.slice(0, 5).map((s) => {
                    const pct = Math.round(Math.min(1, Math.max(0, s.progress)) * 100);
                    return (
                      <div key={s.id} className="space-y-1">
                        <div className="flex items-center justify-between text-xs gap-2">
                          <span className="font-medium truncate">{s.title}</span>
                          <span className="tabular-nums shrink-0" style={{ color: scheme.onSurfaceVariant }}>
                            Ch.{s.currentChapter}/{s.totalChapters || '?'} · {pct}%
                          </span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: scheme.surfaceVariant }}>
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, backgroundColor: scheme.primary }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : selectedId === 'storage' ? (
            <div className="space-y-3">
              <div className="rounded-[28px] p-4 space-y-3" style={{ backgroundColor: scheme.surfaceContainerLow }}>
                <div className="text-[15px] font-medium">Dung lượng & tải ngoại tuyến</div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between py-1">
                    <span style={{ color: scheme.onSurfaceVariant }}>Sách EPUB đã nhập</span>
                    <span className="font-medium tabular-nums">
                      {realStories.filter((s) => s.localBookId).length} tệp · {epubSizeMb} MB
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span style={{ color: scheme.onSurfaceVariant }}>Mô hình giọng ngoại tuyến</span>
                    <span className="font-medium tabular-nums">
                      {VOICE_MODEL_PACKAGES.filter((m) => m.installed).length} gói đã cài
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span style={{ color: scheme.onSurfaceVariant }}>Bộ nhớ đệm chương web</span>
                    <span className="font-medium tabular-nums">{realStories.length * 1.4} MB</span>
                  </div>
                </div>
                <Divider color={scheme.outlineVariant} />
                <SettingsSwitchRow
                  title="Tự tải ngoại tuyến 3 chương kế tiếp"
                  subtitle="Giúp phát liên tục khi mạng yếu"
                  checked={offlineAutoDownload}
                  onChange={() => setOfflineAutoDownload((v) => !v)}
                />
                <div className="flex gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setCacheClearedMsg('Đã dọn sạch bộ nhớ đệm tạm thời');
                      window.setTimeout(() => setCacheClearedMsg(null), 2400);
                    }}
                    className="flex-1 h-11 rounded-full flex items-center justify-center gap-2 text-sm font-medium cursor-pointer"
                    style={{ backgroundColor: scheme.secondaryContainer, color: scheme.onSecondaryContainer }}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Xoá cache</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExport}
                    className="flex-1 h-11 rounded-full flex items-center justify-center gap-2 text-sm font-medium cursor-pointer"
                    style={{ backgroundColor: scheme.primary, color: scheme.onPrimary }}
                  >
                    <Upload className="w-4 h-4" />
                    <span>Xuất file</span>
                  </button>
                </div>
                {cacheClearedMsg && (
                  <p className="text-xs font-medium" style={{ color: scheme.primary }}>
                    {cacheClearedMsg}
                  </p>
                )}
              </div>
            </div>
          ) : selectedId === 'backup' ? (
            <div className="space-y-3">
              <div className="rounded-[28px] p-4 space-y-3" style={{ backgroundColor: scheme.surfaceContainerLow }}>
                <div className="text-[15px] font-medium">Đồng bộ giữa các thiết bị</div>
                <SettingsSwitchRow
                  title="Tự động đồng bộ tiến độ đọc"
                  subtitle="Cập nhật vị trí chương, câu đang nghe và tủ sách"
                  checked={autoSyncEnabled}
                  onChange={() => setAutoSyncEnabled((v) => !v)}
                />
                <button
                  type="button"
                  onClick={() => {
                    setSyncStatus('Đã đồng bộ xong với tài khoản');
                    window.setTimeout(() => setSyncStatus(null), 2400);
                  }}
                  className="w-full h-11 rounded-full flex items-center justify-center gap-2 text-sm font-medium cursor-pointer"
                  style={{ backgroundColor: scheme.secondaryContainer, color: scheme.onSecondaryContainer }}
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Đồng bộ ngay</span>
                </button>
                {syncStatus && (
                  <p className="text-xs font-medium" style={{ color: scheme.primary }}>
                    {syncStatus}
                  </p>
                )}
              </div>

              <div className="rounded-[28px] p-4 space-y-3" style={{ backgroundColor: scheme.surfaceContainerLow }}>
                <div className="text-[15px] font-medium">Sao lưu & khôi phục thủ công</div>
                <p className="text-xs" style={{ color: scheme.onSurfaceVariant }}>
                  Xuất toàn bộ tủ sách, tiến độ nghe và cấu hình ra tệp JSON hoặc khôi phục từ tệp đã lưu.
                </p>
                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={handleExport}
                    className="flex-1 h-12 rounded-full flex items-center justify-center gap-2 text-sm font-medium cursor-pointer"
                    style={{ backgroundColor: scheme.primary, color: scheme.onPrimary }}
                  >
                    <HardDriveUpload className="w-4 h-4" />
                    <span>Sao lưu</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => restoreInputRef.current?.click()}
                    className="flex-1 h-12 rounded-full flex items-center justify-center gap-2 text-sm font-medium cursor-pointer"
                    style={{ backgroundColor: scheme.secondaryContainer, color: scheme.onSecondaryContainer }}
                  >
                    <Download className="w-4 h-4" />
                    <span>Khôi phục</span>
                  </button>
                </div>
                {ui.backupStatus && (
                  <p className="text-xs font-medium" style={{ color: scheme.primary }}>
                    {ui.backupStatus}
                  </p>
                )}
              </div>
            </div>
          ) : selectedId === 'browser' ? (
            <div className="space-y-3">
              {/* Browser & AdBlock Card */}
              <div className="rounded-[26px] overflow-hidden" style={{ backgroundColor: scheme.surfaceContainerLow }}>
                <button
                  type="button"
                  onClick={() => openSourceBrowser()}
                  className="w-full p-4 flex items-center gap-3.5 text-left cursor-pointer active:opacity-90"
                >
                  <div
                    className="w-11 h-11 rounded-[14px] flex items-center justify-center shrink-0"
                    style={{ backgroundColor: scheme.primaryContainer, color: scheme.onPrimaryContainer }}
                  >
                    <Globe className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">Mở trình duyệt nội dung</div>
                    <div className="text-xs mt-0.5" style={{ color: scheme.onSurfaceVariant }}>
                      Dùng chung trang và phiên đăng nhập với bộ tải truyện
                    </div>
                  </div>
                  <ExternalLink className="w-5 h-5 shrink-0" style={{ color: scheme.onSurfaceVariant }} />
                </button>
                <Divider color={scheme.outlineVariant} />
                <div className="p-4 flex items-center gap-3.5">
                  <div
                    className="w-11 h-11 rounded-[14px] flex items-center justify-center shrink-0"
                    style={{ backgroundColor: scheme.secondaryContainer, color: scheme.onSecondaryContainer }}
                  >
                    <Shield className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">Trình chặn quảng cáo</div>
                    <div className="text-xs mt-0.5" style={{ color: scheme.onSurfaceVariant }}>
                      12.480 mẫu chặn URL và ẩn quảng cáo
                    </div>
                  </div>
                  <Switch checked={ui.adBlockEnabled} onChange={() => setAdBlockEnabled(!ui.adBlockEnabled)} />
                </div>
                <Divider color={scheme.outlineVariant} />
                <div className="p-4 flex items-center gap-3.5">
                  <div
                    className="w-11 h-11 rounded-[14px] flex items-center justify-center shrink-0"
                    style={{ backgroundColor: scheme.primaryContainer, color: scheme.onPrimaryContainer }}
                  >
                    <Zap className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">Cloudflare WARP (1.1.1.1)</div>
                    <div className="text-xs mt-0.5" style={{ color: scheme.onSurfaceVariant }}>
                      Định tuyến kết nối ổn định hơn với nguồn bị chặn
                    </div>
                  </div>
                  <Switch checked={warpEnabled} onChange={() => setWarpEnabled((v) => !v)} />
                </div>
              </div>

              {/* DNS */}
              <SectionHeaderLabel icon={<Server className="w-5 h-5" />} title="DNS" />
              <div className="rounded-[26px] p-4 space-y-2" style={{ backgroundColor: scheme.surfaceContainerLow }}>
                {[
                  { id: 'SYSTEM' as const, label: 'Mặc định hệ thống' },
                  { id: 'CLOUDFLARE' as const, label: 'Cloudflare (1.1.1.1)' },
                  { id: 'GOOGLE' as const, label: 'Google (8.8.8.8)' },
                  { id: 'ADGUARD' as const, label: 'AdGuard DNS' },
                ].map((p) => {
                  const selected = ui.dnsProvider === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setDnsProvider(p.id)}
                      className="w-full h-11 px-2 flex items-center gap-3 text-left cursor-pointer"
                    >
                      <div
                        className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                        style={{ borderColor: selected ? scheme.primary : scheme.outline }}
                      >
                        {selected && <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: scheme.primary }} />}
                      </div>
                      <span className="text-sm">{p.label}</span>
                    </button>
                  );
                })}
                <p className="text-xs pt-1" style={{ color: scheme.onSurfaceVariant }}>
                  Áp dụng cho tải nội dung truyện trên trình duyệt tích hợp.
                </p>
              </div>
            </div>
          ) : selectedId === 'extensions' ? (
            <div className="space-y-3">
              <ExtensionModuleCard
                title="Extension chặn quảng cáo"
                desc={
                  adblockDownloaded
                    ? 'Đã tải bộ luật URL và script ẩn quảng cáo mới nhất.'
                    : 'Tải luật URL và script ẩn quảng cáo; bộ có sẵn vẫn hoạt động khi chưa tải.'
                }
                icon={<Shield className="w-5 h-5" />}
                installed={adblockDownloaded}
                enabled={adblockExtEnabled}
                onToggle={() => setAdblockExtEnabled((v) => !v)}
                buttonLabel={adblockDownloaded ? 'Cập nhật extension chặn quảng cáo' : 'Tải extension chặn quảng cáo'}
                onAction={() => setAdblockDownloaded(true)}
              />
              <ExtensionModuleCard
                title="Bộ mở rộng parser web"
                desc={parserUpdating ? 'Đang kiểm tra bản cập nhật…' : 'Đã tải 74 parser · bản 2026.11.21.2'}
                icon={<Puzzle className="w-5 h-5" />}
                installed
                enabled={parserExtEnabled}
                onToggle={() => setParserExtEnabled((v) => !v)}
                buttonLabel={parserUpdating ? 'Đang cập nhật parser web…' : 'Cập nhật parser web'}
                onAction={() => {
                  setParserUpdating(true);
                  window.setTimeout(() => setParserUpdating(false), 700);
                }}
              />
              <ExtensionModuleCard
                title="Trình duyệt Gecko (module phụ)"
                desc={
                  geckoDownloaded
                    ? 'Đã cài Gecko runtime · hỗ trợ Sáng Tác Việt và các nguồn JS.'
                    : 'Tải thêm Gecko để mở các nguồn cần bộ máy này, như Sáng Tác Việt.'
                }
                icon={<Globe className="w-5 h-5" />}
                installed={geckoDownloaded}
                enabled={geckoExtEnabled}
                onToggle={() => setGeckoExtEnabled((v) => !v)}
                buttonLabel={geckoDownloaded ? 'Đã tải module Gecko' : 'Tải module Gecko'}
                onAction={() => {
                  setGeckoDownloaded(true);
                  setGeckoExtEnabled(true);
                }}
              />

              <div className="rounded-[26px] p-4 space-y-2.5" style={{ backgroundColor: scheme.surfaceContainerLow }}>
                <div className="flex items-center gap-2 text-[15px] font-medium">
                  <KeyRound className="w-4 h-4" style={{ color: scheme.primary }} />
                  <span>Quyền truy cập tiện ích</span>
                </div>
                <SettingsSwitchRow
                  title="Đọc DOM trang truyện"
                  subtitle="Cho phép parser tách tiêu đề, nội dung chương và link chương kế"
                  checked={permDomAccess}
                  onChange={() => setPermDomAccess((v) => !v)}
                />
                <SettingsSwitchRow
                  title="Chạy script dọn quảng cáo"
                  subtitle="Ẩn banner và popup trên trình duyệt nguồn truyện"
                  checked={permScriptInject}
                  onChange={() => setPermScriptInject((v) => !v)}
                />
              </div>
            </div>
          ) : (
            /* About & Support */
            <div className="space-y-3">
              <div className="rounded-[28px] p-4 flex items-center gap-3.5" style={{ backgroundColor: scheme.surfaceContainerLow }}>
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: scheme.primaryContainer, color: scheme.onPrimaryContainer }}
                >
                  <Info className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-base font-bold">NovelBook</div>
                  <div className="text-xs mt-0.5" style={{ color: scheme.onSurfaceVariant }}>
                    Phiên bản 2.4.0 · Bản dựng 2026.11
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] p-4 space-y-2.5" style={{ backgroundColor: scheme.surfaceContainerLow }}>
                <div className="text-[15px] font-medium">Hướng dẫn nhanh</div>
                <div className="text-xs space-y-2 leading-relaxed" style={{ color: scheme.onSurfaceVariant }}>
                  <p>1. Dán liên kết truyện hoặc nhập tệp EPUB từ nút trên màn hình Thư viện.</p>
                  <p>2. Chạm bìa truyện để mở trình phát AI, điều chỉnh tốc độ 0x–4x và độ cao giọng 0x–2x.</p>
                  <p>3. Chuyển sang chế độ Karaoke để vừa nghe vừa theo dõi từng câu đọc.</p>
                </div>
              </div>

              <div className="rounded-[28px] p-4 space-y-3" style={{ backgroundColor: scheme.surfaceContainerLow }}>
                <div className="text-[15px] font-medium">Báo lỗi & góp ý</div>
                <div className="flex gap-2">
                  {[
                    { id: 'audio' as const, label: 'Giọng đọc' },
                    { id: 'chapter' as const, label: 'Tải chương' },
                    { id: 'ui' as const, label: 'Giao diện' },
                  ].map((item) => {
                    const active = bugType === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setBugType(item.id)}
                        className="px-3.5 h-8 rounded-full text-xs font-medium border cursor-pointer"
                        style={{
                          backgroundColor: active ? scheme.secondaryContainer : 'transparent',
                          color: active ? scheme.onSecondaryContainer : scheme.onSurfaceVariant,
                          borderColor: active ? 'transparent' : scheme.outlineVariant,
                        }}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
                <textarea
                  rows={3}
                  value={bugText}
                  onChange={(e) => setBugText(e.target.value)}
                  placeholder="Mô tả lỗi bạn gặp hoặc tính năng muốn đề xuất..."
                  className="w-full p-3 rounded-2xl border bg-transparent text-sm outline-none resize-none"
                  style={{ borderColor: scheme.outlineVariant }}
                />
                <button
                  type="button"
                  disabled={!bugText.trim()}
                  onClick={() => {
                    setBugText('');
                    setBugSentMsg('Cảm ơn bạn! Phản hồi đã được ghi nhận.');
                    window.setTimeout(() => setBugSentMsg(null), 2600);
                  }}
                  className="w-full h-11 rounded-full flex items-center justify-center gap-2 text-sm font-medium disabled:opacity-40 cursor-pointer"
                  style={{ backgroundColor: scheme.primary, color: scheme.onPrimary }}
                >
                  <Send className="w-4 h-4" />
                  <span>Gửi phản hồi</span>
                </button>
                {bugSentMsg && (
                  <p className="text-xs font-medium" style={{ color: scheme.primary }}>
                    {bugSentMsg}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const Divider: React.FC<{ color: string }> = ({ color }) => (
  <div className="h-px w-full opacity-55" style={{ backgroundColor: color }} />
);

const WallpaperFrameIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" className="w-[22px] h-[22px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3H5a2 2 0 0 0-2 2v3" />
    <path d="M16 3h3a2 2 0 0 1 2 2v3" />
    <path d="M8 21H5a2 2 0 0 1-2-2v-3" />
    <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
    <circle cx="9.5" cy="9.5" r="1.25" fill="currentColor" stroke="none" />
    <path d="m7 17 4-4 2.5 2.5 2.5-3 2 4.5H7Z" fill="currentColor" stroke="none" />
  </svg>
);

const Switch: React.FC<{ checked: boolean; onChange: () => void }> = ({ checked, onChange }) => {
  const { scheme } = usePlayer();
  return <M3ExpressiveSwitch checked={checked} onChange={onChange} scheme={scheme} />;
};

const SettingsSwitchRow: React.FC<{
  title: string;
  subtitle?: string;
  checked: boolean;
  onChange: () => void;
}> = ({ title, subtitle, checked, onChange }) => {
  const { scheme } = usePlayer();
  return (
    <div className="flex items-center justify-between py-1">
      <div className="pr-3">
        <div className="text-sm font-medium">{title}</div>
        {subtitle && (
          <div className="text-xs mt-0.5" style={{ color: scheme.onSurfaceVariant }}>
            {subtitle}
          </div>
        )}
      </div>
      <Switch checked={checked} onChange={onChange} />
    </div>
  );
};

const CredentialCard: React.FC<{
  title: string;
  icon: React.ReactNode;
  connected: boolean;
  value: string;
  visible: boolean;
  onToggleVisible: () => void;
  onChange: (v: string) => void;
  onSave: () => void;
  onClear: () => void;
  checking: boolean;
  status: string | null;
  label: string;
}> = ({
  title,
  icon,
  connected,
  value,
  visible,
  onToggleVisible,
  onChange,
  onSave,
  onClear,
  checking,
  status,
  label,
}) => {
  const { scheme } = usePlayer();
  return (
    <div className="rounded-[28px] p-4 space-y-3" style={{ backgroundColor: scheme.surfaceContainerLow }}>
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
          style={{
            backgroundColor: connected ? scheme.primaryContainer : scheme.surfaceVariant,
            color: connected ? scheme.onPrimaryContainer : scheme.onSurfaceVariant,
          }}
        >
          {icon}
        </div>
        <span className="flex-1 text-base font-medium">{title}</span>
        {connected && <Check className="w-5 h-5" style={{ color: scheme.primary }} />}
      </div>
      <div
        className="h-12 rounded-xl px-3 border flex items-center gap-2"
        style={{ borderColor: scheme.outlineVariant }}
      >
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={label}
          disabled={checking}
          className="flex-1 bg-transparent outline-none text-sm"
        />
        <button type="button" onClick={onToggleVisible} className="p-1 cursor-pointer">
          {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={checking || !value.trim()}
          className="px-5 h-10 rounded-full text-sm font-medium disabled:opacity-40 cursor-pointer"
          style={{ backgroundColor: scheme.primary, color: scheme.onPrimary }}
        >
          {checking ? 'Đang kiểm tra' : 'Lưu'}
        </button>
        <button
          type="button"
          onClick={onClear}
          disabled={checking}
          className="px-4 h-10 rounded-full text-sm font-medium cursor-pointer"
          style={{ color: scheme.primary }}
        >
          Xoá
        </button>
      </div>
      {status && (
        <p className="text-xs" style={{ color: connected ? scheme.primary : scheme.error }}>
          {status}
        </p>
      )}
    </div>
  );
};

const SectionHeaderLabel: React.FC<{ icon: React.ReactNode; title: string }> = ({ icon, title }) => {
  const { scheme } = usePlayer();
  return (
    <div className="flex items-center gap-2 pt-2">
      <span style={{ color: scheme.primary }}>{icon}</span>
      <span className="text-base font-medium">{title}</span>
    </div>
  );
};

const ExtensionModuleCard: React.FC<{
  title: string;
  desc: string;
  icon: React.ReactNode;
  installed?: boolean;
  enabled: boolean;
  onToggle: () => void;
  buttonLabel: string;
  onAction: () => void;
}> = ({ title, desc, icon, installed = false, enabled, onToggle, buttonLabel, onAction }) => {
  const { scheme } = usePlayer();
  return (
    <div
      className="rounded-[26px] p-4 space-y-3.5"
      style={{ backgroundColor: scheme.surfaceContainerLow }}
    >
      <div className="flex items-center gap-3.5">
        <div
          className="w-12 h-12 rounded-[16px] flex items-center justify-center shrink-0"
          style={{ backgroundColor: scheme.primaryContainer, color: scheme.onPrimaryContainer }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[16px] font-medium leading-snug truncate">{title}</span>
            {installed && <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: scheme.primary }} />}
          </div>
          <div className="text-[13px] mt-1 leading-relaxed" style={{ color: scheme.onSurfaceVariant }}>
            {desc}
          </div>
        </div>
        <Switch checked={enabled} onChange={onToggle} />
      </div>
      <button
        type="button"
        onClick={onAction}
        className="w-full h-11 rounded-full flex items-center justify-center gap-2 text-[14px] font-medium cursor-pointer active:scale-[0.99] transition"
        style={{
          backgroundColor: scheme.primaryContainer,
          color: scheme.onPrimaryContainer,
        }}
      >
        <CloudDownload className="w-[18px] h-[18px]" />
        <span>{buttonLabel}</span>
      </button>
    </div>
  );
};
