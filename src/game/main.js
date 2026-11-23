import { GAME_CONFIG } from './config.js';
import { storage } from './storage.js';
import { audio } from './audio.js';
import { particles } from './particles.js';
import { Background } from './background.js';
import { Bird, PipeSpawner } from './entities.js';
import { InputManager } from './input.js';
import { UIManager } from './ui.js';
import { getSkinById } from './birdRenderer.js';
import {
  advanceFixedTimestep,
  checkGroundCollision,
  evaluateCombo,
} from './physics.js';

export const GameState = {
  MENU: 'MENU',
  READY: 'READY',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAMEOVER: 'GAMEOVER',
  CONTINUE: 'CONTINUE',
};

export class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

    this.state = GameState.MENU;
    this.score = 0;
    this.coinsEarned = 0;
    this.comboCount = 0;
    this.lastPipeTime = 0;
    this.maxComboThisRun = 0;
    this.continuesUsed = 0;
    this._runFinalized = false;
    this.continueTimer = 0;
    this.continueInterval = null;

    this.lastFrameTime = performance.now();
    this.accumulator = 0;
    this.hitstopTimer = 0;

    this.initCanvasResolution();
    storage.load();

    this.background = new Background();
    this.pipeSpawner = new PipeSpawner();
    this.bird = new Bird();
    this.input = new InputManager(this.canvas);
    this.ui = new UIManager(this);

    this.input.onJump(() => this.handleJumpInput());
    this.input.onPause(() => this.togglePause());
    this.input.onAnyKey(() => this.handleAnyKey());

    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      const loadingScreen = document.getElementById('loading-screen');
      if (loadingScreen) loadingScreen.style.display = 'none';
      this.startReady();
      this.startGame();
    } else {
      this.quitToMenu();
    }

    this.lastFrameTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  initCanvasResolution() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = GAME_CONFIG.CANVAS_WIDTH * dpr;
    this.canvas.height = GAME_CONFIG.CANVAS_HEIGHT * dpr;
    this.canvas.style.width = `${GAME_CONFIG.CANVAS_WIDTH}px`;
    this.canvas.style.height = `${GAME_CONFIG.CANVAS_HEIGHT}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  handleJumpInput() {
    if (this.state === GameState.MENU) {
      if (!this.ui.hasBlockingModalOpen()) {
        audio.init();
        this.startReady();
      }
    } else if (this.state === GameState.READY) {
      this.startGame();
    } else if (this.state === GameState.PLAYING) {
      this.bird.jump();
      audio.playJump();
    }
  }

  handleAnyKey() {
    if (this.state === GameState.MENU && !this.ui.hasBlockingModalOpen()) {
      audio.init();
    }
  }

  startReady() {
    this._cancelContinueTimer();
    this.state = GameState.READY;
    this.score = 0;
    this.coinsEarned = 0;
    this.comboCount = 0;
    this.maxComboThisRun = 0;
    this.continuesUsed = 0;
    this._runFinalized = false;
    this.lastPipeTime = 0;
    this.hitstopTimer = 0;
    this.accumulator = 0;

    this.bird.reset();
    this.pipeSpawner.reset();
    particles.clear();
    this.input.clearInputs();

    this.ui.setHUDScore(0);
    this.ui.setHUDCoins(storage.data.coins);
    this.ui.hideCombo();
    this.ui.showScreen('ready');
  }

  startGame() {
    this.state = GameState.PLAYING;
    this.bird.jump();
    audio.playJump();
    audio.startMusic();
    this.ui.showScreen('playing');
  }

  togglePause() {
    if (this.state === GameState.PLAYING) {
      this.state = GameState.PAUSED;
      audio.stopMusic();
      this.ui.showScreen('pause');
    } else if (this.state === GameState.PAUSED) {
      this.resumeGame();
    }
  }

  resumeGame() {
    this.state = GameState.PLAYING;
    this.lastFrameTime = performance.now();
    this.accumulator = 0;
    this.input.clearInputs();
    audio.startMusic();
    this.ui.showScreen('playing');
  }

  quitToMenu() {
    this._cancelContinueTimer();
    this.state = GameState.MENU;
    this.hitstopTimer = 0;
    this.accumulator = 0;
    audio.stopMusic();
    this.bird.reset();
    this.pipeSpawner.reset();
    particles.clear();
    this.input.clearInputs();
    this.ui.hideCombo();
    this.ui.showScreen('menu');
  }

  incrementScore() {
    this.score += 1;
    this.ui.setHUDScore(this.score);
    audio.playScore();

    const now = performance.now();
    const combo = evaluateCombo(now, this.lastPipeTime, this.comboCount, GAME_CONFIG.COMBO);
    this.comboCount = combo.comboCount;
    this.lastPipeTime = now;
    if (this.comboCount > this.maxComboThisRun) {
      this.maxComboThisRun = this.comboCount;
    }

    if (combo.coinBonus > 0) {
      storage.addCoins(combo.coinBonus);
      this.coinsEarned += combo.coinBonus;
      this.ui.setHUDCoins(storage.data.coins);
    }

    if (this.comboCount >= 2) {
      this.ui.showCombo(this.comboCount, combo.multiplier);
    } else {
      this.ui.hideCombo();
    }

    storage.checkAchievements(this.score, this.maxComboThisRun, (ach) => {
      this.ui.showToast(`Achievement: ${ach.name}! (+${ach.reward} coins)`, 'success');
      this.ui.setHUDCoins(storage.data.coins);
    });
  }

  collectCoin(x, y) {
    storage.addCoins(1);
    this.coinsEarned += 1;
    this.ui.setHUDCoins(storage.data.coins);
    particles.spawnStars(x, y);
    audio.playScore();

    storage.checkAchievements(this.score, this.maxComboThisRun, (ach) => {
      this.ui.showToast(`Achievement: ${ach.name}! (+${ach.reward} coins)`, 'success');
      this.ui.setHUDCoins(storage.data.coins);
    });
  }

  handleCollision() {
    if (this.state === GameState.GAMEOVER || this.state === GameState.CONTINUE) return;

    this.bird.isDead = true;
    this.state = GameState.GAMEOVER;
    this.comboCount = 0;
    this.hitstopTimer = GAME_CONFIG.HITSTOP_SEC;
    this.ui.hideCombo();

    audio.stopMusic();
    audio.playHit();
    particles.triggerShake(0.95, 14);
    particles.triggerFlash(0.55);

    const skin = getSkinById(storage.data.selectedSkin);
    particles.spawnFeathers(this.bird.x, this.bird.y, skin.color, skin.accent);

    setTimeout(() => audio.playDie(), 140);

    if (this.score > storage.data.highScore) {
      storage.data.highScore = this.score;
      this.ui.showToast('New High Score!', 'success');
    }

    storage.updateMaxCombo(this.maxComboThisRun);
    storage.save();

    setTimeout(() => {
      if (this.state === GameState.GAMEOVER) {
        if (this.continuesUsed < GAME_CONFIG.MAX_CONTINUES && this.score >= 3) {
          this._startContinueCountdown();
        } else {
          this._finalizeAndShowGameOver();
        }
      }
    }, 750);
  }

  _finalizeAndShowGameOver() {
    if (!this._runFinalized) {
      this._runFinalized = true;
      storage.incrementGamesPlayed();
      storage.checkAchievements(this.score, this.maxComboThisRun, (ach) => {
        this.ui.showToast(`Achievement: ${ach.name}! (+${ach.reward} coins)`, 'success');
      });
      storage.addLeaderboardEntry(this.score, storage.data.selectedSkin);
      storage.save();
    }
    this.ui.showGameOver(this.score, this.coinsEarned);
  }

  _startContinueCountdown() {
    this.state = GameState.CONTINUE;
    this.continueTimer = GAME_CONFIG.CONTINUE_COUNTDOWN_SEC;
    this.ui.showContinueScreen(this.continueTimer);
    this._cancelContinueTimer();
    this.continueInterval = setInterval(() => {
      this.continueTimer -= 1;
      this.ui.updateContinueTimer(this.continueTimer);
      if (this.continueTimer <= 0) {
        this._cancelContinueTimer();
        this._finalizeAndShowGameOver();
      }
    }, 1000);
  }

  pauseContinueTimer() {
    this._cancelContinueTimer();
  }

  _cancelContinueTimer() {
    if (this.continueInterval) {
      clearInterval(this.continueInterval);
      this.continueInterval = null;
    }
  }

  doRevive() {
    this._cancelContinueTimer();
    this.continuesUsed += 1;
    this.bird.isDead = false;
    this.bird.y = GAME_CONFIG.CANVAS_HEIGHT / 2 - 50;
    this.bird.velocity = GAME_CONFIG.JUMP_VELOCITY;
    this.bird.rotation = 0;
    this.bird.invulnTimer = GAME_CONFIG.REVIVE_INVULN_SEC;
    this.pipeSpawner.clearNearX(this.bird.x, GAME_CONFIG.REVIVE_CLEARANCE_PX);

    this.state = GameState.PLAYING;
    this.accumulator = 0;
    audio.startMusic();
    this.ui.showScreen('playing');
    this.ui.showToast('Revived! Keep flying!', 'success');
    storage.addCoins(20);
    this.ui.setHUDCoins(storage.data.coins);
  }

  skipContinue() {
    this._cancelContinueTimer();
    this._finalizeAndShowGameOver();
  }

  loop(nowMs) {
    const rawDt = (nowMs - this.lastFrameTime) / 1000;
    this.lastFrameTime = nowMs;

    const stepInfo = advanceFixedTimestep(this.accumulator, rawDt);
    this.accumulator = stepInfo.accumulator;

    // Render-level FX (camera trauma shake, hit flash, hero menu bob) tick in real clamped dt
    if (this.state !== GameState.PAUSED) {
      particles.update(stepInfo.clampedDt);
    }
    this.ui.drawMenuHeroBird(stepInfo.clampedDt);

    if (this.hitstopTimer > 0) {
      this.hitstopTimer = Math.max(0, this.hitstopTimer - stepInfo.clampedDt);
    } else {
      for (let i = 0; i < stepInfo.steps; i++) {
        this.stepSimulation(GAME_CONFIG.FIXED_DT);
      }
    }

    this.draw();
    requestAnimationFrame((t) => this.loop(t));
  }

  stepSimulation(dt) {
    const isPlaying = this.state === GameState.PLAYING;
    const isFallingAfterCrash = this.state === GameState.GAMEOVER || this.state === GameState.CONTINUE;
    const diffKey = storage.data.selectedDifficulty || 'normal';
    const diff = GAME_CONFIG.DIFFICULTIES[diffKey] || GAME_CONFIG.DIFFICULTIES.normal;

    const isScrolling = isPlaying || this.state === GameState.MENU || this.state === GameState.READY;
    this.background.update(diff.pipeSpeed, dt, isScrolling);

    if (this.state !== GameState.PAUSED) {
      this.bird.update(dt, isPlaying || isFallingAfterCrash);
    }

    if (isPlaying) {
      this.pipeSpawner.update(dt, true);
      const hitPipe = this.pipeSpawner.checkCollision(
        this.bird,
        () => this.incrementScore(),
        (x, y) => this.collectCoin(x, y)
      );
      const hitGround = checkGroundCollision(this.bird.y, this.bird.radius, GAME_CONFIG);
      if (hitPipe || hitGround) {
        this.handleCollision();
      }
    }

    if (isFallingAfterCrash && checkGroundCollision(this.bird.y, this.bird.radius, GAME_CONFIG)) {
      this.bird.y = GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.GROUND_HEIGHT - this.bird.radius;
      this.bird.velocity = 0;
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);
    const theme = GAME_CONFIG.THEMES[storage.data.selectedTheme] || GAME_CONFIG.THEMES.day;

    const didShake = particles.applyShake(this.ctx);
    this.background.draw(this.ctx, theme);
    this.pipeSpawner.draw(this.ctx, theme);
    if (this.state !== GameState.MENU) {
      this.bird.draw(this.ctx);
    }
    particles.draw(this.ctx);
    this.background.drawGround(this.ctx, theme);
    particles.restoreShake(this.ctx, didShake);
    particles.drawFlash(this.ctx, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);
  }
}

const initGame = () => {
  if (!window.game) {
    window.game = new Game();
  }
};

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}
