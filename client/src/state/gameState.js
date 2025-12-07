import { defaultJumpStrength } from '../config/constants.js';

// ========================================
// GAME STATE
// ========================================

export const gameState = {
  // Core game state
  isPaused: true,
  isPauseMenuOpen: false,
  canMove: true,
  hasWon: false,

  // Physics state
  velocityY: 0,
  isOnGround: false,
  jumpCount: 0,
  canDoubleJump: false,
  jumpKeyReleased: true,
  isGliding: false,
  glideDirection: 0,
  isOnWall: false,
  canWallJump: false,
  wallSide: null,

  // Attack state
  isAttacking: false,
  attackStartTime: 0,
  attackCooldown: 0,
  attackDirection: null, // { x: -1/0/1, y: -1/0/1 } direction of the attack
  facingDirection: 1, // 1 = right, -1 = left

  // Jump settings
  jumpStrength: defaultJumpStrength,
  selectedDifficultyLabel: "Medium",

  // Level tracking
  currentLevel: 1,
  loadedLevels: new Set(),

  // Timer tracking
  gameStartTime: 0,
  pausedTime: 0,
  totalPausedTime: 0,

  // Spike hit visual feedback
  spikeHitTime: 0,
  isShowingSpikeHit: false,
};

// Personal Best tracking
export const personalBests = {
  easy: null,
  medium: null,
  hard: null
};

// Load personal bests from localStorage
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

// Save personal bests to localStorage
export function savePersonalBests() {
  localStorage.setItem('blocky-personal-bests', JSON.stringify(personalBests));
}

// Format time in MM:SS.MS format
export function formatTime(timeMs) {
  if (!timeMs) return null;

  const seconds = Math.floor(timeMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const displaySeconds = seconds % 60;
  const milliseconds = Math.floor((timeMs % 1000) / 10);

  return `${minutes.toString().padStart(2, '0')}:${displaySeconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
}

// Check and save new personal best
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

// Reset physics state
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

