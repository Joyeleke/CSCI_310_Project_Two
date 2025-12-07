/**
 * gameState.js - Central Game State Management
 *
 * Contains all mutable game state in a single object for easy access.
 * Also handles personal best tracking with localStorage persistence.
 *
 * @module state/gameState
 *
 * ## State Categories:
 * - Core game state (paused, won, etc.)
 * - Physics state (velocity, grounded, etc.)
 * - Attack state (attacking, direction, cooldown)
 * - Level tracking
 * - Timer tracking
 *
 * ## Personal Bests:
 * - Stored per difficulty level
 * - Persisted to localStorage
 * - Formatted as MM:SS.MS
 */

import { defaultJumpStrength } from '../config/constants.js';

// ========================================
// GAME STATE
// ========================================

/**
 * Central game state object containing all mutable game data.
 * Modified by various managers and the game loop.
 * @type {Object}
 */
export const gameState = {
  // ---- Core Game State ----
  /** @type {boolean} Whether the game is paused */
  isPaused: true,
  /** @type {boolean} Whether the pause menu is currently open */
  isPauseMenuOpen: false,
  /** @type {boolean} Whether the player can move */
  canMove: true,
  /** @type {boolean} Whether the player has won the game */
  hasWon: false,

  // ---- Physics State ----
  /** @type {number} Current vertical velocity */
  velocityY: 0,
  /** @type {boolean} Whether the player is on the ground */
  isOnGround: false,
  /** @type {number} Number of jumps performed (0, 1, or 2) */
  jumpCount: 0,
  /** @type {boolean} Whether double jump is available */
  canDoubleJump: false,
  /** @type {boolean} Whether jump key was released (prevents held jumping) */
  jumpKeyReleased: true,
  /** @type {boolean} Whether player is currently gliding */
  isGliding: false,
  /** @type {number} Glide direction (-1 left, 0 none, 1 right) */
  glideDirection: 0,
  /** @type {boolean} Whether player is touching a wall */
  isOnWall: false,
  /** @type {boolean} Whether wall jump is available */
  canWallJump: false,
  /** @type {string|null} Which side of wall player is on ('left' or 'right') */
  wallSide: null,

  // ---- Attack State ----
  /** @type {boolean} Whether player is currently attacking */
  isAttacking: false,
  /** @type {number} Timestamp when attack started */
  attackStartTime: 0,
  /** @type {number} Timestamp when next attack is allowed */
  attackCooldown: 0,
  /** @type {Object|null} Attack direction { x: -1/0/1, y: -1/0/1 } */
  attackDirection: null,
  /** @type {number} Direction player is facing (1 right, -1 left) */
  facingDirection: 1,

  // ---- Jump Settings ----
  /** @type {number} Current jump strength (varies by difficulty) */
  jumpStrength: defaultJumpStrength,
  /** @type {string} Display label for selected difficulty */
  selectedDifficultyLabel: "Medium",

  // ---- Level Tracking ----
  /** @type {number} Current level number (1-indexed) */
  currentLevel: 1,
  /** @type {Set<number>} Set of level numbers that have been loaded */
  loadedLevels: new Set(),

  // ---- Timer Tracking ----
  /** @type {number} Timestamp when game started */
  gameStartTime: 0,
  /** @type {number} Timestamp when game was paused */
  pausedTime: 0,
  /** @type {number} Total time spent paused (for accurate timer) */
  totalPausedTime: 0,

  // ---- Visual Feedback ----
  /** @type {number} Timestamp when spike hit occurred */
  spikeHitTime: 0,
  /** @type {boolean} Whether spike hit visual is showing */
  isShowingSpikeHit: false,
};

// ========================================
// PERSONAL BEST TRACKING
// ========================================

/**
 * Personal best times for each difficulty level.
 * Times are stored in milliseconds.
 * @type {Object}
 */
export const personalBests = {
  easy: null,
  medium: null,
  hard: null
};

/**
 * Loads personal bests from localStorage.
 * Called on game initialization.
 */
export function loadPersonalBests() {
  const saved = localStorage.getItem('blocky-personal-bests');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      Object.assign(personalBests, parsed);
    } catch {
      console.warn('Failed to load personal bests from localStorage');
    }
  }
}

/**
 * Saves personal bests to localStorage.
 * Called when a new personal best is achieved.
 */
export function savePersonalBests() {
  localStorage.setItem('blocky-personal-bests', JSON.stringify(personalBests));
}

/**
 * Formats a time in milliseconds to MM:SS.MS format.
 * @param {number|null} timeMs - Time in milliseconds
 * @returns {string|null} Formatted time string or null if no time provided
 * @example formatTime(125340) // Returns "02:05.34"
 */
export function formatTime(timeMs) {
  if (!timeMs) return null;

  const seconds = Math.floor(timeMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const displaySeconds = seconds % 60;
  const milliseconds = Math.floor((timeMs % 1000) / 10);

  return `${minutes.toString().padStart(2, '0')}:${displaySeconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
}

/**
 * Checks if a completion time is a new personal best and saves it.
 * @param {number} completionTime - Time in milliseconds
 * @param {string} difficulty - Difficulty level ('easy', 'medium', 'hard')
 * @returns {boolean} True if this is a new record, false otherwise
 */
export function checkAndSavePersonalBest(completionTime, difficulty) {
  const difficultyKey = difficulty.toLowerCase();
  const currentBest = personalBests[difficultyKey];

  if (!currentBest || completionTime < currentBest) {
    personalBests[difficultyKey] = completionTime;
    savePersonalBests();
    return true; // New record!
  }
  return false; // No new record
}

/**
 * Resets all physics-related state to initial values.
 * Called when restarting or respawning the player.
 */
export function resetPhysicsState() {
  gameState.velocityY = 0;
  gameState.isOnGround = false;
  gameState.jumpCount = 0;
  gameState.canDoubleJump = false;
  gameState.jumpKeyReleased = true;
  gameState.isGliding = false;
  gameState.glideDirection = 0;
  gameState.isOnWall = false;
  gameState.canWallJump = false;
  gameState.wallSide = null;
}

