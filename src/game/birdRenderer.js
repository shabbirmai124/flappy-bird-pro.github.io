import { GAME_CONFIG } from './config.js';

/**
 * Resolves a skin descriptor by ID.
 */
export function getSkinById(skinId) {
  return GAME_CONFIG.SKINS.find((s) => s.id === skinId) || GAME_CONFIG.SKINS[0];
}

/**
 * Draws a studio-grade, anatomically sculpted 2D procedural bird with:
 * - Streamlined aerodynamic silhouette & counter-shaded plumage
 * - Layered splayed tail fan & velocity-reactive head crest
 * - Multi-feathered articulated wing with power-stroke geometry
 * - Expressive eye (iris ring, velocity-tracking pupil, dual catchlights, blink/KO states)
 * - Two-part chirping curved beak
 * - Skin-specific flourishes (Royal Gold crown, Shadow Hawk visor, Voltage electric arcs, Rainbow iridescence)
 * - Optional Space-theme glass helmet
 */
export function drawProfessionalBird(ctx, opts) {
  const {
    x = 0,
    y = 0,
    scale = 1,
    scaleX = 1,
    scaleY = 1,
    rotation = 0,
    velocity = 0,
    wingPhase = 0,
    wingImpulse = 0,
    beakOpen = 0,
    isDead = false,
    skinId = 'yellow',
    themeId = 'day',
    timeSec = 0,
    invulnBlink = false,
    showShadow = true,
  } = opts;

  const skin = getSkinById(skinId);
  const isRainbow = skin.id === 'rainbow';
  const hueBase = (timeSec * 140) % 360;

  const primaryColor = isRainbow ? `hsl(${hueBase}, 95%, 64%)` : skin.color;
  const accentColor = isRainbow ? `hsl(${(hueBase + 75) % 360}, 92%, 44%)` : skin.accent;
  const bellyColor = isRainbow ? `hsl(${(hueBase + 160) % 360}, 100%, 88%)` : skin.belly || '#fff8e1';
  const outlineColor = skin.outline || '#1f122b';

  // Subtle natural blink every ~4 seconds while alive
  const blinkCycle = timeSec % 4.2;
  const isBlinking = !isDead && blinkCycle > 4.02 && blinkCycle < 4.14;

  // Dynamic wing articulation angle (-0.65 rad up to +0.72 rad downstroke)
  const flapWave = Math.sin(wingPhase);
  const wingAngle = isDead
    ? -0.35
    : flapWave * 0.42 + wingImpulse * 0.55;
  const wingScaleY = isDead
    ? 0.85
    : 0.88 + Math.abs(Math.cos(wingPhase)) * 0.22;

  // Tail spreads on flap and tucks smoothly when diving
  const tailSpread = Math.max(0.08, Math.min(0.42, 0.16 + wingImpulse * 0.24 - Math.max(0, velocity) * 0.0002));
  const crestLag = Math.max(-0.28, Math.min(0.28, velocity * 0.00075));

  ctx.save();
  ctx.translate(x, y);
  if (invulnBlink && Math.floor(timeSec * 16) % 2 === 0) {
    ctx.globalAlpha = 0.48;
  }
  ctx.rotate(rotation);
  ctx.scale(scale * scaleX, scale * scaleY);

  // Subtle ambient drop shadow for depth separation against sky
  if (showShadow) {
    ctx.shadowColor = 'rgba(10, 8, 24, 0.34)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 4;
  }

  // ── 1. LAYERED TAIL FEATHERS (behind body) ──
  ctx.save();
  ctx.translate(-15, 1);
  const tailAngles = [-tailSpread * 1.15, 0, tailSpread * 1.1];
  const tailLengths = [12, 14.5, 11];
  for (let i = 0; i < 3; i++) {
    ctx.save();
    ctx.rotate(tailAngles[i]);
    const tGrad = ctx.createLinearGradient(0, 0, -tailLengths[i], 0);
    tGrad.addColorStop(0, primaryColor);
    tGrad.addColorStop(1, accentColor);
    ctx.fillStyle = tGrad;
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(2, 0);
    ctx.quadraticCurveTo(-tailLengths[i] * 0.6, -4.2, -tailLengths[i], -1.2);
    ctx.quadraticCurveTo(-tailLengths[i] * 0.85, 2.8, 2, 2.2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();

  // ── 2. DYNAMIC HEAD CREST / CROWN TUFT ──
  ctx.save();
  ctx.translate(-2, -13.5);
  ctx.rotate(-0.18 + crestLag);
  const crestGrad = ctx.createLinearGradient(0, 0, -8, -11);
  crestGrad.addColorStop(0, primaryColor);
  crestGrad.addColorStop(1, accentColor);
  ctx.fillStyle = crestGrad;
  ctx.strokeStyle = outlineColor;
  ctx.lineWidth = 1.9;
  ctx.beginPath();
  ctx.moveTo(-2, 2);
  ctx.quadraticCurveTo(-11, -9, -1.5, -9.5);
  ctx.quadraticCurveTo(-3.5, -5.5, 1.5, -6.8);
  ctx.quadraticCurveTo(6.5, -10, 5.5, -2.5);
  ctx.quadraticCurveTo(3, 1, -2, 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // ── 3. STREAMLINED AERODYNAMIC BODY ──
  const bodyGrad = ctx.createRadialGradient(-4, -7, 2.5, 0, 2, 21);
  if (isRainbow) {
    bodyGrad.addColorStop(0, '#ffffff');
    bodyGrad.addColorStop(0.28, `hsl(${hueBase}, 100%, 72%)`);
    bodyGrad.addColorStop(0.72, `hsl(${(hueBase + 50) % 360}, 95%, 52%)`);
    bodyGrad.addColorStop(1, `hsl(${(hueBase + 105) % 360}, 90%, 36%)`);
  } else {
    bodyGrad.addColorStop(0, '#ffffff');
    bodyGrad.addColorStop(0.22, primaryColor);
    bodyGrad.addColorStop(0.78, primaryColor);
    bodyGrad.addColorStop(1, accentColor);
  }

  ctx.fillStyle = bodyGrad;
  ctx.strokeStyle = outlineColor;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  // Sculpted songbird hull: rounded chest, sleek tapering rump, lifted crown
  ctx.moveTo(16.5, -1.5);
  ctx.bezierCurveTo(16.5, -11.5, 7.5, -16, -2.5, -14.8);
  ctx.bezierCurveTo(-12.5, -13.6, -18.5, -6.5, -17.5, 2);
  ctx.bezierCurveTo(-16.5, 11.2, -7.5, 15.8, 2.8, 15);
  ctx.bezierCurveTo(12, 14.2, 16.5, 7.5, 16.5, -1.5);
  ctx.closePath();
  ctx.fill();

  // Disable heavy drop shadow for clean interior shading
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Soft clipped counter-shaded belly + upper rim highlight
  ctx.save();
  ctx.clip();

  // Warm cream / tinted belly patch
  const bellyGrad = ctx.createRadialGradient(4, 10, 2, 3, 12, 15);
  bellyGrad.addColorStop(0, bellyColor);
  bellyGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = bellyGrad;
  ctx.beginPath();
  ctx.ellipse(3.5, 11, 13.5, 8.5, -0.1, 0, Math.PI * 2);
  ctx.fill();

  // Crisp top-left rim sheen for studio polish
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.52)';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.arc(0, -1, 13.8, -Math.PI * 0.84, -Math.PI * 0.2);
  ctx.stroke();

  // Subtle lower ambient occlusion shade
  ctx.strokeStyle = 'rgba(18, 8, 32, 0.22)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(-1, 2, 14.5, Math.PI * 0.25, Math.PI * 0.85);
  ctx.stroke();
  ctx.restore();

  // Re-stroke crisp outer body contour over clipped fills
  ctx.strokeStyle = outlineColor;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(16.5, -1.5);
  ctx.bezierCurveTo(16.5, -11.5, 7.5, -16, -2.5, -14.8);
  ctx.bezierCurveTo(-12.5, -13.6, -18.5, -6.5, -17.5, 2);
  ctx.bezierCurveTo(-16.5, 11.2, -7.5, 15.8, 2.8, 15);
  ctx.bezierCurveTo(12, 14.2, 16.5, 7.5, 16.5, -1.5);
  ctx.closePath();
  ctx.stroke();

  // ── 4. TWO-PART ARTICULATED CURVED BEAK ──
  const jawGap = beakOpen * 2.4;

  // Lower mandible
  ctx.save();
  ctx.translate(13.5, 3.2);
  ctx.rotate(jawGap * 0.14);
  const lowerBeakGrad = ctx.createLinearGradient(0, 0, 10, 4);
  lowerBeakGrad.addColorStop(0, '#ff8f00');
  lowerBeakGrad.addColorStop(1, '#c63f17');
  ctx.fillStyle = lowerBeakGrad;
  ctx.strokeStyle = outlineColor;
  ctx.lineWidth = 1.9;
  ctx.beginPath();
  ctx.moveTo(-1, -0.5);
  ctx.quadraticCurveTo(6.5, 0.5, 10.2, 0.6);
  ctx.quadraticCurveTo(5.5, 5.4, -1.5, 3.6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Upper mandible
  ctx.save();
  ctx.translate(13.2, -0.5);
  ctx.rotate(-jawGap * 0.08);
  const upperBeakGrad = ctx.createLinearGradient(0, -4, 13, 3);
  upperBeakGrad.addColorStop(0, '#ffd54f');
  upperBeakGrad.addColorStop(0.45, '#ff9800');
  upperBeakGrad.addColorStop(1, '#e65100');
  ctx.fillStyle = upperBeakGrad;
  ctx.strokeStyle = outlineColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-1, -3.5);
  ctx.quadraticCurveTo(8, -4.6, 13.8, 1.5);
  ctx.quadraticCurveTo(6.5, 3.8, -1, 3.3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Gloss highlight along upper beak ridge
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.lineWidth = 1.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(1.5, -2.1);
  ctx.quadraticCurveTo(6, -2.4, 9.2, -0.4);
  ctx.stroke();
  ctx.restore();

  // ── 5. EXPRESSIVE EYE + CHEEK BLUSH ──
  // Soft rosy cheek blush
  if (skin.id !== 'shadow') {
    ctx.fillStyle = skin.id === 'red' ? 'rgba(255, 200, 120, 0.35)' : 'rgba(255, 110, 135, 0.38)';
    ctx.beginPath();
    ctx.ellipse(8.2, 4.5, 4.2, 2.5, -0.12, 0, Math.PI * 2);
    ctx.fill();
  }

  const eyeX = 6.8;
  const eyeY = -4.6;
  const eyeRx = 6.1;
  const eyeRy = 6.5;

  // Eye socket sclera
  const scleraGrad = ctx.createRadialGradient(eyeX - 1.5, eyeY - 2, 1, eyeX, eyeY, eyeRy + 1);
  scleraGrad.addColorStop(0, '#ffffff');
  scleraGrad.addColorStop(0.82, '#f1f5f9');
  scleraGrad.addColorStop(1, '#cbd5e1');
  ctx.fillStyle = scleraGrad;
  ctx.strokeStyle = outlineColor;
  ctx.lineWidth = 1.9;
  ctx.beginPath();
  ctx.ellipse(eyeX, eyeY, eyeRx, eyeRy, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  if (isDead) {
    // Expressive cartoon X-eye on knock-out
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(eyeX - 2.8, eyeY - 2.8);
    ctx.lineTo(eyeX + 2.8, eyeY + 2.8);
    ctx.moveTo(eyeX + 2.8, eyeY - 2.8);
    ctx.lineTo(eyeX - 2.8, eyeY + 2.8);
    ctx.stroke();
  } else if (isBlinking) {
    // Happy curved blink arc
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 2.1;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(eyeX, eyeY + 1, 3.6, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
  } else if (skin.visorColor) {
    // Shadow Hawk glowing cyber-visor eye
    ctx.fillStyle = '#091520';
    ctx.beginPath();
    ctx.ellipse(eyeX + 0.8, eyeY, 4.4, 4.8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = skin.visorColor;
    ctx.shadowColor = skin.visorColor;
    ctx.shadowBlur = 7;
    ctx.beginPath();
    ctx.ellipse(eyeX + 1.8, eyeY - 0.3, 2.4, 2.9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(eyeX + 2.4, eyeY - 1.5, 1.1, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Glossy pupil tracking vertical velocity slightly
    const gazeY = Math.max(-1.4, Math.min(1.6, velocity * 0.0045));
    const pupilX = eyeX + 1.8;
    const pupilY = eyeY + gazeY;

    // Subtle iris ring
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.arc(pupilX, pupilY, 3.4, 0, Math.PI * 2);
    ctx.fill();

    // Deep glossy pupil
    ctx.fillStyle = '#110b1c';
    ctx.beginPath();
    ctx.arc(pupilX + 0.3, pupilY, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Dual crisp specular catchlights
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(pupilX + 1.1, pupilY - 1.5, 1.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(pupilX - 1.1, pupilY + 1.3, 0.55, 0, Math.PI * 2);
    ctx.fill();
  }

  // Expressive eyebrow (fiercer for Ruby Red / Shadow Hawk, confident subtle brow for others)
  if (!isDead) {
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = skin.fierceBrow || skin.visorColor ? 2.4 : 1.7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (skin.fierceBrow || skin.visorColor) {
      ctx.moveTo(eyeX - 5.5, eyeY - 6.8);
      ctx.lineTo(eyeX + 4.8, eyeY - 4.2);
    } else {
      ctx.moveTo(eyeX - 4.2, eyeY - 7.1);
      ctx.quadraticCurveTo(eyeX + 0.5, eyeY - 8.4, eyeX + 4.6, eyeY - 6.4);
    }
    ctx.stroke();
  }

  // ── 6. MULTI-FEATHERED ARTICULATED WING ──
  ctx.save();
  ctx.translate(-3.8, 2.2);
  ctx.rotate(wingAngle);
  ctx.scale(1, wingScaleY);

  const wingGrad = ctx.createLinearGradient(-10, -7, 4, 8);
  wingGrad.addColorStop(0, '#ffffff');
  wingGrad.addColorStop(0.28, primaryColor);
  wingGrad.addColorStop(1, accentColor);

  ctx.fillStyle = wingGrad;
  ctx.strokeStyle = outlineColor;
  ctx.lineWidth = 2;

  // Sculpted scalloped wing silhouette with 3 distinct primary feather tips
  ctx.beginPath();
  ctx.moveTo(7.5, -1.8);
  ctx.bezierCurveTo(6.5, -7.2, -3.5, -8.4, -12.5, -3.2);
  ctx.quadraticCurveTo(-14.5, -1.2, -10.5, 0.8);
  ctx.quadraticCurveTo(-13.8, 3.2, -8.5, 4.5);
  ctx.quadraticCurveTo(-10.5, 7.6, -4.5, 6.8);
  ctx.bezierCurveTo(2.5, 7.2, 8.2, 3.2, 7.5, -1.8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Inner feather vane detail lines
  ctx.strokeStyle = 'rgba(20, 10, 35, 0.28)';
  ctx.lineWidth = 1.25;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(2.5, -1.5);
  ctx.quadraticCurveTo(-3.5, -2.2, -9.2, -1.2);
  ctx.moveTo(2.2, 1.5);
  ctx.quadraticCurveTo(-3, 2.2, -7.5, 3.2);
  ctx.stroke();

  // Wing leading-edge highlight
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(5, -3.6);
  ctx.quadraticCurveTo(-1.5, -5.6, -8.5, -3.4);
  ctx.stroke();
  ctx.restore();

  // ── 7. SKIN-SPECIFIC BESPOKE FLOURISHES ──
  // Royal Gold mini crown + rotating sparkle
  if (skin.hasCrown) {
    ctx.save();
    ctx.translate(1.5, -15.5);
    ctx.rotate(0.08);
    const crownGrad = ctx.createLinearGradient(0, -8, 0, 2);
    crownGrad.addColorStop(0, '#fff59d');
    crownGrad.addColorStop(0.5, '#ffd700');
    crownGrad.addColorStop(1, '#ff8f00');
    ctx.fillStyle = crownGrad;
    ctx.strokeStyle = '#4a2c00';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-6, 1);
    ctx.lineTo(-7.5, -6.5);
    ctx.lineTo(-2.5, -2.5);
    ctx.lineTo(0, -8.5);
    ctx.lineTo(2.5, -2.5);
    ctx.lineTo(7.5, -6.5);
    ctx.lineTo(6, 1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Ruby gem in crown center
    ctx.fillStyle = '#ff1744';
    ctx.beginPath();
    ctx.arc(0, -1.5, 1.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Voltage crackling procedural lightning arcs
  if (skin.hasElectric && !isDead) {
    ctx.save();
    ctx.strokeStyle = '#80f8ff';
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 8;
    ctx.lineWidth = 1.5;
    const arcPhase = Math.floor(timeSec * 14);
    for (let a = 0; a < 2; a++) {
      const baseAngle = ((arcPhase * 1.7 + a * 3.1) % (Math.PI * 2));
      const r1 = 18.5;
      const r2 = 22.5;
      ctx.beginPath();
      for (let s = 0; s <= 4; s++) {
        const ang = baseAngle + s * 0.28;
        const rad = s % 2 === 0 ? r1 : r2;
        const px = Math.cos(ang) * rad;
        const py = Math.sin(ang) * (rad * 0.85);
        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  // ── 8. SPACE THEME SLEEK GLASS HELMET ──
  if (themeId === 'space') {
    ctx.save();
    const domeGrad = ctx.createRadialGradient(-4, -8, 3, 2, -1, 22);
    domeGrad.addColorStop(0, 'rgba(255, 255, 255, 0.34)');
    domeGrad.addColorStop(0.55, 'rgba(100, 255, 218, 0.10)');
    domeGrad.addColorStop(1, 'rgba(0, 229, 255, 0.22)');
    ctx.fillStyle = domeGrad;
    ctx.strokeStyle = 'rgba(224, 247, 250, 0.85)';
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.arc(2.5, -1, 20.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Specular visor arc
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.72)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(2.5, -1, 17.5, -Math.PI * 0.76, -Math.PI * 0.44);
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}
