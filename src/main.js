import { GAME, applyXp, byId, comboTitle, gradeForScore, rankTheme, xpForNextLevel } from "./config.js";
import { KeyHunterSupabase } from "./supabaseClient.js";

const canvas = document.querySelector("#gameCanvas");
const ctx = canvas.getContext("2d");
const ui = document.querySelector("#ui");
const supabase = new KeyHunterSupabase();

const state = {
  screen: "splash",
  splashReadyAt: performance.now() + 2400,
  user: null,
  profile: null,
  inventory: null,
  settings: { sound_volume: 0.65, reduced_camera_shake: false, visual_intensity: 0.85 },
  daily: null,
  missions: [],
  usernameDraft: localStorage.getItem("keyHunterUsername") || "",
  selectedMode: "infinity",
  selectedElement: "wind",
  notice: "",
  leaderboard: [],
  lastResult: null,
  game: null,
  assets: {}
};

const localProfile = {
  id: "local",
  username: localStorage.getItem("keyHunterUsername") || "Guest Hunter",
  selected_element: localStorage.getItem("keyHunterElement") || null,
  current_rank: localStorage.getItem("keyHunterRank") || "E",
  total_score: Number(localStorage.getItem("keyHunterTotalScore") || 0),
  currency: Number(localStorage.getItem("keyHunterWords") || 0),
  words_balance: Number(localStorage.getItem("keyHunterWords") || 0),
  level: Number(localStorage.getItem("keyHunterLevel") || 1),
  xp: Number(localStorage.getItem("keyHunterXp") || 0),
  equipped_title: localStorage.getItem("keyHunterTitle") || "Rookie Hunter",
  current_arena_rank_theme: localStorage.getItem("keyHunterRank") || "E"
};

const localInventory = {
  owned_keyboard_skins: JSON.parse(localStorage.getItem("keyHunterSkins") || '["basic_slate"]'),
  equipped_keyboard_skin: localStorage.getItem("keyHunterKeyboardSkin") || "basic_slate",
  owned_pets: JSON.parse(localStorage.getItem("keyHunterPets") || '["spark_sprite"]'),
  equipped_pet: localStorage.getItem("keyHunterPet") || "spark_sprite",
  owned_sound_packs: JSON.parse(localStorage.getItem("keyHunterSounds") || '["mechanical_click"]'),
  equipped_sound_pack: localStorage.getItem("keyHunterSoundPack") || "mechanical_click",
  owned_titles: JSON.parse(localStorage.getItem("keyHunterTitles") || '["Rookie Hunter"]'),
  owned_typing_effects: ["clean_impact"],
  equipped_typing_effect: "clean_impact",
  owned_kill_effects: ["simple_burst"],
  equipped_kill_effect: "simple_burst",
  owned_battlefield_themes: ["training_grid"],
  equipped_battlefield_theme: "training_grid"
};

const audio = {
  context: null,
  play(packId, power = 1) {
    const volume = Number(state.settings?.sound_volume ?? 0.65);
    if (volume <= 0.01) return;
    this.context ||= new AudioContext();
    const map = {
      mechanical_click: [420, "square", 0.035],
      soft_office: [260, "triangle", 0.03],
      electric_snap: [760, "sawtooth", 0.035],
      crystal_frost: [590, "sine", 0.055],
      flame_thump: [180, "triangle", 0.07],
      glitch_error: [120 + Math.random() * 500, "sawtooth", 0.05],
      void_bass: [82, "sine", 0.09],
      divine_echo: [660, "triangle", 0.08]
    };
    const [freq, type, duration] = map[packId] || map.mechanical_click;
    const osc = this.context.createOscillator();
    const amp = this.context.createGain();
    osc.frequency.value = freq * power;
    osc.type = type;
    amp.gain.value = 0.055 * volume;
    osc.connect(amp);
    amp.connect(this.context.destination);
    osc.start();
    amp.gain.exponentialRampToValueAtTime(0.0001, this.context.currentTime + duration);
    osc.stop(this.context.currentTime + duration + 0.02);
  }
};

function resize() {
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener("resize", resize);
resize();

async function loadAssets() {
  const entries = [
    ["splash", "./assets/splash-loading.jpeg"],
    ["arena", "./assets/arena.png"]
  ];
  await Promise.all(entries.map(([key, src]) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      state.assets[key] = img;
      resolve();
    };
    img.onerror = resolve;
    img.src = src;
  })));
}

async function boot() {
  await loadAssets();
  state.profile = localProfile;
  state.inventory = localInventory;
  state.selectedElement = localProfile.selected_element || "wind";

  if (supabase.configured) {
    state.user = await supabase.currentUser();
    if (state.user) await loadCloudState();
  }

  renderUI();
  requestAnimationFrame(loop);
}

async function loadCloudState() {
  state.profile = await supabase.ensureProfile(state.user);
  state.inventory = await supabase.getInventory(state.user.id) || localInventory;
  state.settings = await supabase.getSettings(state.user.id) || state.settings;
  state.daily = await supabase.getDailyCheckin(state.user.id);
  state.missions = await supabase.getMissionProgress(state.user.id);
  state.selectedElement = state.profile?.selected_element || "wind";
}

function saveLocal() {
  localStorage.setItem("keyHunterUsername", state.profile.username);
  localStorage.setItem("keyHunterElement", state.profile.selected_element || "");
  localStorage.setItem("keyHunterRank", state.profile.current_rank || "E");
  localStorage.setItem("keyHunterTotalScore", state.profile.total_score || 0);
  localStorage.setItem("keyHunterWords", state.profile.words_balance || 0);
  localStorage.setItem("keyHunterLevel", state.profile.level || 1);
  localStorage.setItem("keyHunterXp", state.profile.xp || 0);
  localStorage.setItem("keyHunterKeyboardSkin", state.inventory.equipped_keyboard_skin);
  localStorage.setItem("keyHunterPet", state.inventory.equipped_pet);
  localStorage.setItem("keyHunterSoundPack", state.inventory.equipped_sound_pack);
  localStorage.setItem("keyHunterSkins", JSON.stringify(state.inventory.owned_keyboard_skins || ["basic_slate"]));
  localStorage.setItem("keyHunterPets", JSON.stringify(state.inventory.owned_pets || ["spark_sprite"]));
  localStorage.setItem("keyHunterSounds", JSON.stringify(state.inventory.owned_sound_packs || ["mechanical_click"]));
}

function setNotice(message) {
  state.notice = message;
  setTimeout(() => {
    if (state.notice === message) {
      state.notice = "";
      renderUI();
    }
  }, 3600);
}

function html(strings, ...values) {
  return strings.map((part, index) => `${part}${values[index] ?? ""}`).join("");
}

function profile() {
  return state.profile || localProfile;
}

function inventory() {
  return state.inventory || localInventory;
}

function equippedSkin() {
  return byId(GAME.skins, inventory().equipped_keyboard_skin || "basic_slate");
}

function equippedPet() {
  return byId(GAME.pets, inventory().equipped_pet || "spark_sprite");
}

function equippedSound() {
  return byId(GAME.soundPacks, inventory().equipped_sound_pack || equippedSkin().soundPack);
}

