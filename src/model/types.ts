export enum StorySourceType {
  ONLINE = 'ONLINE',
  EPUB = 'EPUB',
}

export enum Tab {
  HOME = 'HOME',
  LIBRARY = 'LIBRARY',
  SEARCH = 'SEARCH',
  SETTINGS = 'SETTINGS',
}

export enum UiTheme {
  DARK = 'DARK',
  LIGHT = 'LIGHT',
  SYSTEM = 'SYSTEM',
}

export enum ColorMode {
  SYSTEM_WALLPAPER = 'SYSTEM_WALLPAPER',
  CUSTOM_SEED = 'CUSTOM_SEED',
  COVER_ART = 'COVER_ART',
}

export enum FrameRateMode {
  AUTO = 'AUTO',
  FPS_60 = 'FPS_60',
  FPS_90 = 'FPS_90',
  FPS_120 = 'FPS_120',
}

export enum SleepMode {
  OFF = 'OFF',
  MINUTES = 'MINUTES',
  END_SENTENCE = 'END_SENTENCE',
  END_CHAPTER = 'END_CHAPTER',
}

export enum ChapterListenStatus {
  UNPLAYED = 'UNPLAYED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export enum ChapterFilter {
  ALL = 'ALL',
  LISTENING = 'LISTENING',
  HEARD = 'HEARD',
}

export interface ChapterContent {
  index: number;
  title: string;
  url: string;
  sentences: string[];
}

export interface Story {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  totalChapters: number;
  tags: string[];
  color: string;
  currentChapter: number;
  source?: string;
  sourceType: StorySourceType;
  localBookId?: string;
  localFileName?: string;
  fileSizeBytes?: number;
  storyUrl?: string;
  chapterUrl?: string;
  nextUrl?: string;
  prevUrl?: string;
  chapterTitle: string;
  sentenceIndex: number;
  sentenceCount: number;
  progress: number;
  positionMs: number;
  updatedAt: number;
  lastListenedAt: number;
  mirrorUrls: string[];
  chapters?: ChapterContent[];
}

export interface VoiceOption {
  id: string;
  label: string;
  sub: string;
  provider: string;
  language: string;
  gender: string;
}

export interface VoiceGroup {
  name: string;
  voices: VoiceOption[];
}

export interface VoiceModelPackage {
  id: string;
  name: string;
  modelType: 'PIPER' | 'VITS' | 'SHERPA' | 'KOKORO';
  language: string;
  gender: string;
  speakerCount: number;
  catalogSpeakerNames: string[];
  sizeBytes: number;
  description: string;
  installed: boolean;
  progress?: number | null;
}

export interface Suggestion {
  label: string;
  url: string;
}

export interface PronunciationRule {
  id: string;
  from: string;
  to: string;
  storyId?: string | null;
}

export interface WebSearchHit {
  title: string;
  url: string;
  author: string;
  coverUrl: string;
  source: string;
  score: number;
  exact: boolean;
  matchLabel: string;
  mirrors: string[];
}

export interface ChapterUiModel {
  index: number;
  title: string;
  url: string;
  chapterId: string;
  status: ChapterListenStatus;
  progress: number;
  isCurrent: boolean;
  lastListenedAt: number;
}

export interface PlaybackMetadata {
  storyId: string;
  storyTitle: string;
  author: string;
  chapterTitle: string;
  chapterIndex: number;
  totalChapters: number;
  coverUrl: string;
  source?: string;
  positionMs: number;
  durationMs: number;
  speed: number;
  voiceId: string;
  isPlaying: boolean;
  isBuffering: boolean;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface PasteResult {
  story: Story;
  source: string;
}

export interface EpubImportResult {
  story: Story;
  chapters: ChapterUiModel[];
}

export interface PasteState {
  url: string;
  analyzing: boolean;
  step: number;
  result: PasteResult | null;
  clipErr: boolean;
  error: string | null;
}

export interface EpubImportState {
  importing: boolean;
  fileName: string;
  result: EpubImportResult | null;
  error: string | null;
}

export interface TtsSourceUi {
  key: string;
  name: string;
  voices: number;
  configured: boolean;
  enabled: boolean;
}

export type PlayerSheetType = 'chapters' | 'speed' | 'voice' | 'reading' | null;

export interface UiState {
  currentTab: Tab;
  tabHistory: Tab[];
  uiTheme: UiTheme;
  colorMode: ColorMode;
  monetSeed: string;
  accentColor: string;
  selectedVoice: string;
  geminiApiKey: string;
  geminiKeyChecking: boolean;
  geminiKeyOk: boolean;
  geminiKeyStatus: string | null;
  zaloApiKey: string;
  zaloKeyChecking: boolean;
  zaloKeyOk: boolean;
  zaloKeyStatus: string | null;
  voiceActionStatus: string | null;
  autoNextChapter: boolean;
  karaokeFontSize: number;
  playerVolume: number;
  frameRateMode: FrameRateMode;
  playerBlur: number;
  hapticEnabled: boolean;
  hapticIntensity: number;
  voiceProfileEnabled: boolean;
  contentLanguage: string;
  contentExtractionMode: string;
  disabledTtsSources: string[];
  ttsSources: TtsSourceUi[];
  pronunciationRules: PronunciationRule[];
  backupStatus: string | null;
  libFilter: 'all' | 'reading';
  chapterFilter: ChapterFilter;
  historyItems: Story[];
  libraryItems: Story[];
  searchQuery: string;
  webResults: WebSearchHit[];
  webSuggestions: WebSearchHit[];
  webSuggestionsSource: string;
  webSuggestionsLoading: boolean;
  webSuggestionsError: string | null;
  webSearchSources: string[];
  selectedWebSearchSource: string;
  webSearching: boolean;
  webError: string | null;
  webOpeningUrl: string | null;
  webSearchedQuery: string;
  webSearchedSource: string;
  webSitesSearched: number;
  voiceGroups: VoiceGroup[];
  activeStory: Story | null;
  chapterNumber: number;
  chapterTitle: string;
  isPlayerOpen: boolean;
  hiddenMiniPlayerStoryId: string | null;
  isKaraoke: boolean;
  isPlaying: boolean;
  isBuffering: boolean;
  ttsProvider: string;
  errorMessage: string | null;
  chapterLoadError: string | null;
  progress: number;
  positionMs: number;
  durationMs: number;
  speed: number;
  pitch: number;
  loop: boolean;
  sleepTimer: number | null;
  sleepMode: SleepMode;
  sentences: string[];
  activeSentenceIndex: number;
  tocUrls: string[];
  tocTitles: string[];
  chapterItems: ChapterUiModel[];
  playback: PlaybackMetadata;
  sheet: PlayerSheetType;
  storyToDelete: Story | null;
  pasteOpen: boolean;
  paste: PasteState;
  epubImport: EpubImportState;
  adBlockEnabled: boolean;
  dnsProvider: 'SYSTEM' | 'CLOUDFLARE' | 'GOOGLE' | 'ADGUARD';
  wikiCvLoggedIn: boolean;
}
