export const GAME = {
  ranks: [
    { grade: "S", minScore: 12000, aura: "#ff2f57", arena: "corrupted_domain" },
    { grade: "A", minScore: 8500, aura: "#b86cff", arena: "violet_void_city" },
    { grade: "B", minScore: 5200, aura: "#ffd166", arena: "golden_storm_tower" },
    { grade: "C", minScore: 2600, aura: "#5cff9a", arena: "cyber_ruins" },
    { grade: "D", minScore: 900, aura: "#62a8ff", arena: "neon_street" },
    { grade: "E", minScore: 0, aura: "#9aa4b2", arena: "training_grid" }
  ],
  arenaThemes: {
    E: { id: "training_grid", name: "Training Grid", bg: "#07101a", accent: "#8ba4c7", secondary: "#3d526b" },
    D: { id: "neon_street", name: "Neon Street", bg: "#06121d", accent: "#46b6ff", secondary: "#7d4cff" },
    C: { id: "cyber_ruins", name: "Cyber Ruins", bg: "#07170f", accent: "#62ff9d", secondary: "#19a871" },
    B: { id: "golden_storm_tower", name: "Golden Storm Tower", bg: "#171006", accent: "#ffd166", secondary: "#ff8f3d" },
    A: { id: "violet_void_city", name: "Violet Void City", bg: "#10071a", accent: "#b86cff", secondary: "#ff4fd8" },
    S: { id: "corrupted_domain", name: "Corrupted Lightning Domain", bg: "#120509", accent: "#ff2f57", secondary: "#111111" }
  },
  comboTitles: [
    { combo: 100, title: "Hacker" },
    { combo: 50, title: "Demon King" },
    { combo: 25, title: "Shadow Hunter" },
    { combo: 10, title: "Hunter" },
    { combo: 5, title: "Rookie" },
    { combo: 0, title: "Awake" }
  ],
  elements: {
    wind: {
      name: "Wind",
      color: "#80ffd8",
      description: "Pushes enemies back with gust rings and wide shockwaves.",
      domain: "Storm Gate",
      impact: "wind_ripple"
    },
    ice: {
      name: "Ice",
      color: "#93e8ff",
      description: "Slows enemies with frost mist, shards, and freeze cracks.",
      domain: "Frozen Moon",
      impact: "frost_chip"
    },
    fire: {
      name: "Fire",
      color: "#ff7a3d",
      description: "Burns letters and detonates close enemies with ember bursts.",
      domain: "Ash Crown",
      impact: "flame_impact"
    },
    lightning: {
      name: "Lightning",
      color: "#ffe066",
      description: "Chains branching bolts between nearby targets.",
      domain: "Thunder Circuit",
      impact: "electric_shockwave"
    }
  },
  skins: [
    skin("basic_slate", "Basic Slate Keyboard", "Common", "Clean gray keys", "clean_impact", "mechanical_click", 0, "none"),
    skin("office_terminal", "Office Terminal", "Common", "Green old-terminal glow", "pixel_burst", "soft_office", 120, "+1% accuracy buffer"),
    skin("neon_starter", "Neon Starter", "Common", "Blue neon outline keys", "electric_shockwave", "electric_snap", 220, "+2% speed", "neon_advanced"),
    skin("cyber_neon_grid", "Cyber Neon Grid", "Rare", "Floating keys over a glowing grid", "pixel_burst", "synth_grid", 520, "combo duration +5%"),
    skin("redline_hacker", "Redline Hacker Board", "Rare", "Black and red warning keys", "digital_crack", "redline_strike", 640, "+3% damage scaling"),
    skin("ice_code", "Ice Code Keyboard", "Rare", "Frozen glass and keyboard mist", "frost_chip", "crystal_frost", 700, "reduces combo decay", "frost_core"),
    skin("storm_pulse", "Storm Pulse Keyboard", "Rare", "Electric arcs between keys", "electric_shockwave", "electric_snap", 760, "+4% speed during combos"),
    skin("void_matrix", "Void Matrix Keyboard", "Epic", "Dark matter cubes with glitch trails", "digital_crack", "void_bass", 1400, "slow-motion meter builds faster"),
    skin("crimson_overclock", "Crimson Overclock Board", "Epic", "Molten red burning keys", "flame_impact", "flame_thump", 1550, "+6% damage and crit boost"),
    skin("ghost_protocol", "Ghost Protocol Keyboard", "Epic", "Semi-transparent floating keys", "pixel_burst", "ghost_whisper", 1700, "enemy reaction blur"),
    skin("digital_rain", "Digital Rain Keyboard", "Epic", "Holographic falling code", "pixel_burst", "glitch_error", 1850, "combo multiplier slightly increased"),
    skin("quantum_phase", "Quantum Phase Keyboard", "Legendary", "Keys phase through positions", "mini_explosion", "divine_echo", 3200, "chance to double input hit"),
    skin("reality_break", "Reality Break Keyboard", "Legendary", "Keys crack the screen", "digital_crack", "dimensional_shatter", 3800, "damage scales harder with combo"),
    skin("neural_god", "Neural God Interface", "Legendary", "Floating neural network keys", "electric_shockwave", "neural_heartbeat", 4200, "unlocks slow-motion typing state"),
    skin("system_collapse", "System Collapse Keyboard", "Mythic", "Broken corrupted keyboard", "digital_crack", "glitch_error", 6200, "random critical hits"),
    skin("black_sun_core", "Black Sun Core Keyboard", "Mythic", "Orb core with orbiting keys", "mini_explosion", "void_bass", 6800, "pulls enemies closer"),
    skin("admin_access", "Admin Access Keyboard", "Secret", "Sterile white system UI", "pixel_burst", "command_line", 9999, "hidden developer-style abilities"),
    skin("forbidden_code", "Forbidden Code Keyboard", "Exotic", "Shifting red warning overlays", "digital_crack", "alarm_distortion", 9999, "huge damage but unstable control")
  ],
  soundPacks: [
    sound("mechanical_click", "Mechanical Click", "Common", "Crisp baseline keyboard taps", 0),
    sound("soft_office", "Soft Office", "Common", "Quiet plastic office keys", 90),
    sound("electric_snap", "Electric Snap", "Rare", "Sharp lightning taps", 260),
    sound("crystal_frost", "Crystal Frost", "Rare", "Glassy ice taps", 300),
    sound("flame_thump", "Flame Thump", "Rare", "Warm heavy impact keys", 340),
    sound("glitch_error", "Glitch Error", "Epic", "Corrupted digital errors", 700),
    sound("void_bass", "Void Bass", "Epic", "Deep bass keystrokes", 850),
    sound("divine_echo", "Divine Echo", "Legendary", "Layered time echo keys", 1600)
  ],
  pets: [
    pet("spark_sprite", "Spark Sprite", "Common", "damage", "Zaps the nearest enemy every few seconds.", 0),
    pet("frost_wisp", "Frost Wisp", "Rare", "slow", "Slows the closest dangerous enemy.", 520),
    pet("guard_orb", "Guard Orb", "Rare", "shield", "Blocks one escaped enemy hit after cooldown.", 620),
    pet("word_moth", "Word Moth", "Epic", "words", "Slightly increases Words drops.", 1100),
    pet("combo_drone", "Combo Drone", "Epic", "combo", "Protects combo once per cooldown.", 1400)
  ],
  levelRewards: [
    reward(10, "skin", "neon_starter", "Neon Starter + title"),
    reward(20, "skin", "cyber_neon_grid", "Cyber Neon Grid + Words"),
    reward(30, "skin", "ice_code", "Ice Code + typing effect"),
    reward(40, "skin", "storm_pulse", "Storm Pulse + kill effect"),
    reward(50, "skin", "void_matrix", "Void Matrix + battlefield theme"),
    reward(60, "skin", "crimson_overclock", "Crimson Overclock + pet egg"),
    reward(70, "skin", "ghost_protocol", "Ghost Protocol + sound pack"),
    reward(80, "skin", "digital_rain", "Digital Rain + UI frame"),
    reward(90, "skin", "quantum_phase", "Quantum Phase + ultimate effect"),
    reward(100, "skin", "reality_break", "Reality Break + endgame title")
  ],
  missions: [
    { id: "type_100", name: "Type 100 Keys", target: 100, rewardWords: 80, rewardXp: 120 },
    { id: "combo_25", name: "Reach x25 Combo", target: 25, rewardWords: 140, rewardXp: 180 },
    { id: "defeat_30", name: "Defeat 30 Enemies", target: 30, rewardWords: 120, rewardXp: 160 }
  ],
  modes: {
    story: { name: "Story Mode", ranked: false, zen: false, description: "Chapter battles and bosses. Deeper chapters arrive after V2." },
    infinity: { name: "Endless Mode", ranked: false, zen: false, description: "Endless pressure, scaling speed, boss every minute." },
    ranked: { name: "Ranked Mode", ranked: true, zen: false, description: "Competitive run with leaderboard upload." },
    zen: { name: "Training Zone", ranked: false, zen: true, description: "Practice with infinite health and no ranked save." }
  },
  drops: [
    { id: "words", name: "Words", chance: 0.7, min: 4, max: 18 },
    { id: "xp", name: "XP Shard", chance: 0.5, min: 8, max: 28 },
    { id: "keyboard_shard", name: "Keyboard Shard", chance: 0.09, min: 1, max: 2 },
    { id: "pet_shard", name: "Pet Shard", chance: 0.06, min: 1, max: 1 },
    { id: "sound_pack_shard", name: "Sound Shard", chance: 0.05, min: 1, max: 1 },
    { id: "effect_core", name: "Effect Core", chance: 0.04, min: 1, max: 1 }
  ],
  words: {
    short: ["ki", "rei", "zen", "rift", "aura", "void", "dash", "storm", "blade", "pulse"],
    medium: ["hunter", "cipher", "shadow", "meteor", "keyboard", "tempest", "breaker", "glacier"],
    long: ["nightfall", "overdrive", "thunderbolt", "spellcaster", "afterimage", "blackout"],
    boss: [
      "type through the storm",
      "a hunter never looks away",
      "keyboard magic breaks the dark",
      "focus turns fear into lightning"
    ]
  }
};

