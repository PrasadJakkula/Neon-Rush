export type GameState = 'MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export interface Skin {
  id: string;
  name: string;
  tagline: string;
  cost: number;
  primaryColor: string;
  secondaryColor: string;
  glowColor: string;
  visorColor: string;
  trailColor: string;
}

export const SKINS: Skin[] = [
  {
    id: 'cyan_runner',
    name: 'Cyber Blade',
    tagline: 'Standard Grid Operative',
    cost: 0,
    primaryColor: '#06b6d4', // cyan-500
    secondaryColor: '#38bdf8',
    glowColor: 'rgba(6, 182, 212, 0.7)',
    visorColor: '#ffffff',
    trailColor: 'rgba(6, 182, 212, 0.4)',
  },
  {
    id: 'synth_pink',
    name: 'Neon Siren',
    tagline: 'Overdrive Street Rebel',
    cost: 60,
    primaryColor: '#f43f5e', // rose-500
    secondaryColor: '#fb7185',
    glowColor: 'rgba(244, 63, 94, 0.7)',
    visorColor: '#ffe4e6',
    trailColor: 'rgba(244, 63, 94, 0.4)',
  },
  {
    id: 'solar_amber',
    name: 'Solar Flare',
    tagline: 'Hyper-Charged Accelerator',
    cost: 150,
    primaryColor: '#f59e0b', // amber-500
    secondaryColor: '#fbbf24',
    glowColor: 'rgba(245, 158, 11, 0.7)',
    visorColor: '#fef3c7',
    trailColor: 'rgba(245, 158, 11, 0.4)',
  },
  {
    id: 'matrix_green',
    name: 'Code Phantom',
    tagline: 'Sub-Zero Logic Unit',
    cost: 250,
    primaryColor: '#10b981', // emerald-500
    secondaryColor: '#34d399',
    glowColor: 'rgba(16, 185, 129, 0.7)',
    visorColor: '#d1fae5',
    trailColor: 'rgba(16, 185, 129, 0.4)',
  },
  {
    id: 'void_violet',
    name: 'Void Runner',
    tagline: 'Quantum Warp Infiltrator',
    cost: 400,
    primaryColor: '#a855f7', // purple-500
    secondaryColor: '#c084fc',
    glowColor: 'rgba(168, 85, 247, 0.7)',
    visorColor: '#f3e8ff',
    trailColor: 'rgba(168, 85, 247, 0.4)',
  },
  {
    id: 'chroma_god',
    name: 'Neon Sovereign',
    tagline: 'Legend of the Grid',
    cost: 700,
    primaryColor: '#ec4899',
    secondaryColor: '#06b6d4',
    glowColor: 'rgba(236, 72, 153, 0.8)',
    visorColor: '#fef08a',
    trailColor: 'rgba(6, 182, 212, 0.6)',
  },
];

export type ObstacleType = 
  | 'SPIKE'          // Jump over (ground level)
  | 'HIGH_LASER'     // Slide under (suspended in air)
  | 'DOUBLE_BARRIER' // High jump or double jump
  | 'CYBER_DRONE'    // Bobbing aerial menace
  | 'PLATFORM';      // Elevated runway

export interface Obstacle {
  id: number;
  type: ObstacleType;
  x: number;
  y: number;
  width: number;
  height: number;
  passed: boolean;
  canShatter?: boolean;
  baseY?: number;
  hoverTimer?: number;
}

export type CollectibleType = 'COIN' | 'GEM' | 'POWER_MAGNET' | 'POWER_SHIELD' | 'POWER_NITRO' | 'POWER_2X';

export interface Collectible {
  id: number;
  type: CollectibleType;
  x: number;
  y: number;
  radius: number;
  collected: boolean;
  pulseTimer: number;
  value: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  maxLife: number;
  life: number;
  alpha: number;
  shape?: 'circle' | 'square' | 'line';
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  size: number;
}

export interface PlayerState {
  x: number;
  y: number;
  width: number;
  height: number;
  vy: number;
  isGrounded: boolean;
  isJumping: boolean;
  canDoubleJump: boolean;
  isSliding: boolean;
  slideTimer: number;
  runCycle: number;
  coyoteTimer: number;
  jumpBufferTimer: number;
  
  // Powerups active time remaining (seconds)
  shieldActive: boolean;
  magnetTimer: number;
  nitroTimer: number;
  multiplierTimer: number;
  
  // After-image ghosts for speed visual
  ghosts: Array<{ x: number; y: number; width: number; height: number; alpha: number; color: string; isSliding: boolean }>;
}

export interface RunStats {
  score: number;
  distance: number;
  coins: number;
  gems: number;
  obstaclesDodged: number;
  speedMultiplier: number;
  isNewHighscore: boolean;
}
