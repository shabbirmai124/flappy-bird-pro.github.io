import { GAME_CONFIG } from './config.js';

/**
 * Clamps frame delta time to prevent physics tunneling across tab switches
 * or heavy GC pauses, then computes deterministic fixed-timestep substeps.
 */
export function advanceFixedTimestep(
  accumulator,
  rawDtSeconds,
  fixedDt = GAME_CONFIG.FIXED_DT,
  maxFrameDt = GAME_CONFIG.MAX_FRAME_DT,
  maxSubsteps = GAME_CONFIG.MAX_SUBSTEPS
) {
  const safeRawDt = Number.isFinite(rawDtSeconds) && rawDtSeconds > 0 ? rawDtSeconds : 0;
  const clampedDt = Math.min(safeRawDt, maxFrameDt);
  let nextAcc = accumulator + clampedDt;
  let steps = 0;

  while (nextAcc >= fixedDt && steps < maxSubsteps) {
    nextAcc -= fixedDt;
    steps += 1;
  }

  // Prevent spiral-of-death residual buildup if frame was severely throttled
  if (steps === maxSubsteps && nextAcc > fixedDt) {
    nextAcc = 0;
  }

  return {
    steps,
    accumulator: nextAcc,
    alpha: nextAcc / fixedDt,
    clampedDt,
  };
}

/**
 * Analytical jump apex height for ballistic kinematics (ignoring tiny air drag):
 * h = v0^2 / (2 * g)
 */
export function computeJumpApex(jumpVelocity = GAME_CONFIG.JUMP_VELOCITY, gravity = GAME_CONFIG.GRAVITY) {
  if (gravity <= 0) return 0;
  return (jumpVelocity * jumpVelocity) / (2 * gravity);
}

/**
 * Analytical time to reach jump apex: t = |v0| / g
 */
export function computeApexTime(jumpVelocity = GAME_CONFIG.JUMP_VELOCITY, gravity = GAME_CONFIG.GRAVITY) {
  if (gravity <= 0) return 0;
  return Math.abs(jumpVelocity) / gravity;
}

/**
 * Semi-implicit Euler integration with subtle quadratic aerodynamic drag,
 * smooth velocity-coupled pitch dynamics, and critically damped squash-and-stretch spring.
 */
export function stepBirdKinematics(birdState, dt, config = GAME_CONFIG) {
  const next = { ...birdState };

  // Quadratic aerodynamic drag opposes velocity direction: a_drag = -k * v * |v|
  const dragAccel = -config.AIR_DRAG * next.velocity * Math.abs(next.velocity);
  const netAccel = config.GRAVITY + dragAccel;

  // Semi-implicit Euler: integrate velocity first, then position
  next.velocity = Math.min(next.velocity + netAccel * dt, config.MAX_FALL_SPEED);
  next.y += next.velocity * dt;

  // Soft ceiling constraint so the bird cannot fly over pipes
  if (next.y < next.radius) {
    next.y = next.radius;
    if (next.velocity < 0) {
      next.velocity = 15;
    }
  }

  // Physically motivated pitch angle response:
  // Rising -> snappy upward pitch; near apex -> slight float; falling -> accelerates nose-down
  if (next.velocity < config.PITCH_FALL_THRESHOLD) {
    const blend = 1 - Math.exp(-config.PITCH_RISE_RATE * dt);
    const targetPitch = next.velocity < 0 ? config.PITCH_UP_RAD : config.PITCH_UP_RAD * 0.35;
    next.rotation += (targetPitch - next.rotation) * blend;
  } else {
    const fallRatio = Math.min(
      1,
      (next.velocity - config.PITCH_FALL_THRESHOLD) /
        Math.max(1, config.MAX_FALL_SPEED - config.PITCH_FALL_THRESHOLD)
    );
    const angularSpeed = config.PITCH_FALL_RATE * (0.45 + 1.35 * fallRatio);
    next.rotation = Math.min(config.PITCH_MAX_DOWN_RAD, next.rotation + angularSpeed * dt);
  }

  // Damped harmonic oscillator for squash & stretch (volume-preserving: scaleX ≈ 1 / scaleY)
  const k = config.SQUASH_STIFFNESS;
  const c = config.SQUASH_DAMPING;
  const stretchOffset = next.scaleY - 1;
  const springAccel = -k * stretchOffset - c * next.scaleVel;
  next.scaleVel += springAccel * dt;
  next.scaleY = Math.max(0.75, Math.min(1.28, next.scaleY + next.scaleVel * dt));
  next.scaleX = 1 / next.scaleY;

  // Wing power-stroke decay + continuous flight beat phase
  next.wingImpulse = Math.max(0, next.wingImpulse - dt * 5.2);
  next.wingPhase += dt * (next.isDead ? 0 : 12 + next.wingImpulse * 14);
  next.beakOpen = Math.max(0, next.beakOpen - dt * 4.5);

  return next;
}

/**
 * Applies a flap impulse to bird state (instant velocity set + squash-stretch & wing kick).
 */
export function applyFlapImpulse(birdState, config = GAME_CONFIG) {
  if (birdState.isDead) return birdState;
  return {
    ...birdState,
    velocity: config.JUMP_VELOCITY,
    scaleY: 1.18,
    scaleX: 1 / 1.18,
    scaleVel: 0.6,
    wingImpulse: 1.0,
    beakOpen: 1.0,
  };
}

/**
 * Exact closest-point Circle vs Axis-Aligned Bounding Box (AABB) intersection test.
 */
