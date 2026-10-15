/**
 * Abu Madfa3 - Survivor.io Replica
 * Main Game Loop, Camera Lerp, Terrain Renderer & State Machine
 */

class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    this.width = window.innerWidth;
    this.height = window.innerHeight;

    // Camera
    this.camX = 0;
    this.camY = 0;
    this.shakeMagnitude = 0;
    this.shakeDuration = 0;

    // Game State
    this.state = 'MENU'; // MENU, PLAYING, PAUSED, LEVEL_UP, CHEST, GAME_OVER
    this.gameTime = 0;
    this.lastTime = performance.now();

    // Core Systems
    this.player = new Player();
    this.weaponManager = new WeaponManager(this.player);
    this.player.weaponManager = this.weaponManager;

    this.enemyManager = new EnemyManager(this.player);
    this.ui = new UIManager(this);

    this.initCanvas();
    this.initLoop();
  }

  initCanvas() {
    const resize = () => {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.canvas.width = this.width;
      this.canvas.height = this.height;
    };
    window.addEventListener('resize', resize);
    resize();
  }

  startGame() {
    this.reset();
    this.state = 'PLAYING';
    window.audioEngine.startMusic();
  }

  reset() {
    this.gameTime = 0;
    this.camX = 0;
    this.camY = 0;
    this.shakeMagnitude = 0;
    this.shakeDuration = 0;

    // Remove all secret code visual filters and containers
    if (this.canvas) {
      this.canvas.classList.remove('weed-filter');
      this.canvas.classList.remove('peter-filter');
    }
    const container = document.getElementById('game-container');
    if (container) {
      container.classList.remove('weed-active');
      container.classList.remove('peter-active');
    }

    this.player.reset();
    this.weaponManager.reset();
    this.enemyManager.reset();
    window.particleEngine.reset();
  }

  restart() {
    this.reset();
    this.state = 'PLAYING';
    window.audioEngine.startMusic();
  }

  returnToMenu() {
    this.reset();
    this.state = 'MENU';
    window.audioEngine.stopMusic();
    this.ui.startOverlay.classList.remove('hidden');
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      this.ui.pauseOverlay.classList.remove('hidden');
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      this.ui.pauseOverlay.classList.add('hidden');
    }
  }

  resumeAfterModal() {
    this.state = 'PLAYING';
  }

  triggerLevelUp() {
    this.state = 'LEVEL_UP';
    this.ui.showLevelUpModal(this.player);
  }

  openTreasureChest() {
    this.state = 'CHEST';
    this.ui.showChestModal(this.player);
  }

  triggerScreenShake(magnitude, duration) {
    this.shakeMagnitude = magnitude;
    this.shakeDuration = duration;
  }

  triggerGameOver() {
    this.state = 'GAME_OVER';
    window.audioEngine.stopMusic();
    this.ui.showGameOver(false, this.gameTime, this.enemyManager.totalKills, this.player.level, this.enemyManager.coins);
  }

  triggerVictory() {
    this.state = 'GAME_OVER';
    window.audioEngine.stopMusic();
    window.audioEngine.playLevelUp();
    this.ui.showGameOver(true, this.gameTime, this.enemyManager.totalKills, this.player.level, this.enemyManager.coins);
  }

  // Deactivate all secret codes — ensures only one code is active at a time
  deactivateAllCodes() {
    // Reset player flags
    this.player.isAnthonyBuffed = false;
    this.player.isWeedMode = false;
    this.player.isPeterMode = false;
    this.player.isLuigiMode = false;
    this.player.radius = CONFIG.PLAYER.RADIUS;
    this.player.bazookaScale = 1.0;

    // Reset weapon manager flags
    this.weaponManager.isWeedMode = false;
    this.weaponManager.isPeterMode = false;
    this.weaponManager.isLuigiMode = false;

    // Remove visual filters
    this.canvas.classList.remove('weed-filter');
    this.canvas.classList.remove('peter-filter');
    const container = document.getElementById('game-container');
    if (container) {
      container.classList.remove('weed-active');
      container.classList.remove('peter-active');
    }

    // Restart default music (codes may have changed it)
    if (window.audioEngine) {
      window.audioEngine.startMusic();
    }

    // Recalculate stats cleanly
    this.player.recalculateStats();
  }

  activateAnthonyProtocol() {
    this.deactivateAllCodes();
    this.player.activateAnthonyProtocol();
  }

  activateWeedMode() {
    this.deactivateAllCodes();
    // Player stat boost
    this.player.activateWeedMode();
    // Weapon weed mode (leaf projectiles)
    this.weaponManager.activateWeedMode();
    // Psychedelic screen filter
    this.canvas.classList.add('weed-filter');
    document.getElementById('game-container').classList.add('weed-active');
    // Reggae music
    if (window.audioEngine && window.audioEngine.startReggaeMusic) {
      window.audioEngine.startReggaeMusic();
    }
  }

  activatePeterMode() {
    this.deactivateAllCodes();
    // Player stat boost
    this.player.activatePeterMode();
    // Weapon Peter mode (dildo launcher & dick rockets)
    this.weaponManager.activatePeterMode();
    // Gay Vibes & Rainbow screen border / filter
    this.canvas.classList.add('peter-filter');
    const container = document.getElementById('game-container');
    if (container) {
      container.classList.add('peter-active');
    }
  }

  activateLuigiMode() {
    this.deactivateAllCodes();
    // Transform hero into Green Big Ogre
    this.player.activateLuigiMode();
    // Weapon switches to Mucus Launcher
    this.weaponManager.activateLuigiMode();
  }

  // =========================================================================
  // Game Loop
  // =========================================================================
  initLoop() {
    const loop = (currentTime) => {
      let dt = (currentTime - this.lastTime) / 1000;
      this.lastTime = currentTime;

      // Cap delta time to prevent physics jump after pause/tab-out
      if (dt > 0.1) dt = 0.1;

      this.update(dt);
      this.render();

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }

  update(dt) {
    if (this.state !== 'PLAYING') return;

    this.gameTime += dt;

    // Check Victory Time limit (300s = 5 mins)
    if (this.gameTime >= CONFIG.VICTORY_TIME && !this.enemyManager.activeBoss) {
      this.triggerVictory();
      return;
    }

    // 1. Update Player Movement & Stats
    this.player.update(dt);

    // 2. Update Weapons & Projectiles
    this.weaponManager.update(dt, this.enemyManager.enemies);

    // 3. Update Enemies, Spawner & Drops
    this.enemyManager.update(dt, this.gameTime);

    // 4. Update Particles & Ground Patches
    window.particleEngine.update(dt, this.enemyManager.enemies);

    // 5. Update Camera Tracking with smooth Lerp
    this.camX += (this.player.x - this.camX) * dt * 8;
    this.camY += (this.player.y - this.camY) * dt * 8;

    // 6. Camera Screen Shake decay
    if (this.shakeDuration > 0) {
      this.shakeDuration -= dt;
      if (this.shakeDuration <= 0) {
        this.shakeMagnitude = 0;
      }
    }

    // 7. Update HUD
    this.ui.updateHUD(this.player, this.enemyManager, this.gameTime);
  }

  // =========================================================================
  // Rendering
  // =========================================================================
  render() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Screen Shake Offset
    let shakeX = 0;
    let shakeY = 0;
    if (this.shakeMagnitude > 0) {
      shakeX = (Math.random() - 0.5) * this.shakeMagnitude * 2;
      shakeY = (Math.random() - 0.5) * this.shakeMagnitude * 2;
    }

    this.ctx.save();
    // Center camera on player
    this.ctx.translate(
      this.width / 2 - this.camX + shakeX,
      this.height / 2 - this.camY + shakeY
    );

    // 1. Render Infinite Tiled Wasteland / Asphalt Terrain
    this.renderTerrain();

    // 2. Render Napalm Ground Patches
    window.particleEngine.renderGroundPatches(this.ctx);

    // 3. Render Destructible Crates, Drops & Enemies
    this.enemyManager.render(this.ctx);

    // 4. Render Abu Madfa3 (Player Soldier + Shoulder Bazooka)
    this.player.render(this.ctx);

    // 5. Render Weapons (Guardian Blades, Drones, Flying Rockets)
    this.weaponManager.render(this.ctx);

    // 6. Render Explosions, Shockwaves, Damage Numbers
    window.particleEngine.render(this.ctx);

    this.ctx.restore();

    // 7. Render Screen Flash (Doomsday Nuke / Bomb wipe)
    window.particleEngine.renderScreenFlash(this.ctx, this.width, this.height);
  }

  // Procedural Urban Wasteland Terrain Rendering
  renderTerrain() {
    const tileSize = 120;
    const startX = Math.floor((this.camX - this.width / 2) / tileSize) * tileSize;
    const endX = Math.ceil((this.camX + this.width / 2) / tileSize) * tileSize;
    const startY = Math.floor((this.camY - this.height / 2) / tileSize) * tileSize;
    const endY = Math.ceil((this.camY + this.height / 2) / tileSize) * tileSize;

    for (let x = startX; x <= endX; x += tileSize) {
      for (let y = startY; y <= endY; y += tileSize) {
        // Pseudo-random tile variation using coordinate hash
        const hash = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
        const rand = hash - Math.floor(hash);

        // Ground asphalt color
        this.ctx.fillStyle = rand > 0.5 ? '#1e242d' : '#1a2028';
        this.ctx.fillRect(x, y, tileSize, tileSize);

        // Tile grid seams
        this.ctx.strokeStyle = '#151920';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, tileSize, tileSize);

        // Occasional road paint marking or crack
        if (rand < 0.12) {
          this.ctx.fillStyle = 'rgba(255, 235, 59, 0.15)';
          this.ctx.fillRect(x + 20, y + tileSize / 2 - 4, 35, 8);
        } else if (rand > 0.88) {
          this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
          this.ctx.lineWidth = 1.5;
          this.ctx.beginPath();
          this.ctx.moveTo(x + 30, y + 20);
          this.ctx.lineTo(x + 55, y + 50);
          this.ctx.lineTo(x + 80, y + 40);
          this.ctx.stroke();
        }
      }
    }

    // World Boundary Barricades
    const halfW = CONFIG.WORLD_WIDTH / 2;
    const halfH = CONFIG.WORLD_HEIGHT / 2;

    this.ctx.strokeStyle = 'rgba(255, 51, 68, 0.6)';
    this.ctx.lineWidth = 6;
    this.ctx.setLineDash([16, 12]);
    this.ctx.strokeRect(-halfW, -halfH, CONFIG.WORLD_WIDTH, CONFIG.WORLD_HEIGHT);
    this.ctx.setLineDash([]);
  }
}

// Boot Game once DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  window.gameInstance = new Game();
});
