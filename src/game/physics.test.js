import test from 'node:test';
import assert from 'node:assert/strict';
import { GAME_CONFIG } from './config.js';
import {
  advanceFixedTimestep,
  applyFlapImpulse,
  checkCoinPickup,
  checkGroundCollision,
  checkPipeCollision,
  circleIntersectsRect,
  computeApexTime,
  computeJumpApex,
  computeNextPipeTopHeight,
  evaluateCombo,
  evaluateMedal,
  stepBirdKinematics,
  stepTraumaShake,
} from './physics.js';

test('fixed timestep clamps large rawDt and caps substeps to prevent tunneling', () => {
  const normal = advanceFixedTimestep(0, 1 / 60);
  assert.equal(normal.steps, 1);
  assert.ok(normal.accumulator < 1e-9);

  const tabSwitch = advanceFixedTimestep(0, 2.5);
  assert.equal(tabSwitch.clampedDt, GAME_CONFIG.MAX_FRAME_DT);
  assert.ok(tabSwitch.steps <= GAME_CONFIG.MAX_SUBSTEPS);
  assert.equal(tabSwitch.steps, 3);
});

test('analytical jump apex and semi-implicit Euler simulation agree closely', () => {
  const analyticalHeight = computeJumpApex();
  const apexTime = computeApexTime();

  // Expect comfortable ~55-65px single flap height in ~0.36s
  assert.ok(analyticalHeight > 54 && analyticalHeight < 65);
  assert.ok(apexTime > 0.3 && apexTime < 0.42);

  let state = {
    x: 112,
    y: 300,
    velocity: 0,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    scaleVel: 0,
    wingPhase: 0,
    wingImpulse: 0,
    beakOpen: 0,
    isDead: false,
    radius: 16,
  };
  state = applyFlapImpulse(state);
  let minY = state.y;

  const steps = Math.round(apexTime / GAME_CONFIG.FIXED_DT);
  for (let i = 0; i < steps; i++) {
    state = stepBirdKinematics(state, GAME_CONFIG.FIXED_DT);
    if (state.y < minY) minY = state.y;
  }

  const simulatedRise = 300 - minY;
  assert.ok(Math.abs(simulatedRise - analyticalHeight) < 6, `Simulated rise ${simulatedRise} vs analytical ${analyticalHeight}`);
  assert.ok(state.rotation < 0, 'Bird pitches nose-up when climbing');
});

test('falling kinematics respects terminal velocity and pitches nose-down', () => {
  let state = {
    x: 112,
    y: 120,
    velocity: 0,
    rotation: -0.4,
    scaleX: 1,
    scaleY: 1,
    scaleVel: 0,
    wingPhase: 0,
    wingImpulse: 0,
    beakOpen: 0,
    isDead: false,
    radius: 16,
  };

  for (let i = 0; i < 90; i++) {
    state = stepBirdKinematics(state, GAME_CONFIG.FIXED_DT);
  }

  assert.ok(state.velocity <= GAME_CONFIG.MAX_FALL_SPEED);
  assert.ok(state.velocity > 350);
  assert.ok(state.rotation > 0.5, 'Bird pitches nose-down during steep fall');
});

test('squash-and-stretch spring preserves approximate volume and damps toward 1', () => {
  let state = applyFlapImpulse({
    x: 112,
    y: 250,
    velocity: 0,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    scaleVel: 0,
    wingPhase: 0,
    wingImpulse: 0,
    beakOpen: 0,
    isDead: false,
    radius: 16,
  });

  assert.ok(Math.abs(state.scaleX * state.scaleY - 1) < 1e-6);

  for (let i = 0; i < 45; i++) {
    state = stepBirdKinematics(state, GAME_CONFIG.FIXED_DT);
  }

  assert.ok(Math.abs(state.scaleY - 1) < 0.04);
  assert.ok(Math.abs(state.scaleX - 1) < 0.04);
});

test('exact Circle-vs-AABB pipe collision detects shaft, lip overhang, and safe gap', () => {
  assert.equal(circleIntersectsRect(50, 50, 10, 45, 45, 20, 20), true);
  assert.equal(circleIntersectsRect(10, 10, 5, 45, 45, 20, 20), false);

  const pipe = {
    active: true,
    x: 200,
    width: 72,
    topHeight: 160,
    bottomHeight: 250, // gap spans y=160..310 (playableHeight=560)
  };

  // Safe center of gap
  assert.equal(checkPipeCollision({ x: 236, y: 235, radius: 16 }, pipe), false);

  // Colliding with top pipe lip overhang (x = 196..276, y = 136..160)
  assert.equal(checkPipeCollision({ x: 196, y: 150, radius: 16 }, pipe), true);

  // Colliding with bottom pipe shaft
  assert.equal(checkPipeCollision({ x: 236, y: 400, radius: 16 }, pipe), true);
});

test('coin pickup and ground collision tests work accurately', () => {
  assert.equal(checkCoinPickup({ x: 100, y: 200, radius: 16 }, 110, 205, 9), true);
  assert.equal(checkCoinPickup({ x: 100, y: 200, radius: 16 }, 150, 205, 9), false);

  assert.equal(checkGroundCollision(544, 16), true); // 640 - 80 - 16 = 544
  assert.equal(checkGroundCollision(540, 16), false);
});

test('procedural pipe height generator respects kinematic reachability bounds', () => {
  for (const diff of ['beginner', 'normal', 'hard']) {
    let prev = 200;
    for (let i = 0; i < 40; i++) {
      const nextLow = computeNextPipeTopHeight(prev, diff, () => 0);
      const nextHigh = computeNextPipeTopHeight(prev, diff, () => 1);
      assert.ok(nextLow >= GAME_CONFIG.PIPE_MIN_HEIGHT);
      assert.ok(
        nextHigh <=
          GAME_CONFIG.CANVAS_HEIGHT -
            GAME_CONFIG.GROUND_HEIGHT -
            GAME_CONFIG.DIFFICULTIES[diff].pipeGap -
            GAME_CONFIG.PIPE_MIN_HEIGHT
      );
      assert.ok(Math.abs(nextHigh - prev) <= GAME_CONFIG.DIFFICULTIES[diff].maxGapDelta);
      prev = Math.round((nextLow + nextHigh) / 2);
    }
  }
});

test('combo, medal, and trauma shake evaluators return expected results', () => {
  const c1 = evaluateCombo(2000, 0, 0);
  assert.equal(c1.comboCount, 1);
  assert.equal(c1.coinBonus, 0);

  const c2 = evaluateCombo(3500, 2000, 1);
  assert.equal(c2.comboCount, 2);
  assert.equal(c2.multiplier, 1.5);
  assert.equal(c2.coinBonus, 1);

  const c3 = evaluateCombo(4800, 3500, 2);
  assert.equal(c3.comboCount, 3);
  assert.equal(c3.multiplier, 2);
  assert.equal(c3.coinBonus, 2);

  assert.equal(evaluateMedal(10).tier, 'none');
  assert.equal(evaluateMedal(15).tier, 'bronze');
  assert.equal(evaluateMedal(35).tier, 'silver');
  assert.equal(evaluateMedal(75).tier, 'gold');

  const shake = stepTraumaShake(0.8, 0.2, 2.5);
  assert.ok(Math.abs(shake.trauma - 0.3) < 1e-6);
  assert.ok(Math.abs(shake.magnitude - 0.09) < 1e-6);
});