export function circleIntersectsRect(cx, cy, radius, rx, ry, rw, rh) {
  if (rw <= 0 || rh <= 0 || radius <= 0) return false;
  const closestX = Math.max(rx, Math.min(cx, rx + rw));
  const closestY = Math.max(ry, Math.min(cy, ry + rh));
  const dx = cx - closestX;
  const dy = cy - closestY;
  return dx * dx + dy * dy < radius * radius;
}

/**
 * Checks collision between the bird's forgiven circular hitbox and both the shaft
 * and extended lip caps of the top and bottom pipe segments.
 */
export function checkPipeCollision(bird, pipe, config = GAME_CONFIG) {
  if (!pipe.active) return false;

  const effectiveRadius = Math.max(1, bird.radius - config.HITBOX_INSET);
  const playableHeight = config.CANVAS_HEIGHT - config.GROUND_HEIGHT;
  const bottomY = playableHeight - pipe.bottomHeight;
  const lipH = config.PIPE_LIP_HEIGHT;
  const overhang = config.PIPE_LIP_OVERHANG;

  // Top pipe shaft + top pipe lip cap
  const topShaftH = Math.max(0, pipe.topHeight - lipH);
  const topLipY = Math.max(0, pipe.topHeight - lipH);
  if (
    circleIntersectsRect(bird.x, bird.y, effectiveRadius, pipe.x, 0, pipe.width, topShaftH) ||
    circleIntersectsRect(
      bird.x,
      bird.y,
      effectiveRadius,
      pipe.x - overhang,
      topLipY,
      pipe.width + overhang * 2,
      Math.min(lipH, pipe.topHeight)
    )
  ) {
    return true;
  }

  // Bottom pipe lip cap + bottom pipe shaft
  const bottomShaftH = Math.max(0, pipe.bottomHeight - lipH);
  if (
    circleIntersectsRect(
      bird.x,
      bird.y,
      effectiveRadius,
      pipe.x - overhang,
      bottomY,
      pipe.width + overhang * 2,
      Math.min(lipH, pipe.bottomHeight)
    ) ||
    circleIntersectsRect(
      bird.x,
      bird.y,
      effectiveRadius,
      pipe.x,
      bottomY + lipH,
      pipe.width,
      bottomShaftH
    )
  ) {
    return true;
  }

  return false;
}

/**
 * Exact circle-vs-circle coin pickup test.
 */
export function checkCoinPickup(bird, coinX, coinY, coinRadius = GAME_CONFIG.COIN_RADIUS) {
  const dx = bird.x - coinX;
  const dy = bird.y - coinY;
  const threshold = bird.radius + coinRadius + 2;
  return dx * dx + dy * dy < threshold * threshold;
}

/**
 * Checks whether the bird has impacted the ground plane.
 */
export function checkGroundCollision(birdY, birdRadius, config = GAME_CONFIG) {
  return birdY >= config.CANVAS_HEIGHT - config.GROUND_HEIGHT - birdRadius;
}

/**
 * Computes the maximum safe vertical climb/drop between two consecutive pipe gaps
 * based on horizontal travel time t = (spacing - pipeWidth) / speed and bird kinematics,
 * so no procedurally generated pipe pair is ever physically impossible.
 */
export function computeNextPipeTopHeight(prevTopHeight, difficultyKey = 'normal', randomFn = Math.random, config = GAME_CONFIG) {
  const diff = config.DIFFICULTIES[difficultyKey] || config.DIFFICULTIES.normal;
  const playableHeight = config.CANVAS_HEIGHT - config.GROUND_HEIGHT;
  const minTop = config.PIPE_MIN_HEIGHT;
  const maxTop = Math.max(minTop, playableHeight - diff.pipeGap - config.PIPE_MIN_HEIGHT);

  if (prevTopHeight === null || prevTopHeight === undefined) {
    return Math.round(minTop + randomFn() * (maxTop - minTop));
  }

  // Kinematic upper bound on reachable vertical delta given horizontal transit time
  const transitTime = Math.max(0.4, (diff.pipeSpacing - config.PIPE_WIDTH * 0.5) / diff.pipeSpeed);
  const kinematicDropBound = 0.5 * config.GRAVITY * transitTime * transitTime * 0.65;
  const maxDelta = Math.min(diff.maxGapDelta, kinematicDropBound);

  const low = Math.max(minTop, prevTopHeight - maxDelta);
  const high = Math.min(maxTop, prevTopHeight + maxDelta);
  return Math.round(low + randomFn() * (high - low));
}

/**
 * Evaluates medal tier from final score.
 */
export function evaluateMedal(score) {
  if (score >= 75) return { tier: 'gold', label: '1st' };
  if (score >= 35) return { tier: 'silver', label: '2nd' };
  if (score >= 15) return { tier: 'bronze', label: '3rd' };
  return { tier: 'none', label: '—' };
}

/**
 * Evaluates combo streak and bonus coins on pipe pass.
 */
export function evaluateCombo(nowMs, lastPipeMs, currentCombo, comboConfig = GAME_CONFIG.COMBO) {
  const withinWindow = lastPipeMs > 0 && nowMs - lastPipeMs <= comboConfig.WINDOW_MS;
  const comboCount = withinWindow ? Math.min(currentCombo + 1, 3) : 1;
  const idx = Math.min(comboCount - 1, comboConfig.MULTIPLIERS.length - 1);
  return {
    comboCount,
    multiplier: comboConfig.MULTIPLIERS[idx] || 1,
    coinBonus: comboConfig.COIN_BONUS[idx] || 0,
  };
}

/**
 * Quadratic trauma^2 camera shake decay.
 */
export function stepTraumaShake(trauma, dt, decayRate = 2.4) {
  const nextTrauma = Math.max(0, trauma - decayRate * dt);
  return {
    trauma: nextTrauma,
    magnitude: nextTrauma * nextTrauma,
  };
}
