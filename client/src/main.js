// ========================================
// MAIN ENTRY POINT
// ========================================

import {
  playerStartPositionX,
  playerStartPositionY,
  bgColor
} from './config/constants.js';
import { gameState, loadPersonalBests, resetPhysicsState } from './state/gameState.js';
import { LEVELS } from './data/levelData.js';
import * as SceneManager from './managers/SceneManager.js';
import * as UIManager from './managers/UIManager.js';
import * as LevelManager from './managers/LevelManager.js';
import * as MultiplayerManager from './managers/MultiplayerManager.js';
import * as ModelPreviewManager from './managers/ModelPreviewManager.js';
import { musicManager } from './managers/MusicManager.js';
import { setupInputHandlers } from './managers/InputManager.js';
import { startGameLoop } from './game/GameLoop.js';

// ========================================
// INITIALIZATION
// ========================================

// Initialize scene and get references
const { scene, player1 } = SceneManager.initScene();

// Initialize multiplayer manager
MultiplayerManager.initMultiplayerManager(scene, player1);

// Load personal bests
loadPersonalBests();
UIManager.updatePBDisplay();

// Initialize model preview and load saved selection
ModelPreviewManager.loadSelectedModel();
ModelPreviewManager.initModelPreview();

// Load initial level
LevelManager.spawnLevel(scene, 1);

// Show initial overlay
UIManager.showOverlay();
gameState.canMove = false;

// ========================================
// MUSIC SETUP
// ========================================

// Set up volume slider
const volumeSlider = document.getElementById('volume-slider');
const volumeValue = document.getElementById('volume-value');

if (volumeSlider && volumeValue) {
  // Set initial value from saved volume
  const savedVolume = Math.round(musicManager.getVolume() * 100);
  volumeSlider.value = savedVolume;
  volumeValue.textContent = `${savedVolume}%`;

  // Handle volume changes
  volumeSlider.addEventListener('input', (e) => {
    const value = parseInt(e.target.value, 10);
    musicManager.setVolume(value / 100);
    volumeValue.textContent = `${value}%`;
  });
}

// Start music on first user interaction (to avoid autoplay restrictions)
let musicStarted = false;
function startMusicOnInteraction() {
  if (!musicStarted) {
    musicManager.start();
    musicStarted = true;
  }
}

// Listen for user interactions to start music
document.addEventListener('click', startMusicOnInteraction, { once: true });
document.addEventListener('keydown', startMusicOnInteraction, { once: true });

// ========================================
// GAME CONTROL FUNCTIONS
// ========================================

function startGame() {
  const select = document.getElementById("difficulty");
  if (select) {
    const v = select.value;
    gameState.jumpStrength = v === "easy" ? 15 : v === "hard" ? 10 : 13.5;
    gameState.selectedDifficultyLabel = v === "easy" ? "Easy" : v === "hard" ? "Hard" : "Medium";
  }

  // Apply the selected character model
  const selectedModelPath = ModelPreviewManager.getSelectedModelPath();
  SceneManager.changePlayerModel(selectedModelPath);

  // Initialize timer
  gameState.gameStartTime = performance.now();
  gameState.totalPausedTime = 0;

  UIManager.hideOverlay();
  gameState.isPaused = false;
  gameState.isPauseMenuOpen = false;
  gameState.canMove = true;
  gameState.hasWon = false;

  // Reset player position
  player1.position.x = playerStartPositionX;
  player1.position.y = playerStartPositionY;
  resetPhysicsState();

  UIManager.updateLevelDisplay(1, LEVELS.length, gameState.selectedDifficultyLabel);
}

function resumeGame() {
  // Add the paused duration to total paused time
  if (gameState.pausedTime > 0) {
    gameState.totalPausedTime += performance.now() - gameState.pausedTime;
    gameState.pausedTime = 0;
  }

  gameState.isPauseMenuOpen = false;
  gameState.isPaused = false;

  UIManager.hideOverlay();
}

function restartGame() {
  // Reset all game state
  gameState.currentLevel = 1;
  gameState.hasWon = false;
  gameState.isPauseMenuOpen = false;
  gameState.isPaused = true;

  // Clear all levels
  LevelManager.clearAllLevels(scene);

  // Reset player state
  player1.position.x = playerStartPositionX;
  player1.position.y = playerStartPositionY;
  resetPhysicsState();

  // Reset background color
  SceneManager.setBackgroundColor(bgColor);

  // Show start overlay
  UIManager.showStartOverlay();

  // Reload the first level
  LevelManager.spawnLevel(scene, 1);
}

// ========================================
// UI EVENT LISTENERS
// ========================================

const elements = UIManager.getUIElements();

if (elements.startBtn) {
  elements.startBtn.addEventListener("click", () => {
    if (gameState.isPauseMenuOpen) {
      resumeGame();
    } else {
      startGame();
    }
  });
}

if (elements.restartGameBtn) {
  elements.restartGameBtn.addEventListener("click", restartGame);
}

// ========================================
// INPUT HANDLERS
// ========================================

setupInputHandlers({
  onPause: () => UIManager.showPauseMenu(),
  onResume: resumeGame,
  onStart: startGame,
  onAttack: () => {
    // Attack callback - visual feedback is handled in GameLoop
    console.log('Attack triggered!');
  }
});

// ========================================
// START GAME LOOP
// ========================================

startGameLoop();

