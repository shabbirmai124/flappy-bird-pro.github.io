import { stepTraumaShake } from './physics.js';

const POOL_CAPACITY = 180;

class ParticleSystem {
  constructor() {
    this.pool = Array.from({ length: POOL_CAPACITY }, () => ({
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      size: 4,
      color: '#ffffff',
      life: 0,
      maxLife: 1,
      type: 'feather',
      rotation: 0,
      rotSpeed: 0,
    }));
    this.cursor = 0;
    this.trauma = 0;
    this.shakeMaxPx = 14;
    this.shakeX = 0;
    this.shakeY = 0;
    this.flashAlpha = 0;
  }

  clear() {
    for (let i = 0; i < POOL_CAPACITY; i++) {
      this.pool[i].active = false;
    }
    this.trauma = 0;
    this.shakeX = 0;
    this.shakeY = 0;
    this.flashAlpha = 0;
  }

  _spawn(x, y, vx, vy, size, color, maxLife, type) {
    const p = this.pool[this.cursor];
    this.cursor = (this.cursor + 1) % POOL_CAPACITY;
    p.active = true;
    p.x = x;
    p.y = y;
    p.vx = vx;
    p.vy = vy;
    p.size = size;
    p.color = color;
    p.life = maxLife;
    p.maxLife = maxLife;
    p.type = type;
    p.rotation = Math.random() * Math.PI * 2;
    p.rotSpeed = (Math.random() - 0.5) * 6;
  }

  triggerShake(traumaAmount = 0.85, maxPx = 14) {
    this.trauma = Math.min(1, Math.max(this.trauma, traumaAmount));
    this.shakeMaxPx = maxPx;
  }

  triggerFlash(alpha = 0.55) {
    this.flashAlpha = Math.max(this.flashAlpha, alpha);
  }

  spawnFeathers(x, y, primaryColor, accentColor = '#ffffff') {
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 90 + Math.random() * 210;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed - 65;
      const size = 3.5 + Math.random() * 4;
      const life = 0.55 + Math.random() * 0.45;
      const color = i % 3 === 0 ? accentColor : primaryColor;
      this._spawn(x, y, vx, vy, size, color, life, 'feather');
    }
  }

  spawnJumpDust(x, y) {
    for (let i = 0; i < 6; i++) {
      const vx = -65 - Math.random() * 85;
      const vy = (Math.random() - 0.3) * 65;
      const size = 3 + Math.random() * 3.5;
      const life = 0.24 + Math.random() * 0.16;
      this._spawn(x, y, vx, vy, size, 'rgba(255, 255, 255, 0.7)', life, 'dust');
    }
  }

  spawnStars(x, y) {
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2 + Math.random() * 0.3;
      const speed = 60 + Math.random() * 140;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed - 20;
      const size = 3 + Math.random() * 3.5;
      const life = 0.35 + Math.random() * 0.22;
      this._spawn(x, y, vx, vy, size, i % 2 === 0 ? '#ffd700' : '#fff9c4', life, 'star');
    }
  }

  spawnRainbowTrail(x, y) {
    const colors = ['#ff5252', '#ffab40', '#ffee58', '#69f0ae', '#40c4ff', '#e040fb'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const vx = -55 - Math.random() * 45;
    const vy = (Math.random() - 0.5) * 28;
    this._spawn(x, y, vx, vy, 3.5 + Math.random() * 2.5, color, 0.26 + Math.random() * 0.12, 'dust');
  }

  spawnShadowTrail(x, y) {
    const vx = -75 - Math.random() * 35;
    const vy = (Math.random() - 0.5) * 20;
    const color = Math.random() > 0.35 ? 'rgba(16, 32, 39, 0.65)' : 'rgba(0, 242, 254, 0.45)';
    this._spawn(x, y, vx, vy, 5 + Math.random() * 4, color, 0.24 + Math.random() * 0.12, 'dust');
  }

  spawnElectricSpark(x, y) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 50 + Math.random() * 90;
    const color = Math.random() > 0.5 ? '#80d8ff' : '#fff59d';
    this._spawn(x, y, Math.cos(angle) * speed - 40, Math.sin(angle) * speed, 2.5 + Math.random() * 2, color, 0.16 + Math.random() * 0.1, 'spark');
  }

  update(dt) {
    for (let i = 0; i < POOL_CAPACITY; i++) {
      const p = this.pool[i];
      if (!p.active) continue;

      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rotation += p.rotSpeed * dt;

      if (p.type === 'feather') {
        p.vy += 260 * dt;
        const damp = Math.pow(0.28, dt);
        p.vx *= damp;
        p.vy *= Math.pow(0.45, dt);
      } else if (p.type === 'dust') {
        const damp = Math.pow(0.06, dt);
        p.vx *= damp;
        p.vy *= damp;
        p.size += 5 * dt;
      } else if (p.type === 'star') {
        p.vy += 140 * dt;
        p.vx *= Math.pow(0.18, dt);
      } else if (p.type === 'spark') {
        p.vx *= Math.pow(0.08, dt);
        p.vy *= Math.pow(0.08, dt);
      }
    }

    if (this.trauma > 0) {
      const result = stepTraumaShake(this.trauma, dt, 2.5);
      this.trauma = result.trauma;
      const offset = result.magnitude * this.shakeMaxPx;
      this.shakeX = (Math.random() * 2 - 1) * offset;
      this.shakeY = (Math.random() * 2 - 1) * offset;
    } else {
      this.shakeX = 0;
      this.shakeY = 0;
    }

    if (this.flashAlpha > 0) {
      this.flashAlpha = Math.max(0, this.flashAlpha - dt * 4.5);
    }
  }

  draw(ctx) {
    for (let i = 0; i < POOL_CAPACITY; i++) {
      const p = this.pool[i];
      if (!p.active) continue;

      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;

      if (p.type === 'feather') {
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size * 1.55, p.size * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(-p.size * 1.2, 0);
        ctx.lineTo(p.size * 1.2, 0);
        ctx.stroke();
      } else if (p.type === 'dust') {
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'star') {
        ctx.beginPath();
        for (let k = 0; k < 4; k++) {
          ctx.lineTo(0, -p.size * 1.3);
          ctx.lineTo(p.size * 0.35, -p.size * 0.35);
          ctx.rotate(Math.PI / 2);
        }
        ctx.closePath();
        ctx.fill();
      } else if (p.type === 'spark') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(-p.size, -p.size * 0.4);
        ctx.lineTo(0, 0);
        ctx.lineTo(p.size, p.size * 0.6);
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  applyShake(ctx) {
    if (this.trauma > 0) {
      ctx.save();
      ctx.translate(this.shakeX, this.shakeY);
      return true;
    }
    return false;
  }

  restoreShake(ctx, didShake) {
    if (didShake) ctx.restore();
  }

  drawFlash(ctx, width, height) {
    if (this.flashAlpha <= 0.005) return;
    ctx.save();
    ctx.fillStyle = `rgba(255, 255, 255, ${this.flashAlpha})`;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }
}

export const particles = new ParticleSystem();
