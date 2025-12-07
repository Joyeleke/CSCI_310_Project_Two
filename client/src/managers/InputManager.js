import { gameState } from '../state/gameState.js';
import { ATTACK_COOLDOWN } from '../config/constants.js';

// ========================================
// INPUT MANAGER
// ========================================

const keys = {};
let onAttackCallback = null;
let attackKeyReleased = true; // Track if J key or mouse has been released

export function getKeys() {
  return keys;
}

export function isKeyPressed(keyCode) {
  return keys[keyCode] === true;
}

function getAttackDirection() {
  // Check for directional input (WASD or arrows)
  const left = keys["KeyA"] || keys["ArrowLeft"];
  const right = keys["KeyD"] || keys["ArrowRight"];
  const up = keys["KeyW"] || keys["ArrowUp"];
  const down = keys["KeyS"] || keys["ArrowDown"];

  // Prioritize horizontal directions, then vertical
  if (left && !right) return { x: -1, y: 0 };
  if (right && !left) return { x: 1, y: 0 };
  if (up && !down) return { x: 0, y: 1 };
  if (down && !up) return { x: 0, y: -1 };

  // No valid direction
  return null;
}

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
    gameState.attackDirection = direction; // Store the attack direction
    attackKeyReleased = false; // Prevent repeated attacks until released

    if (onAttackCallback) {
      onAttackCallback(direction);
    }
  }
}

export function setupInputHandlers(callbacks = {}) {
  const { onPause, onResume, onStart, onAttack } = callbacks;

  onAttackCallback = onAttack;

  window.addEventListener("keydown", (e) => {
    if (e.code === "ArrowUp" || e.code === "ArrowDown") {
      e.preventDefault();
    }

    keys[e.code] = true;

    // Handle ESC key for pause menu
    if (e.code === "Escape") {
      if (!gameState.isPaused && !gameState.hasWon) {
        // Game is running, show pause menu
        if (onPause) onPause();
      } else if (gameState.isPauseMenuOpen) {
        // Pause menu is open, resume game
        if (onResume) onResume();
      }
    }

    // Handle Space key for starting game when paused
    if (gameState.isPaused && (e.code === "Space")) {
      if (gameState.isPauseMenuOpen) {
        if (onResume) onResume();
      } else {
        if (onStart) onStart();
      }
    }

    // Handle J key for attack
    if (e.code === "KeyJ") {
      triggerAttack();
    }
  });

  window.addEventListener("keyup", (e) => {
    keys[e.code] = false;
    if (e.code === "KeyW" || e.code === "ArrowUp") {
      gameState.jumpKeyReleased = true;
    }
    // Release attack key lock when J is released
    if (e.code === "KeyJ") {
      attackKeyReleased = true;
    }
  });

  // Handle mouse click for attack
  window.addEventListener("mousedown", (e) => {
    // Only trigger on left click (button 0)
    if (e.button === 0) {
      triggerAttack();
    }
  });

  // Release attack key lock when mouse is released
  window.addEventListener("mouseup", (e) => {
    if (e.button === 0) {
      attackKeyReleased = true;
    }
  });
}

