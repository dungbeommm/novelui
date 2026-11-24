import React, { useMemo, useRef, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Download,
  Info,
  Play,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { VoiceModelPackage, VoiceOption } from '../model/types';
import { usePlayer } from '../state/usePlayerStore';

const ALL = 'Tất cả';
const INSTALLED = 'Đã cài';
const DOWNLOADABLE = 'Có thể tải';
const SERVICES = 'Nguồn giọng khác';

interface VoiceVariant {
  name: string;
  label: string;
  tool: string;
  language: string;
  gender: string;
  key: string;
  voice?: VoiceOption;
  model?: VoiceModelPackage;
  availability: string;
}

function languageLabel(lang: string): string {
  const code = lang.toLowerCase().split('-')[0];
  if (code === 'vi' || code === 'vie') return 'Tiếng Việt';
  if (code === 'en' || code === 'eng') return 'Tiếng Anh';
  if (code === 'zh' || code === 'cmn') return 'Tiếng Trung';
  if (code === 'ja' || code === 'jpn') return 'Tiếng Nhật';
  return lang || 'Khác';
}

function genderLabel(g: string): string {
  const up = g.toUpperCase();
  if (up === 'MALE') return 'Nam';
  if (up === 'FEMALE') return 'Nữ';
  if (up === 'NEUTRAL') return 'Trung tính';
  if (up === 'MULTI') return 'Nhiều giọng';
  return 'Khác';
}

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

export const VoiceManagerPage: React.FC<{ onOpenClone: () => void }> = ({ onOpenClone }) => {
  const { ui, scheme, voiceModels, setVoice, previewVoice, updateVoiceModel } = usePlayer();

  const [query, setQuery] = useState('');
  const [language, setLanguage] = useState(ALL);
  const [tool, setTool] = useState(ALL);
  const [gender, setGender] = useState(ALL);
  const [availability, setAvailability] = useState(ALL);
  const [singleOnly, setSingleOnly] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [deleteModel, setDeleteModel] = useState<VoiceModelPackage | null>(null);

  const bottomInset = 32;

  const groups = useMemo(() => {
    const modelVariants: VoiceVariant[] = voiceModels.flatMap((m) =>
      m.catalogSpeakerNames.map((speaker, idx) => ({
        name: speaker,
        label: m.speakerCount > 1 ? `${m.modelType} · ${m.name}` : m.modelType,
        tool: m.modelType,
        language: m.language,
        gender: m.gender,
        key: `vbook:${m.id}:${idx}`,
        voice: m.installed
          ? {
              id: `vbook:${m.id}:${idx}`,
              label: `${m.name} · ${speaker}`,
              sub: `${m.modelType} · Ngoại tuyến`,
              provider: m.modelType,
              language: m.language,
              gender: m.gender,
            }
          : undefined,
        model: m,
        availability: m.installed ? INSTALLED : DOWNLOADABLE,
      })),
    );

    const serviceVariants: VoiceVariant[] = ui.voiceGroups
      .flatMap((g) => g.voices)
      .map((v) => ({
        name: v.label,
        label: v.provider,
        tool: v.provider,
        language: v.language,
        gender: v.gender,
        key: v.id,
        voice: v,
        availability: SERVICES,
      }));

    const map = new Map<string, { key: string; name: string; variants: VoiceVariant[] }>();
    for (const v of [...modelVariants, ...serviceVariants]) {
      const k = v.name.trim().toLowerCase();
      const entry = map.get(k);
      if (entry) entry.variants.push(v);
      else map.set(k, { key: k, name: v.name, variants: [v] });
    }

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  }, [voiceModels, ui.voiceGroups]);

  const allVariants = groups.flatMap((g) => g.variants);
  const langOptions = [ALL, ...Array.from(new Set(allVariants.map((v) => languageLabel(v.language)))).sort()];
  const toolOptions = [ALL, ...Array.from(new Set(allVariants.map((v) => v.tool))).sort()];
  const genderOptions = [ALL, ...Array.from(new Set(allVariants.map((v) => genderLabel(v.gender)))).sort()];

  const visible = groups
    .map((g) => {
      const q = query.trim().toLowerCase();
      const filtered = g.variants.filter((v) => {
        if (language !== ALL && languageLabel(v.language) !== language) return false;
        if (tool !== ALL && v.tool !== tool) return false;
        if (gender !== ALL && genderLabel(v.gender) !== gender) return false;
        if (availability !== ALL && v.availability !== availability) return false;
        if (singleOnly && v.availability === DOWNLOADABLE && (v.model?.speakerCount ?? 1) > 1) return false;
        if (q && !`${g.name} ${v.label} ${v.model?.description ?? ''}`.toLowerCase().includes(q)) return false;
        return true;
      });
      return filtered.length > 0 ? { ...g, variants: filtered } : null;
    })
    .filter((g): g is NonNullable<typeof g> => Boolean(g));

  const sections: Record<string, typeof visible> = {
    [INSTALLED]: visible.filter((g) => g.variants.some((v) => v.availability === INSTALLED)),
    [DOWNLOADABLE]: visible.filter(
      (g) => !g.variants.some((v) => v.availability === INSTALLED) && g.variants.some((v) => v.availability === DOWNLOADABLE),
    ),
    [SERVICES]: visible.filter((g) => g.variants.every((v) => v.availability === SERVICES)),
  };

  return (
    <div className="flex-1 overflow-y-auto thin-scrollbar px-5 pt-2" style={{ paddingBottom: bottomInset }}>

      {/* Search */}
      <div
        className="h-12 rounded-full px-4 flex items-center gap-2.5 mb-3"
        style={{ backgroundColor: scheme.surfaceContainerHigh }}
      >
        <Search className="w-4 h-4 shrink-0" style={{ color: scheme.onSurfaceVariant }} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={groups.length === 0 ? 'Tìm giọng đọc' : `Tìm trong ${groups.length} giọng đọc`}
          className="flex-1 bg-transparent outline-none text-sm"
        />
        {query && (
          <button type="button" onClick={() => setQuery('')} className="p-1 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
        <FilterSelect label="Ngôn ngữ" value={language} options={langOptions} onChange={setLanguage} />
        <FilterSelect label="Công cụ" value={tool} options={toolOptions} onChange={setTool} />
        <FilterSelect label="Giới tính" value={gender} options={genderOptions} onChange={setGender} />
        <FilterSelect
          label="Trạng thái"
          value={availability}
          options={[ALL, INSTALLED, DOWNLOADABLE, SERVICES]}
          onChange={setAvailability}
        />
      </div>

      <div className="flex flex-wrap gap-2 mt-1 mb-4">
        {[
          { label: 'Tải một giọng', val: true },
          { label: 'Hiện cả gói dùng chung', val: false },
        ].map((item) => {
          const selected = singleOnly === item.val;
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => setSingleOnly(item.val)}
              className="px-3.5 py-1.5 rounded-full text-xs font-medium border cursor-pointer"
              style={{
                backgroundColor: selected ? scheme.secondaryContainer : 'transparent',
                color: selected ? scheme.onSecondaryContainer : scheme.onSurfaceVariant,
                borderColor: selected ? 'transparent' : scheme.outlineVariant,
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Voice Clone Banner */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2.5">
          <span className="text-lg font-bold" style={{ color: scheme.primary }}>
            Giọng của tôi
          </span>
          <span
            className="px-3 py-0.5 rounded-full text-xs font-medium"
            style={{ backgroundColor: scheme.secondaryContainer, color: scheme.onSecondaryContainer }}
          >
            0
          </span>
        </div>
        <button
          type="button"
          onClick={onOpenClone}
          className="w-full rounded-[20px] p-3.5 flex items-center text-left cursor-pointer transition active:scale-[0.99]"
          style={{ backgroundColor: scheme.tertiaryContainer, color: scheme.onTertiaryContainer }}
        >
          <div
            className="w-[46px] h-[46px] rounded-[15px] rounded-br-[4px] flex items-center justify-center shrink-0"
            style={{ backgroundColor: scheme.tertiary, color: scheme.onTertiary }}
          >
            <Plus className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0 px-3.5">
            <div className="text-[15px] font-semibold">Tạo giọng từ bản ghi</div>
            <div className="text-xs opacity-85">Chọn một đoạn ghi âm làm mẫu</div>
          </div>
          <ChevronRight className="w-5 h-5 shrink-0" />
        </button>
      </div>

      {/* Sections */}
      {[INSTALLED, DOWNLOADABLE, SERVICES].map((sec) => {
        const list = sections[sec] || [];
        if (list.length === 0) return null;
        return (
          <div key={sec} className="mb-4 space-y-2">
            <div className="flex items-center gap-2 pt-2">
              <span className="text-lg font-bold" style={{ color: scheme.primary }}>
                {sec}
              </span>
              <span
                className="px-3 py-0.5 rounded-full text-xs font-medium"
                style={{ backgroundColor: scheme.secondaryContainer, color: scheme.onSecondaryContainer }}
              >
                {list.length}
              </span>
            </div>

            {list.map((g, idx) => {
              const defaultOpen =
                (sec === INSTALLED && idx === 0) ||
                g.variants.some((v) => v.key === ui.selectedVoice) ||
                query.trim().length > 0;
              const open = defaultOpen !== expandedKeys.includes(g.key);
              const initials = g.name
                .split(/\s+/)
                .slice(0, 2)
                .map((w) => w[0])
                .join('')
                .toUpperCase();

              return (
                <div
                  key={g.key}
                  className="rounded-[18px] overflow-hidden"
                  style={{ backgroundColor: open ? scheme.surfaceContainerHigh : scheme.surfaceContainerLow }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedKeys((prev) =>
                        prev.includes(g.key) ? prev.filter((k) => k !== g.key) : [...prev, g.key],
                      )
                    }
                    className="w-full p-3 flex items-center gap-3 text-left cursor-pointer"
                  >
                    <div
                      className="w-[46px] h-[46px] rounded-[15px] rounded-br-[4px] flex items-center justify-center font-bold text-sm shrink-0"
                      style={{ backgroundColor: scheme.secondaryContainer, color: scheme.onSecondaryContainer }}
                    >
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[15px] font-bold truncate">{g.name}</div>
                      <div className="text-xs truncate" style={{ color: scheme.onSurfaceVariant }}>
                        {g.variants.length} phiên bản · {Array.from(new Set(g.variants.map((v) => v.tool))).join(', ')}
                      </div>
                    </div>
                    {open ? (
                      <ChevronUp className="w-5 h-5" style={{ color: scheme.primary }} />
                    ) : (
                      <ChevronDown className="w-5 h-5" style={{ color: scheme.primary }} />
                    )}
                  </button>

                  {open && (
                    <div className="px-2.5 pb-2 space-y-1">
                      {g.variants.map((v) => {
                        const current = v.voice?.id === ui.selectedVoice;
                        return (
                          <div
                            key={v.key}
                            className="pt-2 border-t flex items-center gap-2"
                            style={{ borderColor: `${scheme.outlineVariant}8c` }}
                          >
                            <button
                              type="button"
                              disabled={!v.voice}
                              onClick={() => v.voice && previewVoice(v.voice.id)}
                              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 disabled:opacity-40 cursor-pointer"
                              style={{ backgroundColor: scheme.secondaryContainer, color: scheme.onSecondaryContainer }}
                              aria-label="Nghe thử"
                            >
                              <Play className="w-4 h-4 fill-current ml-0.5" />
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">{v.label}</div>
                              <div className="text-xs truncate" style={{ color: scheme.onSurfaceVariant }}>
                                {[
                                  languageLabel(v.language),
                                  v.model ? formatSize(v.model.sizeBytes) : null,
                                  v.model && v.model.speakerCount > 1 ? `Gói ${v.model.speakerCount} giọng` : null,
                                  current ? 'Đang dùng' : null,
                                ]
                                  .filter(Boolean)
                                  .join(' · ')}
                              </div>
                            </div>
                            {v.voice && (
                              <button
                                type="button"
                                onClick={() => setVoice(v.voice!.id)}
                                className="p-2 rounded-full cursor-pointer"
                                style={{ color: scheme.primary }}
                                aria-label="Dùng giọng này"
                              >
                                <Check className={`w-5 h-5 ${current ? 'opacity-100' : 'opacity-45'}`} />
                              </button>
                            )}
                            {v.model && (
                              <>
                                {v.model.progress != null ? (
                                  <div
                                    className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin mx-2"
                                    style={{ borderColor: scheme.primary, borderTopColor: 'transparent' }}
                                  />
                                ) : v.model.installed ? (
                                  <button
                                    type="button"
                                    onClick={() => setDeleteModel(v.model!)}
                                    className="p-2 cursor-pointer"
                                    style={{ color: scheme.error }}
                                    aria-label="Xóa gói"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => updateVoiceModel(v.model!.id, true)}
                                    className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer"
                                    style={{ backgroundColor: scheme.secondaryContainer, color: scheme.onSecondaryContainer }}
                                    aria-label="Tải gói"
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}

      {deleteModel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/50" onClick={() => setDeleteModel(null)}>
          <div
            className="w-full max-w-sm rounded-[28px] p-6 shadow-2xl"
            style={{ backgroundColor: scheme.surfaceContainerHigh }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold">Xóa {deleteModel.name}?</h3>
            <p className="text-sm mt-2" style={{ color: scheme.onSurfaceVariant }}>
              Thao tác này xóa toàn bộ {deleteModel.speakerCount} giọng trong gói. Bạn có thể tải lại sau.
            </p>
            <div className="flex justify-end gap-2 mt-5">
              <button type="button" onClick={() => setDeleteModel(null)} className="px-4 py-2 text-sm font-medium cursor-pointer">
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  updateVoiceModel(deleteModel.id, false);
                  setDeleteModel(null);
                }}
                className="px-4 py-2 rounded-full text-sm font-medium cursor-pointer"
                style={{ backgroundColor: scheme.errorContainer, color: scheme.onErrorContainer }}
              >
                Xóa gói
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const FilterSelect: React.FC<{
  label: string;
  value: string;
  options: string[];
  onChange: (val: string) => void;
}> = ({ label, value, options, onChange }) => {
  const { scheme } = usePlayer();
  return (
    <div className="relative shrink-0">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="appearance-none h-9 pl-3.5 pr-8 rounded-full border text-xs font-medium bg-transparent cursor-pointer outline-none"
        style={{ borderColor: scheme.outlineVariant, color: scheme.onSurface }}
      >
        {options.map((opt) => (
          <option key={opt} value={opt} style={{ backgroundColor: scheme.surfaceContainer, color: scheme.onSurface }}>
            {opt === ALL ? label : opt}
          </option>
        ))}
      </select>
      <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  );
};

export const VoiceClonePage: React.FC = () => {
  const { scheme } = usePlayer();
  const [recording, setRecording] = useState('');
  const [showTips, setShowTips] = useState(true);
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ paddingBottom: 'var(--safe-bottom, env(safe-area-inset-bottom))' }}>
      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) setRecording(f.name);
        }}
      />
      <div className="flex-1 overflow-y-auto thin-scrollbar px-5 py-2 space-y-4">

        <div
          className="rounded-[28px] rounded-bl-[10px] p-5 flex flex-col items-center text-center gap-3"
          style={{ backgroundColor: scheme.tertiaryContainer, color: scheme.onTertiaryContainer }}
        >
          <div className="flex items-center gap-1.5 h-12">
            {[12, 22, 34, 46, 30, 18, 26, 12].map((h, i) => (
              <span key={i} className="w-1.5 rounded-full" style={{ height: h, backgroundColor: scheme.tertiary }} />
            ))}
          </div>
          <p className="text-sm">Dùng một đoạn ghi âm rõ tiếng làm mẫu cho giọng đọc.</p>
          <div className="flex flex-wrap justify-center gap-1.5">
            {['10–30 giây', 'Một người nói', 'Nơi yên tĩnh'].map((tip) => (
              <span
                key={tip}
                className="px-2.5 py-1 rounded-full text-xs font-medium"
                style={{ backgroundColor: scheme.surface, color: scheme.onSurface }}
              >
                {tip}
              </span>
            ))}
          </div>
        </div>

        <div className="text-lg font-bold" style={{ color: scheme.primary }}>
          Bản ghi âm
        </div>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full rounded-[18px] p-3.5 flex items-center text-left cursor-pointer"
          style={{ backgroundColor: scheme.surfaceContainerHigh }}
        >
          <div
            className="w-[46px] h-[46px] rounded-[15px] rounded-br-[4px] flex items-center justify-center shrink-0"
            style={{ backgroundColor: scheme.tertiary, color: scheme.onTertiary }}
          >
            <Upload className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0 px-3">
            <div className="text-[15px] font-medium truncate">{recording || 'Chọn tệp ghi âm'}</div>
            <div className="text-xs" style={{ color: scheme.onSurfaceVariant }}>
              {recording ? 'Chạm để đổi bản ghi' : 'MP3, WAV, M4A, FLAC'}
            </div>
          </div>
          <ChevronRight className="w-5 h-5" style={{ color: scheme.primary }} />
        </button>

        <div className="rounded-[18px] overflow-hidden" style={{ backgroundColor: scheme.surfaceContainerLow }}>
          <button
            type="button"
            onClick={() => setShowTips((v) => !v)}
            className="w-full p-4 flex items-center gap-3 text-left cursor-pointer"
          >
            <Info className="w-5 h-5" style={{ color: scheme.primary }} />
            <span className="flex-1 text-[15px] font-medium">Mẹo thu âm</span>
            {showTips ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          {showTips && (
            <div className="px-4 pb-4 space-y-1.5 text-sm" style={{ color: scheme.onSurfaceVariant }}>
              <p>• Đọc một đoạn ngắn với tốc độ và giọng nói tự nhiên.</p>
              <p>• Tắt nhạc, tránh tiếng quạt và tiếng vọng.</p>
              <p>• Giữ khoảng cách với micro để tiếng rõ và không bị vỡ.</p>
            </div>
          )}
        </div>
      </div>

      <div className="px-5 py-3" style={{ backgroundColor: scheme.surfaceContainer }}>
        <p className="text-xs mb-2" style={{ color: scheme.onSurfaceVariant }}>
          Tính năng tạo giọng chưa khả dụng.
        </p>
        <button
          type="button"
          disabled
          className="w-full h-[52px] rounded-full font-medium text-sm opacity-45"
          style={{ backgroundColor: scheme.primary, color: scheme.onPrimary }}
        >
          Tạo giọng
        </button>
      </div>
    </div>
  );
};
