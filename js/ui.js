/**
 * Abu Madfa3 - Survivor.io Replica
 * User Interface & Modal Management
 */

class UIManager {
  constructor(game) {
    this.game = game;

    // HUD Elements
    this.xpFill = document.getElementById('xp-bar-fill');
    this.levelVal = document.getElementById('level-val');
    this.timerVal = document.getElementById('timer-val');
    this.killsVal = document.getElementById('kills-val');
    this.coinsVal = document.getElementById('coins-val');
    this.weaponSlots = document.getElementById('weapon-slots');
    this.passiveSlots = document.getElementById('passive-slots');
    this.bossHud = document.getElementById('boss-hud');
    this.bossName = document.getElementById('boss-name');
    this.bossHpFill = document.getElementById('boss-hp-fill');

    // Modals
    this.startOverlay = document.getElementById('start-overlay');
    this.levelupOverlay = document.getElementById('levelup-overlay');
    this.upgradeCardsContainer = document.getElementById('upgrade-cards-container');
    this.chestOverlay = document.getElementById('chest-overlay');
    this.chestRewardsList = document.getElementById('chest-rewards-list');
    this.pauseOverlay = document.getElementById('pause-overlay');
    this.gameoverOverlay = document.getElementById('gameover-overlay');

    // Modal Stat Fields
    this.endStatusIcon = document.getElementById('end-status-icon');
    this.endTitle = document.getElementById('end-title');
    this.endSubtitle = document.getElementById('end-subtitle');
    this.finalTime = document.getElementById('final-time');
    this.finalKills = document.getElementById('final-kills');
    this.finalLevel = document.getElementById('final-level');
    this.finalScore = document.getElementById('final-score');

    // Player HUD HP Bar
    this.hpFill = document.getElementById('hp-bar-fill');
    this.hpVal = document.getElementById('hp-val');
    this.hpIcon = document.getElementById('hp-icon');

    // Secret Code & Anthony / Weed / Peter Elements
    this.codeOverlay = document.getElementById('code-overlay');
    this.secretCodeInput = document.getElementById('secret-code-input');
    this.codeErrorMsg = document.getElementById('code-error-msg');
    this.anthonyActivatedOverlay = document.getElementById('anthony-activated-overlay');
    this.peterActivatedOverlay = document.getElementById('peter-activated-overlay');
    this.luigiActivatedOverlay = document.getElementById('luigi-activated-overlay');

    // Leaderboard Elements
    this.leaderboardOverlay = document.getElementById('leaderboard-overlay');
    this.leaderboardBody = document.getElementById('leaderboard-body');
    this.playerNameInput = document.getElementById('player-name-input');
    this.saveScoreStatus = document.getElementById('save-score-status');

    this.currentRunStats = null;

    this.initButtons();
  }

