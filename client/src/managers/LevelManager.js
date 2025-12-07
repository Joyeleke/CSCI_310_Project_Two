/**
 * LevelManager.js - Level Loading and Management
 *
 * Handles spawning, tracking, and clearing of level elements.
 * Supports dynamic level loading as the player progresses.
 *
 * @module managers/LevelManager
 *
 * ## Features:
 * - Dynamic level spawning based on player position
 * - Lazy loading (only loads levels when needed)
 * - Level clearing for game restart
 * - Platform, wall, and spike creation
 * - Level-based textures for visual variety
 *
 * ## Level Data Format:
 * Each level in LEVELS contains:
 * - platforms: Array of [x, y, width, height, isSpike]
 * - walls: Array of [x, y, width, height]
 * - color: Platform color for this level
 * - backgroundColor: Scene background color
 * - startY: Y offset for level positioning
 */

import Platform from '../entities/Platform.js';
import Wall from '../entities/Wall.js';
import Spike from '../entities/Spike.js';
import { LEVELS, LEVEL_HEIGHT } from '../data/levelData.js';
import { groundPositionY } from '../config/constants.js';
import { gameState } from '../state/gameState.js';

// ========================================
// MODULE STATE
// ========================================

/** @type {Array<Platform|Wall|Spike>} All platforms, walls, and spikes in the game */
const platforms = [];

/** @type {Platform|null} Reference to the ground platform (not cleared on restart) */
let groundPlatform = null;

// ========================================
// PLATFORM ACCESS
// ========================================

/**
 * Gets all platforms in the game (for collision detection).
 * @returns {Array<Platform|Wall|Spike>} Array of all platform objects
 */
export function getPlatforms() {
  return platforms;
}

/**
 * Sets the ground platform reference.
 * @param {Platform} ground - The ground platform
 */
export function setGroundPlatform(ground) {
  groundPlatform = ground;
}

/**
 * Gets the ground platform reference.
 * @returns {Platform|null} The ground platform
 */
export function getGroundPlatform() {
  return groundPlatform;
}

// ========================================
// LEVEL SPAWNING
// ========================================

/**
 * Spawns all elements for a specific level.
 * Does nothing if level is already loaded or invalid.
 * @param {THREE.Scene} scene - The scene to add elements to
 * @param {number} levelNumber - Level number (1-indexed)
 */
export function spawnLevel(scene, levelNumber) {
  if (levelNumber < 1 || levelNumber > LEVELS.length) return;
  if (gameState.loadedLevels.has(levelNumber)) return;

  const level = LEVELS[levelNumber - 1];

  // Spawn platforms
  for (let platformData of level.platforms) {
    const [x, yRelative, width, height, isSpike] = platformData;
    let new_platform;

    if (isSpike) {
      new_platform = new Spike(width, height);
    } else {
      new_platform = new Platform(width, height, level.color, 2, levelNumber);
    }

    new_platform.add(scene, x, yRelative + level.startY + groundPositionY + 1);
    platforms.push(new_platform);
  }

  // Spawn walls
  if (level.walls) {
    for (let wallData of level.walls) {
      const [x, yRelative, width, height] = wallData;
      const new_wall = new Wall(width, height, level.color, 2, levelNumber);

      new_wall.add(scene, x, yRelative + level.startY + groundPositionY + 1);
      platforms.push(new_wall);
    }
  }

  gameState.loadedLevels.add(levelNumber);
}

/**
 * Clears all levels from the scene (except ground).
 * Called when restarting the game.
 * @param {THREE.Scene} scene - The scene to clear from
 */
export function clearAllLevels(scene) {
  for (let i = platforms.length - 1; i >= 0; i--) {
    const platform = platforms[i];
    if (platform !== groundPlatform) {
      scene.remove(platform);
      platforms.splice(i, 1);
    }
  }

  gameState.loadedLevels.clear();
}

// ========================================
// LEVEL DETECTION
// ========================================

/**
 * Determines which level the player is currently in based on Y position.
 * @param {number} playerY - Player's Y position
 * @returns {number} Current level number (1-indexed, clamped to valid range)
 */
export function detectCurrentLevel(playerY) {
  const adjustedY = playerY - groundPositionY;
  const detectedLevel = Math.floor(adjustedY / LEVEL_HEIGHT) + 1;
  return Math.max(1, Math.min(LEVELS.length, detectedLevel));
}

/**
 * Pre-loads levels ahead of the player for smooth gameplay.
 * @param {THREE.Scene} scene - The scene to add elements to
 * @param {number} currentLevel - Current level number
 * @param {number} [count=2] - Number of levels ahead to load
 */
export function loadLevelsAhead(scene, currentLevel, count = 2) {
  const maxLevelToLoad = Math.min(currentLevel + count, LEVELS.length);
  for (let level = currentLevel; level <= maxLevelToLoad; level++) {
    if (!gameState.loadedLevels.has(level)) {
      spawnLevel(scene, level);
    }
  }
}

// ========================================
// LEVEL UTILITIES
// ========================================

/**
 * Gets the background color for a specific level.
 * @param {number} levelNumber - Level number (1-indexed)
 * @returns {number|null} Hex color value or null if not defined
 */
export function getLevelBackgroundColor(levelNumber) {
  const level = LEVELS[levelNumber - 1];
  return level?.backgroundColor || null;
}

/**
 * Gets the total number of levels in the game.
 * @returns {number} Total level count
 */
export function getTotalLevels() {
  return LEVELS.length;
}

/**
 * Gets the height of each level (for calculations).
 * @returns {number} Level height in world units
 */
export function getLevelHeight() {
  return LEVEL_HEIGHT;
}