function renderUI() {
  if (state.screen === "splash") {
    ui.innerHTML = `<section class="splash-hit" aria-label="Intro splash"></section>`;
    return;
  }
  if (state.screen === "transition") {
    ui.innerHTML = `<section class="transition-copy"><h1>PROFILE SYNC</h1><p>Preparing your hunter interface...</p></section>`;
    return;
  }
  if (state.screen === "battle") {
    ui.innerHTML = battleHud();
    bindBattleButtons();
    return;
  }

  const screens = {
    username: usernameScreen,
    authChoice: authChoiceScreen,
    elementSelect: elementScreen,
    hub: hubScreen,
    results: resultsScreen,
    inventory: inventoryScreen,
    shop: shopScreen,
    settings: settingsScreen,
    leaderboard: leaderboardScreen
  };

  ui.innerHTML = (screens[state.screen] || hubScreen)();
  bindUI();
}

function usernameScreen() {
  return html`
    <section class="screen onboarding">
      <div class="panel compact glass-panel">
        <span class="eyebrow">Hunter Registration</span>
        <h2>Choose Your Typist Name</h2>
        <p class="muted">This name appears on your profile, hub, and leaderboard runs.</p>
        <form id="usernameForm" class="stack">
          <input name="username" value="${state.usernameDraft}" maxlength="18" placeholder="Shadow Typist" autocomplete="nickname" required />
          <button>Continue</button>
          <div class="notice">${state.notice}</div>
        </form>
      </div>
    </section>
  `;
}

function authChoiceScreen() {
  return html`
    <section class="screen onboarding">
      <div class="panel compact glass-panel">
        <span class="eyebrow">Welcome, ${profile().username}</span>
        <h2>Cloud Save Or Guest Run?</h2>
        <p class="muted">Guest works now. Login saves Words, levels, pets, skins, and ranked scores to Supabase.</p>
        <form id="authForm" class="stack auth-form">
          <input name="email" type="email" placeholder="Email for login/signup" autocomplete="email" />
          <input name="password" type="password" placeholder="Password" autocomplete="current-password" minlength="6" />
          <div class="row">
            <button type="button" id="guestContinue">Continue as Guest</button>
            <button value="signin" name="action">Login</button>
            <button value="signup" name="action">Create Account</button>
          </div>
          <div class="notice">${state.notice}</div>
        </form>
      </div>
    </section>
  `;
}

function elementScreen() {
  return html`
    <section class="screen">
      <div class="element-shell">
        <span class="eyebrow">Element Origin</span>
        <h2>Choose Your First Power</h2>
        <div class="element-grid">
          ${Object.entries(GAME.elements).map(([id, element]) => html`
            <article class="element-card ${state.selectedElement === id ? "selected" : ""}" style="--element:${element.color}">
              <h3>${element.name}</h3>
              <div class="element-art ${id}">
                <span></span><span></span><span></span>
              </div>
              <p>${element.description}</p>
              <button data-element="${id}">${state.selectedElement === id ? "Selected" : "Select"}</button>
            </article>
          `).join("")}
        </div>
        <div class="row center">
          <button id="confirmElement">Confirm Element</button>
        </div>
        <div class="notice">${state.notice}</div>
      </div>
    </section>
  `;
}

function hubScreen() {
  const p = profile();
  const levelXp = xpForNextLevel(p.level || 1);
  const xpPct = levelXp === Infinity ? 100 : Math.min(100, Math.round(((p.xp || 0) / levelXp) * 100));
  const rank = p.current_rank || "E";
  const rankOrder = ["E", "D", "C", "B", "A", "S"];
  return html`
    <section class="hub">
      <aside class="profile-card">
        <div class="profile-top">
          <div class="avatar">${(p.username || "H").slice(0, 1).toUpperCase()}</div>
          <div>
            <h2>${p.username}</h2>
            <p>${p.equipped_title || "Rookie Hunter"}</p>
          </div>
        </div>
        <div class="rank-panel">
          <span>Current Rank</span>
          <strong>${rank} RANK</strong>
          <p>${rankTheme(p.current_rank).name}</p>
          <div class="rank-emblem big rank-${rank}"><b>${rank}</b></div>
          <div class="rank-stars">${rankOrder.map((item) => `<i class="${rankOrder.indexOf(item) <= rankOrder.indexOf(rank) ? "lit" : ""}"></i>`).join("")}</div>
          <div class="rank-strip">
            ${rankOrder.map((item) => `<span class="rank-emblem rank-${item} ${item === rank ? "active" : ""}">${item}</span>`).join("")}
          </div>
        </div>
        <div class="xp-wrap">
          <span>LV. ${p.level || 1}</span>
          <div class="xp-bar"><i style="width:${xpPct}%"></i></div>
          <small>${p.xp || 0} / ${levelXp === Infinity ? "MAX" : levelXp} XP</small>
        </div>
        <button id="dailyCheckin">Daily Check-In</button>
      </aside>

      <main class="hub-main exact-hub">
        <nav class="resource-bar">
          <span>Words <strong>${p.words_balance || 0}</strong></span>
          <span>Crystals <strong>${Math.floor((p.total_score || 0) / 20)}</strong></span>
          <span>Energy <strong>120/120</strong></span>
          <span>Keyboard <strong>${equippedSkin().name}</strong></span>
        </nav>
        <section class="center-scene" aria-label="Cyber city center">
          <div class="scene-copy">
            <span class="eyebrow">Current Loadout</span>
            <h1>${equippedSkin().name}</h1>
            <p>${equippedPet().name} active • ${equippedSound().name}</p>
          </div>
        </section>
        <section class="mode-list vertical-modes">
          ${Object.entries(GAME.modes).map(([id, mode]) => html`
            <button class="mode-card ${state.selectedMode === id ? "selected" : ""}" data-mode="${id}">
              <strong>${mode.name}</strong>
              <span>${mode.description}</span>
            </button>
          `).join("")}
        </section>
        <section class="hub-quick-blocks">
          <button data-screen="inventory">Inventory</button>
          <button data-screen="inventory">Keyboards</button>
          <button data-screen="inventory">Pets</button>
          <button data-screen="shop">Shop</button>
        </section>
        <button id="startGame" class="start-btn">START</button>
      </main>

      <aside class="side-actions utility-only">
        <button id="dailyCheckinSide">Daily</button>
        <button data-screen="shop">Shop</button>
        <button data-screen="leaderboard">Leaderboard</button>
        <button id="claimMission">Missions</button>
        <button>Achievements</button>
        <button data-screen="settings">Settings</button>
        <div class="notice">${state.notice}</div>
      </aside>
    </section>
  `;
}

function inventoryScreen() {
  const inv = inventory();
  return html`
    <section class="screen scrollable">
      <div class="panel wide">
        <h2>Inventory</h2>
        <div class="inventory-tabs">
          ${inventorySection("Keyboard Skins", GAME.skins, inv.owned_keyboard_skins, inv.equipped_keyboard_skin, "skin")}
          ${inventorySection("Pets", GAME.pets, inv.owned_pets, inv.equipped_pet, "pet")}
          ${inventorySection("Sound Packs", GAME.soundPacks, inv.owned_sound_packs, inv.equipped_sound_pack, "sound")}
        </div>
        <div class="row"><button data-screen="hub">Back</button></div>
        <div class="notice">${state.notice}</div>
      </div>
    </section>
  `;
}

