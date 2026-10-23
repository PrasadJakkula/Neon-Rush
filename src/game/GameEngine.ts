import { sound } from '../audio/audioEngine';
import {
  Collectible,
  FloatingText,
  GameState,
  Obstacle,
  Particle,
  PlayerState,
  RunStats,
  Skin,
  SKINS,
} from './types';

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  // Resolution constants
  public static readonly VIRTUAL_WIDTH = 1200;
  public static readonly VIRTUAL_HEIGHT = 675;
  public static readonly GROUND_Y = 520;

  // Physics constants
  private static readonly GRAVITY = 1950;
  private static readonly JUMP_VELOCITY = -820;
  private static readonly DOUBLE_JUMP_VELOCITY = -740;
  private static readonly SLIDE_DURATION = 0.65;
  private static readonly COYOTE_TIME = 0.12;
  private static readonly JUMP_BUFFER_TIME = 0.15;
  private static readonly BASE_SPEED = 460;
  private static readonly MAX_SPEED = 1050;

  // Game state
  public state: GameState = 'MENU';
  private activeSkin: Skin = SKINS[0];
  private currentSpeed: number = GameEngine.BASE_SPEED;
  private distance: number = 0;
  private score: number = 0;
  private sessionCoins: number = 0;
  private sessionGems: number = 0;
  private obstaclesDodged: number = 0;
  private highscore: number = 0;
  private totalCoins: number = 0;

  // Combo system
  private coinCombo: number = 0;
  private comboTimer: number = 0;

  // Player
  private player: PlayerState = {
    x: 180,
    y: GameEngine.GROUND_Y - 76,
    width: 44,
    height: 76,
    vy: 0,
    isGrounded: true,
    isJumping: false,
    canDoubleJump: true,
    isSliding: false,
    slideTimer: 0,
    runCycle: 0,
    coyoteTimer: 0,
    jumpBufferTimer: 0,
    shieldActive: false,
    magnetTimer: 0,
    nitroTimer: 0,
    multiplierTimer: 0,
    ghosts: [],
  };

  // World objects
  private obstacles: Obstacle[] = [];
  private collectibles: Collectible[] = [];
  private particles: Particle[] = [];
  private floatingTexts: FloatingText[] = [];

  // Parallax backdrop
  private stars: Array<{ x: number; y: number; size: number; speed: number; alpha: number; pulse: number }> = [];
  private cityBuildingsFar: Array<{ x: number; width: number; height: number; windows: boolean[] }> = [];
  private cityBuildingsNear: Array<{ x: number; width: number; height: number; sign?: string }> = [];
  private groundGridOffset: number = 0;

  // Spawn tracking
  private nextObstacleDistance: number = 700;
  private nextCollectibleDistance: number = 400;
  private lastTime: number = 0;
  private animFrameId: number | null = null;
  private isHoldingJump: boolean = false;

  // Camera shake
  private screenShake: number = 0;

  // Callbacks to UI
  private onStatsUpdate?: (stats: RunStats, powerups: { shield: boolean; magnet: number; nitro: number; mult: number }) => void;
  private onGameOverCallback?: (stats: RunStats) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not get 2D canvas context');
    this.ctx = context;

    this.loadPersistedData();
    this.initEnvironment();
    this.handleResize();
    window.addEventListener('resize', this.handleResize);
  }

  public destroy() {
    window.removeEventListener('resize', this.handleResize);
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
  }

  public setCallbacks(
    onStats: (stats: RunStats, powerups: { shield: boolean; magnet: number; nitro: number; mult: number }) => void,
    onGameOver: (stats: RunStats) => void
  ) {
    this.onStatsUpdate = onStats;
    this.onGameOverCallback = onGameOver;
  }

  public setSkin(skin: Skin) {
    this.activeSkin = skin;
  }

  public getSkin(): Skin {
    return this.activeSkin;
  }

  private loadPersistedData() {
    try {
      const savedHigh = localStorage.getItem('neon_rush_highscore');
      const savedCoins = localStorage.getItem('neon_rush_coins');
      if (savedHigh) this.highscore = parseInt(savedHigh, 10) || 0;
      if (savedCoins) this.totalCoins = parseInt(savedCoins, 10) || 0;
    } catch {}
  }

  private savePersistedData() {
    try {
      localStorage.setItem('neon_rush_highscore', this.highscore.toString());
      localStorage.setItem('neon_rush_coins', this.totalCoins.toString());
    } catch {}
  }

  public getTotalCoins(): number {
    return this.totalCoins;
  }

  public getHighscore(): number {
    return this.highscore;
  }

  public spendCoins(amount: number): boolean {
    if (this.totalCoins >= amount) {
      this.totalCoins -= amount;
      this.savePersistedData();
      return true;
    }
    return false;
  }

  private handleResize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = this.canvas.getBoundingClientRect();
    
    // Set actual canvas internal pixel dimensions matching screen display
    this.canvas.width = Math.floor(rect.width * dpr);
    this.canvas.height = Math.floor(rect.height * dpr);
  };

  private initEnvironment() {
    // Generate starfield
    this.stars = [];
    for (let i = 0; i < 90; i++) {
      this.stars.push({
        x: Math.random() * GameEngine.VIRTUAL_WIDTH,
        y: Math.random() * 320,
        size: Math.random() * 2 + 0.8,
        speed: Math.random() * 15 + 10,
        alpha: Math.random() * 0.7 + 0.3,
        pulse: Math.random() * Math.PI * 2,
      });
    }

    // Distant city silhouette
    this.cityBuildingsFar = [];
    let curX = 0;
    while (curX < GameEngine.VIRTUAL_WIDTH * 2) {
      const w = 45 + Math.random() * 55;
      const h = 100 + Math.random() * 160;
      const windows: boolean[] = [];
      const count = Math.floor((h / 18) * (w / 14));
      for (let j = 0; j < count; j++) windows.push(Math.random() > 0.4);

      this.cityBuildingsFar.push({ x: curX, width: w, height: h, windows });
      curX += w + Math.random() * 10;
    }

    // Near city skyline
    this.cityBuildingsNear = [];
    curX = 0;
    const signs = ['CYBER', 'NEON', 'OVERDRIVE', 'GRID', 'SYNTH', 'HYPER', 'ZENITH', 'NEXUS'];
    while (curX < GameEngine.VIRTUAL_WIDTH * 2) {
      const w = 60 + Math.random() * 80;
      const h = 140 + Math.random() * 200;
      const sign = Math.random() > 0.6 ? signs[Math.floor(Math.random() * signs.length)] : undefined;
      this.cityBuildingsNear.push({ x: curX, width: w, height: h, sign });
      curX += w + 20 + Math.random() * 35;
    }
  }

  // --- Game Lifecycle ---

  public startGame() {
    this.state = 'PLAYING';
    this.currentSpeed = GameEngine.BASE_SPEED;
    this.distance = 0;
    this.score = 0;
    this.sessionCoins = 0;
    this.sessionGems = 0;
    this.obstaclesDodged = 0;
    this.coinCombo = 0;
    this.comboTimer = 0;
    this.screenShake = 0;

    this.player = {
      x: 180,
      y: GameEngine.GROUND_Y - 76,
      width: 44,
      height: 76,
      vy: 0,
      isGrounded: true,
      isJumping: false,
      canDoubleJump: true,
      isSliding: false,
      slideTimer: 0,
      runCycle: 0,
      coyoteTimer: 0,
      jumpBufferTimer: 0,
      shieldActive: false,
      magnetTimer: 0,
      nitroTimer: 0,
      multiplierTimer: 0,
      ghosts: [],
    };

    this.obstacles = [];
    this.collectibles = [];
    this.particles = [];
    this.floatingTexts = [];
    this.nextObstacleDistance = 800;
    this.nextCollectibleDistance = 400;

    sound.startMusic();
    sound.setGameSpeedMultiplier(1.0);
    sound.playPowerup();

    this.addFloatingText(GameEngine.VIRTUAL_WIDTH / 2, 280, 'RUSH START!', '#06b6d4', 36);
  }

  public pauseGame() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      sound.stopMusic();
    }
  }

  public resumeGame() {
    if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      this.lastTime = performance.now();
      sound.startMusic();
    }
  }

  public restartGame() {
    this.startGame();
  }

  public returnToMenu() {
    this.state = 'MENU';
    sound.stopMusic();
  }

  // --- Input Handlers ---

  public handleJumpPress() {
    if (this.state !== 'PLAYING') return;
    this.isHoldingJump = true;
    this.player.jumpBufferTimer = GameEngine.JUMP_BUFFER_TIME;

    // Slide cancel into jump
    if (this.player.isSliding) {
      this.player.isSliding = false;
      this.player.height = 76;
      this.player.y = GameEngine.GROUND_Y - 76;
    }

    // Direct jump if grounded or within coyote time
    if (this.player.isGrounded || this.player.coyoteTimer > 0) {
      this.performJump(false);
    } else if (this.player.canDoubleJump) {
      this.performJump(true);
    }
  }

  public handleJumpRelease() {
    this.isHoldingJump = false;
    // Variable jump height: cut vertical ascent if released early
    if (this.player.vy < -300) {
      this.player.vy = -300;
    }
  }

  public handleSlidePress() {
    if (this.state !== 'PLAYING') return;

    // Fast fall if mid-air
    if (!this.player.isGrounded) {
      this.player.vy = Math.max(this.player.vy, 900);
      this.createJumpParticles(this.player.x + 22, this.player.y + 40, '#f43f5e', 8);
    }

    // Trigger slide
    if (!this.player.isSliding) {
      this.player.isSliding = true;
      this.player.slideTimer = GameEngine.SLIDE_DURATION;
      this.player.height = 38;
      this.player.y += 38;
      sound.playSlide();

      // Slide sparks
      this.createSlideSparks();
    } else {
      // Re-up slide timer if already sliding
      this.player.slideTimer = GameEngine.SLIDE_DURATION;
    }
  }

  public handleSlideRelease() {
    // Optionally allow holding or auto-duration; slide auto-settles when duration ends
  }

  private performJump(isDouble: boolean) {
    if (isDouble) {
      this.player.vy = GameEngine.DOUBLE_JUMP_VELOCITY;
      this.player.canDoubleJump = false;
      this.player.isJumping = true;
      this.player.isGrounded = false;
      this.player.coyoteTimer = 0;
      sound.playDoubleJump();

      // Double jump neon pulse ring
      this.createRingBurst(this.player.x + 22, this.player.y + 50, this.activeSkin.primaryColor);
      this.addFloatingText(this.player.x + 22, this.player.y - 10, 'DOUBLE JUMP!', '#38bdf8', 18);
    } else {
      this.player.vy = GameEngine.JUMP_VELOCITY;
      this.player.isGrounded = false;
      this.player.isJumping = true;
      this.player.coyoteTimer = 0;
      sound.playJump();

      // Ground jump sparks
      this.createJumpParticles(this.player.x + 22, this.player.y + 76, this.activeSkin.primaryColor, 12);
    }
  }

  // --- Main Engine Loop ---

  public startLoop() {
    this.lastTime = performance.now();
    const loop = (currentTime: number) => {
      const dt = Math.min((currentTime - this.lastTime) / 1000, 0.08); // Cap delta to prevent huge jumps on tab switch
      this.lastTime = currentTime;

      this.update(dt);
      this.render();

      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  private update(dt: number) {
    // Parallax stars even in menu for gorgeous dynamic background
    this.updateBackground(dt);

    if (this.state !== 'PLAYING') {
      // Still update ambient particles in menu/gameover
      this.updateParticles(dt);
      return;
    }

    // Speed progression: increases smoothly with distance
    const speedMultiplier = 1 + Math.min(this.distance / 1600, 1.4);
    this.currentSpeed = Math.min(GameEngine.BASE_SPEED * speedMultiplier, GameEngine.MAX_SPEED);
    sound.setGameSpeedMultiplier(speedMultiplier);

    // Distance & Score progression
    const distanceDelta = this.currentSpeed * dt * 0.1;
    this.distance += distanceDelta;
    const scoreMultiplier = this.player.multiplierTimer > 0 ? 2 : 1;
    this.score += Math.floor(distanceDelta * 2 * scoreMultiplier);

    // Combo timer decay
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.coinCombo = 0;
      }
    }

    // Screen shake decay
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 25);
    }

    // Player power-up timers
    if (this.player.magnetTimer > 0) this.player.magnetTimer -= dt;
    if (this.player.nitroTimer > 0) {
      this.player.nitroTimer -= dt;
      this.currentSpeed *= 1.35; // Nitro extra speed
    }
    if (this.player.multiplierTimer > 0) this.player.multiplierTimer -= dt;

    // Update Player Physics
    this.updatePlayer(dt);

    // Spawning & World updates
    this.updateSpawning(dt);
    this.updateObstacles(dt);
    this.updateCollectibles(dt);
    this.updateParticles(dt);
    this.updateFloatingTexts(dt);

    // Notify React HUD
    if (this.onStatsUpdate) {
      this.onStatsUpdate(
        {
          score: this.score,
          distance: Math.floor(this.distance),
          coins: this.sessionCoins,
          gems: this.sessionGems,
          obstaclesDodged: this.obstaclesDodged,
          speedMultiplier: parseFloat(speedMultiplier.toFixed(2)),
          isNewHighscore: this.score > this.highscore && this.highscore > 0,
        },
        {
          shield: this.player.shieldActive,
          magnet: Math.max(0, this.player.magnetTimer),
          nitro: Math.max(0, this.player.nitroTimer),
          mult: Math.max(0, this.player.multiplierTimer),
        }
      );
    }
  }

  private updatePlayer(dt: number) {
    const p = this.player;

    // Jump buffering
    if (p.jumpBufferTimer > 0) {
      p.jumpBufferTimer -= dt;
      if (p.isGrounded) {
        this.performJump(false);
        p.jumpBufferTimer = 0;
      }
    }

    // Coyote time countdown
    if (!p.isGrounded && p.coyoteTimer > 0) {
      p.coyoteTimer -= dt;
    }

    // Slide duration
    if (p.isSliding) {
      p.slideTimer -= dt;
      this.createSlideSparks();
      if (p.slideTimer <= 0) {
        p.isSliding = false;
        p.height = 76;
        p.y -= 38; // restore vertical height
      }
    }

    // Apply Gravity
    p.vy += GameEngine.GRAVITY * dt;
    p.y += p.vy * dt;

    // Check collision with ground & platforms
    let currentFloor = GameEngine.GROUND_Y;

    // Check if player lands on an elevated platform
    for (const obs of this.obstacles) {
      if (obs.type === 'PLATFORM') {
        const obsLeft = obs.x;
        const obsRight = obs.x + obs.width;
        const playerCenter = p.x + p.width / 2;
        if (playerCenter >= obsLeft && playerCenter <= obsRight) {
          const platTop = obs.y;
          // Landing condition: coming from above or on top
          if (p.y + p.height >= platTop && p.y + p.height - p.vy * dt <= platTop + 24) {
            currentFloor = platTop;
            break;
          }
        }
      }
    }

    if (p.y + p.height >= currentFloor) {
      p.y = currentFloor - p.height;
      if (!p.isGrounded && p.vy > 100) {
        // Landing dust particles
        this.createJumpParticles(p.x + p.width / 2, p.y + p.height, this.activeSkin.primaryColor, 6);
      }
      p.vy = 0;
      p.isGrounded = true;
      p.isJumping = false;
      p.canDoubleJump = true;
    } else {
      if (p.isGrounded) {
        // Just walked off a platform
        p.isGrounded = false;
        p.coyoteTimer = GameEngine.COYOTE_TIME;
      }
    }

    // Run cycle animation
    if (p.isGrounded && !p.isSliding) {
      p.runCycle += dt * (this.currentSpeed / 25);
    }

    // Record ghost trail after-images
    if (Math.random() > 0.4 || p.nitroTimer > 0) {
      p.ghosts.unshift({
        x: p.x,
        y: p.y,
        width: p.width,
        height: p.height,
        alpha: p.nitroTimer > 0 ? 0.65 : 0.35,
        color: p.nitroTimer > 0 ? (Math.random() > 0.5 ? '#f43f5e' : '#06b6d4') : this.activeSkin.trailColor,
        isSliding: p.isSliding,
      });
      if (p.ghosts.length > 8) p.ghosts.pop();
    }

    // Fade ghosts
    for (const g of p.ghosts) {
      g.alpha -= dt * 3.5;
    }
    p.ghosts = p.ghosts.filter(g => g.alpha > 0);
  }

  private updateBackground(dt: number) {
    const moveRate = (this.state === 'PLAYING' ? this.currentSpeed : 70) * dt;

    // Stars
    for (const s of this.stars) {
      s.x -= s.speed * dt * (this.state === 'PLAYING' ? 1.2 : 0.5);
      if (s.x < 0) s.x = GameEngine.VIRTUAL_WIDTH + Math.random() * 20;
      s.pulse += dt * 3;
    }

    // Far skyline
    for (const b of this.cityBuildingsFar) {
      b.x -= moveRate * 0.12;
      if (b.x + b.width < 0) {
        b.x = GameEngine.VIRTUAL_WIDTH + 20;
      }
    }

    // Near skyline
    for (const b of this.cityBuildingsNear) {
      b.x -= moveRate * 0.32;
      if (b.x + b.width < 0) {
        b.x = GameEngine.VIRTUAL_WIDTH + 40;
      }
    }

    // Ground 3D perspective grid lines
    this.groundGridOffset = (this.groundGridOffset + moveRate * 1.5) % 80;
  }

  private updateSpawning(dt: number) {
    const moveDelta = this.currentSpeed * dt;
    this.nextObstacleDistance -= moveDelta;
    this.nextCollectibleDistance -= moveDelta;

    // Spawn obstacles
    if (this.nextObstacleDistance <= 0) {
      this.spawnObstaclePattern();
      // Distance between obstacles decreases slightly as speed increases
      const minGap = Math.max(380, 720 - (this.currentSpeed - GameEngine.BASE_SPEED) * 0.4);
      const randomAdd = Math.random() * 320;
      this.nextObstacleDistance = minGap + randomAdd;
    }

    // Spawn collectibles (coin arcs, gems, power-ups)
    if (this.nextCollectibleDistance <= 0) {
      this.spawnCollectiblePattern();
      this.nextCollectibleDistance = 350 + Math.random() * 450;
    }
  }

  private spawnObstaclePattern() {
    const r = Math.random();
    const spawnX = GameEngine.VIRTUAL_WIDTH + 100;
    const groundY = GameEngine.GROUND_Y;

    if (r < 0.28) {
      // Ground Spikes / Plasma Mine
      this.obstacles.push({
        id: Math.random(),
        type: 'SPIKE',
        x: spawnX,
        y: groundY - 44,
        width: 44,
        height: 44,
        passed: false,
      });
    } else if (r < 0.50) {
      // High Laser Beam (Requires SLIDE!)
      this.obstacles.push({
        id: Math.random(),
        type: 'HIGH_LASER',
        x: spawnX,
        y: groundY - 88,
        width: 80,
        height: 48, // Suspended so player can slide underneath (player slide height = 38)
        passed: false,
      });
    } else if (r < 0.70) {
      // Floating Cyber Drone (Bobbing vertically)
      this.obstacles.push({
        id: Math.random(),
        type: 'CYBER_DRONE',
        x: spawnX,
        y: groundY - 110,
        width: 46,
        height: 38,
        baseY: groundY - 110,
        hoverTimer: Math.random() * Math.PI * 2,
        passed: false,
      });
    } else if (r < 0.86) {
      // Floating Platform with coins on top!
      const platWidth = 280 + Math.random() * 120;
      const platY = groundY - 130;
      this.obstacles.push({
        id: Math.random(),
        type: 'PLATFORM',
        x: spawnX,
        y: platY,
        width: platWidth,
        height: 22,
        passed: false,
      });

      // Spawn coins along the elevated platform
      const coinCount = Math.floor(platWidth / 55);
      for (let i = 0; i < coinCount; i++) {
        this.collectibles.push({
          id: Math.random(),
          type: 'COIN',
          x: spawnX + 35 + i * 50,
          y: platY - 30,
          radius: 13,
          collected: false,
          pulseTimer: Math.random(),
          value: 10,
        });
      }
    } else {
      // Tall Energy Barrier (Needs high jump / double jump)
      this.obstacles.push({
        id: Math.random(),
        type: 'DOUBLE_BARRIER',
        x: spawnX,
        y: groundY - 80,
        width: 50,
        height: 80,
        passed: false,
      });
    }
  }

  private spawnCollectiblePattern() {
    const spawnX = GameEngine.VIRTUAL_WIDTH + 80;
    const groundY = GameEngine.GROUND_Y;
    const r = Math.random();

    if (r < 0.55) {
      // Coin Arc / Wave
      const count = 5 + Math.floor(Math.random() * 4);
      for (let i = 0; i < count; i++) {
        const progress = i / (count - 1);
        const arcY = groundY - 50 - Math.sin(progress * Math.PI) * 90;
        this.collectibles.push({
          id: Math.random(),
          type: 'COIN',
          x: spawnX + i * 45,
          y: arcY,
          radius: 13,
          collected: false,
          pulseTimer: i * 0.2,
          value: 10,
        });
      }
    } else if (r < 0.75) {
      // High-Value Cyber Gem
      this.collectibles.push({
        id: Math.random(),
        type: 'GEM',
        x: spawnX,
        y: groundY - 95,
        radius: 16,
        collected: false,
        pulseTimer: 0,
        value: 50,
      });
    } else {
      // Rare Power-up!
      const powerRoll = Math.random();
      let powerType: Collectible['type'] = 'POWER_MAGNET';
      if (powerRoll < 0.28) powerType = 'POWER_SHIELD';
      else if (powerRoll < 0.55) powerType = 'POWER_NITRO';
      else if (powerRoll < 0.78) powerType = 'POWER_2X';

      this.collectibles.push({
        id: Math.random(),
        type: powerType,
        x: spawnX,
        y: groundY - 80,
        radius: 20,
        collected: false,
        pulseTimer: 0,
        value: 100,
      });
    }
  }

  private updateObstacles(dt: number) {
    const moveDelta = this.currentSpeed * dt;

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.x -= moveDelta;

      // Bobbing drone motion
      if (obs.type === 'CYBER_DRONE' && obs.baseY !== undefined && obs.hoverTimer !== undefined) {
        obs.hoverTimer += dt * 3.5;
        obs.y = obs.baseY + Math.sin(obs.hoverTimer) * 26;
      }

      // Check dodged stat
      if (!obs.passed && obs.x + obs.width < this.player.x) {
        obs.passed = true;
        this.obstaclesDodged++;
        this.score += 25;
      }

      // Collision Check
      if (this.checkCollision(this.player, obs)) {
        if (this.player.nitroTimer > 0) {
          // Nitro invulnerability: smash through obstacle!
          sound.playHit();
          this.triggerScreenShake(7);
          this.createExplosion(obs.x + obs.width / 2, obs.y + obs.height / 2, '#f43f5e', 22);
          this.addFloatingText(obs.x + obs.width / 2, obs.y, 'SMASHED! +100', '#f59e0b', 20);
          this.score += 100;
          this.obstacles.splice(i, 1);
          continue;
        } else if (this.player.shieldActive) {
          // Shield absorbs impact!
          this.player.shieldActive = false;
          sound.playShieldBreak();
          this.triggerScreenShake(12);
          this.createRingBurst(this.player.x + 22, this.player.y + 38, '#38bdf8');
          this.createExplosion(obs.x + obs.width / 2, obs.y + obs.height / 2, '#38bdf8', 18);
          this.addFloatingText(this.player.x + 22, this.player.y - 20, 'SHIELD BROKEN!', '#38bdf8', 22);
          this.obstacles.splice(i, 1);
          continue;
        } else {
          // Lethal Crash: Game Over!
          this.handleGameOver();
          return;
        }
      }

      // Cleanup off-screen
      if (obs.x + obs.width < -100) {
        this.obstacles.splice(i, 1);
      }
    }
  }

  private checkCollision(player: PlayerState, obs: Obstacle): boolean {
    if (obs.type === 'PLATFORM') {
      // Platform top is walkable; only collide if hitting the side directly while lower than the top
      const pRight = player.x + player.width;
      const pLeft = player.x;
      const pBottom = player.y + player.height;
      const pTop = player.y;

      if (pRight > obs.x + 4 && pLeft < obs.x + obs.width - 4) {
        // If player head or body crashes into the side of platform
        if (pTop < obs.y + obs.height && pBottom > obs.y + 14) {
          return true;
        }
      }
      return false;
    }

    // Inset hitboxes by 6px for forgiving, crisp arcade feel (anti-frustration)
    const margin = 7;
    const pLeft = player.x + margin;
    const pRight = player.x + player.width - margin;
    const pTop = player.y + margin;
    const pBottom = player.y + player.height;

    const oLeft = obs.x + margin;
    const oRight = obs.x + obs.width - margin;
    const oTop = obs.y + (obs.type === 'SPIKE' ? 12 : margin);
    const oBottom = obs.y + obs.height;

    return pRight > oLeft && pLeft < oRight && pBottom > oTop && pTop < oBottom;
  }

  private updateCollectibles(dt: number) {
    const moveDelta = this.currentSpeed * dt;

    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const c = this.collectibles[i];
      c.x -= moveDelta;
      c.pulseTimer += dt * 4;

      // Magnet pull logic
      if (this.player.magnetTimer > 0) {
        const dx = (this.player.x + this.player.width / 2) - c.x;
        const dy = (this.player.y + this.player.height / 2) - c.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 380) {
          const pullSpeed = 950 * dt;
          c.x += (dx / dist) * pullSpeed;
          c.y += (dy / dist) * pullSpeed;

          // Magnet trail spark
          if (Math.random() > 0.6) {
            this.particles.push({
              x: c.x,
              y: c.y,
              vx: (Math.random() - 0.5) * 60,
              vy: (Math.random() - 0.5) * 60,
              color: '#c084fc',
              size: 2,
              maxLife: 0.25,
              life: 0.25,
              alpha: 0.7,
            });
          }
        }
      }

      // Check player pickup
      const pCenterX = this.player.x + this.player.width / 2;
      const pCenterY = this.player.y + this.player.height / 2;
      const distToPlayer = Math.hypot(pCenterX - c.x, pCenterY - c.y);

      if (distToPlayer < c.radius + this.player.width / 2 + 10) {
        this.collectItem(c);
        this.collectibles.splice(i, 1);
        continue;
      }

      // Offscreen cleanup
      if (c.x + c.radius < -50) {
        this.collectibles.splice(i, 1);
      }
    }
  }

  private collectItem(item: Collectible) {
    const isDouble = this.player.multiplierTimer > 0;
    const mult = isDouble ? 2 : 1;

    if (item.type === 'COIN') {
      this.sessionCoins += 1 * mult;
      this.totalCoins += 1 * mult;
      this.score += 15 * mult;
      this.coinCombo++;
      this.comboTimer = 1.4;
      sound.playCoin(this.coinCombo);

      this.createCollectParticles(item.x, item.y, '#f59e0b', 8);
      if (this.coinCombo > 1 && this.coinCombo % 5 === 0) {
        this.addFloatingText(item.x, item.y - 15, `${this.coinCombo}X COMBO!`, '#fbbf24', 18);
      }
    } else if (item.type === 'GEM') {
      this.sessionGems += 1;
      this.sessionCoins += 5 * mult;
      this.totalCoins += 5 * mult;
      this.score += 80 * mult;
      sound.playGem();

      this.createRingBurst(item.x, item.y, '#06b6d4');
      this.createCollectParticles(item.x, item.y, '#38bdf8', 14);
      this.addFloatingText(item.x, item.y - 20, `+${80 * mult} GEM!`, '#38bdf8', 22);
    } else if (item.type === 'POWER_SHIELD') {
      this.player.shieldActive = true;
      sound.playPowerup();
      this.createRingBurst(this.player.x + 22, this.player.y + 38, '#38bdf8');
      this.addFloatingText(this.player.x + 22, this.player.y - 25, 'ENERGY SHIELD!', '#38bdf8', 24);
    } else if (item.type === 'POWER_MAGNET') {
      this.player.magnetTimer = 10;
      sound.playPowerup();
      this.createRingBurst(this.player.x + 22, this.player.y + 38, '#c084fc');
      this.addFloatingText(this.player.x + 22, this.player.y - 25, 'COIN MAGNET 10s!', '#c084fc', 24);
    } else if (item.type === 'POWER_NITRO') {
      this.player.nitroTimer = 6;
      sound.playPowerup();
      this.triggerScreenShake(6);
      this.createRingBurst(this.player.x + 22, this.player.y + 38, '#f43f5e');
      this.addFloatingText(this.player.x + 22, this.player.y - 25, 'HYPER NITRO 6s!', '#f43f5e', 24);
    } else if (item.type === 'POWER_2X') {
      this.player.multiplierTimer = 12;
      sound.playPowerup();
      this.createRingBurst(this.player.x + 22, this.player.y + 38, '#ec4899');
      this.addFloatingText(this.player.x + 22, this.player.y - 25, '2X MULTIPLIER 12s!', '#ec4899', 24);
    }
  }

  private handleGameOver() {
    this.state = 'GAME_OVER';
    sound.stopMusic();
    sound.playHit();
    sound.playGameOver();
    this.triggerScreenShake(20);

    // Huge crash particle burst
    this.createExplosion(this.player.x + 22, this.player.y + 38, this.activeSkin.primaryColor, 35);
    this.createExplosion(this.player.x + 22, this.player.y + 38, '#f43f5e', 25);

    const isNewHigh = this.score > this.highscore;
    if (isNewHigh) {
      this.highscore = this.score;
    }
    this.savePersistedData();

    const finalStats: RunStats = {
      score: this.score,
      distance: Math.floor(this.distance),
      coins: this.sessionCoins,
      gems: this.sessionGems,
      obstaclesDodged: this.obstaclesDodged,
      speedMultiplier: parseFloat((this.currentSpeed / GameEngine.BASE_SPEED).toFixed(2)),
      isNewHighscore: isNewHigh,
    };

    if (this.onGameOverCallback) {
      this.onGameOverCallback(finalStats);
    }
  }

  // --- Visual Effects & Particles ---

  private triggerScreenShake(magnitude: number) {
    this.screenShake = magnitude;
  }

  private createSlideSparks() {
    const p = this.player;
    this.particles.push({
      x: p.x + Math.random() * 20,
      y: GameEngine.GROUND_Y - 2,
      vx: -(this.currentSpeed * 0.4 + Math.random() * 120),
      vy: -(Math.random() * 140 + 20),
      color: Math.random() > 0.4 ? this.activeSkin.primaryColor : '#fef08a',
      size: Math.random() * 3 + 1.5,
      maxLife: 0.35,
      life: 0.35,
      alpha: 0.9,
    });
  }

  private createJumpParticles(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y,
        vx: (Math.random() - 0.5) * 260 - this.currentSpeed * 0.2,
        vy: Math.random() * 120 - 40,
        color: color,
        size: Math.random() * 3.5 + 2,
        maxLife: 0.4,
        life: 0.4,
        alpha: 0.85,
      });
    }
  }

  private createCollectParticles(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const speed = Math.random() * 160 + 80;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: color,
        size: Math.random() * 3.5 + 2,
        maxLife: 0.45,
        life: 0.45,
        alpha: 1,
      });
    }
  }

  private createExplosion(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 320 + 80;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 60,
        color: color,
        size: Math.random() * 5 + 2,
        maxLife: 0.7,
        life: 0.7,
        alpha: 1,
      });
    }
  }

  private createRingBurst(x: number, y: number, color: string) {
    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 * i) / 20;
      const speed = 200;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: color,
        size: 3,
        maxLife: 0.35,
        life: 0.35,
        alpha: 0.9,
      });
    }
  }

  private addFloatingText(x: number, y: number, text: string, color: string, size: number = 20) {
    this.floatingTexts.push({
      id: Math.random(),
      x,
      y,
      text,
      color,
      alpha: 1,
      life: 0.9,
      maxLife: 0.9,
      size,
    });
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 380 * dt; // slight particle gravity
      p.life -= dt;
      p.alpha = Math.max(0, p.life / p.maxLife);

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private updateFloatingTexts(dt: number) {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= 45 * dt; // float upwards
      ft.life -= dt;
      ft.alpha = Math.max(0, ft.life / ft.maxLife);

      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  // --- Rendering Pipeline ---

  private render() {
    const ctx = this.ctx;
    const canvas = this.canvas;

    ctx.save();

    // Scale canvas context to match virtual resolution (1200 x 675)
    const scaleX = canvas.width / GameEngine.VIRTUAL_WIDTH;
    const scaleY = canvas.height / GameEngine.VIRTUAL_HEIGHT;
    ctx.scale(scaleX, scaleY);

    // Apply Screen Shake
    if (this.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShake;
      const shakeY = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(shakeX, shakeY);
    }

    // 1. Synthwave Sky Backdrop
    const skyGradient = ctx.createLinearGradient(0, 0, 0, GameEngine.GROUND_Y);
    skyGradient.addColorStop(0, '#040212');
    skyGradient.addColorStop(0.45, '#12072b');
    skyGradient.addColorStop(0.85, '#2e0844');
    skyGradient.addColorStop(1, '#530b58');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, GameEngine.VIRTUAL_WIDTH, GameEngine.VIRTUAL_HEIGHT);

    // 2. Stars
    for (const star of this.stars) {
      ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha * (0.6 + Math.sin(star.pulse) * 0.4)})`;
      ctx.fillRect(star.x, star.y, star.size, star.size);
    }

    // 3. Giant Retro Synthwave Sun
    this.renderSynthwaveSun(ctx);

    // 4. Parallax City Skyline
    this.renderCitySkyline(ctx);

    // 5. Ground Cyber Track (3D perspective grid)
    this.renderCyberTrack(ctx);

    // 6. World Obstacles
    this.renderObstacles(ctx);

    // 7. Collectibles & Power-ups
    this.renderCollectibles(ctx);

    // 8. Player Character
    this.renderPlayer(ctx);

    // 9. Particle System
    this.renderParticles(ctx);

    // 10. Floating Text Popups
    this.renderFloatingTexts(ctx);

    // 11. Nitro Speed Lines Overlay
    if (this.player.nitroTimer > 0) {
      this.renderSpeedLines(ctx);
    }

    ctx.restore();
  }

  private renderSynthwaveSun(ctx: CanvasRenderingContext2D) {
    const sunX = GameEngine.VIRTUAL_WIDTH * 0.68;
    const sunY = 270;
    const sunRadius = 110;

    ctx.save();
    // Sun outer glow
    const glow = ctx.createRadialGradient(sunX, sunY, sunRadius * 0.2, sunX, sunY, sunRadius * 1.8);
    glow.addColorStop(0, 'rgba(244, 63, 94, 0.4)');
    glow.addColorStop(0.5, 'rgba(245, 158, 11, 0.15)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius * 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Clip to Sun circle
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
    ctx.clip();

    // Sun gradient (yellow top to hot pink/purple bottom)
    const sunGrad = ctx.createLinearGradient(sunX, sunY - sunRadius, sunX, sunY + sunRadius);
    sunGrad.addColorStop(0, '#fef08a');
    sunGrad.addColorStop(0.35, '#f59e0b');
    sunGrad.addColorStop(0.7, '#f43f5e');
    sunGrad.addColorStop(1, '#9333ea');
    ctx.fillStyle = sunGrad;
    ctx.fillRect(sunX - sunRadius, sunY - sunRadius, sunRadius * 2, sunRadius * 2);

    // Horizontal blind stripes cutout
    ctx.fillStyle = '#12072b';
    for (let i = 0; i < 9; i++) {
      const stripeY = sunY - 10 + i * 14;
      const stripeH = 2 + i * 1.2;
      ctx.fillRect(sunX - sunRadius, stripeY, sunRadius * 2, stripeH);
    }

    ctx.restore();
  }

  private renderCitySkyline(ctx: CanvasRenderingContext2D) {
    const groundY = GameEngine.GROUND_Y;

    // Distant Far City
    ctx.fillStyle = '#0f0524';
    for (const b of this.cityBuildingsFar) {
      ctx.fillRect(b.x, groundY - b.height, b.width, b.height);
      // Small cyan windows
      ctx.fillStyle = 'rgba(6, 182, 212, 0.35)';
      const rows = Math.floor(b.height / 18);
      const cols = Math.floor(b.width / 14);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c;
          if (b.windows[idx % b.windows.length]) {
            ctx.fillRect(b.x + 5 + c * 12, groundY - b.height + 8 + r * 16, 5, 7);
          }
        }
      }
      ctx.fillStyle = '#0f0524';
    }

    // Midground Near City
    for (const b of this.cityBuildingsNear) {
      // Building silhouette
      ctx.fillStyle = '#190a3a';
      ctx.fillRect(b.x, groundY - b.height, b.width, b.height);

      // Edge neon highlight
      ctx.strokeStyle = 'rgba(236, 72, 153, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(b.x, groundY - b.height, b.width, b.height);

      // Glowing rooftop antennas
      ctx.beginPath();
      ctx.moveTo(b.x + b.width / 2, groundY - b.height);
      ctx.lineTo(b.x + b.width / 2, groundY - b.height - 25);
      ctx.strokeStyle = '#f43f5e';
      ctx.stroke();

      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(b.x + b.width / 2, groundY - b.height - 25, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Cyber Billboard Signs
      if (b.sign) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        const signW = b.width - 12;
        ctx.fillRect(b.x + 6, groundY - b.height + 20, signW, 22);

        ctx.font = 'bold 10px Orbitron, sans-serif';
        ctx.fillStyle = '#06b6d4';
        ctx.textAlign = 'center';
        ctx.fillText(b.sign, b.x + b.width / 2, groundY - b.height + 35);
      }
    }
  }

  private renderCyberTrack(ctx: CanvasRenderingContext2D) {
    const groundY = GameEngine.GROUND_Y;
    const trackH = GameEngine.VIRTUAL_HEIGHT - groundY;

    // Track surface gradient
    const trackGrad = ctx.createLinearGradient(0, groundY, 0, GameEngine.VIRTUAL_HEIGHT);
    trackGrad.addColorStop(0, '#0a031d');
    trackGrad.addColorStop(0.3, '#140529');
    trackGrad.addColorStop(1, '#020108');
    ctx.fillStyle = trackGrad;
    ctx.fillRect(0, groundY, GameEngine.VIRTUAL_WIDTH, trackH);

    // Glowing main neon track boundary line
    ctx.save();
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 15;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(GameEngine.VIRTUAL_WIDTH, groundY);
    ctx.stroke();

    // Secondary sub-line
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, groundY + 6);
    ctx.lineTo(GameEngine.VIRTUAL_WIDTH, groundY + 6);
    ctx.stroke();
    ctx.restore();

    // Vertical perspective grid lines rushing backwards
    ctx.save();
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.22)';
    ctx.lineWidth = 1.5;

    const spacing = 70;
    const startX = -spacing + ((-this.groundGridOffset) % spacing);

    for (let x = startX; x < GameEngine.VIRTUAL_WIDTH + spacing * 2; x += spacing) {
      ctx.beginPath();
      ctx.moveTo(x, groundY);
      // Perspective angle outward
      const bottomX = x - 65;
      ctx.lineTo(bottomX, GameEngine.VIRTUAL_HEIGHT);
      ctx.stroke();
    }

    // Horizontal depth grid bars
    for (let y = groundY + 15; y < GameEngine.VIRTUAL_HEIGHT; y += 24) {
      const alpha = Math.min(0.35, (y - groundY) / 160);
      ctx.strokeStyle = `rgba(244, 63, 94, ${alpha})`;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(GameEngine.VIRTUAL_WIDTH, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  private renderObstacles(ctx: CanvasRenderingContext2D) {
    ctx.save();

    for (const obs of this.obstacles) {
      if (obs.type === 'SPIKE') {
        // Glowing Neon Crystal Spikes
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 12;

        const spikeGrad = ctx.createLinearGradient(obs.x, obs.y + obs.height, obs.x, obs.y);
        spikeGrad.addColorStop(0, '#f43f5e');
        spikeGrad.addColorStop(0.5, '#fb7185');
        spikeGrad.addColorStop(1, '#ffffff');
        ctx.fillStyle = spikeGrad;

        // Draw 3 sharp crystal teeth
        const toothW = obs.width / 3;
        for (let t = 0; t < 3; t++) {
          ctx.beginPath();
          ctx.moveTo(obs.x + t * toothW, obs.y + obs.height);
          ctx.lineTo(obs.x + t * toothW + toothW / 2, obs.y + (t === 1 ? 0 : 8));
          ctx.lineTo(obs.x + (t + 1) * toothW, obs.y + obs.height);
          ctx.closePath();
          ctx.fill();
        }
      } else if (obs.type === 'HIGH_LASER') {
        // High Laser Barrier (Requires Slide underneath)
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 14;

        // Left & Right emitter pods
        ctx.fillStyle = '#334155';
        ctx.fillRect(obs.x, obs.y, 14, obs.height);
        ctx.fillRect(obs.x + obs.width - 14, obs.y, 14, obs.height);

        // Core pulsating laser beam
        const laserGrad = ctx.createLinearGradient(obs.x, obs.y, obs.x, obs.y + obs.height);
        laserGrad.addColorStop(0, 'rgba(245, 158, 11, 0.3)');
        laserGrad.addColorStop(0.5, '#fef08a');
        laserGrad.addColorStop(1, 'rgba(245, 158, 11, 0.3)');
        ctx.fillStyle = laserGrad;
        ctx.fillRect(obs.x + 14, obs.y + 12, obs.width - 28, 22);

        // Danger Warning chevron
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(obs.x + obs.width / 2, obs.y + 23, 6, 0, Math.PI * 2);
        ctx.fill();

        // Down arrow icon indicating "SLIDE"
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(obs.x + obs.width / 2 - 5, obs.y + 20);
        ctx.lineTo(obs.x + obs.width / 2, obs.y + 26);
        ctx.lineTo(obs.x + obs.width / 2 + 5, obs.y + 20);
        ctx.stroke();
      } else if (obs.type === 'CYBER_DRONE') {
        // Hovering Triangular Drone
        ctx.shadowColor = '#ec4899';
        ctx.shadowBlur = 15;

        // Drone hull
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#ec4899';
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        ctx.moveTo(obs.x + obs.width / 2, obs.y);
        ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
        ctx.lineTo(obs.x, obs.y + obs.height);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Pulsing red sensor eye
        const pulse = (Math.sin(Date.now() / 150) + 1) / 2;
        ctx.fillStyle = `rgba(239, 68, 68, ${0.7 + pulse * 0.3})`;
        ctx.beginPath();
        ctx.arc(obs.x + obs.width / 2, obs.y + obs.height * 0.65, 6, 0, Math.PI * 2);
        ctx.fill();

        // Drone thruster sparks
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(obs.x + 8, obs.y + obs.height + 1, 6, 4 + pulse * 4);
        ctx.fillRect(obs.x + obs.width - 14, obs.y + obs.height + 1, 6, 4 + pulse * 4);
      } else if (obs.type === 'PLATFORM') {
        // Elevated Neon Highway
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 10;

        ctx.fillStyle = '#0b0f19';
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);

        // Platform top neon rail
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(obs.x, obs.y, obs.width, 4);

        // Support stanchions
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(obs.x + 30, obs.y + obs.height);
        ctx.lineTo(obs.x + 30, GameEngine.GROUND_Y);
        ctx.moveTo(obs.x + obs.width - 30, obs.y + obs.height);
        ctx.lineTo(obs.x + obs.width - 30, GameEngine.GROUND_Y);
        ctx.stroke();
      } else if (obs.type === 'DOUBLE_BARRIER') {
        // High Barrier (Needs high/double jump)
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 15;

        ctx.fillStyle = '#1e1b4b';
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 3;
        ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);

        // Hazard stripes pattern
        ctx.fillStyle = '#f43f5e';
        for (let s = 0; s < obs.height; s += 16) {
          ctx.fillRect(obs.x + 4, obs.y + s, obs.width - 8, 6);
        }
      }
    }

    ctx.restore();
  }

  private renderCollectibles(ctx: CanvasRenderingContext2D) {
    ctx.save();

    for (const item of this.collectibles) {
      if (item.type === 'COIN') {
        // Spinning Gold Neon Bit
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 12;

        // Elliptical width oscillation to simulate 3D coin spin
        const spinW = Math.max(3, Math.abs(Math.cos(item.pulseTimer * 1.5)) * item.radius);

        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.ellipse(item.x, item.y, spinW, item.radius, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.ellipse(item.x, item.y, spinW * 0.6, item.radius * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (item.type === 'GEM') {
        // Cyan Cyber Diamond
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 18;

        const r = item.radius;
        const gemGrad = ctx.createLinearGradient(item.x - r, item.y - r, item.x + r, item.y + r);
        gemGrad.addColorStop(0, '#ffffff');
        gemGrad.addColorStop(0.4, '#38bdf8');
        gemGrad.addColorStop(1, '#0284c7');
        ctx.fillStyle = gemGrad;

        ctx.beginPath();
        ctx.moveTo(item.x, item.y - r);
        ctx.lineTo(item.x + r, item.y);
        ctx.lineTo(item.x, item.y + r);
        ctx.lineTo(item.x - r, item.y);
        ctx.closePath();
        ctx.fill();

        // Gem facets
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else {
        // Power-Up Orbs
        let orbColor = '#06b6d4';
        let label = 'P';
        if (item.type === 'POWER_SHIELD') {
          orbColor = '#38bdf8';
          label = 'SHIELD';
        } else if (item.type === 'POWER_MAGNET') {
          orbColor = '#c084fc';
          label = 'MAG';
        } else if (item.type === 'POWER_NITRO') {
          orbColor = '#f43f5e';
          label = 'NITRO';
        } else if (item.type === 'POWER_2X') {
          orbColor = '#ec4899';
          label = '2X';
        }

        ctx.shadowColor = orbColor;
        ctx.shadowBlur = 20;

        // Pulsing outer aura ring
        const pulse = Math.sin(item.pulseTimer) * 4;
        ctx.strokeStyle = orbColor;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(item.x, item.y, item.radius + 4 + pulse, 0, Math.PI * 2);
        ctx.stroke();

        // Inner core
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = orbColor;
        ctx.font = 'bold 9px Orbitron, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, item.x, item.y);
      }
    }

    ctx.restore();
  }

  private renderPlayer(ctx: CanvasRenderingContext2D) {
    const p = this.player;
    const skin = this.activeSkin;

    ctx.save();

    // 1. Render Ghost Trail (after-images)
    for (const g of p.ghosts) {
      ctx.save();
      ctx.fillStyle = g.color;
      ctx.globalAlpha = g.alpha;
      ctx.fillRect(g.x, g.y, g.width, g.height);
      ctx.restore();
    }

    // 2. Render Player Character
    ctx.shadowColor = skin.primaryColor;
    ctx.shadowBlur = 18;

    const px = p.x;
    const py = p.y;
    const pw = p.width;
    const ph = p.height;

    if (p.isSliding) {
      // Sleek low streamlined sliding pose
      ctx.fillStyle = skin.primaryColor;
      ctx.fillRect(px, py + 12, pw + 10, ph - 12);

      // Glowing cyber visor
      ctx.fillStyle = skin.visorColor;
      ctx.fillRect(px + pw - 2, py + 16, 12, 8);

      // Cyber jet skid sparks
      ctx.fillStyle = skin.secondaryColor;
      ctx.fillRect(px + 4, py + 14, pw - 8, 4);
    } else {
      // Standing / Running / Jumping Athletic Robot
      const cycle = Math.sin(p.runCycle);
      const legOffset = p.isGrounded ? cycle * 12 : 0;

      // Torso / Core Armor
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = skin.primaryColor;
      ctx.lineWidth = 2.5;
      ctx.fillRect(px + 8, py + 22, pw - 16, 28);
      ctx.strokeRect(px + 8, py + 22, pw - 16, 28);

      // Glowing Chest Energy Core (Heart)
      ctx.fillStyle = skin.secondaryColor;
      ctx.beginPath();
      ctx.arc(px + pw / 2, py + 34, 5, 0, Math.PI * 2);
      ctx.fill();

      // Cyber Helmet & Visor
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(px + 10, py + 4, pw - 20, 18);

      // Glowing Horizontal Visor
      ctx.fillStyle = skin.visorColor;
      ctx.shadowColor = skin.visorColor;
      ctx.shadowBlur = 10;
      ctx.fillRect(px + 14, py + 10, pw - 20, 5);

      // Thruster / Backpack on back
      ctx.fillStyle = skin.primaryColor;
      ctx.fillRect(px + 2, py + 24, 6, 20);

      // Legs with run cycle
      ctx.strokeStyle = skin.primaryColor;
      ctx.lineWidth = 4;

      if (p.isGrounded) {
        // Front leg
        ctx.beginPath();
        ctx.moveTo(px + 14, py + 50);
        ctx.lineTo(px + 14 + legOffset, py + 74);
        ctx.stroke();

        // Back leg
        ctx.beginPath();
        ctx.moveTo(px + pw - 14, py + 50);
        ctx.lineTo(px + pw - 14 - legOffset, py + 74);
        ctx.stroke();
      } else {
        // Jumping legs tucked
        ctx.beginPath();
        ctx.moveTo(px + 14, py + 50);
        ctx.lineTo(px + 8, py + 66);
        ctx.moveTo(px + pw - 14, py + 50);
        ctx.lineTo(px + pw - 8, py + 66);
        ctx.stroke();

        // Jet thruster flames in air
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.moveTo(px + 16, py + 72);
        ctx.lineTo(px + 22, py + 86 + Math.random() * 8);
        ctx.lineTo(px + 28, py + 72);
        ctx.fill();
      }
    }

    // 3. Shield Aura Effect (when active)
    if (p.shieldActive) {
      ctx.save();
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 24;
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
      ctx.lineWidth = 3;

      const shieldR = Math.max(pw, ph) * 0.75;
      const shieldCenterX = px + pw / 2;
      const shieldCenterY = py + ph / 2;

      ctx.beginPath();
      ctx.arc(shieldCenterX, shieldCenterY, shieldR, 0, Math.PI * 2);
      ctx.stroke();

      // Shield hexagonal grid shimmer
      ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  private renderParticles(ctx: CanvasRenderingContext2D) {
    ctx.save();
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private renderFloatingTexts(ctx: CanvasRenderingContext2D) {
    ctx.save();
    for (const ft of this.floatingTexts) {
      ctx.font = `900 ${ft.size}px Orbitron, sans-serif`;
      ctx.fillStyle = ft.color;
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 12;
      ctx.globalAlpha = ft.alpha;
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.restore();
  }

  private renderSpeedLines(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.4)';
    ctx.lineWidth = 2;

    for (let i = 0; i < 18; i++) {
      const y = Math.random() * GameEngine.VIRTUAL_HEIGHT;
      const len = Math.random() * 180 + 80;
      const x = Math.random() * GameEngine.VIRTUAL_WIDTH;

      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + len, y);
      ctx.stroke();
    }
    ctx.restore();
  }
}
