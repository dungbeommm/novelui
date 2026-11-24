export const CoverDefaults = {
  covers: [
    '/covers/nr_cover_01.webp',
    '/covers/nr_cover_02.webp',
    '/covers/nr_cover_03.webp',
    '/covers/nr_cover_04.webp',
    '/covers/nr_cover_05.webp',
    '/covers/nr_cover_06.webp',
    '/covers/nr_cover_07.webp',
    '/covers/nr_cover_08.webp',
    '/covers/nr_cover_09.webp',
    '/covers/nr_cover_10.webp',
  ],
  coverColors: [
    '#B3AAA0',
    '#49261B',
    '#7E6047',
    '#1F1F1F',
    '#575757',
    '#796056',
    '#746C63',
    '#544644',
    '#788551',
    '#554644',
  ],
  index(key: string): number {
    const s = key.trim() || 'novelreader';
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
      hash = (hash * 31 + s.charCodeAt(i)) | 0;
    }
    return Math.abs(hash) % this.covers.length;
  },
  forKey(key: string): string {
    return this.covers[this.index(key)];
  },
  colorForKey(key: string): string {
    return this.coverColors[this.index(key)];
  },
};

export const StoryIds = {
  normalizeUrl(raw?: string | null): string {
    if (!raw || !raw.trim()) return '';
    const trimmed = raw.trim();
    if (trimmed.startsWith('epub://')) return trimmed.replace(/\/+$/, '');
    try {
      const u = new URL(trimmed);
      const host = u.hostname.toLowerCase().replace(/^www\./, '');
      const path = u.pathname.replace(/\/+$/, '') || '/';
      return `${u.protocol.toLowerCase()}//${host}${path}`;
    } catch {
      return trimmed.split('#')[0].split('?')[0].replace(/\/+$/, '');
    }
  },
  hostOf(url?: string | null): string {
    if (!url) return '';
    try {
      return new URL(url).hostname.toLowerCase().replace(/^www\./, '');
    } catch {
      return '';
    }
  },
  sourceLabel(url?: string | null): string {
    const h = this.hostOf(url);
    if (h.includes('metruyenchu')) return 'Mê Truyện Chữ';
    if (h.includes('wikicv')) return 'Wikicv';
    if (h.includes('truyenfull')) return 'TruyệnFull';
    if (!h) return 'Nguồn';
    return h;
  },
  isAllowedUrl(raw: string): boolean {
    const s = raw.trim();
    if (!s) return false;
    try {
      const u = new URL(s);
      return (u.protocol === 'https:' || u.protocol === 'http:') && u.hostname.includes('.');
    } catch {
      return false;
    }
  },
  simpleHash(str: string): string {
    let h1 = 0xdeadbeef;
    let h2 = 0x41c6ce57;
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return ((4294967296 * (2097151 & h2) + (h1 >>> 0))).toString(16).slice(0, 16);
  },
  storyId(url: string): string {
    const norm = this.normalizeUrl(url);
    return norm ? `story:${this.simpleHash(norm)}` : `story:${this.simpleHash(url)}`;
  },
  chapterId(url: string | undefined, index: number): string {
    const norm = this.normalizeUrl(url);
    return norm ? `ch:${this.simpleHash(norm)}` : `ch:idx:${index}`;
  },
};
