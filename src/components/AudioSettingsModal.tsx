import React from 'react';
import { X, Volume2, VolumeX, Music, Bell } from 'lucide-react';
import { sound } from '../audio/audioEngine';

interface AudioSettingsModalProps {
  musicVolume: number;
  sfxVolume: number;
  isMuted: boolean;
  onMusicVolumeChange: (val: number) => void;
  onSfxVolumeChange: (val: number) => void;
  onToggleMute: () => void;
  onClose: () => void;
}

export const AudioSettingsModal: React.FC<AudioSettingsModalProps> = ({
  musicVolume,
  sfxVolume,
  isMuted,
  onMusicVolumeChange,
  onSfxVolumeChange,
  onToggleMute,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-900 border border-cyan-500/30 rounded-2xl p-6 shadow-2xl flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Volume2 className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold font-display tracking-wider text-white">
              AUDIO MATRIX
            </h2>
          </div>

          <button
            onClick={() => {
              sound.playUiClick();
              onClose();
            }}
            aria-label="Close audio settings"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mute Toggle Card */}
        <div className="flex items-center justify-between bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
          <div className="flex items-center gap-3">
            {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-cyan-400" />}
            <div>
              <p className="text-sm font-semibold text-white">Master Audio</p>
              <p className="text-xs text-slate-400">{isMuted ? 'All sounds muted' : 'Audio active'}</p>
            </div>
          </div>

          <button
            onClick={onToggleMute}
            className={`px-3 py-1.5 rounded-lg text-xs font-display font-bold transition-all ${
              isMuted
                ? 'bg-rose-950 border border-rose-500 text-rose-300'
                : 'bg-cyan-950 border border-cyan-500 text-cyan-300'
            }`}
          >
            {isMuted ? 'MUTED' : 'ENABLED'}
          </button>
        </div>

        {/* Music Volume Slider */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-slate-300 font-display">
              <Music className="w-4 h-4 text-cyan-400" />
              SYNTHWAVE SOUNDTRACK
            </span>
            <span className="font-mono text-cyan-400 font-bold">
              {Math.round(musicVolume * 100)}%
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={musicVolume}
            onChange={(e) => onMusicVolumeChange(parseFloat(e.target.value))}
            className="w-full accent-cyan-400 bg-slate-800 rounded-lg cursor-pointer h-2"
          />
        </div>

        {/* SFX Volume Slider */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-slate-300 font-display">
              <Bell className="w-4 h-4 text-pink-400" />
              CYBER SOUND FX
            </span>
            <span className="font-mono text-pink-400 font-bold">
              {Math.round(sfxVolume * 100)}%
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={sfxVolume}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              onSfxVolumeChange(val);
            }}
            className="w-full accent-pink-400 bg-slate-800 rounded-lg cursor-pointer h-2"
          />
        </div>

        {/* Confirm Button */}
        <button
          onClick={() => {
            sound.playUiClick();
            onClose();
          }}
          className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-display font-semibold text-xs tracking-wider rounded-xl transition-colors mt-2"
        >
          SAVE & CLOSE
        </button>
      </div>
    </div>
  );
};
