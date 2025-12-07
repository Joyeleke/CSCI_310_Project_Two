// ========================================
// CONSTANTS
// ========================================

// Server URL - auto-detect local vs production
export const SERVER_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3000'
  : 'https://csci-310-project-two.onrender.com';

// Scene dimensions
export const targetAspect = 16 / 9;
export const sceneHeight = 15;
export const sceneWidth = sceneHeight * targetAspect; // ~17.78

// Ground bar
export const groundWidth = sceneWidth * 0.9;
export const groundHeight = 0.3;
export const groundPositionY = -sceneHeight / 2 - 0.6;
export const groundTopY = groundPositionY + groundHeight / 2;

// Player dimensions - Updated to match the actual 3D model scaling
export const playerWidth = 0.8;
export const playerHeight = 1.4;
export const playerDepth = 0.8;

// Physics
export const gravity = -25;
export const defaultJumpStrength = 15;
export const fastFall = -15;
export const moveSpeed = 7;

// Gliding constants
export const glideGravity = -8;
export const glideMaxSpeed = -3;
export const glideRotationAngle = -Math.PI / 2;

// Colors
export const bgColor = 0x343434;
export const playerColor = 0x00ff88;
export const groundColor = 0x8a9b68;
export const spikeHitColor = 0xff6666;

// Player start position
export const playerStartPositionX = 0;
export const playerStartPositionY = groundTopY + playerHeight / 2;

// Multiplayer
export const POSITION_SEND_INTERVAL = 40; // ms (~25 times per second)
export const COLLISION_COOLDOWN = 500; // ms

// Attack/Knockout
export const ATTACK_DURATION = 300; // ms - how long the attack hitbox is active
export const ATTACK_COOLDOWN = 500; // ms - time before player can attack again
export const ATTACK_RANGE = 1.5; // units - how far the attack reaches
export const ATTACK_KNOCKBACK_X = 8; // horizontal knockback force
export const ATTACK_KNOCKBACK_Y = 6; // vertical knockback force

