import React from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX } from 'lucide-react';
import { sound } from '../audio/audioEngine';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
  musicVolume: number;
  sfxVolume: number;
  isMuted: boolean;
  onMusicVolumeChange: (val: number) => void;
  onSfxVolumeChange: (val: number) => void;
  onToggleMute: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onMainMenu,
  musicVolume,
  sfxVolume,
  isMuted,
  onMusicVolumeChange,
  onSfxVolumeChange,
  onToggleMute,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-900 border border-cyan-500/40 rounded-2xl p-6 shadow-2xl flex flex-col gap-6">
        {/* Header */}
        <div className="text-center">
          <span className="text-xs font-display tracking-widest text-cyan-400 uppercase">
            System Suspended
          </span>
          <h2 className="text-3xl font-black font-display tracking-wider text-white neon-glow-cyan mt-1">
            GAME PAUSED
          </h2>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => {
              sound.playUiClick();
              onResume();
            }}
            className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-display font-bold text-sm tracking-wider rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2 transition-all active:scale-98"
          >
            <Play className="w-5 h-5 fill-current" /> RESUME RUN
          </button>

          <button
            onClick={() => {
              sound.playUiClick();
              onRestart();
            }}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 font-display font-semibold text-sm tracking-wider rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> RESTART RUN
          </button>

          <button
            onClick={() => {
              sound.playUiClick();
              onMainMenu();
            }}
            className="w-full py-3 bg-slate-800/60 hover:bg-slate-800 text-slate-300 font-display font-semibold text-sm tracking-wider rounded-xl border border-slate-700/60 flex items-center justify-center gap-2 transition-colors"
          >
            <Home className="w-4 h-4" /> MAIN MENU
          </button>
        </div>

        {/* Audio Configuration Section */}
        <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-display text-slate-300 font-semibold uppercase tracking-wider">
              Audio Controls
            </span>
            <button
              onClick={onToggleMute}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
              <span>{isMuted ? 'Muted' : 'Sound On'}</span>
            </button>
          </div>

          {/* Music Volume */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Synthwave BGM</span>
              <span className="font-mono">{Math.round(musicVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={musicVolume}
              onChange={(e) => onMusicVolumeChange(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 bg-slate-800 rounded-lg cursor-pointer h-1.5"
            />
          </div>

          {/* SFX Volume */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Sound Effects</span>
              <span className="font-mono">{Math.round(sfxVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={sfxVolume}
              onChange={(e) => onSfxVolumeChange(parseFloat(e.target.value))}
              className="w-full accent-pink-400 bg-slate-800 rounded-lg cursor-pointer h-1.5"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
