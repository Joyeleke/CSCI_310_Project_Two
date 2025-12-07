import Platform from '../entities/Platform.js';
import Wall from '../entities/Wall.js';
import Spike from '../entities/Spike.js';
import { LEVELS, LEVEL_HEIGHT } from '../data/levelData.js';
import { groundPositionY } from '../config/constants.js';
import { gameState } from '../state/gameState.js';

// ========================================
// LEVEL MANAGER
// ========================================

// Platforms and game objects array
const platforms = [];
let groundPlatform = null;

export function getPlatforms() {
  return platforms;
}

export function setGroundPlatform(ground) {
  groundPlatform = ground;
}

export function getGroundPlatform() {
  return groundPlatform;
}

export function spawnLevel(scene, levelNumber) {
  if (levelNumber < 1 || levelNumber > LEVELS.length) return;
  if (gameState.loadedLevels.has(levelNumber)) return;

  const level = LEVELS[levelNumber - 1];

  // Spawn platforms
  for (let platformData of level.platforms) {
    const [x, yRelative, width, height, isSpike] = platformData;
    let new_platform;

    if (isSpike) {
      // Create a spike platform
      new_platform = new Spike(width, height);
    } else {
      // Create a normal platform with level-based texture
      new_platform = new Platform(width, height, level.color, 2, levelNumber);
    }

    new_platform.add(scene, x, yRelative + level.startY + groundPositionY + 1);
    platforms.push(new_platform);
  }

  // Spawn walls
  if (level.walls) {
    for (let wallData of level.walls) {
      const [x, yRelative, width, height] = wallData;
      // Create a wall with level-based texture
      const new_wall = new Wall(width, height, level.color, 2, levelNumber);

      new_wall.add(scene, x, yRelative + level.startY + groundPositionY + 1);
      platforms.push(new_wall);
    }
  }

  gameState.loadedLevels.add(levelNumber);
}

export function clearAllLevels(scene) {
  // Clear all platforms and walls from scene and array
  for (let i = platforms.length - 1; i >= 0; i--) {
    const platform = platforms[i];
    // Don't remove the ground platform
    if (platform !== groundPlatform) {
      scene.remove(platform);
      platforms.splice(i, 1);
    }
  }

  // Clear loaded levels set
  gameState.loadedLevels.clear();
}

export function detectCurrentLevel(playerY) {
  const adjustedY = playerY - groundPositionY;
  const detectedLevel = Math.floor(adjustedY / LEVEL_HEIGHT) + 1;
  return Math.max(1, Math.min(LEVELS.length, detectedLevel));
}

export function loadLevelsAhead(scene, currentLevel, count = 2) {
  const maxLevelToLoad = Math.min(currentLevel + count, LEVELS.length);
  for (let level = currentLevel; level <= maxLevelToLoad; level++) {
    if (!gameState.loadedLevels.has(level)) {
      spawnLevel(scene, level);
    }
  }
}

export function getLevelBackgroundColor(levelNumber) {
  const level = LEVELS[levelNumber - 1];
  return level?.backgroundColor || null;
}

export function getTotalLevels() {
  return LEVELS.length;
}

export function getLevelHeight() {
  return LEVEL_HEIGHT;
}

