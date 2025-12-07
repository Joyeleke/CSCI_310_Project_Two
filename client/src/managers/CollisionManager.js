/**
 * CollisionManager.js - Collision Detection System
 *
 * Handles all collision detection between game entities:
 * - Player vs Platform/Wall collisions
 * - Player vs Player collisions (multiplayer)
 * - Attack hitbox vs Player collisions
 *
 * @module managers/CollisionManager
 *
 * ## Collision Types:
 * - Platform: Returns collision side (top, bottom, left, right)
 * - Spike: Triggers respawn
 * - Player: Knockback in multiplayer
 * - Attack: Damage and knockback
 *
 * ## Algorithm:
 * Uses AABB (Axis-Aligned Bounding Box) collision detection.
 * Determines collision side by checking previous position.
 */

import {
  playerWidth,
  playerHeight,
  COLLISION_COOLDOWN
} from '../config/constants.js';
import { gameState } from '../state/gameState.js';
import { multiplayerState } from '../state/multiplayerState.js';

// ========================================
// MODULE STATE
// ========================================

/** @type {number} Timestamp of last attack hit (prevents multi-hits) */
let lastAttackHitTime = 0;

// ========================================
// PLATFORM COLLISION
// ========================================

/**
 * Checks collision between player and a platform/wall.
 * Uses previous position to determine which side was hit.
 *
 * @param {Platform|Wall} platform - The platform to check against
 * @param {Player} player - The player entity
 * @param {number} prevX - Player's previous X position
 * @param {number} prevY - Player's previous Y position
 * @returns {Object|null} Collision info {side, position} or null if no collision
 *
 * @example
 * const collision = checkCollision(platform, player, prevX, prevY);
 * if (collision?.side === 'top') {
 *   // Player landed on platform
 * }
 */
export function checkCollision(platform, player, prevX, prevY) {
  const pBottom = player.position.y - playerHeight / 2;
  const pTop = player.position.y + playerHeight / 2;
  const pLeft = player.position.x - playerWidth / 2;
  const pRight = player.position.x + playerWidth / 2;

  const prevBottom = prevY - playerHeight / 2;
  const prevTop = prevY + playerHeight / 2;
  const prevLeft = prevX - playerWidth / 2;
  const prevRight = prevX + playerWidth / 2;

  const platTop = platform.position.y + platform.userData.height / 2;
  const platBottom = platform.position.y - platform.userData.height / 2;
  const platLeft = platform.position.x - platform.userData.width / 2;
  const platRight = platform.position.x + platform.userData.width / 2;

  const isOverlapping =
    pRight > platLeft &&
    pLeft < platRight &&
    pBottom < platTop &&
    pTop > platBottom;

  if (!isOverlapping) return null;

  // Use a small tolerance for edge cases
  const tolerance = 0.01;

  const wasAbove = prevBottom >= platTop - tolerance;
  const wasBelow = prevTop <= platBottom + tolerance;
  const wasLeft = prevRight <= platLeft + tolerance;
  const wasRight = prevLeft >= platRight - tolerance;

  // If none of the directional checks pass, determine collision side based on overlap amounts
  if (!wasAbove && !wasBelow && !wasLeft && !wasRight) {
    // Calculate overlap amounts for each side
    const overlapTop = pTop - platTop;
    const overlapBottom = platBottom - pBottom;
    const overlapLeft = pLeft - platLeft;
    const overlapRight = platRight - pRight;

    // Find the smallest overlap (closest to the surface)
    const minOverlap = Math.min(
      Math.abs(overlapTop),
      Math.abs(overlapBottom),
      Math.abs(overlapLeft),
      Math.abs(overlapRight)
    );

    // Determine collision side based on smallest overlap and velocity
    if (Math.abs(overlapTop) === minOverlap && gameState.velocityY <= 0) {
      return { side: "top", position: platTop };
    } else if (Math.abs(overlapBottom) === minOverlap && gameState.velocityY >= 0) {
      return { side: "bottom", position: platBottom };
    } else if (Math.abs(overlapLeft) === minOverlap) {
      return { side: "left", position: platLeft };
    } else if (Math.abs(overlapRight) === minOverlap) {
      return { side: "right", position: platRight };
    }
  }

  // Original logic with velocity checks
  if (wasAbove && gameState.velocityY <= 0) {
    return { side: "top", position: platTop };
  } else if (wasBelow && gameState.velocityY >= 0) {
    return { side: "bottom", position: platBottom };
  } else if (wasLeft) {
    return { side: "left", position: platLeft };
  } else if (wasRight) {
    return { side: "right", position: platRight };
  }

  return null;
}

// ========================================
// PLAYER-TO-PLAYER COLLISION
// ========================================

