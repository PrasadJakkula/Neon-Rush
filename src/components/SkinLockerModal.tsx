import React, { useState } from 'react';
import { X, Check, Lock } from 'lucide-react';
import { Skin, SKINS } from '../game/types';
import { sound } from '../audio/audioEngine';

interface SkinLockerModalProps {
  currentSkin: Skin;
  totalCoins: number;
  onSelectSkin: (skin: Skin) => void;
  onSpendCoins: (amount: number) => boolean;
  onClose: () => void;
}

export const SkinLockerModal: React.FC<SkinLockerModalProps> = ({
  currentSkin,
  totalCoins,
  onSelectSkin,
  onSpendCoins,
  onClose,
}) => {
  // Persisted unlocked skin IDs
  const [unlockedIds, setUnlockedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('neon_unlocked_skins');
      if (saved) return JSON.parse(saved);
    } catch {}
    return ['cyan_runner']; // default unlocked
  });

  const [notification, setNotification] = useState<string | null>(null);

  const handleUnlock = (skin: Skin) => {
    if (totalCoins < skin.cost) {
      sound.playHit();
      setNotification(`Need ${skin.cost - totalCoins} more Neon Bits!`);
      setTimeout(() => setNotification(null), 2500);
      return;
    }

    const success = onSpendCoins(skin.cost);
    if (success) {
      sound.playPowerup();
      const updated = [...unlockedIds, skin.id];
      setUnlockedIds(updated);
      try {
        localStorage.setItem('neon_unlocked_skins', JSON.stringify(updated));
      } catch {}
      onSelectSkin(skin);
      setNotification(`Unlocked ${skin.name}!`);
      setTimeout(() => setNotification(null), 2500);
    }
  };

  const handleEquip = (skin: Skin) => {
    sound.playUiClick();
    onSelectSkin(skin);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-cyan-500/30 rounded-2xl p-6 shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-8 bg-cyan-400 rounded-sm" />
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-display tracking-wider text-white neon-glow-cyan">
                RUNNER CUSTOMIZATION
              </h2>
              <p className="text-xs text-slate-400 font-sans">
                Select your cyber chassis & particle aura
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-lg border border-amber-500/40">
              <div className="w-3.5 h-3.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
              <span className="text-sm font-bold font-mono text-amber-300 tabular-nums">
                {totalCoins}
              </span>
            </div>

            <button
              onClick={() => {
                sound.playUiClick();
                onClose();
              }}
              aria-label="Close modal"
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Feedback notification */}
        {notification && (
          <div className="bg-cyan-950/80 border border-cyan-400 text-cyan-200 px-4 py-2 rounded-lg text-sm text-center font-display animate-pulse">
            {notification}
          </div>
        )}

        {/* Skin Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto pr-1">
          {SKINS.map((skin) => {
            const isUnlocked = unlockedIds.includes(skin.id);
            const isEquipped = currentSkin.id === skin.id;

            return (
              <div
                key={skin.id}
                className={`relative flex flex-col p-4 rounded-xl border transition-all ${
                  isEquipped
                    ? 'border-cyan-400 bg-cyan-950/30 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                    : isUnlocked
                    ? 'border-slate-700 bg-slate-950/60 hover:border-slate-500'
                    : 'border-slate-800 bg-slate-950/40 opacity-80'
                }`}
              >
                {/* Visual Avatar Preview */}
                <div className="flex items-center gap-4 mb-3">
                  <div
                    className="w-14 h-14 rounded-lg flex items-center justify-center border"
                    style={{
                      borderColor: skin.primaryColor,
                      backgroundColor: '#0a0d17',
                      boxShadow: `0 0 12px ${skin.glowColor}`,
                    }}
                  >
                    {/* Stylized runner mini figure */}
                    <div className="relative flex flex-col items-center">
                      <div
                        className="w-4 h-4 rounded-xs"
                        style={{ backgroundColor: skin.secondaryColor }}
                      >
                        <div
                          className="w-3 h-1 mx-auto mt-1 rounded-full"
                          style={{ backgroundColor: skin.visorColor }}
                        />
                      </div>
                      <div
                        className="w-5 h-5 rounded-xs mt-0.5"
                        style={{ backgroundColor: skin.primaryColor }}
                      />
                    </div>
                  </div>

                  <div className="flex-1">
                    <h3 className="font-display font-bold text-white text-base">
                      {skin.name}
                    </h3>
                    <p className="text-xs text-slate-400">{skin.tagline}</p>
                  </div>
                </div>

                {/* Color swatches */}
                <div className="flex items-center gap-2 mb-4 text-xs text-slate-400">
                  <span>Aura:</span>
                  <div
                    className="w-3.5 h-3.5 rounded-full"
                    style={{ backgroundColor: skin.primaryColor, boxShadow: `0 0 6px ${skin.primaryColor}` }}
                  />
                  <div
                    className="w-3.5 h-3.5 rounded-full"
                    style={{ backgroundColor: skin.secondaryColor }}
                  />
                </div>

                {/* Action button */}
                <div className="mt-auto">
                  {isEquipped ? (
                    <div className="w-full py-2 bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 rounded-lg text-xs font-display font-semibold flex items-center justify-center gap-1.5">
                      <Check className="w-4 h-4" /> EQUIPPED
                    </div>
                  ) : isUnlocked ? (
                    <button
                      onClick={() => handleEquip(skin)}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 text-white rounded-lg text-xs font-display font-semibold transition-colors"
                    >
                      EQUIP CHASSIS
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUnlock(skin)}
                      className="w-full py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-display font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Lock className="w-3.5 h-3.5" /> UNLOCK FOR {skin.cost} BITS
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="text-xs text-slate-500 text-center font-sans">
          Collect glowing Neon Bits and Gems during runs to unlock rare chassis!
        </div>
      </div>
    </div>
  );
};
