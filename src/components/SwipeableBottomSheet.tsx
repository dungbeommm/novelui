import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface SwipeableBottomSheetProps {
  onClose: () => void;
  canClose?: boolean;
  backgroundColor: string;
  textColor: string;
  handleColor: string;
  className?: string;
  children: React.ReactNode;
}

export const SwipeableBottomSheet: React.FC<SwipeableBottomSheetProps> = ({
  onClose,
  canClose = true,
  backgroundColor,
  textColor,
  handleColor,
  className = 'rounded-t-[28px]',
  children,
}) => {
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [closing, setClosing] = useState(false);
  const startRef = useRef<{ x: number; y: number; time: number; fromHandle: boolean } | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);

  const triggerClose = () => {
    if (!canClose || closing) return;
    setClosing(true);
    window.setTimeout(onClose, 210);
  };

  const isAtTop = (target: EventTarget | null): boolean => {
    let el = target as HTMLElement | null;
    while (el && el !== sheetRef.current) {
      if (el.scrollHeight > el.clientHeight + 2 && el.scrollTop > 2) {
        return false;
      }
      el = el.parentElement;
    }
    return true;
  };

  const content = (
    <div
      data-swipe-sheet
      className={`fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-[2px] ${
        closing ? 'animate-backdrop-out pointer-events-none' : 'animate-backdrop-in'
      }`}
      onClick={triggerClose}
    >
      <div
        ref={sheetRef}
        className={`w-full max-w-[480px] overflow-hidden flex flex-col shadow-2xl ${className} ${
          closing
            ? 'animate-sheet-down'
            : dragging
              ? ''
              : dragY === 0
                ? 'animate-sheet-up transition-transform duration-200 ease-out'
                : 'transition-transform duration-200 ease-out'
        }`}
        style={{
          backgroundColor,
          color: textColor,
          transform: !closing && dragY > 0 ? `translateY(${dragY}px)` : undefined,
          paddingBottom: 'var(--safe-bottom, env(safe-area-inset-bottom))',
        }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => {
          if (!canClose || closing || e.touches.length !== 1) return;
          const target = e.target as HTMLElement | null;
          if (target?.closest('input[type="range"], [role="slider"]')) return;
          const fromHandle = Boolean(target?.closest('[data-sheet-handle]'));
          if (fromHandle || isAtTop(target)) {
            startRef.current = {
              x: e.touches[0].clientX,
              y: e.touches[0].clientY,
              time: performance.now(),
              fromHandle,
            };
          }
        }}
        onTouchMove={(e) => {
          const start = startRef.current;
          if (!start || e.touches.length !== 1) return;
          const dx = e.touches[0].clientX - start.x;
          const dy = e.touches[0].clientY - start.y;
          if (!dragging) {
            if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
            if (dy > 10 && Math.abs(dy) > Math.abs(dx) * 1.2) {
              setDragging(true);
            } else {
              startRef.current = null;
              return;
            }
          }
          if (dy > 0) {
            if (e.cancelable) e.preventDefault();
            setDragY(Math.min(320, dy));
          }
        }}
        onTouchEnd={() => {
          const start = startRef.current;
          const dt = start ? performance.now() - start.time : 999;
          startRef.current = null;
          setDragging(false);
          if (dragY > 85 || (dt < 260 && dragY > 40)) {
            triggerClose();
            return;
          }
          setDragY(0);
        }}
        onTouchCancel={() => {
          startRef.current = null;
          setDragging(false);
          setDragY(0);
        }}
      >
        <div data-sheet-handle className="flex justify-center pt-3 pb-1.5 cursor-grab active:cursor-grabbing touch-none">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: handleColor }} />
        </div>
        {children}
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    const target = document.getElementById('phone-viewport-portal') || document.body;
    return createPortal(content, target);
  }
  return content;
};
