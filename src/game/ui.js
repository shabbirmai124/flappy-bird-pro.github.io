import { GAME_CONFIG } from './config.js';
import { storage } from './storage.js';
import { audio } from './audio.js';
import { drawProfessionalBird } from './birdRenderer.js';
import { evaluateMedal } from './physics.js';

export class UIManager {
  constructor(game) {
    this.game = game;

    this.hud = document.getElementById('hud');
    this.hudScore = document.getElementById('hud-score');
    this.hudCoins = document.getElementById('hud-coins');
    this.comboIndicator = document.getElementById('combo-indicator');

    this.menuScreen = document.getElementById('menu-screen');
    this.readyScreen = document.getElementById('ready-screen');
    this.pauseScreen = document.getElementById('pause-screen');
    this.gameoverScreen = document.getElementById('gameover-screen');
    this.continueScreen = document.getElementById('continue-screen');

    this.shopModal = document.getElementById('shop-modal');
    this.achievementsModal = document.getElementById('achievements-modal');
    this.settingsModal = document.getElementById('settings-modal');
    this.leaderboardModal = document.getElementById('leaderboard-modal');
    this.checkoutModal = document.getElementById('checkout-modal');
    this.paymentOverlay = document.getElementById('payment-overlay');
    this.adOverlay = document.getElementById('ad-overlay');

    this.goScore = document.getElementById('go-score');
    this.goBest = document.getElementById('go-best');
    this.goCoins = document.getElementById('go-coins');
    this.goMedal = document.getElementById('go-medal');

    this.menuCoins = document.getElementById('menu-coins');
    this.menuBest = document.getElementById('menu-best');
    this.dailyBtn = document.getElementById('daily-reward-btn');
    this.continueTimerEl = document.getElementById('continue-timer');
    this.heroCanvas = document.getElementById('menu-hero-bird');

    this.selectedBundle = null;
    this.currentPaymentMethod = 'card';
    this._resetArmTimer = null;
    this._adInterval = null;
    this._heroTime = 0;

    this.bindEvents();
  }

  hasBlockingModalOpen() {
    return [
      this.shopModal,
      this.achievementsModal,
      this.settingsModal,
      this.leaderboardModal,
      this.checkoutModal,
      this.paymentOverlay,
      this.adOverlay,
    ].some((el) => el && !el.classList.contains('hidden'));
  }

