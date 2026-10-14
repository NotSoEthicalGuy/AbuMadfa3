/**
 * Abu Madfa3 - Survivor.io Replica
 * Weapons, Ballistics & Auto-Targeting System
 */

class WeaponManager {
  constructor(player) {
    this.player = player;
    this.activeWeapons = {}; // id -> { level, timer, isEvo }
    this.activePassives = {}; // id -> { level }

    this.projectiles = [];
    this.orbitBladesAngle = 0;
    this.drones = []; // Drones hovering near player
    this.isWeedMode = false;
    this.isPeterMode = false;

    // Start with RPG-7 Bazooka level 1
    this.addWeapon('BAZOOKA');
  }

  reset() {
    this.activeWeapons = {};
    this.activePassives = {};
    this.projectiles = [];
    this.orbitBladesAngle = 0;
    this.drones = [];
    this.isWeedMode = false;
    this.isPeterMode = false;
    this.addWeapon('BAZOOKA');
  }

  addWeapon(id) {
    if (!CONFIG.WEAPONS[id]) return;
    if (!this.activeWeapons[id]) {
      this.activeWeapons[id] = { level: 1, timer: 0, isEvo: false };
      if (id === 'DRONE') {
        this.updateDrones();
      }
    } else if (this.activeWeapons[id].level < CONFIG.WEAPONS[id].maxLevel) {
      this.activeWeapons[id].level++;
      if (id === 'DRONE') {
        this.updateDrones();
      }
    }
  }

  evolveWeapon(baseId) {
    const weaponConfig = CONFIG.WEAPONS[baseId];
    if (!weaponConfig || !weaponConfig.evo) return;
    if (this.activeWeapons[baseId]) {
      this.activeWeapons[baseId].isEvo = true;
      this.activeWeapons[baseId].level = 6;
      window.particleEngine.emitLevelUpSparks(this.player.x, this.player.y);
      window.audioEngine.playLevelUp();
    }
  }

  addPassive(id) {
    if (!CONFIG.PASSIVES[id]) return;
    if (!this.activePassives[id]) {
      this.activePassives[id] = { level: 1 };
    } else if (this.activePassives[id].level < CONFIG.PASSIVES[id].maxLevel) {
      this.activePassives[id].level++;
    }
    this.player.recalculateStats();
  }

  // Boost all weapons and passives by +2 levels when Anthony code is entered
  applyAnthonyBuff() {
    // Ensure core passives exist
    if (!this.activePassives.HE_FUEL) this.addPassive('HE_FUEL');
    if (!this.activePassives.BULLET) this.addPassive('BULLET');

    // Add +2 levels to all active weapons
    for (const id in this.activeWeapons) {
      const w = this.activeWeapons[id];
      w.level = Math.min(CONFIG.WEAPONS[id].maxLevel, w.level + 2);
      if (id === 'DRONE') this.updateDrones();
    }

    // Immediately evolve Bazooka to Doomsday Cannon
    if (this.activeWeapons.BAZOOKA) {
      this.evolveWeapon('BAZOOKA');
    }

    // Add +2 levels to all active passives
    for (const id in this.activePassives) {
      const p = this.activePassives[id];
      p.level = Math.min(CONFIG.PASSIVES[id].maxLevel, p.level + 2);
    }

    // If less than 3 weapons, grant Guardian Blades as bonus
    if (!this.activeWeapons.GUARDIAN) {
      this.addWeapon('GUARDIAN');
      this.activeWeapons.GUARDIAN.level = 3;
    }

    this.player.recalculateStats();
  }

  activateWeedMode() {
    this.isWeedMode = true;
    this.player.recalculateStats();
  }

  activatePeterMode() {
    this.isPeterMode = true;
    this.player.recalculateStats();
  }

  // Stat Modifiers from Passives
  getDamageMultiplier() {
    let mult = 1.0;
    if (this.player && this.player.isAnthonyBuffed) {
      mult += 0.65; // +65% base damage from Anthony protocol
    }
    if (this.isWeedMode) {
      mult += 0.25; // +25% damage boost from Mharreb Query
    }
    if (this.isPeterMode) {
      mult += 0.30; // +30% fabulous damage boost from Peter Mode
    }
    if (this.activePassives.BULLET) {
      const lvl = this.activePassives.BULLET.level - 1;
      mult += CONFIG.PASSIVES.BULLET.levels[lvl].value;
    }
    return mult;
  }

