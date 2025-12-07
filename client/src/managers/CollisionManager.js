import { playerWidth, playerHeight, COLLISION_COOLDOWN } from '../config/constants.js';
import { gameState } from '../state/gameState.js';
import { multiplayerState } from '../state/multiplayerState.js';

// ========================================
// COLLISION MANAGER
// ========================================

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

