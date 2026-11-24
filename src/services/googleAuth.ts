import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
] as const;

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
for (const scope of SCOPES) {
  provider.addScope(scope);
}
provider.setCustomParameters({
  prompt: 'select_account',
});

// Access token cached strictly in memory (never localStorage/sessionStorage).
let cachedAccessToken: string | null = null;
let cachedProfilePhoto: string | null = null;
let isSigningIn = false;

export interface GoogleAuthSnapshot {
  user: User | null;
  photoURL: string | null;
  hasDriveToken: boolean;
  ready: boolean;
}

const listeners = new Set<(snap: GoogleAuthSnapshot) => void>();
let currentUser: User | null = auth.currentUser;
let authReady = false;

function buildSnapshot(): GoogleAuthSnapshot {
  return {
    user: currentUser,
    photoURL: cachedProfilePhoto || currentUser?.photoURL || null,
    hasDriveToken: Boolean(cachedAccessToken),
    ready: authReady,
  };
}

function notifyListeners() {
  const snap = buildSnapshot();
  listeners.forEach((cb) => cb(snap));
}

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  authReady = true;
  if (!user) {
    cachedAccessToken = null;
    cachedProfilePhoto = null;
  } else if (!cachedAccessToken && !isSigningIn) {
    // Token is memory-only across page reloads; user can refresh Drive access with one tap.
    cachedAccessToken = null;
  }
  notifyListeners();
});

export function subscribeGoogleAuth(cb: (snap: GoogleAuthSnapshot) => void): () => void {
  listeners.add(cb);
  cb(buildSnapshot());
  return () => {
    listeners.delete(cb);
  };
}

export async function signInWithGoogle(): Promise<{ user: User; accessToken: string; photoURL: string | null }> {
  isSigningIn = true;
  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Không lấy được mã truy cập Google từ phiên đăng nhập.');
    }
    cachedAccessToken = credential.accessToken;
    currentUser = result.user;

    let resolvedPhoto = result.user.photoURL || null;
    if (!resolvedPhoto) {
      try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${cachedAccessToken}` },
        });
        if (res.ok) {
          const info = (await res.json()) as { picture?: string };
          if (info.picture) resolvedPhoto = info.picture;
        }
      } catch {
        // fallback to firebase photoURL if available
      }
    }
    cachedProfilePhoto = resolvedPhoto;
    notifyListeners();
    return { user: result.user, accessToken: cachedAccessToken, photoURL: resolvedPhoto };
  } finally {
    isSigningIn = false;
  }
}

export async function signOutGoogle(): Promise<void> {
  cachedAccessToken = null;
  cachedProfilePhoto = null;
  await signOut(auth);
  currentUser = null;
  notifyListeners();
}

export function getGoogleAccessToken(): string | null {
  return cachedAccessToken;
}
