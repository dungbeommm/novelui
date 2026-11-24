import React, { useEffect, useRef } from 'react';

interface WaveSeekBarProps {
  value: number;
  onChange: (value: number) => void;
  activeColor: string;
  inactiveColor: string;
  thumbColor: string;
  animate?: boolean;
  className?: string;
}

export const WaveSeekBar: React.FC<WaveSeekBarProps> = ({
  value,
  onChange,
  activeColor,
  inactiveColor,
  thumbColor,
  animate = false,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const phaseRef = useRef(0);
  const draggingRef = useRef(false);
  const valRef = useRef(value);
  valRef.current = value;

  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();

    const draw = (now: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) {
        if (animate) rafId = requestAnimationFrame(draw);
        return;
      }
      const targetW = Math.round(rect.width * dpr);
      const targetH = Math.round(rect.height * dpr);
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, rect.width, rect.height);

      if (animate) {
        const dt = now - lastTime;
        phaseRef.current = (phaseRef.current + (dt / 2400) * Math.PI * 2) % (Math.PI * 2);
      } else {
        phaseRef.current = 0;
      }
      lastTime = now;

      const w = rect.width;
      const cy = rect.height / 2;
      const v = Math.min(1, Math.max(0, valRef.current));
      const pad = 9;
      const trackW = Math.max(1, w - pad * 2);
      const activeEnd = pad + trackW * v;
      const waveLen = 22;
      const amp = 3;
      const stroke = 4;
      const thumbR = draggingRef.current ? 9.5 : 7;

      // Active sinusoidal wave
      ctx.beginPath();
      ctx.moveTo(pad, cy);
      const activeLen = activeEnd - pad;
      const step = Math.max(2, activeLen / 180);
      for (let x = pad; x <= activeEnd; x += step) {
        const fade = Math.min(1, Math.max(0, (activeEnd - x) / (waveLen * 0.6)));
        const y = cy + amp * fade * Math.sin(((x - pad) / waveLen) * Math.PI * 2 + phaseRef.current);
        ctx.lineTo(x, y);
      }
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = stroke;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Inactive line
      if (activeEnd < w - pad) {
        ctx.beginPath();
        ctx.moveTo(activeEnd, cy);
        ctx.lineTo(w - pad, cy);
        ctx.strokeStyle = inactiveColor;
        ctx.lineWidth = stroke;
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      // Thumb circle
      ctx.beginPath();
      ctx.arc(activeEnd, cy, thumbR, 0, Math.PI * 2);
      ctx.fillStyle = thumbColor;
      ctx.fill();

      ctx.restore();

      if (animate) {
        rafId = requestAnimationFrame(draw);
      }
    };

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [animate, activeColor, inactiveColor, thumbColor, value]);

  const updateFromPointer = (clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const pad = 9;
    const trackW = rect.width - pad * 2;
    if (trackW <= 0) return;
    const frac = Math.min(1, Math.max(0, (clientX - rect.left - pad) / trackW));
    onChange(frac);
  };

  const endDrag = (e: React.PointerEvent<HTMLCanvasElement>) => {
    draggingRef.current = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-11 touch-none cursor-pointer block ${className}`}
      onPointerDown={(e) => {
        e.stopPropagation();
        draggingRef.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        updateFromPointer(e.clientX);
      }}
      onPointerMove={(e) => {
        if (!draggingRef.current) return;
        e.stopPropagation();
        updateFromPointer(e.clientX);
      }}
      onPointerUp={(e) => {
        e.stopPropagation();
        endDrag(e);
      }}
      onPointerCancel={(e) => {
        e.stopPropagation();
        endDrag(e);
      }}
    />
  );
};
