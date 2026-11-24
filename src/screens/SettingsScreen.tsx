import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  BookOpenText,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Cloud,
  CloudDownload,
  CloudUpload,
  DatabaseBackup,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileJson,
  Flame,
  Globe,
  HardDrive,
  Image as ImageIcon,
  Info,
  KeyRound,
  LogOut,
  Mic,
  Moon,
  Palette,
  Plus,
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
  X,
  Zap,
} from 'lucide-react';
import { ColorMode, UiTheme } from '../model/types';
import { MaterialColorScheme } from '../theme/materialTheme';
import { MONET, RAW_SOURCES, VOICE_MODEL_PACKAGES, placeholderStory } from '../model/mockData';
import { usePlayer } from '../state/usePlayerStore';
import { VoiceClonePage, VoiceManagerPage } from './VoiceManagerPage';
import { M3ExpressiveSlider, M3ExpressiveSwitch } from '../components/M3Expressive';
import { SwipeableBottomSheet } from '../components/SwipeableBottomSheet';
import {
  getGoogleAccessToken,
  GoogleAuthSnapshot,
  signInWithGoogle,
  signOutGoogle,
  subscribeGoogleAuth,
} from '../services/googleAuth';
import {
  deleteDriveFile,
  downloadDriveFile,
  DriveBackupFile,
  listAppDriveFiles,
  saveBackupToDrive,
} from '../services/googleDrive';
import {
  BrowserAccountSettings,
  clearAllBrowserSessions,
  loginBrowserSite,
  logoutBrowserSite,
  setAutoUseGoogleInBrowser,
  subscribeBrowserAccounts,
} from '../services/browserAccounts';
import { GoogleAvatar, GoogleDriveLogo, GoogleGLogo, GoogleSignInButton } from '../components/GoogleSignInButton';

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
      { id: 'account', title: 'Tài khoản', subtitle: 'Đăng nhập Google, hồ sơ, bảo mật', icon: User },
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
      { id: 'storage', title: 'Lưu trữ', subtitle: 'Ngoại tuyến, bộ nhớ đệm, Google Drive', icon: HardDrive },
      { id: 'backup', title: 'Đồng bộ & sao lưu', subtitle: 'Thiết bị khác, Drive, khôi phục', icon: DatabaseBackup },
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
  customAvatarDataUrl?: string | null;
  driveEnabled: boolean;
  autoDriveSync: boolean;
  lastDriveSyncAt?: number | null;
  syncMethod: 'google_drive' | 'local_file';
  backupRetention: number;
  appLock: boolean;
  hideLockscreenHistory: boolean;
}

