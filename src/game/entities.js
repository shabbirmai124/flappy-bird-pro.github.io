import { GAME_CONFIG } from './config.js';
import { storage } from './storage.js';
import { particles } from './particles.js';
import { drawProfessionalBird, getSkinById } from './birdRenderer.js';
import {
  applyFlapImpulse,
  checkCoinPickup,
  checkPipeCollision,
  computeNextPipeTopHeight,
  stepBirdKinematics,
} from './physics.js';

export class Bird {
  constructor() {
    this.radius = GAME_CONFIG.BIRD_RADIUS;
    this.reset();
  }

  reset() {
    this.x = GAME_CONFIG.BIRD_START_X;
    this.y = GAME_CONFIG.CANVAS_HEIGHT / 2 - 30;
    this.velocity = 0;
    this.rotation = 0;
    this.scaleX = 1;
    this.scaleY = 1;
    this.scaleVel = 0;
    this.wingPhase = 0;
    this.wingImpulse = 0;
    this.beakOpen = 0;
    this.idleTime = 0;
    this.timeSec = 0;
    this.trailTimer = 0;
    this.invulnTimer = 0;
    this.isDead = false;
  }

  jump() {
    if (this.isDead) return;
    const next = applyFlapImpulse(this, GAME_CONFIG);
    this.velocity = next.velocity;
    this.scaleX = next.scaleX;
    this.scaleY = next.scaleY;
    this.scaleVel = next.scaleVel;
    this.wingImpulse = next.wingImpulse;
    this.beakOpen = next.beakOpen;
    particles.spawnJumpDust(this.x - 14, this.y + 5);
  }

  update(dt, isSimulating) {
    this.timeSec += dt;
    if (this.invulnTimer > 0) {
      this.invulnTimer = Math.max(0, this.invulnTimer - dt);
    }

    if (!isSimulating) {
      this.idleTime += dt;
      this.y = GAME_CONFIG.CANVAS_HEIGHT / 2 - 30 + Math.sin(this.idleTime * 4.6) * 7;
      this.rotation = Math.cos(this.idleTime * 4.6) * 0.06;
      this.wingPhase += dt * 11;
      this.scaleX = 1;
      this.scaleY = 1;
      this.scaleVel = 0;
      return;
    }

    const next = stepBirdKinematics(this, dt, GAME_CONFIG);
    this.velocity = next.velocity;
    this.y = next.y;
    this.rotation = next.rotation;
    this.scaleX = next.scaleX;
    this.scaleY = next.scaleY;
    this.scaleVel = next.scaleVel;
    this.wingPhase = next.wingPhase;
    this.wingImpulse = next.wingImpulse;
    this.beakOpen = next.beakOpen;

    // Emit skin-specific trail FX at steady rate (dt-based, framerate independent)
    if (!this.isDead) {
      const skin = getSkinById(storage.data.selectedSkin);
      this.trailTimer += dt;
      if (skin.hasTrail && this.trailTimer >= 0.025) {
        this.trailTimer = 0;
        particles.spawnRainbowTrail(this.x - 14, this.y);
      } else if (skin.hasShadowTrail && this.trailTimer >= 0.032) {
        this.trailTimer = 0;
        particles.spawnShadowTrail(this.x - 12, this.y);
      } else if (skin.hasElectric && this.trailTimer >= 0.065) {
        this.trailTimer = 0;
        particles.spawnElectricSpark(this.x - 6, this.y + (Math.random() - 0.5) * 14);
      }
    }
  }

  draw(ctx) {
    drawProfessionalBird(ctx, {
      x: this.x,
      y: this.y,
      scale: 1,
      scaleX: this.scaleX,
      scaleY: this.scaleY,
      rotation: this.rotation,
      velocity: this.velocity,
      wingPhase: this.wingPhase,
      wingImpulse: this.wingImpulse,
      beakOpen: this.beakOpen,
      isDead: this.isDead,
      skinId: storage.data.selectedSkin,
      themeId: storage.data.selectedTheme,
      timeSec: this.timeSec,
      invulnBlink: this.invulnTimer > 0,
      showShadow: true,
    });
  }
}

