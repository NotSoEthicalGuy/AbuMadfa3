/**
 * Abu Madfa3 - Survivor.io Replica
 * Enemy Swarms, Wave Director, Spatial Grid & Loot Drops
 */

class EnemyManager {
  constructor(player) {
    this.player = player;
    this.enemies = [];
    this.drops = []; // Gems, Meat, Bombs, Magnets, Chests
    this.crates = []; // Destructible wooden crates
    this.enemyProjectiles = []; // Acid spit & boss bullets
    this.activeBoss = null;

    this.spawnTimer = 0;
    this.totalKills = 0;
    this.coins = 0;

    // Spatial hash grid for high-speed collision
    this.cellSize = CONFIG.GRID_SIZE;
    this.grid = new Map();

    this.initCrates();
  }

  reset() {
    this.enemies = [];
    this.drops = [];
    this.enemyProjectiles = [];
    this.activeBoss = null;
    this.spawnTimer = 0;
    this.totalKills = 0;
    this.coins = 0;
    this.grid.clear();
    this.initCrates();
  }

  // Populate world with destructible wooden crates
  initCrates() {
    this.crates = [];
    const count = 35;
    for (let i = 0; i < count; i++) {
      this.crates.push({
        x: (Math.random() - 0.5) * (CONFIG.WORLD_WIDTH - 400),
        y: (Math.random() - 0.5) * (CONFIG.WORLD_HEIGHT - 400),
        hp: 30,
        radius: 20,
      });
    }
  }

  // Spatial Grid Key
  getCellKey(x, y) {
    const gx = Math.floor(x / this.cellSize);
    const gy = Math.floor(y / this.cellSize);
    return `${gx},${gy}`;
  }

