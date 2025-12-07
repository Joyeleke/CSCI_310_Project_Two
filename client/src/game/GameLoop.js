import {
  gravity,
  fastFall,
  moveSpeed,
  glideGravity,
  glideMaxSpeed,
  glideRotationAngle,
  playerWidth,
  playerHeight,
  playerStartPositionX,
  playerStartPositionY,
  groundPositionY,
  POSITION_SEND_INTERVAL,
  ATTACK_DURATION
} from '../config/constants.js';
import { gameState, resetPhysicsState } from '../state/gameState.js';
import { multiplayerState } from '../state/multiplayerState.js';
import { getKeys } from '../managers/InputManager.js';
import { checkCollision, checkPlayerCollision } from '../managers/CollisionManager.js';
import {
  getPlatforms,
  detectCurrentLevel,
  loadLevelsAhead,
  getTotalLevels,
  getLevelHeight
} from '../managers/LevelManager.js';
import * as UIManager from '../managers/UIManager.js';
import * as SceneManager from '../managers/SceneManager.js';
import * as MultiplayerManager from '../managers/MultiplayerManager.js';

// ========================================
// GAME LOOP
// ========================================

let lastTime = performance.now();

export function startGameLoop() {
  requestAnimationFrame(gameLoop);
}

function gameLoop() {
  requestAnimationFrame(gameLoop);

  const currentTime = performance.now();
  const deltaTime = (currentTime - lastTime) / 1000;
  lastTime = currentTime;

  const player1 = SceneManager.getPlayer();
  const platforms = getPlatforms();
  const keys = getKeys();

  // Pause all gameplay updates until the user starts the game
  if (gameState.isPaused) {
    // Still update remote player interpolation when paused (during countdown)
    if (multiplayerState.remotePlayer && multiplayerState.state === 'countdown') {
      multiplayerState.remotePlayer.update();
    }
    SceneManager.render();
    return;
  }

  const prevX = player1.position.x;
  const prevY = player1.position.y;

  // Horizontal movement
  if ((keys["KeyA"] || keys["ArrowLeft"]) && gameState.canMove) {
    player1.position.x -= moveSpeed * deltaTime;
    gameState.facingDirection = -1; // Facing left
  }
  if ((keys["KeyD"] || keys["ArrowRight"]) && gameState.canMove) {
    player1.position.x += moveSpeed * deltaTime;
    gameState.facingDirection = 1; // Facing right
  }

  // Handle attack state and visual
  if (gameState.isAttacking) {
    const attackElapsed = currentTime - gameState.attackStartTime;

    if (attackElapsed < ATTACK_DURATION) {
      // Show attack indicator using the stored attack direction
      player1.showAttack(gameState.attackDirection);

      // Send attack to server on the first frame of attack (multiplayer)
      if (multiplayerState.isMultiplayerMode && multiplayerState.state === 'racing') {
        // Only send once at the start of the attack
        if (attackElapsed < 50) { // Within first 50ms
          MultiplayerManager.sendAttack(
            player1.position.x,
            player1.position.y,
            gameState.attackDirection
          );
        }
      }
    } else {
      // Attack finished
      gameState.isAttacking = false;
      gameState.attackDirection = null;
      player1.hideAttack();
    }
  }

  // Check horizontal collisions
  gameState.isOnWall = false;
  gameState.wallSide = null;
  for (const platform of platforms) {
    const collision = checkCollision(platform, player1, prevX, prevY);
    if (
      collision &&
      (collision.side === "left" || collision.side === "right")
    ) {
      player1.position.x =
        collision.side === "left"
          ? collision.position - playerWidth / 2
          : collision.position + playerWidth / 2;

      // Check if player should stick to wall (only when falling or moving slowly)
      if (!gameState.isOnGround && gameState.velocityY <= 0) {
        gameState.isOnWall = true;
        gameState.canWallJump = true;
        gameState.wallSide = collision.side;
        gameState.velocityY = 0;
      }
    }
  }

  // Jump
  if ((keys["KeyW"] || keys["ArrowUp"]) && gameState.canMove && gameState.jumpKeyReleased) {
    // Wall jump (when on wall)
    if (gameState.isOnWall && gameState.canWallJump) {
      gameState.velocityY = gameState.jumpStrength;
      gameState.isOnWall = false;
      gameState.canWallJump = false;
      gameState.wallSide = null;
      gameState.jumpKeyReleased = false;
      gameState.jumpCount = 1;
      gameState.canDoubleJump = true;
    }
    // First jump (on ground)
    else if (gameState.isOnGround) {
      gameState.velocityY = gameState.jumpStrength;
      gameState.isOnGround = false;
      gameState.jumpCount = 1;
      gameState.canDoubleJump = true;
      gameState.jumpKeyReleased = false;
    }
    // Second jump (after releasing the key)
    else if (gameState.canDoubleJump && gameState.jumpCount === 1) {
      gameState.velocityY = gameState.jumpStrength * 0.7;
      gameState.jumpCount = 2;
      gameState.canDoubleJump = false;
      gameState.jumpKeyReleased = false;
    }
  }

  // Gliding mechanics - allow gliding when falling (not on wall, not on ground)
  if ((keys["KeyW"] || keys["ArrowUp"]) && !gameState.isOnGround && !gameState.isOnWall && gameState.velocityY <= 0 && gameState.canMove) {
    gameState.isGliding = true;

    // Track glide direction based on horizontal movement
    if ((keys["KeyA"] || keys["ArrowLeft"]) && (keys["KeyD"] || keys["ArrowRight"])) {
      gameState.glideDirection = 0;
    } else if (keys["KeyA"] || keys["ArrowLeft"]) {
      gameState.glideDirection = -1;
    } else if (keys["KeyD"] || keys["ArrowRight"]) {
      gameState.glideDirection = 1;
    } else {
      gameState.glideDirection = 0;
    }

    // Apply reduced gravity while gliding
    gameState.velocityY += glideGravity * deltaTime;
    if (gameState.velocityY < glideMaxSpeed) {
      gameState.velocityY = glideMaxSpeed;
    }
  } else {
    gameState.isGliding = false;
    gameState.glideDirection = 0;
    // Apply normal gravity when not gliding and not on wall
    if (!gameState.isOnWall) {
      gameState.velocityY += gravity * deltaTime;
    }
  }

  // Player rotation based on gliding and wall sticking
  if (player1.group) {
    let targetRotationZ = 0;
    let targetRotationY = 0;

    if (gameState.isOnWall && gameState.wallSide) {
      if (gameState.wallSide === "left") {
        targetRotationY = Math.PI / 2;
      } else if (gameState.wallSide === "right") {
        targetRotationY = -Math.PI / 2;
      }
    } else if (gameState.isGliding && gameState.glideDirection !== 0) {
      targetRotationZ = gameState.glideDirection * glideRotationAngle;
    }

    const rotationSpeed = 15;
    player1.group.rotation.z += (targetRotationZ - player1.group.rotation.z) * rotationSpeed * deltaTime;
    player1.group.rotation.y += (targetRotationY - player1.group.rotation.y) * rotationSpeed * deltaTime;
  }

  // Fast fall and wall drop
  if ((keys["KeyS"] || keys["ArrowDown"]) && gameState.canMove) {
    if (gameState.isOnWall) {
      gameState.isOnWall = false;
      gameState.canWallJump = false;
      gameState.wallSide = null;
      gameState.velocityY = fastFall;
    } else if (!gameState.isOnGround && !gameState.isGliding) {
      gameState.velocityY = fastFall;
    }
  }

  // Apply vertical movement
  player1.position.y += gameState.velocityY * deltaTime;

  // Check vertical collisions
  gameState.isOnGround = false;
  for (const platform of platforms) {
    const collision = checkCollision(platform, player1, prevX, prevY);
    if (collision) {
      // Check if this is a spike platform and player is landing on top
      if (platform.isSpike && collision.side === "top") {
        SceneManager.showSpikeHitFeedback();
        gameState.canMove = false;
        gameState.velocityY = 0;

        setTimeout(() => {
          player1.position.x = playerStartPositionX;
          player1.position.y = playerStartPositionY;
          gameState.canMove = true;
          resetPhysicsState();
          // Reset timer on death
          gameState.gameStartTime = performance.now();
          gameState.totalPausedTime = 0;
        }, 500);
        SceneManager.render();
        return;
      }

      if (collision.side === "top") {
        player1.position.y = collision.position + playerHeight / 2;
        gameState.velocityY = 0;
        gameState.isOnGround = true;
        gameState.jumpCount = 0;
        gameState.canDoubleJump = false;
        gameState.jumpKeyReleased = true;
        gameState.isGliding = false;
      } else if (collision.side === "bottom") {
        player1.position.y = collision.position - playerHeight / 2;
        gameState.velocityY = 0;
      }
    }
  }

  // Death condition (fall below screen)
  if (player1.position.y - playerHeight / 2 < groundPositionY) {
    player1.position.y = groundPositionY + playerHeight / 2;
    gameState.canMove = false;
    gameState.velocityY = 0;
    gameState.isOnGround = true;

    setTimeout(() => {
      player1.position.x = playerStartPositionX;
      player1.position.y = playerStartPositionY;
      gameState.canMove = true;
      resetPhysicsState();
      // Reset timer on death
      gameState.gameStartTime = performance.now();
      gameState.totalPausedTime = 0;
    }, 500);
  }

  // ========================================
  // MULTIPLAYER SYNC & COLLISION
  // ========================================
  if (multiplayerState.isMultiplayerMode && multiplayerState.state === 'racing') {
    // Send position to server (throttled)
    if (!multiplayerState.lastPositionSendTime || currentTime - multiplayerState.lastPositionSendTime > POSITION_SEND_INTERVAL) {
      MultiplayerManager.sendPosition(
        player1.position.x,
        player1.position.y,
        gameState.velocityY
      );
      multiplayerState.lastPositionSendTime = currentTime;
    }

    // Update remote player interpolation
    if (multiplayerState.remotePlayer) {
      multiplayerState.remotePlayer.update();
      checkPlayerCollision(player1);
    }
  }

  // Camera following Player 1
  SceneManager.updateCamera(player1.position.x, player1.position.y);

  // Detect which level the player is currently in
  const levelInBounds = detectCurrentLevel(player1.position.y);

  // Update current level if player moved to a new level
  if (levelInBounds !== gameState.currentLevel) {
    gameState.currentLevel = levelInBounds;
    UIManager.updateLevelDisplay(gameState.currentLevel, getTotalLevels(), gameState.selectedDifficultyLabel);
    SceneManager.updateBackgroundForLevel(gameState.currentLevel);
  }

  // Load current level and next 2 levels ahead
  loadLevelsAhead(SceneManager.getScene(), gameState.currentLevel, 2);

  // Win detection
  if (!gameState.hasWon && player1.position.y - groundPositionY >= getLevelHeight() * getTotalLevels()) {
    gameState.hasWon = true;

    if (multiplayerState.isMultiplayerMode) {
      const completionTime = performance.now() - gameState.gameStartTime - gameState.totalPausedTime;
      MultiplayerManager.sendReachedTop(completionTime);
    } else {
      UIManager.showWinOverlay();
      gameState.isPaused = true;
    }
  }

  // Update HUD
  const playerCurrentY = player1.position.y + 6.9;
  UIManager.updateCounter(playerCurrentY);

  if (multiplayerState.isMultiplayerMode && multiplayerState.state === 'racing' && multiplayerState.remotePlayer) {
    const opponentY = multiplayerState.remotePlayer.position.y + 6.9;
    UIManager.updateOpponentHeight(opponentY);
  }

  UIManager.updateTimer(currentTime, gameState.gameStartTime, gameState.totalPausedTime);

  // Handle spike hit visual feedback timing
  SceneManager.resetSpikeHitFeedback(currentTime);

  SceneManager.render();
}

