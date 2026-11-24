import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  buildSampleChapters,
  CATALOG_WEB_HITS,
  chapTitle,
  DEFAULT_ACCENT,
  DEFAULT_SEED,
  DEFAULT_TTS_SOURCES,
  MONET,
  placeholderStory,
  QUICK_SEARCH_SOURCES,
  STARTER_STORIES,
  VOICE_GROUPS,
  VOICE_MODEL_PACKAGES,
} from '../model/mockData';
import { CoverDefaults, StoryIds } from '../model/storyIds';
import {
  ChapterFilter,
  ChapterListenStatus,
  ChapterUiModel,
  ColorMode,
  FrameRateMode,
  PlayerSheetType,
  PronunciationRule,
  SleepMode,
  Story,
  StorySourceType,
  Tab,
  UiState,
  UiTheme,
  VoiceModelPackage,
  WebSearchHit,
} from '../model/types';
import { parseEpubFile } from '../engine/epubParser';
import {
  applyThemeCssVars,
  buildTonalSpotScheme,
  extractCoverSeedColor,
  MaterialColorScheme,
  resolveDarkMode,
  resolveSeedColor,
} from '../theme/materialTheme';

const STORAGE_KEY = 'novelbook_web_state_v1';

interface PersistedData {
  uiTheme: UiTheme;
  colorMode: ColorMode;
  monetSeed: string;
  selectedVoice: string;
  autoNextChapter: boolean;
  karaokeFontSize: number;
  playerVolume: number;
  playerBlur: number;
  hapticEnabled: boolean;
  hapticIntensity: number;
  voiceProfileEnabled: boolean;
  contentLanguage: string;
  contentExtractionMode: string;
  disabledTtsSources: string[];
  pronunciationRules: PronunciationRule[];
  libraryItems: Story[];
  historyItems: Story[];
  selectedWebSearchSource: string;
  geminiApiKey: string;
  zaloApiKey: string;
  adBlockEnabled: boolean;
  dnsProvider: 'SYSTEM' | 'CLOUDFLARE' | 'GOOGLE' | 'ADGUARD';
  wikiCvLoggedIn: boolean;
  installedVoiceModels: string[];
  pitch?: number;
}

function loadPersisted(): Partial<PersistedData> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<PersistedData>;
  } catch {
    return {};
  }
}

function buildChapterModels(story: Story, currentChapter: number, currentProgress: number): ChapterUiModel[] {
  const total = Math.max(story.totalChapters || 0, story.chapters?.length || 0, 8);
  return Array.from({ length: total }, (_, idx) => {
    const chapterNum = idx + 1;
    const ch = story.chapters?.[idx];
    const isCurrent = chapterNum === currentChapter;
    let status = ChapterListenStatus.UNPLAYED;
    let progress = 0;
    if (chapterNum < currentChapter) {
      status = ChapterListenStatus.COMPLETED;
      progress = 1;
    } else if (isCurrent) {
      status = currentProgress >= 0.99 ? ChapterListenStatus.COMPLETED : currentProgress > 0 ? ChapterListenStatus.IN_PROGRESS : ChapterListenStatus.UNPLAYED;
      progress = currentProgress;
    }
    return {
      index: chapterNum,
      title: ch?.title || `Chương ${chapterNum}: ${chapTitle(chapterNum)}`,
      url: ch?.url || `${story.storyUrl || ''}/chuong-${chapterNum}`,
      chapterId: StoryIds.chapterId(ch?.url, chapterNum),
      status,
      progress,
      isCurrent,
      lastListenedAt: isCurrent ? story.lastListenedAt : 0,
    };
  });
}

function getChapterSentences(story: Story, chapterNumber: number): { title: string; sentences: string[] } {
  const existing = story.chapters?.find((c) => c.index === chapterNumber);
  if (existing && existing.sentences.length > 0) {
    return { title: existing.title, sentences: existing.sentences };
  }
  const generated = buildSampleChapters(story.title, story.author, Math.max(chapterNumber, story.totalChapters || 8));
  const found = generated[chapterNumber - 1] || generated[0];
  return { title: found.title, sentences: found.sentences };
}

function estimateSentenceMs(sentence: string, speed: number): number {
  const words = Math.max(4, sentence.trim().split(/\s+/).length);
  const baseMs = words * 330 + 600;
  return Math.max(800, Math.round(baseMs / Math.max(0.25, speed)));
}

function applyPronunciation(text: string, rules: PronunciationRule[], storyId?: string): string {
  let out = text;
  for (const r of rules) {
    if (r.storyId && r.storyId !== storyId) continue;
    if (!r.from) continue;
    try {
      out = out.split(r.from).join(r.to);
    } catch {
      // ignore invalid
    }
  }
  return out;
}

export interface ThemeRevealState {
  active: boolean;
  x: number;
  y: number;
  color: string;
}

interface PlayerContextValue {
  ui: UiState;
  scheme: MaterialColorScheme;
  themeReveal: ThemeRevealState;
  voiceModels: VoiceModelPackage[];
  sourceBrowserOpen: boolean;
  openSourceBrowser: (initialUrl?: string) => void;
  closeSourceBrowser: () => void;
  sourceBrowserUrl: string;
  triggerHaptic: (kind?: 'tick' | 'tap' | 'snap') => void;
  setTab: (tab: Tab) => void;
  goBack: () => void;
  openPlayer: (story: Story) => void;
  closePlayer: () => void;
  hideMiniPlayer: () => void;
  togglePlay: () => void;
  toggleKaraoke: () => void;
  nextChapter: () => void;
  prevChapter: () => void;
  setChapter: (chapterNum: number) => void;
  skipSentence: (delta: number) => void;
  seekToSentence: (index: number) => void;
  seekTo: (fraction: number) => void;
  replay: () => void;
  setSpeed: (speed: number, closeAfter?: boolean) => void;
  setPitch: (pitch: number) => void;
  setVoice: (voiceId: string) => void;
  previewVoice: (voiceId: string) => void;
  toggleLoop: () => void;
  toggleAutoNext: () => void;
  toggleVoiceProfile: () => void;
  setPlayerVolume: (vol: number) => void;
  setKaraokeFont: (size: number) => void;
  setSleepTimer: (minutes: number | null) => void;
  setSmartSleep: (mode: SleepMode) => void;
  openSheet: (sheet: PlayerSheetType) => void;
  closeSheet: () => void;
  setChapterFilter: (filter: ChapterFilter) => void;
  filteredChapterItems: () => ChapterUiModel[];
  setLibFilter: (filter: 'all' | 'reading') => void;
  askDelete: (story: Story | null) => void;
  deleteFromLibrary: (storyId: string) => void;
  saveToLibrary: (story: Story) => void;
  openPaste: () => void;
  closePaste: () => void;
  setPasteUrl: (url: string) => void;
  markClipboardEmpty: () => void;
  clearPasteResult: () => void;
  analyzeLink: (url: string) => void;
  analyzeFromSearch: (url: string) => void;
  importEpubFile: (file: File) => void;
  clearEpubImport: () => void;
  listenImportedEpub: () => void;
  saveImportedEpub: (closeAfter?: boolean) => void;
  setSearchQuery: (q: string) => void;
  selectWebSearchSource: (domain: string) => void;
  searchWeb: (q: string) => void;
  loadWebSuggestions: () => void;
  playFirstChapter: (hit: WebSearchHit) => void;
  isLinkQuery: (q: string) => boolean;
  setUiTheme: (theme: UiTheme, origin?: { x: number; y: number }) => void;
  setColorMode: (mode: ColorMode) => void;
  setSeed: (seedName: string) => void;
  setPlayerBlur: (blur: number) => void;
  setHapticEnabled: (enabled: boolean) => void;
  setHapticIntensity: (intensity: number) => void;
  setContentLanguage: (lang: string) => void;
  setContentExtractionMode: (mode: string) => void;
  toggleTtsSource: (key: string, enabled: boolean) => void;
  onGeminiKeyChange: (key: string) => void;
  applyGeminiApiKey: () => void;
  clearGeminiApiKey: () => void;
  onZaloKeyChange: (key: string) => void;
  applyZaloApiKey: () => void;
  clearZaloApiKey: () => void;
  addPronunciation: (from: string, to: string, currentStoryOnly: boolean) => void;
  removePronunciation: (id: string) => void;
  updateVoiceModel: (modelId: string, install: boolean) => void;
  setAdBlockEnabled: (enabled: boolean) => void;
  setDnsProvider: (provider: 'SYSTEM' | 'CLOUDFLARE' | 'GOOGLE' | 'ADGUARD') => void;
  setWikiCvLoggedIn: (loggedIn: boolean) => void;
  exportBackupJson: () => string;
  importBackupJson: (jsonText: string) => void;
  clearError: () => void;
  allStories: () => Story[];
  historyStories: () => Story[];
  libraryStories: () => Story[];
  trendingStories: () => Story[];
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const persisted = useMemo(() => loadPersisted(), []);

