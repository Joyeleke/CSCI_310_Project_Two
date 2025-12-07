/**
 * constants.js - Game Configuration Constants
 *
 * Central configuration file containing all game constants.
 * Modify these values to adjust game physics, dimensions, and behavior.
 *
 * @module config/constants
 *
 * ## Categories:
 * - Server Configuration
 * - Scene Dimensions
 * - Ground/Platform Settings
 * - Player Dimensions
 * - Physics Constants
 * - Gliding Mechanics
 * - Colors
 * - Multiplayer Settings
 * - Attack/Combat Settings
 */

// ========================================
// SERVER CONFIGURATION
// ========================================

/**
 * WebSocket server URL for multiplayer
 * Auto-detects local development vs production environment
 * @constant {string}
 */
export const SERVER_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3000'
  : 'https://csci-310-project-two.onrender.com';

// ========================================
// SCENE DIMENSIONS
// ========================================

/** @constant {number} Target aspect ratio (16:9) */
export const targetAspect = 16 / 9;

/** @constant {number} Height of the visible scene in world units */
export const sceneHeight = 15;

/** @constant {number} Width of the visible scene (calculated from aspect ratio) */
export const sceneWidth = sceneHeight * targetAspect; // ~17.78

// ========================================
// GROUND SETTINGS
// ========================================

/** @constant {number} Width of the ground platform */
export const groundWidth = sceneWidth * 0.9;

/** @constant {number} Height/thickness of the ground platform */
export const groundHeight = 0.3;

/** @constant {number} Y position of the ground platform center */
export const groundPositionY = -sceneHeight / 2 - 0.6;

/** @constant {number} Y position of the ground's top surface */
export const groundTopY = groundPositionY + groundHeight / 2;

// ========================================
// PLAYER DIMENSIONS
// ========================================

/** @constant {number} Player collision box width */
export const playerWidth = 0.8;

/** @constant {number} Player collision box height */
export const playerHeight = 1.4;

/** @constant {number} Player collision box depth */
export const playerDepth = 0.8;

// ========================================
// PHYSICS CONSTANTS
// ========================================

/** @constant {number} Gravity acceleration (negative = downward) */
export const gravity = -25;

/** @constant {number} Default jump velocity */
export const defaultJumpStrength = 15;

/** @constant {number} Fast fall velocity when holding down */
export const fastFall = -15;

/** @constant {number} Horizontal movement speed */
export const moveSpeed = 7;

// ========================================
// GLIDING MECHANICS
// ========================================

/** @constant {number} Reduced gravity while gliding */
export const glideGravity = -8;

/** @constant {number} Maximum fall speed while gliding */
export const glideMaxSpeed = -3;

/** @constant {number} Player rotation angle while gliding (radians) */
export const glideRotationAngle = -Math.PI / 2;

// ========================================
// COLORS (Hex values)
// ========================================

/** @constant {number} Default background color */
export const bgColor = 0x343434;

/** @constant {number} Player mesh color */
export const playerColor = 0x00ff88;

/** @constant {number} Ground platform color */
export const groundColor = 0x8a9b68;

/** @constant {number} Background flash color when hitting spikes */
export const spikeHitColor = 0xff6666;

// ========================================
// PLAYER START POSITION
// ========================================

/** @constant {number} Player starting X position */
export const playerStartPositionX = 0;

/** @constant {number} Player starting Y position (on top of ground) */
export const playerStartPositionY = groundTopY + playerHeight / 2;

// ========================================
// MULTIPLAYER SETTINGS
// ========================================

/** @constant {number} How often to send position updates (ms) */
export const POSITION_SEND_INTERVAL = 40; // ~25 times per second

/** @constant {number} Cooldown between collision detections (ms) */
export const COLLISION_COOLDOWN = 500;

// ========================================
// ATTACK/COMBAT SETTINGS
// ========================================

/** @constant {number} Duration of attack hitbox being active (ms) */
export const ATTACK_DURATION = 300;

/** @constant {number} Cooldown before player can attack again (ms) */
export const ATTACK_COOLDOWN = 500;

/** @constant {number} How far the attack reaches (world units) */
export const ATTACK_RANGE = 1.5;

/** @constant {number} Horizontal knockback force applied on hit */
export const ATTACK_KNOCKBACK_X = 8;

/** @constant {number} Vertical knockback force applied on hit */
export const ATTACK_KNOCKBACK_Y = 6;