function skin(id, name, rarity, visualTheme, typingEffect, soundPack, cost, bonus, evolvesTo = null) {
  return { id, name, rarity, visualTheme, typingEffect, soundPack, cost, bonus, evolvesTo };
}

function sound(id, name, rarity, description, cost) {
  return { id, name, rarity, description, cost };
}

function pet(id, name, rarity, effect, description, cost) {
  return { id, name, rarity, effect, description, cost };
}

function reward(level, type, itemId, label) {
  return { level, type, itemId, label };
}

export function xpForNextLevel(level) {
  return level >= 100 ? Infinity : 100 + level * level * 25;
}

export function applyXp(profile, earnedXp) {
  const next = { ...profile, xp: (profile.xp || 0) + earnedXp, level: profile.level || 1 };
  const unlocked = [];
  while (next.level < 100 && next.xp >= xpForNextLevel(next.level)) {
    next.xp -= xpForNextLevel(next.level);
    next.level += 1;
    const reward = GAME.levelRewards.find((item) => item.level === next.level);
    if (reward) unlocked.push(reward);
  }
  return { profile: next, unlocked };
}

export function gradeForScore(score, accuracy, maxCombo, bossKills, survivalSeconds) {
  const bonus = Math.round((accuracy - 75) * 18 + maxCombo * 16 + bossKills * 900 + survivalSeconds * 2);
  const adjusted = Math.max(0, score + bonus);
  return GAME.ranks.find((rank) => adjusted >= rank.minScore) || GAME.ranks[GAME.ranks.length - 1];
}

export function comboTitle(combo) {
  return GAME.comboTitles.find((item) => combo >= item.combo)?.title || "Awake";
}

export function rankTheme(grade = "E") {
  return GAME.arenaThemes[grade] || GAME.arenaThemes.E;
}

export function byId(collection, id) {
  return collection.find((item) => item.id === id) || collection[0];
}