  initButtons() {
    // Start Game
    document.getElementById('start-game-btn').addEventListener('click', () => {
      window.audioEngine.resume();
      // Capture soldier callsign for auto-save to leaderboard
      const inputEl = document.getElementById('soldier-name-main');
      const name = (inputEl ? inputEl.value : '').trim().slice(0, 15) || 'Soldier';
      this.currentSoldierName = name;
      localStorage.setItem('abumadfa3_last_player_name', name);
      this.startOverlay.classList.add('hidden');
      this.game.startGame();
    });

    // View Leaderboard from Title
    document.getElementById('view-leaderboard-btn').addEventListener('click', () => {
      this.renderLeaderboard();
      this.leaderboardOverlay.classList.remove('hidden');
    });

    // Pause & Audio Buttons in HUD
    document.getElementById('pause-btn').addEventListener('click', () => {
      this.game.togglePause();
    });

    const audioBtn = document.getElementById('audio-btn');
    audioBtn.addEventListener('click', () => {
      const isMuted = window.audioEngine.toggleMute();
      audioBtn.textContent = isMuted ? '🔇' : '🔊';
    });

    // Resume in Pause
    document.getElementById('resume-btn').addEventListener('click', () => {
      this.game.togglePause();
    });

    // Secret Code in Pause
    document.getElementById('open-code-btn').addEventListener('click', () => {
      this.pauseOverlay.classList.add('hidden');
      this.codeErrorMsg.classList.add('hidden');
      this.secretCodeInput.value = '';
      this.codeOverlay.classList.remove('hidden');
      setTimeout(() => this.secretCodeInput.focus(), 100);
    });

    // Main Menu from Pause
    document.getElementById('pause-menu-btn').addEventListener('click', () => {
      this.pauseOverlay.classList.add('hidden');
      this.game.returnToMenu();
    });

    // Restart in Pause
    document.getElementById('restart-btn').addEventListener('click', () => {
      this.pauseOverlay.classList.add('hidden');
      this.game.restart();
    });

    // Secret Code Submit & Cancel
    document.getElementById('submit-code-btn').addEventListener('click', () => {
      this.handleSecretCodeSubmit();
    });

    this.secretCodeInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.handleSecretCodeSubmit();
      }
    });

    document.getElementById('cancel-code-btn').addEventListener('click', () => {
      this.codeOverlay.classList.add('hidden');
      this.pauseOverlay.classList.remove('hidden');
    });

    // Anthony Protocol Continue Button
    document.getElementById('anthony-continue-btn').addEventListener('click', () => {
      this.anthonyActivatedOverlay.classList.add('hidden');
      this.game.player.activateAnthonyProtocol();
      this.game.resumeAfterModal();
    });

    // Mharreb Query (Weed Mode) Continue Button
    const weedContinueBtn = document.getElementById('weed-continue-btn');
    if (weedContinueBtn) {
      weedContinueBtn.addEventListener('click', () => {
        document.getElementById('weed-activated-overlay').classList.add('hidden');
        this.game.activateWeedMode();
        this.game.resumeAfterModal();
      });
    }

    // Peter In The House (Gay Vibes & Rainbows Mode) Continue Button
    const peterContinueBtn = document.getElementById('peter-continue-btn');
    if (peterContinueBtn) {
      peterContinueBtn.addEventListener('click', () => {
        if (this.peterActivatedOverlay) {
          this.peterActivatedOverlay.classList.add('hidden');
        }
        this.game.activatePeterMode();
        this.game.resumeAfterModal();
      });
    }

    // Luigi Time (Big Green Ogre Mode) Continue Button
    const luigiContinueBtn = document.getElementById('luigi-continue-btn');
    if (luigiContinueBtn) {
      luigiContinueBtn.addEventListener('click', () => {
        if (this.luigiActivatedOverlay) {
          this.luigiActivatedOverlay.classList.add('hidden');
        }
        this.game.activateLuigiMode();
        this.game.resumeAfterModal();
      });
    }

    // Clear / Reset Leaderboard
    const clearLbBtn = document.getElementById('clear-lb-btn');
    if (clearLbBtn) {
      clearLbBtn.addEventListener('click', () => {
        if (confirm('Reset all leaderboard scores? This cannot be undone.')) {
          localStorage.removeItem('abumadfa3_leaderboard');
          this.renderLeaderboard();
        }
      });
    }

    // Claim Chest
    document.getElementById('chest-claim-btn').addEventListener('click', () => {
      this.chestOverlay.classList.add('hidden');
      this.game.resumeAfterModal();
    });

    // Leaderboard Modal Close & Export
    document.getElementById('close-lb-btn').addEventListener('click', () => {
      this.leaderboardOverlay.classList.add('hidden');
    });

    document.getElementById('export-lb-btn').addEventListener('click', () => {
      this.exportLeaderboardToClipboard();
    });

    // Game Over Buttons
    document.getElementById('retry-btn').addEventListener('click', () => {
      this.gameoverOverlay.classList.add('hidden');
      this.game.restart();
    });

    document.getElementById('go-view-lb-btn').addEventListener('click', () => {
      this.renderLeaderboard();
      this.leaderboardOverlay.classList.remove('hidden');
    });

    document.getElementById('go-menu-btn').addEventListener('click', () => {
      this.gameoverOverlay.classList.add('hidden');
      this.game.returnToMenu();
    });

    // Save Score to Leaderboard
    document.getElementById('save-score-btn').addEventListener('click', () => {
      this.saveCurrentScore();
    });
  }

  // Handle Secret Codes
  handleSecretCodeSubmit() {
    const val = (this.secretCodeInput.value || '').trim().toUpperCase();
    if (val === 'IAMANTHONY') {
      this.codeOverlay.classList.add('hidden');
      this.anthonyActivatedOverlay.classList.remove('hidden');
      window.audioEngine.playLevelUp();
    } else if (val === 'MHARREBQUERY') {
      this.codeOverlay.classList.add('hidden');
      document.getElementById('weed-activated-overlay').classList.remove('hidden');
      window.audioEngine.playLevelUp();
    } else if (val === 'PETERINTHEHOUSE') {
      this.codeOverlay.classList.add('hidden');
      if (this.peterActivatedOverlay) {
        this.peterActivatedOverlay.classList.remove('hidden');
      }
      window.audioEngine.playLevelUp();
    } else if (val === 'LUIGITIME') {
      this.codeOverlay.classList.add('hidden');
      if (this.luigiActivatedOverlay) {
        this.luigiActivatedOverlay.classList.remove('hidden');
      }
      window.audioEngine.playLevelUp();
    } else {
      this.codeErrorMsg.textContent = 'ACCESS DENIED - INVALID CODE';
      this.codeErrorMsg.classList.remove('hidden');
    }
  }

  // Format seconds to MM:SS
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // Update HUD every frame
  updateHUD(player, enemyManager, gameTime) {
    // XP Bar
    const xpPercent = Math.min(100, (player.currentXp / player.nextLevelXp) * 100);
    this.xpFill.style.width = `${xpPercent}%`;
    this.levelVal.textContent = player.level;

    // Player Health Bar (HUD)
    if (this.hpFill && this.hpVal) {
      const hpPercent = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
      this.hpFill.style.width = `${hpPercent}%`;
      this.hpVal.textContent = `${Math.ceil(player.hp)}/${player.maxHp}`;
      if (player.timeSinceLastContact >= 7.0 && player.hp < player.maxHp) {
        if (this.hpIcon) this.hpIcon.textContent = '💚';
      } else {
        if (this.hpIcon) this.hpIcon.textContent = '❤️';
      }
    }

    // Time, Kills, Coins
    this.timerVal.textContent = this.formatTime(gameTime);
    this.killsVal.textContent = enemyManager.totalKills;
    this.coinsVal.textContent = enemyManager.coins;

    // Inventory Slots
    this.renderInventorySlots(player.weaponManager);

    // Boss Health Bar
    const boss = enemyManager.activeBoss;
    if (boss && !boss.isDead) {
      this.bossHud.classList.remove('hidden');
      this.bossName.textContent = boss.name.toUpperCase();
      const bossHpPct = Math.max(0, Math.min(100, (boss.hp / boss.maxHp) * 100));
      this.bossHpFill.style.width = `${bossHpPct}%`;
    } else {
      this.bossHud.classList.add('hidden');
    }
  }

  // Render Weapon & Passive Icons with Star Badges
  renderInventorySlots(wm) {
    if (!wm) return;

    // Weapons
    let wHtml = '';
    for (const id in wm.activeWeapons) {
      const w = wm.activeWeapons[id];
      const config = CONFIG.WEAPONS[id];
      const isEvo = w.isEvo;
      const stars = isEvo ? 5 : w.level;
      let starPips = '';
      for (let s = 0; s < stars; s++) starPips += '<span class="star-pip">⭐</span>';

      wHtml += `
        <div class="slot-item ${isEvo ? 'evo' : ''}" title="${config.name}">
          ${isEvo ? config.evo.icon : config.icon}
          <div class="slot-stars">${starPips}</div>
        </div>
      `;
    }
    this.weaponSlots.innerHTML = wHtml;

    // Passives
    let pHtml = '';
    for (const id in wm.activePassives) {
      const p = wm.activePassives[id];
      const config = CONFIG.PASSIVES[id];
      let starPips = '';
      for (let s = 0; s < p.level; s++) starPips += '<span class="star-pip">⭐</span>';

      pHtml += `
        <div class="slot-item" title="${config.name}">
          ${config.icon}
          <div class="slot-stars">${starPips}</div>
        </div>
      `;
    }
    this.passiveSlots.innerHTML = pHtml;
  }

  // =========================================================================
  // Level-Up Upgrade Cards Generation
  // =========================================================================
  showLevelUpModal(player) {
    const wm = player.weaponManager;
    const availableOptions = this.getAvailableUpgrades(wm);

    if (availableOptions.length === 0) {
      // All items maxed! Give instant heal or gold
      player.heal(player.maxHp * 0.4);
      return;
    }

    // Shuffle and pick up to 3 cards
    for (let i = availableOptions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availableOptions[i], availableOptions[j]] = [availableOptions[j], availableOptions[i]];
    }
    const choices = availableOptions.slice(0, 3);

    let html = '';
    choices.forEach(opt => {
      let starDisplay = '';
      if (opt.isEvo) {
        starDisplay = '<span class="pill" style="background:#ab47bc;color:#fff;">MAX EVO</span>';
      } else {
        const nextStars = opt.currentLevel + 1;
        for (let s = 0; s < nextStars; s++) starDisplay += '⭐';
      }

      html += `
        <div class="upgrade-card ${opt.isEvo ? 'evo' : ''}" data-type="${opt.type}" data-id="${opt.id}" data-is-evo="${opt.isEvo || false}">
          <span class="card-tag ${opt.isEvo ? 'tag-evo' : (opt.type === 'weapon' ? 'tag-weapon' : 'tag-passive')}">
            ${opt.isEvo ? 'EVOLUTION' : (opt.currentLevel === 0 ? 'NEW ' + opt.type.toUpperCase() : 'UPGRADE')}
          </span>
          <div class="card-icon">${opt.icon}</div>
          <div class="card-name">${opt.name}</div>
          <div class="card-stars">${starDisplay}</div>
          <p class="card-desc">${opt.desc}</p>
        </div>
      `;
    });

    this.upgradeCardsContainer.innerHTML = html;

    // Attach click listeners to cards
    const cards = this.upgradeCardsContainer.querySelectorAll('.upgrade-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        const type = card.dataset.type;
        const id = card.dataset.id;
        const isEvo = card.dataset.isEvo === 'true';

        if (isEvo) {
          wm.evolveWeapon(id);
        } else if (type === 'weapon') {
          wm.addWeapon(id);
        } else if (type === 'passive') {
          wm.addPassive(id);
        }

        this.levelupOverlay.classList.add('hidden');
        this.game.resumeAfterModal();
      });
    });

    this.levelupOverlay.classList.remove('hidden');
  }

  // Calculate list of eligible upgrades
  getAvailableUpgrades(wm) {
    const list = [];
    const ownedWeaponsCount = Object.keys(wm.activeWeapons).length;
    const ownedPassivesCount = Object.keys(wm.activePassives).length;

    // 1. Check Weapon EVOLUTION (Bazooka + HE Fuel)
    if (wm.activeWeapons.BAZOOKA && wm.activeWeapons.BAZOOKA.level >= 5 && !wm.activeWeapons.BAZOOKA.isEvo) {
      if (wm.activePassives.HE_FUEL) {
        list.push({
          type: 'weapon',
          id: 'BAZOOKA',
          isEvo: true,
          name: CONFIG.WEAPONS.BAZOOKA.evo.name,
          icon: CONFIG.WEAPONS.BAZOOKA.evo.icon,
          desc: CONFIG.WEAPONS.BAZOOKA.evo.desc,
          currentLevel: 5,
        });
      }
    }

    // 2. Weapon upgrades & new weapons
    for (const id in CONFIG.WEAPONS) {
      const cfg = CONFIG.WEAPONS[id];
      const active = wm.activeWeapons[id];

      if (active) {
        if (!active.isEvo && active.level < cfg.maxLevel) {
          list.push({
            type: 'weapon',
            id: id,
            name: cfg.name,
            icon: cfg.icon,
            currentLevel: active.level,
            desc: cfg.levels[active.level].desc,
          });
        }
      } else if (ownedWeaponsCount < 5) {
        // Can adopt new weapon
        list.push({
          type: 'weapon',
          id: id,
          name: cfg.name,
          icon: cfg.icon,
          currentLevel: 0,
          desc: cfg.levels[0].desc,
        });
      }
    }

    // 3. Passive upgrades & new passives
    for (const id in CONFIG.PASSIVES) {
      const cfg = CONFIG.PASSIVES[id];
      const active = wm.activePassives[id];

      if (active) {
        if (active.level < cfg.maxLevel) {
          list.push({
            type: 'passive',
            id: id,
            name: cfg.name,
            icon: cfg.icon,
            currentLevel: active.level,
            desc: cfg.levels[active.level].desc,
          });
        }
      } else if (ownedPassivesCount < 5) {
        // Can adopt new passive
        list.push({
          type: 'passive',
          id: id,
          name: cfg.name,
          icon: cfg.icon,
          currentLevel: 0,
          desc: cfg.levels[0].desc,
        });
      }
    }

    return list;
  }

  // =========================================================================
  // Golden Chest Opening Modal
  // =========================================================================
  showChestModal(player) {
    const wm = player.weaponManager;
    const available = this.getAvailableUpgrades(wm);
    window.audioEngine.playChestFanfare();

    let grantedRewards = [];
    if (available.length > 0) {
      const picked = available[Math.floor(Math.random() * available.length)];
      if (picked.isEvo) {
        wm.evolveWeapon(picked.id);
      } else if (picked.type === 'weapon') {
        wm.addWeapon(picked.id);
      } else {
        wm.addPassive(picked.id);
      }
      grantedRewards.push({ icon: picked.icon, name: picked.name, desc: picked.desc });
    }

    // Plus Bonus Gold & Full Heal
    player.heal(player.maxHp);
    this.game.enemyManager.coins += 250;
    grantedRewards.push({ icon: '🥩', name: 'Vitality Feast', desc: 'HP fully restored to 100%!' });
    grantedRewards.push({ icon: '🪙', name: '250 Gold Coins', desc: 'Bonus battle rewards.' });

    let html = '';
    grantedRewards.forEach(r => {
      html += `
        <div class="reward-row">
          <div class="reward-icon">${r.icon}</div>
          <div class="reward-info">
            <span class="reward-name">${r.name}</span>
            <span class="reward-desc">${r.desc}</span>
          </div>
        </div>
      `;
    });

    this.chestRewardsList.innerHTML = html;
    this.chestOverlay.classList.remove('hidden');
  }

  // =========================================================================
  // Game Over & Victory
  // =========================================================================
  showGameOver(isVictory, gameTime, totalKills, level, coins) {
    if (isVictory) {
      this.endStatusIcon.textContent = '🏆';
      this.endTitle.textContent = 'VICTORY!';
      this.endTitle.className = 'gameover-title victory';
      this.endSubtitle.textContent = 'Abu Madfa3 conquered the 20-minute battlefield!';
    } else {
      this.endStatusIcon.textContent = '💀';
      this.endTitle.textContent = 'DEFEATED';
      this.endTitle.className = 'gameover-title';
      this.endSubtitle.textContent = 'The swarm overwhelmed Abu Madfa3';
    }

    const timeStr = this.formatTime(gameTime);
    this.finalTime.textContent = timeStr;
    this.finalKills.textContent = totalKills;
    this.finalLevel.textContent = level;

    // Calculate Competitor Score: Time(s)*20 + Kills*35 + Level*100 + Coins*2
    const score = Math.floor(gameTime * 20 + totalKills * 35 + level * 100 + coins * 2);
    this.finalScore.textContent = score.toLocaleString();

    // Cache current run stats for leaderboard submission
    this.currentRunStats = {
      score: score,
      timeFormatted: timeStr,
      timeSeconds: Math.floor(gameTime),
      kills: totalKills,
      level: level,
      isVictory: isVictory,
      date: new Date().toLocaleDateString()
    };

    // Auto-save score to leaderboard using the soldier name entered at start
    const soldierName = (this.currentSoldierName || '').trim() || 'Soldier';
    const lb = this.getLeaderboard();
    lb.push({
      name: soldierName,
      score: score,
      timeFormatted: timeStr,
      timeSeconds: Math.floor(gameTime),
      kills: totalKills,
      level: level,
      date: new Date().toLocaleDateString()
    });
    lb.sort((a, b) => b.score - a.score);
    localStorage.setItem('abumadfa3_leaderboard', JSON.stringify(lb.slice(0, 20)));

    // Pre-fill name input for manual save if they want to override
    if (this.playerNameInput) {
      this.playerNameInput.value = soldierName;
    }
    if (this.saveScoreStatus) {
      this.saveScoreStatus.textContent = `AUTO-SAVED! RANK: #${Math.min(20, lb.findIndex(e => e.score === score && e.name === soldierName) + 1)}`;
      this.saveScoreStatus.classList.remove('hidden');
    }

    this.gameoverOverlay.classList.remove('hidden');
  }

  // =========================================================================
  // Colleague Leaderboard Management
  // =========================================================================
  getLeaderboard() {
    try {
      const data = localStorage.getItem('abumadfa3_leaderboard');
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Failed to parse leaderboard:', e);
    }
    return [];
  }

  saveCurrentScore() {
    if (!this.currentRunStats) return;
    const name = (this.playerNameInput.value || 'Soldier').trim().slice(0, 15);
    localStorage.setItem('abumadfa3_last_player_name', name);

    const lb = this.getLeaderboard();
    lb.push({
      name: name,
      score: this.currentRunStats.score,
      timeFormatted: this.currentRunStats.timeFormatted,
      timeSeconds: this.currentRunStats.timeSeconds,
      kills: this.currentRunStats.kills,
      level: this.currentRunStats.level,
      date: this.currentRunStats.date
    });

    // Sort descending by total score
    lb.sort((a, b) => b.score - a.score);

    // Keep top 20 scores
    const top20 = lb.slice(0, 20);
    localStorage.setItem('abumadfa3_leaderboard', JSON.stringify(top20));

    if (this.saveScoreStatus) {
      this.saveScoreStatus.textContent = `SAVED! CURRENT RANK: #${top20.findIndex(entry => entry.score === this.currentRunStats.score) + 1}`;
      this.saveScoreStatus.classList.remove('hidden');
    }

    window.audioEngine.playLevelUp();
  }

  renderLeaderboard() {
    const lb = this.getLeaderboard();
    let html = '';

    lb.forEach((entry, idx) => {
      let rankBadge = `${idx + 1}`;
      if (idx === 0) rankBadge = '🥇';
      else if (idx === 1) rankBadge = '🥈';
      else if (idx === 2) rankBadge = '🥉';

      html += `
        <tr>
          <td class="rank-col">${rankBadge}</td>
          <td class="name-col">${escapeHtml(entry.name)}</td>
          <td>${entry.timeFormatted}</td>
          <td>${entry.kills}</td>
          <td class="score-col">${(entry.score || 0).toLocaleString()}</td>
        </tr>
      `;
    });

    this.leaderboardBody.innerHTML = html;
  }

  exportLeaderboardToClipboard() {
    const lb = this.getLeaderboard();
    let text = `🏆 ABU MADFA3 - COLLEAGUE LEADERBOARD 🏆\n"A tribute game to our dear Anthony"\n----------------------------------------\n`;
    text += `RANK | SOLDIER          | TIME  | KILLS | SCORE\n`;
    text += `----------------------------------------\n`;

    lb.forEach((e, i) => {
      const rank = (i + 1).toString().padEnd(4, ' ');
      const name = (e.name || 'Soldier').padEnd(16, ' ').slice(0, 16);
      const time = (e.timeFormatted || '00:00').padEnd(5, ' ');
      const kills = e.kills.toString().padEnd(5, ' ');
      const score = (e.score || 0).toLocaleString();
      text += `#${rank} | ${name} | ${time} | ${kills} | ${score}\n`;
    });

    text += `----------------------------------------\nCan you beat the top score? Play Abu Madfa3!`;

    navigator.clipboard.writeText(text).then(() => {
      alert('📋 Leaderboard scores copied to clipboard! You can now paste and share them with your colleagues in chat or email.');
    }).catch(() => {
      prompt('Copy your leaderboard scores below:', text);
    });
  }
}

// Simple HTML escaper helper
function escapeHtml(text) {
  const div = document.createElement('div');
  div.innerText = text;
  return div.innerHTML;
}