  getAoeMultiplier() {
    let mult = 1.0;
    if (this.isWeedMode) {
      mult += 0.20; // +20% bigger leaf blast radius
    }
    if (this.isPeterMode) {
      mult += 0.25; // +25% bigger rainbow explosion radius
    }
    if (this.activePassives.HE_FUEL) {
      const lvl = this.activePassives.HE_FUEL.level - 1;
      mult += CONFIG.PASSIVES.HE_FUEL.levels[lvl].value;
    }
    return mult;
  }

  getCooldownMultiplier() {
    let mult = 1.0;
    if (this.isWeedMode) {
      mult *= 0.75; // 25% faster fire rate in weed mode!
    }
    if (this.isPeterMode) {
      mult *= 0.75; // 25% faster fire rate in Peter mode!
    }
    if (this.activePassives.ENERGY_CUBE) {
      const lvl = this.activePassives.ENERGY_CUBE.level - 1;
      mult -= CONFIG.PASSIVES.ENERGY_CUBE.levels[lvl].value;
    }
    return Math.max(0.35, mult);
  }

  // Auto-Targeting: Find best target (Boss, dense cluster, or nearest enemy)
  findBestTarget(enemies, maxRange = 650) {
    if (!enemies || enemies.length === 0) return null;

    let bestTarget = null;
    let highestScore = -Infinity;

    for (let i = 0; i < enemies.length; i++) {
      const enemy = enemies[i];
      if (enemy.isDead) continue;

      const dist = Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y);
      if (dist > maxRange) continue;

      // Score formula:
      // Bosses get huge priority (+1000)
      // Closeness gives up to +200
      let score = (1 - dist / maxRange) * 200;
      if (enemy.isBoss) score += 1000;

      if (score > highestScore) {
        highestScore = score;
        bestTarget = enemy;
      }
    }

