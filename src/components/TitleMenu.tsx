import React, { useState } from 'react';
import { Play, Trophy, Shirt, Volume2, HelpCircle, ArrowUp, ArrowDown } from 'lucide-react';
import { Skin } from '../game/types';
import { sound } from '../audio/audioEngine';

interface TitleMenuProps {
  highscore: number;
  totalCoins: number;
  currentSkin: Skin;
  onStart: () => void;
  onOpenSkins: () => void;
  onOpenAudio: () => void;
}

export const TitleMenu: React.FC<TitleMenuProps> = ({
  highscore,
  totalCoins,
  currentSkin,
  onStart,
  onOpenSkins,
  onOpenAudio,
}) => {
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-between p-6 sm:p-10 pointer-events-auto">
      {/* Top Bar Indicators */}
      <div className="w-full max-w-5xl flex items-center justify-between gap-4">
        {/* High Score Badge */}
        <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-4 py-2 border border-cyan-500/30 rounded-xl">
          <Trophy className="w-4 h-4 text-cyan-400" />
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-display uppercase tracking-widest leading-none">
              High Score
            </span>
            <span className="text-base font-bold font-mono text-cyan-300 tabular-nums leading-tight">
              {highscore.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Total Coins & Audio Config */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3.5 py-2 border border-amber-500/30 rounded-xl">
            <div className="w-4 h-4 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)] flex items-center justify-center text-[10px] text-slate-950 font-black">
              C
            </div>
            <span className="text-base font-bold font-mono text-amber-300 tabular-nums">
              {totalCoins}
            </span>
          </div>

          <button
            onClick={() => {
              sound.playUiClick();
              onOpenAudio();
            }}
            aria-label="Audio settings"
            className="p-2.5 bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/40 rounded-xl text-slate-300 hover:text-cyan-400 transition-colors"
          >
            <Volume2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Hero Center Title */}
      <div className="flex flex-col items-center text-center my-auto">
        <div className="inline-block px-3 py-1 bg-cyan-950/60 border border-cyan-500/30 rounded-md text-[11px] font-display font-semibold tracking-widest text-cyan-400 uppercase mb-3">
          Cyberpunk 2D Endless Runner
        </div>

        <h1 className="text-5xl sm:text-7xl md:text-8xl font-black font-display tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-200 to-cyan-500 neon-glow-cyan leading-none mb-3">
          NEON RUSH
        </h1>

        <p className="text-sm sm:text-base text-slate-300 max-w-md font-sans leading-relaxed mb-6">
          Dodge lethal plasma hazards, leap over cyber barriers, and surge through the neon grid at breakneck speed.
        </p>

        {/* Primary START CTA */}
        <button
          onClick={() => {
            sound.playUiClick();
            onStart();
          }}
          className="group relative px-10 py-5 bg-gradient-to-r from-cyan-500 via-blue-600 to-cyan-400 hover:from-cyan-400 hover:to-blue-500 text-white font-display font-black text-lg sm:text-xl tracking-widest rounded-2xl shadow-[0_0_35px_rgba(6,182,212,0.5)] transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-3 mb-6"
        >
          <Play className="w-6 h-6 fill-current group-hover:translate-x-0.5 transition-transform" />
          START RUN
        </button>

        {/* Secondary Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sound.playUiClick();
              onOpenSkins();
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-pink-500/50 rounded-xl text-xs sm:text-sm font-display font-semibold text-pink-300 transition-colors cursor-pointer"
          >
            <Shirt className="w-4 h-4 text-pink-400" />
            <span>CHASSIS: {currentSkin.name}</span>
          </button>

          <button
            onClick={() => {
              sound.playUiClick();
              setShowHowToPlay(!showHowToPlay);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-xl text-xs sm:text-sm font-display font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span>HOW TO PLAY</span>
          </button>
        </div>
      </div>

      {/* How To Play Drawer / Card */}
      {showHowToPlay ? (
        <div className="w-full max-w-xl bg-slate-900/95 border border-cyan-500/40 rounded-xl p-4 sm:p-5 backdrop-blur-md shadow-2xl flex flex-col gap-3 mb-2 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-display font-bold text-cyan-400 uppercase tracking-wider">
              Control Interface & Objectives
            </span>
            <button
              onClick={() => setShowHowToPlay(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-start gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
              <div className="p-1 bg-cyan-950 rounded text-cyan-400">
                <ArrowUp className="w-4 h-4" />
              </div>
              <div>
                <p className="font-display font-bold text-white">JUMP / DOUBLE JUMP</p>
                <p className="text-slate-400">Space, W, Up Arrow, or Right Touch</p>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
              <div className="p-1 bg-rose-950 rounded text-rose-400">
                <ArrowDown className="w-4 h-4" />
              </div>
              <div>
                <p className="font-display font-bold text-white">SLIDE / DUCK</p>
                <p className="text-slate-400">S, Down Arrow, or Left Touch</p>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
            <span>Collect <strong className="text-amber-400">Coins (+10)</strong> & <strong className="text-cyan-400">Gems (+50)</strong></span>
            <span>Slide under <strong className="text-amber-400">High Lasers</strong></span>
            <span>Grab <strong className="text-blue-400">Shields</strong> & <strong className="text-rose-400">Nitro</strong></span>
          </div>
        </div>
      ) : (
        /* Bottom Quick Controls Guide Pill */
        <div className="hidden sm:flex items-center gap-6 bg-slate-950/80 backdrop-blur-md px-5 py-2.5 border border-slate-800 rounded-full text-xs text-slate-400 font-mono">
          <span className="flex items-center gap-1.5">
            <kbd className="px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-cyan-400 font-bold">SPACE</kbd>
            Jump / Double Jump
          </span>
          <span className="text-slate-700">•</span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-rose-400 font-bold">DOWN</kbd>
            Slide under Lasers
          </span>
          <span className="text-slate-700">•</span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-amber-400 font-bold">P</kbd>
            Pause
          </span>
        </div>
      )}
    </div>
  );
};
