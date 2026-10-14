/**
 * Abu Madfa3 - Survivor.io Replica
 * High-Performance Object-Pooled Particle & FX Engine
 */

class ParticleEngine {
  constructor() {
    this.particles = [];
    this.damageNumbers = [];
    this.groundPatches = []; // Persistent napalm fire pools
    this.flashAlpha = 0; // Screen flash for nukes
  }

  reset() {
    this.particles = [];
    this.damageNumbers = [];
    this.groundPatches = [];
    this.flashAlpha = 0;
  }

  // Generic particle emitter
  emit(x, y, vx, vy, color, size, life, decay, type = 'circle') {
    this.particles.push({
      x, y, vx, vy,
      color,
      size,
      maxLife: life,
      life,
      decay,
      type
    });
  }

  // Rocket Exhaust Smoke & Flame
  emitRocketTrail(x, y, angle) {
    const spread = (Math.random() - 0.5) * 0.4;
    const backAngle = angle + Math.PI + spread;
    const speed = 40 + Math.random() * 60;

    // Orange/Yellow Flame spark
    this.emit(
      x, y,
      Math.cos(backAngle) * speed,
      Math.sin(backAngle) * speed,
      Math.random() > 0.4 ? '#ff9800' : '#ffeb3b',
      3 + Math.random() * 2,
      0.15 + Math.random() * 0.1,
      true,
      'circle'
    );

    // Billowing Smoke puff
    if (Math.random() > 0.3) {
      this.emit(
        x, y,
        Math.cos(backAngle) * (speed * 0.4),
        Math.sin(backAngle) * (speed * 0.4),
        'rgba(180, 190, 205, 0.45)',
        5 + Math.random() * 4,
        0.35 + Math.random() * 0.2,
        true,
        'smoke'
      );
    }
  }

  // Explosive Detonation (Normal Bazooka Rocket)
  createExplosion(x, y, radius, isNuke = false) {
    const particleCount = isNuke ? 90 : 38;
    const shockwaveColor = isNuke ? '#e040fb' : '#ff9800';

    if (isNuke) {
      this.flashAlpha = 0.65; // Screen flash
    }

    // Expanding Shockwave Ring
    this.particles.push({
      x, y,
      vx: 0, vy: 0,
      color: shockwaveColor,
      size: 10,
      targetRadius: radius * (isNuke ? 1.4 : 1.15),
      maxLife: 0.32,
      life: 0.32,
      type: 'shockwave'
    });

    // Secondary Inner Bright Ring
    this.particles.push({
      x, y,
      vx: 0, vy: 0,
      color: '#ffffff',
      size: 5,
      targetRadius: radius * 0.75,
      maxLife: 0.2,
      life: 0.2,
      type: 'shockwave'
    });

    // Radial Fire & Shrapnel
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (Math.random() * 0.8 + 0.2) * (radius * 3.5);
      const colors = isNuke 
        ? ['#ff007f', '#e040fb', '#00e5ff', '#ffffff'] 
        : ['#ff3d00', '#ff9100', '#ffea00', '#ffffff', '#424242'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = (isNuke ? 6 : 4) + Math.random() * (isNuke ? 8 : 5);

      this.emit(
        x, y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        color,
        size,
        0.3 + Math.random() * (isNuke ? 0.6 : 0.35),
        true,
        'spark'
      );
    }

    // Lingering Smoke Clouds
    const smokeCount = isNuke ? 25 : 12;
    for (let i = 0; i < smokeCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * (radius * 0.6);
      this.emit(
        x + Math.cos(angle) * dist,
        y + Math.sin(angle) * dist,
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 30,
        'rgba(120, 130, 145, 0.5)',
        12 + Math.random() * 12,
        0.5 + Math.random() * 0.4,
        true,
        'smoke'
      );
    }
  }

  // Napalm Ground Fire Patch
  addNapalmPatch(x, y, radius, duration, damage) {
    this.groundPatches.push({
      x, y,
      radius,
      duration,
      maxDuration: duration,
      damage,
      tickTimer: 0,
      color: '#ff5722'
    });
  }

