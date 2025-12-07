import { gameState } from '../state/gameState.js';

// ========================================
// INPUT MANAGER
// ========================================

const keys = {};

export function getKeys() {
  return keys;
}

export function isKeyPressed(keyCode) {
  return keys[keyCode] === true;
}

export function setupInputHandlers(callbacks = {}) {
  const { onPause, onResume, onStart } = callbacks;

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
  });

  window.addEventListener("keyup", (e) => {
    keys[e.code] = false;
    if (e.code === "KeyW" || e.code === "ArrowUp") {
      gameState.jumpKeyReleased = true;
    }
  });
}

