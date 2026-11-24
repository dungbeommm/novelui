export interface BrowserSiteSession {
  domain: string;
  accountName: string;
  email: string;
  avatarUrl?: string | null;
  authMethod: 'google' | 'site';
  loggedInAt: number;
}

export interface BrowserAccountSettings {
  autoUseGoogleInBrowser: boolean;
  sessions: BrowserSiteSession[];
}

const STORAGE_KEY = 'novelbook_browser_accounts_v1';

const listeners = new Set<(state: BrowserAccountSettings) => void>();

function readBrowserAccounts(): BrowserAccountSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<BrowserAccountSettings>;
      return {
        autoUseGoogleInBrowser: parsed.autoUseGoogleInBrowser ?? true,
        sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      };
    }
  } catch {
    // ignore invalid storage
  }
  return {
    autoUseGoogleInBrowser: true,
    sessions: [],
  };
}

let cachedState: BrowserAccountSettings = readBrowserAccounts();

function persistAndNotify(next: BrowserAccountSettings) {
  cachedState = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore storage write error
  }
  listeners.forEach((cb) => cb(cachedState));
}

export function subscribeBrowserAccounts(cb: (state: BrowserAccountSettings) => void): () => void {
  listeners.add(cb);
  cb(cachedState);
  return () => {
    listeners.delete(cb);
  };
}

export function setAutoUseGoogleInBrowser(enabled: boolean): void {
  persistAndNotify({ ...cachedState, autoUseGoogleInBrowser: enabled });
}

export function loginBrowserSite(session: Omit<BrowserSiteSession, 'loggedInAt'>): void {
  const cleanDomain = session.domain.trim().toLowerCase().replace(/^www\./, '');
  if (!cleanDomain) return;
  const entry: BrowserSiteSession = {
    ...session,
    domain: cleanDomain,
    loggedInAt: Date.now(),
  };
  const filtered = cachedState.sessions.filter((s) => s.domain !== cleanDomain);
  persistAndNotify({ ...cachedState, sessions: [entry, ...filtered] });
}

export function logoutBrowserSite(domain: string): void {
  const cleanDomain = domain.trim().toLowerCase().replace(/^www\./, '');
  persistAndNotify({
    ...cachedState,
    sessions: cachedState.sessions.filter((s) => s.domain !== cleanDomain),
  });
}

export function clearAllBrowserSessions(): void {
  persistAndNotify({
    ...cachedState,
    sessions: [],
  });
}