  bindEvents() {
    document.getElementById('play-btn').addEventListener('click', (e) => {
      e.currentTarget.blur();
      audio.playClick();
      this.game.startReady();
    });

    document.getElementById('shop-btn').addEventListener('click', () => {
      audio.playClick();
      this.openShop();
    });

    document.getElementById('achievements-btn').addEventListener('click', () => {
      audio.playClick();
      this.openAchievements();
    });

    document.getElementById('settings-btn').addEventListener('click', () => {
      audio.playClick();
      this.openSettings();
    });

    document.getElementById('leaderboard-btn').addEventListener('click', () => {
      audio.playClick();
      this.openLeaderboard();
    });

    document.getElementById('watch-ad-coins-btn').addEventListener('click', () => {
      audio.playClick();
      this._handleWatchAdForCoins();
    });

    this.dailyBtn.addEventListener('click', () => this.claimDailyReward());

    document.getElementById('close-shop').addEventListener('click', () => {
      audio.playClick();
      this.shopModal.classList.add('hidden');
    });

    document.getElementById('close-achievements').addEventListener('click', () => {
      audio.playClick();
      this.achievementsModal.classList.add('hidden');
    });

    document.getElementById('close-settings').addEventListener('click', () => {
      audio.playClick();
      this._disarmResetButton();
      this.settingsModal.classList.add('hidden');
    });

    document.getElementById('close-leaderboard').addEventListener('click', () => {
      audio.playClick();
      this.leaderboardModal.classList.add('hidden');
    });

    const soundToggle = document.getElementById('sound-toggle');
    const musicToggle = document.getElementById('music-toggle');

    soundToggle.addEventListener('change', (e) => {
      storage.data.soundEnabled = e.target.checked;
      storage.save();
      audio.playClick();
    });

    musicToggle.addEventListener('change', (e) => {
      storage.data.musicEnabled = e.target.checked;
      storage.save();
      audio.toggleMusic(e.target.checked);
      audio.playClick();
    });

    const resetBtn = document.getElementById('reset-data-btn');
    resetBtn.addEventListener('click', () => {
      if (resetBtn.dataset.armed !== 'true') {
        resetBtn.dataset.armed = 'true';
        resetBtn.textContent = 'Click Again to Confirm Reset';
        clearTimeout(this._resetArmTimer);
        this._resetArmTimer = setTimeout(() => this._disarmResetButton(), 3000);
        return;
      }

      this._disarmResetButton();
      storage.reset();
      audio.playClick();
      this.updateStats();
      soundToggle.checked = storage.data.soundEnabled;
      musicToggle.checked = storage.data.musicEnabled;
      document.querySelectorAll('.theme-btn').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.theme === storage.data.selectedTheme);
      });
      document.querySelectorAll('.diff-btn').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.diff === storage.data.selectedDifficulty);
      });
      this.showToast('Game progress reset!', 'info');
      this.settingsModal.classList.add('hidden');
    });

    document.querySelectorAll('.theme-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const themeKey = e.currentTarget.dataset.theme;
        storage.data.selectedTheme = themeKey;
        storage.save();
        audio.playClick();
        document.querySelectorAll('.theme-btn').forEach((b) => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.showToast(`Theme: ${GAME_CONFIG.THEMES[themeKey].name}`, 'info');
      });
    });

    document.querySelectorAll('.diff-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const diffKey = e.currentTarget.dataset.diff;
        storage.data.selectedDifficulty = diffKey;
        storage.save();
        audio.playClick();
        document.querySelectorAll('.diff-btn').forEach((b) => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.showToast(`Difficulty: ${GAME_CONFIG.DIFFICULTIES[diffKey].name}`, 'info');
      });
    });

    document.getElementById('restart-btn').addEventListener('click', (e) => {
      e.currentTarget.blur();
      audio.playClick();
      this.game.startReady();
    });

    document.getElementById('quit-btn').addEventListener('click', () => {
      audio.playClick();
      this.game.quitToMenu();
    });

    document.getElementById('share-btn').addEventListener('click', () => {
      audio.playClick();
      this._handleShareScore();
    });

    document.getElementById('resume-btn').addEventListener('click', (e) => {
      e.currentTarget.blur();
      audio.playClick();
      this.game.resumeGame();
    });

    document.getElementById('pause-quit-btn').addEventListener('click', () => {
      audio.playClick();
      this.game.quitToMenu();
    });

    document.getElementById('continue-watch-btn').addEventListener('click', () => {
      audio.playClick();
      this.game.pauseContinueTimer();
      this._simulateWatchAd(() => this.game.doRevive());
    });

    document.getElementById('continue-skip-btn').addEventListener('click', () => {
      audio.playClick();
      this.game.skipContinue();
    });

    document.getElementById('close-checkout').addEventListener('click', () => {
      audio.playClick();
      this.checkoutModal.classList.add('hidden');
      this.shopModal.classList.remove('hidden');
    });

    document.querySelectorAll('.pay-tab-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        audio.playClick();
        this.switchPaymentTab(e.currentTarget.dataset.method);
      });
    });

    document.getElementById('pay-now-btn').addEventListener('click', () => {
      audio.playScore();
      this.processPayment();
    });
  }

  _disarmResetButton() {
    clearTimeout(this._resetArmTimer);
    const resetBtn = document.getElementById('reset-data-btn');
    if (resetBtn) {
      resetBtn.dataset.armed = 'false';
      resetBtn.textContent = 'Reset Progress';
    }
  }

  drawMenuHeroBird(dt) {
    if (!this.heroCanvas || this.menuScreen.classList.contains('hidden')) return;
    const ctx = this.heroCanvas.getContext('2d');
    if (!ctx) return;

    this._heroTime += dt;
    const w = this.heroCanvas.width;
    const h = this.heroCanvas.height;
    ctx.clearRect(0, 0, w, h);

    const bob = Math.sin(this._heroTime * 3.8) * 4;
    drawProfessionalBird(ctx, {
      x: w / 2 - 2,
      y: h / 2 + bob,
      scale: 1.55,
      rotation: Math.cos(this._heroTime * 3.8) * 0.06,
      velocity: Math.cos(this._heroTime * 3.8) * 28,
      wingPhase: this._heroTime * 11,
      wingImpulse: Math.max(0, Math.sin(this._heroTime * 3.8)) * 0.25,
      beakOpen: 0,
      isDead: false,
      skinId: storage.data.selectedSkin,
      themeId: storage.data.selectedTheme,
      timeSec: this._heroTime,
      showShadow: true,
    });
  }

  updateStats() {
    this.menuCoins.textContent = storage.data.coins;
    this.menuBest.textContent = storage.data.highScore;
    this.hudCoins.textContent = storage.data.coins;

    const timeLeft = storage.getDailyRewardTimeLeft();
    if (timeLeft === 0) {
      this.dailyBtn.classList.remove('disabled');
      this.dailyBtn.textContent = `Claim Daily Reward (+${GAME_CONFIG.DAILY_REWARD_AMOUNT} coins)`;
    } else {
      this.dailyBtn.classList.add('disabled');
      const hrs = Math.floor(timeLeft / 3600000);
      const mins = Math.floor((timeLeft % 3600000) / 60000);
      this.dailyBtn.textContent = `Next Reward in ${hrs}h ${mins}m`;
    }
  }

  claimDailyReward() {
    audio.playClick();
    if (storage.claimDailyReward()) {
      this.updateStats();
      this.showToast(`Daily reward claimed! +${GAME_CONFIG.DAILY_REWARD_AMOUNT} Coins`, 'success');
      audio.playScore();
    } else {
      this.showToast('Daily reward not ready yet.', 'warning');
    }
  }

  setHUDScore(score) {
    this.hudScore.textContent = String(Math.round(score));
  }

  setHUDCoins(coins) {
    this.hudCoins.textContent = String(Math.round(coins));
  }

  showCombo(comboCount) {
    if (!this.comboIndicator) return;
    this.comboIndicator.classList.remove('hidden');
    this.comboIndicator.innerHTML = `<span class="combo-x">${comboCount}x</span><span class="combo-label">COMBO</span>`;
    this.comboIndicator.className = `combo-indicator combo-level-${Math.min(comboCount, 3)}`;
    this.comboIndicator.style.animation = 'none';
    void this.comboIndicator.offsetHeight;
    this.comboIndicator.style.animation = '';
  }

  hideCombo() {
    if (this.comboIndicator) {
      this.comboIndicator.classList.add('hidden');
    }
  }

  showScreen(screenName) {
    this.menuScreen.classList.add('hidden');
    this.readyScreen.classList.add('hidden');
    this.pauseScreen.classList.add('hidden');
    this.gameoverScreen.classList.add('hidden');
    this.continueScreen.classList.add('hidden');
    this.hud.classList.add('hidden');
    this.shopModal.classList.add('hidden');
    this.achievementsModal.classList.add('hidden');
    this.settingsModal.classList.add('hidden');
    this.leaderboardModal.classList.add('hidden');

    if (screenName === 'menu') {
      this.menuScreen.classList.remove('hidden');
      this.updateStats();
      document.body.dataset.state = 'title';
    } else if (screenName === 'ready') {
      this.readyScreen.classList.remove('hidden');
      this.hud.classList.remove('hidden');
      document.body.dataset.state = 'ready';
    } else if (screenName === 'playing') {
      this.hud.classList.remove('hidden');
      document.body.dataset.state = 'playing';
    } else if (screenName === 'pause') {
      this.pauseScreen.classList.remove('hidden');
      this.hud.classList.remove('hidden');
      document.body.dataset.state = 'paused';
    } else if (screenName === 'gameover') {
      this.gameoverScreen.classList.remove('hidden');
      document.body.dataset.state = 'gameover';
    }
  }

  showContinueScreen(seconds) {
    this.menuScreen.classList.add('hidden');
    this.readyScreen.classList.add('hidden');
    this.pauseScreen.classList.add('hidden');
    this.gameoverScreen.classList.add('hidden');
    this.hud.classList.add('hidden');
    this.continueScreen.classList.remove('hidden');
    document.body.dataset.state = 'continue';
    if (this.continueTimerEl) {
      this.continueTimerEl.textContent = String(seconds);
      this._updateContinueRing(seconds);
    }
  }

  updateContinueTimer(seconds) {
    if (this.continueTimerEl) {
      this.continueTimerEl.textContent = String(seconds);
      this._updateContinueRing(seconds);
    }
  }

  _updateContinueRing(seconds) {
    const ring = document.getElementById('continue-ring');
    if (!ring) return;
    const ratio = seconds / GAME_CONFIG.CONTINUE_COUNTDOWN_SEC;
    const circumference = 2 * Math.PI * 40;
    ring.style.strokeDashoffset = String(circumference * (1 - ratio));
  }

  showGameOver(score, coinsEarned) {
    this.continueScreen.classList.add('hidden');
    this._animateNumber(this.goScore, 0, score, 650);
    this.goBest.textContent = String(storage.data.highScore);
    this.goCoins.textContent = `+${coinsEarned}`;

    const medal = evaluateMedal(score);
    this.goMedal.className = `medal-badge ${medal.tier}`;
    this.goMedal.textContent = medal.label;

    this.showScreen('gameover');
  }

  _animateNumber(el, start, end, durationMs) {
    const startTime = performance.now();
    const step = (now) => {
      const progress = Math.min((now - startTime) / durationMs, 1);
      el.textContent = String(Math.round(start + (end - start) * progress));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  openLeaderboard() {
    const list = document.getElementById('leaderboard-list');
    list.innerHTML = '';
    const entries = storage.data.leaderboard || [];
    if (entries.length === 0) {
      list.innerHTML = '<p class="empty-message">No scores yet. Start playing!</p>';
    } else {
      entries.forEach((entry, idx) => {
        const row = document.createElement('div');
        row.className = `lb-row ${idx === 0 ? 'lb-top' : ''}`;
        row.innerHTML = `
          <span class="lb-rank">#${idx + 1}</span>
          <span class="lb-score">${entry.score}</span>
          <span class="lb-date">${entry.date}</span>
        `;
        list.appendChild(row);
      });
    }
    this.leaderboardModal.classList.remove('hidden');
  }

  openShop() {
    const shopList = document.getElementById('shop-list');
    shopList.innerHTML = '';

    const iapTitle = document.createElement('h3');
    iapTitle.className = 'shop-section-title';
    iapTitle.textContent = 'BUY COINS (IAP)';
    shopList.appendChild(iapTitle);

    const bundlesWrap = document.createElement('div');
    bundlesWrap.className = 'iap-bundles-container';
    GAME_CONFIG.COIN_BUNDLES.forEach((bundle) => {
      const card = document.createElement('div');
      card.className = 'iap-card';
      card.innerHTML = `
        <div class="iap-badge-pill">${bundle.badge}</div>
        <div class="iap-details">
          <div class="iap-coins-row">
            <span class="iap-coins-text">+${bundle.coins} Coins</span>
          </div>
          <span class="iap-name">${bundle.name}</span>
        </div>
        <button class="btn btn-iap-buy" data-id="${bundle.id}" data-price="${bundle.price}" data-coins="${bundle.coins}" data-name="${bundle.name}" data-badge="${bundle.badge}">
          ${bundle.price}
        </button>
      `;
      bundlesWrap.appendChild(card);
    });
    shopList.appendChild(bundlesWrap);

    const skinsTitle = document.createElement('h3');
    skinsTitle.className = 'shop-section-title';
    skinsTitle.textContent = 'BIRD SKINS';
    shopList.appendChild(skinsTitle);

    GAME_CONFIG.SKINS.forEach((skin) => {
      const card = document.createElement('div');
      card.className = 'shop-card';
      const unlocked = storage.data.unlockedSkins.includes(skin.id);
      const selected = storage.data.selectedSkin === skin.id;

      let actionBtn = '';
      if (selected) {
        actionBtn = '<button class="btn btn-shop select-btn active" disabled>ON</button>';
      } else if (unlocked) {
        actionBtn = `<button class="btn btn-shop select-btn" data-id="${skin.id}">EQUIP</button>`;
      } else {
        const canAfford = storage.data.coins >= skin.cost;
        actionBtn = `<button class="btn btn-shop buy-btn ${canAfford ? '' : 'disabled'}" data-id="${skin.id}" data-cost="${skin.cost}">Cost: ${skin.cost}</button>`;
      }

      const isNew = skin.id === 'shadow' || skin.id === 'electric';
      card.innerHTML = `
        <canvas id="canvas-preview-${skin.id}" width="52" height="52" class="skin-preview"></canvas>
        <div class="shop-details">
          <h3>${skin.name}${isNew ? ' <span class="new-badge">NEW</span>' : ''}</h3>
          <p>${skin.desc}</p>
        </div>
        <div class="shop-actions">${actionBtn}</div>
      `;
      shopList.appendChild(card);

      const previewCanvas = card.querySelector(`#canvas-preview-${skin.id}`);
      if (previewCanvas) {
        const pCtx = previewCanvas.getContext('2d');
        if (pCtx) {
          drawProfessionalBird(pCtx, {
            x: 26,
            y: 27,
            scale: 0.92,
            rotation: -0.08,
            wingPhase: 0.9,
            wingImpulse: 0.3,
            skinId: skin.id,
            themeId: 'day',
            timeSec: 1.2,
            showShadow: false,
          });
        }
      }
    });

    shopList.querySelectorAll('.select-btn').forEach((btn) => {
      if (btn.disabled) return;
      btn.addEventListener('click', (e) => {
        const skinId = e.currentTarget.dataset.id;
        storage.data.selectedSkin = skinId;
        storage.save();
        audio.playClick();
        this.openShop();
        const skin = GAME_CONFIG.SKINS.find((s) => s.id === skinId);
        this.showToast(`Equipped: ${skin ? skin.name : skinId}`, 'success');
      });
    });

    shopList.querySelectorAll('.buy-btn').forEach((btn) => {
      if (btn.classList.contains('disabled')) return;
      btn.addEventListener('click', (e) => {
        const skinId = e.currentTarget.dataset.id;
        const cost = parseInt(e.currentTarget.dataset.cost, 10);
        if (storage.data.coins >= cost) {
          storage.data.coins -= cost;
          storage.data.unlockedSkins.push(skinId);
          storage.data.selectedSkin = skinId;
          storage.save();
          audio.playScore();
          this.openShop();
          this.updateStats();
          const skin = GAME_CONFIG.SKINS.find((s) => s.id === skinId);
          this.showToast(`Unlocked: ${skin ? skin.name : skinId}!`, 'success');
        }
      });
    });

    shopList.querySelectorAll('.btn-iap-buy').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        audio.playClick();
        const d = e.currentTarget.dataset;
        this.openCheckout({
          id: d.id,
          name: d.name,
          coins: parseInt(d.coins, 10),
          price: d.price,
          badge: d.badge,
        });
      });
    });

    this.shopModal.classList.remove('hidden');
  }

  openAchievements() {
    const list = document.getElementById('achievements-list');
    list.innerHTML = '';
    GAME_CONFIG.ACHIEVEMENTS.forEach((ach) => {
      const done = storage.data.completedAchievements.includes(ach.id);
      const item = document.createElement('div');
      item.className = `achievement-item ${done ? 'completed' : ''}`;
      item.innerHTML = `
        <div class="ach-icon ${done ? 'unlocked' : 'locked'}"></div>
        <div class="ach-details">
          <h3>${ach.name}</h3>
          <p>${ach.desc}</p>
        </div>
        <div class="ach-reward">
          <span>+${ach.reward}</span>
        </div>
      `;
      list.appendChild(item);
    });
    this.achievementsModal.classList.remove('hidden');
  }

  openSettings() {
    this._disarmResetButton();
    document.getElementById('sound-toggle').checked = storage.data.soundEnabled;
    document.getElementById('music-toggle').checked = storage.data.musicEnabled;

    const themeKey = storage.data.selectedTheme;
    document.querySelectorAll('.theme-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.theme === themeKey);
    });

    const diffKey = storage.data.selectedDifficulty || 'normal';
    document.querySelectorAll('.diff-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.diff === diffKey);
    });

    this.settingsModal.classList.remove('hidden');
  }

  _handleShareScore() {
    const scoreVal = parseInt(this.goScore.textContent, 10) || 0;
    const msg = `I scored ${scoreVal} points in Flappy Bird PRO! Can you beat me?`;
    if (navigator.share) {
      navigator.share({ title: 'Flappy Bird PRO', text: msg, url: window.location.href }).catch(() => {});
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(msg)
        .then(() => this.showToast('Score copied to clipboard!', 'success'))
        .catch(() => this.showToast(msg, 'info'));
    } else {
      this.showToast(msg, 'info');
    }
  }

  _handleWatchAdForCoins() {
    this._simulateWatchAd(() => {
      storage.addCoins(50);
      this.updateStats();
      this.showToast('+50 Coins! Thanks for watching!', 'success');
      audio.playScore();
    });
  }

  _simulateWatchAd(onDone) {
    this.showToast('Ad playing... please wait', 'info');
    if (this.adOverlay) {
      this.adOverlay.classList.remove('hidden');
      const fill = document.getElementById('ad-progress-fill');
      if (fill) {
        fill.style.animation = 'none';
        void fill.offsetWidth;
        fill.style.animation = '5s linear forwards adFill';
      }
      let remaining = 5;
      const countdownEl = document.getElementById('ad-countdown');
      if (countdownEl) countdownEl.textContent = String(remaining);

      clearInterval(this._adInterval);
      this._adInterval = setInterval(() => {
        remaining -= 1;
        if (countdownEl) countdownEl.textContent = String(Math.max(0, remaining));
        if (remaining <= 0) {
          clearInterval(this._adInterval);
          this.adOverlay.classList.add('hidden');
          onDone();
        }
      }, 1000);
    } else {
      setTimeout(onDone, 1500);
    }
  }

  openCheckout(bundle) {
    this.selectedBundle = bundle;
    document.getElementById('checkout-item-title').textContent = bundle.name;
    document.getElementById('checkout-item-badge').textContent = bundle.badge;
    document.getElementById('checkout-item-coins').textContent = `+${bundle.coins} Coins`;
    document.getElementById('checkout-item-price').textContent = bundle.price;
    const ppSummary = document.getElementById('paypal-summary-amount');
    if (ppSummary) ppSummary.textContent = bundle.price;
    document.getElementById('pay-now-btn').textContent = `PAY NOW (${bundle.price})`;
    this.switchPaymentTab('card');
    this.checkoutModal.classList.remove('hidden');
    this.shopModal.classList.add('hidden');
  }

  switchPaymentTab(method) {
    document.querySelectorAll('.pay-tab-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.method === method);
    });
    document.querySelectorAll('.payment-form-box').forEach((box) => box.classList.add('hidden'));
    const activeBox = document.getElementById(`pay-form-${method}`);
    if (activeBox) activeBox.classList.remove('hidden');
    this.currentPaymentMethod = method;
  }

  processPayment() {
    if (!this.selectedBundle) return;
    const overlay = this.paymentOverlay;
    const spinner = document.getElementById('payment-spinner');
    const successEl = document.getElementById('payment-success-icon');
    const titleEl = document.getElementById('payment-status-title');
    const subEl = document.getElementById('payment-status-sub');

    overlay.classList.remove('hidden');
    spinner.classList.remove('hidden');
    successEl.classList.add('hidden');
    titleEl.textContent = 'Processing Secure Payment';
    subEl.textContent = 'Connecting to banking servers...';

    setTimeout(() => {
      subEl.textContent = 'Verifying account funds...';
    }, 700);

    setTimeout(() => {
      subEl.textContent = 'Finalizing coin bundle order...';
    }, 1350);

    setTimeout(() => {
      spinner.classList.add('hidden');
      successEl.classList.remove('hidden');
      titleEl.textContent = 'Payment Successful!';
      subEl.textContent = `Credited +${this.selectedBundle.coins} Coins!`;
      audio.playScore();
      storage.addCoins(parseInt(this.selectedBundle.coins, 10));
      this.updateStats();
      this.showToast(`Successfully purchased ${this.selectedBundle.name}!`, 'success');

      setTimeout(() => {
        overlay.classList.add('hidden');
        this.checkoutModal.classList.add('hidden');
        this.openShop();
      }, 1400);
    }, 2000);
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 450);
    }, 2400);
  }
}
