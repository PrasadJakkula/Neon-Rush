import React, { useEffect, useState } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface MobileControlsProps {
  onJumpPress: () => void;
  onJumpRelease: () => void;
  onSlidePress: () => void;
  onSlideRelease: () => void;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onJumpPress,
  onJumpRelease,
  onSlidePress,
  onSlideRelease,
}) => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    // Detect touch device or small screen
    const checkTouch = () => {
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth < 1024;
      setIsTouchDevice(hasTouch);
    };
    checkTouch();
    window.addEventListener('resize', checkTouch);
    return () => window.removeEventListener('resize', checkTouch);
  }, []);

  if (!isTouchDevice) {
    return null;
  }

  return (
    <div className="absolute bottom-4 left-0 right-0 px-6 sm:px-12 flex justify-between items-end pointer-events-none z-20 select-none">
      {/* Left Action: SLIDE / DUCK */}
      <button
        type="button"
        aria-label="Slide under obstacle"
        onPointerDown={(e) => {
          e.preventDefault();
          onSlidePress();
        }}
        onPointerUp={(e) => {
          e.preventDefault();
          onSlideRelease();
        }}
        onPointerCancel={(e) => {
          e.preventDefault();
          onSlideRelease();
        }}
        className="pointer-events-auto active:scale-95 transition-transform flex flex-col items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-900/80 active:bg-rose-950/90 border-2 border-rose-500/50 active:border-rose-400 text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.3)] backdrop-blur-md cursor-pointer select-none"
      >
        <ArrowDown className="w-8 h-8 text-rose-400" />
        <span className="text-[11px] font-display font-bold tracking-wider text-rose-300 uppercase mt-0.5">
          SLIDE
        </span>
      </button>

      {/* Right Action: JUMP / DOUBLE JUMP */}
      <button
        type="button"
        aria-label="Jump or double jump"
        onPointerDown={(e) => {
          e.preventDefault();
          onJumpPress();
        }}
        onPointerUp={(e) => {
          e.preventDefault();
          onJumpRelease();
        }}
        onPointerCancel={(e) => {
          e.preventDefault();
          onJumpRelease();
        }}
        className="pointer-events-auto active:scale-95 transition-transform flex flex-col items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-900/80 active:bg-cyan-950/90 border-2 border-cyan-500/50 active:border-cyan-400 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.3)] backdrop-blur-md cursor-pointer select-none"
      >
        <ArrowUp className="w-8 h-8 text-cyan-400" />
        <span className="text-[11px] font-display font-bold tracking-wider text-cyan-300 uppercase mt-0.5">
          JUMP
        </span>
      </button>
    </div>
  );
};