function loadProfile(): LocalProfile {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<LocalProfile>;
      return {
        signedIn: parsed.signedIn ?? true,
        name: parsed.name || 'Độc giả NovelBook',
        email: parsed.email || 'docgia@novelbook.app',
        customAvatarDataUrl: parsed.customAvatarDataUrl ?? null,
        driveEnabled: parsed.driveEnabled ?? true,
        autoDriveSync: parsed.autoDriveSync ?? true,
        lastDriveSyncAt: parsed.lastDriveSyncAt ?? null,
        syncMethod: parsed.syncMethod === 'local_file' ? 'local_file' : 'google_drive',
        backupRetention: typeof parsed.backupRetention === 'number' ? parsed.backupRetention : 5,
        appLock: parsed.appLock ?? false,
        hideLockscreenHistory: parsed.hideLockscreenHistory ?? false,
      };
    }
  } catch {
    // ignore storage read error
  }
  return {
    signedIn: true,
    name: 'Độc giả NovelBook',
    email: 'docgia@novelbook.app',
    customAvatarDataUrl: null,
    driveEnabled: true,
    autoDriveSync: true,
    lastDriveSyncAt: null,
    syncMethod: 'google_drive',
    backupRetention: 5,
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
    setWikiCvLoggedIn,
  } = usePlayer();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [navDir, setNavDir] = useState<'forward' | 'back'>('forward');
  const [readerVoiceTab, setReaderVoiceTab] = useState<'reading' | 'models' | 'providers' | 'pronunciation'>('reading');
  const [appLanguage, setAppLanguage] = useState<'vi' | 'en'>('vi');
  const [readingFont, setReadingFont] = useState<'system' | 'serif' | 'sans'>('system');
  const [smoothScroll, setSmoothScroll] = useState(true);

  const [profile, setProfile] = useState<LocalProfile>(() => loadProfile());
  const [profileSavedMsg, setProfileSavedMsg] = useState<string | null>(null);
  const [googleAuth, setGoogleAuth] = useState<GoogleAuthSnapshot>({
    user: null,
    photoURL: null,
    hasDriveToken: false,
    ready: false,
  });
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [browserAccounts, setBrowserAccounts] = useState<BrowserAccountSettings>({
    autoUseGoogleInBrowser: true,
    sessions: [],
  });
  const [confirmClearBrowser, setConfirmClearBrowser] = useState(false);
  const [confirmSignOutGoogle, setConfirmSignOutGoogle] = useState(false);
  const [browserCardExpanded, setBrowserCardExpanded] = useState(true);
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftAvatar, setDraftAvatar] = useState<string | null>(null);
  const [addWebSheetOpen, setAddWebSheetOpen] = useState(false);
  const [addWebDomain, setAddWebDomain] = useState('metruyensangtac.com');
  const [addWebAccount, setAddWebAccount] = useState('');
  const [addWebMethod, setAddWebMethod] = useState<'google' | 'cookie'>('google');
  const [addWebError, setAddWebError] = useState<string | null>(null);
  const [driveFilesExpanded, setDriveFilesExpanded] = useState(false);
  const [syncMethodSheetOpen, setSyncMethodSheetOpen] = useState(false);
  const [retentionSheetOpen, setRetentionSheetOpen] = useState(false);
  const [driveRestoreSheetOpen, setDriveRestoreSheetOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportSections, setExportSections] = useState({
    shelf: true,
    extensions: true,
    downloaded: true,
    settings: true,
    other: true,
    qtDict: true,
  });
  const [driveBackupDialogOpen, setDriveBackupDialogOpen] = useState(false);
  const [driveBackupSections, setDriveBackupSections] = useState({
    shelf: true,
    extensions: true,
    settings: true,
    other: true,
  });

  const [driveFiles, setDriveFiles] = useState<DriveBackupFile[]>([]);
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveUploadProgress, setDriveUploadProgress] = useState<{ loaded: number; total: number } | null>(null);
  const [driveFileName, setDriveFileName] = useState('NovelBook-storage.json');
  const [driveStatus, setDriveStatus] = useState<string | null>(null);
  const [driveError, setDriveError] = useState<string | null>(null);
  const [pendingDriveAction, setPendingDriveAction] = useState<
    | { type: 'overwrite'; file: DriveBackupFile; targetName: string }
    | { type: 'restore'; file: DriveBackupFile }
    | { type: 'delete'; file: DriveBackupFile }
    | null
  >(null);

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
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const unsubAuth = subscribeGoogleAuth(setGoogleAuth);
    const unsubBrowser = subscribeBrowserAccounts(setBrowserAccounts);
    return () => {
      unsubAuth();
      unsubBrowser();
    };
  }, []);

  const refreshDriveFiles = async (tokenOverride?: string | null) => {
    const token = tokenOverride ?? getGoogleAccessToken();
    if (!token) return;
    setDriveLoading(true);
    setDriveError(null);
    try {
      const files = await listAppDriveFiles(token);
      setDriveFiles(files);
    } catch (err) {
      setDriveError(err instanceof Error ? err.message : 'Không tải được danh sách Google Drive.');
    } finally {
      setDriveLoading(false);
    }
  };

  useEffect(() => {
    if ((selectedId === 'storage' || selectedId === 'backup' || selectedId === 'account') && googleAuth.hasDriveToken) {
      refreshDriveFiles();
    }
  }, [selectedId, googleAuth.hasDriveToken]);

  const handleGoogleSignIn = async () => {
    setGoogleError(null);
    setGoogleLoading(true);
    try {
      const res = await signInWithGoogle();
      saveProfile(
        {
          ...profile,
          signedIn: true,
          driveEnabled: true,
          name: res.user.displayName || profile.name,
          email: res.user.email || profile.email,
        },
        'Đã kết nối tài khoản Google'
      );
      if (selectedId === 'storage' || selectedId === 'backup' || selectedId === 'account') {
        await refreshDriveFiles(res.accessToken);
      }
    } catch (err) {
      setGoogleError(err instanceof Error ? err.message : 'Không thể đăng nhập bằng Google.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleSignOut = async () => {
    setConfirmSignOutGoogle(false);
    await signOutGoogle();
    setDriveFiles([]);
    setDriveStatus(null);
  };

  const handleSaveToDriveClick = async () => {
    const token = getGoogleAccessToken();
    if (!token) {
      setDriveError('Phiên Google Drive cần được kết nối lại.');
      return;
    }
    const cleanName = (driveFileName.trim() || 'NovelBook-storage.json').endsWith('.json')
      ? driveFileName.trim() || 'NovelBook-storage.json'
      : `${driveFileName.trim()}.json`;

    const existing = driveFiles.find((f) => f.name.toLowerCase() === cleanName.toLowerCase());
    if (existing) {
      setPendingDriveAction({ type: 'overwrite', file: existing, targetName: cleanName });
      return;
    }

    setDriveLoading(true);
    setDriveError(null);
    setDriveStatus(null);
    try {
      const saved = await saveBackupToDrive(token, cleanName, exportBackupJson());
      saveProfile({ ...profile, lastDriveSyncAt: Date.now(), driveEnabled: true });
      setDriveStatus(`Đã lưu "${saved.name}" lên Google Drive.`);
      await refreshDriveFiles(token);
    } catch (err) {
      setDriveError(err instanceof Error ? err.message : 'Lưu tệp lên Google Drive thất bại.');
    } finally {
      setDriveLoading(false);
    }
  };

  const executeConfirmedDriveAction = async () => {
    if (!pendingDriveAction) return;
    const action = pendingDriveAction;
    const token = getGoogleAccessToken();
    if (!token) {
      setPendingDriveAction(null);
      setDriveError('Phiên Google Drive đã hết hạn. Vui lòng kết nối lại Google.');
      return;
    }
    setPendingDriveAction(null);
    setDriveLoading(true);
    setDriveError(null);
    setDriveStatus(null);
    try {
      if (action.type === 'overwrite') {
        const saved = await saveBackupToDrive(token, action.targetName, exportBackupJson(), action.file.id);
        saveProfile({ ...profile, lastDriveSyncAt: Date.now(), driveEnabled: true });
        setDriveStatus(`Đã cập nhật tệp "${saved.name}" trên Google Drive.`);
        await refreshDriveFiles(token);
      } else if (action.type === 'restore') {
        const json = await downloadDriveFile(token, action.file.id);
        importBackupJson(json);
        setDriveStatus(`Đã khôi phục dữ liệu từ "${action.file.name}".`);
      } else if (action.type === 'delete') {
        await deleteDriveFile(token, action.file.id);
        setDriveStatus(`Đã xoá "${action.file.name}" khỏi Google Drive.`);
        await refreshDriveFiles(token);
      }
    } catch (err) {
      setDriveError(err instanceof Error ? err.message : 'Thao tác Google Drive thất bại.');
    } finally {
      setDriveLoading(false);
    }
  };

  const handleAvatarFileSelected = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : null;
      if (!result) return;
      const img = new Image();
      img.onload = () => {
        const size = 256;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
        setDraftAvatar(canvas.toDataURL('image/jpeg', 0.86));
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const openProfileSheet = () => {
    setDraftName(googleAuth.user?.displayName && profile.name === 'Độc giả NovelBook' ? googleAuth.user.displayName : profile.name);
    setDraftAvatar(profile.customAvatarDataUrl || googleAuth.photoURL || null);
    setProfileSheetOpen(true);
  };

  const handleAddWebSubmit = async () => {
    setAddWebError(null);
    const cleanDomain = addWebDomain
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0];
    if (!cleanDomain || !cleanDomain.includes('.')) {
      setAddWebError('Vui lòng nhập tên miền hợp lệ (ví dụ: metruyensangtac.com).');
      return;
    }

    if (addWebMethod === 'google') {
      setGoogleLoading(true);
      try {
        let user = googleAuth.user;
        let photo = googleAuth.photoURL;
        if (!user) {
          const res = await signInWithGoogle();
          user = res.user;
          photo = res.photoURL;
        }
        loginBrowserSite({
          domain: cleanDomain,
          accountName: user.displayName || user.email || profile.name,
          email: user.email || profile.email,
          avatarUrl: photo,
          authMethod: 'google',
        });
        if (cleanDomain === 'wikicv.org') setWikiCvLoggedIn(true);
        setAddWebSheetOpen(false);
        setAddWebAccount('');
      } catch (err) {
        setAddWebError(err instanceof Error ? err.message : 'Không thể đăng nhập Google cho trang web.');
      } finally {
        setGoogleLoading(false);
      }
      return;
    }

    const account = addWebAccount.trim();
    if (!account) {
      setAddWebError('Vui lòng nhập tên tài khoản hoặc cookie phiên.');
      return;
    }
    loginBrowserSite({
      domain: cleanDomain,
      accountName: account,
      email: account,
      avatarUrl: null,
      authMethod: 'cookie',
    });
    if (cleanDomain === 'wikicv.org') setWikiCvLoggedIn(true);
    setAddWebSheetOpen(false);
    setAddWebAccount('');
  };

  const buildFilteredBackupJson = (sections: {
    shelf?: boolean;
    extensions?: boolean;
    downloaded?: boolean;
    settings?: boolean;
    other?: boolean;
    qtDict?: boolean;
  }): string => {
    const parsed = JSON.parse(exportBackupJson()) as Record<string, unknown>;
    const filtered: Record<string, unknown> = {
      exportedAt: parsed.exportedAt || Date.now(),
      includedSections: Object.entries(sections)
        .filter(([, checked]) => checked)
        .map(([k]) => k),
    };
    if (sections.shelf) filtered.libraryItems = parsed.libraryItems ?? [];
    if (sections.other || sections.shelf) filtered.historyItems = parsed.historyItems ?? [];
    if (sections.qtDict) filtered.pronunciationRules = parsed.pronunciationRules ?? [];
    if (sections.settings) filtered.settings = parsed.settings ?? {};
    if (sections.extensions) {
      filtered.extensions = {
        adblockExtEnabled,
        parserExtEnabled,
        geckoExtEnabled,
        permDomAccess,
        permScriptInject,
      };
    }
    if (sections.downloaded) {
      filtered.offlineAutoDownload = offlineAutoDownload;
    }
    return JSON.stringify(filtered, null, 2);
  };

  const handleExportSelected = () => {
    try {
      const json = buildFilteredBackupJson(exportSections);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'NovelBook-backup.json';
      a.click();
      URL.revokeObjectURL(url);
      setExportDialogOpen(false);
    } catch {
      handleExport();
      setExportDialogOpen(false);
    }
  };

  const handleDriveBackupSelected = async () => {
    const token = getGoogleAccessToken();
    if (!token) {
      setDriveBackupDialogOpen(false);
      setDriveError('Phiên Google Drive đã hết hạn. Vui lòng đăng nhập lại.');
      return;
    }
    const stamp = new Date();
    const tag = `${stamp.getFullYear()}${String(stamp.getMonth() + 1).padStart(2, '0')}${String(
      stamp.getDate()
    ).padStart(2, '0')}-${String(stamp.getHours()).padStart(2, '0')}${String(stamp.getMinutes()).padStart(2, '0')}`;
    const name = `NovelBook-backup-${tag}.json`;

    setDriveBackupDialogOpen(false);
    setDriveLoading(true);
    setDriveError(null);
    setDriveStatus(null);
    try {
      const payload = buildFilteredBackupJson(driveBackupSections);
      const byteSize = new Blob([payload]).size;
      setDriveUploadProgress({ loaded: 0, total: byteSize });
      await saveBackupToDrive(token, name, payload, undefined, (loaded, total) => {
        setDriveUploadProgress({ loaded, total });
      });
      setDriveUploadProgress({ loaded: byteSize, total: byteSize });
      saveProfile({ ...profile, lastDriveSyncAt: Date.now(), driveEnabled: true });
      await refreshDriveFiles(token);
      await new Promise((r) => window.setTimeout(r, 350));
    } catch (err) {
      setDriveError(err instanceof Error ? err.message : 'Sao lưu Google Drive thất bại.');
    } finally {
      setDriveLoading(false);
      setDriveUploadProgress(null);
    }
  };

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
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleAvatarFileSelected(f);
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
              {/* Card 1: Profile & Google Account */}
              <div className="rounded-[28px] p-3.5 pl-4 space-y-3" style={{ backgroundColor: scheme.surfaceContainerLow }}>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={openProfileSheet}
                    className="flex-1 min-w-0 flex items-center gap-3 text-left cursor-pointer active:opacity-85 transition"
                  >
                    <GoogleAvatar
                      photoURL={profile.customAvatarDataUrl || googleAuth.photoURL}
                      name={googleAuth.user?.displayName || profile.name}
                      size={50}
                      bgColor={scheme.primary}
                      fgColor={scheme.onPrimary}
                      showGoogleBadge={Boolean(googleAuth.user)}
                      badgeBorderColor={scheme.surfaceContainerLow}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-[15.5px] font-semibold truncate">
                        {profile.name || googleAuth.user?.displayName || 'Độc giả NovelBook'}
                      </div>
                      <div className="text-[12.5px] truncate mt-0.5" style={{ color: scheme.onSurfaceVariant }}>
                        {googleAuth.user?.email || (googleAuth.user ? '' : 'Chạm để sửa hồ sơ hoặc đăng nhập')}
                      </div>
                    </div>
                  </button>

                  {googleAuth.user ? (
                    <div
                      className="rounded-full p-1 flex items-center gap-1 shrink-0"
                      style={{ backgroundColor: scheme.surfaceContainerHigh }}
                    >
                      <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        disabled={googleLoading}
                        className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer active:scale-90 transition disabled:opacity-50"
                        style={{ backgroundColor: scheme.surfaceContainerLowest, color: scheme.onSurface }}
                        title="Làm mới phiên Google"
                        aria-label="Làm mới phiên Google"
                      >
                        <RefreshCw className={`w-4 h-4 ${googleLoading ? 'animate-spin' : ''}`} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmSignOutGoogle((v) => !v)}
                        className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer active:scale-90 transition"
                        style={{ backgroundColor: scheme.errorContainer, color: scheme.error }}
                        title="Đăng xuất Google"
                        aria-label="Đăng xuất Google"
                      >
                        <LogOut className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={googleLoading}
                      className="h-10 px-3.5 rounded-full border inline-flex items-center gap-2 text-xs font-medium shrink-0 cursor-pointer active:scale-95 transition disabled:opacity-50"
                      style={{
                        backgroundColor: scheme.surfaceContainerLowest,
                        color: scheme.onSurface,
                        borderColor: scheme.outlineVariant,
                      }}
                    >
                      <GoogleGLogo className="w-4 h-4 shrink-0" />
                      <span>{googleLoading ? 'Đang nối…' : 'Đăng nhập'}</span>
                    </button>
                  )}
                </div>

                {confirmSignOutGoogle && googleAuth.user && (
                  <div
                    className="rounded-2xl p-3 space-y-2"
                    style={{ backgroundColor: scheme.errorContainer, color: scheme.onErrorContainer }}
                  >
                    <div className="text-xs font-medium">
                      Đăng xuất khỏi tài khoản Google {googleAuth.user.email}?
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setConfirmSignOutGoogle(false)}
                        className="px-3.5 h-8 rounded-full text-xs font-medium cursor-pointer"
                        style={{ backgroundColor: scheme.surface, color: scheme.onSurface }}
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        onClick={handleGoogleSignOut}
                        className="px-3.5 h-8 rounded-full text-xs font-medium cursor-pointer"
                        style={{ backgroundColor: scheme.error, color: scheme.onError }}
                      >
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                )}

                {googleError && (
                  <p className="text-xs" style={{ color: scheme.error }}>
                    {googleError}
                  </p>
                )}

                {profileSavedMsg && (
                  <p className="text-xs font-medium" style={{ color: scheme.primary }}>
                    {profileSavedMsg}
                  </p>
                )}
              </div>

              {/* Card 2: Trình duyệt app (Collapsible Accordion) */}
              <div className="rounded-[28px] p-4" style={{ backgroundColor: scheme.surfaceContainerLow }}>
                <button
                  type="button"
                  onClick={() => setBrowserCardExpanded((v) => !v)}
                  className="w-full flex items-center gap-3 text-left cursor-pointer"
                >
                  <div
                    className="w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0"
                    style={{ backgroundColor: scheme.surfaceContainerLowest, color: scheme.primary }}
                  >
                    <Globe className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[15.5px] font-semibold">Trình duyệt app</div>
                    <div className="text-xs truncate mt-0.5" style={{ color: scheme.onSurfaceVariant }}>
                      {browserAccounts.sessions.length} web đã đăng nhập ·{' '}
                      {browserAccounts.autoUseGoogleInBrowser ? 'Tự động Google' : 'Thủ công'}
                    </div>
                  </div>
                  <span
                    className="px-2.5 py-1 rounded-full text-xs font-medium shrink-0 tabular-nums"
                    style={{ backgroundColor: scheme.surfaceContainerHigh, color: scheme.onSurfaceVariant }}
                  >
                    {browserAccounts.sessions.length} web
                  </span>
                  {browserCardExpanded ? (
                    <ChevronUp className="w-4 h-4 shrink-0" style={{ color: scheme.onSurfaceVariant }} />
                  ) : (
                    <ChevronDown className="w-4 h-4 shrink-0" style={{ color: scheme.onSurfaceVariant }} />
                  )}
                </button>

                {browserCardExpanded && (
                  <div className="mt-3.5 space-y-3">
                    <Divider color={scheme.outlineVariant} />

                    <SettingsSwitchRow
                      title="Tự động đăng nhập bằng Google"
                      subtitle={`Gợi ý ${googleAuth.user?.email || 'tài khoản Google'} khi mở web`}
                      checked={browserAccounts.autoUseGoogleInBrowser}
                      onChange={() => setAutoUseGoogleInBrowser(!browserAccounts.autoUseGoogleInBrowser)}
                    />

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <span
                        className="text-[11px] font-semibold tracking-wider"
                        style={{ color: scheme.onSurfaceVariant }}
                      >
                        ĐÃ ĐĂNG NHẬP
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setAddWebError(null);
                            setAddWebSheetOpen(true);
                          }}
                          className="h-8 px-3 rounded-full text-xs font-medium inline-flex items-center gap-1 cursor-pointer active:scale-95 transition"
                          style={{ backgroundColor: scheme.primaryContainer, color: scheme.onPrimaryContainer }}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Thêm web</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openSourceBrowser()}
                          className="h-8 px-3 rounded-full text-xs font-medium inline-flex items-center gap-1 cursor-pointer active:scale-95 transition"
                          style={{ backgroundColor: scheme.surfaceContainerHigh, color: scheme.onSurface }}
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          <span>Trình duyệt</span>
                        </button>
                      </div>
                    </div>

                    {browserAccounts.sessions.length === 0 ? (
                      <div
                        className="rounded-[20px] p-3.5 text-xs text-center leading-relaxed"
                        style={{ backgroundColor: scheme.surfaceContainerLowest, color: scheme.onSurfaceVariant }}
                      >
                        Chưa có web nào được đăng nhập. Chạm “+ Thêm web” hoặc mở trình duyệt để kết nối bằng Google.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {browserAccounts.sessions.map((s) => {
                          const badgeColors = getDomainLetterColors(s.domain, scheme.isDark);
                          return (
                            <div
                              key={s.domain}
                              className="rounded-[20px] px-3 py-2.5 flex items-center gap-3"
                              style={{ backgroundColor: scheme.surfaceContainerLowest }}
                            >
                              <div
                                className="w-10 h-10 rounded-[13px] flex items-center justify-center font-bold text-sm shrink-0"
                                style={{ backgroundColor: badgeColors.bg, color: badgeColors.fg }}
                              >
                                {s.domain[0]?.toUpperCase() || 'W'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span translate="no" className="notranslate text-sm font-semibold truncate">
                                    {s.domain}
                                  </span>
                                  <span
                                    className="px-2 py-0.5 rounded-[7px] text-[11px] font-medium shrink-0"
                                    style={{ backgroundColor: scheme.surfaceContainerHigh, color: scheme.onSurfaceVariant }}
                                  >
                                    {s.authMethod === 'google'
                                      ? 'Google'
                                      : s.authMethod === 'cookie'
                                        ? 'Cookie'
                                        : 'Web'}
                                  </span>
                                </div>
                                <div className="text-xs truncate mt-0.5" style={{ color: scheme.onSurfaceVariant }}>
                                  {s.email || s.accountName} · {formatSessionAge(s.loggedInAt)}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  logoutBrowserSite(s.domain);
                                  if (s.domain === 'wikicv.org') setWikiCvLoggedIn(false);
                                }}
                                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 cursor-pointer active:scale-90 transition"
                                style={{ color: scheme.onSurfaceVariant }}
                                title={`Đăng xuất khỏi ${s.domain}`}
                                aria-label={`Đăng xuất khỏi ${s.domain}`}
                              >
                                <LogOut className="w-[18px] h-[18px]" />
                              </button>
                            </div>
                          );
                        })}

                        {confirmClearBrowser ? (
                          <div
                            className="rounded-2xl p-3 space-y-2"
                            style={{ backgroundColor: scheme.errorContainer, color: scheme.onErrorContainer }}
                          >
                            <div className="text-xs font-medium">
                              Đăng xuất khỏi toàn bộ {browserAccounts.sessions.length} phiên trình duyệt?
                            </div>
                            <div className="flex gap-2 justify-end">
                              <button
                                type="button"
                                onClick={() => setConfirmClearBrowser(false)}
                                className="px-3.5 h-8 rounded-full text-xs font-medium cursor-pointer"
                                style={{ backgroundColor: scheme.surface, color: scheme.onSurface }}
                              >
                                Hủy
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  clearAllBrowserSessions();
                                  setWikiCvLoggedIn(false);
                                  setConfirmClearBrowser(false);
                                }}
                                className="px-3.5 h-8 rounded-full text-xs font-medium cursor-pointer"
                                style={{ backgroundColor: scheme.error, color: scheme.onError }}
                              >
                                Xác nhận
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmClearBrowser(true)}
                            className="w-full h-11 rounded-full text-[13.5px] font-medium cursor-pointer active:scale-[0.99] transition"
                            style={{ backgroundColor: scheme.errorContainer, color: scheme.onErrorContainer }}
                          >
                            Đăng xuất tất cả phiên trình duyệt
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Card 3: Google Drive */}
              {(() => {
                const epubCount = realStories.filter((s) => s.localBookId).length;
                const epubBytes = realStories.reduce((sum, s) => sum + (s.fileSizeBytes || 0), 0);
                const driveBackupBytes = driveFiles.reduce((sum, f) => sum + Number(f.size || 0), 0);
                const totalBytes = epubBytes + driveBackupBytes;
                const totalMb = totalBytes / (1024 * 1024);
                const usedLabel =
                  totalBytes === 0
                    ? '0 MB'
                    : totalMb < 0.1
                      ? `${Math.max(1, Math.round(totalBytes / 1024))} KB`
                      : `${totalMb.toFixed(1)} MB`;
                const backupPct = totalBytes > 0 ? Math.max(3, Math.min(28, (driveBackupBytes / (15 * 1024 * 1024 * 1024)) * 10000)) : 2.5;
                const epubPct = totalBytes > 0 ? Math.max(4, Math.min(36, (epubBytes / (15 * 1024 * 1024 * 1024)) * 10000)) : 3.5;

                return (
                  <div className="rounded-[28px] p-4 space-y-3" style={{ backgroundColor: scheme.surfaceContainerLow }}>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0"
                        style={{ backgroundColor: scheme.surfaceContainerLowest }}
                      >
                        <GoogleDriveLogo className="w-[22px] h-[22px]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[15.5px] font-semibold">Google Drive</div>
                        <div className="text-xs truncate mt-0.5" style={{ color: scheme.onSurfaceVariant }}>
                          {googleAuth.hasDriveToken
                            ? `My Drive / NovelBook · ${profile.lastDriveSyncAt ? formatSessionAge(profile.lastDriveSyncAt) : 'Đã kết nối'}`
                            : profile.driveEnabled
                              ? 'My Drive / NovelBook · Chạm bật để kết nối'
                              : 'Đã tắt đồng bộ Drive'}
                        </div>
                      </div>
                      <Switch
                        checked={profile.driveEnabled && googleAuth.hasDriveToken}
                        onChange={() => {
                          if (!googleAuth.hasDriveToken) {
                            handleGoogleSignIn();
                          } else {
                            saveProfile({ ...profile, driveEnabled: !profile.driveEnabled });
                          }
                        }}
                      />
                    </div>

                    {/* Storage Summary Box */}
                    <div
                      className="rounded-[22px] p-3.5 space-y-3"
                      style={{ backgroundColor: scheme.surfaceContainerLowest }}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span style={{ color: scheme.onSurfaceVariant }}>Dung lượng đã dùng</span>
                        <span className="tabular-nums">
                          <strong style={{ color: scheme.onSurface }}>{usedLabel}</strong>{' '}
                          <span style={{ color: scheme.onSurfaceVariant }}>/ 15 GB</span>
                        </span>
                      </div>

                      <div
                        className="h-2 rounded-full overflow-hidden flex gap-1 p-0.5"
                        style={{ backgroundColor: scheme.surfaceContainerHigh }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${backupPct}%`, backgroundColor: scheme.primary }}
                        />
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${epubPct}%`, backgroundColor: '#10b981' }}
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setDriveFilesExpanded((v) => !v)}
                          className="rounded-[16px] py-2.5 px-2 text-center cursor-pointer active:scale-95 transition"
                          style={{ backgroundColor: scheme.surfaceContainerLow }}
                        >
                          <div className="text-sm font-bold tabular-nums">{driveFiles.length}</div>
                          <div className="text-[11px] mt-0.5" style={{ color: scheme.onSurfaceVariant }}>
                            Bản sao lưu
                          </div>
                        </button>
                        <div
                          className="rounded-[16px] py-2.5 px-2 text-center"
                          style={{ backgroundColor: scheme.surfaceContainerLow }}
                        >
                          <div className="text-sm font-bold tabular-nums">{epubCount}</div>
                          <div className="text-[11px] mt-0.5" style={{ color: scheme.onSurfaceVariant }}>
                            Tệp EPUB
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => saveProfile({ ...profile, autoDriveSync: !profile.autoDriveSync })}
                          className="rounded-[16px] py-2.5 px-2 text-center cursor-pointer active:scale-95 transition"
                          style={{ backgroundColor: scheme.surfaceContainerLow }}
                        >
                          <div className="text-sm font-bold truncate">
                            {profile.autoDriveSync ? 'Tự động' : 'Thủ công'}
                          </div>
                          <div className="text-[11px] mt-0.5" style={{ color: scheme.onSurfaceVariant }}>
                            Chế độ lưu
                          </div>
                        </button>
                      </div>

                      {driveFilesExpanded && (
                        <div className="pt-1 space-y-2.5">
                          <Divider color={scheme.outlineVariant} />
                          {!googleAuth.hasDriveToken ? (
                            <GoogleSignInButton
                              onClick={handleGoogleSignIn}
                              loading={googleLoading}
                              isDark={scheme.isDark}
                              label={googleAuth.user ? 'Kết nối lại Google Drive' : 'Đăng nhập Google để quản lý Drive'}
                            />
                          ) : (
                            <>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={driveFileName}
                                  onChange={(e) => setDriveFileName(e.target.value)}
                                  placeholder="NovelBook-storage.json"
                                  className="flex-1 min-w-0 h-10 px-3 rounded-xl border bg-transparent text-xs outline-none"
                                  style={{ borderColor: scheme.outlineVariant }}
                                />
                                <button
                                  type="button"
                                  disabled={driveLoading}
                                  onClick={handleSaveToDriveClick}
                                  className="px-3.5 h-10 rounded-full text-xs font-medium shrink-0 inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                  style={{ backgroundColor: scheme.primary, color: scheme.onPrimary }}
                                >
                                  <Upload className="w-3.5 h-3.5" />
                                  <span>Lưu Drive</span>
                                </button>
                              </div>

                              {pendingDriveAction && (
                                <div
                                  className="rounded-2xl p-3 space-y-2 border"
                                  style={{
                                    backgroundColor:
                                      pendingDriveAction.type === 'delete'
                                        ? scheme.errorContainer
                                        : scheme.secondaryContainer,
                                    color:
                                      pendingDriveAction.type === 'delete'
                                        ? scheme.onErrorContainer
                                        : scheme.onSecondaryContainer,
                                    borderColor:
                                      pendingDriveAction.type === 'delete' ? scheme.error : scheme.primary,
                                  }}
                                >
                                  <div className="text-xs font-medium leading-relaxed">
                                    {pendingDriveAction.type === 'overwrite'
                                      ? `Ghi đè tệp “${pendingDriveAction.targetName}” đã tồn tại trên Google Drive?`
                                      : pendingDriveAction.type === 'restore'
                                        ? `Khôi phục dữ liệu từ tệp “${pendingDriveAction.file.name}”?`
                                        : `Xoá vĩnh viễn tệp “${pendingDriveAction.file.name}” khỏi Google Drive?`}
                                  </div>
                                  <div className="flex gap-2 justify-end">
                                    <button
                                      type="button"
                                      onClick={() => setPendingDriveAction(null)}
                                      className="px-3 h-7 rounded-full text-xs font-medium cursor-pointer"
                                      style={{ backgroundColor: scheme.surface, color: scheme.onSurface }}
                                    >
                                      Hủy
                                    </button>
                                    <button
                                      type="button"
                                      onClick={executeConfirmedDriveAction}
                                      className="px-3 h-7 rounded-full text-xs font-medium cursor-pointer"
                                      style={{
                                        backgroundColor:
                                          pendingDriveAction.type === 'delete' ? scheme.error : scheme.primary,
                                        color:
                                          pendingDriveAction.type === 'delete' ? scheme.onError : scheme.onPrimary,
                                      }}
                                    >
                                      Xác nhận
                                    </button>
                                  </div>
                                </div>
                              )}

                              {driveFiles.length === 0 ? (
                                <p className="text-xs py-1" style={{ color: scheme.onSurfaceVariant }}>
                                  {driveLoading
                                    ? 'Đang tải danh sách từ Google Drive…'
                                    : 'Chưa có tệp sao lưu nào trên Google Drive.'}
                                </p>
                              ) : (
                                <div className="space-y-1.5">
                                  {driveFiles.map((file) => (
                                    <div
                                      key={file.id}
                                      className="rounded-xl p-2 flex items-center gap-2"
                                      style={{ backgroundColor: scheme.surfaceContainerLow }}
                                    >
                                      <FileJson className="w-4 h-4 shrink-0" style={{ color: scheme.primary }} />
                                      <div className="flex-1 min-w-0">
                                        <div translate="no" className="notranslate text-xs font-medium truncate">
                                          {file.name}
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => setPendingDriveAction({ type: 'restore', file })}
                                        className="px-2.5 h-7 rounded-full text-[11px] font-medium cursor-pointer"
                                        style={{
                                          backgroundColor: scheme.secondaryContainer,
                                          color: scheme.onSecondaryContainer,
                                        }}
                                      >
                                        Tải về
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setPendingDriveAction({ type: 'delete', file })}
                                        className="p-1.5 rounded-full cursor-pointer"
                                        aria-label={`Xoá ${file.name}`}
                                      >
                                        <Trash2 className="w-3.5 h-3.5" style={{ color: scheme.error }} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </>
                          )}
                          {driveStatus && (
                            <p className="text-xs font-medium" style={{ color: scheme.primary }}>
                              {driveStatus}
                            </p>
                          )}
                          {driveError && (
                            <p className="text-xs" style={{ color: scheme.error }}>
                              {driveError}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <SettingsSwitchRow
                      title="Tự động đồng bộ EPUB & tiến độ"
                      subtitle="Tự tải lên Drive khi nhập sách mới hoặc đổi chương"
                      checked={profile.autoDriveSync}
                      onChange={() => saveProfile({ ...profile, autoDriveSync: !profile.autoDriveSync })}
                    />
                  </div>
                );
              })()}
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

              <GoogleDriveStorageCard
                scheme={scheme}
                googleAuth={googleAuth}
                googleLoading={googleLoading}
                onConnectGoogle={handleGoogleSignIn}
                driveFiles={driveFiles}
                driveLoading={driveLoading}
                driveFileName={driveFileName}
                onChangeFileName={setDriveFileName}
                driveStatus={driveStatus}
                driveError={driveError}
                onRefresh={() => refreshDriveFiles()}
                onSave={handleSaveToDriveClick}
                onAskRestore={(file) => setPendingDriveAction({ type: 'restore', file })}
                onAskDelete={(file) => setPendingDriveAction({ type: 'delete', file })}
                pendingAction={pendingDriveAction}
                onConfirmAction={executeConfirmedDriveAction}
                onCancelAction={() => setPendingDriveAction(null)}
              />
            </div>
          ) : selectedId === 'backup' ? (
            <div className="space-y-4">
              {/* Section 1: Tài khoản đồng bộ */}
              <div className="space-y-2">
                <div className="text-[15px] font-semibold px-1" style={{ color: scheme.primary }}>
                  Tài khoản đồng bộ
                </div>
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setSyncMethodSheetOpen(true)}
                    className="w-full p-4 rounded-t-[24px] rounded-b-[8px] flex items-center justify-between text-left cursor-pointer active:opacity-90 transition"
                    style={{ backgroundColor: scheme.surfaceContainerLow }}
                  >
                    <div>
                      <div className="text-[15px] font-medium">Phương thức đồng bộ</div>
                      <div className="text-[13px] mt-0.5" style={{ color: scheme.onSurfaceVariant }}>
                        {profile.syncMethod === 'google_drive' ? 'Google Drive' : 'Tệp sao lưu nội bộ'}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 shrink-0" style={{ color: scheme.onSurfaceVariant }} />
                  </button>

                  <div
                    className="p-4 rounded-t-[8px] rounded-b-[24px] space-y-3"
                    style={{ backgroundColor: scheme.surfaceContainerLow }}
                  >
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span>Trạng thái</span>
                      <span
                        className="font-medium truncate max-w-[65%]"
                        style={{
                          color: googleAuth.hasDriveToken
                            ? scheme.primary
                            : googleAuth.user
                              ? scheme.tertiary
                              : scheme.error,
                        }}
                      >
                        {googleAuth.hasDriveToken
                          ? `Đã xác thực · ${googleAuth.user?.email || 'Google'}`
                          : googleAuth.user
                            ? 'Cần làm mới xác thực'
                            : 'Chưa xác thực'}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        disabled={googleLoading}
                        className="flex-1 h-11 rounded-full flex items-center justify-center gap-2 text-sm font-medium cursor-pointer active:scale-[0.98] transition disabled:opacity-50"
                        style={{ backgroundColor: scheme.primary, color: scheme.onPrimary }}
                      >
                        <RefreshCw className={`w-4 h-4 ${googleLoading ? 'animate-spin' : ''}`} />
                        <span>
                          {googleLoading
                            ? 'Đang kết nối…'
                            : googleAuth.hasDriveToken
                              ? 'Làm mới xác thực'
                              : 'Đăng nhập'}
                        </span>
                      </button>
                      {googleAuth.user && (
                        <button
                          type="button"
                          onClick={handleGoogleSignOut}
                          className="px-4 h-11 rounded-full text-sm font-medium cursor-pointer"
                          style={{ backgroundColor: scheme.errorContainer, color: scheme.onErrorContainer }}
                        >
                          Đăng xuất
                        </button>
                      )}
                    </div>
                    {googleError && (
                      <p className="text-xs" style={{ color: scheme.error }}>
                        {googleError}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 2: Đồng bộ thủ công */}
              <div className="space-y-2">
                <div className="text-[15px] font-semibold px-1" style={{ color: scheme.primary }}>
                  Đồng bộ thủ công
                </div>
                <div className="space-y-1">
                  <div
                    className="p-4 rounded-t-[24px] rounded-b-[8px] space-y-3"
                    style={{ backgroundColor: scheme.surfaceContainerLow }}
                  >
                    <p className="text-[13px] leading-relaxed" style={{ color: scheme.onSurfaceVariant }}>
                      Sao lưu tủ sách, tiện ích, cài đặt và dữ liệu ứng dụng của bạn vào tài khoản trên (các chương đã tải xuống không được bao gồm); khôi phục chúng trên bất kỳ thiết bị nào
                    </p>

                    <div className="flex items-center justify-between text-sm py-0.5">
                      <span style={{ color: scheme.onSurfaceVariant }}>Sao lưu gần nhất</span>
                      <span className="font-medium">
                        {profile.lastDriveSyncAt ? formatSessionAge(profile.lastDriveSyncAt) : 'Chưa đồng bộ'}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <button
                        type="button"
                        disabled={driveLoading || !googleAuth.hasDriveToken}
                        onClick={() => setDriveBackupDialogOpen(true)}
                        className={`w-full h-11 px-4 rounded-full flex items-center justify-center gap-2 text-sm font-medium cursor-pointer transition ${
                          driveLoading ? 'opacity-100' : 'disabled:opacity-45'
                        }`}
                        style={{
                          backgroundColor: googleAuth.hasDriveToken ? scheme.primary : scheme.surfaceContainerHigh,
                          color: googleAuth.hasDriveToken ? scheme.onPrimary : scheme.onSurface,
                        }}
                      >
                        {driveLoading && driveUploadProgress ? (
                          <span className="truncate tabular-nums">
                            Đang tải lên ·{' '}
                            {driveUploadProgress.total > 0
                              ? Math.min(100, Math.round((driveUploadProgress.loaded / driveUploadProgress.total) * 100))
                              : 0}
                            % · {formatByteSize(driveUploadProgress.loaded)} / {formatByteSize(driveUploadProgress.total)}
                          </span>
                        ) : (
                          <>
                            <CloudUpload className="w-4 h-4 shrink-0" />
                            <span>{driveLoading ? 'Đang sao lưu…' : 'Sao lưu lên Google Drive'}</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        disabled={driveLoading || !googleAuth.hasDriveToken || driveFiles.length === 0}
                        onClick={() => {
                          setPendingDriveAction(null);
                          setDriveRestoreSheetOpen(true);
                        }}
                        className="w-full h-11 px-4 rounded-full flex items-center justify-center gap-2 text-sm font-medium cursor-pointer disabled:opacity-45 transition"
                        style={{
                          backgroundColor: scheme.surfaceContainerHigh,
                          color: scheme.onSurface,
                        }}
                      >
                        <CloudDownload className="w-4 h-4 shrink-0" />
                        <span>
                          Khôi phục từ Google Drive{driveFiles.length > 0 ? ` (${driveFiles.length})` : ''}
                        </span>
                      </button>
                    </div>

                    {driveError && (
                      <p className="text-xs" style={{ color: scheme.error }}>
                        {driveError}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setRetentionSheetOpen(true)}
                    className="w-full p-4 rounded-t-[8px] rounded-b-[24px] flex items-center justify-between text-left cursor-pointer active:opacity-90 transition"
                    style={{ backgroundColor: scheme.surfaceContainerLow }}
                  >
                    <div>
                      <div className="text-[15px] font-medium">Số bản sao lưu cần giữ</div>
                      <div className="text-[13px] mt-0.5 tabular-nums" style={{ color: scheme.onSurfaceVariant }}>
                        {profile.backupRetention}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 shrink-0" style={{ color: scheme.onSurfaceVariant }} />
                  </button>
                </div>
              </div>

              {/* Section 3: Đồng bộ tự động */}
              <div className="space-y-2">
                <div className="text-[15px] font-semibold px-1" style={{ color: scheme.primary }}>
                  Đồng bộ tự động
                </div>
                <div
                  className="p-4 rounded-[24px] flex items-center justify-between gap-3"
                  style={{ backgroundColor: scheme.surfaceContainerLow }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-medium">Đồng bộ giữa các thiết bị</div>
                    <div className="text-xs leading-relaxed mt-0.5" style={{ color: scheme.onSurfaceVariant }}>
                      Tiến độ đọc, kệ, dấu trang và từ điển giống nhau trên mọi máy dùng tài khoản
                    </div>
                  </div>
                  <Switch checked={autoSyncEnabled} onChange={() => setAutoSyncEnabled((v) => !v)} />
                </div>
              </div>

              {/* Section 4: Đồng bộ bằng file */}
              <div className="space-y-2">
                <div className="text-[15px] font-semibold px-1" style={{ color: scheme.primary }}>
                  Đồng bộ bằng file
                </div>
                <div
                  className="p-4 rounded-[24px] space-y-3.5"
                  style={{ backgroundColor: scheme.surfaceContainerLow }}
                >
                  <p className="text-[13px] leading-relaxed" style={{ color: scheme.onSurfaceVariant }}>
                    Sao lưu toàn bộ dữ liệu của bạn, bao gồm các chương đã tải nếu bạn chọn, trong tệp sao lưu; khôi phục trên thiết bị bất kỳ
                  </p>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setExportDialogOpen(true)}
                      className="h-11 rounded-full flex items-center justify-center gap-2 text-sm font-medium cursor-pointer active:scale-[0.98] transition"
                      style={{ backgroundColor: scheme.primary, color: scheme.onPrimary }}
                    >
                      <Upload className="w-4 h-4" />
                      <span>Xuất dữ liệu</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => restoreInputRef.current?.click()}
                      className="h-11 rounded-full flex items-center justify-center gap-2 text-sm font-medium cursor-pointer active:scale-[0.98] transition"
                      style={{ backgroundColor: scheme.secondaryContainer, color: scheme.onSecondaryContainer }}
                    >
                      <Download className="w-4 h-4" />
                      <span>Nhập dữ liệu</span>
                    </button>
                  </div>
                </div>
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

      {/* Profile Edit Bottom Sheet */}
      {profileSheetOpen && (
        <SwipeableBottomSheet
          onClose={() => setProfileSheetOpen(false)}
          backgroundColor={scheme.surface}
          textColor={scheme.onSurface}
          handleColor={scheme.outlineVariant}
          className="rounded-t-[28px]"
        >
          <div className="px-5 pb-7 pt-2 space-y-5">
            <h3 className="text-[20px] font-bold">Hồ sơ</h3>

            <div className="flex flex-col items-center gap-3.5">
              <GoogleAvatar
                photoURL={draftAvatar}
                name={draftName || profile.name}
                size={96}
                bgColor={scheme.primary}
                fgColor={scheme.onPrimary}
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="h-9 px-4 rounded-full border inline-flex items-center gap-2 text-sm font-medium cursor-pointer active:scale-95 transition"
                  style={{ borderColor: scheme.outlineVariant, color: scheme.onSurface }}
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>Chọn ảnh</span>
                </button>
                {draftAvatar && googleAuth.photoURL && draftAvatar !== googleAuth.photoURL && (
                  <button
                    type="button"
                    onClick={() => setDraftAvatar(googleAuth.photoURL)}
                    className="h-9 px-3.5 rounded-full text-xs font-medium cursor-pointer"
                    style={{ backgroundColor: scheme.secondaryContainer, color: scheme.onSecondaryContainer }}
                  >
                    Ảnh Google
                  </button>
                )}
              </div>
            </div>

            <input
              type="text"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder="Tên hiển thị"
              className="w-full h-13 px-4 rounded-[18px] text-[15px] outline-none"
              style={{
                backgroundColor: scheme.surfaceContainerHigh,
                color: scheme.onSurface,
              }}
            />

            <button
              type="button"
              onClick={() => {
                const trimmed = draftName.trim() || profile.name;
                saveProfile(
                  {
                    ...profile,
                    name: trimmed,
                    customAvatarDataUrl: draftAvatar === googleAuth.photoURL ? null : draftAvatar,
                  },
                  'Đã cập nhật hồ sơ'
                );
                setProfileSheetOpen(false);
              }}
              className="w-full h-12 rounded-full flex items-center justify-center gap-2 text-sm font-semibold cursor-pointer active:scale-[0.98] transition"
              style={{ backgroundColor: scheme.primary, color: scheme.onPrimary }}
            >
              <Check className="w-4 h-4" />
              <span>Lưu</span>
            </button>
          </div>
        </SwipeableBottomSheet>
      )}

      {/* Add Web Account Bottom Sheet */}
      {addWebSheetOpen && (
        <SwipeableBottomSheet
          onClose={() => setAddWebSheetOpen(false)}
          backgroundColor={scheme.surface}
          textColor={scheme.onSurface}
          handleColor={scheme.outlineVariant}
          className="rounded-t-[28px]"
        >
          <div className="px-5 pb-7 pt-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Thêm phiên đăng nhập web</h3>
              <button type="button" onClick={() => setAddWebSheetOpen(false)} className="p-1.5 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {RAW_SOURCES.slice(0, 5).map((src) => {
                const clean = src.replace(/^www\./, '');
                const active = addWebDomain.toLowerCase() === clean.toLowerCase();
                return (
                  <button
                    key={clean}
                    type="button"
                    onClick={() => setAddWebDomain(clean)}
                    translate="no"
                    className="notranslate px-2.5 py-1 rounded-full text-xs font-medium border cursor-pointer"
                    style={{
                      backgroundColor: active ? scheme.secondaryContainer : 'transparent',
                      color: active ? scheme.onSecondaryContainer : scheme.onSurfaceVariant,
                      borderColor: active ? 'transparent' : scheme.outlineVariant,
                    }}
                  >
                    {clean}
                  </button>
                );
              })}
            </div>

            <input
              type="text"
              value={addWebDomain}
              onChange={(e) => setAddWebDomain(e.target.value)}
              placeholder="Tên miền (vd: metruyensangtac.com)"
              className="w-full h-12 px-4 rounded-[16px] text-sm outline-none"
              style={{ backgroundColor: scheme.surfaceContainerHigh, color: scheme.onSurface }}
            />

            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'google' as const, label: 'Bằng Google' },
                { id: 'cookie' as const, label: 'Cookie / Tài khoản' },
              ].map((m) => {
                const active = addWebMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setAddWebMethod(m.id)}
                    className="h-10 rounded-full text-xs font-medium border cursor-pointer"
                    style={{
                      backgroundColor: active ? scheme.primaryContainer : 'transparent',
                      color: active ? scheme.onPrimaryContainer : scheme.onSurfaceVariant,
                      borderColor: active ? 'transparent' : scheme.outlineVariant,
                    }}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>

            {addWebMethod === 'cookie' && (
              <input
                type="text"
                value={addWebAccount}
                onChange={(e) => setAddWebAccount(e.target.value)}
                placeholder="Tên tài khoản hoặc tên phiên cookie"
                className="w-full h-12 px-4 rounded-[16px] text-sm outline-none"
                style={{ backgroundColor: scheme.surfaceContainerHigh, color: scheme.onSurface }}
              />
            )}

            {addWebError && (
              <p className="text-xs" style={{ color: scheme.error }}>
                {addWebError}
              </p>
            )}

            <button
              type="button"
              disabled={googleLoading}
              onClick={handleAddWebSubmit}
              className="w-full h-12 rounded-full flex items-center justify-center gap-2 text-sm font-semibold cursor-pointer disabled:opacity-50"
              style={{ backgroundColor: scheme.primary, color: scheme.onPrimary }}
            >
              {addWebMethod === 'google' && <GoogleGLogo className="w-4 h-4" />}
              <span>
                {addWebMethod === 'google'
                  ? googleAuth.user
                    ? `Đăng nhập bằng ${googleAuth.user.email}`
                    : 'Đăng nhập bằng Google'
                  : 'Lưu phiên web'}
              </span>
            </button>
          </div>
        </SwipeableBottomSheet>
      )}

      {/* Sync Method Selector Sheet */}
      {syncMethodSheetOpen && (
        <SwipeableBottomSheet
          onClose={() => setSyncMethodSheetOpen(false)}
          backgroundColor={scheme.surface}
          textColor={scheme.onSurface}
          handleColor={scheme.outlineVariant}
          className="rounded-t-[28px]"
        >
          <div className="px-5 pb-7 pt-2 space-y-3">
            <h3 className="text-lg font-bold">Phương thức đồng bộ</h3>
            {[
              { id: 'google_drive' as const, title: 'Google Drive', desc: 'Đồng bộ sao lưu JSON trực tiếp lên tài khoản Google Drive' },
              { id: 'local_file' as const, title: 'Tệp sao lưu nội bộ', desc: 'Xuất và nhập tệp JSON thủ công qua bộ nhớ thiết bị' },
            ].map((opt) => {
              const selected = profile.syncMethod === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    saveProfile({ ...profile, syncMethod: opt.id });
                    setSyncMethodSheetOpen(false);
                  }}
                  className="w-full p-3.5 rounded-2xl border flex items-center gap-3 text-left cursor-pointer"
                  style={{
                    backgroundColor: selected ? scheme.secondaryContainer : scheme.surfaceContainerLow,
                    borderColor: selected ? scheme.primary : scheme.outlineVariant,
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold">{opt.title}</div>
                    <div className="text-xs mt-0.5" style={{ color: scheme.onSurfaceVariant }}>
                      {opt.desc}
                    </div>
                  </div>
                  {selected && <Check className="w-5 h-5 shrink-0" style={{ color: scheme.primary }} />}
                </button>
              );
            })}
          </div>
        </SwipeableBottomSheet>
      )}

      {/* Backup Retention Selector Sheet */}
      {retentionSheetOpen && (
        <SwipeableBottomSheet
          onClose={() => setRetentionSheetOpen(false)}
          backgroundColor={scheme.surface}
          textColor={scheme.onSurface}
          handleColor={scheme.outlineVariant}
          className="rounded-t-[28px]"
        >
          <div className="px-5 pb-7 pt-2 space-y-3">
            <h3 className="text-lg font-bold">Số bản sao lưu cần giữ</h3>
            <div className="grid grid-cols-4 gap-2">
              {[3, 5, 10, 20].map((count) => {
                const selected = profile.backupRetention === count;
                return (
                  <button
                    key={count}
                    type="button"
                    onClick={() => {
                      saveProfile({ ...profile, backupRetention: count });
                      setRetentionSheetOpen(false);
                    }}
                    className="h-12 rounded-2xl text-sm font-semibold border cursor-pointer tabular-nums"
                    style={{
                      backgroundColor: selected ? scheme.primaryContainer : scheme.surfaceContainerLow,
                      color: selected ? scheme.onPrimaryContainer : scheme.onSurface,
                      borderColor: selected ? scheme.primary : scheme.outlineVariant,
                    }}
                  >
                    {count}
                  </button>
                );
              })}
            </div>
          </div>
        </SwipeableBottomSheet>
      )}

      {/* Restore from Google Drive Sheet */}
      {driveRestoreSheetOpen && (
        <SwipeableBottomSheet
          onClose={() => {
            setPendingDriveAction(null);
            setDriveRestoreSheetOpen(false);
          }}
          backgroundColor={scheme.surface}
          textColor={scheme.onSurface}
          handleColor={scheme.outlineVariant}
          className="max-h-[82dvh] rounded-t-[28px]"
        >
          <div className="px-5 pb-7 pt-2 space-y-3 overflow-y-auto thin-scrollbar">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Bản sao lưu trên Google Drive</h3>
              <button
                type="button"
                onClick={() => refreshDriveFiles()}
                disabled={driveLoading}
                className="p-2 rounded-full cursor-pointer"
                aria-label="Làm mới danh sách"
              >
                <RefreshCw className={`w-4 h-4 ${driveLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {pendingDriveAction && (
              <div
                className="rounded-2xl p-3 space-y-2 border"
                style={{
                  backgroundColor:
                    pendingDriveAction.type === 'delete' ? scheme.errorContainer : scheme.secondaryContainer,
                  color:
                    pendingDriveAction.type === 'delete' ? scheme.onErrorContainer : scheme.onSecondaryContainer,
                  borderColor: pendingDriveAction.type === 'delete' ? scheme.error : scheme.primary,
                }}
              >
                <div className="text-xs font-medium leading-relaxed">
                  {pendingDriveAction.type === 'restore'
                    ? `Khôi phục dữ liệu từ “${pendingDriveAction.file.name}”? Tủ sách và cài đặt hiện tại trên máy sẽ được cập nhật.`
                    : `Xoá vĩnh viễn “${pendingDriveAction.file.name}” khỏi Google Drive?`}
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setPendingDriveAction(null)}
                    className="px-3.5 h-8 rounded-full text-xs font-medium cursor-pointer"
                    style={{ backgroundColor: scheme.surface, color: scheme.onSurface }}
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await executeConfirmedDriveAction();
                      if (pendingDriveAction.type === 'restore') {
                        setDriveRestoreSheetOpen(false);
                      }
                    }}
                    className="px-3.5 h-8 rounded-full text-xs font-medium cursor-pointer"
                    style={{
                      backgroundColor: pendingDriveAction.type === 'delete' ? scheme.error : scheme.primary,
                      color: pendingDriveAction.type === 'delete' ? scheme.onError : scheme.onPrimary,
                    }}
                  >
                    Xác nhận
                  </button>
                </div>
              </div>
            )}

            {driveFiles.length === 0 ? (
              <p className="text-xs py-4 text-center" style={{ color: scheme.onSurfaceVariant }}>
                Chưa có bản sao lưu nào trên Google Drive.
              </p>
            ) : (
              <div className="space-y-2">
                {driveFiles.map((file) => (
                  <div
                    key={file.id}
                    className="rounded-2xl p-3 flex items-center gap-2.5"
                    style={{ backgroundColor: scheme.surfaceContainerLow }}
                  >
                    <FileJson className="w-5 h-5 shrink-0" style={{ color: scheme.primary }} />
                    <div className="flex-1 min-w-0">
                      <div translate="no" className="notranslate text-xs font-semibold truncate">
                        {file.name}
                      </div>
                      <div className="text-[11px] truncate" style={{ color: scheme.onSurfaceVariant }}>
                        {file.modifiedTime ? new Date(file.modifiedTime).toLocaleString('vi-VN') : 'Google Drive'}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={driveLoading}
                      onClick={() => setPendingDriveAction({ type: 'restore', file })}
                      className="px-3 h-8 rounded-full text-xs font-medium cursor-pointer shrink-0"
                      style={{ backgroundColor: scheme.primary, color: scheme.onPrimary }}
                    >
                      Khôi phục
                    </button>
                    <button
                      type="button"
                      disabled={driveLoading}
                      onClick={() => setPendingDriveAction({ type: 'delete', file })}
                      className="p-2 rounded-full cursor-pointer shrink-0"
                      aria-label={`Xoá ${file.name}`}
                    >
                      <Trash2 className="w-4 h-4" style={{ color: scheme.error }} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SwipeableBottomSheet>
      )}

      {/* Export Data Options Dialog */}
      {exportDialogOpen &&
        (() => {
          const items: Array<{
            key: keyof typeof exportSections;
            title: string;
            desc: string;
          }> = [
            { key: 'shelf', title: 'Kệ truyện', desc: 'Kệ truyện, lịch sử và tải xuống' },
            { key: 'extensions', title: 'Tiện ích mở rộng', desc: 'Tiện ích và nguồn truyện' },
            { key: 'downloaded', title: 'Nội dung đã tải', desc: 'Nội dung truyện đã tải' },
            { key: 'settings', title: 'Cài đặt', desc: 'Cài đặt đọc, hiển thị và dịch' },
            { key: 'other', title: 'Dữ liệu khác', desc: 'Lịch sử và dữ liệu khác' },
            {
              key: 'qtDict',
              title: 'Từ điển QT',
              desc: 'Tệp VietPhrase và Names, cùng với các từ điển Hán Việt, đại từ và quy tắc (lớn)',
            },
          ];
          const anySelected = Object.values(exportSections).some(Boolean);
          const dialogNode = (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/50 backdrop-blur-[2px] animate-backdrop-in"
              onClick={() => setExportDialogOpen(false)}
            >
              <div
                className="w-full max-w-[360px] rounded-[28px] p-6 shadow-2xl space-y-5 animate-dialog-in"
                style={{ backgroundColor: scheme.surfaceContainerLow, color: scheme.onSurface }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-[22px] font-medium">Xuất dữ liệu</h3>

                <div className="space-y-3.5">
                  {items.map((item) => {
                    const checked = exportSections[item.key];
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() =>
                          setExportSections((prev) => ({
                            ...prev,
                            [item.key]: !prev[item.key],
                          }))
                        }
                        className="w-full flex items-center justify-between gap-3 text-left cursor-pointer"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-[15px] font-medium">{item.title}</div>
                          <div className="text-xs leading-snug mt-0.5" style={{ color: scheme.onSurfaceVariant }}>
                            {item.desc}
                          </div>
                        </div>
                        <div
                          className="w-5 h-5 rounded-[4px] flex items-center justify-center shrink-0 transition"
                          style={{
                            backgroundColor: checked ? scheme.primary : 'transparent',
                            border: checked ? `2px solid ${scheme.primary}` : `2px solid ${scheme.outline}`,
                            color: scheme.onPrimary,
                          }}
                        >
                          {checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  disabled={!anySelected}
                  onClick={handleExportSelected}
                  className="w-full h-11 rounded-full flex items-center justify-center gap-2 text-sm font-medium cursor-pointer active:scale-[0.98] transition disabled:opacity-45"
                  style={{ backgroundColor: scheme.primary, color: scheme.onPrimary }}
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Sao lưu ngay</span>
                </button>
              </div>
            </div>
          );

          if (typeof document !== 'undefined') {
            const target = document.getElementById('phone-viewport-portal') || document.body;
            return createPortal(dialogNode, target);
          }
          return dialogNode;
        })()}

      {/* Google Drive Backup Options Dialog */}
      {driveBackupDialogOpen &&
        (() => {
          const items: Array<{
            key: keyof typeof driveBackupSections;
            title: string;
            desc: string;
          }> = [
            { key: 'shelf', title: 'Kệ truyện', desc: 'Kệ truyện, lịch sử và tải xuống' },
            { key: 'extensions', title: 'Tiện ích mở rộng', desc: 'Tiện ích và nguồn truyện' },
            { key: 'settings', title: 'Cài đặt', desc: 'Cài đặt đọc, hiển thị và dịch' },
            { key: 'other', title: 'Dữ liệu khác', desc: 'Lịch sử và dữ liệu khác' },
          ];
          const anySelected = Object.values(driveBackupSections).some(Boolean);
          const dialogNode = (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/50 backdrop-blur-[2px] animate-backdrop-in"
              onClick={() => setDriveBackupDialogOpen(false)}
            >
              <div
                className="w-full max-w-[360px] rounded-[28px] p-6 shadow-2xl space-y-5 animate-dialog-in"
                style={{ backgroundColor: scheme.surfaceContainerLow, color: scheme.onSurface }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-[22px] font-medium">Sao lưu lên Google Drive</h3>

                <div className="space-y-3.5">
                  {items.map((item) => {
                    const checked = driveBackupSections[item.key];
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() =>
                          setDriveBackupSections((prev) => ({
                            ...prev,
                            [item.key]: !prev[item.key],
                          }))
                        }
                        className="w-full flex items-center justify-between gap-3 text-left cursor-pointer"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-[15px] font-medium">{item.title}</div>
                          <div className="text-xs leading-snug mt-0.5" style={{ color: scheme.onSurfaceVariant }}>
                            {item.desc}
                          </div>
                        </div>
                        <div
                          className="w-5 h-5 rounded-[4px] flex items-center justify-center shrink-0 transition"
                          style={{
                            backgroundColor: checked ? scheme.primary : 'transparent',
                            border: checked ? `2px solid ${scheme.primary}` : `2px solid ${scheme.outline}`,
                            color: scheme.onPrimary,
                          }}
                        >
                          {checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  disabled={!anySelected || driveLoading}
                  onClick={handleDriveBackupSelected}
                  className="w-full h-11 rounded-full flex items-center justify-center gap-2 text-sm font-medium cursor-pointer active:scale-[0.98] transition disabled:opacity-45"
                  style={{ backgroundColor: scheme.primary, color: scheme.onPrimary }}
                >
                  <RefreshCw className={`w-4 h-4 ${driveLoading ? 'animate-spin' : ''}`} />
                  <span>Sao lưu lên Google Drive</span>
                </button>
              </div>
            </div>
          );

          if (typeof document !== 'undefined') {
            const target = document.getElementById('phone-viewport-portal') || document.body;
            return createPortal(dialogNode, target);
          }
          return dialogNode;
        })()}
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

const GoogleDriveStorageCard: React.FC<{
  scheme: MaterialColorScheme;
  googleAuth: GoogleAuthSnapshot;
  googleLoading: boolean;
  onConnectGoogle: () => void;
  driveFiles: DriveBackupFile[];
  driveLoading: boolean;
  driveFileName: string;
  onChangeFileName: (name: string) => void;
  driveStatus: string | null;
  driveError: string | null;
  onRefresh: () => void;
  onSave: () => void;
  onAskRestore: (file: DriveBackupFile) => void;
  onAskDelete: (file: DriveBackupFile) => void;
  pendingAction:
    | { type: 'overwrite'; file: DriveBackupFile; targetName: string }
    | { type: 'restore'; file: DriveBackupFile }
    | { type: 'delete'; file: DriveBackupFile }
    | null;
  onConfirmAction: () => void;
  onCancelAction: () => void;
}> = ({
  scheme,
  googleAuth,
  googleLoading,
  onConnectGoogle,
  driveFiles,
  driveLoading,
  driveFileName,
  onChangeFileName,
  driveStatus,
  driveError,
  onRefresh,
  onSave,
  onAskRestore,
  onAskDelete,
  pendingAction,
  onConfirmAction,
  onCancelAction,
}) => {
  const formatSize = (bytes?: string) => {
    const n = Number(bytes || 0);
    if (!n) return 'JSON';
    if (n < 1024) return `${n} B`;
    return `${(n / 1024).toFixed(1)} KB`;
  };

  return (
    <div className="rounded-[28px] p-4 space-y-3" style={{ backgroundColor: scheme.surfaceContainerLow }}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0"
            style={{ backgroundColor: scheme.primaryContainer, color: scheme.onPrimaryContainer }}
          >
            <Cloud className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[15px] font-medium truncate">Lưu trữ trên Google Drive</div>
            <div className="text-xs truncate" style={{ color: scheme.onSurfaceVariant }}>
              {googleAuth.hasDriveToken
                ? googleAuth.user?.email || 'Đã kết nối Google Drive'
                : 'Lưu và khôi phục tệp dữ liệu trực tiếp trên Drive'}
            </div>
          </div>
        </div>
        {googleAuth.hasDriveToken && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={driveLoading}
            className="p-2 rounded-full cursor-pointer disabled:opacity-40"
            title="Làm mới danh sách"
            aria-label="Làm mới danh sách Google Drive"
          >
            <RefreshCw className={`w-4 h-4 ${driveLoading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {!googleAuth.hasDriveToken ? (
        <GoogleSignInButton
          onClick={onConnectGoogle}
          loading={googleLoading}
          isDark={scheme.isDark}
          label={googleAuth.user ? 'Kết nối lại Google Drive' : 'Đăng nhập Google để lưu Drive'}
        />
      ) : (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={driveFileName}
              onChange={(e) => onChangeFileName(e.target.value)}
              placeholder="NovelBook-storage.json"
              className="flex-1 min-w-0 h-11 px-3.5 rounded-xl border bg-transparent text-sm outline-none"
              style={{ borderColor: scheme.outlineVariant }}
            />
            <button
              type="button"
              disabled={driveLoading}
              onClick={onSave}
              className="px-4 h-11 rounded-full text-sm font-medium shrink-0 inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              style={{ backgroundColor: scheme.primary, color: scheme.onPrimary }}
            >
              <Upload className="w-4 h-4" />
              <span>Lưu Drive</span>
            </button>
          </div>

          {pendingAction && (
            <div
              className="rounded-2xl p-3 space-y-2.5 border"
              style={{
                backgroundColor: pendingAction.type === 'delete' ? scheme.errorContainer : scheme.secondaryContainer,
                color: pendingAction.type === 'delete' ? scheme.onErrorContainer : scheme.onSecondaryContainer,
                borderColor: pendingAction.type === 'delete' ? scheme.error : scheme.primary,
              }}
            >
              <div className="text-xs font-medium leading-relaxed">
                {pendingAction.type === 'overwrite'
                  ? `Ghi đè tệp “${pendingAction.targetName}” đã tồn tại trên Google Drive?`
                  : pendingAction.type === 'restore'
                    ? `Khôi phục dữ liệu từ tệp “${pendingAction.file.name}”? Tủ sách và cài đặt hiện tại trên máy sẽ được cập nhật.`
                    : `Xoá vĩnh viễn tệp “${pendingAction.file.name}” khỏi Google Drive? Không thể hoàn tác.`}
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={onCancelAction}
                  className="px-3.5 h-8 rounded-full text-xs font-medium cursor-pointer"
                  style={{ backgroundColor: scheme.surface, color: scheme.onSurface }}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={onConfirmAction}
                  className="px-3.5 h-8 rounded-full text-xs font-medium cursor-pointer"
                  style={{
                    backgroundColor: pendingAction.type === 'delete' ? scheme.error : scheme.primary,
                    color: pendingAction.type === 'delete' ? scheme.onError : scheme.onPrimary,
                  }}
                >
                  Xác nhận
                </button>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <div className="text-xs font-medium" style={{ color: scheme.onSurfaceVariant }}>
              Tệp lưu trữ trên Google Drive ({driveFiles.length})
            </div>
            {driveFiles.length === 0 ? (
              <div
                className="rounded-2xl p-3 text-xs"
                style={{ backgroundColor: scheme.surfaceContainerLowest, color: scheme.onSurfaceVariant }}
              >
                {driveLoading ? 'Đang tải danh sách từ Google Drive…' : 'Chưa có tệp sao lưu nào được ứng dụng lưu trên Google Drive.'}
              </div>
            ) : (
              driveFiles.map((file) => (
                <div
                  key={file.id}
                  className="rounded-2xl p-2.5 flex items-center gap-2.5"
                  style={{ backgroundColor: scheme.surfaceContainerLowest }}
                >
                  <FileJson className="w-5 h-5 shrink-0" style={{ color: scheme.primary }} />
                  <div className="flex-1 min-w-0">
                    <div translate="no" className="notranslate text-xs font-semibold truncate">
                      {file.name}
                    </div>
                    <div className="text-[11px] truncate" style={{ color: scheme.onSurfaceVariant }}>
                      {formatSize(file.size)}
                      {file.modifiedTime ? ` · ${new Date(file.modifiedTime).toLocaleDateString('vi-VN')}` : ''}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onAskRestore(file)}
                    disabled={driveLoading}
                    className="px-2.5 h-8 rounded-full text-xs font-medium cursor-pointer shrink-0"
                    style={{ backgroundColor: scheme.secondaryContainer, color: scheme.onSecondaryContainer }}
                  >
                    Tải về
                  </button>
                  <button
                    type="button"
                    onClick={() => onAskDelete(file)}
                    disabled={driveLoading}
                    className="p-1.5 rounded-full cursor-pointer shrink-0"
                    aria-label={`Xoá ${file.name}`}
                  >
                    <Trash2 className="w-4 h-4" style={{ color: scheme.error }} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {driveStatus && (
        <p className="text-xs font-medium" style={{ color: scheme.primary }}>
          {driveStatus}
        </p>
      )}
      {driveError && (
        <p className="text-xs" style={{ color: scheme.error }}>
          {driveError}
        </p>
      )}
    </div>
  );
};

function formatSessionAge(timestamp: number): string {
  const diffMin = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
  if (diffMin < 1) return 'vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  return new Date(timestamp).toLocaleDateString('vi-VN');
}

function getDomainLetterColors(domain: string, isDark: boolean): { bg: string; fg: string } {
  const palette = isDark
    ? [
        { bg: '#1e3a5f', fg: '#93c5fd' },
        { bg: '#14432e', fg: '#86efac' },
        { bg: '#4a3512', fg: '#fcd34d' },
        { bg: '#3b2459', fg: '#d8b4fe' },
      ]
    : [
        { bg: '#dbeafe', fg: '#1d4ed8' },
        { bg: '#d1fae5', fg: '#047857' },
        { bg: '#fef3c7', fg: '#b45309' },
        { bg: '#ede9fe', fg: '#6d28d9' },
      ];
  let sum = 0;
  for (let i = 0; i < domain.length; i++) sum += domain.charCodeAt(i);
  return palette[sum % palette.length];
}

