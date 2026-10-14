/**
 * Abu Madfa3 - Survivor.io Replica
 * Configuration & Constants
 */

const CONFIG = {
  // World & Camera
  WORLD_WIDTH: 4000,
  WORLD_HEIGHT: 4000,
  GRID_SIZE: 120, // Spatial hash grid cell size
  
  // Game Duration (Victory at 20 minutes / 1200 seconds)
  VICTORY_TIME: 1200,

  // Player Defaults
  PLAYER: {
    RADIUS: 18,
    BASE_SPEED: 210,
    BASE_HP: 100,
    HP_REGEN: 0,
    PICKUP_RADIUS: 90,
    INVULNERABLE_DURATION: 0.6,
  },

  // Base Weapons Catalog
  WEAPONS: {
    BAZOOKA: {
      id: 'BAZOOKA',
      name: 'RPG-7 Bazooka',
      icon: '🚀',
      type: 'weapon',
      description: 'Fires high-explosive rockets with heavy AoE blast damage.',
      maxLevel: 5,
      evoWeaponId: 'DOOMSDAY_CANNON',
      evoRequiredPassive: 'HE_FUEL',
      levels: [
        { desc: 'Fires explosive rocket (AoE blast)', cooldown: 1.8, damage: 55, radius: 70, speed: 420, count: 1, napalm: false, cluster: false },
        { desc: '+35% Blast Radius, +20% Damage', cooldown: 1.6, damage: 70, radius: 95, speed: 450, count: 1, napalm: false, cluster: false },
        { desc: 'Twin Launchers (Fires 2 rockets)', cooldown: 1.5, damage: 85, radius: 105, speed: 480, count: 2, napalm: false, cluster: false },
        { desc: 'Napalm Warhead (Leaves burning ground)', cooldown: 1.35, damage: 105, radius: 120, speed: 500, count: 2, napalm: true, cluster: false },
        { desc: 'Cluster Warhead (Splits into 4 mini-bombs)', cooldown: 1.2, damage: 130, radius: 135, speed: 520, count: 2, napalm: true, cluster: true },
      ],
      evo: {
        id: 'DOOMSDAY_CANNON',
        name: 'Doomsday Hydra Cannon',
        icon: '☢️',
        desc: 'Fires tactical nuke rockets causing cataclysmic screen-wide chain explosions!',
        cooldown: 0.9,
        damage: 240,
        radius: 190,
        speed: 550,
        count: 3,
        napalm: true,
        cluster: true,
        isEvo: true,
      }
    },

    GUARDIAN: {
      id: 'GUARDIAN',
      name: 'Spinning Blades',
      icon: '🪚',
      type: 'weapon',
      description: 'Mechanical blades orbit around you, knocking back approaching mobs.',
      maxLevel: 5,
      levels: [
        { desc: '2 Blades orbit around you', count: 2, damage: 25, speed: 2.5, radius: 75 },
        { desc: '+1 Blade, +20% Damage', count: 3, damage: 32, speed: 2.8, radius: 80 },
        { desc: '+1 Blade, faster rotation', count: 4, damage: 40, speed: 3.2, radius: 85 },
        { desc: '+1 Blade, larger orbit', count: 5, damage: 50, speed: 3.5, radius: 95 },
        { desc: '6 Mega Blades with extreme knockback', count: 6, damage: 65, speed: 4.0, radius: 105 },
      ]
    },

    LIGHTNING: {
      id: 'LIGHTNING',
      name: 'Lightning Emitter',
      icon: '⚡',
      type: 'weapon',
      description: 'Periodically zaps random nearby enemies with thunderbolts.',
      maxLevel: 5,
      levels: [
        { desc: 'Strikes 1 random enemy', cooldown: 2.0, damage: 60, strikes: 1 },
        { desc: 'Strikes 2 enemies, +25% damage', cooldown: 1.8, damage: 80, strikes: 2 },
        { desc: 'Strikes 3 enemies', cooldown: 1.6, damage: 100, strikes: 3 },
        { desc: 'Strikes 4 enemies, faster cooldown', cooldown: 1.3, damage: 125, strikes: 4 },
        { desc: 'Strikes 6 enemies with chained voltage', cooldown: 1.0, damage: 160, strikes: 6 },
      ]
    },

    DRONE: {
      id: 'DRONE',
      name: 'Attack Drone',
      icon: '🛸',
      type: 'weapon',
      description: 'Support drone hovers beside you, firing homing micro-missiles.',
      maxLevel: 5,
      levels: [
        { desc: 'Deploys 1 Drone (fires 2 micro-missiles)', cooldown: 2.2, count: 1, missiles: 2, damage: 35 },
        { desc: '+1 missile per salvo, faster reload', cooldown: 1.9, count: 1, missiles: 3, damage: 45 },
        { desc: 'Deploys 2nd Drone (Twin Drones!)', cooldown: 1.7, count: 2, missiles: 3, damage: 55 },
        { desc: '+1 missile each, +25% damage', cooldown: 1.5, count: 2, missiles: 4, damage: 70 },
        { desc: 'Overclocked Drones (Rapid missile barrages)', cooldown: 1.2, count: 2, missiles: 5, damage: 90 },
      ]
    },

    MOLOTOV: {
      id: 'MOLOTOV',
      name: 'Molotov Cocktail',
      icon: '🍾',
      type: 'weapon',
      description: 'Throws incendiary bottles that ignite persistent burning ground patches.',
      maxLevel: 5,
      levels: [
        { desc: 'Throws 1 molotov creating a fire pool', cooldown: 2.8, count: 1, damage: 18, duration: 3.0, radius: 55 },
        { desc: '+1 Molotov, +25% burn damage', cooldown: 2.6, count: 2, damage: 24, duration: 3.2, radius: 60 },
        { desc: '+1 Molotov, larger fire patch', cooldown: 2.4, count: 3, damage: 30, duration: 3.5, radius: 70 },
        { desc: 'Faster throwing, longer burn duration', cooldown: 2.0, count: 3, damage: 38, duration: 4.0, radius: 75 },
        { desc: 'Hellfire (Throws 5 molotovs in all directions)', cooldown: 1.8, count: 5, damage: 50, duration: 4.5, radius: 85 },
      ]
    }
  },

  // Base Passives Catalog
  PASSIVES: {
    HE_FUEL: {
      id: 'HE_FUEL',
      name: 'HE Fuel',
      icon: '⛽',
      type: 'passive',
      description: 'Increases weapon range and explosion radius.',
      maxLevel: 5,
      levels: [
        { desc: '+15% Explosion & Attack Radius', value: 0.15 },
        { desc: '+30% Explosion & Attack Radius', value: 0.30 },
        { desc: '+45% Explosion & Attack Radius', value: 0.45 },
        { desc: '+60% Explosion & Attack Radius', value: 0.60 },
        { desc: '+80% Explosion & Attack Radius (Allows Bazooka EVO!)', value: 0.80 },
      ]
    },

    BULLET: {
      id: 'BULLET',
      name: 'Hi-Power Ammo',
      icon: '💥',
      type: 'passive',
      description: 'Increases overall damage of all equipped weapons.',
      maxLevel: 5,
      levels: [
        { desc: '+12% Total Damage', value: 0.12 },
        { desc: '+24% Total Damage', value: 0.24 },
        { desc: '+36% Total Damage', value: 0.36 },
        { desc: '+50% Total Damage', value: 0.50 },
        { desc: '+70% Total Damage', value: 0.70 },
      ]
    },

    SNEAKERS: {
      id: 'SNEAKERS',
      name: 'Sports Sneakers',
      icon: '👟',
      type: 'passive',
      description: 'Increases movement speed so you can outrun swarms.',
      maxLevel: 5,
      levels: [
        { desc: '+12% Movement Speed', value: 0.12 },
        { desc: '+24% Movement Speed', value: 0.24 },
        { desc: '+36% Movement Speed', value: 0.36 },
        { desc: '+48% Movement Speed', value: 0.48 },
        { desc: '+65% Movement Speed', value: 0.65 },
      ]
    },

    ARMOR: {
      id: 'ARMOR',
      name: 'Tactical Armor Plate',
      icon: '🛡️',
      type: 'passive',
      description: 'Increases Maximum HP and provides continuous health regeneration.',
      maxLevel: 5,
      levels: [
        { desc: '+25 Max HP, +1 HP/sec Regen', maxHpBonus: 25, regen: 1 },
        { desc: '+50 Max HP, +2 HP/sec Regen', maxHpBonus: 50, regen: 2 },
        { desc: '+75 Max HP, +3 HP/sec Regen', maxHpBonus: 75, regen: 3 },
        { desc: '+110 Max HP, +4 HP/sec Regen', maxHpBonus: 110, regen: 4 },
        { desc: '+160 Max HP, +6 HP/sec Regen', maxHpBonus: 160, regen: 6 },
      ]
    },

    ENERGY_CUBE: {
      id: 'ENERGY_CUBE',
      name: 'Energy Cube',
      icon: '🧊',
      type: 'passive',
      description: 'Reduces attack cooldowns across all weapons.',
      maxLevel: 5,
      levels: [
        { desc: '-10% Weapon Cooldown', value: 0.10 },
        { desc: '-18% Weapon Cooldown', value: 0.18 },
        { desc: '-26% Weapon Cooldown', value: 0.26 },
        { desc: '-34% Weapon Cooldown', value: 0.34 },
        { desc: '-45% Weapon Cooldown', value: 0.45 },
      ]
    },

    MAGNET: {
      id: 'MAGNET',
      name: 'Loot Magnet',
      icon: '🧲',
      type: 'passive',
      description: 'Significantly increases item and XP gem pickup radius.',
      maxLevel: 5,
      levels: [
        { desc: '+50% Pickup Range', value: 0.50 },
        { desc: '+100% Pickup Range', value: 1.00 },
        { desc: '+150% Pickup Range', value: 1.50 },
        { desc: '+220% Pickup Range', value: 2.20 },
        { desc: '+320% Pickup Range (Pulls almost entire screen)', value: 3.20 },
      ]
    }
  },

  // Tactical Military Enemies & Bosses
  ENEMIES: {
    // Standard Infantry Grunt
    SOLDIER_GRUNT: {
      name: 'Infantry Grunt',
      role: 'grunt',
      hp: 45,
      speed: 75,
      damage: 10,
      radius: 15,
      uniformColor: '#5d6e53', // Olive/tan military combat fatigues
      helmetColor: '#3d4d35',
      xpValue: 1,
      mass: 1.0,
    },
    // Fast Combat Scout
    SOLDIER_SCOUT: {
      name: 'Combat Scout',
      role: 'scout',
      hp: 26,
      speed: 140,
      damage: 8,
      radius: 13,
      uniformColor: '#4a5568', // Tactical slate/commando
      helmetColor: '#2d3748',
      xpValue: 1,
      mass: 0.6,
    },
    // Heavy Grenadier / Spitter
    SOLDIER_GRENADIER: {
      name: 'Heavy Grenadier',
      role: 'grenadier',
      hp: 75,
      speed: 62,
      damage: 15,
      radius: 17,
      uniformColor: '#744210', // Desert combat camo
      helmetColor: '#502d08',
      xpValue: 2,
      mass: 1.3,
      isRanged: true,
      shootInterval: 2.8,
      shootRange: 320,
    },
    // Elite Sergeant
    SOLDIER_SERGEANT: {
      name: 'Elite Sergeant',
      role: 'sergeant',
      hp: 180,
      speed: 80,
      damage: 18,
      radius: 19,
      uniformColor: '#2d3748',
      helmetColor: '#1a202c',
      xpValue: 4,
      mass: 2.0,
    },

    // -------------------------------------------------------------
    // 4 Bosses at 5m, 10m, 15m, and 20m (Survivor.io Inspired)
    // -------------------------------------------------------------

    // Boss 1 at 5:00 (300s): Steel Juggernaut (Bull/Mech inspired)
    BOSS_JUGGERNAUT: {
      name: 'Steel Juggernaut',
      isBoss: true,
      bossIndex: 1,
      spawnMinute: 5,
      hp: 2200,
      speed: 90,
      damage: 26,
      radius: 36,
      uniformColor: '#2c3e50',
      helmetColor: '#c0392b',
      xpValue: 40,
      mass: 6.0,
      dropsChest: true,
    },

    // Boss 2 at 10:00 (600s): Toxic Chem-Commander (Devourer inspired)
    BOSS_CHEM_COMMANDER: {
      name: 'Toxic Chem-Commander',
      isBoss: true,
      bossIndex: 2,
      spawnMinute: 10,
      hp: 4800,
      speed: 85,
      damage: 32,
      radius: 38,
      uniformColor: '#1b4332',
      helmetColor: '#52b788',
      xpValue: 60,
      mass: 7.0,
      dropsChest: true,
    },

    // Boss 3 at 15:00 (900s): Cyber-Drone Colossus (Mega Drone inspired)
    BOSS_DRONE_COLOSSUS: {
      name: 'Cyber-Drone Colossus',
      isBoss: true,
      bossIndex: 3,
      spawnMinute: 15,
      hp: 8500,
      speed: 100,
      damage: 38,
      radius: 42,
      uniformColor: '#1a1a2e',
      helmetColor: '#e94560',
      xpValue: 80,
      mass: 8.0,
      dropsChest: true,
    },

    // Final Boss 4 at 20:00 (1200s): Supreme Overlord Titan (Chairman inspired)
    BOSS_SUPREME_OVERLORD: {
      name: 'Supreme Overlord Titan',
      isBoss: true,
      isFinalBoss: true,
      bossIndex: 4,
      spawnMinute: 20,
      hp: 16000,
      speed: 110,
      damage: 46,
      radius: 48,
      uniformColor: '#3a0ca3',
      helmetColor: '#f72585',
      xpValue: 200,
      mass: 12.0,
      dropsChest: true,
    }
  },

  // Drop Items
  ITEMS: {
    GEM_GREEN: { type: 'gem', xp: 1, color: '#00e676', radius: 6 },
    GEM_BLUE: { type: 'gem', xp: 5, color: '#00b0ff', radius: 8 },
    GEM_GOLD: { type: 'gem', xp: 25, color: '#ffd700', radius: 10 },
    HEAL_MEAT: { type: 'meat', healPercent: 0.45, icon: '🥩', radius: 14 },
    MAGNET_ORB: { type: 'magnet', icon: '🧲', radius: 14 },
    BOMB_NUKE: { type: 'bomb', icon: '💣', radius: 14 },
    GOLD_CHEST: { type: 'chest', icon: '📦', radius: 18 },
  }
};
