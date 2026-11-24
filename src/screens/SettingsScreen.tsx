import React, { useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  BookOpenText,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Cloud,
  CloudDownload,
  DatabaseBackup,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Flame,
  FolderOpen,
  Globe,
  HardDrive,
  HardDriveUpload,
  Image as ImageIcon,
  Info,
  KeyRound,
  Lock,
  LogOut,
  Mic,
  Moon,
  Palette,
  Plus,
  Puzzle,
  RefreshCw,
  RotateCcw,
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
  X,
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


const GoogleGLogo: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.44a5.5 5.5 0 0 1-2.39 3.61v3h3.87c2.26-2.08 3.57-5.15 3.57-8.64Z" />
    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.93-2.91l-3.87-3c-1.07.72-2.44 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.29v3.1A12 12 0 0 0 12 24Z" />
    <path fill="#FBBC05" d="M5.29 14.29a7.2 7.2 0 0 1 0-4.58v-3.1H1.29a12 12 0 0 0 0 10.78l4-3.1Z" />
    <path fill="#EA4335" d="M12 4.75c1.76 0 3.34.61 4.58 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.29 6.61l4 3.1c.94-2.84 3.59-4.96 6.71-4.96Z" />
  </svg>
);

const GoogleDriveLogo: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path fill="#0066DA" d="M4.43 20.5 1.5 15.4l5.42-9.4 2.93 5.08L4.43 20.5Z" />
    <path fill="#00AC47" d="M9.85 11.08 6.92 6l3.48-6h6.16l-6.71 11.08Z" />
    <path fill="#EA4335" d="M19.57 20.5H4.43l2.93-5.1h15.14l-2.93 5.1Z" />
    <path fill="#FFBA00" d="M22.5 15.4h-6.16L10.4 5.1 13.48 0h3.08l5.94 10.3v5.1Z" />
  </svg>
);

const QUICK_BROWSER_LOGIN_SITES = [
  'metruyenchu.com.vn',
  'wikicv.net',
  'truyenfull.vision',
  'sangtacviet.xyz',
  'docln.sbs',
  'wattpad.com',
  'webnovel.com',
];

