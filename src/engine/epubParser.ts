import JSZip from 'jszip';
import { ChapterContent, ChapterListenStatus, ChapterUiModel, EpubImportResult, Story, StorySourceType } from '../model/types';
import { CoverDefaults, StoryIds } from '../model/storyIds';

function splitIntoSentences(text: string): string[] {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return [];
  const raw = cleaned.split(/(?<=[.!?…])\s+/);
  const out: string[] = [];
  for (const part of raw) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    if (trimmed.length > 220) {
      const subParts = trimmed.split(/(?<=[,;:])\s+/);
      for (const s of subParts) {
        if (s.trim()) out.push(s.trim());
      }
    } else {
      out.push(trimmed);
    }
  }
  return out;
}

function resolveRelativePath(baseDir: string, href: string): string {
  const cleanHref = decodeURIComponent(href.split('#')[0]);
  if (!baseDir) return cleanHref.replace(/^\/+/, '');
  const stack = baseDir.split('/').filter(Boolean);
  for (const part of cleanHref.split('/')) {
    if (part === '.' || !part) continue;
    if (part === '..') stack.pop();
    else stack.push(part);
  }
  return stack.join('/');
}

export async function parseEpubFile(file: File): Promise<EpubImportResult> {
  const buffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(buffer);

  const containerFile = zip.file('META-INF/container.xml');
  if (!containerFile) {
    throw new Error('Tệp EPUB không hợp lệ (thiếu META-INF/container.xml).');
  }

  const containerXml = await containerFile.async('text');
  const parser = new DOMParser();
  const containerDoc = parser.parseFromString(containerXml, 'application/xml');
  const rootfileEl = containerDoc.querySelector('rootfile');
  const opfPath = rootfileEl?.getAttribute('full-path');
  if (!opfPath) {
    throw new Error('Không tìm thấy tệp cấu trúc OPF trong EPUB.');
  }

  const opfFile = zip.file(opfPath);
  if (!opfFile) {
    throw new Error('Không thể đọc dữ liệu mục lục OPF.');
  }

  const opfXml = await opfFile.async('text');
  const opfDoc = parser.parseFromString(opfXml, 'application/xml');
  const opfDir = opfPath.includes('/') ? opfPath.slice(0, opfPath.lastIndexOf('/')) : '';

  const titleEl = opfDoc.getElementsByTagNameNS('*', 'title')[0] ?? opfDoc.querySelector('title');
  const creatorEl = opfDoc.getElementsByTagNameNS('*', 'creator')[0] ?? opfDoc.querySelector('creator');
  const title = titleEl?.textContent?.trim() || file.name.replace(/\.epub$/i, '');
  const author = creatorEl?.textContent?.trim() || 'Không rõ tác giả';

  const manifestItems = new Map<string, { href: string; mediaType: string; properties: string }>();
  const itemEls = Array.from(opfDoc.querySelectorAll('manifest > item'));
  for (const el of itemEls) {
    const id = el.getAttribute('id');
    const href = el.getAttribute('href');
    if (id && href) {
      manifestItems.set(id, {
        href,
        mediaType: el.getAttribute('media-type') || '',
        properties: el.getAttribute('properties') || '',
      });
    }
  }

  // Try extracting cover image as data URL
  let coverUrl = '';
  let coverId = '';
  const metaCover = Array.from(opfDoc.querySelectorAll('meta')).find(
    (m) => m.getAttribute('name') === 'cover',
  );
  if (metaCover) coverId = metaCover.getAttribute('content') || '';
  if (!coverId) {
    for (const [id, info] of manifestItems.entries()) {
      if (info.properties.includes('cover-image') || (id.toLowerCase().includes('cover') && info.mediaType.startsWith('image/'))) {
        coverId = id;
        break;
      }
    }
  }
  if (coverId && manifestItems.has(coverId)) {
    const coverEntry = manifestItems.get(coverId)!;
    const resolvedCover = resolveRelativePath(opfDir, coverEntry.href);
    const coverZipFile = zip.file(resolvedCover);
    if (coverZipFile) {
      const b64 = await coverZipFile.async('base64');
      const mime = coverEntry.mediaType || 'image/jpeg';
      coverUrl = `data:${mime};base64,${b64}`;
    }
  }

  const spineRefs = Array.from(opfDoc.querySelectorAll('spine > itemref'))
    .map((el) => el.getAttribute('idref'))
    .filter((id): id is string => Boolean(id));

  const chapters: ChapterContent[] = [];
  let idx = 1;
  for (const idref of spineRefs) {
    const item = manifestItems.get(idref);
    if (!item) continue;
    if (!item.mediaType.includes('html') && !item.href.match(/\.(x?html?|htm)$/i)) continue;
    const resolvedPath = resolveRelativePath(opfDir, item.href);
    const chapterZip = zip.file(resolvedPath);
    if (!chapterZip) continue;
    const html = await chapterZip.async('text');
    const doc = parser.parseFromString(html, 'text/html');
    doc.querySelectorAll('script, style, nav').forEach((n) => n.remove());

    const heading = doc.querySelector('h1, h2, h3, title')?.textContent?.trim();
    const bodyText = doc.body?.textContent || '';
    const sentences = splitIntoSentences(bodyText);
    if (sentences.length === 0) continue;

    chapters.push({
      index: idx,
      title: heading && heading.length < 120 ? heading : `Chương ${idx}`,
      url: `epub://${resolvedPath}`,
      sentences,
    });
    idx++;
  }

  if (chapters.length === 0) {
    throw new Error('Không tìm thấy nội dung văn bản trong tệp EPUB này.');
  }

  const storyId = `epub-${StoryIds.simpleHash(`${file.name}:${file.size}:${title}`)}`;
  const finalCover = coverUrl || CoverDefaults.forKey(storyId);
  const firstChapter = chapters[0];

  const story: Story = {
    id: storyId,
    title,
    author,
    coverUrl: finalCover,
    totalChapters: chapters.length,
    tags: ['EPUB'],
    color: CoverDefaults.colorForKey(storyId),
    currentChapter: 1,
    source: 'EPUB ngoại tuyến',
    sourceType: StorySourceType.EPUB,
    localBookId: storyId,
    localFileName: file.name,
    fileSizeBytes: file.size,
    storyUrl: `epub://${storyId}`,
    chapterUrl: firstChapter.url,
    chapterTitle: firstChapter.title,
    sentenceIndex: 0,
    sentenceCount: firstChapter.sentences.length,
    progress: 0,
    positionMs: 0,
    updatedAt: Date.now(),
    lastListenedAt: 0,
    mirrorUrls: [],
    chapters,
  };

  const chapterModels: ChapterUiModel[] = chapters.map((ch) => ({
    index: ch.index,
    title: ch.title,
    url: ch.url,
    chapterId: StoryIds.chapterId(ch.url, ch.index),
    status: ChapterListenStatus.UNPLAYED,
    progress: 0,
    isCurrent: ch.index === 1,
    lastListenedAt: 0,
  }));

  return { story, chapters: chapterModels };
}
