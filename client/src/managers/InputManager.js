/**
 * InputManager.js - Keyboard and Mouse Input Handling
 *
 * Manages all user input including keyboard and mouse events.
 * Tracks key states and triggers appropriate game actions.
 *
 * @module managers/InputManager
 *
 * ## Controls:
 * - WASD / Arrow Keys: Movement
 * - W / Up Arrow (hold while falling): Glide
 * - J / Left Click + Direction: Attack
 * - Space: Start game / Resume from pause
 * - Escape: Pause menu
 *
 * ## Attack System:
 * - Requires directional input to attack
 * - Attack direction is locked when triggered
 * - Cooldown prevents spam attacks
 */

import { gameState } from '../state/gameState.js';
import { ATTACK_COOLDOWN } from '../config/constants.js';

// ========================================
// INPUT STATE
// ========================================

/** @type {Object.<string, boolean>} Current state of all keys */
const keys = {};

/** @type {Function|null} Callback when attack is triggered */
let onAttackCallback = null;

/** @type {boolean} Whether attack key has been released (prevents hold-spam) */
let attackKeyReleased = true;

// ========================================
// PUBLIC API
// ========================================

/**
 * Gets the current state of all keys.
 * @returns {Object.<string, boolean>} Object mapping key codes to pressed state
 */
export function getKeys() {
  return keys;
}

/**
 * Checks if a specific key is currently pressed.
 * @param {string} keyCode - The key code to check (e.g., 'KeyW', 'ArrowUp')
 * @returns {boolean} True if the key is pressed
 */
export function isKeyPressed(keyCode) {
  return keys[keyCode] === true;
}

// ========================================
// PRIVATE FUNCTIONS
// ========================================

/**
 * Determines attack direction based on current directional input.
 * @private
 * @returns {Object|null} Direction object {x, y} or null if no direction
 */
function getAttackDirection() {
  const left = keys["KeyA"] || keys["ArrowLeft"];
  const right = keys["KeyD"] || keys["ArrowRight"];
  const up = keys["KeyW"] || keys["ArrowUp"];
  const down = keys["KeyS"] || keys["ArrowDown"];

  // Prioritize horizontal directions, then vertical
  if (left && !right) return { x: -1, y: 0 };
  if (right && !left) return { x: 1, y: 0 };
  if (up && !down) return { x: 0, y: 1 };
  if (down && !up) return { x: 0, y: -1 };

  return null;
}

/**
 * Attempts to trigger an attack in the current direction.
 * Checks cooldowns and game state before allowing attack.
 * @private
 */
function triggerAttack() {
  const currentTime = performance.now();

  // Check if attack key/mouse has been released since last attack
  if (!attackKeyReleased) return;

  // Get the attack direction from current input
  const direction = getAttackDirection();

  // Must have a direction to attack
  if (!direction) return;

  // Check if we can attack (not paused, not on cooldown)
  if (!gameState.isPaused &&
      gameState.canMove &&
      !gameState.isAttacking &&
      currentTime > gameState.attackCooldown) {

    gameState.isAttacking = true;
    gameState.attackStartTime = currentTime;
    gameState.attackCooldown = currentTime + ATTACK_COOLDOWN;
    gameState.attackDirection = direction;
    attackKeyReleased = false; // Prevent repeated attacks until released

    if (onAttackCallback) {
      onAttackCallback(direction);
    }
  }
}

// ========================================
// SETUP
// ========================================

/**
 * Sets up all input event listeners.
 * @param {Object} callbacks - Callback functions for various events
 * @param {Function} [callbacks.onPause] - Called when pause is triggered
 * @param {Function} [callbacks.onResume] - Called when game resumes
 * @param {Function} [callbacks.onStart] - Called when game starts
 * @param {Function} [callbacks.onAttack] - Called when attack is triggered
 */
export function setupInputHandlers(callbacks = {}) {
  const { onPause, onResume, onStart, onAttack } = callbacks;

  onAttackCallback = onAttack;

  // Keyboard down events
  window.addEventListener("keydown", (e) => {
    // Prevent default scrolling for arrow keys
    if (e.code === "ArrowUp" || e.code === "ArrowDown") {
      e.preventDefault();
    }

    keys[e.code] = true;

    // ESC: Toggle pause menu
    if (e.code === "Escape") {
      if (!gameState.isPaused && !gameState.hasWon) {
        if (onPause) onPause();
      } else if (gameState.isPauseMenuOpen) {
        if (onResume) onResume();
      }
    }

    // Space: Start or resume game
    if (gameState.isPaused && e.code === "Space") {
      if (gameState.isPauseMenuOpen) {
        if (onResume) onResume();
      } else {
        if (onStart) onStart();
      }
    }

    // J: Attack
    if (e.code === "KeyJ") {
      triggerAttack();
    }
  });

  // Keyboard up events
  window.addEventListener("keyup", (e) => {
    keys[e.code] = false;

    // Track jump key release for double jump
    if (e.code === "KeyW" || e.code === "ArrowUp") {
      gameState.jumpKeyReleased = true;
    }

    // Allow new attack after J is released
    if (e.code === "KeyJ") {
      attackKeyReleased = true;
    }
  });

  // Mouse click: Attack
  window.addEventListener("mousedown", (e) => {
    if (e.button === 0) { // Left click only
      triggerAttack();
    }
  });

  // Mouse release: Allow new attack
  window.addEventListener("mouseup", (e) => {
    if (e.button === 0) {
      attackKeyReleased = true;
    }
  });
}