/**
 * Checks collision between local player and remote player in multiplayer.
 * Applies knockback to local player on collision.
 * Has cooldown to prevent rapid repeated collisions.
 *
 * @param {Player} player - The local player entity
 * @returns {void}
 */
export function checkPlayerCollision(player) {
  const remotePlayer = multiplayerState.remotePlayer;
  if (!remotePlayer || !remotePlayer.position) return;

  const currentTime = performance.now();
  if (currentTime - multiplayerState.lastCollisionTime < COLLISION_COOLDOWN) return;

  // Get player bounding boxes
  const p1Left = player.position.x - playerWidth / 2;
  const p1Right = player.position.x + playerWidth / 2;
  const p1Bottom = player.position.y - playerHeight / 2;
  const p1Top = player.position.y + playerHeight / 2;

  const p2Left = remotePlayer.position.x - playerWidth / 2;
  const p2Right = remotePlayer.position.x + playerWidth / 2;
  const p2Bottom = remotePlayer.position.y - playerHeight / 2;
  const p2Top = remotePlayer.position.y + playerHeight / 2;

  // Check AABB overlap
  const isColliding =
    p1Right > p2Left &&
    p1Left < p2Right &&
    p1Bottom < p2Top &&
    p1Top > p2Bottom;

  if (isColliding) {
    multiplayerState.lastCollisionTime = currentTime;

    // Calculate knockback direction (push away from remote player)
    const dx = player.position.x - remotePlayer.position.x;
    const dy = player.position.y - remotePlayer.position.y;

    // Normalize and apply knockback
    const knockbackStrength = 5;
    const length = Math.sqrt(dx * dx + dy * dy) || 1;

    // Apply horizontal knockback
    player.position.x += (dx / length) * knockbackStrength * 0.1;

    // Apply vertical knockback (bounce up slightly if on top, down if below)
    if (dy > 0) {
      gameState.velocityY = Math.max(gameState.velocityY, 8); // Bounce up
    } else {
      gameState.velocityY = Math.min(gameState.velocityY, -5); // Push down
    }

    // Visual feedback - brief flash
    if (player.group) {
      const originalMaterial = player.group.children[0]?.material;
      if (originalMaterial) {
        const originalColor = originalMaterial.color.getHex();
        originalMaterial.color.setHex(0xffffff);
        setTimeout(() => {
          originalMaterial.color.setHex(originalColor);
        }, 100);
      }
    }
  }
}

// ========================================
// ATTACK COLLISION DETECTION
// ========================================

/**
 * Checks if player's attack hits the remote player.
 * Applies visual feedback on hit and prevents multi-hits.
 *
 * @param {Player} player - The local player entity performing the attack
 * @returns {boolean} True if the attack hit the remote player, false otherwise
 */
export function checkAttackCollision(player) {
  const remotePlayer = multiplayerState.remotePlayer;
  if (!remotePlayer || !remotePlayer.position) return false;

  // Must have an attack direction
  if (!gameState.attackDirection) return false;

  // Prevent multiple hits from the same attack
  const currentTime = performance.now();
  if (currentTime - lastAttackHitTime < 300) return false;

  // Get attack bounds from player using the attack direction
  const attackBounds = player.getAttackBounds(gameState.attackDirection);
  if (!attackBounds) return false;

  // Get remote player bounds
  const p2Left = remotePlayer.position.x - playerWidth / 2;
  const p2Right = remotePlayer.position.x + playerWidth / 2;
  const p2Bottom = remotePlayer.position.y - playerHeight / 2;
  const p2Top = remotePlayer.position.y + playerHeight / 2;

  // Check AABB overlap between attack and remote player
  const isHit =
    attackBounds.right > p2Left &&
    attackBounds.left < p2Right &&
    attackBounds.bottom < p2Top &&
    attackBounds.top > p2Bottom;

  if (isHit) {
    lastAttackHitTime = currentTime;

    // Apply knockback to the local player's velocity as recoil (small)
    gameState.velocityY = Math.max(gameState.velocityY, 2);

    // Flash the remote player to indicate hit
    if (remotePlayer.group) {
      const meshes = [];
      remotePlayer.group.traverse((child) => {
        if (child.isMesh && child.material) {
          meshes.push({ mesh: child, originalColor: child.material.color ? child.material.color.getHex() : 0xffffff });
        }
      });

      meshes.forEach(({ mesh }) => {
        if (mesh.material.color) {
          mesh.material.color.setHex(0xff0000);
        }
      });

      setTimeout(() => {
        meshes.forEach(({ mesh, originalColor }) => {
          if (mesh.material.color) {
            mesh.material.color.setHex(originalColor);
          }
        });
      }, 200);
    }

    return true;
  }

  return false;
}

