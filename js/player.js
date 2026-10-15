/**
 * Abu Madfa3 - Survivor.io Replica
 * Player Entity (Soldier with Shoulder-Mounted Bazooka)
 */

class Player {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.radius = CONFIG.PLAYER.RADIUS;

    this.maxHp = CONFIG.PLAYER.BASE_HP;
    this.hp = this.maxHp;
    this.hpRegen = CONFIG.PLAYER.HP_REGEN;
    this.speed = CONFIG.PLAYER.BASE_SPEED;
    this.pickupRadius = CONFIG.PLAYER.PICKUP_RADIUS;

    this.level = 1;
    this.currentXp = 0;
    this.nextLevelXp = 5;

    this.invulnerableTimer = 0;
    this.facing = 1; // 1 for right, -1 for left
    this.aimAngle = 0;
    this.recoilOffset = 0;
    this.walkCycle = 0;
    this.isMoving = false;
    this.bazookaScale = 1.0;
    this.isAnthonyBuffed = false;
    this.isWeedMode = false;
    this.isPeterMode = false;
    this.isLuigiMode = false;

    // Contact damage & 7s health regeneration tracking
    this.timeSinceLastContact = 999;
    this.contactDamageCooldown = 0;
    this.regenParticleTimer = 0;

    this.weaponManager = null; // Connected by Game Engine
  }

  reset() {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.level = 1;
    this.currentXp = 0;
    this.nextLevelXp = 5;
    this.invulnerableTimer = 0;
    this.recoilOffset = 0;
    this.walkCycle = 0;
    this.isMoving = false;
    this.bazookaScale = 1.0;
    this.isAnthonyBuffed = false;
    this.isWeedMode = false;
    this.isPeterMode = false;
    this.isLuigiMode = false;
    this.radius = CONFIG.PLAYER.RADIUS;
    this.timeSinceLastContact = 999;
    this.contactDamageCooldown = 0;
    this.regenParticleTimer = 0;
    this.recalculateStats();
    this.hp = this.maxHp;
  }

  recalculateStats() {
    if (!this.weaponManager) {
      this.maxHp = CONFIG.PLAYER.BASE_HP;
      this.speed = CONFIG.PLAYER.BASE_SPEED;
      this.pickupRadius = CONFIG.PLAYER.PICKUP_RADIUS;
      this.hpRegen = 0;
      return;
    }

    const passives = this.weaponManager.activePassives;

    // Movement Speed (Sneakers)
    let speedMult = 1.0;
    if (passives.SNEAKERS) {
      const lvl = passives.SNEAKERS.level - 1;
      speedMult += CONFIG.PASSIVES.SNEAKERS.levels[lvl].value;
    }
    this.speed = CONFIG.PLAYER.BASE_SPEED * speedMult;

    // Armor & HP (Armor Plate)
    let hpBonus = 0;
    let regenBonus = 0;
    if (passives.ARMOR) {
      const lvl = passives.ARMOR.level - 1;
      hpBonus = CONFIG.PASSIVES.ARMOR.levels[lvl].maxHpBonus;
      regenBonus = CONFIG.PASSIVES.ARMOR.levels[lvl].regen;
    }
    const oldMax = this.maxHp;
    this.maxHp = CONFIG.PLAYER.BASE_HP + hpBonus;
    if (this.maxHp > oldMax) {
      this.hp += (this.maxHp - oldMax); // Give bonus HP immediately
    }
    this.hpRegen = regenBonus;

    // Pickup Range (Magnet)
    let magnetMult = 1.0;
    if (passives.MAGNET) {
      const lvl = passives.MAGNET.level - 1;
      magnetMult += CONFIG.PASSIVES.MAGNET.levels[lvl].value;
    }
    this.pickupRadius = CONFIG.PLAYER.PICKUP_RADIUS * magnetMult;

    // Secret Anthony Protocol Buffs (Balanced significant boost, no god mode)
    if (this.isAnthonyBuffed) {
      this.speed *= 1.20; // +20% sprint speed
      this.maxHp += 40;   // +40 Max HP
      this.hpRegen += 1.0; // +1.0 HP/sec regen
      this.pickupRadius *= 1.25; // +25% pickup range
    }

    // Mharreb Query Weed Mode Buffs
    if (this.isWeedMode) {
      this.speed *= 1.22; // +22% sprint speed
      this.hpRegen += 3;
    }

    // Peter In The House / Gay Vibes Mode Buffs
    if (this.isPeterMode) {
      this.speed *= 1.30; // +30% fabulous combat speed
      this.hpRegen += 4;
    }

    // Luigi Time / Big Green Ogre Buffs
    if (this.isLuigiMode) {
      this.maxHp += 150; // Hulking ogre health
      this.hpRegen += 2.0; // Ogre regeneration
      this.pickupRadius *= 1.30;
    }
  }

  activateAnthonyProtocol() {
    this.isAnthonyBuffed = true;
    this.bazookaScale = 1.35; // Reinforced launcher
    this.recalculateStats();
    this.hp = Math.min(this.maxHp, this.hp + 50); // Partial health boost
    if (this.weaponManager) {
      this.weaponManager.applyAnthonyBuff();
    }
    window.particleEngine.emitLevelUpSparks(this.x, this.y);
    window.audioEngine.playLevelUp();
  }

  activateLuigiMode() {
    this.isLuigiMode = true;
    this.radius = 22; // Larger ogre hitbox
    this.bazookaScale = 1.35; // Sturdy RPG launcher
    this.recalculateStats();
    this.hp = Math.min(this.maxHp, this.hp + 100);
    if (this.weaponManager) {
      this.weaponManager.activateLuigiMode();
    }
    window.particleEngine.emitHitSplatter(this.x, this.y, '#76ff03', 35);
    window.audioEngine.playLevelUp();
  }

  activateWeedMode() {
    this.isWeedMode = true;
    this.recalculateStats();
    if (this.weaponManager) {
      this.weaponManager.activateWeedMode();
    }
    window.particleEngine.emitHitSplatter(this.x, this.y, '#00e676', 25);
  }

  activatePeterMode() {
    this.isPeterMode = true;
    this.recalculateStats();
    if (this.weaponManager) {
      this.weaponManager.activatePeterMode();
    }
    window.particleEngine.emitLevelUpSparks(this.x, this.y);
    window.audioEngine.playLevelUp();
  }

  // Handle direct contact with enemy swarm
  onEnemyContact(enemy, dt) {
    this.timeSinceLastContact = 0; // Immediate contact reset
    if (this.contactDamageCooldown <= 0) {
      this.contactDamageCooldown = 0.35; // Tick contact damage every 0.35s
      const damage = (enemy && enemy.damage) ? enemy.damage : 10;
      this.takeDamage(damage);
    }
  }

  update(dt) {
    // 1. Read Input
    const move = window.inputController.getMovementVector();
    this.isMoving = move.magnitude > 0.1;

    // Acceleration & Velocity
    const targetVx = move.x * this.speed;
    const targetVy = move.y * this.speed;
    this.vx += (targetVx - this.vx) * dt * 12;
    this.vy += (targetVy - this.vy) * dt * 12;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Clamp to world boundaries
    const halfW = CONFIG.WORLD_WIDTH / 2 - 40;
    const halfH = CONFIG.WORLD_HEIGHT / 2 - 40;
    this.x = Math.max(-halfW, Math.min(halfW, this.x));
    this.y = Math.max(-halfH, Math.min(halfH, this.y));

    // Facing direction based on movement or aim
    if (Math.abs(this.vx) > 10) {
      this.facing = this.vx > 0 ? 1 : -1;
    }

    // Walk animation bobbing
    if (this.isMoving) {
      this.walkCycle += dt * 12;
      // Emit occasional walking dust puffs
      if (Math.random() > 0.6) {
        window.particleEngine.emit(
          this.x + (Math.random() - 0.5) * 12,
          this.y + 14,
          -this.vx * 0.2 + (Math.random() - 0.5) * 10,
          -this.vy * 0.2 + (Math.random() - 0.5) * 10,
          'rgba(180, 190, 200, 0.4)',
          4, 0.25, true, 'smoke'
        );
      }
    } else {
      this.walkCycle = 0;
    }

    // Contact damage cooldown
    if (this.contactDamageCooldown > 0) {
      this.contactDamageCooldown -= dt;
    }

    // Invulnerability timer decay
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
    }

    // Recoil recovery
    if (this.recoilOffset > 0) {
      this.recoilOffset = Math.max(0, this.recoilOffset - dt * 35);
    }

    // Track time since last contact with any enemy
    this.timeSinceLastContact += dt;

    // After 7 seconds of no contact with enemies, health starts regenerating!
    if (this.timeSinceLastContact >= 7.0 && this.hp > 0 && this.hp < this.maxHp) {
      // Regenerate 10% of max HP per second (min 14 HP/sec) + any passive hpRegen
      const baseRegen = Math.max(14, this.maxHp * 0.10);
      const totalRegenRate = baseRegen + (this.hpRegen || 0);
      this.hp = Math.min(this.maxHp, this.hp + totalRegenRate * dt);

      // Visual green healing sparkles while regenerating
      this.regenParticleTimer = (this.regenParticleTimer || 0) + dt;
      if (this.regenParticleTimer >= 0.35) {
        this.regenParticleTimer = 0;
        window.particleEngine.emit(
          this.x + (Math.random() - 0.5) * 16,
          this.y + (Math.random() - 0.5) * 16,
          (Math.random() - 0.5) * 18,
          -25 - Math.random() * 20,
          '#00e676',
          3.5,
          0.3,
          true,
          'circle'
        );
      }
    } else if (this.hpRegen > 0 && this.hp < this.maxHp) {
      // Passive armor regen still applies continuously if unlocked
      this.hp = Math.min(this.maxHp, this.hp + this.hpRegen * dt);
    }
  }

  takeDamage(amount) {
    if (this.invulnerableTimer > 0 || this.hp <= 0) return;

    this.hp -= amount;
    this.timeSinceLastContact = 0; // Reset 7-second regeneration timer
    this.invulnerableTimer = CONFIG.PLAYER.INVULNERABLE_DURATION;

    window.audioEngine.playPlayerHit();
    window.particleEngine.emitHitSplatter(this.x, this.y, '#f44336', 8);

    if (window.gameInstance) {
      window.gameInstance.triggerScreenShake(6, 0.2);
    }

    if (this.hp <= 0) {
      this.hp = 0;
      if (window.gameInstance) {
        window.gameInstance.triggerGameOver();
      }
    }
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
    window.particleEngine.emit(
      this.x, this.y,
      0, -40,
      '#00e676', 6, 0.5, true, 'spark'
    );
  }

  addXP(amount) {
    this.currentXp += amount;
    if (this.currentXp >= this.nextLevelXp) {
      this.currentXp -= this.nextLevelXp;
      this.level++;
      // XP scaling curve
      this.nextLevelXp = Math.floor(this.nextLevelXp * 1.35 + 8);

      window.audioEngine.playLevelUp();
      window.particleEngine.emitLevelUpSparks(this.x, this.y);

      if (window.gameInstance) {
        window.gameInstance.triggerLevelUp();
      }
    }
  }

  // =========================================================================
  // Character & Shoulder-Mounted Bazooka Rendering
  // =========================================================================
  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // Flashing effect if recently hit
    if (this.invulnerableTimer > 0) {
      const flash = Math.floor(Date.now() / 60) % 2 === 0;
      if (flash) ctx.globalAlpha = 0.45;
    }

    // Golden Aura when Anthony protocol is active
    if (this.isAnthonyBuffed) {
      ctx.save();
      const pulse = Math.sin(Date.now() / 150) * 4;
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.7)';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(0, 0, 24 + pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Herbal Aura when Weed mode is active
    if (this.isWeedMode) {
      ctx.save();
      const pulse = Math.sin(Date.now() / 200) * 3;
      ctx.strokeStyle = 'rgba(0, 230, 118, 0.75)';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#00e676';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(0, 0, 22 + pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Rainbow Gay Vibes Aura when Peter mode is active
    if (this.isPeterMode) {
      ctx.save();
      const pulse = Math.sin(Date.now() / 150) * 4;
      ctx.lineWidth = 3;
      ctx.shadowColor = '#ff4081';
      ctx.shadowBlur = 18;
      const colors = ['#ff1744', '#ff9100', '#ffd600', '#00e676', '#00b0ff', '#d500f9'];
      const strokeColor = colors[Math.floor((Date.now() / 180) % colors.length)];
      ctx.strokeStyle = strokeColor;
      ctx.beginPath();
      ctx.arc(0, 0, 24 + pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Swamp Slime Aura when Luigi mode is active
    if (this.isLuigiMode) {
      ctx.save();
      const pulse = Math.sin(Date.now() / 170) * 4;
      ctx.strokeStyle = 'rgba(118, 255, 3, 0.75)';
      ctx.lineWidth = 3.5;
      ctx.shadowColor = '#76ff03';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(0, 0, 26 + pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 1. Shadow on ground
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 16, this.isLuigiMode ? 22 : 16, this.isLuigiMode ? 10 : 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Bobbing offset
    const bob = Math.sin(this.walkCycle) * 3;
    const stride = Math.sin(this.walkCycle) * 7;

    if (this.isLuigiMode) {
      // 2, 3, 4: Render Big Green Ogre Body
      this.renderOgreModel(ctx, bob, stride);
    } else {
      // 2. Walking Legs / Combat Boots
      ctx.fillStyle = this.isPeterMode ? '#880e4f' : '#263238';
      // Left leg
      ctx.fillRect(-8, 8 + bob + stride, 6, 9);
      // Right leg
      ctx.fillRect(2, 8 + bob - stride, 6, 9);

      // 3. Torso / Tactical Camouflage Vest
      ctx.fillStyle = this.isPeterMode ? '#ff4081' : (this.isAnthonyBuffed ? '#b8860b' : '#455a64');
      ctx.fillRect(-10, -8 + bob, 20, 18);

      // Tactical pouches & belt
      ctx.fillStyle = this.isPeterMode ? '#ffd600' : '#ff9800';
      ctx.fillRect(-10, 7 + bob, 20, 3);
      ctx.fillStyle = this.isPeterMode ? '#ad1457' : '#37474f';
      ctx.fillRect(-7, -4 + bob, 5, 8);
      ctx.fillRect(2, -4 + bob, 5, 8);

      // 4. Head & Helmet
      // Face
      ctx.fillStyle = '#ffcc80';
      ctx.beginPath();
      ctx.arc(0, -14 + bob, 8, 0, Math.PI * 2);
      ctx.fill();

      // Eyes
      ctx.fillStyle = '#212121';
      const eyeDir = Math.cos(this.aimAngle) > 0 ? 2 : -2;
      ctx.fillRect(eyeDir, -16 + bob, 2, 3);

      // Military Helmet
      ctx.fillStyle = this.isPeterMode ? '#d81b60' : (this.isAnthonyBuffed ? '#d4af37' : '#33691e');
      ctx.beginPath();
      ctx.arc(0, -18 + bob, 10, Math.PI, Math.PI * 2);
      ctx.lineTo(10, -15 + bob);
      ctx.lineTo(-10, -15 + bob);
      ctx.closePath();
      ctx.fill();
      // Helmet rim
      ctx.strokeStyle = this.isPeterMode ? '#ff80ab' : (this.isAnthonyBuffed ? '#ffd700' : '#1b5e20');
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // 5. Shoulder-Mounted Weapon (Dildo if Peter Mode, RPG if Ogre, else Bazooka)
    ctx.save();
    // Pivot at soldier's / ogre's shoulder
    const shoulderX = this.isLuigiMode ? 2 : 0;
    const shoulderY = (this.isLuigiMode ? -10 : -6) + bob;
    ctx.translate(shoulderX, shoulderY);
    ctx.rotate(this.aimAngle);

    // Scale weapon size
    ctx.scale(this.bazookaScale, this.bazookaScale);

    // Apply firing recoil offset along barrel
    ctx.translate(-this.recoilOffset, 0);

    const isEvo = this.weaponManager && this.weaponManager.activeWeapons.BAZOOKA && this.weaponManager.activeWeapons.BAZOOKA.isEvo;
    if (this.isPeterMode) {
      this.renderDildoModel(ctx, isEvo);
    } else {
      this.renderBazookaModel(ctx, isEvo);
    }

    ctx.restore();

    // 6. Overhead Health Bar
    const hpBarW = 34;
    const hpBarH = 5;
    const hpPct = Math.max(0, this.hp / this.maxHp);
    const isRegenerating = this.timeSinceLastContact >= 7.0 && this.hp < this.maxHp;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(-hpBarW / 2, -34 + bob, hpBarW, hpBarH);

    // Smooth gradient: Green -> Orange -> Red
    let barColor = '#00e676';
    if (hpPct < 0.3) barColor = '#ff1744';
    else if (hpPct < 0.6) barColor = '#ff9800';

    ctx.fillStyle = barColor;
    ctx.fillRect(-hpBarW / 2, -34 + bob, hpBarW * hpPct, hpBarH);

    ctx.strokeStyle = isRegenerating ? '#00e676' : '#212121';
    ctx.lineWidth = isRegenerating ? 1.5 : 1;
    if (isRegenerating) {
      ctx.shadowColor = '#00e676';
      ctx.shadowBlur = 8;
    }
    ctx.strokeRect(-hpBarW / 2, -34 + bob, hpBarW, hpBarH);
    ctx.shadowBlur = 0;

    ctx.restore();
  }

  // Draw detailed shoulder bazooka weapon model
  renderBazookaModel(ctx, isEvo) {
    if (this.isLuigiMode) {
      this.renderOgreRPGModel(ctx, isEvo);
      return;
    }

    const tubeLength = isEvo ? 44 : 34;
    const tubeWidth = isEvo ? 11 : 7;

    // Rear blast cone
    ctx.fillStyle = isEvo ? '#212121' : '#37474f';
    ctx.beginPath();
    ctx.moveTo(-16, -tubeWidth * 0.8);
    ctx.lineTo(-24, -tubeWidth * 1.3);
    ctx.lineTo(-24, tubeWidth * 1.3);
    ctx.lineTo(-16, tubeWidth * 0.8);
    ctx.closePath();
    ctx.fill();

    // Main launcher tube
    ctx.fillStyle = isEvo ? '#4a148c' : '#4e5d42'; // Dark olive or royal purple
    ctx.fillRect(-16, -tubeWidth / 2, tubeLength, tubeWidth);

    // Metal reinforcement rings & scope
    ctx.fillStyle = isEvo ? '#ffd700' : '#263238';
    ctx.fillRect(-4, -tubeWidth / 2 - 1, 4, tubeWidth + 2);
    ctx.fillRect(8, -tubeWidth / 2 - 1, 4, tubeWidth + 2);

    // Optical Scope
    ctx.fillRect(-2, -tubeWidth / 2 - 6, 12, 4);
    ctx.fillStyle = '#00e5ff';
    ctx.fillRect(8, -tubeWidth / 2 - 5, 2, 2);

    // Front Warhead protruding from muzzle
    const muzzleX = tubeLength - 16;
    ctx.fillStyle = isEvo ? '#ff007f' : '#f44336';
    ctx.beginPath();
    ctx.moveTo(muzzleX, -tubeWidth * 0.7);
    ctx.lineTo(muzzleX + 10, 0);
    ctx.lineTo(muzzleX, tubeWidth * 0.7);
    ctx.closePath();
    ctx.fill();

    // Hands holding the launcher grips
    ctx.fillStyle = '#ffcc80';
    ctx.beginPath();
    ctx.arc(0, 5, 3.5, 0, Math.PI * 2);
    ctx.arc(14, 5, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw heavy RPG-7 launcher held by Big Green Ogre
  renderOgreRPGModel(ctx, isEvo) {
    const tubeLength = isEvo ? 46 : 38;
    const tubeWidth = isEvo ? 12 : 8;

    // Rear exhaust cone
    ctx.fillStyle = '#263238';
    ctx.beginPath();
    ctx.moveTo(-16, -tubeWidth * 0.8);
    ctx.lineTo(-24, -tubeWidth * 1.3);
    ctx.lineTo(-24, tubeWidth * 1.3);
    ctx.lineTo(-16, tubeWidth * 0.8);
    ctx.closePath();
    ctx.fill();

    // Steel launcher tube (dark olive)
    ctx.fillStyle = '#2e3d23';
    ctx.fillRect(-16, -tubeWidth / 2, tubeLength, tubeWidth);

    // Wooden heat shield grip mid-section
    ctx.fillStyle = '#8d6e63';
    ctx.fillRect(-6, -tubeWidth / 2 - 1, 16, tubeWidth + 2);
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(-2, -tubeWidth / 2 - 1, 3, tubeWidth + 2);
    ctx.fillRect(4, -tubeWidth / 2 - 1, 3, tubeWidth + 2);

    // Optical scope
    ctx.fillStyle = '#1b2a1a';
    ctx.fillRect(-2, -tubeWidth / 2 - 7, 12, 4);
    ctx.fillStyle = '#76ff03'; // slimy glowing scope lens
    ctx.fillRect(8, -tubeWidth / 2 - 6, 2, 2);

    // Front Muzzle loaded with Green Mucus Globule
    const muzzleX = tubeLength - 16;
    ctx.fillStyle = '#64dd17';
    ctx.beginPath();
    ctx.arc(muzzleX + 5, 0, tubeWidth * 0.9, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#76ff03';
    ctx.beginPath();
    ctx.arc(muzzleX + 4, -1, tubeWidth * 0.6, 0, Math.PI * 2);
    ctx.fill();

    // Dripping slime drop at muzzle
    ctx.fillStyle = '#b2ff59';
    ctx.beginPath();
    ctx.arc(muzzleX + 8, tubeWidth * 0.8, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Chunky Big Green Ogre hands gripping the handles
    ctx.fillStyle = '#7cb342';
    ctx.strokeStyle = '#558b2f';
    ctx.lineWidth = 1;
    // Rear hand
    ctx.beginPath();
    ctx.arc(0, 6, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Fore hand
    ctx.beginPath();
    ctx.arc(15, 6, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Draw Big Green Ogre character model (Luigi Time)
  renderOgreModel(ctx, bob, stride) {
    // 1. Walking Legs / Heavy Muddy Boots
    ctx.fillStyle = '#4e342e'; // Dark mud leather boots
    ctx.fillRect(-11, 10 + bob + stride, 8, 12);
    ctx.fillStyle = '#3e2723';
    ctx.fillRect(-13, 17 + bob + stride, 11, 5); // boot sole

    ctx.fillStyle = '#4e342e';
    ctx.fillRect(3, 10 + bob - stride, 8, 12);
    ctx.fillStyle = '#3e2723';
    ctx.fillRect(2, 17 + bob - stride, 11, 5);

    // Ogre Knees / Trousers (torn brown burlap pants)
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(-11, 6 + bob + stride * 0.5, 8, 6);
    ctx.fillRect(3, 6 + bob - stride * 0.5, 8, 6);

    // 2. Huge Bulky Ogre Torso
    // Massive green ogre belly & chest
    ctx.fillStyle = '#689f38'; // Darker green shading
    ctx.beginPath();
    ctx.ellipse(0, -5 + bob, 16, 17, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#7cb342'; // Vibrant ogre green skin
    ctx.beginPath();
    ctx.ellipse(0, -6 + bob, 14, 15, 0, 0, Math.PI * 2);
    ctx.fill();

    // Sleeveless Rustic Burlap / Leather Vest
    ctx.fillStyle = '#4e342e';
    ctx.fillRect(-15, -16 + bob, 8, 20);
    ctx.fillRect(7, -16 + bob, 8, 20);
    ctx.fillRect(-14, -18 + bob, 28, 4);

    // Rope / String belt
    ctx.strokeStyle = '#d7ccc8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-14, 3 + bob);
    ctx.lineTo(14, 3 + bob);
    ctx.stroke();

    // Belt knot & dangling rope
    ctx.fillStyle = '#bcaaa4';
    ctx.fillRect(-2, 2 + bob, 5, 5);
    ctx.fillRect(-1, 6 + bob, 3, 6);

    // Leather stitching crosses on vest
    ctx.strokeStyle = '#3e2723';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-11, -8 + bob); ctx.lineTo(-7, -4 + bob);
    ctx.moveTo(-7, -8 + bob); ctx.lineTo(-11, -4 + bob);
    ctx.moveTo(8, -8 + bob); ctx.lineTo(12, -4 + bob);
    ctx.moveTo(12, -8 + bob); ctx.lineTo(8, -4 + bob);
    ctx.stroke();

    // 3. Ogre Head & Distinctive Trumpet Ears
    const headY = -22 + bob;

    // Trumpet / Funnel Ogre Ears (Shrek style)
    // Left ear (flaring funnel outward)
    ctx.fillStyle = '#689f38';
    ctx.strokeStyle = '#33691e';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-10, headY - 2);
    ctx.lineTo(-20, headY - 8);
    ctx.lineTo(-18, headY - 14);
    ctx.lineTo(-9, headY - 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Inner ear funnel opening
    ctx.fillStyle = '#33691e';
    ctx.beginPath();
    ctx.ellipse(-19, headY - 11, 2.5, 4, -0.6, 0, Math.PI * 2);
    ctx.fill();

    // Right ear
    ctx.fillStyle = '#689f38';
    ctx.beginPath();
    ctx.moveTo(10, headY - 2);
    ctx.lineTo(20, headY - 8);
    ctx.lineTo(18, headY - 14);
    ctx.lineTo(9, headY - 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Inner ear funnel opening
    ctx.fillStyle = '#33691e';
    ctx.beginPath();
    ctx.ellipse(19, headY - 11, 2.5, 4, 0.6, 0, Math.PI * 2);
    ctx.fill();

    // Big round green ogre head
    ctx.fillStyle = '#7cb342';
    ctx.beginPath();
    ctx.arc(0, headY, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#558b2f';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Broad ogre jaw / chin
    ctx.fillStyle = '#689f38';
    ctx.beginPath();
    ctx.arc(0, headY + 5, 10, 0, Math.PI);
    ctx.fill();

    // Heavy brow line
    ctx.fillStyle = '#33691e';
    ctx.fillRect(-8, headY - 6, 6, 2.5);
    ctx.fillRect(2, headY - 6, 6, 2.5);

    // Eyes
    const eyeDir = Math.cos(this.aimAngle) > 0 ? 2 : -2;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-4 + eyeDir * 0.5, headY - 2, 2.5, 0, Math.PI * 2);
    ctx.arc(4 + eyeDir * 0.5, headY - 2, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#212121';
    ctx.beginPath();
    ctx.arc(-4 + eyeDir, headY - 2, 1.4, 0, Math.PI * 2);
    ctx.arc(4 + eyeDir, headY - 2, 1.4, 0, Math.PI * 2);
    ctx.fill();

    // Big wide ogre bulbous nose
    ctx.fillStyle = '#558b2f';
    ctx.beginPath();
    ctx.ellipse(eyeDir * 0.5, headY + 2, 4.5, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Friendly / fierce ogre smile with tusks
    ctx.strokeStyle = '#1b5e20';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, headY + 5, 6, 0.2, Math.PI - 0.2);
    ctx.stroke();

    // Small lower white tusks pointing up
    ctx.fillStyle = '#fff9c4';
    ctx.beginPath();
    ctx.moveTo(-4, headY + 7);
    ctx.lineTo(-3, headY + 3.5);
    ctx.lineTo(-2, headY + 7);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(2, headY + 7);
    ctx.lineTo(3, headY + 3.5);
    ctx.lineTo(4, headY + 7);
    ctx.closePath();
    ctx.fill();
  }

  // Draw shoulder-mounted tactical dildo weapon model (Peter In The House)
  renderDildoModel(ctx, isEvo) {
    const length = isEvo ? 48 : 38;
    const width = isEvo ? 14 : 10;

    // Dual spherical base (balls / ergonomic base)
    ctx.fillStyle = '#c2185b';
    ctx.strokeStyle = '#880e4f';
    ctx.lineWidth = 1.5;

    // Bottom ball
    ctx.beginPath();
    ctx.arc(-10, width * 0.7, width * 0.65, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Top ball
    ctx.beginPath();
    ctx.arc(-10, -width * 0.7, width * 0.65, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Phallic shaft
    const shaftGrad = ctx.createLinearGradient(-10, -width / 2, -10, width / 2);
    shaftGrad.addColorStop(0, '#f48fb1');
    shaftGrad.addColorStop(0.3, '#f06292');
    shaftGrad.addColorStop(0.8, '#e91e63');
    shaftGrad.addColorStop(1, '#c2185b');

    ctx.fillStyle = shaftGrad;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(-10, -width / 2, length - 10, width, [4, 0, 0, 4]);
    } else {
      ctx.rect(-10, -width / 2, length - 10, width);
    }
    ctx.fill();
    ctx.stroke();

    // Ribbed texture rings along the shaft
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 2;
    for (let r = 0; r < length - 18; r += 7) {
      ctx.beginPath();
      ctx.moveTo(-6 + r, -width / 2 + 1);
      ctx.lineTo(-6 + r, width / 2 - 1);
      ctx.stroke();
    }

    // Glans / Head of dildo
    const headX = length - 10;
    const headR = width * 0.75;
    ctx.fillStyle = '#ad1457';
    ctx.strokeStyle = '#880e4f';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(headX, 0, headR, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(headX - 2, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Coronal ridge detail
    ctx.strokeStyle = '#ff80ab';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(headX - 2, 0, headR + 1, -Math.PI / 2.5, Math.PI / 2.5);
    ctx.stroke();

    // Slit indent at tip
    ctx.strokeStyle = '#880e4f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(headX + headR - 1, -2);
    ctx.lineTo(headX + headR - 1, 2);
    ctx.stroke();

    // Soldier hands holding the dildo grips
    ctx.fillStyle = '#ffcc80';
    ctx.beginPath();
    ctx.arc(0, 5, 3.5, 0, Math.PI * 2);
    ctx.arc(14, 5, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
}