function formatRelativeTime(ts: number | null): string {
  if (!ts) return 'Chưa đồng bộ';
  const diffMin = Math.max(0, Math.round((Date.now() - ts) / 60000));
  if (diffMin < 1) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr} giờ trước`;
  return new Date(ts).toLocaleDateString('vi-VN');
}

function getSiteBadgePalette(domain: string, isDark: boolean): { bg: string; fg: string } {
  const palettes = isDark
    ? [
        { bg: '#1d2d44', fg: '#7ab3ff' },
        { bg: '#133329', fg: '#5ee3a8' },
        { bg: '#382a13', fg: '#f6c358' },
        { bg: '#2f1f40', fg: '#c8a2ff' },
        { bg: '#3c1e2a', fg: '#ff8fb1' },
        { bg: '#15313a', fg: '#6fd8f2' },
      ]
    : [
        { bg: '#dbeafe', fg: '#1d4ed8' },
        { bg: '#d1fae5', fg: '#047857' },
        { bg: '#fef3c7', fg: '#b45309' },
        { bg: '#ede9fe', fg: '#6d28d9' },
        { bg: '#fce7f3', fg: '#be185d' },
        { bg: '#cffafe', fg: '#0e7490' },
      ];
  const d = domain.toLowerCase();
  if (d.includes('metruyenchu')) return palettes[0];
  if (d.includes('wikicv')) return palettes[1];
  if (d.includes('docln') || d.includes('hako')) return palettes[2];
  let hash = 0;
  for (let i = 0; i < d.length; i++) hash = (hash * 31 + d.charCodeAt(i)) | 0;
  return palettes[Math.abs(hash) % palettes.length];
}

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
    googleAccount,
    googleAccountPresets,
    signInWithGoogle,
    signOutGoogle,
    updateAccountSettings,
    browserAccounts,
    loginBrowserSite,
    logoutBrowserSite,
    clearAllBrowserAccounts,
    googleDrive,
    updateGoogleDriveSettings,
    backupToGoogleDrive,
    restoreFromGoogleDrive,
    deleteGoogleDriveFile,
  } = usePlayer();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [navDir, setNavDir] = useState<'forward' | 'back'>('forward');
  const [readerVoiceTab, setReaderVoiceTab] = useState<'reading' | 'models' | 'providers' | 'pronunciation'>('reading');
  const [appLanguage, setAppLanguage] = useState<'vi' | 'en'>('vi');
  const [readingFont, setReadingFont] = useState<'system' | 'serif' | 'sans'>('system');
  const [smoothScroll, setSmoothScroll] = useState(true);

  const [profileSavedMsg, setProfileSavedMsg] = useState<string | null>(null);
  const [googlePickerOpen, setGooglePickerOpen] = useState(false);
  const [customGoogleName, setCustomGoogleName] = useState('');
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleAvatar, setCustomGoogleAvatar] = useState('');
  const avatarFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result) return;
      const img = new Image();
      img.onload = () => {
        try {
          const size = 256;
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const minSide = Math.min(img.width, img.height);
            const sx = (img.width - minSide) / 2;
            const sy = (img.height - minSide) / 2;
            ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
            updateAccountSettings({ avatarUrl: canvas.toDataURL('image/jpeg', 0.88) });
          } else {
            updateAccountSettings({ avatarUrl: result });
          }
        } catch {
          updateAccountSettings({ avatarUrl: result });
        }
        showProfileToast('Đã cập nhật ảnh đại diện');
      };
      img.onerror = () => {
        updateAccountSettings({ avatarUrl: result });
        showProfileToast('Đã cập nhật ảnh đại diện');
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };
  const [browserCardExpanded, setBrowserCardExpanded] = useState(false);
  const [addBrowserSiteOpen, setAddBrowserSiteOpen] = useState(false);
  const [newSiteDomain, setNewSiteDomain] = useState('truyenfull.vision');
  const [newSiteMethod, setNewSiteMethod] = useState<'google' | 'cookie'>('google');
  const [newSiteUser, setNewSiteUser] = useState('');

  const showProfileToast = (msg: string) => {
    setProfileSavedMsg(msg);
    window.setTimeout(() => setProfileSavedMsg(null), 2600);
  };

  const driveUsedMb = Number(googleDrive.files.reduce((sum, f) => sum + f.sizeMb, 0).toFixed(1));

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

  // Google account, browser sessions & Google Drive state managed via usePlayer()

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
                          {cat.id === 'account' && googleAccount.signedIn ? (
                            <div className="relative w-9 h-9 shrink-0">
                              <img
                                src={googleAccount.avatarUrl}
                                alt={googleAccount.name}
                                className="w-9 h-9 rounded-full object-cover ring-2"
                                style={{ borderColor: scheme.primary }}
                              />
                              <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-white flex items-center justify-center shadow">
                                <GoogleGLogo className="w-2.5 h-2.5" />
                              </span>
                            </div>
                          ) : (
                            <Icon className="w-[22px] h-[22px] shrink-0" style={{ color: scheme.onSurfaceVariant }} />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-base font-medium" style={{ color: scheme.onSurface }}>
                              {cat.id === 'account' && googleAccount.signedIn ? googleAccount.name : cat.title}
                            </div>
                            <div className="text-[13px] truncate" style={{ color: scheme.onSurfaceVariant }}>
                              {cat.id === 'account'
                                ? googleAccount.signedIn
                                  ? `${googleAccount.email} · ${browserAccounts.length} web · Drive`
                                  : 'Đăng nhập Google, trình duyệt & Google Drive'
                                : cat.subtitle}
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
            <div className="space-y-3.5">
              {/* 1. Google Account & Avatar Card (Compact) */}
              <div
                className="rounded-[24px] p-3.5 space-y-3 border"
                style={{
                  backgroundColor: scheme.surfaceContainerLow,
                  borderColor: `${scheme.outlineVariant}66`,
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 shrink-0">
                    {googleAccount.signedIn ? (
                      <input
                        ref={avatarFileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarFileChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => avatarFileInputRef.current?.click()}
                        aria-label="Chọn ảnh đại diện từ máy"
                        title="Chọn ảnh đại diện từ máy"
                        className="relative w-12 h-12 rounded-full block cursor-pointer active:scale-95 transition-transform"
                      >
                        <img
                          src={googleAccount.avatarUrl}
                          alt={googleAccount.name}
                          className="w-12 h-12 rounded-full object-cover shadow-sm"
                        />
                        <span
                          className="absolute -bottom-0.5 -right-0.5 w-[18px] h-[18px] rounded-full bg-white flex items-center justify-center shadow"
                        >
                          <GoogleGLogo className="w-2.5 h-2.5" />
                        </span>
                      </button>
                    ) : (
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: scheme.surfaceContainerHigh, color: scheme.onSurfaceVariant }}
                      >
                        <User className="w-5 h-5" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-[15.5px] font-semibold tracking-tight leading-snug truncate">
                      {googleAccount.signedIn ? googleAccount.name : 'Chưa đăng nhập'}
                    </div>
                    <div className="text-xs truncate mt-0.5" style={{ color: scheme.onSurfaceVariant }}>
                      {googleAccount.signedIn ? googleAccount.email : 'Đăng nhập Google'}
                    </div>
                  </div>

                  {!googleAccount.signedIn ? (
                    <button
                      type="button"
                      onClick={() => setGooglePickerOpen(true)}
                      className="h-9 px-3.5 rounded-full flex items-center gap-1.5 text-xs font-semibold border cursor-pointer active:scale-95 transition-transform shrink-0"
                      style={{
                        backgroundColor: '#ffffff',
                        color: '#1f1f1f',
                        borderColor: scheme.outlineVariant,
                      }}
                    >
                      <GoogleGLogo className="w-3.5 h-3.5" />
                      <span>Đăng nhập</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setGooglePickerOpen(true)}
                        aria-label="Đổi tài khoản"
                        title="Đổi tài khoản Google"
                        className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
                        style={{
                          backgroundColor: scheme.surfaceContainerHigh,
                          color: scheme.onSurface,
                        }}
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          signOutGoogle();
                          showProfileToast('Đã đăng xuất Google');
                        }}
                        aria-label="Đăng xuất"
                        title="Đăng xuất"
                        className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
                        style={{
                          backgroundColor: scheme.isDark ? 'rgba(239, 68, 68, 0.14)' : scheme.errorContainer,
                          color: scheme.isDark ? '#f87171' : scheme.error,
                        }}
                      >
                        <LogOut className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {googlePickerOpen && (
                  <div
                    className="rounded-2xl p-3.5 space-y-3 border animate-dialog-in"
                    style={{ borderColor: `${scheme.outlineVariant}88`, backgroundColor: scheme.surfaceContainerLowest }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GoogleGLogo className="w-4 h-4" />
                        <span className="text-sm font-semibold">Chọn tài khoản Google</span>
                      </div>
                      <button type="button" onClick={() => setGooglePickerOpen(false)} className="p-1 cursor-pointer">
                        <X className="w-4 h-4" style={{ color: scheme.onSurfaceVariant }} />
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      {googleAccountPresets.map((preset) => {
                        const isCurrent = googleAccount.signedIn && googleAccount.email === preset.email;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => {
                              signInWithGoogle(preset);
                              setGooglePickerOpen(false);
                              showProfileToast(`Đã đăng nhập Google: ${preset.email}`);
                            }}
                            className="w-full p-2.5 rounded-xl flex items-center gap-3 text-left transition cursor-pointer"
                            style={{
                              backgroundColor: isCurrent ? scheme.primaryContainer : scheme.surfaceContainerLow,
                              color: isCurrent ? scheme.onPrimaryContainer : scheme.onSurface,
                            }}
                          >
                            <img src={preset.avatarUrl} alt={preset.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">{preset.name}</div>
                              <div className="text-xs opacity-75 truncate">{preset.email}</div>
                            </div>
                            {isCurrent && <Check className="w-4 h-4 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                    <Divider color={scheme.outlineVariant} />
                    <div className="space-y-2">
                      <div className="text-xs font-medium" style={{ color: scheme.onSurfaceVariant }}>
                        Hoặc nhập tài khoản Google khác
                      </div>
                      <input
                        type="text"
                        value={customGoogleName}
                        onChange={(e) => setCustomGoogleName(e.target.value)}
                        placeholder="Tên hiển thị (VD: Trần Trung Dũng)"
                        className="w-full h-9 px-3 rounded-xl border bg-transparent text-xs outline-none"
                        style={{ borderColor: scheme.outlineVariant }}
                      />
                      <input
                        type="email"
                        value={customGoogleEmail}
                        onChange={(e) => setCustomGoogleEmail(e.target.value)}
                        placeholder="Email Gmail (VD: tenban@gmail.com)"
                        className="w-full h-9 px-3 rounded-xl border bg-transparent text-xs outline-none"
                        style={{ borderColor: scheme.outlineVariant }}
                      />
                      <input
                        type="url"
                        value={customGoogleAvatar}
                        onChange={(e) => setCustomGoogleAvatar(e.target.value)}
                        placeholder="Link ảnh đại diện Google (tuỳ chọn)"
                        className="w-full h-9 px-3 rounded-xl border bg-transparent text-xs outline-none"
                        style={{ borderColor: scheme.outlineVariant }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!customGoogleEmail.trim()) return;
                          signInWithGoogle({
                            name: customGoogleName.trim() || customGoogleEmail.split('@')[0],
                            email: customGoogleEmail.trim(),
                            avatarUrl: customGoogleAvatar.trim() || undefined,
                          });
                          setCustomGoogleName('');
                          setCustomGoogleEmail('');
                          setCustomGoogleAvatar('');
                          setGooglePickerOpen(false);
                          showProfileToast('Đã liên kết tài khoản Google mới');
                        }}
                        className="w-full h-9 rounded-full text-xs font-medium cursor-pointer"
                        style={{ backgroundColor: scheme.primary, color: scheme.onPrimary }}
                      >
                        Tiếp tục với tài khoản này
                      </button>
                    </div>
                  </div>
                )}

                {profileSavedMsg && (
                  <p className="text-xs font-medium" style={{ color: scheme.primary }}>
                    {profileSavedMsg}
                  </p>
                )}
              </div>

              {/* 2. In-App Browser Accounts Card (Collapsible) */}
              <div
                className="rounded-[28px] p-5 border transition-all"
                style={{
                  backgroundColor: scheme.surfaceContainerLow,
                  borderColor: `${scheme.outlineVariant}66`,
                }}
              >
                <button
                  type="button"
                  onClick={() => setBrowserCardExpanded((v) => !v)}
                  className="w-full flex items-center justify-between gap-3 text-left cursor-pointer active:opacity-80"
                  aria-expanded={browserCardExpanded}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0 border"
                      style={{
                        backgroundColor: scheme.surfaceContainerLowest,
                        borderColor: `${scheme.outlineVariant}55`,
                      }}
                    >
                      <Globe className="w-5 h-5" style={{ color: scheme.primary }} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[16px] font-semibold tracking-tight truncate">Trình duyệt app</div>
                      <div className="text-xs truncate mt-0.5" style={{ color: scheme.onSurfaceVariant }}>
                        {browserAccounts.length > 0
                          ? `${browserAccounts.length} web đã đăng nhập${googleAccount.signedIn && googleAccount.useGoogleInBrowser ? ' • Tự động Google' : ''}`
                          : 'Chưa có web nào đăng nhập'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className="text-xs font-medium px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: scheme.surfaceContainerHigh, color: scheme.onSurfaceVariant }}
                    >
                      {browserAccounts.length} web
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 transition-transform duration-200 ${browserCardExpanded ? 'rotate-180' : ''}`}
                      style={{ color: scheme.onSurfaceVariant }}
                    />
                  </div>
                </button>

                {browserCardExpanded && (
                  <div className="space-y-4 pt-4 mt-4 border-t" style={{ borderColor: `${scheme.outlineVariant}55` }}>
                <SettingsSwitchRow
                  title="Tự động đăng nhập bằng Google"
                  subtitle={
                    googleAccount.signedIn
                      ? `Gợi ý ${googleAccount.email} khi mở web`
                      : 'Đăng nhập Google để bật gợi ý tự động'
                  }
                  checked={googleAccount.signedIn && googleAccount.useGoogleInBrowser}
                  onChange={() => {
                    if (!googleAccount.signedIn) {
                      setGooglePickerOpen(true);
                      return;
                    }
                    updateAccountSettings({ useGoogleInBrowser: !googleAccount.useGoogleInBrowser });
                  }}
                />

                <div className="flex items-center justify-between gap-2 pt-1">
                  <span
                    className="text-[11px] font-semibold tracking-wider uppercase"
                    style={{ color: scheme.onSurfaceVariant }}
                  >
                    Đã đăng nhập
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setAddBrowserSiteOpen((v) => !v)}
                      className="h-8 px-3 rounded-full text-xs font-medium flex items-center gap-1 cursor-pointer active:scale-95 transition-transform"
                      style={{
                        backgroundColor: `${scheme.primary}22`,
                        color: scheme.primary,
                      }}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm web</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openSourceBrowser()}
                      className="h-8 px-3 rounded-full text-xs font-medium flex items-center gap-1 cursor-pointer active:scale-95 transition-transform"
                      style={{
                        backgroundColor: scheme.surfaceContainerHigh,
                        color: scheme.onSurface,
                      }}
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>Trình duyệt</span>
                    </button>
                  </div>
                </div>

                {addBrowserSiteOpen && (
                  <div
                    className="rounded-2xl p-3.5 space-y-2.5 border animate-dialog-in"
                    style={{ borderColor: `${scheme.outlineVariant}88`, backgroundColor: scheme.surfaceContainerLowest }}
                  >
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_BROWSER_LOGIN_SITES.map((site) => (
                        <button
                          key={site}
                          type="button"
                          onClick={() => setNewSiteDomain(site)}
                          className="px-2.5 py-1 rounded-full text-[11px] font-medium cursor-pointer"
                          style={{
                            backgroundColor: newSiteDomain === site ? scheme.primary : scheme.surfaceContainerHigh,
                            color: newSiteDomain === site ? scheme.onPrimary : scheme.onSurface,
                          }}
                        >
                          {site}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={newSiteDomain}
                      onChange={(e) => setNewSiteDomain(e.target.value)}
                      placeholder="Tên miền web (VD: metruyenchu.com.vn)"
                      className="w-full h-9 px-3 rounded-xl border bg-transparent text-xs outline-none"
                      style={{ borderColor: scheme.outlineVariant }}
                    />
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setNewSiteMethod('google')}
                        className="h-8 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer"
                        style={{
                          backgroundColor: newSiteMethod === 'google' ? scheme.primaryContainer : scheme.surfaceContainerLow,
                          color: newSiteMethod === 'google' ? scheme.onPrimaryContainer : scheme.onSurfaceVariant,
                        }}
                      >
                        <GoogleGLogo className="w-3.5 h-3.5" />
                        <span>Dùng Google</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewSiteMethod('cookie')}
                        className="h-8 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer"
                        style={{
                          backgroundColor: newSiteMethod === 'cookie' ? scheme.primaryContainer : scheme.surfaceContainerLow,
                          color: newSiteMethod === 'cookie' ? scheme.onPrimaryContainer : scheme.onSurfaceVariant,
                        }}
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Tài khoản web</span>
                      </button>
                    </div>
                    {newSiteMethod === 'cookie' && (
                      <input
                        type="text"
                        value={newSiteUser}
                        onChange={(e) => setNewSiteUser(e.target.value)}
                        placeholder="Tên đăng nhập / email trên web"
                        className="w-full h-9 px-3 rounded-xl border bg-transparent text-xs outline-none"
                        style={{ borderColor: scheme.outlineVariant }}
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (!newSiteDomain.trim()) return;
                        if (newSiteMethod === 'google' && !googleAccount.signedIn) {
                          setGooglePickerOpen(true);
                          return;
                        }
                        loginBrowserSite(newSiteDomain, newSiteMethod, newSiteUser);
                        setNewSiteUser('');
                        setAddBrowserSiteOpen(false);
                        showProfileToast(`Đã lưu phiên đăng nhập cho ${newSiteDomain}`);
                      }}
                      className="w-full h-9 rounded-full text-xs font-medium cursor-pointer"
                      style={{ backgroundColor: scheme.primary, color: scheme.onPrimary }}
                    >
                      {newSiteMethod === 'google' ? 'Đăng nhập web bằng Google' : 'Lưu phiên đăng nhập'}
                    </button>
                  </div>
                )}

                {browserAccounts.length === 0 ? (
                  <div
                    className="rounded-[20px] p-4 text-center text-xs border"
                    style={{
                      backgroundColor: scheme.surfaceContainerLowest,
                      borderColor: `${scheme.outlineVariant}44`,
                      color: scheme.onSurfaceVariant,
                    }}
                  >
                    Chưa có trang web nào được đăng nhập trong trình duyệt app.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {browserAccounts.map((acc) => {
                      const badge = getSiteBadgePalette(acc.domain, scheme.isDark);
                      return (
                        <div
                          key={acc.id}
                          className="rounded-[20px] px-3.5 py-3 flex items-center gap-3 border"
                          style={{
                            backgroundColor: scheme.surfaceContainerLowest,
                            borderColor: `${scheme.outlineVariant}44`,
                          }}
                        >
                          <div
                            className="w-10 h-10 rounded-[12px] flex items-center justify-center text-[15px] font-bold shrink-0"
                            style={{ backgroundColor: badge.bg, color: badge.fg }}
                          >
                            {acc.domain[0]?.toUpperCase() || 'W'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[14px] font-semibold truncate">{acc.domain}</span>
                              <span
                                className="text-[10.5px] font-medium px-2 py-0.5 rounded-[7px] shrink-0"
                                style={{
                                  backgroundColor: scheme.surfaceContainerHigh,
                                  color: scheme.onSurfaceVariant,
                                }}
                              >
                                {acc.method === 'google' ? 'Google' : 'Cookie'}
                              </span>
                            </div>
                            <div className="text-xs truncate mt-0.5" style={{ color: scheme.onSurfaceVariant }}>
                              {acc.accountLabel} • {formatRelativeTime(acc.loggedInAt)}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              logoutBrowserSite(acc.domain);
                              showProfileToast(`Đã đăng xuất khỏi ${acc.domain}`);
                            }}
                            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 cursor-pointer active:scale-90 transition-transform"
                            style={{ color: scheme.onSurfaceVariant }}
                            aria-label={`Đăng xuất ${acc.domain}`}
                            title={`Đăng xuất ${acc.domain}`}
                          >
                            <LogOut className="w-[17px] h-[17px]" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {browserAccounts.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      clearAllBrowserAccounts();
                      showProfileToast('Đã đăng xuất tất cả tài khoản trong trình duyệt');
                    }}
                    className="w-full h-11 rounded-full text-[13px] font-medium cursor-pointer active:scale-[0.98] transition-transform"
                    style={{
                      backgroundColor: scheme.isDark ? 'rgba(239, 68, 68, 0.14)' : scheme.errorContainer,
                      color: scheme.isDark ? '#f87171' : scheme.error,
                    }}
                  >
                    Đăng xuất tất cả phiên trình duyệt
                  </button>
                )}
                  </div>
                )}
              </div>

              {/* 3. Google Drive Cloud Storage Card */}
              <div
                className="rounded-[28px] p-5 space-y-4 border"
                style={{
                  backgroundColor: scheme.surfaceContainerLow,
                  borderColor: `${scheme.outlineVariant}66`,
                }}
              >
                {/* Header */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0 border"
                      style={{
                        backgroundColor: scheme.surfaceContainerLowest,
                        borderColor: `${scheme.outlineVariant}55`,
                      }}
                    >
                      <GoogleDriveLogo className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[16px] font-semibold tracking-tight truncate">Google Drive</div>
                      <div className="text-xs truncate mt-0.5" style={{ color: scheme.onSurfaceVariant }}>
                        {googleAccount.signedIn
                          ? `${googleDrive.folderName} • ${formatRelativeTime(googleDrive.lastSyncedAt)}`
                          : 'Sao lưu tủ sách & EPUB lên đám mây'}
                      </div>
                    </div>
                  </div>
                  {googleAccount.signedIn && (
                    <M3ExpressiveSwitch
                      checked={googleDrive.enabled}
                      onChange={() => updateGoogleDriveSettings({ enabled: !googleDrive.enabled })}
                      scheme={scheme}
                    />
                  )}
                </div>

                {!googleAccount.signedIn ? (
                  <button
                    type="button"
                    onClick={() => setGooglePickerOpen(true)}
                    className="w-full h-11 rounded-full text-[13px] font-medium flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] transition-transform"
                    style={{ backgroundColor: scheme.primary, color: scheme.onPrimary }}
                  >
                    <GoogleGLogo className="w-4 h-4" />
                    <span>Đăng nhập Google để kết nối Drive</span>
                  </button>
                ) : !googleDrive.enabled ? (
                  <div
                    className="rounded-[20px] px-4 py-3.5 text-xs flex items-center justify-between gap-3 border"
                    style={{
                      backgroundColor: scheme.surfaceContainerLowest,
                      borderColor: `${scheme.outlineVariant}44`,
                      color: scheme.onSurfaceVariant,
                    }}
                  >
                    <span>Bật công tắc phía trên để lưu tệp sao lưu và sách EPUB vào Google Drive.</span>
                  </div>
                ) : (
                  <>
                    {/* Storage Summary Tile */}
                    {(() => {
                      const backupMb = googleDrive.files
                        .filter((f) => f.kind !== 'epub')
                        .reduce((acc, f) => acc + f.sizeMb, 0);
                      const epubMb = googleDrive.files
                        .filter((f) => f.kind === 'epub')
                        .reduce((acc, f) => acc + f.sizeMb, 0);
                      const backupPct =
                        driveUsedMb > 0 ? Math.min(100, Math.max(4, (backupMb / (googleDrive.quotaGb * 1024)) * 100 * 28)) : 0;
                      const epubPct =
                        driveUsedMb > 0 ? Math.min(100 - backupPct, Math.max(epubMb > 0 ? 5 : 0, (epubMb / (googleDrive.quotaGb * 1024)) * 100 * 28)) : 0;
                      const backupCount = googleDrive.files.filter((f) => f.kind !== 'epub').length;
                      const epubCount = googleDrive.files.filter((f) => f.kind === 'epub').length;

                      return (
                        <div
                          className="rounded-[20px] p-3.5 space-y-3 border"
                          style={{
                            backgroundColor: scheme.surfaceContainerLowest,
                            borderColor: `${scheme.outlineVariant}44`,
                          }}
                        >
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="text-xs font-medium" style={{ color: scheme.onSurfaceVariant }}>
                              Dung lượng đã dùng
                            </span>
                            <div className="text-xs tabular-nums">
                              <span className="text-[14px] font-semibold" style={{ color: scheme.onSurface }}>
                                {driveUsedMb} MB
                              </span>
                              <span style={{ color: scheme.onSurfaceVariant }}> / {googleDrive.quotaGb} GB</span>
                            </div>
                          </div>

                          <div
                            className="w-full h-2 rounded-full overflow-hidden flex gap-0.5"
                            style={{ backgroundColor: scheme.surfaceContainerHigh }}
                          >
                            {backupPct > 0 && (
                              <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{ width: `${backupPct}%`, backgroundColor: scheme.primary }}
                              />
                            )}
                            {epubPct > 0 && (
                              <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{ width: `${epubPct}%`, backgroundColor: scheme.isDark ? '#5ee3a8' : '#10b981' }}
                              />
                            )}
                          </div>

                          <div className="grid grid-cols-3 gap-2 pt-0.5 text-center">
                            <div className="rounded-xl py-1.5 px-2" style={{ backgroundColor: scheme.surfaceContainerLow }}>
                              <div className="text-[13px] font-semibold tabular-nums">{backupCount}</div>
                              <div className="text-[10.5px]" style={{ color: scheme.onSurfaceVariant }}>
                                Bản sao lưu
                              </div>
                            </div>
                            <div className="rounded-xl py-1.5 px-2" style={{ backgroundColor: scheme.surfaceContainerLow }}>
                              <div className="text-[13px] font-semibold tabular-nums">{epubCount}</div>
                              <div className="text-[10.5px]" style={{ color: scheme.onSurfaceVariant }}>
                                Tệp EPUB
                              </div>
                            </div>
                            <div className="rounded-xl py-1.5 px-2" style={{ backgroundColor: scheme.surfaceContainerLow }}>
                              <div className="text-[13px] font-semibold truncate">
                                {googleDrive.syncEpubFiles ? 'Tự động' : 'Thủ công'}
                              </div>
                              <div className="text-[10.5px]" style={{ color: scheme.onSurfaceVariant }}>
                                Chế độ lưu
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Compact Auto-Sync Toggle */}
                    <SettingsSwitchRow
                      title="Tự động đồng bộ EPUB & tiến độ"
                      subtitle="Tự tải lên Drive khi nhập sách mới hoặc đổi chương"
                      checked={googleDrive.syncEpubFiles}
                      onChange={() => updateGoogleDriveSettings({ syncEpubFiles: !googleDrive.syncEpubFiles })}
                    />

                  </>
                )}
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

              {/* Google Drive Storage Quick Card */}
              <div className="rounded-[28px] p-4 space-y-3" style={{ backgroundColor: scheme.surfaceContainerLow }}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <GoogleDriveLogo className="w-5 h-5 shrink-0" />
                    <div>
                      <div className="text-[15px] font-medium">Lưu trữ Google Drive</div>
                      <div className="text-xs" style={{ color: scheme.onSurfaceVariant }}>
                        {googleAccount.signedIn
                          ? `${googleDrive.files.length} tệp · ${driveUsedMb} MB tại ${googleDrive.folderName}`
                          : 'Chưa kết nối tài khoản Google'}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigateTo('account')}
                    className="h-8 px-3 rounded-full text-xs font-medium cursor-pointer"
                    style={{ backgroundColor: scheme.secondaryContainer, color: scheme.onSecondaryContainer }}
                  >
                    Quản lý
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => (googleAccount.signedIn ? backupToGoogleDrive('backup') : navigateTo('account'))}
                    className="flex-1 h-10 rounded-full text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer"
                    style={{ backgroundColor: scheme.primary, color: scheme.onPrimary }}
                  >
                    <Cloud className="w-4 h-4" />
                    <span>{googleAccount.signedIn ? 'Lưu file lên Google Drive' : 'Đăng nhập Google'}</span>
                  </button>
                </div>
                {googleDrive.statusMessage && (
                  <p className="text-xs font-medium" style={{ color: scheme.primary }}>
                    {googleDrive.statusMessage}
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

              <div className="rounded-[28px] p-4 space-y-3" style={{ backgroundColor: scheme.surfaceContainerLow }}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <GoogleDriveLogo className="w-5 h-5 shrink-0" />
                    <div>
                      <div className="text-[15px] font-medium">Sao lưu đám mây Google Drive</div>
                      <div className="text-xs" style={{ color: scheme.onSurfaceVariant }}>
                        {googleAccount.signedIn
                          ? `${googleAccount.email} · ${formatRelativeTime(googleDrive.lastSyncedAt)}`
                          : 'Đăng nhập Google trong mục Tài khoản để bật'}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => (googleAccount.signedIn ? backupToGoogleDrive('backup') : navigateTo('account'))}
                    className="flex-1 h-11 rounded-full flex items-center justify-center gap-2 text-xs font-medium cursor-pointer"
                    style={{ backgroundColor: scheme.primary, color: scheme.onPrimary }}
                  >
                    <Cloud className="w-4 h-4" />
                    <span>Lưu lên Drive</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => (googleAccount.signedIn ? restoreFromGoogleDrive() : navigateTo('account'))}
                    className="flex-1 h-11 rounded-full flex items-center justify-center gap-2 text-xs font-medium cursor-pointer"
                    style={{ backgroundColor: scheme.secondaryContainer, color: scheme.onSecondaryContainer }}
                  >
                    <CloudDownload className="w-4 h-4" />
                    <span>Khôi phục Drive</span>
                  </button>
                </div>
                {googleDrive.statusMessage && (
                  <p className="text-xs font-medium" style={{ color: scheme.primary }}>
                    {googleDrive.statusMessage}
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
                <button
                  type="button"
                  onClick={() => navigateTo('account')}
                  className="w-full p-4 flex items-center gap-3.5 text-left cursor-pointer active:opacity-90"
                >
                  <div
                    className="w-11 h-11 rounded-[14px] flex items-center justify-center shrink-0 overflow-hidden"
                    style={{ backgroundColor: scheme.secondaryContainer, color: scheme.onSecondaryContainer }}
                  >
                    {googleAccount.signedIn ? (
                      <img src={googleAccount.avatarUrl} alt={googleAccount.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">Quản lý tài khoản đã đăng nhập ({browserAccounts.length})</div>
                    <div className="text-xs mt-0.5 truncate" style={{ color: scheme.onSurfaceVariant }}>
                      {googleAccount.signedIn && googleAccount.useGoogleInBrowser
                        ? `Đang dùng Google (${googleAccount.email}) cho web trong app`
                        : 'Xem và quản lý các phiên đăng nhập trang truyện'}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 shrink-0 opacity-60" style={{ color: scheme.onSurfaceVariant }} />
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
