import React, { useEffect } from 'react';
import { RotateCcw, Trophy, Home, Sparkles, Shirt } from 'lucide-react';
import { RunStats } from '../game/types';
import { sound } from '../audio/audioEngine';

interface GameOverModalProps {
  stats: RunStats;
  highscore: number;
  totalCoins: number;
  onRestart: () => void;
  onMainMenu: () => void;
  onOpenSkins: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  highscore,
  totalCoins,
  onRestart,
  onMainMenu,
  onOpenSkins,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        sound.playUiClick();
        onRestart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onRestart]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-lg bg-slate-900 border border-rose-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6">
        {/* Header */}
        <div className="text-center">
          <span className="text-xs font-display tracking-widest text-rose-400 uppercase">
            System Failure
          </span>
          <h2 className="text-3xl sm:text-4xl font-black font-display tracking-wider text-white neon-glow-pink mt-1">
            RUN TERMINATED
          </h2>
        </div>

        {/* High Score Celebration Banner */}
        {stats.isNewHighscore && (
          <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500/20 via-pink-500/20 to-amber-500/20 border border-amber-400/60 rounded-xl py-2.5 px-4 animate-pulse">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span className="font-display font-bold text-amber-300 text-sm tracking-wider">
              NEW PERSONAL BEST!
            </span>
            <Sparkles className="w-4 h-4 text-amber-300" />
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 bg-slate-950/80 p-4 rounded-xl border border-slate-800">
          <div className="flex flex-col p-2.5 bg-slate-900/60 rounded-lg">
            <span className="text-[11px] text-slate-400 font-display uppercase tracking-wider">
              Final Score
            </span>
            <span className="text-2xl font-bold font-mono text-cyan-400 tabular-nums neon-glow-cyan">
              {stats.score.toLocaleString()}
            </span>
          </div>

          <div className="flex flex-col p-2.5 bg-slate-900/60 rounded-lg">
            <span className="text-[11px] text-slate-400 font-display uppercase tracking-wider">
              All-Time Best
            </span>
            <span className="text-2xl font-bold font-mono text-amber-400 tabular-nums">
              {Math.max(stats.score, highscore).toLocaleString()}
            </span>
          </div>

          <div className="flex flex-col p-2.5 bg-slate-900/60 rounded-lg">
            <span className="text-[11px] text-slate-400 font-display uppercase tracking-wider">
              Distance Survived
            </span>
            <span className="text-lg font-bold font-mono text-slate-200 tabular-nums">
              {stats.distance} <span className="text-xs text-slate-400">m</span>
            </span>
          </div>

          <div className="flex flex-col p-2.5 bg-slate-900/60 rounded-lg">
            <span className="text-[11px] text-slate-400 font-display uppercase tracking-wider">
              Bits Collected
            </span>
            <span className="text-lg font-bold font-mono text-amber-300 tabular-nums flex items-center gap-1.5">
              +{stats.coins}
              <span className="text-[10px] text-slate-400 font-normal">
                (Total: {totalCoins})
              </span>
            </span>
          </div>

          <div className="flex flex-col p-2.5 bg-slate-900/60 rounded-lg">
            <span className="text-[11px] text-slate-400 font-display uppercase tracking-wider">
              Hazards Dodged
            </span>
            <span className="text-lg font-bold font-mono text-slate-200 tabular-nums">
              {stats.obstaclesDodged}
            </span>
          </div>

          <div className="flex flex-col p-2.5 bg-slate-900/60 rounded-lg">
            <span className="text-[11px] text-slate-400 font-display uppercase tracking-wider">
              Max Speed Reached
            </span>
            <span className="text-lg font-bold font-mono text-pink-400 tabular-nums">
              {stats.speedMultiplier.toFixed(1)}x
            </span>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => {
              sound.playUiClick();
              onRestart();
            }}
            className="w-full py-4 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:from-rose-400 hover:to-pink-400 text-white font-display font-bold text-base tracking-widest rounded-xl shadow-[0_0_25px_rgba(244,63,94,0.4)] flex items-center justify-center gap-2.5 transition-all active:scale-98 cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" /> PLAY AGAIN (SPACE)
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                sound.playUiClick();
                onOpenSkins();
              }}
              className="py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-display font-semibold text-xs sm:text-sm tracking-wider rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Shirt className="w-4 h-4 text-cyan-400" /> SKIN LOCKER
            </button>

            <button
              onClick={() => {
                sound.playUiClick();
                onMainMenu();
              }}
              className="py-3 bg-slate-800/70 hover:bg-slate-800 text-slate-300 font-display font-semibold text-xs sm:text-sm tracking-wider rounded-xl border border-slate-700/70 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Home className="w-4 h-4" /> MAIN MENU
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
