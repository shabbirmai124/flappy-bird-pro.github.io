import { GAME_CONFIG } from './config.js';
import { storage } from './storage.js';

export class Background {
  constructor() {
    this.width = GAME_CONFIG.CANVAS_WIDTH;
    this.height = GAME_CONFIG.CANVAS_HEIGHT;
    this.groundHeight = GAME_CONFIG.GROUND_HEIGHT;

    this.skyScroll = 0;
    this.farScroll = 0;
    this.midScroll = 0;
    this.groundScroll = 0;

    this.stars = [];
    this.clouds = [];
    this.asteroids = [];
    this.leaves = [];
    this.initProceduralElements();
  }

  initProceduralElements() {
    this.stars = [];
    for (let i = 0; i < 48; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * (this.height - this.groundHeight - 110),
        size: 1 + Math.random() * 2,
        twinkleSpeed: 1.5 + Math.random() * 2.8,
        phase: Math.random() * Math.PI * 2,
      });
    }

    this.clouds = [];
    for (let i = 0; i < 5; i++) {
      this.clouds.push({
        x: Math.random() * this.width * 1.4,
        y: 38 + Math.random() * 110,
        speed: 8 + Math.random() * 14,
        scale: 0.6 + Math.random() * 0.65,
      });
    }

    this.asteroids = [];
    for (let i = 0; i < 6; i++) {
      this.asteroids.push({
        x: Math.random() * this.width * 1.5,
        y: 50 + Math.random() * 210,
        speed: 6 + Math.random() * 10,
        size: 8 + Math.random() * 14,
        angle: Math.random() * Math.PI * 2,
        rotSpeed: 0.35 + Math.random() * 0.65,
      });
    }

    this.leaves = [];
    const leafColors = ['#d84315', '#ef6c00', '#f9a825', '#ad1457', '#e65100'];
    for (let i = 0; i < 35; i++) {
      this.leaves.push({
        x: Math.random() * this.width,
        y: Math.random() * (this.height - this.groundHeight),
        vx: -28 - Math.random() * 75,
        vy: 30 + Math.random() * 70,
        size: 3 + Math.random() * 5.5,
        angle: Math.random() * Math.PI * 2,
        rotSpeed: 1.2 + Math.random() * 2.8,
        color: leafColors[i % leafColors.length],
      });
    }
  }

  update(pipeSpeedPxPerSec, dt, isScrolling) {
    if (!isScrolling) return;

    this.skyScroll = (this.skyScroll + pipeSpeedPxPerSec * 0.03 * dt) % this.width;
    this.farScroll = (this.farScroll + pipeSpeedPxPerSec * 0.1 * dt) % this.width;
    this.midScroll = (this.midScroll + pipeSpeedPxPerSec * 0.24 * dt) % this.width;
    this.groundScroll = (this.groundScroll + pipeSpeedPxPerSec * dt) % 24;

    const theme = storage.data.selectedTheme;
    if (theme === 'day') {
      this.clouds.forEach((c) => {
        c.x -= (c.speed + pipeSpeedPxPerSec * 0.06) * dt;
        if (c.x < -150) {
          c.x = this.width + 110;
          c.y = 38 + Math.random() * 110;
        }
      });
    } else if (theme === 'night') {
      this.stars.forEach((s) => {
        s.phase += s.twinkleSpeed * dt;
      });
    } else if (theme === 'space') {
      this.stars.forEach((s) => {
        s.phase += s.twinkleSpeed * dt;
      });
      this.asteroids.forEach((a) => {
        a.x -= (a.speed + pipeSpeedPxPerSec * 0.05) * dt;
        a.angle += a.rotSpeed * dt;
        if (a.x < -50) {
          a.x = this.width + 55;
          a.y = 50 + Math.random() * 210;
        }
      });
    } else if (theme === 'forest') {
      this.leaves.forEach((l) => {
        l.x += (l.vx - pipeSpeedPxPerSec * 0.1) * dt;
        l.y += l.vy * dt;
        l.angle += l.rotSpeed * dt;
        if (l.x < -20 || l.y > this.height - this.groundHeight) {
          l.x = this.width + 20;
          l.y = Math.random() * (this.height - this.groundHeight - 100);
        }
      });
    }
  }

  drawSky(ctx, themeObj) {
    const grad = ctx.createLinearGradient(0, 0, 0, this.height);
    if (themeObj.sky.length === 3) {
      grad.addColorStop(0, themeObj.sky[0]);
      grad.addColorStop(0.55, themeObj.sky[1]);
      grad.addColorStop(1, themeObj.sky[2]);
    } else {
      grad.addColorStop(0, themeObj.sky[0]);
      grad.addColorStop(1, themeObj.sky[1]);
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);
  }

  drawParallaxLayer(ctx, themeKey) {
    if (themeKey === 'day') {
      ctx.fillStyle = '#b4e4ec';
      this.drawMountainRange(ctx, this.farScroll, this.height - this.groundHeight - 118, 100, 48);
      ctx.fillStyle = '#99db82';
      this.drawMountainRange(ctx, this.midScroll, this.height - this.groundHeight - 68, 70, 28);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.82)';
      this.clouds.forEach((c) => {
        ctx.beginPath();
        ctx.arc(c.x, c.y, 20 * c.scale, 0, Math.PI * 2);
        ctx.arc(c.x + 16 * c.scale, c.y - 10 * c.scale, 25 * c.scale, 0, Math.PI * 2);
        ctx.arc(c.x + 36 * c.scale, c.y, 20 * c.scale, 0, Math.PI * 2);
        ctx.fill();
      });
    } else if (themeKey === 'night') {
      this.stars.forEach((s) => {
        ctx.fillStyle = `rgba(255, 255, 255, ${0.35 + Math.abs(Math.sin(s.phase)) * 0.65})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Glowing crescent moon
      ctx.save();
      ctx.fillStyle = '#fffde7';
      ctx.shadowColor = '#fff9c4';
      ctx.shadowBlur = 28;
      ctx.beginPath();
      ctx.arc(this.width - 80, 82, 36, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = '#112046';
      ctx.beginPath();
      ctx.arc(this.width - 92, 74, 33, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#15284f';
      this.drawCitySkyline(ctx, 0, this.height - this.groundHeight - 156, 60, 20, false);
      ctx.fillStyle = '#1e3660';
      this.drawCitySkyline(ctx, 0, this.height - this.groundHeight - 98, 40, 12, true);
    } else if (themeKey === 'space') {
      const starColors = ['#ffffff', '#64ffda', '#ff4081', '#a6d5fa'];
      this.stars.forEach((s, idx) => {
        ctx.fillStyle = starColors[idx % starColors.length];
        ctx.globalAlpha = 0.25 + Math.abs(Math.sin(s.phase)) * 0.75;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      ctx.fillStyle = '#3a334e';
      ctx.strokeStyle = '#5c527a';
      ctx.lineWidth = 2;
      this.asteroids.forEach((a) => {
        ctx.save();
        ctx.translate(a.x, a.y);
        ctx.rotate(a.angle);
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const r = a.size * (0.84 + Math.sin(i * 1.5) * 0.16);
          const ang = (i / 8) * Math.PI * 2;
          if (i === 0) ctx.moveTo(Math.cos(ang) * r, Math.sin(ang) * r);
          else ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      });
    } else if (themeKey === 'forest') {
      ctx.save();
      ctx.fillStyle = '#ffe082';
      ctx.shadowColor = '#ff8f00';
      ctx.shadowBlur = 65;
      ctx.beginPath();
      ctx.arc(this.width * 0.74, this.height - this.groundHeight - 132, 58, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = '#8d4e2a';
      this.drawMountainRange(ctx, 0, this.height - this.groundHeight - 128, 130, 48);
      ctx.fillStyle = '#6b3420';
      this.drawPineForest(ctx, 0, this.height - this.groundHeight - 78, 35, 0.7);
      ctx.fillStyle = '#4a2010';
      this.drawPineForest(ctx, 0, this.height - this.groundHeight - 38, 55, 1.2);

      const mist = ctx.createLinearGradient(0, this.height - this.groundHeight - 100, 0, this.height - this.groundHeight);
      mist.addColorStop(0, 'rgba(255, 171, 64, 0)');
      mist.addColorStop(1, 'rgba(255, 111, 0, 0.3)');
      ctx.fillStyle = mist;
      ctx.fillRect(0, this.height - this.groundHeight - 100, this.width, 100);

      this.leaves.forEach((l) => {
        ctx.save();
        ctx.translate(l.x, l.y);
        ctx.rotate(l.angle);
        ctx.fillStyle = l.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, l.size, l.size * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    }
  }

  draw(ctx, themeObj) {
    const themeKey = storage.data.selectedTheme;
    this.drawSky(ctx, themeObj);
    this.drawParallaxLayer(ctx, themeKey);
  }

  drawGround(ctx, themeObj) {
    const y = this.height - this.groundHeight;
    const w = this.width;

    ctx.fillStyle = themeObj.ground;
    ctx.fillRect(0, y, w, this.groundHeight);

    ctx.fillStyle = themeObj.groundAccent;
    ctx.fillRect(0, y, w, 14);

    // Scrolling diagonal chevrons on top turf strip
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    const offset = this.groundScroll % 24;
    for (let x = -24; x < w + 24; x += 24) {
      ctx.moveTo(x - offset, y + 14);
      ctx.lineTo(x - offset + 12, y + this.groundHeight);
    }
    ctx.stroke();

    // Crisp borders
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.32)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.moveTo(0, y + 14);
    ctx.lineTo(w, y + 14);
    ctx.stroke();
  }

  drawMountainRange(ctx, scroll, baseY, pad, amp) {
    ctx.beginPath();
    ctx.moveTo(-pad, this.height);
    for (let x = -pad; x < this.width + pad; x += 10) {
      const sample = x + scroll;
      const y = baseY + Math.sin(sample * 0.008) * amp + Math.cos(sample * 0.02) * (amp * 0.3);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(this.width + pad, this.height);
    ctx.closePath();
    ctx.fill();
  }

  drawCitySkyline(ctx, scroll, baseY, baseW, baseH, withWindows = false) {
    ctx.beginPath();
    ctx.moveTo(0, this.height);
    let x = -scroll;
    const buildings = [];
    while (x < this.width + 100) {
      const w = baseW + Math.abs(Math.sin(x * 123.45)) * 30;
      const h = baseH + Math.abs(Math.cos(x * 987.65)) * 80;
      buildings.push({ x, w, h });
      ctx.lineTo(x, this.height - this.groundHeight);
      ctx.lineTo(x, baseY - h);
      ctx.lineTo(x + w, baseY - h);
      x += w;
    }
    ctx.lineTo(this.width, this.height);
    ctx.closePath();
    ctx.fill();

    if (withWindows) {
      ctx.fillStyle = 'rgba(255, 230, 100, 0.65)';
      buildings.forEach((b) => {
        if (b.h > 45 && b.w > 30) {
          const rows = Math.floor((b.h - 15) / 16);
          const cols = Math.floor((b.w - 10) / 12);
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              if (Math.sin((b.x + r * 11 + c * 7) * 456.78) > 0.3) {
                ctx.fillRect(b.x + 8 + c * 12, baseY - b.h + 12 + r * 16, 4, 6);
              }
            }
          }
        }
      });
    }
  }

  drawPineForest(ctx, scroll, baseY, step, scale = 1) {
    ctx.beginPath();
    let x = -scroll;
    while (x < this.width + 100) {
      const h = (40 + Math.abs(Math.sin(x * 342.12)) * 60) * scale;
      const w = (20 + h * 0.25) * scale;
      ctx.moveTo(x, baseY);
      ctx.lineTo(x - w * 0.5, baseY - h * 0.3);
      ctx.lineTo(x - w * 0.3, baseY - h * 0.3);
      ctx.lineTo(x - w * 0.7, baseY - h * 0.6);
      ctx.lineTo(x - w * 0.4, baseY - h * 0.6);
      ctx.lineTo(x, baseY - h);
      ctx.lineTo(x + w * 0.4, baseY - h * 0.6);
      ctx.lineTo(x + w * 0.7, baseY - h * 0.6);
      ctx.lineTo(x + w * 0.3, baseY - h * 0.3);
      ctx.lineTo(x + w * 0.5, baseY - h * 0.3);
      ctx.closePath();
      x += step + Math.abs(Math.cos(x * 12.34)) * 20;
    }
    ctx.fill();
  }
}
