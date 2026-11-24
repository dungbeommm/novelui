import React, { useRef, useState } from 'react';
import { MaterialColorScheme } from '../theme/materialTheme';

interface M3ExpressiveSliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  scheme: MaterialColorScheme;
  stopCount?: number;
  ariaLabel?: string;
}

export const M3ExpressiveSlider: React.FC<M3ExpressiveSliderProps> = ({
  value,
  min,
  max,
  step = 1,
  onChange,
  scheme,
  stopCount,
  ariaLabel,
}) => {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);

  const span = Math.max(1e-6, max - min);
  const clamped = Math.min(max, Math.max(min, value));
  const frac = (clamped - min) / span;
  const pct = Math.min(100, Math.max(0, frac * 100));

  // Compute stop dot positions along the track
  const computedStops = (() => {
    if (stopCount && stopCount > 1) return stopCount;
    const rawSteps = Math.round(span / Math.max(1e-6, step)) + 1;
    if (rawSteps >= 2 && rawSteps <= 15) return rawSteps;
    return 11;
  })();

  const stopFracs = Array.from({ length: computedStops }, (_, i) =>
    computedStops <= 1 ? 0 : i / (computedStops - 1),
  );

  const commitFromClientX = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0) return;
    const rawFrac = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const rawVal = min + rawFrac * span;
    const stepped = Math.round((rawVal - min) / step) * step + min;
    const finalVal = Math.min(max, Math.max(min, Number(stepped.toFixed(4))));
    onChange(finalVal);
  };

  return (
    <div
      ref={trackRef}
      role="slider"
      tabIndex={0}
      aria-label={ariaLabel}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={clamped}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
          e.preventDefault();
          onChange(Math.min(max, clamped + step));
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
          e.preventDefault();
          onChange(Math.max(min, clamped - step));
        }
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        setDragging(true);
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          // ignore
        }
        commitFromClientX(e.clientX);
      }}
      onPointerMove={(e) => {
        if (!dragging) return;
        e.stopPropagation();
        commitFromClientX(e.clientX);
      }}
      onPointerUp={(e) => {
        if (!dragging) return;
        e.stopPropagation();
        setDragging(false);
        try {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
          }
        } catch {
          // ignore
        }
      }}
      onPointerCancel={() => setDragging(false)}
      className="relative w-full h-11 flex items-center cursor-pointer select-none touch-none"
    >
      {/* Active Left Track (stops 7px before thumb center) */}
      <div
        className={`absolute left-0 h-4 overflow-hidden ${
          dragging ? '' : 'transition-[width] duration-150 ease-out'
        }`}
        style={{
          width: `calc(max(0px, ${pct}% - 7px))`,
          backgroundColor: scheme.primary,
          borderTopLeftRadius: 9999,
          borderBottomLeftRadius: 9999,
          borderTopRightRadius: 4,
          borderBottomRightRadius: 4,
        }}
      />

      {/* Inactive Right Track (starts 7px after thumb center) */}
      <div
        className={`absolute right-0 h-4 overflow-hidden ${
          dragging ? '' : 'transition-[width] duration-150 ease-out'
        }`}
        style={{
          width: `calc(max(0px, ${100 - pct}% - 7px))`,
          backgroundColor: scheme.secondaryContainer,
          borderTopLeftRadius: 4,
          borderBottomLeftRadius: 4,
          borderTopRightRadius: 9999,
          borderBottomRightRadius: 9999,
        }}
      />

      {/* Stop Dots */}
      {stopFracs.map((sf, idx) => {
        const dotPct = 2.5 + sf * 95;
        const distFromThumb = Math.abs(sf - frac);
        if (distFromThumb < 0.032) return null;
        const isActive = sf < frac;
        return (
          <span
            key={idx}
            className="absolute w-[3.5px] h-[3.5px] rounded-full pointer-events-none -translate-x-1/2"
            style={{
              left: `${dotPct}%`,
              backgroundColor: isActive ? `${scheme.onPrimary}cc` : `${scheme.primary}99`,
            }}
          />
        );
      })}

      {/* Tall Vertical Pill Handle */}
      <div
        className={`absolute -translate-x-1/2 rounded-full pointer-events-none ${
          dragging
            ? 'w-[5.5px] h-[42px]'
            : 'w-[4px] h-[38px] transition-[left,width,height] duration-150 ease-out'
        }`}
        style={{
          left: `${pct}%`,
          backgroundColor: scheme.primary,
        }}
      />
    </div>
  );
};

interface M3ExpressiveSwitchProps {
  checked: boolean;
  onChange: () => void;
  scheme: MaterialColorScheme;
  ariaLabel?: string;
}

export const M3ExpressiveSwitch: React.FC<M3ExpressiveSwitchProps> = ({
  checked,
  onChange,
  scheme,
  ariaLabel,
}) => {
  const [pressed, setPressed] = useState(false);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={onChange}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      className="relative w-[52px] h-[32px] rounded-full shrink-0 cursor-pointer transition-colors duration-200 flex items-center"
      style={{
        backgroundColor: checked ? scheme.primary : scheme.surfaceContainerHighest,
        border: checked ? `2px solid ${scheme.primary}` : `2px solid ${scheme.outline}`,
      }}
    >
      <span
        className="rounded-full transition-all duration-250 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
        style={{
          width: pressed ? 26 : checked ? 24 : 16,
          height: pressed ? 26 : checked ? 24 : 16,
          backgroundColor: checked ? scheme.onPrimary : scheme.outline,
          transform: checked
            ? `translateX(${pressed ? 21 : 22}px)`
            : `translateX(${pressed ? 3 : 6}px)`,
        }}
      />
    </button>
  );
};
