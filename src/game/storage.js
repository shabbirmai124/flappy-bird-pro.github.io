import { GAME_CONFIG } from './config.js';

const STORAGE_KEY = 'flappy_bird_pro_save_data';

function createDefaultData() {
  return {
    highScore: 0,
    coins: 0,
    totalCoinsCollected: 0,
    totalGamesPlayed: 0,
    maxComboReached: 0,
    unlockedSkins: ['yellow'],
    selectedSkin: 'yellow',
    selectedTheme: 'day',
    selectedDifficulty: 'normal',
    soundEnabled: true,
    musicEnabled: true,
    lastDailyRewardTime: 0,
    completedAchievements: [],
    leaderboard: [],
  };
}

export const storage = {
  data: createDefaultData(),

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.data = { ...createDefaultData(), ...parsed };
        if (!Array.isArray(this.data.leaderboard)) this.data.leaderboard = [];
        if (!Array.isArray(this.data.unlockedSkins) || this.data.unlockedSkins.length === 0) {
          this.data.unlockedSkins = ['yellow'];
        }
        if (!Array.isArray(this.data.completedAchievements)) {
          this.data.completedAchievements = [];
        }
        if (!GAME_CONFIG.THEMES[this.data.selectedTheme]) {
          this.data.selectedTheme = 'day';
        }
        if (!GAME_CONFIG.DIFFICULTIES[this.data.selectedDifficulty]) {
          this.data.selectedDifficulty = 'normal';
        }
      }
    } catch (err) {
      console.error('Error loading game data from LocalStorage', err);
    }
    return this.data;
  },

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (err) {
      console.error('Error saving game data to LocalStorage', err);
    }
  },

  reset() {
    this.data = createDefaultData();
    this.save();
  },

  addCoins(amount) {
    this.data.coins += amount;
    this.data.totalCoinsCollected += amount;
    this.save();
  },

  incrementGamesPlayed() {
    this.data.totalGamesPlayed = (this.data.totalGamesPlayed || 0) + 1;
    this.save();
  },

  updateMaxCombo(combo) {
    if (combo > (this.data.maxComboReached || 0)) {
      this.data.maxComboReached = combo;
      this.save();
    }
  },

  addLeaderboardEntry(score, skin) {
    if (!Array.isArray(this.data.leaderboard)) this.data.leaderboard = [];
    this.data.leaderboard.push({
      score,
      skin: skin || 'yellow',
      date: new Date().toLocaleDateString(),
    });
    this.data.leaderboard.sort((a, b) => b.score - a.score);
    if (this.data.leaderboard.length > GAME_CONFIG.LEADERBOARD_MAX_ENTRIES) {
      this.data.leaderboard.length = GAME_CONFIG.LEADERBOARD_MAX_ENTRIES;
    }
    this.save();
  },

  checkAchievements(score, maxCombo, onUnlock) {
    let changed = false;
    GAME_CONFIG.ACHIEVEMENTS.forEach((ach) => {
      if (this.data.completedAchievements.includes(ach.id)) return;
      let reached = false;
      if (ach.type === 'coins') {
        reached = this.data.totalCoinsCollected >= ach.target;
      } else if (ach.type === 'combo') {
        reached = maxCombo >= ach.target;
      } else if (ach.type === 'games') {
        reached = (this.data.totalGamesPlayed || 0) >= ach.target;
      } else {
        reached = score >= ach.target;
      }

      if (reached) {
        this.data.completedAchievements.push(ach.id);
        this.data.coins += ach.reward;
        changed = true;
        if (onUnlock) onUnlock(ach);
      }
    });
    if (changed) this.save();
  },

  claimDailyReward() {
    const now = Date.now();
    if (now - this.data.lastDailyRewardTime >= 24 * 60 * 60 * 1000) {
      this.data.lastDailyRewardTime = now;
      this.addCoins(GAME_CONFIG.DAILY_REWARD_AMOUNT);
      return true;
    }
    return false;
  },

  getDailyRewardTimeLeft() {
    const remaining = 24 * 60 * 60 * 1000 - (Date.now() - this.data.lastDailyRewardTime);
    return remaining > 0 ? remaining : 0;
  },
};