  const initialLibrary = persisted.libraryItems ?? STARTER_STORIES;
  const initialHistory = persisted.historyItems ?? STARTER_STORIES.slice(0, 3);
  const initialActive = initialHistory[0] ?? initialLibrary[0] ?? null;

  const initialDisabledSources = persisted.disabledTtsSources ?? [];
  const initialTtsSources = DEFAULT_TTS_SOURCES.map((s) => ({
    ...s,
    configured: s.key === 'gemini' ? Boolean(persisted.geminiApiKey) : s.key === 'zalo' ? Boolean(persisted.zaloApiKey) : s.configured,
    enabled: !initialDisabledSources.includes(s.key),
  }));

  const [ui, setUi] = useState<UiState>(() => {
    const active = initialActive;
    const chNum = active?.currentChapter || 1;
    const chData = active ? getChapterSentences(active, chNum) : { title: '', sentences: [] };
    const totalMs = chData.sentences.reduce((acc, s) => acc + estimateSentenceMs(s, 1.0), 0);
    const activeIdx = active ? Math.min(active.sentenceIndex || 0, Math.max(0, chData.sentences.length - 1)) : 0;
    const progress = chData.sentences.length > 0 ? activeIdx / chData.sentences.length : 0;
    return {
      currentTab: Tab.HOME,
      tabHistory: [Tab.HOME],
      uiTheme: persisted.uiTheme ?? UiTheme.SYSTEM,
      colorMode: persisted.colorMode ?? ColorMode.SYSTEM_WALLPAPER,
      monetSeed: persisted.monetSeed ?? DEFAULT_SEED,
      accentColor: MONET[persisted.monetSeed ?? DEFAULT_SEED] ?? DEFAULT_ACCENT,
      selectedVoice: persisted.selectedVoice ?? 'edge:vi-VN-HoaiMyNeural',
      geminiApiKey: persisted.geminiApiKey ?? '',
      geminiKeyChecking: false,
      geminiKeyOk: Boolean(persisted.geminiApiKey),
      geminiKeyStatus: persisted.geminiApiKey ? 'Đã kết nối Gemini TTS' : null,
      zaloApiKey: persisted.zaloApiKey ?? '',
      zaloKeyChecking: false,
      zaloKeyOk: Boolean(persisted.zaloApiKey),
      zaloKeyStatus: persisted.zaloApiKey ? 'Đã kết nối Zalo AI TTS' : null,
      voiceActionStatus: null,
      autoNextChapter: persisted.autoNextChapter ?? true,
      karaokeFontSize: persisted.karaokeFontSize ?? 24,
      playerVolume: persisted.playerVolume ?? 1,
      frameRateMode: FrameRateMode.AUTO,
      playerBlur: persisted.playerBlur ?? 8,
      hapticEnabled: persisted.hapticEnabled ?? true,
      hapticIntensity: persisted.hapticIntensity ?? 55,
      voiceProfileEnabled: persisted.voiceProfileEnabled ?? true,
      contentLanguage: persisted.contentLanguage ?? 'AUTO',
      contentExtractionMode: persisted.contentExtractionMode ?? 'SMART',
      disabledTtsSources: initialDisabledSources,
      ttsSources: initialTtsSources,
      pronunciationRules: persisted.pronunciationRules ?? [],
      backupStatus: null,
      libFilter: 'all',
      chapterFilter: ChapterFilter.ALL,
      historyItems: initialHistory,
      libraryItems: initialLibrary,
      searchQuery: '',
      webResults: [],
      webSuggestions: CATALOG_WEB_HITS.slice(0, 5),
      webSuggestionsSource: persisted.selectedWebSearchSource ?? 'apptruyenchu.pro',
      webSuggestionsLoading: false,
      webSuggestionsError: null,
      webSearchSources:
        persisted.selectedWebSearchSource && !QUICK_SEARCH_SOURCES.includes(persisted.selectedWebSearchSource)
          ? [persisted.selectedWebSearchSource, ...QUICK_SEARCH_SOURCES]
          : QUICK_SEARCH_SOURCES,
      selectedWebSearchSource: persisted.selectedWebSearchSource ?? 'apptruyenchu.pro',
      webSearching: false,
      webError: null,
      webOpeningUrl: null,
      webSearchedQuery: '',
      webSearchedSource: '',
      webSitesSearched: 0,
      voiceGroups: VOICE_GROUPS,
      activeStory: active,
      chapterNumber: chNum,
      chapterTitle: chData.title,
      isPlayerOpen: false,
      hiddenMiniPlayerStoryId: null,
      isKaraoke: false,
      isPlaying: false,
      isBuffering: false,
      ttsProvider: 'Edge TTS',
      errorMessage: null,
      chapterLoadError: null,
      progress: active?.progress ?? progress,
      positionMs: Math.round(totalMs * (active?.progress ?? progress)),
      durationMs: Math.max(1000, totalMs),
      speed: 1.0,
      pitch: persisted.pitch ?? 1.0,
      loop: false,
      sleepTimer: null,
      sleepMode: SleepMode.OFF,
      sentences: chData.sentences,
      activeSentenceIndex: activeIdx,
      tocUrls: [],
      tocTitles: active ? Array.from({ length: active.totalChapters }, (_, i) => active.chapters?.[i]?.title || chapTitle(i + 1)) : [],
      chapterItems: active ? buildChapterModels(active, chNum, active.progress ?? progress) : [],
      playback: {
        storyId: active?.id || '',
        storyTitle: active?.title || 'NovelBook',
        author: active?.author || '',
        chapterTitle: chData.title,
        chapterIndex: chNum,
        totalChapters: active?.totalChapters || 0,
        coverUrl: active?.coverUrl || '',
        source: active?.source,
        positionMs: 0,
        durationMs: Math.max(1000, totalMs),
        speed: 1.0,
        voiceId: persisted.selectedVoice ?? 'edge:vi-VN-HoaiMyNeural',
        isPlaying: false,
        isBuffering: false,
        hasPrevious: chNum > 1,
        hasNext: active ? chNum < Math.max(1, active.totalChapters) : false,
      },
      sheet: null,
      storyToDelete: null,
      pasteOpen: false,
      paste: { url: '', analyzing: false, step: 1, result: null, clipErr: false, error: null },
      epubImport: { importing: false, fileName: '', result: null, error: null },
      adBlockEnabled: persisted.adBlockEnabled ?? true,
      dnsProvider: persisted.dnsProvider ?? 'SYSTEM',
      wikiCvLoggedIn: persisted.wikiCvLoggedIn ?? false,
    };
  });

  const [voiceModels, setVoiceModels] = useState<VoiceModelPackage[]>(() => {
    const installedSet = new Set(persisted.installedVoiceModels ?? ['piper-vi-vais1000']);
    return VOICE_MODEL_PACKAGES.map((m) => ({ ...m, installed: installedSet.has(m.id), progress: null }));
  });