  // Update Spatial Partitioning
  updateSpatialGrid() {
    this.grid.clear();
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (e.isDead) continue;
      const key = this.getCellKey(e.x, e.y);
      if (!this.grid.has(key)) {
        this.grid.set(key, []);
      }
      this.grid.get(key).push(e);
    }
  }

  // Get nearby enemies using spatial grid
  getNearbyEnemies(x, y, radius) {
    const result = [];
    const minGx = Math.floor((x - radius) / this.cellSize);
    const maxGx = Math.floor((x + radius) / this.cellSize);
    const minGy = Math.floor((y - radius) / this.cellSize);
    const maxGy = Math.floor((y + radius) / this.cellSize);

    for (let gx = minGx; gx <= maxGx; gx++) {
      for (let gy = minGy; gy <= maxGy; gy++) {
        const key = `${gx},${gy}`;
        const bucket = this.grid.get(key);
        if (bucket) {
          for (let i = 0; i < bucket.length; i++) {
            result.push(bucket[i]);
          }
        }
      }
    }
    return result;
  }

  // =========================================================================
  // Wave Spawning Director
  // =========================================================================
  update(dt, gameTime) {
    this.spawnTimer += dt;

    // Base spawn rate accelerates as time increases across 20 minutes (1200s)
    const spawnInterval = Math.max(0.14, 0.85 - (gameTime / 1200) * 0.7);

    if (this.spawnTimer >= spawnInterval && this.enemies.length < 650) {
      this.spawnTimer = 0;
      this.spawnSwarm(gameTime);
    }

    // Check Boss Spawns at 5m, 10m, 15m, and 20m
    this.checkBossEvents(gameTime);

    // Update Enemies & Movement
    this.updateEnemies(dt);

    // Update Enemy Projectiles (Acid Spit & Boss Bullets)
    this.updateEnemyProjectiles(dt);

    // Update Drops & Magnet Suction
    this.updateDrops(dt);

    // Update Spatial Grid
    this.updateSpatialGrid();

    // Soft separation between overlapping enemies
    this.resolveCrowdCollisions();
  }

  // Wave Composition based on Game Time (0 to 20 minutes)
  spawnSwarm(gameTime) {
    let type = 'SOLDIER_GRUNT';
    const roll = Math.random();

    // 0:00 - 5:00: Infantry Grunts & Fast Scouts
    if (gameTime < 300) {
      type = roll < 0.7 ? 'SOLDIER_GRUNT' : 'SOLDIER_SCOUT';
    }
    // 5:00 - 10:00: Heavy Grenadiers join the battlefield
    else if (gameTime < 600) {
      if (roll < 0.45) type = 'SOLDIER_GRUNT';
      else if (roll < 0.75) type = 'SOLDIER_SCOUT';
      else type = 'SOLDIER_GRENADIER';
    }
    // 10:00 - 15:00: Elite Sergeants lead tactical strike teams
    else if (gameTime < 900) {
      if (roll < 0.35) type = 'SOLDIER_GRUNT';
      else if (roll < 0.65) type = 'SOLDIER_SCOUT';
      else if (roll < 0.85) type = 'SOLDIER_GRENADIER';
      else type = 'SOLDIER_SERGEANT';
    }
    // 15:00 - 20:00: Full High-Intensity Tactical War
    else {
      if (roll < 0.3) type = 'SOLDIER_GRUNT';
      else if (roll < 0.55) type = 'SOLDIER_SCOUT';
      else if (roll < 0.8) type = 'SOLDIER_GRENADIER';
      else type = 'SOLDIER_SERGEANT';
    }

    // Spawn 1 to 4 enemies in perimeter
    const spawnCount = gameTime > 400 ? (Math.random() > 0.4 ? 3 : 2) : 1;
    for (let i = 0; i < spawnCount; i++) {
      this.spawnEnemy(type);
    }
  }

  spawnEnemy(typeId, customX = null, customY = null) {
    const config = CONFIG.ENEMIES[typeId];
    if (!config) return null;

    let x = customX;
    let y = customY;

    if (x === null || y === null) {
      // Spawn in perimeter just outside visible screen
      const angle = Math.random() * Math.PI * 2;
      const dist = 520 + Math.random() * 150;
      x = this.player.x + Math.cos(angle) * dist;
      y = this.player.y + Math.sin(angle) * dist;
    }

    const enemy = {
      id: Math.random(),
      type: typeId,
      name: config.name,
      role: config.role || 'grunt',
      x: x,
      y: y,
      vx: 0,
      vy: 0,
      maxHp: config.hp,
      hp: config.hp,
      speed: config.speed,
      damage: config.damage,
      radius: config.radius,
      uniformColor: config.uniformColor || '#5d6e53',
      helmetColor: config.helmetColor || '#3d4d35',
      color: config.uniformColor || '#5d6e53',
      xpValue: config.xpValue,
      mass: config.mass,
      isBoss: !!config.isBoss,
      isFinalBoss: !!config.isFinalBoss,
      bossIndex: config.bossIndex || 0,
      isRanged: !!config.isRanged,
      dropsChest: !!config.dropsChest,
      shootTimer: Math.random() * 2,
      chargeTimer: 0,
      specialTimer: 0,
      laserAngle: 0,
      isCharging: false,
      chargeTarget: { x: 0, y: 0 },
      isDead: false,
      walkCycle: Math.random() * 10,
      takeDamage: (dmg, isCrit = false) => {
        enemy.hp -= dmg;
        window.particleEngine.addDamageNumber(enemy.x, enemy.y, dmg, isCrit);
        if (enemy.hp <= 0 && !enemy.isDead) {
          enemy.isDead = true;
        }
      }
    };

    this.enemies.push(enemy);
    return enemy;
  }

  // 4 Boss Checkpoints at 5:00, 10:00, 15:00, and 20:00
  checkBossEvents(gameTime) {
    // 5:00 (300s): Boss 1 - Steel Juggernaut
    if (gameTime >= 300 && !this._spawnedBoss1) {
      this._spawnedBoss1 = true;
      const boss = this.spawnEnemy('BOSS_JUGGERNAUT');
      this.activeBoss = boss;
      window.audioEngine.playBossWarning();
      if (window.gameInstance) {
        window.gameInstance.triggerScreenShake(12, 0.6);
      }
    }

    // 10:00 (600s): Boss 2 - Toxic Chem-Commander
    if (gameTime >= 600 && !this._spawnedBoss2) {
      this._spawnedBoss2 = true;
      const boss = this.spawnEnemy('BOSS_CHEM_COMMANDER');
      this.activeBoss = boss;
      window.audioEngine.playBossWarning();
      if (window.gameInstance) {
        window.gameInstance.triggerScreenShake(14, 0.7);
      }
    }

    // 15:00 (900s): Boss 3 - Cyber-Drone Colossus
    if (gameTime >= 900 && !this._spawnedBoss3) {
      this._spawnedBoss3 = true;
      const boss = this.spawnEnemy('BOSS_DRONE_COLOSSUS');
      this.activeBoss = boss;
      window.audioEngine.playBossWarning();
      if (window.gameInstance) {
        window.gameInstance.triggerScreenShake(16, 0.8);
      }
    }

    // 20:00 (1200s): Final Boss 4 - Supreme Overlord Titan
    if (gameTime >= 1200 && !this._spawnedBoss4) {
      this._spawnedBoss4 = true;
      const boss = this.spawnEnemy('BOSS_SUPREME_OVERLORD');
      this.activeBoss = boss;
      window.audioEngine.playBossWarning();
      if (window.gameInstance) {
        window.gameInstance.triggerScreenShake(20, 1.0);
      }
    }
  }

  // =========================================================================
  // Enemy Movement & AI
  // =========================================================================
  updateEnemies(dt) {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];

      // Handle Death
      if (e.isDead) {
        this.totalKills++;
        window.particleEngine.emitHitSplatter(e.x, e.y, e.color, e.isBoss ? 25 : 8);

        // Spawn Drops
        this.dropLoot(e);

        if (e.isBoss) {
          if (this.activeBoss === e) {
            this.activeBoss = null;
          }
          if (e.isMegaBoss && window.gameInstance) {
            window.gameInstance.triggerVictory();
          }
        }

        this.enemies.splice(i, 1);
        continue;
      }

      // Calculate vector to player
      const dx = this.player.x - e.x;
      const dy = this.player.y - e.y;
      const dist = Math.hypot(dx, dy);

      // AI: Boss Attacks (Charging & Stomping)
      if (e.isBoss) {
        this.updateBossAI(e, dt, dx, dy, dist);
      }

      // AI: Ranged Acid Spitter
      else if (e.isRanged) {
        e.shootTimer += dt;
        const config = CONFIG.ENEMIES.SPITTER;
        if (dist > config.shootRange) {
          // Approach
          e.x += (dx / dist) * e.speed * dt;
          e.y += (dy / dist) * e.speed * dt;
        } else if (dist < config.shootRange * 0.5) {
          // Back away
          e.x -= (dx / dist) * (e.speed * 0.6) * dt;
          e.y -= (dy / dist) * (e.speed * 0.6) * dt;
        }

        // Fire Acid Globule
        if (e.shootTimer >= config.shootInterval) {
          e.shootTimer = 0;
          this.fireAcidGlobule(e.x, e.y, this.player.x, this.player.y);
        }
      }

      // AI: Standard Horde Pathing (Direct march toward player)
      else {
        if (dist > 1) {
          e.x += (dx / dist) * e.speed * dt;
          e.y += (dy / dist) * e.speed * dt;
        }
      }

      // Player Collision Damage
      if (dist < e.radius + this.player.radius) {
        this.player.onEnemyContact(e, dt);
      }
    }
  }

  // 4 Boss Attack Patterns (Survivor.io Inspired)
  updateBossAI(boss, dt, dx, dy, dist) {
    boss.chargeTimer += dt;
    boss.specialTimer = (boss.specialTimer || 0) + dt;

    const angleToPlayer = Math.atan2(dy, dx);

    // =========================================================================
    // BOSS 1 (5:00): Steel Juggernaut - Shield Charge & Ground Stomp
    // =========================================================================
    if (boss.bossIndex === 1) {
      if (!boss.isCharging) {
        if (dist > 1) {
          boss.x += (dx / dist) * boss.speed * dt;
          boss.y += (dy / dist) * boss.speed * dt;
        }

        // Ground Stomp every 4s
        if (boss.specialTimer >= 4.0) {
          boss.specialTimer = 0;
          window.particleEngine.createExplosion(boss.x, boss.y, 140, false);
          window.audioEngine.playExplosion(false);
          if (dist < 150) {
            this.player.takeDamage(30);
            this.player.x += (dx / dist) * 60;
            this.player.y += (dy / dist) * 60;
          }
        }

        // Charge trigger every 5.5s
        if (boss.chargeTimer >= 5.5) {
          boss.isCharging = true;
          boss.chargeTimer = 0;
          boss.chargeTarget = {
            x: this.player.x + (dx / dist) * 220,
            y: this.player.y + (dy / dist) * 220
          };
        }
      } else {
        const cdx = boss.chargeTarget.x - boss.x;
        const cdy = boss.chargeTarget.y - boss.y;
        const cdist = Math.hypot(cdx, cdy);
        if (cdist > 15 && boss.chargeTimer < 1.3) {
          boss.x += (cdx / cdist) * (boss.speed * 3.4) * dt;
          boss.y += (cdy / cdist) * (boss.speed * 3.4) * dt;
          window.particleEngine.emit(boss.x, boss.y, (Math.random() - 0.5) * 40, (Math.random() - 0.5) * 40, 'rgba(255, 100, 100, 0.4)', 8, 0.25, true, 'smoke');
        } else {
          boss.isCharging = false;
          boss.chargeTimer = 0;
        }
      }
    }

    // =========================================================================
    // BOSS 2 (10:00): Toxic Chem-Commander - Poison Pools & Triple Acid Spray
    // =========================================================================
    else if (boss.bossIndex === 2) {
      if (dist > 1) {
        boss.x += (dx / dist) * boss.speed * dt;
        boss.y += (dy / dist) * boss.speed * dt;
      }

      // Drop lingering toxic chemical patch every 3.2s
      if (boss.specialTimer >= 3.2) {
        boss.specialTimer = 0;
        window.particleEngine.addNapalmPatch(boss.x, boss.y, 75, 4.0, 22);
      }

      // Triple Acid Spray every 2.4s
      if (boss.chargeTimer >= 2.4) {
        boss.chargeTimer = 0;
        for (let s = -1; s <= 1; s++) {
          const spreadAngle = angleToPlayer + s * 0.28;
          this.enemyProjectiles.push({
            type: 'acid',
            x: boss.x,
            y: boss.y,
            vx: Math.cos(spreadAngle) * 240,
            vy: Math.sin(spreadAngle) * 240,
            damage: 20,
            radius: 10,
            life: 3.0
          });
        }
      }
    }

    // =========================================================================
    // BOSS 3 (15:00): Cyber-Drone Colossus - Sweeping Twin Lasers & Missile Salvo
    // =========================================================================
    else if (boss.bossIndex === 3) {
      if (dist > 1) {
        boss.x += (dx / dist) * boss.speed * dt;
        boss.y += (dy / dist) * boss.speed * dt;
      }

      // Sweeping Twin Lasers
      boss.laserAngle = (boss.laserAngle || 0) + dt * 1.6;

      // Check laser collision with player
      const laserLen = 320;
      for (let arm = 0; arm < 2; arm++) {
        const lAngle = boss.laserAngle + arm * Math.PI;
        const lx2 = boss.x + Math.cos(lAngle) * laserLen;
        const ly2 = boss.y + Math.sin(lAngle) * laserLen;

        // Point-line distance to player
        const ldx = lx2 - boss.x;
        const ldy = ly2 - boss.y;
        const lenSq = ldx * ldx + ldy * ldy;
        const t = Math.max(0, Math.min(1, ((this.player.x - boss.x) * ldx + (this.player.y - boss.y) * ldy) / lenSq));
        const projX = boss.x + t * ldx;
        const projY = boss.y + t * ldy;
        const pDist = Math.hypot(this.player.x - projX, this.player.y - projY);

        if (pDist < this.player.radius + 6) {
          this.player.takeDamage(20);
        }
      }

      // Missile Salvo every 3.8s
      if (boss.chargeTimer >= 3.8) {
        boss.chargeTimer = 0;
        for (let m = 0; m < 8; m++) {
          const mAngle = (m * Math.PI * 2) / 8;
          this.enemyProjectiles.push({
            type: 'boss_bullet',
            x: boss.x,
            y: boss.y,
            vx: Math.cos(mAngle) * 200,
            vy: Math.sin(mAngle) * 200,
            damage: 24,
            radius: 8,
            life: 3.5
          });
        }
      }
    }

    // =========================================================================
    // BOSS 4 (20:00): Supreme Overlord Titan - Bullet Hell, Dash & Reinforcements
    // =========================================================================
    else if (boss.bossIndex === 4) {
      if (!boss.isCharging) {
        if (dist > 1) {
          boss.x += (dx / dist) * boss.speed * dt;
          boss.y += (dy / dist) * boss.speed * dt;
        }

        // 360-degree Bullet Hell Ring every 3.0s
        if (boss.specialTimer >= 3.0) {
          boss.specialTimer = 0;
          this.fireBossBulletRing(boss.x, boss.y, 22);
          window.audioEngine.playExplosion(false);
        }

        // Summon Elite Guard squad every 7.5s
        if (!boss._lastSummon || Date.now() - boss._lastSummon > 7500) {
          boss._lastSummon = Date.now();
          for (let k = 0; k < 3; k++) {
            const sAngle = (k * Math.PI * 2) / 3;
            this.spawnEnemy('SOLDIER_SERGEANT', boss.x + Math.cos(sAngle) * 60, boss.y + Math.sin(sAngle) * 60);
          }
        }

        // Supersonic Flash Dash every 5.0s
        if (boss.chargeTimer >= 5.0) {
          boss.isCharging = true;
          boss.chargeTimer = 0;
          boss.chargeTarget = {
            x: this.player.x + (dx / dist) * 260,
            y: this.player.y + (dy / dist) * 260
          };
        }
      } else {
        const cdx = boss.chargeTarget.x - boss.x;
        const cdy = boss.chargeTarget.y - boss.y;
        const cdist = Math.hypot(cdx, cdy);
        if (cdist > 15 && boss.chargeTimer < 1.0) {
          boss.x += (cdx / cdist) * (boss.speed * 4.0) * dt;
          boss.y += (cdy / cdist) * (boss.speed * 4.0) * dt;
          window.particleEngine.emit(boss.x, boss.y, (Math.random() - 0.5) * 50, (Math.random() - 0.5) * 50, '#f72585', 9, 0.3, true, 'spark');
        } else {
          boss.isCharging = false;
          boss.chargeTimer = 0;
        }
      }
    }
  }

  // Enemy Projectiles (Acid Spit & Boss Bullet Hell)
  fireAcidGlobule(x, y, tx, ty) {
    const angle = Math.atan2(ty - y, tx - x);
    this.enemyProjectiles.push({
      type: 'acid',
      x: x,
      y: y,
      vx: Math.cos(angle) * 220,
      vy: Math.sin(angle) * 220,
      damage: 16,
      radius: 8,
      life: 2.5
    });
  }

  fireBossBulletRing(x, y, count = 16) {
    for (let i = 0; i < count; i++) {
      const angle = (i * Math.PI * 2) / count;
      this.enemyProjectiles.push({
        type: 'boss_bullet',
        x: x,
        y: y,
        vx: Math.cos(angle) * 180,
        vy: Math.sin(angle) * 180,
        damage: 22,
        radius: 9,
        life: 3.5
      });
    }
  }

  updateEnemyProjectiles(dt) {
    for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
      const p = this.enemyProjectiles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Check collision with player
      const dist = Math.hypot(p.x - this.player.x, p.y - this.player.y);
      if (dist < p.radius + this.player.radius) {
        this.player.takeDamage(p.damage);
        window.particleEngine.emitHitSplatter(p.x, p.y, p.type === 'acid' ? '#76ff03' : '#ff1744', 6);
        this.enemyProjectiles.splice(i, 1);
        continue;
      }

      if (p.life <= 0) {
        this.enemyProjectiles.splice(i, 1);
      }
    }
  }

  // Resolve crowd overlaps (Boids-like separation)
  resolveCrowdCollisions() {
    const sampleSize = Math.min(this.enemies.length, 120);
    for (let i = 0; i < sampleSize; i++) {
      const a = this.enemies[i];
      if (a.isDead) continue;

      const nearby = this.getNearbyEnemies(a.x, a.y, a.radius * 2);
      for (let j = 0; j < nearby.length; j++) {
        const b = nearby[j];
        if (a === b || b.isDead) continue;

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy);
        const minDist = a.radius + b.radius;

        if (dist < minDist && dist > 0) {
          const overlap = (minDist - dist) * 0.5;
          const nx = (dx / dist) * overlap;
          const ny = (dy / dist) * overlap;
          a.x -= nx * 0.5;
          a.y -= ny * 0.5;
          b.x += nx * 0.5;
          b.y += ny * 0.5;
        }
      }
    }
  }

  // =========================================================================
  // Loot Drops & Magnet System
  // =========================================================================
  dropLoot(enemy) {
    if (enemy.dropsChest) {
      // Golden Chest Drop
      this.drops.push({
        type: 'chest',
        x: enemy.x,
        y: enemy.y,
        radius: 18,
        icon: '📦',
      });
      return;
    }

    // Rare power-up roll (2%)
    const roll = Math.random();
    if (roll < 0.009) {
      this.drops.push({ type: 'meat', x: enemy.x, y: enemy.y, radius: 14, icon: '🥩' });
      return;
    } else if (roll < 0.015) {
      this.drops.push({ type: 'magnet', x: enemy.x, y: enemy.y, radius: 14, icon: '🧲' });
      return;
    } else if (roll < 0.02) {
      this.drops.push({ type: 'bomb', x: enemy.x, y: enemy.y, radius: 14, icon: '💣' });
      return;
    }

    // XP Gem drop
    let gemConfig = CONFIG.ITEMS.GEM_GREEN;
    if (enemy.xpValue >= 25) {
      gemConfig = CONFIG.ITEMS.GEM_GOLD;
    } else if (enemy.xpValue >= 5 || Math.random() < 0.15) {
      gemConfig = CONFIG.ITEMS.GEM_BLUE;
    }

    this.drops.push({
      type: 'gem',
      x: enemy.x,
      y: enemy.y,
      xp: gemConfig.xp,
      color: gemConfig.color,
      radius: gemConfig.radius,
      vx: 0,
      vy: 0,
      isAttracted: false,
    });
  }

  // Triggered by picking up Magnet power-up
  attractAllGems() {
    this.drops.forEach(drop => {
      if (drop.type === 'gem') {
        drop.isAttracted = true;
      }
    });
  }

  // Triggered by picking up Screen Bomb
  triggerScreenBomb() {
    window.particleEngine.flashAlpha = 0.8;
    window.particleEngine.createExplosion(this.player.x, this.player.y, 450, true);
    window.audioEngine.playExplosion(true);

    if (window.gameInstance) {
      window.gameInstance.triggerScreenShake(18, 0.5);
    }

    // Destroy all non-boss enemies on screen
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (!e.isDead && !e.isBoss) {
        e.takeDamage(9999, true);
      }
    }
  }

  updateDrops(dt) {
    const pickupDist = this.player.pickupRadius;

    for (let i = this.drops.length - 1; i >= 0; i--) {
      const drop = this.drops[i];
      const dx = this.player.x - drop.x;
      const dy = this.player.y - drop.y;
      const dist = Math.hypot(dx, dy);

      // Suction to player
      if (dist < pickupDist || drop.isAttracted) {
        drop.isAttracted = true;
        const pullSpeed = Math.min(750, 250 + (1000 / (dist + 10)));
        drop.x += (dx / dist) * pullSpeed * dt;
        drop.y += (dy / dist) * pullSpeed * dt;
      }

      // Collect item
      if (dist < this.player.radius + drop.radius) {
        if (drop.type === 'gem') {
          this.player.addXP(drop.xp);
          window.audioEngine.playGemPickup();
        } else if (drop.type === 'meat') {
          this.player.heal(this.player.maxHp * 0.5);
          window.audioEngine.playChestFanfare();
        } else if (drop.type === 'magnet') {
          this.attractAllGems();
          window.audioEngine.playChestFanfare();
        } else if (drop.type === 'bomb') {
          this.triggerScreenBomb();
        } else if (drop.type === 'chest') {
          if (window.gameInstance) {
            window.gameInstance.openTreasureChest();
          }
        }

        this.drops.splice(i, 1);
      }
    }
  }

  // =========================================================================
  // Rendering Enemies, Crates, and Drops
  // =========================================================================
  render(ctx) {
    // 1. Render Destructible Crates
    this.crates.forEach(c => {
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.fillStyle = '#8d6e63';
      ctx.strokeStyle = '#4e342e';
      ctx.lineWidth = 3;
      ctx.fillRect(-c.radius, -c.radius, c.radius * 2, c.radius * 2);
      ctx.strokeRect(-c.radius, -c.radius, c.radius * 2, c.radius * 2);
      // Wood cross
      ctx.beginPath();
      ctx.moveTo(-c.radius, -c.radius);
      ctx.lineTo(c.radius, c.radius);
      ctx.moveTo(c.radius, -c.radius);
      ctx.lineTo(-c.radius, c.radius);
      ctx.stroke();
      ctx.restore();
    });

    // 2. Render Drops (Gems, Meat, Chests)
    this.drops.forEach(drop => {
      ctx.save();
      ctx.translate(drop.x, drop.y);

      if (drop.type === 'gem') {
        // Glowing Diamond Gem
        ctx.fillStyle = drop.color;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = drop.color;
        ctx.shadowBlur = 8;

        ctx.beginPath();
        ctx.moveTo(0, -drop.radius);
        ctx.lineTo(drop.radius, 0);
        ctx.lineTo(0, drop.radius);
        ctx.lineTo(-drop.radius, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        // Power-Up / Chest icon
        ctx.font = `${drop.radius * 1.8}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(drop.icon, 0, 0);
      }
      ctx.restore();
    });

    // 3. Render Enemies
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      ctx.save();
      ctx.translate(e.x, e.y);

      // Enemy Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
      ctx.beginPath();
      ctx.ellipse(0, e.radius * 0.9, e.radius * 0.9, e.radius * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Boss Charge telegraph indicator
      if (e.isBoss && e.isCharging) {
        ctx.strokeStyle = 'rgba(255, 23, 68, 0.7)';
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 8]);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(e.chargeTarget.x - e.x, e.chargeTarget.y - e.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // -------------------------------------------------------------
      // BOSS MODELS
      // -------------------------------------------------------------
      if (e.isBoss) {
        this.renderBossModel(ctx, e);
      }
      // -------------------------------------------------------------
      // TACTICAL MILITARY SOLDIER MODELS
      // -------------------------------------------------------------
      else {
        this.renderTacticalSoldier(ctx, e);
      }

      // Enemy Health Bar (if damaged)
      if (e.hp < e.maxHp && !e.isFinalBoss) {
        const barW = e.radius * 2;
        const barH = 4;
        const pct = Math.max(0, e.hp / e.maxHp);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(-barW / 2, -e.radius - 10, barW, barH);
        ctx.fillStyle = e.isBoss ? '#ff1744' : '#00e676';
        ctx.fillRect(-barW / 2, -e.radius - 10, barW * pct, barH);
      }

      ctx.restore();
    }

    // 3.5 Render Boss 3 Sweeping Lasers
    if (this.activeBoss && this.activeBoss.bossIndex === 3) {
      const b = this.activeBoss;
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 23, 68, 0.85)';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#ff1744';
      ctx.shadowBlur = 12;
      const laserLen = 320;
      for (let arm = 0; arm < 2; arm++) {
        const lAngle = (b.laserAngle || 0) + arm * Math.PI;
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.x + Math.cos(lAngle) * laserLen, b.y + Math.sin(lAngle) * laserLen);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 4. Render Enemy Projectiles
    this.enemyProjectiles.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.fillStyle = p.type === 'acid' ? '#76ff03' : '#ff1744';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  // =========================================================================
  // Detailed Tactical Military Soldier Rendering
  // =========================================================================
  renderTacticalSoldier(ctx, e) {
    const angle = Math.atan2(this.player.y - e.y, this.player.x - e.x);
    const facingRight = Math.cos(angle) >= 0;
    const stride = Math.sin(e.walkCycle || 0) * 4;

    // 1. Combat Boots
    ctx.fillStyle = '#1a202c';
    ctx.fillRect(-6, e.radius * 0.45 + stride, 4, 6);
    ctx.fillRect(2, e.radius * 0.45 - stride, 4, 6);

    // 2. Camouflage Uniform Torso
    ctx.fillStyle = e.uniformColor;
    ctx.fillRect(-e.radius * 0.65, -e.radius * 0.4, e.radius * 1.3, e.radius * 0.95);

    // Tactical Plate Carrier Vest
    ctx.fillStyle = '#2d3748';
    ctx.fillRect(-e.radius * 0.5, -e.radius * 0.35, e.radius, e.radius * 0.7);

    // Ammo Pouches & Belt
    ctx.fillStyle = '#171923';
    ctx.fillRect(-e.radius * 0.6, e.radius * 0.25, e.radius * 1.2, 3);
    ctx.fillStyle = '#4a5568';
    ctx.fillRect(-e.radius * 0.35, -e.radius * 0.15, 3, 5);
    ctx.fillRect(e.radius * 0.15, -e.radius * 0.15, 3, 5);

    // 3. Head & Combat Helmet
    // Face
    ctx.fillStyle = '#e2b89b';
    ctx.beginPath();
    ctx.arc(0, -e.radius * 0.55, e.radius * 0.42, 0, Math.PI * 2);
    ctx.fill();

    // Helmet
    ctx.fillStyle = e.helmetColor;
    ctx.beginPath();
    ctx.arc(0, -e.radius * 0.7, e.radius * 0.52, Math.PI, Math.PI * 2);
    ctx.lineTo(e.radius * 0.55, -e.radius * 0.55);
    ctx.lineTo(-e.radius * 0.55, -e.radius * 0.55);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#1a202c';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Tactical Goggles / Visor
    const goggleColor = e.role === 'scout' ? '#ff9800' : (e.role === 'grenadier' ? '#4caf50' : '#00e5ff');
    ctx.fillStyle = goggleColor;
    const gX = facingRight ? 1 : -e.radius * 0.35;
    ctx.fillRect(gX, -e.radius * 0.65, e.radius * 0.38, 3.5);

    // Sergeant antenna
    if (e.role === 'sergeant') {
      ctx.strokeStyle = '#cbd5e0';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-e.radius * 0.3, -e.radius * 0.85);
      ctx.lineTo(-e.radius * 0.3, -e.radius * 1.4);
      ctx.stroke();
      // Chevron
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.moveTo(0, -e.radius * 0.2);
      ctx.lineTo(3, -e.radius * 0.1);
      ctx.lineTo(0, 0);
      ctx.stroke();
    }

    // 4. Firearm (Carbine / Assault Rifle)
    ctx.save();
    ctx.rotate(angle);
    ctx.fillStyle = '#111827';
    // Rifle barrel & receiver
    ctx.fillRect(e.radius * 0.3, -2.5, e.radius * 0.9, 4);
    // Magazine
    ctx.fillRect(e.radius * 0.55, 1.5, 3, 5);
    // Flash hider
    ctx.fillStyle = '#4b5563';
    ctx.fillRect(e.radius * 1.15, -3, 2, 5);
    ctx.restore();
  }

  // =========================================================================
  // Detailed Boss Models (4 Survivor.io Inspired Bosses)
  // =========================================================================
  renderBossModel(ctx, b) {
    const angle = Math.atan2(this.player.y - b.y, this.player.x - b.x);

    // BOSS 1: Steel Juggernaut
    if (b.bossIndex === 1) {
      // Mechanoid Power Suit Body
      ctx.fillStyle = '#2c3e50';
      ctx.strokeStyle = '#1a252f';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Exhaust Pipes on back
      ctx.fillStyle = '#7f8c8d';
      ctx.fillRect(-b.radius * 0.7, -b.radius * 1.1, 7, 16);
      ctx.fillRect(b.radius * 0.7 - 7, -b.radius * 1.1, 7, 16);

      // Heavy Titanium Riot Shield in front
      ctx.save();
      ctx.rotate(angle);
      ctx.fillStyle = '#c0392b';
      ctx.fillRect(b.radius * 0.5, -b.radius * 0.7, 8, b.radius * 1.4);
      ctx.fillStyle = '#ffffff';
      // White shield cross
      ctx.fillRect(b.radius * 0.5 + 2, -b.radius * 0.2, 4, b.radius * 0.4);
      ctx.restore();

      // Glowing red visor
      ctx.fillStyle = '#e74c3c';
      ctx.shadowColor = '#e74c3c';
      ctx.shadowBlur = 10;
      ctx.fillRect(-b.radius * 0.3, -b.radius * 0.4, b.radius * 0.6, 6);
      ctx.shadowBlur = 0;
    }

    // BOSS 2: Toxic Chem-Commander
    else if (b.bossIndex === 2) {
      // Biohazard Hazmat Suit
      ctx.fillStyle = '#1b4332';
      ctx.strokeStyle = '#081c15';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Dual Green Toxic Canisters
      ctx.fillStyle = '#52b788';
      ctx.fillRect(-b.radius * 0.8, -b.radius * 0.8, 10, b.radius * 1.2);
      ctx.fillRect(b.radius * 0.8 - 10, -b.radius * 0.8, 10, b.radius * 1.2);

      // Gas Mask Visor
      ctx.fillStyle = '#d8f3dc';
      ctx.beginPath();
      ctx.arc(-8, -6, 7, 0, Math.PI * 2);
      ctx.arc(8, -6, 7, 0, Math.PI * 2);
      ctx.fill();
      // Toxic respirator filter
      ctx.fillStyle = '#2d6a4f';
      ctx.beginPath();
      ctx.arc(0, 8, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    // BOSS 3: Cyber-Drone Colossus
    else if (b.bossIndex === 3) {
      // Hexagonal Core
      ctx.fillStyle = '#1a1a2e';
      ctx.strokeStyle = '#0f3460';
      ctx.lineWidth = 4;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const hAngle = (i * Math.PI) / 3;
        const hx = Math.cos(hAngle) * b.radius;
        const hy = Math.sin(hAngle) * b.radius;
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 4 Drone Hover Thrusters
      ctx.fillStyle = '#e94560';
      ctx.shadowColor = '#e94560';
      ctx.shadowBlur = 10;
      for (let t = 0; t < 4; t++) {
        const tAngle = (t * Math.PI) / 2 + Math.PI / 4;
        const tx = Math.cos(tAngle) * (b.radius * 1.15);
        const ty = Math.sin(tAngle) * (b.radius * 1.15);
        ctx.beginPath();
        ctx.arc(tx, ty, 8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // Central Glowing Cyber Eye
      ctx.fillStyle = '#00fff5';
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();
    }

    // BOSS 4: Supreme Overlord Titan (Final Boss)
    else if (b.bossIndex === 4) {
      // Royal Imperial Titan Armor
      ctx.fillStyle = '#3a0ca3';
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Golden Pauldrons
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(-b.radius * 1.15, -b.radius * 0.4, 12, 24);
      ctx.fillRect(b.radius * 1.15 - 12, -b.radius * 0.4, 12, 24);

      // Pulsing Crimson Power Core
      const pulse = Math.sin(Date.now() / 100) * 3;
      ctx.fillStyle = '#f72585';
      ctx.shadowColor = '#f72585';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(0, 0, 12 + pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Apex Crown Insignia
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.moveTo(-12, -b.radius * 0.7);
      ctx.lineTo(0, -b.radius * 1.1);
      ctx.lineTo(12, -b.radius * 0.7);
      ctx.lineTo(6, -b.radius * 0.85);
      ctx.lineTo(-6, -b.radius * 0.85);
      ctx.closePath();
      ctx.fill();
    }
  }
}
