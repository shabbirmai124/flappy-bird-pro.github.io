export const GAME_CONFIG = {
  CANVAS_WIDTH: 480,
  CANVAS_HEIGHT: 640,
  GROUND_HEIGHT: 80,

  // Fixed-timestep simulation parameters (seconds)
  FIXED_DT: 1 / 60,
  MAX_FRAME_DT: 0.05,
  MAX_SUBSTEPS: 5,

  // Physical kinematics (px/s and px/s^2)
  // Tuned to crisp 60Hz arcade feel:
  // Apex height h = v0^2 / (2g) = 330^2 / (2 * 920) ≈ 59.2 px, apex time ≈ 0.36 s
  GRAVITY: 920,
  JUMP_VELOCITY: -330,
  MAX_FALL_SPEED: 540,
  AIR_DRAG: 0.00035,

  // Bird physical geometry & hitbox forgiveness
  BIRD_START_X: 112,
  BIRD_RADIUS: 16,
  HITBOX_INSET: 2.5,

  // Pitch & squash-stretch spring dynamics
  PITCH_UP_RAD: -0.44, // ~ -25 deg
  PITCH_MAX_DOWN_RAD: 1.45, // ~ +83 deg
  PITCH_RISE_RATE: 18,
  PITCH_FALL_RATE: 4.8,
  PITCH_FALL_THRESHOLD: 135, // px/s downward before nosing down
  SQUASH_STIFFNESS: 240,
  SQUASH_DAMPING: 18,

  // Impact juice & revive fairness
  HITSTOP_SEC: 0.055,
  REVIVE_INVULN_SEC: 1.5,
  REVIVE_CLEARANCE_PX: 160,

  // Pipe geometry
  PIPE_WIDTH: 72,
  PIPE_LIP_OVERHANG: 4,
  PIPE_LIP_HEIGHT: 24,
  PIPE_MIN_HEIGHT: 64,
  PIPE_INITIAL_LEAD_PX: 130,

  DIFFICULTIES: {
    beginner: {
      name: 'Beginner',
      pipeSpeed: 105, // px/s
      pipeGap: 186,
      pipeSpacing: 235, // px between consecutive pipe centers
      maxGapDelta: 130,
    },
    normal: {
      name: 'Normal',
      pipeSpeed: 138, // px/s
      pipeGap: 150,
      pipeSpacing: 224,
      maxGapDelta: 155,
    },
    hard: {
      name: 'Hard',
      pipeSpeed: 178, // px/s
      pipeGap: 124,
      pipeSpacing: 215,
      maxGapDelta: 165,
    },
  },

  COIN_SPAWN_CHANCE: 0.55,
  COIN_RADIUS: 9,

  COMBO: {
    WINDOW_MS: 2100,
    MULTIPLIERS: [1, 1.5, 2, 3],
    COIN_BONUS: [0, 1, 2, 3],
  },

  CONTINUE_COUNTDOWN_SEC: 5,
  CONTINUE_COIN_COST: 0,
  MAX_CONTINUES: 1,

  COIN_BUNDLES: [
    { id: 'starter_pack', name: 'Starter Pack', coins: 100, price: '$0.99', rawPrice: 0.99, badge: 'Value' },
    { id: 'value_pack', name: 'Value Pack', coins: 500, price: '$2.99', rawPrice: 2.99, badge: 'Popular' },
    { id: 'mega_pack', name: 'Mega Pack', coins: 1500, price: '$6.99', rawPrice: 6.99, badge: 'Best Value' },
  ],

  SKINS: [
    {
      id: 'yellow',
      name: 'Classic Yellow',
      color: '#ffdf3b',
      accent: '#f57c00',
      belly: '#fff9d6',
      outline: '#3e2208',
      cost: 0,
      unlocked: true,
      desc: 'Your trusted old buddy.',
    },
    {
      id: 'red',
      name: 'Ruby Red',
      color: '#f44336',
      accent: '#9a0007',
      belly: '#ffd6cc',
      outline: '#3b0909',
      fierceBrow: true,
      cost: 50,
      unlocked: false,
      desc: 'Angrier and faster-looking!',
    },
    {
      id: 'blue',
      name: 'Ocean Blue',
      color: '#29b6f6',
      accent: '#01579b',
      belly: '#d9f4ff',
      outline: '#072240',
      cost: 100,
      unlocked: false,
      desc: 'Glides like a flying fish.',
    },
    {
      id: 'pink',
      name: 'Bubblegum',
      color: '#f06292',
      accent: '#ad1457',
      belly: '#ffe3ee',
      outline: '#3d0823',
      cost: 180,
      unlocked: false,
      desc: 'Sweet, pink, and super light.',
    },
    {
      id: 'shadow',
      name: 'Shadow Hawk',
      color: '#37474f',
      accent: '#102027',
      belly: '#546e7a',
      outline: '#060a0e',
      hasShadowTrail: true,
      visorColor: '#00f2fe',
      cost: 250,
      unlocked: false,
      desc: 'Stealth mode activated.',
    },
    {
      id: 'electric',
      name: 'Voltage',
      color: '#ffee58',
      accent: '#f57f17',
      belly: '#e0f7fa',
      outline: '#1d2b3a',
      hasElectric: true,
      cost: 350,
      unlocked: false,
      desc: 'Charged with lightning!',
    },
    {
      id: 'golden',
      name: 'Royal Gold',
      color: '#ffd740',
      accent: '#d48806',
      belly: '#fff8dc',
      outline: '#4a2c00',
      hasCrown: true,
      cost: 400,
      unlocked: false,
      desc: 'Forged from pure victory.',
    },
    {
      id: 'rainbow',
      name: 'Rainbow Glitch',
      color: '#ffffff',
      accent: '#00e5ff',
      belly: '#ffffff',
      outline: '#1a1033',
      hasTrail: true,
      cost: 600,
      unlocked: false,
      desc: 'Leaves a trailing rainbow prism!',
    },
  ],

  THEMES: {
    day: {
      name: 'Sunny Day',
      sky: ['#5cc2d6', '#c6eef2'],
      ground: '#ded895',
      groundAccent: '#73c73e',
      pipe: '#73bf2e',
      pipeHighlight: '#9ce659',
      pipeLip: '#528020',
      elements: 'clouds',
    },
    night: {
      name: 'Midnight City',
      sky: ['#0c1636', '#1e3a5f'],
      ground: '#1a2240',
      groundAccent: '#3a4a70',
      pipe: '#2e7d32',
      pipeHighlight: '#4caf50',
      pipeLip: '#1b5e20',
      elements: 'stars',
    },
    space: {
      name: 'Deep Space',
      sky: ['#05001c', '#3d0c78', '#a3228b'],
      ground: '#1f1a3a',
      groundAccent: '#ff007f',
      pipe: '#8e24aa',
      pipeHighlight: '#ce93d8',
      pipeLip: '#4a148c',
      elements: 'asteroids',
    },
    forest: {
      name: 'Autumn Forest',
      sky: ['#e65100', '#ffb74d'],
      ground: '#3e2723',
      groundAccent: '#6d4c41',
      pipe: '#795548',
      pipeHighlight: '#a1887f',
      pipeLip: '#4e342e',
      elements: 'leaves',
    },
  },

  ACHIEVEMENTS: [
    { id: 'first_flight', name: 'First Flight', desc: 'Score 5 points', target: 5, reward: 20, completed: false },
    { id: 'bronze_medal', name: 'Bronze Medal', desc: 'Score 15 points', target: 15, reward: 50, completed: false },
    { id: 'silver_medal', name: 'Silver Medal', desc: 'Score 35 points', target: 35, reward: 100, completed: false },
    { id: 'gold_medal', name: 'Gold Medal', desc: 'Score 75 points', target: 75, reward: 200, completed: false },
    { id: 'centurion', name: 'Centurion', desc: 'Score 100 points', target: 100, reward: 500, completed: false },
    { id: 'legend', name: 'Legend', desc: 'Score 200 points', target: 200, reward: 1000, completed: false },
    { id: 'collector', name: 'Wealthy Bird', desc: 'Collect 100 total coins', target: 100, type: 'coins', reward: 150, completed: false },
    { id: 'rich_bird', name: 'Rich Bird', desc: 'Collect 500 total coins', target: 500, type: 'coins', reward: 400, completed: false },
    { id: 'combo_king', name: 'Combo King', desc: 'Reach a 3x combo', target: 3, type: 'combo', reward: 75, completed: false },
    { id: 'veteran', name: 'Veteran Flapper', desc: 'Play 50 total games', target: 50, type: 'games', reward: 250, completed: false },
  ],

  DAILY_REWARD_AMOUNT: 30,
  LEADERBOARD_MAX_ENTRIES: 10,
};