function inventorySection(title, items, owned = [], equipped, type) {
  return html`
    <section>
      <h3>${title}</h3>
      <div class="shop-grid">
        ${items.map((item) => {
          const has = owned.includes(item.id);
          return html`
            <article class="shop-item ${has ? "" : "locked"}">
              <strong>${item.name}</strong>
              <span>${item.rarity || "Common"}</span>
              <p>${item.visualTheme || item.description || item.bonus}</p>
              <button data-equip="${item.id}" data-equip-type="${type}" ${!has || equipped === item.id ? "disabled" : ""}>${equipped === item.id ? "Equipped" : has ? "Equip" : "Locked"}</button>
            </article>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

function shopScreen() {
  return html`
    <section class="screen scrollable">
      <div class="panel wide">
        <h2>Shop</h2>
        <p class="muted">Spend Words on keyboards, pets, and key press sound packs.</p>
        <div class="shop-grid">
          ${[...GAME.skins, ...GAME.pets, ...GAME.soundPacks].filter((item) => item.cost > 0).map((item) => html`
            <article class="shop-item">
              <strong>${item.name}</strong>
              <span>${item.rarity}</span>
              <p>${item.visualTheme || item.description || item.bonus}</p>
              <button data-buy="${item.id}">${item.cost} Words</button>
            </article>
          `).join("")}
        </div>
        <div class="row"><button data-screen="hub">Back</button></div>
        <div class="notice">${state.notice}</div>
      </div>
    </section>
  `;
}

function settingsScreen() {
  return html`
    <section class="screen">
      <div class="panel compact">
        <h2>Settings</h2>
        <form id="settingsForm" class="stack">
          <label>Volume <input name="sound_volume" type="range" min="0" max="1" step="0.05" value="${state.settings.sound_volume ?? 0.65}" /></label>
          <label>Visual Intensity <input name="visual_intensity" type="range" min="0.25" max="1" step="0.05" value="${state.settings.visual_intensity ?? 0.85}" /></label>
          <label class="row"><input name="reduced_camera_shake" type="checkbox" ${state.settings.reduced_camera_shake ? "checked" : ""} /> Reduced camera shake</label>
          <div class="row"><button>Save</button><button type="button" data-screen="hub">Back</button></div>
          <div class="notice">${state.notice}</div>
        </form>
      </div>
    </section>
  `;
}

function leaderboardScreen() {
  const rows = state.leaderboard.length ? state.leaderboard.map((row, index) => html`
    <div class="leader-row"><strong>#${index + 1}</strong><span>${row.username}</span><span>${row.score}</span><span>${row.rank_grade}</span></div>
  `).join("") : `<p class="muted">No ranked scores yet.</p>`;
  return html`
    <section class="screen">
      <div class="panel compact">
        <h2>Ranked Leaderboard</h2>
        ${rows}
        <div class="row"><button id="refreshLeaderboard">Refresh</button><button data-screen="hub">Back</button></div>
        <div class="notice">${state.notice}</div>
      </div>
    </section>
  `;
}

function resultsScreen() {
  const r = state.lastResult || {};
  return html`
    <section class="screen">
      <div class="panel compact">
        <h2>Run Complete</h2>
        <div class="result-grid">
          <p><span>Score</span><strong>${r.score || 0}</strong></p>
          <p><span>Grade</span><strong>${r.grade || "E"}</strong></p>
          <p><span>Words</span><strong>${r.words || 0}</strong></p>
          <p><span>XP</span><strong>${r.xp || 0}</strong></p>
          <p><span>Max Combo</span><strong>${r.maxCombo || 0}</strong></p>
          <p><span>Drops</span><strong>${r.drops || 0}</strong></p>
        </div>
        <div class="row"><button id="startGame">Restart</button><button data-screen="hub">Hub</button><button data-screen="leaderboard">Leaderboard</button></div>
        <div class="notice">${state.notice}</div>
      </div>
    </section>
  `;
}

function battleHud() {
  const g = state.game;
  return html`
    <div class="hud">
      <div class="hud-strip">
        <div class="row">
          <div class="hud-box"><span>Score</span><strong>${g.score}</strong></div>
          <div class="hud-box"><span>Health</span><strong>${g.health}</strong></div>
          <div class="hud-box"><span>Combo</span><strong>x${g.combo}</strong><em>${comboTitle(g.combo)}</em></div>
          <div class="hud-box"><span>Drops</span><strong>${g.collectedDrops.length}</strong></div>
        </div>
        <div class="hud-box"><span>${equippedPet().name}</span><strong>${Math.max(0, Math.ceil(g.petCooldown))}s</strong></div>
      </div>
      <div class="battle-actions"><button id="pauseGame">${g.paused ? "Resume" : "Pause"}</button><button id="quitGame">Quit</button></div>
    </div>
  `;
}

function bindUI() {
  ui.querySelectorAll("[data-screen]").forEach((button) => button.addEventListener("click", async () => {
    if (button.dataset.screen === "leaderboard") await loadLeaderboard();
    state.screen = button.dataset.screen;
    renderUI();
  }));
  ui.querySelector("#usernameForm")?.addEventListener("submit", submitUsername);
  ui.querySelector("#authForm")?.addEventListener("submit", submitAuth);
  ui.querySelector("#guestContinue")?.addEventListener("click", continueAfterAuth);
  ui.querySelectorAll("[data-element]").forEach((button) => button.addEventListener("click", () => {
    state.selectedElement = button.dataset.element;
    renderUI();
  }));
  ui.querySelector("#confirmElement")?.addEventListener("click", confirmElement);
  ui.querySelectorAll("[data-mode]").forEach((button) => button.addEventListener("click", () => {
    state.selectedMode = button.dataset.mode;
    renderUI();
  }));
  ui.querySelector("#startGame")?.addEventListener("click", startGame);
  ui.querySelector("#settingsForm")?.addEventListener("submit", saveSettings);
  ui.querySelector("#dailyCheckin")?.addEventListener("click", claimDaily);
  ui.querySelector("#dailyCheckinSide")?.addEventListener("click", claimDaily);
  ui.querySelector("#claimMission")?.addEventListener("click", claimMission);
  ui.querySelector("#refreshLeaderboard")?.addEventListener("click", async () => {
    await loadLeaderboard();
    renderUI();
  });
  ui.querySelector("#signOut")?.addEventListener("click", () => {
    supabase.signOut();
    state.user = null;
    state.profile = localProfile;
    state.inventory = localInventory;
    state.screen = "hub";
    renderUI();
  });
  ui.querySelectorAll("[data-buy]").forEach((button) => button.addEventListener("click", buyItem));
  ui.querySelectorAll("[data-equip]").forEach((button) => button.addEventListener("click", equipItem));
}

function bindBattleButtons() {
  ui.querySelector("#pauseGame")?.addEventListener("click", () => {
    state.game.paused = !state.game.paused;
    renderUI();
  });
  ui.querySelector("#quitGame")?.addEventListener("click", () => finishGame(true));
}

function submitUsername(event) {
  event.preventDefault();
  const username = new FormData(event.currentTarget).get("username").trim().slice(0, 18);
  if (!username) return;
  state.profile = { ...profile(), username };
  state.usernameDraft = username;
  saveLocal();
  state.screen = "authChoice";
  renderUI();
}

async function submitAuth(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const action = event.submitter?.value;
  const email = form.get("email");
  const password = form.get("password");
  if (!email || !password) {
    setNotice("Enter email and password, or continue as guest.");
    return;
  }
  try {
    if (action === "signup") await supabase.signUp(email, password, profile().username);
    else await supabase.signIn(email, password);
    state.user = await supabase.currentUser();
    await loadCloudState();
    if (state.profile?.username === "Hunter") {
      state.profile = await supabase.updateProfile(state.user.id, { username: state.usernameDraft || "Hunter" });
    }
    continueAfterAuth();
  } catch (error) {
    setNotice(error.message);
  }
}

function continueAfterAuth() {
  state.screen = "transition";
  renderUI();
  setTimeout(() => {
    state.screen = profile().selected_element ? "hub" : "elementSelect";
    renderUI();
  }, 2300);
}

async function confirmElement() {
  const selected = state.selectedElement;
  state.profile = { ...profile(), selected_element: selected };
  if (state.user) state.profile = await supabase.updateProfile(state.user.id, { selected_element: selected });
  saveLocal();
  state.screen = "hub";
  renderUI();
}

async function saveSettings(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const patch = {
    sound_volume: Number(form.get("sound_volume")),
    visual_intensity: Number(form.get("visual_intensity")),
    reduced_camera_shake: form.get("reduced_camera_shake") === "on"
  };
  state.settings = { ...state.settings, ...patch };
  if (state.user) await supabase.updateSettings(state.user.id, patch);
  localStorage.setItem("keyHunterSettings", JSON.stringify(state.settings));
  setNotice("Settings saved.");
  renderUI();
}

async function claimDaily() {
  const today = new Date().toISOString().slice(0, 10);
  if (state.daily?.last_claimed_date === today || localStorage.getItem("keyHunterDaily") === today) {
    setNotice("Daily check-in already claimed.");
    return;
  }
  await rewardPlayer({ words: 120, xp: 90 });
  state.daily = { user_id: state.user?.id, last_claimed_date: today, streak: (state.daily?.streak || 0) + 1 };
  localStorage.setItem("keyHunterDaily", today);
  if (state.user) await supabase.upsertDailyCheckin(state.daily);
  setNotice("Daily check-in: +120 Words, +90 XP.");
  renderUI();
}

async function claimMission() {
  await rewardPlayer({ words: 90, xp: 120 });
  setNotice("Mission reward claimed: +90 Words, +120 XP.");
  renderUI();
}

async function buyItem(event) {
  const id = event.currentTarget.dataset.buy;
  const item = [...GAME.skins, ...GAME.pets, ...GAME.soundPacks].find((entry) => entry.id === id);
  if (!item) return;
  if ((profile().words_balance || 0) < item.cost) {
    setNotice("Not enough Words.");
    return;
  }
  state.profile.words_balance -= item.cost;
  unlockItem(item);
  await persistProgress();
  setNotice(`${item.name} unlocked.`);
  renderUI();
}

async function equipItem(event) {
  const type = event.currentTarget.dataset.equipType;
  const id = event.currentTarget.dataset.equip;
  if (type === "skin") state.inventory.equipped_keyboard_skin = id;
  if (type === "pet") state.inventory.equipped_pet = id;
  if (type === "sound") state.inventory.equipped_sound_pack = id;
  await persistProgress();
  renderUI();
}

function unlockItem(item) {
  const inv = inventory();
  if (GAME.skins.some((entry) => entry.id === item.id)) addUnique(inv.owned_keyboard_skins, item.id);
  if (GAME.pets.some((entry) => entry.id === item.id)) addUnique(inv.owned_pets, item.id);
  if (GAME.soundPacks.some((entry) => entry.id === item.id)) addUnique(inv.owned_sound_packs, item.id);
}

function addUnique(list, value) {
  if (!list.includes(value)) list.push(value);
}

async function rewardPlayer({ words = 0, xp = 0, unlocks = [] }) {
  const result = applyXp(profile(), xp);
  state.profile = { ...profile(), ...result.profile, words_balance: (profile().words_balance || 0) + words };
  [...unlocks, ...result.unlocked].forEach((reward) => {
    const item = GAME.skins.find((entry) => entry.id === reward.itemId);
    if (item) unlockItem(item);
  });
  await persistProgress();
}

async function persistProgress() {
  state.profile.currency = state.profile.words_balance;
  state.profile.current_arena_rank_theme = state.profile.current_rank || "E";
  if (state.user) {
    await supabase.updateProfile(state.user.id, {
      username: state.profile.username,
      selected_element: state.profile.selected_element,
      current_rank: state.profile.current_rank,
      current_arena_rank_theme: state.profile.current_arena_rank_theme,
      total_score: state.profile.total_score,
      currency: state.profile.words_balance,
      words_balance: state.profile.words_balance,
      level: state.profile.level,
      xp: state.profile.xp,
      equipped_title: state.profile.equipped_title
    });
    await supabase.updateInventory(state.user.id, state.inventory);
  } else {
    saveLocal();
  }
}

async function loadLeaderboard() {
  try {
    state.leaderboard = supabase.configured ? await supabase.topScores("ranked") : [];
  } catch (error) {
    state.leaderboard = [];
    setNotice(error.message);
  }
}

function startGame() {
  const mode = GAME.modes[state.selectedMode];
  const elementId = profile().selected_element || state.selectedElement || "wind";
  state.game = {
    mode: state.selectedMode,
    zen: mode.zen,
    elementId,
    health: mode.zen ? 999 : 100,
    score: 0,
    combo: 0,
    maxCombo: 0,
    typed: 0,
    wrong: 0,
    bossKills: 0,
    defeated: 0,
    survival: 0,
    spawnTimer: 0,
    bossTimer: 48,
    petCooldown: 5,
    petShield: false,
    enemies: [],
    shots: [],
    impacts: [],
    drops: [],
    collectedDrops: [],
    particles: [],
    domainMeter: 0,
    domainTime: 0,
    shake: 0,
    paused: false,
    ended: false,
    last: performance.now()
  };
  state.screen = "battle";
  renderUI();
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function spawnEnemy(type = null) {
  const g = state.game;
  const elapsed = g.survival;
  const difficulty = 1 + elapsed / 70;
  const roll = Math.random();
  const picked = type || (roll < 0.2 ? "fast" : roll < 0.42 ? "tank" : roll < 0.58 ? "splitter" : roll < 0.7 ? "fake" : "normal");
  const wordSet = elapsed > 90 ? GAME.words.long : elapsed > 35 ? GAME.words.medium : GAME.words.short;
  const text = picked === "fast"
    ? randomItem("asdfjklqwertyuiopzxcvbnm123456789".split(""))
    : picked === "boss"
      ? randomItem(GAME.words.boss)
      : randomItem(wordSet);
  g.enemies.push({
    id: crypto.randomUUID(),
    type: picked,
    text,
    bait: picked === "fake" ? randomItem("asdfjkl".split("")) : "",
    progress: 0,
    x: 0.14 + Math.random() * 0.72,
    lane: Math.random() * Math.PI * 2,
    z: 0.02,
    speed: (picked === "fast" ? 0.17 : picked === "tank" ? 0.06 : picked === "boss" ? 0.035 : 0.095) * difficulty,
    hp: picked === "tank" ? 3 : picked === "boss" ? 18 : 1,
    maxHp: picked === "tank" ? 3 : picked === "boss" ? 18 : 1,
    revealed: picked !== "fake",
    revealTimer: picked === "fake" ? 3.8 : 0,
    slow: 0,
    hitFlash: 0,
    walk: Math.random() * 10,
    windup: 0
  });
}

function updateGame(dt) {
  const g = state.game;
  if (!g || g.paused || g.ended) return;
  g.survival += dt;
  g.spawnTimer -= dt;
  g.bossTimer -= dt;
  g.domainTime = Math.max(0, g.domainTime - dt);
  g.shake = Math.max(0, g.shake - dt * 12);
  updatePet(dt);

  const spawnRate = Math.max(0.42, 1.35 - g.survival / 120);
  if (g.spawnTimer <= 0) {
    spawnEnemy();
    g.spawnTimer = spawnRate;
  }
  if (g.bossTimer <= 0) {
    spawnEnemy("boss");
    g.bossTimer = 62;
  }

  for (const enemy of g.enemies) {
    if (!enemy.revealed) {
      enemy.revealTimer -= dt;
      if (enemy.revealTimer <= 0) {
        enemy.revealed = true;
        enemy.type = "fast";
        enemy.text = enemy.bait;
      }
    }
    enemy.walk += dt * (enemy.type === "fast" ? 12 : 6);
    enemy.windup = enemy.z > 0.82 ? Math.min(1, enemy.windup + dt * 2) : 0;
    const slow = enemy.slow > 0 ? 0.42 : 1;
    enemy.slow = Math.max(0, enemy.slow - dt);
    enemy.hitFlash = Math.max(0, enemy.hitFlash - dt);
    enemy.z += enemy.speed * slow * dt * (g.domainTime > 0 && g.elementId === "ice" ? 0.65 : 1);
  }

  const escaped = g.enemies.filter((enemy) => enemy.z >= 1.05);
  if (escaped.length) {
    g.enemies = g.enemies.filter((enemy) => enemy.z < 1.05);
    if (g.petShield) {
      g.petShield = false;
      setNotice("Guard pet blocked a hit.");
    } else if (!g.zen) {
      g.health -= escaped.reduce((sum, enemy) => sum + (enemy.type === "boss" ? 25 : 10), 0);
    }
    if (equippedPet().effect === "combo" && g.petCooldown <= 0) {
      g.petCooldown = 12;
    } else {
      g.combo = 0;
    }
    g.shake = 1;
  }

  updateCollections(g.shots, dt);
  updateCollections(g.impacts, dt);
  updateCollections(g.particles, dt);
  for (const drop of g.drops) {
    drop.life -= dt;
    drop.y -= 24 * dt;
    if (drop.life < 1.8 && !drop.collected) {
      drop.collected = true;
      g.collectedDrops.push(drop);
    }
  }
  g.drops = g.drops.filter((drop) => drop.life > 0.25);
  if (g.health <= 0) finishGame(false);
}

function updateCollections(list, dt) {
  for (const item of list) {
    item.life -= dt;
    item.t = (item.t || 0) + dt;
    item.x += (item.vx || 0) * dt;
    item.y += (item.vy || 0) * dt;
  }
  list.splice(0, list.length, ...list.filter((item) => item.life > 0));
}

function updatePet(dt) {
  const g = state.game;
  const pet = equippedPet();
  g.petCooldown -= dt;
  if (g.petCooldown > 0) return;
  if (pet.effect === "shield") {
    g.petShield = true;
    g.petCooldown = 18;
    return;
  }
  const target = [...g.enemies].sort((a, b) => b.z - a.z)[0];
  if (!target) return;
  if (pet.effect === "damage") {
    target.hp -= 1;
    target.hitFlash = 0.3;
    burst(target, "#ffe066");
    if (target.hp <= 0) killEnemy(target);
  }
  if (pet.effect === "slow") target.slow = Math.max(target.slow, 4);
  g.petCooldown = pet.effect === "combo" ? 14 : 10;
}

function handleTyping(event) {
  const g = state.game;
  if (state.screen === "splash") {
    if (performance.now() >= state.splashReadyAt) {
      state.screen = "username";
      renderUI();
    }
    return;
  }
  if (state.screen !== "battle" || !g || g.paused || g.ended) return;
  if (event.ctrlKey || event.altKey || event.metaKey) return;
  if (event.key === "Escape") {
    g.paused = !g.paused;
    renderUI();
    return;
  }
  if (event.key.length !== 1) return;
  event.preventDefault();
  const key = event.key;
  g.typed += 1;
  addImpact(innerWidth / 2, innerHeight - 120);
  audio.play(inventory().equipped_sound_pack || equippedSkin().soundPack);

  const fake = g.enemies.find((enemy) => !enemy.revealed && enemy.bait.toLowerCase() === key.toLowerCase());
  if (fake) {
    punishWrong(18);
    fake.hitFlash = 0.4;
    return;
  }

  const target = g.enemies
    .filter((enemy) => enemy.revealed && enemy.text[enemy.progress]?.toLowerCase() === key.toLowerCase())
    .sort((a, b) => b.z - a.z)[0];

  if (!target) {
    punishWrong(0);
    return;
  }

  target.progress += 1;
  target.hitFlash = 0.18;
  g.combo += 1;
  g.maxCombo = Math.max(g.maxCombo, g.combo);
  g.score += 25 + Math.min(300, g.combo * 4);
  g.domainMeter = Math.min(100, g.domainMeter + 2.8);
  fireElementAttack(target);
  if (g.combo > 0 && g.combo % 8 === 0) applyElementPulse();
  if (g.domainMeter >= 100 && g.combo >= 30) activateDomain();
  if (target.progress >= target.text.length) damageEnemy(target, 1);
  renderUI();
}

function addImpact(x, y) {
  const g = state.game;
  const effect = equippedSkin().typingEffect || GAME.elements[g.elementId].impact;
  const color = GAME.elements[g.elementId].color;
  g.impacts.push({ x, y, effect, color, life: 0.42, t: 0 });
}

function punishWrong(extraDamage) {
  const g = state.game;
  g.wrong += 1;
  if (equippedPet().effect === "combo" && g.petCooldown <= 0) {
    g.petCooldown = 14;
    setNotice("Combo pet protected your streak.");
  } else {
    g.combo = 0;
  }
  g.shake = state.settings.reduced_camera_shake ? 0.15 : 0.55;
  if (!g.zen) g.health -= 4 + extraDamage;
  const boss = g.enemies.find((enemy) => enemy.type === "boss");
  if (boss) {
    boss.hp = Math.min(boss.maxHp, boss.hp + 1);
    boss.text += randomItem(["!", "7", "x"]);
  }
  audio.play("glitch_error", 0.7);
  renderUI();
}

function damageEnemy(enemy, amount) {
  enemy.hp -= amount;
  enemy.progress = 0;
  if (enemy.hp <= 0) killEnemy(enemy);
}

function killEnemy(enemy) {
  const g = state.game;
  g.score += enemy.type === "boss" ? 1500 : enemy.type === "tank" ? 420 : 180;
  g.domainMeter = Math.min(100, g.domainMeter + (enemy.type === "boss" ? 20 : 6));
  g.defeated += 1;
  if (enemy.type === "boss") g.bossKills += 1;
  spawnDrops(enemy);
  burst(enemy, GAME.elements[g.elementId].color);
  if (enemy.type === "splitter") {
    for (const letter of enemy.text.slice(0, 4)) {
      g.enemies.push({ ...enemy, id: crypto.randomUUID(), type: "fast", text: letter, hp: 1, maxHp: 1, progress: 0, z: Math.max(0.04, enemy.z - 0.05), x: Math.min(0.86, Math.max(0.12, enemy.x + (Math.random() - 0.5) * 0.2)), speed: enemy.speed * 1.5 });
    }
  }
  g.enemies = g.enemies.filter((item) => item !== enemy && item.hp > 0);
}

function spawnDrops(enemy) {
  const g = state.game;
  const pos = enemyPosition(enemy);
  const petBonus = equippedPet().effect === "words" ? 1.18 : 1;
  for (const drop of GAME.drops) {
    const bossBoost = enemy.type === "boss" ? 0.18 : 0;
    if (Math.random() > drop.chance + bossBoost) continue;
    const amount = Math.ceil((drop.min + Math.random() * (drop.max - drop.min)) * (drop.id === "words" ? petBonus : 1));
    g.drops.push({ ...drop, amount, x: pos.x + (Math.random() - 0.5) * 40, y: pos.y, life: 2.4, collected: false });
  }
}

function applyElementPulse() {
  const g = state.game;
  if (g.elementId === "wind") g.enemies.forEach((enemy) => enemy.z = Math.max(0.03, enemy.z - 0.08));
  if (g.elementId === "ice") g.enemies.forEach((enemy) => enemy.slow = Math.max(enemy.slow, 2.8));
  if (g.elementId === "fire") g.enemies.slice(0, 3).forEach((enemy) => {
    enemy.hp -= 0.45;
    enemy.hitFlash = 0.25;
  });
  if (g.elementId === "lightning") g.enemies.slice(0, 3).forEach((enemy) => {
    enemy.hp -= 0.35;
    enemy.hitFlash = 0.28;
  });
  g.enemies.filter((enemy) => enemy.hp <= 0).forEach(killEnemy);
}

function activateDomain() {
  const g = state.game;
  g.domainMeter = 0;
  g.domainTime = 8;
  g.shake = state.settings.reduced_camera_shake ? 0.2 : 0.8;
  if (g.elementId === "ice") g.enemies.forEach((enemy) => enemy.slow = 5);
  if (g.elementId === "wind") g.enemies.forEach((enemy) => enemy.z = Math.max(0.02, enemy.z - 0.18));
  if (g.elementId === "fire") g.enemies.forEach((enemy) => enemy.hp -= enemy.type === "boss" ? 2 : 1);
  if (g.elementId === "lightning") g.enemies.forEach((enemy) => enemy.hp -= enemy.type === "boss" ? 2 : 1);
  g.enemies.filter((enemy) => enemy.hp <= 0).forEach(killEnemy);
  audio.play("void_bass", 1);
}

function fireElementAttack(enemy) {
  const g = state.game;
  const pos = enemyPosition(enemy);
  g.shots.push({ x1: innerWidth / 2, y1: innerHeight - 105, x2: pos.x, y2: pos.y, life: 0.28, t: 0, element: g.elementId, color: GAME.elements[g.elementId].color });
}

function burst(enemy, color) {
  const g = state.game;
  const pos = enemyPosition(enemy);
  for (let i = 0; i < 18; i++) {
    g.particles.push({ x: pos.x, y: pos.y, vx: (Math.random() - 0.5) * 260, vy: (Math.random() - 0.5) * 220, life: 0.35 + Math.random() * 0.35, color });
  }
}

function enemyPosition(enemy) {
  const horizon = innerHeight * 0.25;
  const front = innerHeight * 0.68;
  const sway = Math.sin(enemy.walk * 0.7 + enemy.lane) * 22 * enemy.z;
  const bob = Math.sin(enemy.walk) * 9 * (0.2 + enemy.z);
  const x = innerWidth * enemy.x + sway;
  const y = horizon + (front - horizon) * enemy.z + bob;
  const scale = 0.34 + enemy.z * 1.45;
  return { x, y, scale };
}

async function finishGame(quit) {
  const g = state.game;
  if (!g || g.ended) return;
  g.ended = true;
  const accuracy = g.typed ? Math.max(0, Math.round(((g.typed - g.wrong) / g.typed) * 1000) / 10) : 100;
  const grade = gradeForScore(g.score, accuracy, g.maxCombo, g.bossKills, Math.floor(g.survival)).grade;
  const dropWords = g.collectedDrops.filter((drop) => drop.id === "words").reduce((sum, drop) => sum + drop.amount, 0);
  const dropXp = g.collectedDrops.filter((drop) => drop.id === "xp").reduce((sum, drop) => sum + drop.amount, 0);
  const words = quit ? 0 : Math.max(15, Math.floor(g.score / 90) + g.bossKills * 50 + dropWords);
  const xp = quit ? 0 : Math.max(20, Math.floor(g.score / 55) + g.maxCombo * 2 + g.bossKills * 120 + dropXp);
  state.lastResult = { score: g.score, accuracy, maxCombo: g.maxCombo, grade, words, xp, drops: g.collectedDrops.length };
  state.profile = { ...profile(), total_score: (profile().total_score || 0) + g.score, current_rank: grade };
  await rewardPlayer({ words, xp });

  try {
    if (state.user && g.mode === "ranked") {
      await supabase.saveScore({
        user_id: state.user.id,
        mode: "ranked",
        score: g.score,
        accuracy,
        max_combo: g.maxCombo,
        rank_grade: grade,
        boss_kills: g.bossKills,
        survival_seconds: Math.floor(g.survival)
      });
      setNotice("Ranked score saved.");
    }
  } catch (error) {
    setNotice(`Score kept locally. Supabase said: ${error.message}`);
  }
  state.screen = "results";
  renderUI();
}

function drawSplash(time) {
  const img = state.assets.splash;
  ctx.fillStyle = "#020308";
  ctx.fillRect(0, 0, innerWidth, innerHeight);
  if (img) {
    const scale = Math.max(innerWidth / img.width, innerHeight / img.height) * (1.04 + Math.sin(time * 0.0008) * 0.012);
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.globalAlpha = 0.72;
    ctx.drawImage(img, (innerWidth - w) / 2, (innerHeight - h) / 2, w, h);
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(0, 0, innerWidth, innerHeight);
  for (let y = 0; y < innerHeight; y += 6) {
    ctx.fillStyle = "rgba(255,255,255,0.025)";
    ctx.fillRect(0, y, innerWidth, 1);
  }
  ctx.textAlign = "center";
  ctx.fillStyle = `rgba(233,251,255,${performance.now() >= state.splashReadyAt ? 0.58 + Math.sin(time * 0.006) * 0.18 : 0.2})`;
  ctx.font = "600 18px system-ui";
  ctx.fillText("Press any key or click to continue", innerWidth / 2, innerHeight * 0.58);
}

function drawHubBackdrop() {
  const time = performance.now();
  const theme = rankTheme(profile().current_rank || "E");
  ctx.fillStyle = "#05070d";
  ctx.fillRect(0, 0, innerWidth, innerHeight);
  const sky = ctx.createLinearGradient(0, 0, 0, innerHeight);
  sky.addColorStop(0, "#030614");
  sky.addColorStop(0.42, "#0a1730");
  sky.addColorStop(1, "#05070d");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, innerWidth, innerHeight);

  ctx.fillStyle = theme.accent + "12";
  ctx.fillRect(0, 0, innerWidth, innerHeight);

  for (let layer = 0; layer < 3; layer++) {
    const baseY = innerHeight * (0.34 + layer * 0.12);
    const buildingW = 46 + layer * 20;
    for (let x = -80; x < innerWidth + 120; x += buildingW + 12) {
      const seed = Math.sin(x * 0.017 + layer * 8);
      const h = innerHeight * (0.22 + layer * 0.08) + seed * 50;
      const y = baseY - h * 0.5;
      ctx.fillStyle = layer === 0 ? "rgba(8,14,32,0.58)" : layer === 1 ? "rgba(7,12,28,0.72)" : "rgba(4,8,18,0.9)";
      ctx.fillRect(x, y, buildingW, h);
      ctx.strokeStyle = layer === 2 ? theme.accent + "3f" : theme.secondary + "2a";
      ctx.strokeRect(x, y, buildingW, h);
      for (let wy = y + 18; wy < y + h - 10; wy += 26) {
        if (Math.sin(x * 12.9898 + wy * 78.233 + layer * 19.19) < -0.82) continue;
        ctx.fillStyle = (Math.sin(wy + x + time * 0.0007) > 0.4 ? theme.accent : theme.secondary) + (layer === 2 ? "99" : "55");
        ctx.fillRect(x + 10, wy, 14, 3);
        ctx.fillRect(x + buildingW - 24, wy + 7, 12, 3);
      }
    }
  }

  ctx.strokeStyle = "rgba(35, 48, 86, 0.72)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    const y = innerHeight * 0.1 + i * 23;
    ctx.moveTo(innerWidth * 0.28, y);
    ctx.bezierCurveTo(innerWidth * 0.45, y + 40, innerWidth * 0.62, y - 30, innerWidth * 0.82, y + 18);
    ctx.stroke();
  }

  const floor = ctx.createLinearGradient(0, innerHeight * 0.62, 0, innerHeight);
  floor.addColorStop(0, "rgba(7,13,25,0.15)");
  floor.addColorStop(1, "rgba(3,5,11,0.95)");
  ctx.fillStyle = floor;
  ctx.fillRect(0, innerHeight * 0.58, innerWidth, innerHeight * 0.42);
  ctx.strokeStyle = theme.accent + "66";
  ctx.lineWidth = 1;
  for (let i = 0; i < 18; i++) {
    const y = innerHeight * 0.62 + i * 28;
    ctx.beginPath();
    ctx.moveTo(innerWidth * 0.08, y);
    ctx.lineTo(innerWidth * 0.92, y + i * 6);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(0,0,0,0.08)";
  ctx.fillRect(0, 0, innerWidth, innerHeight);
}

function drawArena(time) {
  const grade = profile().current_rank || "E";
  const theme = rankTheme(grade);
  const grd = ctx.createLinearGradient(0, 0, 0, innerHeight);
  grd.addColorStop(0, theme.bg);
  grd.addColorStop(0.55, "#0b1020");
  grd.addColorStop(1, "#03050b");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, innerWidth, innerHeight);

  if (state.assets.arena) {
    ctx.globalAlpha = 0.12 + (grade === "S" ? 0.08 : 0);
    ctx.drawImage(state.assets.arena, 0, 0, innerWidth, innerHeight);
    ctx.globalAlpha = 1;
  }

  const horizon = innerHeight * 0.28;
  ctx.strokeStyle = theme.accent + "55";
  ctx.lineWidth = 1;
  for (let i = 0; i < 22; i++) {
    const y = horizon + i * 28;
    ctx.beginPath();
    ctx.moveTo(innerWidth * 0.08, y);
    ctx.lineTo(innerWidth * 0.92, y + i * 11);
    ctx.stroke();
  }
  for (let i = -8; i <= 8; i++) {
    ctx.beginPath();
    ctx.moveTo(innerWidth / 2, horizon);
    ctx.lineTo(innerWidth / 2 + i * innerWidth * 0.08, innerHeight);
    ctx.stroke();
  }
  if (state.game?.domainTime > 0) {
    ctx.fillStyle = GAME.elements[state.game.elementId].color + "22";
    ctx.fillRect(0, 0, innerWidth, innerHeight);
  }
  drawKeyboard(theme, time);
}

function drawKeyboard(theme, time) {
  const skin = equippedSkin();
  const baseY = innerHeight - 96;
  const keyW = Math.max(34, innerWidth / 29);
  const rows = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
  ctx.save();
  ctx.translate(innerWidth / 2, baseY);
  ctx.shadowColor = theme.accent;
  ctx.shadowBlur = 20;
  rows.forEach((row, rowIndex) => {
    const offset = -(row.length * keyW) / 2 + rowIndex * keyW * 0.35;
    for (let i = 0; i < row.length; i++) {
      const phase = skin.id.includes("quantum") ? Math.sin(time * 0.005 + i) * 3 : 0;
      const x = offset + i * keyW + phase;
      const y = rowIndex * 30 + Math.sin(time * 0.004 + i) * (skin.id.includes("ghost") ? 3 : 0);
      ctx.fillStyle = skin.id.includes("crimson") ? "rgba(90,14,20,0.92)" : skin.id.includes("ice") ? "rgba(160,235,255,0.22)" : "rgba(14,23,43,0.9)";
      ctx.strokeStyle = theme.accent + "99";
      ctx.fillRect(x, y, keyW - 4, 25);
      ctx.strokeRect(x, y, keyW - 4, 25);
      ctx.fillStyle = "#e6f6ff";
      ctx.font = "13px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(row[i], x + keyW / 2 - 2, y + 17);
    }
  });
  ctx.restore();
  drawPet(time, theme);
}

function drawPet(time, theme) {
  const pet = equippedPet();
  const x = innerWidth * 0.62 + Math.sin(time * 0.003) * 12;
  const y = innerHeight - 145 + Math.cos(time * 0.004) * 8;
  ctx.save();
  ctx.translate(x, y);
  ctx.shadowColor = theme.accent;
  ctx.shadowBlur = 18;
  ctx.fillStyle = pet.effect === "slow" ? "#93e8ff" : pet.effect === "shield" ? "#76ffb4" : pet.effect === "words" ? "#ffd166" : "#ffe066";
  ctx.beginPath();
  ctx.arc(0, 0, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#fff";
  ctx.stroke();
  ctx.restore();
}

function drawEnemies() {
  const g = state.game;
  if (!g) return;
  [...g.enemies].sort((a, b) => a.z - b.z).forEach(drawEnemy);
}

function drawEnemy(enemy) {
  const pos = enemyPosition(enemy);
  ctx.save();
  ctx.translate(pos.x, pos.y);
  ctx.scale(pos.scale, pos.scale);
  const walk = Math.sin(enemy.walk);
  const color = enemy.type === "boss" ? "#3f1b5f" : enemy.type === "tank" ? "#55351f" : enemy.type === "fake" && !enemy.revealed ? "#4a0b18" : "#101a33";
  ctx.globalAlpha = 0.45 + enemy.z * 0.55;
  ctx.shadowColor = enemy.type === "fake" && !enemy.revealed ? "#ff4664" : enemy.hitFlash ? "#ffffff" : "#6eeeff";
  ctx.shadowBlur = enemy.hitFlash ? 34 : 14;

  ctx.strokeStyle = enemy.type === "fake" && !enemy.revealed ? "#ff4664" : "#6eeeff";
  ctx.lineWidth = 2;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -38 - enemy.windup * 7);
  ctx.lineTo(30 + walk * 3, -10);
  ctx.lineTo(22, 34);
  ctx.lineTo(7, 42 + walk * 5);
  ctx.lineTo(0, 26);
  ctx.lineTo(-7, 42 - walk * 5);
  ctx.lineTo(-22, 34);
  ctx.lineTo(-30 - walk * 3, -10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#f4f7ff";
  ctx.fillRect(-15, -10, 30, 7);
  ctx.fillStyle = "#05070d";
  ctx.fillRect(-12, -8, 8, 3);
  ctx.fillRect(5, -8, 8, 3);
  ctx.globalAlpha = 1;
  drawEnemyLabel(enemy);
  ctx.restore();
}

function drawEnemyLabel(enemy) {
  const shown = enemy.revealed ? enemy.text : enemy.bait;
  const typed = enemy.revealed ? shown.slice(0, enemy.progress) : "";
  const rest = enemy.revealed ? shown.slice(enemy.progress) : shown;
  const color = enemy.type === "fake" && !enemy.revealed ? "#ff4664" : enemy.type === "tank" ? "#ffb15f" : "#eaffff";
  ctx.font = enemy.type === "boss" ? "800 20px system-ui" : "800 18px system-ui";
  ctx.textAlign = "center";
  ctx.lineWidth = 5;
  ctx.strokeStyle = "rgba(0,0,0,0.82)";
  ctx.strokeText(shown, 0, -58);
  ctx.fillStyle = "#76ffb4";
  ctx.fillText(typed, -ctx.measureText(rest).width / 2, -58);
  ctx.fillStyle = color;
  ctx.fillText(rest, ctx.measureText(typed).width / 2, -58);
  if (enemy.maxHp > 1) {
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(-38, -44, 76, 5);
    ctx.fillStyle = color;
    ctx.fillRect(-38, -44, 76 * Math.max(0, enemy.hp / enemy.maxHp), 5);
  }
}

function drawEffects() {
  const g = state.game;
  if (!g) return;
  for (const shot of g.shots) drawElementShot(shot);
  for (const impact of g.impacts) drawImpact(impact);
  for (const particle of g.particles) {
    ctx.globalAlpha = Math.max(0, particle.life * 2);
    ctx.fillStyle = particle.color;
    ctx.fillRect(particle.x, particle.y, 4, 4);
  }
  ctx.globalAlpha = 1;
  for (const drop of g.drops) drawDrop(drop);
}

function drawElementShot(shot) {
  const p = 1 - shot.life / 0.28;
  ctx.save();
  ctx.strokeStyle = shot.color;
  ctx.fillStyle = shot.color;
  ctx.shadowColor = shot.color;
  ctx.shadowBlur = 20;
  if (shot.element === "lightning") {
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(shot.x1, shot.y1);
    for (let i = 1; i <= 5; i++) {
      const t = i / 5;
      ctx.lineTo(shot.x1 + (shot.x2 - shot.x1) * t + (Math.random() - 0.5) * 18, shot.y1 + (shot.y2 - shot.y1) * t);
    }
    ctx.stroke();
  } else if (shot.element === "fire") {
    ctx.beginPath();
    ctx.ellipse(shot.x1 + (shot.x2 - shot.x1) * p, shot.y1 + (shot.y2 - shot.y1) * p, 24, 9, p * 4, 0, Math.PI * 2);
    ctx.fill();
  } else if (shot.element === "ice") {
    ctx.beginPath();
    ctx.moveTo(shot.x1 + (shot.x2 - shot.x1) * p, shot.y1 + (shot.y2 - shot.y1) * p - 18);
    ctx.lineTo(shot.x1 + (shot.x2 - shot.x1) * p + 12, shot.y1 + (shot.y2 - shot.y1) * p + 18);
    ctx.lineTo(shot.x1 + (shot.x2 - shot.x1) * p - 12, shot.y1 + (shot.y2 - shot.y1) * p + 18);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(shot.x1 + (shot.x2 - shot.x1) * p, shot.y1 + (shot.y2 - shot.y1) * p, 18 + p * 20, 0, Math.PI * 1.6);
    ctx.stroke();
  }
  ctx.restore();
}

function drawImpact(impact) {
  const p = 1 - impact.life / 0.42;
  ctx.save();
  ctx.globalAlpha = 1 - p;
  ctx.strokeStyle = impact.color;
  ctx.fillStyle = impact.color;
  ctx.shadowColor = impact.color;
  ctx.shadowBlur = 16;
  if (impact.effect.includes("crack") || impact.effect === "digital_crack") {
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(impact.x, impact.y);
      ctx.lineTo(impact.x + Math.cos(i * 1.25) * p * 72, impact.y + Math.sin(i * 1.25) * p * 40);
      ctx.stroke();
    }
  } else if (impact.effect.includes("flame")) {
    ctx.beginPath();
    ctx.arc(impact.x, impact.y, 10 + p * 46, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(impact.x, impact.y, 8 + p * 62, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawDrop(drop) {
  ctx.save();
  ctx.globalAlpha = Math.min(1, drop.life);
  ctx.fillStyle = drop.id === "words" ? "#ffd166" : drop.id === "xp" ? "#76ffb4" : "#b86cff";
  ctx.shadowColor = ctx.fillStyle;
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.arc(drop.x, drop.y, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = "700 12px system-ui";
  ctx.textAlign = "center";
  ctx.fillText(`+${drop.amount}`, drop.x, drop.y - 12);
  ctx.restore();
}

function drawMenuBackdrop(time) {
  if (state.screen === "splash") {
    drawSplash(time);
    return;
  }
  if (["hub", "inventory", "shop", "settings", "leaderboard", "results"].includes(state.screen)) {
    drawHubBackdrop();
    return;
  }
  drawArena(time);
  ctx.fillStyle = "rgba(0,0,0,0.42)";
  ctx.fillRect(0, 0, innerWidth, innerHeight);
}

function loop(time) {
  const g = state.game;
  const now = performance.now();
  const dt = Math.min(0.05, (now - (g?.last || now)) / 1000);
  if (g) g.last = now;

  if (state.screen === "battle" && g) {
    updateGame(dt);
    const shakeAmount = g.shake * (state.settings.reduced_camera_shake ? 4 : 12);
    ctx.save();
    if (shakeAmount > 0) ctx.translate((Math.random() - 0.5) * shakeAmount, (Math.random() - 0.5) * shakeAmount);
    drawArena(time);
    drawEnemies();
    drawEffects();
    ctx.restore();
  } else {
    drawMenuBackdrop(time);
  }
  requestAnimationFrame(loop);
}

window.addEventListener("keydown", handleTyping);
window.addEventListener("pointerdown", () => {
  if (state.screen === "splash" && performance.now() >= state.splashReadyAt) {
    state.screen = "username";
    renderUI();
  }
});

boot();
