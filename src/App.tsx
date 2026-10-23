/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/GameEngine';
import { GameState, RunStats, Skin, SKINS } from './game/types';
import { GameHud } from './components/GameHud';
import { MobileControls } from './components/MobileControls';
import { TitleMenu } from './components/TitleMenu';
import { PauseModal } from './components/PauseModal';
import { GameOverModal } from './components/GameOverModal';
import { SkinLockerModal } from './components/SkinLockerModal';
import { AudioSettingsModal } from './components/AudioSettingsModal';
import { sound } from './audio/audioEngine';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // High-level App State
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [stats, setStats] = useState<RunStats>({
    score: 0,
    distance: 0,
    coins: 0,
    gems: 0,
    obstaclesDodged: 0,
    speedMultiplier: 1.0,
    isNewHighscore: false,
  });

  const [powerups, setPowerups] = useState({
    shield: false,
    magnet: 0,
    nitro: 0,
    mult: 0,
  });

  const [highscore, setHighscore] = useState<number>(0);
  const [totalCoins, setTotalCoins] = useState<number>(0);
  const [currentSkin, setCurrentSkin] = useState<Skin>(SKINS[0]);

  // Audio state
  const [isMuted, setIsMuted] = useState(false);
  const [musicVolume, setMusicVolume] = useState(0.6);
  const [sfxVolume, setSfxVolume] = useState(0.7);

  // Modals
  const [showSkinLocker, setShowSkinLocker] = useState(false);
  const [showAudioSettings, setShowAudioSettings] = useState(false);

  // Touch swipe detection
  const touchStartY = useRef<number | null>(null);

  // Initialize Game Engine
  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new GameEngine(canvasRef.current);
    engineRef.current = engine;

    // Load saved skin
    try {
      const savedSkinId = localStorage.getItem('neon_selected_skin');
      if (savedSkinId) {
        const found = SKINS.find((s) => s.id === savedSkinId);
        if (found) {
          engine.setSkin(found);
          setCurrentSkin(found);
        }
      }
    } catch {}

    setHighscore(engine.getHighscore());
    setTotalCoins(engine.getTotalCoins());

    // Register Callbacks
    engine.setCallbacks(
      (newStats, activePowerups) => {
        setStats(newStats);
        setPowerups(activePowerups);
        setTotalCoins(engine.getTotalCoins());
      },
      (finalStats) => {
        setStats(finalStats);
        setGameState('GAME_OVER');
        setHighscore(engine.getHighscore());
        setTotalCoins(engine.getTotalCoins());
      }
    );

    // Initial audio settings
    const audioSettings = sound.getSettings();
    setIsMuted(audioSettings.isMuted);
    setMusicVolume(audioSettings.musicVolume);
    setSfxVolume(audioSettings.sfxVolume);

    // Start 60fps game render loop
    engine.startLoop();

    return () => {
      engine.destroy();
    };
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent scrolling on Space and Arrow keys
      if (['Space', 'ArrowUp', 'ArrowDown', 'KeyW', 'KeyS'].includes(e.code)) {
        e.preventDefault();
      }

      if (e.repeat) return; // avoid key repetition jitter

      const engine = engineRef.current;
      if (!engine) return;

      if (e.code === 'KeyP' || e.code === 'Escape') {
        if (engine.state === 'PLAYING') {
          engine.pauseGame();
          setGameState('PAUSED');
        } else if (engine.state === 'PAUSED') {
          engine.resumeGame();
          setGameState('PLAYING');
        }
        return;
      }

      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        if (engine.state === 'PLAYING') {
          engine.handleJumpPress();
        } else if (engine.state === 'MENU' && !showSkinLocker && !showAudioSettings) {
          handleStartGame();
        }
      } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        if (engine.state === 'PLAYING') {
          engine.handleSlidePress();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const engine = engineRef.current;
      if (!engine || engine.state !== 'PLAYING') return;

      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        engine.handleJumpRelease();
      } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        engine.handleSlideRelease();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [showSkinLocker, showAudioSettings]);

  // Game Control Callbacks
  const handleStartGame = () => {
    if (!engineRef.current) return;
    engineRef.current.startGame();
    setGameState('PLAYING');
  };

  const handlePauseGame = () => {
    if (!engineRef.current) return;
    engineRef.current.pauseGame();
    setGameState('PAUSED');
  };

  const handleResumeGame = () => {
    if (!engineRef.current) return;
    engineRef.current.resumeGame();
    setGameState('PLAYING');
  };

  const handleRestartGame = () => {
    if (!engineRef.current) return;
    engineRef.current.restartGame();
    setGameState('PLAYING');
  };

  const handleMainMenu = () => {
    if (!engineRef.current) return;
    engineRef.current.returnToMenu();
    setGameState('MENU');
  };

  const handleSelectSkin = (skin: Skin) => {
    setCurrentSkin(skin);
    if (engineRef.current) {
      engineRef.current.setSkin(skin);
    }
    try {
      localStorage.setItem('neon_selected_skin', skin.id);
    } catch {}
  };

  const handleSpendCoins = (amount: number): boolean => {
    if (!engineRef.current) return false;
    const success = engineRef.current.spendCoins(amount);
    if (success) {
      setTotalCoins(engineRef.current.getTotalCoins());
    }
    return success;
  };

  // Audio adjustments
  const handleToggleMute = useCallback(() => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  }, []);

  const handleMusicVolumeChange = (val: number) => {
    setMusicVolume(val);
    sound.setMusicVolume(val);
  };

  const handleSfxVolumeChange = (val: number) => {
    setSfxVolume(val);
    sound.setSfxVolume(val);
  };

  // Touch Swipe Handlers for mobile gesture controls
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null || !engineRef.current || gameState !== 'PLAYING') return;

    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    if (deltaY < -35) {
      // Swiped UP -> Jump
      engineRef.current.handleJumpPress();
    } else if (deltaY > 35) {
      // Swiped DOWN -> Slide
      engineRef.current.handleSlidePress();
    }
    touchStartY.current = null;
  };

  return (
    <div
      className="relative w-screen h-screen overflow-hidden bg-slate-950 flex items-center justify-center select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 60fps Canvas Render Container */}
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover block cursor-default"
      />

      {/* Cyber Scanline Overlay for authentic CRT arcade aesthetics */}
      <div className="cyber-scanlines absolute inset-0 pointer-events-none z-10 opacity-75" />

      {/* Game HUD (Active Playing State) */}
      {gameState === 'PLAYING' && (
        <GameHud
          stats={stats}
          totalCoins={totalCoins}
          powerups={powerups}
          isMuted={isMuted}
          onPause={handlePauseGame}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Touch Arcade Controls for Mobile Devices */}
      {gameState === 'PLAYING' && (
        <MobileControls
          onJumpPress={() => engineRef.current?.handleJumpPress()}
          onJumpRelease={() => engineRef.current?.handleJumpRelease()}
          onSlidePress={() => engineRef.current?.handleSlidePress()}
          onSlideRelease={() => engineRef.current?.handleSlideRelease()}
        />
      )}

      {/* Main Title Menu */}
      {gameState === 'MENU' && (
        <TitleMenu
          highscore={highscore}
          totalCoins={totalCoins}
          currentSkin={currentSkin}
          onStart={handleStartGame}
          onOpenSkins={() => setShowSkinLocker(true)}
          onOpenAudio={() => setShowAudioSettings(true)}
        />
      )}

      {/* Pause Modal */}
      {gameState === 'PAUSED' && (
        <PauseModal
          onResume={handleResumeGame}
          onRestart={handleRestartGame}
          onMainMenu={handleMainMenu}
          musicVolume={musicVolume}
          sfxVolume={sfxVolume}
          isMuted={isMuted}
          onMusicVolumeChange={handleMusicVolumeChange}
          onSfxVolumeChange={handleSfxVolumeChange}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Game Over Screen */}
      {gameState === 'GAME_OVER' && (
        <GameOverModal
          stats={stats}
          highscore={highscore}
          totalCoins={totalCoins}
          onRestart={handleRestartGame}
          onMainMenu={handleMainMenu}
          onOpenSkins={() => setShowSkinLocker(true)}
        />
      )}

      {/* Skin Locker Modal */}
      {showSkinLocker && (
        <SkinLockerModal
          currentSkin={currentSkin}
          totalCoins={totalCoins}
          onSelectSkin={handleSelectSkin}
          onSpendCoins={handleSpendCoins}
          onClose={() => setShowSkinLocker(false)}
        />
      )}

      {/* Audio Settings Modal */}
      {showAudioSettings && (
        <AudioSettingsModal
          musicVolume={musicVolume}
          sfxVolume={sfxVolume}
          isMuted={isMuted}
          onMusicVolumeChange={handleMusicVolumeChange}
          onSfxVolumeChange={handleSfxVolumeChange}
          onToggleMute={handleToggleMute}
          onClose={() => setShowAudioSettings(false)}
        />
      )}
    </div>
  );
}
