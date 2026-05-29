const LOCAL_SESSION_KEY = "keyHunterSession";

function headers(anonKey, token) {
  return {
    apikey: anonKey,
    authorization: `Bearer ${token || anonKey}`,
    "content-type": "application/json"
  };
}

async function parse(response) {
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message = data?.msg || data?.message || data?.error_description || data?.error || "Supabase request failed";
    throw new Error(message);
  }
  return data;
}

export class KeyHunterSupabase {
  constructor(env = window.KEY_HUNTER_ENV || {}) {
    this.url = (env.SUPABASE_URL || "").replace(/\/$/, "");
    this.anonKey = env.SUPABASE_ANON_KEY || "";
    this.session = this.loadSession();
  }

  get configured() {
    return Boolean(this.url && this.anonKey);
  }

  loadSession() {
    try {
      return JSON.parse(localStorage.getItem(LOCAL_SESSION_KEY) || "null");
    } catch {
      return null;
    }
  }

  saveSession(session) {
    this.session = session;
    if (session) localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(LOCAL_SESSION_KEY);
  }

  async signUp(email, password, username) {
    const data = await parse(await fetch(`${this.url}/auth/v1/signup`, {
      method: "POST",
      headers: headers(this.anonKey),
      body: JSON.stringify({ email, password, options: { data: { username } } })
    }));
    if (data?.access_token) this.saveSession(data);
    return data;
  }

  async signIn(email, password) {
    const data = await parse(await fetch(`${this.url}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: headers(this.anonKey),
      body: JSON.stringify({ email, password })
    }));
    this.saveSession(data);
    return data;
  }

  signOut() {
    this.saveSession(null);
  }

  async currentUser() {
    if (!this.session?.access_token) return null;
    try {
      const data = await parse(await fetch(`${this.url}/auth/v1/user`, {
        headers: headers(this.anonKey, this.session.access_token)
      }));
      return data;
    } catch {
      this.signOut();
      return null;
    }
  }

  async select(table, query = "", token = this.session?.access_token) {
    return parse(await fetch(`${this.url}/rest/v1/${table}${query}`, {
      headers: headers(this.anonKey, token)
    }));
  }

  async insert(table, row, token = this.session?.access_token) {
    return parse(await fetch(`${this.url}/rest/v1/${table}`, {
      method: "POST",
      headers: { ...headers(this.anonKey, token), prefer: "return=representation" },
      body: JSON.stringify(row)
    }));
  }

  async patch(table, filter, row, token = this.session?.access_token) {
    return parse(await fetch(`${this.url}/rest/v1/${table}${filter}`, {
      method: "PATCH",
      headers: { ...headers(this.anonKey, token), prefer: "return=representation" },
      body: JSON.stringify(row)
    }));
  }

  async getProfile(userId) {
    const rows = await this.select("profiles", `?id=eq.${userId}&select=*`);
    return rows[0] || null;
  }

  async ensureProfile(user) {
    let profile = await this.getProfile(user.id);
    if (!profile) {
      const username = user.user_metadata?.username || user.email?.split("@")[0] || "Hunter";
      const rows = await this.insert("profiles", { id: user.id, username });
      profile = rows[0];
    }
    return profile;
  }

  async updateProfile(userId, patch) {
    const rows = await this.patch("profiles", `?id=eq.${userId}`, patch);
    return rows[0] || null;
  }

  async getInventory(userId) {
    const rows = await this.select("inventory", `?user_id=eq.${userId}&select=*`);
    return rows[0] || null;
  }

  async updateInventory(userId, patch) {
    const rows = await this.patch("inventory", `?user_id=eq.${userId}`, patch);
    return rows[0] || null;
  }

  async getDailyCheckin(userId) {
    const rows = await this.select("daily_checkins", `?user_id=eq.${userId}&select=*`);
    return rows[0] || null;
  }

  async upsertDailyCheckin(row) {
    return parse(await fetch(`${this.url}/rest/v1/daily_checkins`, {
      method: "POST",
      headers: { ...headers(this.anonKey, this.session?.access_token), prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(row)
    }));
  }

  async getMissionProgress(userId) {
    return this.select("mission_progress", `?user_id=eq.${userId}&select=*`);
  }

  async upsertMissionProgress(rows) {
    return parse(await fetch(`${this.url}/rest/v1/mission_progress`, {
      method: "POST",
      headers: { ...headers(this.anonKey, this.session?.access_token), prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(rows)
    }));
  }

  async getSettings(userId) {
    const rows = await this.select("settings", `?user_id=eq.${userId}&select=*`);
    return rows[0] || null;
  }

  async updateSettings(userId, patch) {
    const rows = await this.patch("settings", `?user_id=eq.${userId}`, patch);
    return rows[0] || null;
  }

  async saveScore(row) {
    return this.insert("leaderboard_scores", row);
  }

  async topScores(mode = "ranked") {
    const scores = await this.select(
      "leaderboard_scores",
      `?mode=eq.${mode}&select=user_id,score,accuracy,max_combo,rank_grade,created_at&order=score.desc&limit=10`,
      null
    );
    const ids = [...new Set(scores.map((score) => score.user_id))];
    if (!ids.length) return [];
    const quoted = ids.map((id) => `"${id}"`).join(",");
    const profiles = await this.select("profiles", `?id=in.(${quoted})&select=id,username`, null);
    const names = new Map(profiles.map((profile) => [profile.id, profile.username]));
    return scores.map((score) => ({ ...score, username: names.get(score.user_id) || "Hunter" }));
  }
}