  const [systemDark, setSystemDark] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)').matches : false,
  );
  const [coverSeedHex, setCoverSeedHex] = useState<string | null>(null);
  const [themeReveal, setThemeReveal] = useState<ThemeRevealState>({ active: false, x: 0, y: 0, color: '#111318' });
  const [sourceBrowserOpen, setSourceBrowserOpen] = useState(false);
  const [sourceBrowserUrl, setSourceBrowserUrl] = useState('');

  // Listen to OS dark mode changes
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Extract cover seed when active story changes in COVER_ART mode
  useEffect(() => {
    const active = ui.activeStory;
    if (ui.colorMode !== ColorMode.COVER_ART || !active || active.id === placeholderStory.id) {
      setCoverSeedHex(null);
      return;
    }
    let cancelled = false;
    extractCoverSeedColor(active.coverUrl, active.color || DEFAULT_ACCENT).then((hex) => {
      if (!cancelled) setCoverSeedHex(hex);
    });
    return () => {
      cancelled = true;
    };
  }, [ui.colorMode, ui.activeStory?.id, ui.activeStory?.coverUrl]);

  const scheme = useMemo(() => {
    const dark = resolveDarkMode(ui.uiTheme, systemDark);
    const customHex = MONET[ui.monetSeed] ?? ui.accentColor ?? DEFAULT_ACCENT;
    const seed = resolveSeedColor(ui.colorMode, customHex, coverSeedHex);
    return buildTonalSpotScheme(seed, dark);
  }, [ui.uiTheme, ui.colorMode, ui.monetSeed, ui.accentColor, coverSeedHex, systemDark]);

  useEffect(() => {
    applyThemeCssVars(scheme);
  }, [scheme]);

  // Persist user data & settings to localStorage
  useEffect(() => {
    try {
      const payload: PersistedData = {
        uiTheme: ui.uiTheme,
        colorMode: ui.colorMode,
        monetSeed: ui.monetSeed,
        selectedVoice: ui.selectedVoice,
        autoNextChapter: ui.autoNextChapter,
        karaokeFontSize: ui.karaokeFontSize,
        playerVolume: ui.playerVolume,
        playerBlur: ui.playerBlur,
        hapticEnabled: ui.hapticEnabled,
        hapticIntensity: ui.hapticIntensity,
        voiceProfileEnabled: ui.voiceProfileEnabled,
        contentLanguage: ui.contentLanguage,
        contentExtractionMode: ui.contentExtractionMode,
        disabledTtsSources: ui.disabledTtsSources,
        pronunciationRules: ui.pronunciationRules,
        libraryItems: ui.libraryItems,
        historyItems: ui.historyItems,
        selectedWebSearchSource: ui.selectedWebSearchSource,
        geminiApiKey: ui.geminiApiKey,
        zaloApiKey: ui.zaloApiKey,
        adBlockEnabled: ui.adBlockEnabled,
        dnsProvider: ui.dnsProvider,
        wikiCvLoggedIn: ui.wikiCvLoggedIn,
        installedVoiceModels: voiceModels.filter((m) => m.installed).map((m) => m.id),
        pitch: ui.pitch,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore storage quota errors
    }
  }, [
    ui.uiTheme,
    ui.colorMode,
    ui.monetSeed,
    ui.selectedVoice,
    ui.autoNextChapter,
    ui.karaokeFontSize,
    ui.playerVolume,
    ui.playerBlur,
    ui.hapticEnabled,
    ui.hapticIntensity,
    ui.voiceProfileEnabled,
    ui.contentLanguage,
    ui.contentExtractionMode,
    ui.disabledTtsSources,
    ui.pronunciationRules,
    ui.libraryItems,
    ui.historyItems,
    ui.selectedWebSearchSource,
    ui.geminiApiKey,
    ui.zaloApiKey,
    ui.adBlockEnabled,
    ui.dnsProvider,
    ui.wikiCvLoggedIn,
    voiceModels,
  ]);

  const triggerHaptic = useCallback(
    (kind: 'tick' | 'tap' | 'snap' = 'tap') => {
      if (!ui.hapticEnabled || typeof navigator === 'undefined' || !navigator.vibrate) return;
      const factor = Math.max(0.2, ui.hapticIntensity / 100);
      const ms = kind === 'tick' ? Math.round(8 * factor) : kind === 'snap' ? Math.round(18 * factor) : Math.round(12 * factor);
      try {
        navigator.vibrate(Math.max(4, ms));
      } catch {
        // ignore
      }
    },
    [ui.hapticEnabled, ui.hapticIntensity],
  );

  // Playback engine: Web Speech API + smooth 10Hz progression timer
  const uiRef = useRef(ui);
  uiRef.current = ui;
  const speechSessionRef = useRef(0);

  const stopSpeech = useCallback(() => {
    speechSessionRef.current += 1;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
  }, []);

  const speechUnlockedRef = useRef(false);

  const unlockSpeech = useCallback(() => {
    if (speechUnlockedRef.current || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.getVoices();
      const primer = new SpeechSynthesisUtterance('');
      primer.volume = 0;
      window.speechSynthesis.speak(primer);
      speechUnlockedRef.current = true;
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const warmVoices = () => {
      try {
        window.speechSynthesis.getVoices();
      } catch {
        // ignore
      }
    };
    warmVoices();
    window.speechSynthesis.addEventListener?.('voiceschanged', warmVoices);
    return () => {
      window.speechSynthesis.removeEventListener?.('voiceschanged', warmVoices);
    };
  }, []);

  const speakSentence = useCallback(
    (sentence: string, speed: number, volume: number, voiceId: string, storyId?: string, pitch = 1.0) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      try {
        window.speechSynthesis.cancel();
        const processed = applyPronunciation(sentence, uiRef.current.pronunciationRules, storyId);
        const utter = new SpeechSynthesisUtterance(processed);
        utter.rate = Math.min(4, Math.max(0.1, speed));
        utter.pitch = Math.min(2, Math.max(0, pitch));
        utter.volume = Math.min(1, Math.max(0, volume));
        const voices = window.speechSynthesis.getVoices();
        const wantLang = voiceId.includes('en') ? 'en' : 'vi';
        const match = voices.find((v) => v.lang.toLowerCase().startsWith(wantLang));
        if (match) utter.voice = match;
        utter.lang = wantLang === 'en' ? 'en-US' : 'vi-VN';
        window.speechSynthesis.speak(utter);
      } catch {
        // ignore speech synthesis restrictions
      }
    },
    [],
  );

  // Advance playback ticks at 100ms intervals while isPlaying
  const sentenceElapsedRef = useRef(0);

  useEffect(() => {
    if (!ui.isPlaying || !ui.activeStory || ui.sentences.length === 0) {
      stopSpeech();
      return;
    }

    const active = ui.activeStory;
    const idx = Math.min(ui.activeSentenceIndex, ui.sentences.length - 1);
    const currentLine = ui.sentences[idx] || '';
    speakSentence(currentLine, ui.speed, ui.playerVolume, ui.selectedVoice, active.id, ui.pitch);
    sentenceElapsedRef.current = 0;

    const timer = window.setInterval(() => {
      const state = uiRef.current;
      if (!state.isPlaying || !state.activeStory || state.sentences.length === 0) return;

      const curIdx = state.activeSentenceIndex;
      const curSentence = state.sentences[curIdx] || '';
      const targetSentenceMs = estimateSentenceMs(curSentence, state.speed);
      sentenceElapsedRef.current += 100;

      if (sentenceElapsedRef.current >= targetSentenceMs) {
        sentenceElapsedRef.current = 0;

        if (state.sleepMode === SleepMode.END_SENTENCE) {
          setUi((prev) => ({
            ...prev,
            isPlaying: false,
            sleepMode: SleepMode.OFF,
            playback: { ...prev.playback, isPlaying: false },
          }));
          return;
        }

        const nextIdx = curIdx + 1;
        if (nextIdx < state.sentences.length) {
          const newProgress = nextIdx / state.sentences.length;
          const newPos = Math.round(state.durationMs * newProgress);
          speakSentence(state.sentences[nextIdx], state.speed, state.playerVolume, state.selectedVoice, state.activeStory.id, state.pitch);
          setUi((prev) => {
            const updatedStory: Story = {
              ...prev.activeStory!,
              sentenceIndex: nextIdx,
              progress: newProgress,
              positionMs: newPos,
              lastListenedAt: Date.now(),
            };
            return {
              ...prev,
              activeSentenceIndex: nextIdx,
              progress: newProgress,
              positionMs: newPos,
              activeStory: updatedStory,
              chapterItems: buildChapterModels(updatedStory, prev.chapterNumber, newProgress),
              historyItems: [updatedStory, ...prev.historyItems.filter((s) => s.id !== updatedStory.id)],
              playback: { ...prev.playback, positionMs: newPos },
            };
          });
        } else {
          // Reached end of chapter
          if (state.sleepMode === SleepMode.END_CHAPTER) {
            setUi((prev) => ({
              ...prev,
              isPlaying: false,
              sleepMode: SleepMode.OFF,
              playback: { ...prev.playback, isPlaying: false },
            }));
            return;
          }
          if (state.loop) {
            speakSentence(state.sentences[0], state.speed, state.playerVolume, state.selectedVoice, state.activeStory.id, state.pitch);
            setUi((prev) => ({
              ...prev,
              activeSentenceIndex: 0,
              progress: 0,
              positionMs: 0,
              playback: { ...prev.playback, positionMs: 0 },
            }));
            return;
          }
          const totalCh = Math.max(1, state.activeStory.totalChapters || state.sentences.length);
          if (state.autoNextChapter && state.chapterNumber < totalCh) {
            const nextCh = state.chapterNumber + 1;
            const chData = getChapterSentences(state.activeStory, nextCh);
            const totalMs = chData.sentences.reduce((acc, s) => acc + estimateSentenceMs(s, state.speed), 0);
            speakSentence(chData.sentences[0], state.speed, state.playerVolume, state.selectedVoice, state.activeStory.id, state.pitch);
            setUi((prev) => {
              const updatedStory: Story = {
                ...prev.activeStory!,
                currentChapter: nextCh,
                chapterTitle: chData.title,
                sentenceIndex: 0,
                sentenceCount: chData.sentences.length,
                progress: 0,
                positionMs: 0,
                lastListenedAt: Date.now(),
              };
              return {
                ...prev,
                chapterNumber: nextCh,
                chapterTitle: chData.title,
                sentences: chData.sentences,
                activeSentenceIndex: 0,
                progress: 0,
                positionMs: 0,
                durationMs: Math.max(1000, totalMs),
                activeStory: updatedStory,
                chapterItems: buildChapterModels(updatedStory, nextCh, 0),
                historyItems: [updatedStory, ...prev.historyItems.filter((s) => s.id !== updatedStory.id)],
                playback: {
                  ...prev.playback,
                  chapterIndex: nextCh,
                  chapterTitle: chData.title,
                  positionMs: 0,
                  durationMs: Math.max(1000, totalMs),
                  hasPrevious: nextCh > 1,
                  hasNext: nextCh < totalCh,
                },
              };
            });
          } else {
            setUi((prev) => ({
              ...prev,
              isPlaying: false,
              progress: 1,
              positionMs: prev.durationMs,
              playback: { ...prev.playback, isPlaying: false, positionMs: prev.durationMs },
            }));
          }
        }
      } else {
        // Smooth sub-sentence progress tick
        setUi((prev) => {
          const total = Math.max(1, prev.sentences.length);
          const fracInSentence = Math.min(0.98, sentenceElapsedRef.current / targetSentenceMs);
          const p = Math.min(1, (curIdx + fracInSentence) / total);
          const pos = Math.round(prev.durationMs * p);
          return {
            ...prev,
            progress: p,
            positionMs: pos,
            playback: { ...prev.playback, positionMs: pos },
          };
        });
      }
    }, 100);

    return () => {
      window.clearInterval(timer);
    };
  }, [ui.isPlaying, ui.chapterNumber, ui.activeStory?.id, ui.speed, ui.pitch, ui.playerVolume, ui.selectedVoice, speakSentence, stopSpeech]);

  // Sleep timer countdown
  useEffect(() => {
    if (ui.sleepTimer === null || ui.sleepTimer <= 0) return;
    const id = window.setInterval(() => {
      setUi((prev) => {
        if (prev.sleepTimer === null) return prev;
        if (prev.sleepTimer <= 1) {
          return {
            ...prev,
            sleepTimer: null,
            sleepMode: SleepMode.OFF,
            isPlaying: false,
            playback: { ...prev.playback, isPlaying: false },
          };
        }
        return { ...prev, sleepTimer: prev.sleepTimer - 1 };
      });
    }, 60_000);
    return () => window.clearInterval(id);
  }, [ui.sleepTimer !== null]);

  const loadChapterIntoPlayer = useCallback(
    (story: Story, chapterNum: number, openModal: boolean, autoPlay: boolean) => {
      const totalCh = Math.max(1, story.totalChapters || story.chapters?.length || 8);
      const safeCh = Math.min(Math.max(1, chapterNum), totalCh);
      const chData = getChapterSentences(story, safeCh);
      const totalMs = chData.sentences.reduce((acc, s) => acc + estimateSentenceMs(s, uiRef.current.speed), 0);
      const startIdx = safeCh === story.currentChapter ? Math.min(story.sentenceIndex || 0, Math.max(0, chData.sentences.length - 1)) : 0;
      const p = chData.sentences.length > 0 ? startIdx / chData.sentences.length : 0;
      const pos = Math.round(totalMs * p);
      const updatedStory: Story = {
        ...story,
        currentChapter: safeCh,
        chapterTitle: chData.title,
        sentenceIndex: startIdx,
        sentenceCount: chData.sentences.length,
        progress: p,
        positionMs: pos,
        lastListenedAt: Date.now(),
        updatedAt: Date.now(),
      };

      setUi((prev) => {
        const existsInLib = prev.libraryItems.some((s) => s.id === updatedStory.id);
        return {
          ...prev,
          activeStory: updatedStory,
          chapterNumber: safeCh,
          chapterTitle: chData.title,
          sentences: chData.sentences,
          activeSentenceIndex: startIdx,
          progress: p,
          positionMs: pos,
          durationMs: Math.max(1000, totalMs),
          isPlayerOpen: openModal ? true : prev.isPlayerOpen,
          hiddenMiniPlayerStoryId: null,
          isPlaying: autoPlay,
          isBuffering: false,
          chapterLoadError: null,
          tocTitles: Array.from({ length: totalCh }, (_, i) => updatedStory.chapters?.[i]?.title || `Chương ${i + 1}: ${chapTitle(i + 1)}`),
          chapterItems: buildChapterModels(updatedStory, safeCh, p),
          historyItems: [updatedStory, ...prev.historyItems.filter((s) => s.id !== updatedStory.id)],
          libraryItems: existsInLib
            ? prev.libraryItems.map((s) => (s.id === updatedStory.id ? updatedStory : s))
            : [updatedStory, ...prev.libraryItems],
          playback: {
            storyId: updatedStory.id,
            storyTitle: updatedStory.title,
            author: updatedStory.author,
            chapterTitle: chData.title,
            chapterIndex: safeCh,
            totalChapters: totalCh,
            coverUrl: updatedStory.coverUrl,
            source: updatedStory.source,
            positionMs: pos,
            durationMs: Math.max(1000, totalMs),
            speed: prev.speed,
            voiceId: prev.selectedVoice,
            isPlaying: autoPlay,
            isBuffering: false,
            hasPrevious: safeCh > 1,
            hasNext: safeCh < totalCh,
          },
        };
      });
    },
    [],
  );

  const actions: PlayerContextValue = {
    ui,
    scheme,
    themeReveal,
    voiceModels,
    sourceBrowserOpen,
    sourceBrowserUrl,
    openSourceBrowser: (initialUrl = '') => {
      setSourceBrowserUrl(initialUrl);
      setSourceBrowserOpen(true);
    },
    closeSourceBrowser: () => setSourceBrowserOpen(false),
    triggerHaptic,

    setTab: (tab) => {
      setUi((prev) => {
        if (prev.currentTab === tab) return prev;
        return {
          ...prev,
          currentTab: tab,
          tabHistory: [...prev.tabHistory.slice(-8), tab],
          ...(tab === Tab.SETTINGS ? { isPlayerOpen: false, sheet: null, isKaraoke: false } : {}),
        };
      });
    },

    goBack: () => {
      setUi((prev) => {
        if (prev.sheet) return { ...prev, sheet: null };
        if (prev.isKaraoke) return { ...prev, isKaraoke: false };
        if (prev.isPlayerOpen) return { ...prev, isPlayerOpen: false };
        if (prev.pasteOpen) return { ...prev, pasteOpen: false };
        if (prev.currentTab === Tab.SETTINGS) {
          const prevTab = [...prev.tabHistory].reverse().find((t) => t !== Tab.SETTINGS) ?? Tab.HOME;
          return { ...prev, currentTab: prevTab };
        }
        return { ...prev, currentTab: Tab.HOME };
      });
    },

    openPlayer: (story) => {
      triggerHaptic('tap');
      if (story.id === placeholderStory.id) {
        setUi((prev) => ({ ...prev, pasteOpen: true }));
        return;
      }
      const sameStory = uiRef.current.activeStory?.id === story.id;
      if (sameStory) {
        setUi((prev) => ({ ...prev, isPlayerOpen: true, hiddenMiniPlayerStoryId: null }));
      } else {
        loadChapterIntoPlayer(story, story.currentChapter || 1, true, false);
      }
    },

    closePlayer: () => {
      triggerHaptic('tap');
      setUi((prev) => ({ ...prev, isPlayerOpen: false, sheet: null, isKaraoke: false }));
    },

    hideMiniPlayer: () => {
      triggerHaptic('tick');
      setUi((prev) => ({
        ...prev,
        hiddenMiniPlayerStoryId: prev.activeStory?.id ?? null,
      }));
    },

    togglePlay: () => {
      triggerHaptic('tap');
      unlockSpeech();
      setUi((prev) => {
        const nextPlaying = !prev.isPlaying;
        return {
          ...prev,
          isPlaying: nextPlaying,
          playback: { ...prev.playback, isPlaying: nextPlaying },
        };
      });
    },

    toggleKaraoke: () => {
      triggerHaptic('tick');
      setUi((prev) => ({ ...prev, isKaraoke: !prev.isKaraoke }));
    },

    nextChapter: () => {
      const st = uiRef.current.activeStory;
      if (!st) return;
      const total = Math.max(1, st.totalChapters || 8);
      if (uiRef.current.chapterNumber >= total) return;
      triggerHaptic('snap');
      loadChapterIntoPlayer(st, uiRef.current.chapterNumber + 1, uiRef.current.isPlayerOpen, uiRef.current.isPlaying);
    },

    prevChapter: () => {
      const st = uiRef.current.activeStory;
      if (!st || uiRef.current.chapterNumber <= 1) return;
      triggerHaptic('snap');
      loadChapterIntoPlayer(st, uiRef.current.chapterNumber - 1, uiRef.current.isPlayerOpen, uiRef.current.isPlaying);
    },

    setChapter: (chapterNum) => {
      const st = uiRef.current.activeStory;
      if (!st) return;
      triggerHaptic('tap');
      loadChapterIntoPlayer(st, chapterNum, true, true);
      setUi((prev) => ({ ...prev, sheet: null }));
    },

    skipSentence: (delta) => {
      triggerHaptic('tick');
      sentenceElapsedRef.current = 0;
      setUi((prev) => {
        if (prev.sentences.length === 0 || !prev.activeStory) return prev;
        const nextIdx = Math.min(prev.sentences.length - 1, Math.max(0, prev.activeSentenceIndex + delta));
        const p = nextIdx / prev.sentences.length;
        const pos = Math.round(prev.durationMs * p);
        if (prev.isPlaying) {
          speakSentence(prev.sentences[nextIdx], prev.speed, prev.playerVolume, prev.selectedVoice, prev.activeStory.id, prev.pitch);
        }
        const updatedStory: Story = {
          ...prev.activeStory,
          sentenceIndex: nextIdx,
          progress: p,
          positionMs: pos,
          lastListenedAt: Date.now(),
        };
        return {
          ...prev,
          activeSentenceIndex: nextIdx,
          progress: p,
          positionMs: pos,
          activeStory: updatedStory,
          chapterItems: buildChapterModels(updatedStory, prev.chapterNumber, p),
          historyItems: [updatedStory, ...prev.historyItems.filter((s) => s.id !== updatedStory.id)],
          playback: { ...prev.playback, positionMs: pos },
        };
      });
    },

    seekToSentence: (index) => {
      triggerHaptic('tick');
      sentenceElapsedRef.current = 0;
      setUi((prev) => {
        if (prev.sentences.length === 0 || !prev.activeStory) return prev;
        const safeIdx = Math.min(prev.sentences.length - 1, Math.max(0, index));
        const p = safeIdx / prev.sentences.length;
        const pos = Math.round(prev.durationMs * p);
        if (prev.isPlaying) {
          speakSentence(prev.sentences[safeIdx], prev.speed, prev.playerVolume, prev.selectedVoice, prev.activeStory.id, prev.pitch);
        }
        const updatedStory: Story = {
          ...prev.activeStory,
          sentenceIndex: safeIdx,
          progress: p,
          positionMs: pos,
          lastListenedAt: Date.now(),
        };
        return {
          ...prev,
          activeSentenceIndex: safeIdx,
          progress: p,
          positionMs: pos,
          activeStory: updatedStory,
          chapterItems: buildChapterModels(updatedStory, prev.chapterNumber, p),
          historyItems: [updatedStory, ...prev.historyItems.filter((s) => s.id !== updatedStory.id)],
          playback: { ...prev.playback, positionMs: pos },
        };
      });
    },

    seekTo: (fraction) => {
      const clamped = Math.min(1, Math.max(0, fraction));
      sentenceElapsedRef.current = 0;
      setUi((prev) => {
        if (!prev.activeStory) return prev;
        const count = prev.sentences.length;
        const idx = count > 0 ? Math.min(count - 1, Math.floor(clamped * count)) : 0;
        const pos = Math.round(prev.durationMs * clamped);
        if (prev.isPlaying && count > 0) {
          speakSentence(prev.sentences[idx], prev.speed, prev.playerVolume, prev.selectedVoice, prev.activeStory.id, prev.pitch);
        }
        const updatedStory: Story = {
          ...prev.activeStory,
          sentenceIndex: idx,
          progress: clamped,
          positionMs: pos,
          lastListenedAt: Date.now(),
        };
        return {
          ...prev,
          activeSentenceIndex: idx,
          progress: clamped,
          positionMs: pos,
          activeStory: updatedStory,
          chapterItems: buildChapterModels(updatedStory, prev.chapterNumber, clamped),
          historyItems: [updatedStory, ...prev.historyItems.filter((s) => s.id !== updatedStory.id)],
          playback: { ...prev.playback, positionMs: pos },
        };
      });
    },

    replay: () => {
      triggerHaptic('tap');
      unlockSpeech();
      sentenceElapsedRef.current = 0;
      setUi((prev) => {
        if (prev.sentences.length === 0) return prev;
        if (prev.isPlaying) {
          speakSentence(prev.sentences[prev.activeSentenceIndex], prev.speed, prev.playerVolume, prev.selectedVoice, prev.activeStory?.id, prev.pitch);
          return prev;
        }
        return {
          ...prev,
          isPlaying: true,
          playback: { ...prev.playback, isPlaying: true },
        };
      });
    },

    setSpeed: (speed, closeAfter = false) => {
      const clamped = Math.min(4, Math.max(0, Number(speed.toFixed(2))));
      if (Math.abs(clamped - uiRef.current.speed) >= 0.01) {
        triggerHaptic('tick');
      }
      setUi((prev) => ({
        ...prev,
        speed: clamped,
        sheet: closeAfter ? null : prev.sheet,
        playback: { ...prev.playback, speed: clamped },
      }));
    },

    setPitch: (pitch) => {
      const clamped = Math.min(2, Math.max(0, Number(pitch.toFixed(2))));
      if (Math.abs(clamped - uiRef.current.pitch) >= 0.01) {
        triggerHaptic('tick');
      }
      setUi((prev) => ({
        ...prev,
        pitch: clamped,
      }));
    },

    setVoice: (voiceId) => {
      triggerHaptic('tick');
      setUi((prev) => ({
        ...prev,
        selectedVoice: voiceId,
        sheet: null,
        playback: { ...prev.playback, voiceId },
      }));
    },

    previewVoice: (voiceId) => {
      triggerHaptic('tap');
      speakSentence('Xin chào, đây là giọng đọc mẫu trên ứng dụng NovelBook.', uiRef.current.speed, uiRef.current.playerVolume, voiceId, undefined, uiRef.current.pitch);
      setUi((prev) => ({ ...prev, voiceActionStatus: `Đang phát thử giọng ${voiceId}` }));
    },

    toggleLoop: () => {
      triggerHaptic('tick');
      setUi((prev) => ({ ...prev, loop: !prev.loop }));
    },

    toggleAutoNext: () => {
      triggerHaptic('tick');
      setUi((prev) => ({ ...prev, autoNextChapter: !prev.autoNextChapter }));
    },

    toggleVoiceProfile: () => {
      triggerHaptic('tick');
      setUi((prev) => ({ ...prev, voiceProfileEnabled: !prev.voiceProfileEnabled }));
    },

    setPlayerVolume: (playerVolume) => {
      setUi((prev) => ({ ...prev, playerVolume: Math.min(1, Math.max(0, playerVolume)) }));
    },

    setKaraokeFont: (karaokeFontSize) => {
      setUi((prev) => ({ ...prev, karaokeFontSize: Math.min(48, Math.max(16, karaokeFontSize)) }));
    },

    setSleepTimer: (minutes) => {
      triggerHaptic('tap');
      setUi((prev) => ({
        ...prev,
        sleepTimer: minutes,
        sleepMode: minutes ? SleepMode.MINUTES : SleepMode.OFF,
      }));
    },

    setSmartSleep: (mode) => {
      triggerHaptic('tick');
      setUi((prev) => ({
        ...prev,
        sleepMode: mode,
        sleepTimer: mode === SleepMode.OFF ? null : prev.sleepTimer,
      }));
    },

    openSheet: (sheet) => {
      triggerHaptic('tick');
      setUi((prev) => ({ ...prev, sheet }));
    },

    closeSheet: () => setUi((prev) => ({ ...prev, sheet: null })),

    setChapterFilter: (chapterFilter) => {
      triggerHaptic('tick');
      setUi((prev) => ({ ...prev, chapterFilter }));
    },

    filteredChapterItems: () => {
      const items = uiRef.current.chapterItems;
      switch (uiRef.current.chapterFilter) {
        case ChapterFilter.LISTENING:
          return items.filter((i) => i.isCurrent || i.status === ChapterListenStatus.IN_PROGRESS);
        case ChapterFilter.HEARD:
          return items.filter((i) => i.status === ChapterListenStatus.COMPLETED);
        default:
          return items;
      }
    },

    setLibFilter: (libFilter) => {
      triggerHaptic('tick');
      setUi((prev) => ({ ...prev, libFilter }));
    },

    askDelete: (storyToDelete) => setUi((prev) => ({ ...prev, storyToDelete })),

    deleteFromLibrary: (storyId) => {
      triggerHaptic('snap');
      setUi((prev) => {
        const nextLib = prev.libraryItems.filter((s) => s.id !== storyId);
        const nextHist = prev.historyItems.filter((s) => s.id !== storyId);
        const nextActive = prev.activeStory?.id === storyId ? nextHist[0] ?? nextLib[0] ?? null : prev.activeStory;
        return {
          ...prev,
          libraryItems: nextLib,
          historyItems: nextHist,
          activeStory: nextActive,
          isPlayerOpen: prev.activeStory?.id === storyId ? false : prev.isPlayerOpen,
          isPlaying: prev.activeStory?.id === storyId ? false : prev.isPlaying,
          storyToDelete: null,
        };
      });
    },

    saveToLibrary: (story) => {
      triggerHaptic('tap');
      setUi((prev) => {
        const exists = prev.libraryItems.some((s) => s.id === story.id);
        return {
          ...prev,
          libraryItems: exists ? prev.libraryItems : [story, ...prev.libraryItems],
          errorMessage: exists ? 'Truyện đã có trong thư viện' : 'Đã lưu truyện vào thư viện',
        };
      });
    },

    openPaste: () => {
      triggerHaptic('tap');
      setUi((prev) => ({
        ...prev,
        pasteOpen: true,
        paste: { url: '', analyzing: false, step: 1, result: null, clipErr: false, error: null },
      }));
    },

    closePaste: () => setUi((prev) => ({ ...prev, pasteOpen: false })),

    setPasteUrl: (url) =>
      setUi((prev) => ({ ...prev, paste: { ...prev.paste, url, clipErr: false, error: null } })),

    markClipboardEmpty: () =>
      setUi((prev) => ({ ...prev, paste: { ...prev.paste, clipErr: true } })),

    clearPasteResult: () =>
      setUi((prev) => ({
        ...prev,
        paste: { url: '', analyzing: false, step: 1, result: null, clipErr: false, error: null },
      })),

    analyzeLink: (rawUrl) => {
      const clean = rawUrl.trim();
      if (!StoryIds.isAllowedUrl(clean)) {
        setUi((prev) => ({
          ...prev,
          paste: { ...prev.paste, error: 'Liên kết không hợp lệ. Cần URL http(s)://...' },
        }));
        return;
      }
      setUi((prev) => ({
        ...prev,
        paste: { ...prev.paste, url: clean, analyzing: true, step: 1, error: null, result: null },
      }));

      window.setTimeout(() => {
        setUi((prev) => ({ ...prev, paste: { ...prev.paste, step: 2 } }));
      }, 320);

      window.setTimeout(() => {
        setUi((prev) => ({ ...prev, paste: { ...prev.paste, step: 3 } }));
      }, 650);

      window.setTimeout(() => {
        const host = StoryIds.hostOf(clean);
        const slug = clean.split('/').filter(Boolean).pop() || 'truyen-moi';
        const prettyTitle = slug
          .replace(/[-_]+/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase())
          .slice(0, 60);
        const matchedHit = CATALOG_WEB_HITS.find(
          (h) => StoryIds.normalizeUrl(h.url) === StoryIds.normalizeUrl(clean) || clean.includes(h.url.split('/').pop() || '___'),
        );
        const title = matchedHit?.title || prettyTitle || `Truyện từ ${host}`;
        const author = matchedHit?.author || StoryIds.sourceLabel(clean);
        const id = StoryIds.storyId(clean);
        const coverUrl = matchedHit?.coverUrl || CoverDefaults.forKey(clean);
        const chapters = buildSampleChapters(title, author, 10);
        const story: Story = {
          id,
          title,
          author,
          coverUrl,
          totalChapters: chapters.length,
          tags: [StoryIds.sourceLabel(clean)],
          color: CoverDefaults.colorForKey(clean),
          currentChapter: 1,
          source: host,
          sourceType: StorySourceType.ONLINE,
          storyUrl: clean,
          chapterUrl: `${clean.replace(/\/+$/, '')}/chuong-1`,
          chapterTitle: chapters[0].title,
          sentenceIndex: 0,
          sentenceCount: chapters[0].sentences.length,
          progress: 0,
          positionMs: 0,
          updatedAt: Date.now(),
          lastListenedAt: Date.now(),
          mirrorUrls: matchedHit?.mirrors || [],
          chapters,
        };
        setUi((prev) => ({
          ...prev,
          paste: {
            ...prev.paste,
            analyzing: false,
            step: 3,
            result: { story, source: StoryIds.sourceLabel(clean) },
          },
        }));
      }, 980);
    },

    analyzeFromSearch: (url) => {
      setUi((prev) => ({ ...prev, pasteOpen: true }));
      actions.analyzeLink(url);
    },

    importEpubFile: async (file) => {
      setUi((prev) => ({
        ...prev,
        epubImport: { importing: true, fileName: file.name, result: null, error: null },
      }));
      try {
        const result = await parseEpubFile(file);
        setUi((prev) => ({
          ...prev,
          epubImport: { importing: false, fileName: file.name, result, error: null },
        }));
      } catch (err) {
        setUi((prev) => ({
          ...prev,
          epubImport: {
            importing: false,
            fileName: file.name,
            result: null,
            error: err instanceof Error ? err.message : 'Không thể đọc tệp EPUB này.',
          },
        }));
      }
    },

    clearEpubImport: () =>
      setUi((prev) => ({
        ...prev,
        epubImport: { importing: false, fileName: '', result: null, error: null },
      })),

    listenImportedEpub: () => {
      const res = uiRef.current.epubImport.result;
      if (!res) return;
      setUi((prev) => ({
        ...prev,
        epubImport: { importing: false, fileName: '', result: null, error: null },
      }));
      loadChapterIntoPlayer(res.story, 1, true, true);
    },

    saveImportedEpub: (closeAfter = true) => {
      const res = uiRef.current.epubImport.result;
      if (!res) return;
      setUi((prev) => {
        const exists = prev.libraryItems.some((s) => s.id === res.story.id);
        return {
          ...prev,
          libraryItems: exists ? prev.libraryItems : [res.story, ...prev.libraryItems],
          epubImport: closeAfter ? { importing: false, fileName: '', result: null, error: null } : prev.epubImport,
          errorMessage: `Đã thêm "${res.story.title}" vào thư viện`,
        };
      });
    },

    setSearchQuery: (searchQuery) => setUi((prev) => ({ ...prev, searchQuery })),

    selectWebSearchSource: (domain) => {
      triggerHaptic('tick');
      setUi((prev) => ({
        ...prev,
        webSearchSources: prev.webSearchSources.includes(domain)
          ? prev.webSearchSources
          : [domain, ...prev.webSearchSources],
        selectedWebSearchSource: domain,
        webSuggestionsSource: domain,
        webSuggestions: CATALOG_WEB_HITS.filter(
          (h) => h.source === domain.replace(/^www\./, '') || h.mirrors.includes(domain.replace(/^www\./, '')),
        ).concat(CATALOG_WEB_HITS.slice(0, 4)).slice(0, 5),
      }));
      if (uiRef.current.searchQuery.trim() && !StoryIds.isAllowedUrl(uiRef.current.searchQuery)) {
        actions.searchWeb(uiRef.current.searchQuery);
      }
    },

    searchWeb: (rawQuery) => {
      const q = rawQuery.trim();
      if (!q) return;
      const src = uiRef.current.selectedWebSearchSource || 'metruyenchuvn.com';
      setUi((prev) => ({
        ...prev,
        webSearching: true,
        webError: null,
        webSearchedQuery: q,
        webSearchedSource: src,
        webSitesSearched: 1,
      }));

      window.setTimeout(() => {
        const qNorm = q.toLowerCase().normalize('NFD').replace(/\p{M}+/gu, '');
        const matched = CATALOG_WEB_HITS.filter((hit) => {
          const tNorm = hit.title.toLowerCase().normalize('NFD').replace(/\p{M}+/gu, '');
          const aNorm = hit.author.toLowerCase().normalize('NFD').replace(/\p{M}+/gu, '');
          return tNorm.includes(qNorm) || aNorm.includes(qNorm);
        }).map((hit) => ({
          ...hit,
          source: src.replace(/^www\./, ''),
          exact: hit.title.toLowerCase().normalize('NFD').replace(/\p{M}+/gu, '') === qNorm,
        }));

        const results: WebSearchHit[] =
          matched.length > 0
            ? matched
            : [
                {
                  title: q,
                  url: `https://${src}/truyen/${q.toLowerCase().replace(/\s+/g, '-')}`,
                  author: `Tác giả trên ${src.replace(/^www\./, '')}`,
                  coverUrl: CoverDefaults.forKey(`${src}:${q}`),
                  source: src.replace(/^www\./, ''),
                  score: 1,
                  exact: true,
                  matchLabel: 'Đúng tên',
                  mirrors: ['truyenfull.live'],
                },
                ...CATALOG_WEB_HITS.slice(0, 2).map((h) => ({
                  ...h,
                  exact: false,
                  matchLabel: 'Gần đúng',
                  source: src.replace(/^www\./, ''),
                })),
              ];

        setUi((prev) => ({
          ...prev,
          webSearching: false,
          webResults: results,
          webSitesSearched: 1,
        }));
      }, 420);
    },

    loadWebSuggestions: () => {
      const src = uiRef.current.selectedWebSearchSource || 'www.metruyenchuvn.com';
      setUi((prev) => ({ ...prev, webSuggestionsLoading: true, webSuggestionsError: null }));
      window.setTimeout(() => {
        const rotated = [...CATALOG_WEB_HITS].sort(() => Math.random() - 0.5).slice(0, 5);
        setUi((prev) => ({
          ...prev,
          webSuggestionsLoading: false,
          webSuggestionsSource: src,
          webSuggestions: rotated,
        }));
      }, 360);
    },

    playFirstChapter: (hit) => {
      triggerHaptic('tap');
      setUi((prev) => ({ ...prev, webOpeningUrl: hit.url }));
      window.setTimeout(() => {
        const id = StoryIds.storyId(hit.url);
        const chapters = buildSampleChapters(hit.title, hit.author, 10);
        const story: Story = {
          id,
          title: hit.title,
          author: hit.author || hit.source,
          coverUrl: hit.coverUrl || CoverDefaults.forKey(hit.url),
          totalChapters: chapters.length,
          tags: [hit.source],
          color: CoverDefaults.colorForKey(hit.url),
          currentChapter: 1,
          source: hit.source,
          sourceType: StorySourceType.ONLINE,
          storyUrl: hit.url,
          chapterUrl: `${hit.url}/chuong-1`,
          chapterTitle: chapters[0].title,
          sentenceIndex: 0,
          sentenceCount: chapters[0].sentences.length,
          progress: 0,
          positionMs: 0,
          updatedAt: Date.now(),
          lastListenedAt: Date.now(),
          mirrorUrls: hit.mirrors,
          chapters,
        };
        setUi((prev) => ({ ...prev, webOpeningUrl: null }));
        loadChapterIntoPlayer(story, 1, true, true);
      }, 320);
    },

    isLinkQuery: (q) => StoryIds.isAllowedUrl(q),

    setUiTheme: (uiTheme, origin) => {
      triggerHaptic('tick');
      if (origin) {
        setThemeReveal({ active: true, x: origin.x, y: origin.y, color: scheme.surface });
        window.setTimeout(() => {
          setUi((prev) => ({ ...prev, uiTheme }));
        }, 50);
        window.setTimeout(() => {
          setThemeReveal((r) => ({ ...r, active: false }));
        }, 460);
      } else {
        setUi((prev) => ({ ...prev, uiTheme }));
      }
    },

    setColorMode: (colorMode) => {
      triggerHaptic('tick');
      setUi((prev) => ({ ...prev, colorMode }));
    },

    setSeed: (monetSeed) => {
      triggerHaptic('tick');
      setUi((prev) => ({
        ...prev,
        monetSeed,
        accentColor: MONET[monetSeed] ?? DEFAULT_ACCENT,
      }));
    },

    setPlayerBlur: (playerBlur) => setUi((prev) => ({ ...prev, playerBlur })),
    setHapticEnabled: (hapticEnabled) => setUi((prev) => ({ ...prev, hapticEnabled })),
    setHapticIntensity: (hapticIntensity) => setUi((prev) => ({ ...prev, hapticIntensity })),
    setContentLanguage: (contentLanguage) => {
      triggerHaptic('tick');
      setUi((prev) => ({ ...prev, contentLanguage }));
    },
    setContentExtractionMode: (contentExtractionMode) => {
      triggerHaptic('tick');
      setUi((prev) => ({ ...prev, contentExtractionMode }));
    },

    toggleTtsSource: (key, enabled) => {
      triggerHaptic('tick');
      setUi((prev) => {
        const nextDisabled = enabled
          ? prev.disabledTtsSources.filter((k) => k !== key)
          : [...new Set([...prev.disabledTtsSources, key])];
        const nextSources = prev.ttsSources.map((s) => (s.key === key ? { ...s, enabled } : s));
        const nextVoiceGroups = VOICE_GROUPS.filter((g) => {
          const firstId = g.voices[0]?.id || '';
          const prefix = firstId.split(':')[0];
          return !nextDisabled.includes(prefix);
        });
        return {
          ...prev,
          disabledTtsSources: nextDisabled,
          ttsSources: nextSources,
          voiceGroups: nextVoiceGroups,
        };
      });
    },

    onGeminiKeyChange: (geminiApiKey) => setUi((prev) => ({ ...prev, geminiApiKey })),
    applyGeminiApiKey: () => {
      setUi((prev) => ({ ...prev, geminiKeyChecking: true }));
      window.setTimeout(() => {
        setUi((prev) => ({
          ...prev,
          geminiKeyChecking: false,
          geminiKeyOk: prev.geminiApiKey.trim().length >= 8,
          geminiKeyStatus: prev.geminiApiKey.trim().length >= 8 ? 'Đã lưu khóa Gemini TTS' : 'API key không hợp lệ',
          ttsSources: prev.ttsSources.map((s) =>
            s.key === 'gemini' ? { ...s, configured: prev.geminiApiKey.trim().length >= 8 } : s,
          ),
        }));
      }, 300);
    },
    clearGeminiApiKey: () =>
      setUi((prev) => ({
        ...prev,
        geminiApiKey: '',
        geminiKeyOk: false,
        geminiKeyStatus: null,
        ttsSources: prev.ttsSources.map((s) => (s.key === 'gemini' ? { ...s, configured: false } : s)),
      })),

    onZaloKeyChange: (zaloApiKey) => setUi((prev) => ({ ...prev, zaloApiKey })),
    applyZaloApiKey: () => {
      setUi((prev) => ({ ...prev, zaloKeyChecking: true }));
      window.setTimeout(() => {
        setUi((prev) => ({
          ...prev,
          zaloKeyChecking: false,
          zaloKeyOk: prev.zaloApiKey.trim().length >= 6,
          zaloKeyStatus: prev.zaloApiKey.trim().length >= 6 ? 'Đã lưu khóa Zalo AI TTS' : 'API key không hợp lệ',
          ttsSources: prev.ttsSources.map((s) =>
            s.key === 'zalo' ? { ...s, configured: prev.zaloApiKey.trim().length >= 6 } : s,
          ),
        }));
      }, 300);
    },
    clearZaloApiKey: () =>
      setUi((prev) => ({
        ...prev,
        zaloApiKey: '',
        zaloKeyOk: false,
        zaloKeyStatus: null,
        ttsSources: prev.ttsSources.map((s) => (s.key === 'zalo' ? { ...s, configured: false } : s)),
      })),

    addPronunciation: (from, to, currentStoryOnly) => {
      if (!from.trim() || !to.trim()) return;
      triggerHaptic('tap');
      const rule: PronunciationRule = {
        id: `rule_${Date.now()}`,
        from: from.trim(),
        to: to.trim(),
        storyId: currentStoryOnly ? uiRef.current.activeStory?.id ?? null : null,
      };
      setUi((prev) => ({
        ...prev,
        pronunciationRules: [...prev.pronunciationRules, rule],
      }));
    },

    removePronunciation: (id) => {
      triggerHaptic('tick');
      setUi((prev) => ({
        ...prev,
        pronunciationRules: prev.pronunciationRules.filter((r) => r.id !== id),
      }));
    },

    updateVoiceModel: (modelId, install) => {
      triggerHaptic('tap');
      if (!install) {
        setVoiceModels((prev) => prev.map((m) => (m.id === modelId ? { ...m, installed: false, progress: null } : m)));
        return;
      }
      setVoiceModels((prev) => prev.map((m) => (m.id === modelId ? { ...m, progress: 0.2 } : m)));
      window.setTimeout(() => {
        setVoiceModels((prev) => prev.map((m) => (m.id === modelId ? { ...m, progress: 0.7 } : m)));
      }, 350);
      window.setTimeout(() => {
        setVoiceModels((prev) => prev.map((m) => (m.id === modelId ? { ...m, installed: true, progress: null } : m)));
      }, 750);
    },

    setAdBlockEnabled: (adBlockEnabled) => {
      triggerHaptic('tick');
      setUi((prev) => ({ ...prev, adBlockEnabled }));
    },

    setDnsProvider: (dnsProvider) => {
      triggerHaptic('tick');
      setUi((prev) => ({ ...prev, dnsProvider }));
    },

    setWikiCvLoggedIn: (wikiCvLoggedIn) => {
      triggerHaptic('tap');
      setUi((prev) => ({ ...prev, wikiCvLoggedIn }));
    },

    exportBackupJson: () => {
      const s = uiRef.current;
      const json = JSON.stringify(
        {
          version: 1,
          exportedAt: new Date().toISOString(),
          libraryItems: s.libraryItems,
          historyItems: s.historyItems,
          pronunciationRules: s.pronunciationRules,
          settings: {
            uiTheme: s.uiTheme,
            colorMode: s.colorMode,
            monetSeed: s.monetSeed,
            selectedVoice: s.selectedVoice,
            karaokeFontSize: s.karaokeFontSize,
          },
        },
        null,
        2,
      );
      setUi((prev) => ({ ...prev, backupStatus: `Đã xuất ${s.libraryItems.length} truyện lúc ${new Date().toLocaleTimeString('vi-VN')}` }));
      return json;
    },

    importBackupJson: (jsonText) => {
      try {
        const parsed = JSON.parse(jsonText);
        if (!parsed || typeof parsed !== 'object') throw new Error('Invalid');
        setUi((prev) => ({
          ...prev,
          libraryItems: Array.isArray(parsed.libraryItems) ? parsed.libraryItems : prev.libraryItems,
          historyItems: Array.isArray(parsed.historyItems) ? parsed.historyItems : prev.historyItems,
          pronunciationRules: Array.isArray(parsed.pronunciationRules) ? parsed.pronunciationRules : prev.pronunciationRules,
          backupStatus: 'Khôi phục dữ liệu thành công!',
        }));
      } catch {
        setUi((prev) => ({ ...prev, backupStatus: 'Tệp sao lưu không hợp lệ.' }));
      }
    },

    clearError: () => setUi((prev) => ({ ...prev, errorMessage: null })),

    allStories: () => {
      const map = new Map<string, Story>();
      for (const s of uiRef.current.historyItems) map.set(s.id, s);
      for (const s of uiRef.current.libraryItems) {
        if (!map.has(s.id)) map.set(s.id, s);
      }
      return Array.from(map.values()).filter((s) => s.id !== placeholderStory.id);
    },

    historyStories: () => uiRef.current.historyItems.filter((s) => s.id !== placeholderStory.id),

    libraryStories: () => {
      const items = uiRef.current.libraryItems.filter((s) => s.id !== placeholderStory.id);
      if (uiRef.current.libFilter === 'reading') {
        const readingIds = new Set(uiRef.current.historyItems.filter((h) => h.progress > 0).map((h) => h.id));
        return items.filter((s) => s.progress > 0 || readingIds.has(s.id));
      }
      return items;
    },

    trendingStories: () =>
      [...uiRef.current.historyItems, ...uiRef.current.libraryItems]
        .filter((s, idx, arr) => s.id !== placeholderStory.id && arr.findIndex((x) => x.id === s.id) === idx)
        .sort((a, b) => (b.lastListenedAt || b.updatedAt) - (a.lastListenedAt || a.updatedAt)),
  };

  return <PlayerContext.Provider value={actions}>{children}</PlayerContext.Provider>;
};

export function usePlayer(): PlayerContextValue {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider');
  return ctx;
}
