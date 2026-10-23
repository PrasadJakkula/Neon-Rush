import React from 'react';
import { Pause, Volume2, VolumeX, Shield, Zap, Magnet } from 'lucide-react';
import { RunStats } from '../game/types';

interface GameHudProps {
  stats: RunStats;
  totalCoins: number;
  powerups: {
    shield: boolean;
    magnet: number;
    nitro: number;
    mult: number;
  };
  isMuted: boolean;
  onPause: () => void;
  onToggleMute: () => void;
}

export const GameHud: React.FC<GameHudProps> = ({
  stats,
  totalCoins,
  powerups,
  isMuted,
  onPause,
  onToggleMute,
}) => {
  return (
    <div className="absolute top-0 left-0 right-0 p-3 sm:p-5 pointer-events-none flex flex-col gap-3 z-20">
      {/* Top Bar Stats */}
      <div className="flex items-center justify-between gap-4 max-w-6xl mx-auto w-full">
        {/* Score & Multiplier */}
        <div className="flex items-center gap-3 bg-slate-950/80 backdrop-blur-md px-4 py-2 border border-cyan-500/30 rounded-lg pointer-events-auto">
          <div className="flex flex-col">
            <span className="text-[10px] tracking-widest text-cyan-400 font-display uppercase font-semibold">
              Score
            </span>
            <span className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-white neon-glow-cyan leading-tight">
              {stats.score.toLocaleString()}
            </span>
          </div>

          <div className="h-8 w-px bg-slate-800 mx-1" />

          <div className="flex flex-col">
            <span className="text-[10px] tracking-widest text-pink-400 font-display uppercase font-semibold">
              Speed
            </span>
            <span className="text-base sm:text-lg font-bold font-mono tabular-nums text-pink-300 leading-tight">
              {stats.speedMultiplier.toFixed(1)}x
            </span>
          </div>
        </div>

        {/* Center: Distance */}
        <div className="hidden sm:flex items-center bg-slate-950/80 backdrop-blur-md px-4 py-2 border border-slate-800 rounded-lg pointer-events-auto">
          <div className="flex flex-col items-center">
            <span className="text-[10px] tracking-widest text-slate-400 font-display uppercase font-semibold">
              Distance
            </span>
            <span className="text-lg font-bold font-mono tabular-nums text-amber-300 leading-tight">
              {stats.distance} <span className="text-xs text-slate-400 font-normal">m</span>
            </span>
          </div>
        </div>

        {/* Right: Coins & Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Coin Badge */}
          <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3.5 py-2 border border-amber-500/30 rounded-lg">
            <div className="w-4 h-4 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)] flex items-center justify-center text-[10px] text-slate-950 font-black">
              C
            </div>
            <span className="text-base sm:text-lg font-bold font-mono tabular-nums text-amber-300 leading-tight">
              {stats.coins}
            </span>
            <span className="text-xs text-slate-500 font-mono hidden md:inline">
              / {totalCoins}
            </span>
          </div>

          {/* Audio Mute Button */}
          <button
            onClick={onToggleMute}
            aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            className="p-2 sm:p-2.5 bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-lg text-slate-300 hover:text-cyan-400 transition-colors"
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-cyan-400" />}
          </button>

          {/* Pause Button */}
          <button
            onClick={onPause}
            aria-label="Pause Game"
            className="p-2 sm:p-2.5 bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-lg text-slate-300 hover:text-cyan-400 transition-colors"
          >
            <Pause className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Active Powerups Row */}
      <div className="flex items-center gap-2 max-w-6xl mx-auto w-full">
        {powerups.shield && (
          <div className="flex items-center gap-2 bg-cyan-950/80 border border-cyan-400/60 px-3 py-1 rounded-md text-cyan-300 text-xs font-mono animate-pulse pointer-events-auto">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold">SHIELD ACTIVE</span>
          </div>
        )}

        {powerups.nitro > 0 && (
          <div className="flex items-center gap-2 bg-rose-950/80 border border-rose-500/60 px-3 py-1 rounded-md text-rose-300 text-xs font-mono animate-pulse pointer-events-auto">
            <Zap className="w-3.5 h-3.5 text-rose-400" />
            <span className="font-semibold">NITRO {Math.ceil(powerups.nitro)}s</span>
          </div>
        )}

        {powerups.magnet > 0 && (
          <div className="flex items-center gap-2 bg-purple-950/80 border border-purple-500/60 px-3 py-1 rounded-md text-purple-300 text-xs font-mono animate-pulse pointer-events-auto">
            <Magnet className="w-3.5 h-3.5 text-purple-400" />
            <span className="font-semibold">MAGNET {Math.ceil(powerups.magnet)}s</span>
          </div>
        )}

        {powerups.mult > 0 && (
          <div className="flex items-center gap-2 bg-pink-950/80 border border-pink-500/60 px-3 py-1 rounded-md text-pink-300 text-xs font-mono animate-pulse pointer-events-auto">
            <span className="font-bold text-pink-400 text-xs">2X</span>
            <span className="font-semibold">POINTS {Math.ceil(powerups.mult)}s</span>
          </div>
        )}
      </div>
    </div>
  );
};