  // Enemy Hit / Death Splatter
  emitHitSplatter(x, y, color = '#4caf50', count = 8) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 120;
      this.emit(
        x, y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        color,
        2.5 + Math.random() * 3,
        0.25 + Math.random() * 0.2,
        true,
        'splatter'
      );
    }
  }

  // Floating Damage Numbers
  addDamageNumber(x, y, damage, isCrit = false) {
    // Slight random offset
    const offsetX = (Math.random() - 0.5) * 16;
    const offsetY = (Math.random() - 0.5) * 10;
    this.damageNumbers.push({
      x: x + offsetX,
      y: y + offsetY,
      text: Math.round(damage).toString(),
      isCrit,
      vy: isCrit ? -75 : -55,
      life: 0.65,
      maxLife: 0.65,
      scale: isCrit ? 1.4 : 1.0
    });
  }

  // Level-Up Confetti
  emitLevelUpSparks(x, y) {
    const colors = ['#ffd700', '#00e676', '#00b0ff', '#ff1744', '#e040fb'];
    for (let i = 0; i < 45; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 160;
      this.emit(
        x, y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        colors[Math.floor(Math.random() * colors.length)],
        4 + Math.random() * 4,
        0.8 + Math.random() * 0.5,
        true,
        'spark'
      );
    }
  }

  // Update loop
  update(dt, enemies) {
    // Screen Flash decay
    if (this.flashAlpha > 0) {
      this.flashAlpha = Math.max(0, this.flashAlpha - dt * 1.5);
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      if (p.type === 'shockwave') {
        const progress = 1 - (p.life / p.maxLife);
        p.size = 10 + progress * (p.targetRadius - 10);
      } else {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.94; // Friction
        p.vy *= 0.94;
        if (p.type === 'smoke') {
          p.size += dt * 14; // Smoke expands
        } else if (p.type === 'weed_smoke') {
          p.size += dt * 8; // Herbal smoke expands slowly
        } else if (p.type === 'weed_frag') {
          p.spinAngle = (p.spinAngle || 0) + (p.spinSpeed || 8) * dt;
        }
      }
    }

    // Update Floating Damage Numbers
    for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
      const dn = this.damageNumbers[i];
      dn.life -= dt;
      if (dn.life <= 0) {
        this.damageNumbers.splice(i, 1);
        continue;
      }
      dn.y += dn.vy * dt;
      dn.vy *= 0.92;
    }

    // Update Napalm Ground Patches
    for (let i = this.groundPatches.length - 1; i >= 0; i--) {
      const patch = this.groundPatches[i];
      patch.duration -= dt;
      patch.tickTimer += dt;

      // Spawn flame spark particles inside patch
      if (Math.random() > 0.4) {
        const r = Math.random() * patch.radius;
        const theta = Math.random() * Math.PI * 2;
        this.emit(
          patch.x + Math.cos(theta) * r,
          patch.y + Math.sin(theta) * r,
          (Math.random() - 0.5) * 15,
          -25 - Math.random() * 35,
          Math.random() > 0.3 ? '#ff5722' : '#ffeb3b',
          3 + Math.random() * 3,
          0.2 + Math.random() * 0.2,
          true,
          'circle'
        );
      }

      // Damage enemies standing in napalm every 0.35s
      if (patch.tickTimer >= 0.35 && enemies) {
        patch.tickTimer = 0;
        enemies.forEach(enemy => {
          if (!enemy.isDead) {
            const dist = Math.hypot(enemy.x - patch.x, enemy.y - patch.y);
            if (dist < patch.radius + enemy.radius) {
              enemy.takeDamage(patch.damage * 0.4);
            }
          }
        });
      }

      if (patch.duration <= 0) {
        this.groundPatches.splice(i, 1);
      }
    }
  }

  // Render ground patches (drawn below characters)
  renderGroundPatches(ctx) {
    this.groundPatches.forEach(patch => {
      const alpha = Math.min(1, patch.duration / 0.5);
      const gradient = ctx.createRadialGradient(patch.x, patch.y, 4, patch.x, patch.y, patch.radius);
      gradient.addColorStop(0, `rgba(255, 110, 0, ${0.7 * alpha})`);
      gradient.addColorStop(0.5, `rgba(230, 81, 0, ${0.45 * alpha})`);
      gradient.addColorStop(1, `rgba(216, 27, 96, 0)`);

      ctx.save();
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(patch.x, patch.y, patch.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  // Render particles and damage numbers (drawn above characters)
  render(ctx) {
    // Render Particles
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const alpha = Math.max(0, p.life / p.maxLife);

      ctx.save();
      if (p.type === 'shockwave') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 4 * alpha;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.type === 'smoke') {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha * 0.6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'weed_smoke') {
        // Herbal green smoke puff
        ctx.globalAlpha = alpha * 0.55;
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        grad.addColorStop(0, p.color || '#00e676');
        grad.addColorStop(1, 'rgba(0,200,80,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'weed_frag') {
        // Tiny spinning leaf fragment
        ctx.globalAlpha = alpha;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.spinAngle || 0);
        ctx.fillStyle = p.color || '#00e676';
        ctx.strokeStyle = '#1b5e20';
        ctx.lineWidth = 0.8;
        const r = p.size;
        const pts = 5;
        const inner = r * 0.4;
        ctx.beginPath();
        for (let i = 0; i < pts * 2; i++) {
          const rad = i % 2 === 0 ? r : inner;
          const ang = (i * Math.PI) / pts - Math.PI / 2;
          if (i === 0) ctx.moveTo(Math.cos(ang) * rad, Math.sin(ang) * rad);
          else ctx.lineTo(Math.cos(ang) * rad, Math.sin(ang) * rad);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      } else if (p.type === 'rainbow_sparkle') {
        // Shimmering rainbow / glitter spark
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color || '#ff4081';
        ctx.shadowColor = p.color || '#ff4081';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Render Floating Damage Numbers
    for (let i = 0; i < this.damageNumbers.length; i++) {
      const dn = this.damageNumbers[i];
      const alpha = Math.min(1, (dn.life / dn.maxLife) * 1.5);
      const fontSize = dn.isCrit ? 18 : 13;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = `900 ${fontSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Outline
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeText(dn.text, dn.x, dn.y);

      // Fill
      ctx.fillStyle = dn.isCrit ? '#ffeb3b' : '#ffffff';
      ctx.fillText(dn.text, dn.x, dn.y);
      ctx.restore();
    }
  }

  // Render screen flash if active
  renderScreenFlash(ctx, width, height) {
    if (this.flashAlpha > 0) {
      ctx.save();
      ctx.fillStyle = `rgba(255, 255, 255, ${this.flashAlpha})`;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }
  }
}

// Global Particle Engine Singleton
window.particleEngine = new ParticleEngine();
