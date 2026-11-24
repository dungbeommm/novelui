import { ColorMode, UiTheme } from '../model/types';

export interface MaterialColorScheme {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  background: string;
  surface: string;
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  surfaceVariant: string;
  onSurface: string;
  onSurfaceVariant: string;
  outline: string;
  outlineVariant: string;
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;
  isDark: boolean;
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '').trim();
  const full = clean.length === 3
    ? clean.split('').map((c) => c + c).join('')
    : clean.length === 8
      ? clean.slice(2)
      : clean;
  const num = parseInt(full, 16);
  if (Number.isNaN(num)) return [149, 117, 205];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0);
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      default:
        h = (rn - gn) / d + 4;
        break;
    }
    h /= 6;
  }
  return [h * 360, s * 100, l * 100];
}

function hslToHex(h: number, s: number, l: number): string {
  const hn = (((h % 360) + 360) % 360) / 360;
  const sn = clamp(s, 0, 100) / 100;
  const ln = clamp(l, 0, 100) / 100;
  const hue2rgb = (p: number, q: number, t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  let r: number;
  let g: number;
  let b: number;
  if (sn === 0) {
    r = g = b = ln;
  } else {
    const q = ln < 0.5 ? ln * (1 + sn) : ln + sn - ln * sn;
    const p = 2 * ln - q;
    r = hue2rgb(p, q, hn + 1 / 3);
    g = hue2rgb(p, q, hn);
    b = hue2rgb(p, q, hn - 1 / 3);
  }
  const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export const SYSTEM_WALLPAPER_SEED = '#426598';

/** Generates a Material 3 TonalSpot color scheme from a single seed hex color. */
export function buildTonalSpotScheme(seedHex: string, isDark: boolean): MaterialColorScheme {
  const [r, g, b] = hexToRgb(seedHex);
  const [h, s] = rgbToHsl(r, g, b);
  const primarySat = clamp(s < 12 ? 32 : Math.max(s, 42), 32, 74);
  const secHue = h;
  const secSat = clamp(primarySat * 0.36, 16, 30);
  const tertHue = (h + 60) % 360;
  const tertSat = clamp(primarySat * 0.48, 22, 42);
  const neuHue = h;
  const neuSat = clamp(primarySat * 0.16, 8, 16);
  const neuVarSat = clamp(primarySat * 0.24, 12, 22);

  if (isDark) {
    return {
      primary: hslToHex(h, primarySat, 78),
      onPrimary: hslToHex(h, primarySat, 20),
      primaryContainer: hslToHex(h, primarySat * 0.78, 30),
      onPrimaryContainer: hslToHex(h, primarySat, 90),
      secondary: hslToHex(secHue, secSat, 78),
      onSecondary: hslToHex(secHue, secSat, 20),
      secondaryContainer: hslToHex(secHue, secSat * 0.9, 28),
      onSecondaryContainer: hslToHex(secHue, secSat, 90),
      tertiary: hslToHex(tertHue, tertSat, 78),
      onTertiary: hslToHex(tertHue, tertSat, 20),
      tertiaryContainer: hslToHex(tertHue, tertSat * 0.8, 28),
      onTertiaryContainer: hslToHex(tertHue, tertSat, 90),
      background: hslToHex(neuHue, neuSat, 8),
      surface: hslToHex(neuHue, neuSat, 8),
      surfaceContainerLowest: hslToHex(neuHue, neuSat, 5),
      surfaceContainerLow: hslToHex(neuHue, neuSat, 11),
      surfaceContainer: hslToHex(neuHue, neuSat, 13.5),
      surfaceContainerHigh: hslToHex(neuHue, neuSat, 17),
      surfaceContainerHighest: hslToHex(neuHue, neuSat, 22),
      surfaceVariant: hslToHex(neuHue, neuVarSat, 26),
      onSurface: hslToHex(neuHue, neuSat, 91),
      onSurfaceVariant: hslToHex(neuHue, neuVarSat, 76),
      outline: hslToHex(neuHue, neuVarSat, 56),
      outlineVariant: hslToHex(neuHue, neuVarSat, 28),
      error: '#ffb4ab',
      onError: '#690005',
      errorContainer: '#93000a',
      onErrorContainer: '#ffdad6',
      isDark: true,
    };
  }

  return {
    primary: hslToHex(h, primarySat, 40),
    onPrimary: '#ffffff',
    primaryContainer: hslToHex(h, clamp(primarySat * 1.15, 45, 92), 91),
    onPrimaryContainer: hslToHex(h, primarySat, 14),
    secondary: hslToHex(secHue, secSat, 38),
    onSecondary: '#ffffff',
    secondaryContainer: hslToHex(secHue, clamp(secSat * 1.1, 20, 44), 90),
    onSecondaryContainer: hslToHex(secHue, secSat, 14),
    tertiary: hslToHex(tertHue, tertSat, 40),
    onTertiary: '#ffffff',
    tertiaryContainer: hslToHex(tertHue, tertSat * 0.85, 90),
    onTertiaryContainer: hslToHex(tertHue, tertSat, 14),
    background: hslToHex(neuHue, neuSat, 98.5),
    surface: hslToHex(neuHue, neuSat, 98.5),
    surfaceContainerLowest: '#ffffff',
    surfaceContainerLow: hslToHex(neuHue, clamp(neuSat * 1.5, 14, 28), 95.5),
    surfaceContainer: hslToHex(neuHue, clamp(neuSat * 1.4, 14, 26), 93.5),
    surfaceContainerHigh: hslToHex(neuHue, clamp(neuSat * 1.4, 14, 26), 91),
    surfaceContainerHighest: hslToHex(neuHue, clamp(neuSat * 1.3, 14, 24), 88.5),
    surfaceVariant: hslToHex(neuHue, neuVarSat, 89),
    onSurface: hslToHex(neuHue, neuSat, 12),
    onSurfaceVariant: hslToHex(neuHue, neuVarSat, 32),
    outline: hslToHex(neuHue, neuVarSat, 48),
    outlineVariant: hslToHex(neuHue, neuVarSat, 79),
    error: '#ba1a1a',
    onError: '#ffffff',
    errorContainer: '#ffdad6',
    onErrorContainer: '#410002',
    isDark: false,
  };
}

export function resolveDarkMode(uiTheme: UiTheme, systemDark: boolean): boolean {
  if (uiTheme === UiTheme.DARK) return true;
  if (uiTheme === UiTheme.LIGHT) return false;
  return systemDark;
}

export function resolveSeedColor(
  colorMode: ColorMode,
  customSeedHex: string,
  coverSeedHex?: string | null,
): string {
  if (colorMode === ColorMode.COVER_ART && coverSeedHex) return coverSeedHex;
  if (colorMode === ColorMode.CUSTOM_SEED) return customSeedHex;
  return SYSTEM_WALLPAPER_SEED;
}

export function applyThemeCssVars(scheme: MaterialColorScheme): void {
  const root = document.documentElement;
  root.style.setProperty('--md-primary', scheme.primary);
  root.style.setProperty('--md-on-primary', scheme.onPrimary);
  root.style.setProperty('--md-primary-container', scheme.primaryContainer);
  root.style.setProperty('--md-on-primary-container', scheme.onPrimaryContainer);
  root.style.setProperty('--md-secondary', scheme.secondary);
  root.style.setProperty('--md-on-secondary', scheme.onSecondary);
  root.style.setProperty('--md-secondary-container', scheme.secondaryContainer);
  root.style.setProperty('--md-on-secondary-container', scheme.onSecondaryContainer);
  root.style.setProperty('--md-tertiary', scheme.tertiary);
  root.style.setProperty('--md-on-tertiary', scheme.onTertiary);
  root.style.setProperty('--md-tertiary-container', scheme.tertiaryContainer);
  root.style.setProperty('--md-on-tertiary-container', scheme.onTertiaryContainer);
  root.style.setProperty('--md-surface', scheme.surface);
  root.style.setProperty('--md-surface-container-lowest', scheme.surfaceContainerLowest);
  root.style.setProperty('--md-surface-container-low', scheme.surfaceContainerLow);
  root.style.setProperty('--md-surface-container', scheme.surfaceContainer);
  root.style.setProperty('--md-surface-container-high', scheme.surfaceContainerHigh);
  root.style.setProperty('--md-surface-container-highest', scheme.surfaceContainerHighest);
  root.style.setProperty('--md-surface-variant', scheme.surfaceVariant);
  root.style.setProperty('--md-on-surface', scheme.onSurface);
  root.style.setProperty('--md-on-surface-variant', scheme.onSurfaceVariant);
  root.style.setProperty('--md-outline', scheme.outline);
  root.style.setProperty('--md-outline-variant', scheme.outlineVariant);
  root.style.setProperty('--md-error', scheme.error);
  root.style.setProperty('--md-on-error', scheme.onError);
  root.style.setProperty('--md-error-container', scheme.errorContainer);
  root.style.setProperty('--md-on-error-container', scheme.onErrorContainer);
  root.classList.toggle('dark', scheme.isDark);
}

const coverColorCache = new Map<string, string>();

export async function extractCoverSeedColor(imageUrl: string | undefined, fallback: string): Promise<string> {
  if (!imageUrl) return fallback;
  const cached = coverColorCache.get(imageUrl);
  if (cached) return cached;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 24;
        canvas.height = 24;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(fallback);
          return;
        }
        ctx.drawImage(img, 0, 0, 24, 24);
        const data = ctx.getImageData(0, 0, 24, 24).data;
        let r = 0;
        let g = 0;
        let b = 0;
        let count = 0;
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] < 128) continue;
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          count++;
        }
        if (count === 0) {
          resolve(fallback);
          return;
        }
        const hex = `#${[r / count, g / count, b / count]
          .map((c) => clamp(Math.round(c), 0, 255).toString(16).padStart(2, '0'))
          .join('')}`;
        if (coverColorCache.size > 24) coverColorCache.clear();
        coverColorCache.set(imageUrl, hex);
        resolve(hex);
      } catch {
        resolve(fallback);
      }
    };
    img.onerror = () => resolve(fallback);
    img.src = imageUrl;
  });
}