    return bestTarget;
  }

  // Update Weapon Systems & Projectiles
  update(dt, enemies) {
    // 1. Bazooka auto-fire
    this.updateBazooka(dt, enemies);

    // 2. Secondary Weapons
    if (this.activeWeapons.GUARDIAN) {
      this.updateGuardian(dt, enemies);
    }
    if (this.activeWeapons.LIGHTNING) {
      this.updateLightning(dt, enemies);
    }
    if (this.activeWeapons.DRONE) {
      this.updateDronesSystem(dt, enemies);
    }
    if (this.activeWeapons.MOLOTOV) {
      this.updateMolotov(dt, enemies);
    }

    // 3. Update all flying projectiles
    this.updateProjectiles(dt, enemies);
  }

  // =========================================================================
  // Primary Weapon: RPG-7 Bazooka & Doomsday Hydra Cannon
  // =========================================================================
  updateBazooka(dt, enemies) {
    const bzData = this.activeWeapons.BAZOOKA;
    if (!bzData) return;

    bzData.timer += dt;

    const isEvo = bzData.isEvo;
    const config = isEvo ? CONFIG.WEAPONS.BAZOOKA.evo : CONFIG.WEAPONS.BAZOOKA.levels[bzData.level - 1];
    const adjustedCooldown = config.cooldown * this.getCooldownMultiplier();

    // Aim Bazooka toward best target continuously
    const target = this.findBestTarget(enemies, 700);
    if (target) {
      const targetAngle = Math.atan2(target.y - this.player.y, target.x - this.player.x);
      // Smoothly rotate bazooka angle
      let diff = targetAngle - this.player.aimAngle;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      this.player.aimAngle += diff * Math.min(1, dt * 14);
    }

    // Fire rocket when cooldown completes and target exists
    if (bzData.timer >= adjustedCooldown) {
      if (target) {
        bzData.timer = 0;
        this.fireBazookaRockets(config, isEvo);
      }
    }
  }

  fireBazookaRockets(config, isEvo) {
    const count = config.count;
    const baseAngle = this.player.aimAngle;
    const spread = count > 1 ? 0.22 : 0;
    const startAngle = baseAngle - (spread * (count - 1)) / 2;

    const damage = config.damage * this.getDamageMultiplier();
    const radius = config.radius * this.getAoeMultiplier();

    for (let i = 0; i < count; i++) {
      const angle = startAngle + i * spread;
      this.projectiles.push({
        type: 'rocket',
        isNuke: isEvo,
        isWeedLeaf: this.isWeedMode && !this.isPeterMode,
        isDickRocket: this.isPeterMode,
        spinAngle: 0,
        x: this.player.x + Math.cos(angle) * 22,
        y: this.player.y + Math.sin(angle) * 22,
        vx: Math.cos(angle) * config.speed,
        vy: Math.sin(angle) * config.speed,
        angle: angle,
        damage: damage,
        radius: radius,
        napalm: config.napalm,
        cluster: config.cluster,
        life: 2.2,
      });
    }

    // Recoil and Sound FX
    this.player.recoilOffset = 10;
    window.audioEngine.playRocketLaunch();
  }

  // =========================================================================
  // Secondary Weapon: Guardian Spinning Blades
  // =========================================================================
  updateGuardian(dt, enemies) {
    const data = this.activeWeapons.GUARDIAN;
    const config = CONFIG.WEAPONS.GUARDIAN.levels[data.level - 1];

    this.orbitBladesAngle += config.speed * dt;
    const bladeCount = config.count;
    const damage = config.damage * this.getDamageMultiplier();
    const orbitRadius = config.radius;

    // Check collision with enemies for each blade
    for (let i = 0; i < bladeCount; i++) {
      const angle = this.orbitBladesAngle + (i * (Math.PI * 2) / bladeCount);
      const bx = this.player.x + Math.cos(angle) * orbitRadius;
      const by = this.player.y + Math.sin(angle) * orbitRadius;
      const bladeHitRadius = 16;

      enemies.forEach(enemy => {
        if (!enemy.isDead) {
          const dist = Math.hypot(enemy.x - bx, enemy.y - by);
          if (dist < bladeHitRadius + enemy.radius) {
            if (!enemy.lastBladeHitTime || performance.now() - enemy.lastBladeHitTime > 250) {
              enemy.lastBladeHitTime = performance.now();
              enemy.takeDamage(damage, false);
              // Knockback outward
              const kbAngle = Math.atan2(enemy.y - this.player.y, enemy.x - this.player.x);
              enemy.x += Math.cos(kbAngle) * 35;
              enemy.y += Math.sin(kbAngle) * 35;
              window.audioEngine.playBladeHit();
              window.particleEngine.emitHitSplatter(enemy.x, enemy.y, '#ffffff', 4);
            }
          }
        }
      });
    }
  }

  // =========================================================================
  // Secondary Weapon: Lightning Emitter
  // =========================================================================
  updateLightning(dt, enemies) {
    const data = this.activeWeapons.LIGHTNING;
    const config = CONFIG.WEAPONS.LIGHTNING.levels[data.level - 1];
    data.timer = (data.timer || 0) + dt;

    const cooldown = config.cooldown * this.getCooldownMultiplier();
    if (data.timer >= cooldown) {
      data.timer = 0;
      // Strike multiple random enemies
      const candidates = enemies.filter(e => !e.isDead && Math.hypot(e.x - this.player.x, e.y - this.player.y) < 600);
      if (candidates.length > 0) {
        // Shuffle candidates
        for (let i = candidates.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
        }

        const strikes = Math.min(config.strikes, candidates.length);
        const damage = config.damage * this.getDamageMultiplier();

        for (let i = 0; i < strikes; i++) {
          const target = candidates[i];
          target.takeDamage(damage, true);
          // Lightning Visual Effect
          window.particleEngine.particles.push({
            type: 'lightning',
            startX: target.x + (Math.random() - 0.5) * 40,
            startY: target.y - 450,
            endX: target.x,
            endY: target.y,
            life: 0.18,
            maxLife: 0.18,
          });
        }
        window.audioEngine.playLightning();
        if (strikes > 0 && window.gameInstance) {
          window.gameInstance.triggerScreenShake(4, 0.15);
        }
      }
    }
  }

  // =========================================================================
  // Secondary Weapon: Attack Drones
  // =========================================================================
  updateDrones() {
    const data = this.activeWeapons.DRONE;
    if (!data) return;
    const config = CONFIG.WEAPONS.DRONE.levels[data.level - 1];
    const droneCount = config.count;

    this.drones = [];
    for (let i = 0; i < droneCount; i++) {
      this.drones.push({
        id: i,
        angleOffset: (i * Math.PI) + Math.PI / 4,
        x: this.player.x,
        y: this.player.y,
        timer: Math.random() * 0.5
      });
    }
  }

  updateDronesSystem(dt, enemies) {
    const data = this.activeWeapons.DRONE;
    const config = CONFIG.WEAPONS.DRONE.levels[data.level - 1];
    data.timer = (data.timer || 0) + dt;

    const cooldown = config.cooldown * this.getCooldownMultiplier();

    // Update Drone positions around player
    const orbitDist = 48;
    this.drones.forEach((drone, idx) => {
      const targetX = this.player.x + Math.cos(this.orbitBladesAngle * 0.5 + drone.angleOffset) * orbitDist;
      const targetY = this.player.y + Math.sin(this.orbitBladesAngle * 0.5 + drone.angleOffset) * orbitDist;
      drone.x += (targetX - drone.x) * dt * 8;
      drone.y += (targetY - drone.y) * dt * 8;
    });

    if (data.timer >= cooldown) {
      data.timer = 0;
      // Fire micro-missiles from drones
      const target = this.findBestTarget(enemies, 500);
      if (target) {
        this.drones.forEach(drone => {
          for (let m = 0; m < config.missiles; m++) {
            const spread = (Math.random() - 0.5) * 0.6;
            const angle = Math.atan2(target.y - drone.y, target.x - drone.x) + spread;
            this.projectiles.push({
              type: 'micro_missile',
              x: drone.x,
              y: drone.y,
              vx: Math.cos(angle) * 360,
              vy: Math.sin(angle) * 360,
              target: target,
              damage: config.damage * this.getDamageMultiplier(),
              radius: 40 * this.getAoeMultiplier(),
              life: 1.6,
            });
          }
        });
        window.audioEngine.playRocketLaunch();
      }
    }
  }

  // =========================================================================
  // Secondary Weapon: Molotov Cocktail
  // =========================================================================
  updateMolotov(dt, enemies) {
    const data = this.activeWeapons.MOLOTOV;
    const config = CONFIG.WEAPONS.MOLOTOV.levels[data.level - 1];
    data.timer = (data.timer || 0) + dt;

    const cooldown = config.cooldown * this.getCooldownMultiplier();
    if (data.timer >= cooldown) {
      data.timer = 0;
      const count = config.count;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const throwDist = 100 + Math.random() * 150;
        this.projectiles.push({
          type: 'molotov_bottle',
          startX: this.player.x,
          startY: this.player.y,
          targetX: this.player.x + Math.cos(angle) * throwDist,
          targetY: this.player.y + Math.sin(angle) * throwDist,
          progress: 0,
          flightDuration: 0.55,
          damage: config.damage * this.getDamageMultiplier(),
          burnDuration: config.duration,
          burnRadius: config.radius * this.getAoeMultiplier(),
        });
      }
    }
  }

  // =========================================================================
  // Projectile Physics & Collision
  // =========================================================================
  updateProjectiles(dt, enemies) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];

      // 1. Bazooka Rockets
      if (proj.type === 'rocket') {
        proj.life -= dt;
        proj.x += proj.vx * dt;
        proj.y += proj.vy * dt;

        if (proj.isDickRocket) {
          // Rainbow sparkle and glitter trail
          if (Math.random() < 0.65) {
            const rainbowColors = ['#ff1744', '#ff9100', '#ffd600', '#00e676', '#00b0ff', '#d500f9', '#ff4081'];
            const rColor = rainbowColors[Math.floor(Math.random() * rainbowColors.length)];
            window.particleEngine.particles.push({
              type: 'rainbow_sparkle',
              x: proj.x + (Math.random() - 0.5) * 8,
              y: proj.y + (Math.random() - 0.5) * 8,
              vx: (Math.random() - 0.5) * 22,
              vy: (Math.random() - 0.5) * 22,
              life: 0.35 + Math.random() * 0.25,
              maxLife: 0.6,
              size: 4 + Math.random() * 3,
              color: rColor,
            });
          }
        } else if (proj.isWeedLeaf) {
          // Spin the leaf
          proj.spinAngle += dt * 14;
          // Emit herbal green smoke trail
          if (Math.random() < 0.6) {
            window.particleEngine.particles.push({
              type: 'weed_smoke',
              x: proj.x + (Math.random() - 0.5) * 6,
              y: proj.y + (Math.random() - 0.5) * 6,
              vx: (Math.random() - 0.5) * 18,
              vy: (Math.random() - 0.5) * 18 - 10,
              life: 0.45 + Math.random() * 0.25,
              maxLife: 0.7,
              size: 5 + Math.random() * 5,
              color: Math.random() < 0.5 ? '#00e676' : '#76ff03',
            });
          }
        } else {
          // Normal smoke trail
          window.particleEngine.emitRocketTrail(proj.x, proj.y, proj.angle);
        }

        // Check collision with enemies
        let collided = false;
        if (enemies) {
          for (let j = 0; j < enemies.length; j++) {
            const enemy = enemies[j];
            if (!enemy.isDead && Math.hypot(enemy.x - proj.x, enemy.y - proj.y) < enemy.radius + 12) {
              collided = true;
              break;
            }
          }
        }

        if (collided || proj.life <= 0) {
          this.detonateRocket(proj, enemies);
          this.projectiles.splice(i, 1);
          continue;
        }
      }

      // 2. Micro Missiles
      else if (proj.type === 'micro_missile') {
        proj.life -= dt;
        // Slight homing
        if (proj.target && !proj.target.isDead) {
          const desiredAngle = Math.atan2(proj.target.y - proj.y, proj.target.x - proj.x);
          const currentAngle = Math.atan2(proj.vy, proj.vx);
          let diff = desiredAngle - currentAngle;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;
          const newAngle = currentAngle + diff * dt * 5;
          const speed = Math.hypot(proj.vx, proj.vy);
          proj.vx = Math.cos(newAngle) * speed;
          proj.vy = Math.sin(newAngle) * speed;
        }

        proj.x += proj.vx * dt;
        proj.y += proj.vy * dt;
        window.particleEngine.emitRocketTrail(proj.x, proj.y, Math.atan2(proj.vy, proj.vx));

        let collided = false;
        if (enemies) {
          for (let j = 0; j < enemies.length; j++) {
            const enemy = enemies[j];
            if (!enemy.isDead && Math.hypot(enemy.x - proj.x, enemy.y - proj.y) < enemy.radius + 8) {
              collided = true;
              break;
            }
          }
        }

        if (collided || proj.life <= 0) {
          window.particleEngine.createExplosion(proj.x, proj.y, proj.radius, false);
          window.audioEngine.playExplosion(false);
          this.applyAoEDamage(proj.x, proj.y, proj.radius, proj.damage, enemies, 0.4);
          this.projectiles.splice(i, 1);
          continue;
        }
      }

      // 3. Molotov Flying Bottle
      else if (proj.type === 'molotov_bottle') {
        proj.progress += dt / proj.flightDuration;
        if (proj.progress >= 1) {
          // Shatters on ground
          window.particleEngine.createExplosion(proj.targetX, proj.targetY, 30, false);
          window.particleEngine.addNapalmPatch(proj.targetX, proj.targetY, proj.burnRadius, proj.burnDuration, proj.damage);
          window.audioEngine.playExplosion(false);
          this.projectiles.splice(i, 1);
          continue;
        }
        // Parabolic arc interpolation
        proj.x = proj.startX + (proj.targetX - proj.startX) * proj.progress;
        proj.y = proj.startY + (proj.targetY - proj.startY) * proj.progress - Math.sin(proj.progress * Math.PI) * 40;
      }
    }
  }

  // Rocket Detonation & AoE
  detonateRocket(proj, enemies) {
    const isNuke = proj.isNuke;

    // Visual explosion & audio
    window.particleEngine.createExplosion(proj.x, proj.y, proj.radius, isNuke);
    window.audioEngine.playExplosion(isNuke);

    // Screen shake
    if (window.gameInstance) {
      window.gameInstance.triggerScreenShake(isNuke ? 16 : 8, isNuke ? 0.45 : 0.22);
    }

    // Apply AoE Damage to all enemies in radius
    this.applyAoEDamage(proj.x, proj.y, proj.radius, proj.damage, enemies, isNuke ? 1.0 : 0.6);

    // Napalm ground patch
    if (proj.napalm) {
      window.particleEngine.addNapalmPatch(proj.x, proj.y, proj.radius * 0.75, 3.0, proj.damage * 0.35);
    }

    // Cluster bomblets
    if (proj.cluster && !proj._isClusterBomblet) {
      for (let k = 0; k < 4; k++) {
        const clusterAngle = (k * Math.PI / 2) + (Math.random() - 0.5) * 0.4;
        const clusterSpeed = 160 + Math.random() * 80;
        this.projectiles.push({
          type: 'rocket',
          _isClusterBomblet: true,
          isNuke: false,
          isWeedLeaf: proj.isWeedLeaf,
          isDickRocket: proj.isDickRocket,
          spinAngle: 0,
          x: proj.x,
          y: proj.y,
          vx: Math.cos(clusterAngle) * clusterSpeed,
          vy: Math.sin(clusterAngle) * clusterSpeed,
          angle: clusterAngle,
          damage: proj.damage * 0.4,
          radius: proj.radius * 0.65,
          napalm: false,
          cluster: false,
          life: 0.35 + Math.random() * 0.15,
        });
      }
    }

    // Peter Mode: burst rainbow sparkles
    if (proj.isDickRocket) {
      const rainbowColors = ['#ff1744', '#ff9100', '#ffd600', '#00e676', '#00b0ff', '#d500f9', '#ff4081'];
      for (let k = 0; k < 18; k++) {
        const fAngle = Math.random() * Math.PI * 2;
        const fSpeed = 70 + Math.random() * 130;
        window.particleEngine.particles.push({
          type: 'rainbow_sparkle',
          x: proj.x,
          y: proj.y,
          vx: Math.cos(fAngle) * fSpeed,
          vy: Math.sin(fAngle) * fSpeed,
          life: 0.5 + Math.random() * 0.35,
          maxLife: 0.85,
          size: 4 + Math.random() * 4,
          color: rainbowColors[k % rainbowColors.length]
        });
      }
    }

    // Weed Mode: burst herbal leaf fragments
    if (proj.isWeedLeaf) {
      for (let k = 0; k < 12; k++) {
        const fAngle = Math.random() * Math.PI * 2;
        const fSpeed = 60 + Math.random() * 110;
        window.particleEngine.particles.push({
          type: 'weed_frag',
          x: proj.x,
          y: proj.y,
          vx: Math.cos(fAngle) * fSpeed,
          vy: Math.sin(fAngle) * fSpeed,
          life: 0.5 + Math.random() * 0.3,
          maxLife: 0.8,
          size: 4 + Math.random() * 5,
          spinAngle: Math.random() * Math.PI * 2,
          spinSpeed: (Math.random() - 0.5) * 18,
          color: Math.random() < 0.5 ? '#00e676' : '#64dd17',
        });
      }
    }
  }

  // Helper: Radial Area-of-Effect Damage
  applyAoEDamage(x, y, radius, damage, enemies, knockbackMultiplier = 0.5) {
    if (!enemies) return;
    for (let i = 0; i < enemies.length; i++) {
      const enemy = enemies[i];
      if (enemy.isDead) continue;

      const dist = Math.hypot(enemy.x - x, enemy.y - y);
      if (dist < radius + enemy.radius) {
        // Distance falloff (deal at least 60% damage even at outer edge)
        const falloff = Math.max(0.6, 1 - (dist / radius) * 0.4);
        const actualDamage = damage * falloff;
        const isCrit = dist < radius * 0.35; // Direct center hit is critical!

        enemy.takeDamage(actualDamage, isCrit);

        // Knockback from blast epicenter
        const kbAngle = Math.atan2(enemy.y - y, enemy.x - x);
        const kbForce = (1 - dist / radius) * 65 * knockbackMultiplier;
        enemy.x += Math.cos(kbAngle) * kbForce;
        enemy.y += Math.sin(kbAngle) * kbForce;
      }
    }
  }

  // =========================================================================
  // Rendering Weapons & Projectiles
  // =========================================================================
  render(ctx) {
    // 1. Render Orbiting Guardian Blades
    if (this.activeWeapons.GUARDIAN) {
      const config = CONFIG.WEAPONS.GUARDIAN.levels[this.activeWeapons.GUARDIAN.level - 1];
      const count = config.count;
      const radius = config.radius;

      for (let i = 0; i < count; i++) {
        const angle = this.orbitBladesAngle + (i * (Math.PI * 2) / count);
        const bx = this.player.x + Math.cos(angle) * radius;
        const by = this.player.y + Math.sin(angle) * radius;

        ctx.save();
        ctx.translate(bx, by);
        ctx.rotate(this.orbitBladesAngle * 4); // Fast self-spin

        // Sawblade shape
        ctx.fillStyle = '#cfd8dc';
        ctx.strokeStyle = '#37474f';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let s = 0; s < 8; s++) {
          const toothAngle = (s * Math.PI * 2) / 8;
          const outerR = 14;
          const innerR = 9;
          ctx.lineTo(Math.cos(toothAngle) * outerR, Math.sin(toothAngle) * outerR);
          ctx.lineTo(Math.cos(toothAngle + 0.3) * innerR, Math.sin(toothAngle + 0.3) * innerR);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Center hub
        ctx.fillStyle = '#ff9800';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
    }

    // 2. Render Support Drones
    if (this.activeWeapons.DRONE) {
      this.drones.forEach(drone => {
        ctx.save();
        ctx.translate(drone.x, drone.y);

        // Drone shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 14, 10, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Drone Body
        ctx.fillStyle = '#607d8b';
        ctx.strokeStyle = '#263238';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Eye / Lens
        ctx.fillStyle = '#00e5ff';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();

        // Mini rotor blades
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-14, -6);
        ctx.lineTo(14, -6);
        ctx.stroke();

        ctx.restore();
      });
    }

    // 3. Render Projectiles (Rockets, Missiles, Molotov Bottles)
    this.projectiles.forEach(proj => {
      ctx.save();
      ctx.translate(proj.x, proj.y);

      if (proj.type === 'rocket') {
        if (proj.isDickRocket) {
          ctx.rotate(proj.angle);
          this.renderDickRocket(ctx, proj);
        } else if (proj.isWeedLeaf) {
          // Spinning cannabis leaf
          ctx.rotate(proj.spinAngle || 0);
          this.renderWeedLeaf(ctx, 16);
        } else {
          ctx.rotate(proj.angle);

          // Rocket Body
          const isNuke = proj.isNuke;
          const length = isNuke ? 32 : 22;
          const width = isNuke ? 10 : 6;

          // Tail fins
          ctx.fillStyle = isNuke ? '#4a148c' : '#37474f';
          ctx.beginPath();
          ctx.moveTo(-length / 2, -width);
          ctx.lineTo(-length / 2 + 6, 0);
          ctx.lineTo(-length / 2, width);
          ctx.closePath();
          ctx.fill();

          // Cylinder body
          ctx.fillStyle = isNuke ? '#7b1fa2' : '#546e7a';
          ctx.fillRect(-length / 2 + 4, -width / 2, length - 8, width);

          // Warhead tip
          ctx.fillStyle = isNuke ? '#ff007f' : '#f44336';
          ctx.beginPath();
          ctx.moveTo(length / 2 - 4, -width / 2);
          ctx.lineTo(length / 2 + 5, 0);
          ctx.lineTo(length / 2 - 4, width / 2);
          ctx.closePath();
          ctx.fill();

          if (isNuke) {
            // Radioactive symbol / yellow ring
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.arc(0, 0, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        } // end else (non-weed rocket)
      } else if (proj.type === 'micro_missile') {
        const angle = Math.atan2(proj.vy, proj.vx);
        ctx.rotate(angle);
        ctx.fillStyle = '#29b6f6';
        ctx.fillRect(-6, -2, 12, 4);
        ctx.fillStyle = '#e91e63';
        ctx.beginPath();
        ctx.arc(6, 0, 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (proj.type === 'molotov_bottle') {
        ctx.rotate(proj.progress * 15);
        ctx.fillStyle = '#8d6e63';
        ctx.fillRect(-4, -6, 8, 12);
        ctx.fillStyle = '#ff9800'; // burning rag
        ctx.fillRect(-2, -10, 4, 4);
      }

      ctx.restore();
    });

    // 4. Render Lightning Bolts
    for (let i = window.particleEngine.particles.length - 1; i >= 0; i--) {
      const p = window.particleEngine.particles[i];
      if (p.type === 'lightning') {
        const alpha = p.life / p.maxLife;
        ctx.save();
        ctx.strokeStyle = `rgba(0, 229, 255, ${alpha})`;
        ctx.lineWidth = 3.5;
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 10;

        ctx.beginPath();
        ctx.moveTo(p.startX, p.startY);
        // Jagged path
        const segments = 6;
        for (let s = 1; s < segments; s++) {
          const frac = s / segments;
          const mx = p.startX + (p.endX - p.startX) * frac + (Math.random() - 0.5) * 45;
          const my = p.startY + (p.endY - p.startY) * frac;
          ctx.lineTo(mx, my);
        }
        ctx.lineTo(p.endX, p.endY);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  // =========================================================================
  // Weed Leaf Shape Renderer — 7-pointed cannabis-style leaf
  // =========================================================================
  renderWeedLeaf(ctx, radius) {
    const points = 7;
    const innerRadius = radius * 0.42;
    ctx.shadowColor = '#00e676';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#00c853';
    ctx.strokeStyle = '#64dd17';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? radius : innerRadius;
      const angle = (i * Math.PI) / points - Math.PI / 2;
      if (i === 0) {
        ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
      } else {
        ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
      }
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Stem
    ctx.strokeStyle = '#1b5e20';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, innerRadius * 0.5);
    ctx.lineTo(0, radius * 0.85);
    ctx.stroke();
  }

  // =========================================================================
  // Dick Rocket Shape Renderer (Peter In The House)
  // =========================================================================
  renderDickRocket(ctx, proj) {
    const isNuke = proj.isNuke;
    const length = isNuke ? 36 : 26;
    const width = isNuke ? 13 : 9;

    ctx.save();
    ctx.shadowColor = '#ff4081';
    ctx.shadowBlur = 8;

    // Dual spherical base (balls)
    ctx.fillStyle = '#ec407a';
    ctx.strokeStyle = '#ad1457';
    ctx.lineWidth = 1.2;

    // Ball 1
    ctx.beginPath();
    ctx.arc(-length / 2 + 2, -width * 0.65, width * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Ball 2
    ctx.beginPath();
    ctx.arc(-length / 2 + 2, width * 0.65, width * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Shaft
    ctx.fillStyle = '#f48fb1';
    ctx.fillRect(-length / 2 + 2, -width / 2, length - 8, width);
    ctx.strokeRect(-length / 2 + 2, -width / 2, length - 8, width);

    // Glans / Head
    const headX = length / 2 - 6;
    const headR = width * 0.72;
    ctx.fillStyle = '#d81b60';
    ctx.strokeStyle = '#880e4f';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(headX, 0, headR, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(headX - 1, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Tip slit
    ctx.strokeStyle = '#880e4f';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(headX + headR - 1, -2);
    ctx.lineTo(headX + headR - 1, 2);
    ctx.stroke();

    ctx.restore();
  }
}