export class Pipe {
  constructor() {
    this.x = 0;
    this.topHeight = 0;
    this.bottomHeight = 0;
    this.width = GAME_CONFIG.PIPE_WIDTH;
    this.gap = GAME_CONFIG.DIFFICULTIES.normal.pipeGap;
    this.passed = false;
    this.active = false;
    this.coin = {
      active: false,
      y: 0,
      collected: false,
      pulse: 0,
    };
  }

  reset(x, topHeight, gap) {
    this.x = x;
    this.gap = gap;
    this.topHeight = topHeight;
    this.bottomHeight = Math.max(
      GAME_CONFIG.PIPE_MIN_HEIGHT,
      GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.GROUND_HEIGHT - this.topHeight - this.gap
    );
    this.passed = false;
    this.active = true;
    this.coin.collected = false;
    this.coin.pulse = Math.random() * Math.PI * 2;
    if (Math.random() < GAME_CONFIG.COIN_SPAWN_CHANCE) {
      this.coin.active = true;
      this.coin.y = this.topHeight + this.gap / 2;
    } else {
      this.coin.active = false;
    }
  }

  update(speedPxPerSec, dt) {
    this.x -= speedPxPerSec * dt;
    if (this.coin.active && !this.coin.collected) {
      this.coin.pulse += dt * 4.8;
    }
  }

  draw(ctx, themeObj) {
    if (!this.active) return;

    const playableH = GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.GROUND_HEIGHT;
    const bottomY = playableH - this.bottomHeight;
    const lipH = GAME_CONFIG.PIPE_LIP_HEIGHT;
    const overhang = GAME_CONFIG.PIPE_LIP_OVERHANG;

    const makePipeGrad = (x0, w) => {
      const grad = ctx.createLinearGradient(x0, 0, x0 + w, 0);
      grad.addColorStop(0, themeObj.pipeLip);
      grad.addColorStop(0.24, themeObj.pipeHighlight || themeObj.pipe);
      grad.addColorStop(0.45, themeObj.pipe);
      grad.addColorStop(0.82, themeObj.pipeLip);
      grad.addColorStop(1, '#1b2b12');
      return grad;
    };

    // Top pipe shaft + lip
    const topShaftH = Math.max(0, this.topHeight - lipH);
    ctx.save();
    ctx.fillStyle = makePipeGrad(this.x, this.width);
    ctx.strokeStyle = '#151910';
    ctx.lineWidth = 2.4;
    if (topShaftH > 0) {
      ctx.beginPath();
      ctx.rect(this.x, 0, this.width, topShaftH);
      ctx.fill();
      ctx.stroke();
    }

    ctx.fillStyle = makePipeGrad(this.x - overhang, this.width + overhang * 2);
    ctx.beginPath();
    ctx.rect(this.x - overhang, topShaftH, this.width + overhang * 2, Math.min(lipH, this.topHeight));
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Bottom pipe lip + shaft
    const bottomShaftH = Math.max(0, this.bottomHeight - lipH);
    ctx.save();
    ctx.fillStyle = makePipeGrad(this.x - overhang, this.width + overhang * 2);
    ctx.strokeStyle = '#151910';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.rect(this.x - overhang, bottomY, this.width + overhang * 2, Math.min(lipH, this.bottomHeight));
    ctx.fill();
    ctx.stroke();

    if (bottomShaftH > 0) {
      ctx.fillStyle = makePipeGrad(this.x, this.width);
      ctx.beginPath();
      ctx.rect(this.x, bottomY + lipH, this.width, bottomShaftH);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();

    // Spinning gold coin inside gap
    if (this.coin.active && !this.coin.collected) {
      ctx.save();
      const cx = this.x + this.width / 2;
      const cy = this.coin.y + Math.sin(this.coin.pulse) * 4.5;
      const spinScale = Math.max(0.22, Math.abs(Math.cos(this.coin.pulse * 0.85)));
      ctx.translate(cx, cy);
      ctx.scale(spinScale, 1);

      const coinGrad = ctx.createRadialGradient(-2, -2, 1, 0, 0, GAME_CONFIG.COIN_RADIUS);
      coinGrad.addColorStop(0, '#fffde7');
      coinGrad.addColorStop(0.35, '#ffd740');
      coinGrad.addColorStop(1, '#f57f17');

      ctx.fillStyle = coinGrad;
      ctx.strokeStyle = '#3e2723';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, 0, GAME_CONFIG.COIN_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = '#ff8f00';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.arc(0, 0, GAME_CONFIG.COIN_RADIUS - 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
}

export class PipeSpawner {
  constructor() {
    this.pipes = [];
    this.maxPipes = 5;
    this.distanceSinceSpawn = 0;
    this.lastTopHeight = null;
    this.hasSpawnedFirst = false;
    for (let i = 0; i < this.maxPipes; i++) {
      this.pipes.push(new Pipe());
    }
  }

  reset() {
    this.pipes.forEach((p) => {
      p.active = false;
      p.passed = false;
      p.coin.active = false;
      p.coin.collected = false;
    });
    this.distanceSinceSpawn = 0;
    this.lastTopHeight = null;
    this.hasSpawnedFirst = false;
  }

  clearNearX(birdX, clearancePx = GAME_CONFIG.REVIVE_CLEARANCE_PX) {
    this.pipes.forEach((p) => {
      if (!p.active) return;
      const pipeCenter = p.x + p.width / 2;
      if (Math.abs(pipeCenter - birdX) < clearancePx) {
        p.active = false;
      }
    });
  }

  spawn(xPos, difficultyKey) {
    const pipe = this.pipes.find((p) => !p.active);
    if (!pipe) return;
    const diff = GAME_CONFIG.DIFFICULTIES[difficultyKey] || GAME_CONFIG.DIFFICULTIES.normal;
    const topHeight = computeNextPipeTopHeight(this.lastTopHeight, difficultyKey, Math.random, GAME_CONFIG);
    this.lastTopHeight = topHeight;
    pipe.reset(xPos, topHeight, diff.pipeGap);
  }

  update(dt, isActive) {
    if (!isActive) return;

    const diffKey = storage.data.selectedDifficulty || 'normal';
    const diff = GAME_CONFIG.DIFFICULTIES[diffKey] || GAME_CONFIG.DIFFICULTIES.normal;
    const dx = diff.pipeSpeed * dt;

    this.distanceSinceSpawn += dx;
    const threshold = this.hasSpawnedFirst ? diff.pipeSpacing : GAME_CONFIG.PIPE_INITIAL_LEAD_PX;
    if (this.distanceSinceSpawn >= threshold) {
      this.distanceSinceSpawn -= threshold;
      this.hasSpawnedFirst = true;
      this.spawn(GAME_CONFIG.CANVAS_WIDTH + 48, diffKey);
    }

    this.pipes.forEach((p) => {
      if (!p.active) return;
      p.update(diff.pipeSpeed, dt);
      if (p.x < -p.width - 28) {
        p.active = false;
      }
    });
  }

  draw(ctx, themeObj) {
    this.pipes.forEach((p) => p.draw(ctx, themeObj));
  }

  checkCollision(bird, onPassPipe, onCollectCoin) {
    let collided = false;
    this.pipes.forEach((p) => {
      if (!p.active) return;

      if (!p.passed && bird.x > p.x + p.width / 2) {
        p.passed = true;
        onPassPipe();
      }

      if (p.coin.active && !p.coin.collected) {
        const coinX = p.x + p.width / 2;
        if (checkCoinPickup(bird, coinX, p.coin.y, GAME_CONFIG.COIN_RADIUS)) {
          p.coin.collected = true;
          onCollectCoin(coinX, p.coin.y);
        }
      }

      if (bird.invulnTimer <= 0 && checkPipeCollision(bird, p, GAME_CONFIG)) {
        collided = true;
      }
    });
    return collided;
  }
}
