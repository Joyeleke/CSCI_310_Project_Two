/**
 * MultiplayerManager.js - Multiplayer Game Management
 *
 * Handles all multiplayer functionality including matchmaking,
 * game synchronization, and race results.
 *
 * @module managers/MultiplayerManager
 *
 * ## Features:
 * - Server connection and matchmaking
 * - Remote player spawning and tracking
 * - Position synchronization
 * - Race countdown and start
 * - Win/lose detection
 * - Rematch functionality
 *
 * ## Multiplayer Flow:
 * 1. Player clicks "Multiplayer" button
 * 2. Connect to WebSocket server
 * 3. Wait for opponent (matchmaking)
 * 4. Countdown starts when both players ready
 * 5. Race begins - positions sync continuously
 * 6. First to top wins
 * 7. Show results, offer rematch
 *
 * ## Network Events:
 * - playerJoined: Opponent connected
 * - countdown: Race starting
 * - raceStart: Begin gameplay
 * - playerPosition: Sync opponent position
 * - playerWon: Someone reached the top
 * - playerDisconnected: Opponent left
 */

import RemotePlayer from '../entities/RemotePlayer.js';
import { networkManager } from '../network/NetworkManager.js';
import { gameState, resetPhysicsState } from '../state/gameState.js';
import { multiplayerState, resetMultiplayerState } from '../state/multiplayerState.js';
import { getSelectedModelName, getSelectedModelPath } from './ModelPreviewManager.js';
import * as SceneManager from './SceneManager.js';
import {
  SERVER_URL,
  playerWidth,
  playerHeight,
  playerDepth,
  playerStartPositionX,
  playerStartPositionY
} from '../config/constants.js';
import { LEVELS } from '../data/levelData.js';
import * as UIManager from './UIManager.js';

// ========================================
// MODULE STATE
// ========================================

/** @type {THREE.Scene|null} Reference to the game scene */
let scene = null;

/** @type {Player|null} Reference to the local player */
let player1 = null;

/** @type {HTMLElement|null} Reference to level display element */
let levelDiv = null;

// ========================================
// INITIALIZATION
// ========================================

/**
 * Initializes the multiplayer manager with scene and player references.
 * @param {THREE.Scene} sceneRef - The game scene
 * @param {Player} playerRef - The local player entity
 */
export function initMultiplayerManager(sceneRef, playerRef) {
  scene = sceneRef;
  player1 = playerRef;
  levelDiv = UIManager.getUIElements().levelDiv;

  setupUIEventListeners();
}

/**
 * Sets up UI button event listeners for multiplayer controls.
 * @private
 */
function setupUIEventListeners() {
  const elements = UIManager.getUIElements();

  if (elements.multiplayerBtn) {
    elements.multiplayerBtn.addEventListener('click', startMultiplayer);
  }

  if (elements.cancelMatchmakingBtn) {
    elements.cancelMatchmakingBtn.addEventListener('click', cancelMultiplayer);
  }

  if (elements.rematchBtn) {
    elements.rematchBtn.addEventListener('click', rematch);
  }

  if (elements.backToMenuBtn) {
    elements.backToMenuBtn.addEventListener('click', returnToMenuFromMultiplayer);
  }
}

/**
 * Starts the multiplayer matchmaking process.
 * Connects to server and waits for an opponent.
 */
export async function startMultiplayer() {
  multiplayerState.isMultiplayerMode = true;
  multiplayerState.state = 'connecting';
  UIManager.hideOverlay();
  UIManager.showConnectionOverlay('Connecting to server...');

  // Apply the selected character model to local player
  const selectedModelPath = getSelectedModelPath();
  SceneManager.changePlayerModel(selectedModelPath);

  try {
    // Connect to server
    await networkManager.connect(SERVER_URL);

    // Set up network event handlers
    setupNetworkHandlers();

    // Join a game with selected skin
    multiplayerState.state = 'waiting';
    UIManager.showConnectionOverlay('Waiting for opponent...');
    UIManager.showCancelMatchmaking();

    const skinId = getSelectedModelName().toLowerCase();
    const result = await networkManager.joinGame(skinId);

    // Set up local player position based on server assignment
    multiplayerState.localPlayerNumber = result.playerNumber;
    player1.position.x = result.startX;
    player1.position.y = playerStartPositionY;

    // If there are already other players, create remote player with their skin
    for (const p of result.players) {
      if (p.id !== result.playerId) {
        createRemotePlayer(p.x, p.y, p.skinId);
      }
    }

    // If room is already full, countdown will start via event
    if (result.state === 'countdown') {
      multiplayerState.state = 'countdown';
      UIManager.hideConnectionOverlay();
    } else if (result.state === 'waiting' && result.players.length === 1) {
      // Still waiting for opponent
      UIManager.showConnectionOverlay('Waiting for opponent...');
    }

  } catch (error) {
    console.error('Failed to start multiplayer:', error);
    UIManager.showConnectionOverlay('Connection failed. Please try again.');
    setTimeout(() => {
      cancelMultiplayer();
    }, 2000);
  }
}

/**
 * Sets up all network event handlers for multiplayer.
 * @private
 */
function setupNetworkHandlers() {
  networkManager.onPlayerJoined = (playerData) => {
    console.log('Opponent joined:', playerData);
    createRemotePlayer(playerData.x, playerData.y, playerData.skinId);
  };

  networkManager.onPlayerLeft = (data) => {
    console.log('Opponent left:', data.id);
    removeRemotePlayer();
  };

  networkManager.onPlayerPosition = (data) => {
    if (multiplayerState.remotePlayer) {
      multiplayerState.remotePlayer.setTargetPosition(data.x, data.y, data.velocityY, data.state);
    }
  };

  networkManager.onPlayerSkinChanged = (data) => {
    console.log('Opponent skin changed:', data);
    if (multiplayerState.remotePlayer && data.id !== networkManager.playerId) {
      multiplayerState.remotePlayer.setSkin(data.skinId);
    }
  };

  networkManager.onCountdown = (data) => {
    multiplayerState.state = 'countdown';
    UIManager.hideConnectionOverlay();
    UIManager.showCountdown(data.count);

    // Ensure player can't move during countdown
    gameState.isPaused = true;
    gameState.canMove = false;
  };

  networkManager.onRaceStart = () => {
    multiplayerState.state = 'racing';
    UIManager.hideCountdown();
    UIManager.showOpponentHud();

    // Start the game
    gameState.isPaused = false;
    gameState.canMove = true;
    gameState.hasWon = false;
    // Use local time for accurate timer display
    gameState.gameStartTime = performance.now();
    gameState.totalPausedTime = 0;

    // Reset physics state
    resetPhysicsState();

    if (levelDiv) levelDiv.textContent = `Level 1/${LEVELS.length} • Multiplayer`;
  };

  networkManager.onGameOver = (data) => {
    multiplayerState.state = 'finished';
    gameState.isPaused = true;
    gameState.canMove = false;
    UIManager.hideOpponentHud();

    const isWinner = data.winnerId === networkManager.playerId;
    UIManager.showRaceResult(isWinner, data.reason);
  };

  networkManager.onDisconnect = (reason) => {
    console.log('Disconnected from server:', reason);
    if (multiplayerState.state !== 'finished' && multiplayerState.state !== 'none') {
      UIManager.showConnectionOverlay('Connection lost. Returning to menu...');
      setTimeout(() => {
        cancelMultiplayer();
      }, 2000);
    }
  };

  networkManager.onError = (error) => {
    console.error('Network error:', error);
  };

  networkManager.onKnockback = (data) => {
    // Apply knockback to local player - increased effect
    gameState.velocityY = data.y;
    player1.position.x += data.x * 0.5; // Apply stronger immediate horizontal displacement

    // Flash the local player red to indicate being hit
    if (player1.group) {
      const meshes = [];
      player1.group.traverse((child) => {
        if (child.isMesh && child.material && child.material.color) {
          meshes.push({ mesh: child, originalColor: child.material.color.getHex() });
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
  };

  networkManager.onPlayerHit = (data) => {
    // Visual feedback when remote player is hit
    if (data.hitPlayerId !== networkManager.playerId && multiplayerState.remotePlayer) {
      // Flash the remote player
      if (multiplayerState.remotePlayer.group) {
        const meshes = [];
        multiplayerState.remotePlayer.group.traverse((child) => {
          if (child.isMesh && child.material && child.material.color) {
            meshes.push({ mesh: child, originalColor: child.material.color.getHex() });
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
    }
  };
}

/**
 * Creates a remote player entity at the specified position.
 * @param {number} x - Initial X position
 * @param {number} y - Initial Y position
 * @param {string} skinId - The skin/model ID for the remote player
 */
export function createRemotePlayer(x, y, skinId = "player") {
  if (multiplayerState.remotePlayer) {
    multiplayerState.remotePlayer.remove(scene);
  }
  multiplayerState.remotePlayer = new RemotePlayer(playerWidth, playerHeight, playerDepth, skinId);
  multiplayerState.remotePlayer.add(scene, x, y);
}

/**
 * Removes the remote player entity from the scene.
 */
export function removeRemotePlayer() {
  if (multiplayerState.remotePlayer) {
    multiplayerState.remotePlayer.remove(scene);
    multiplayerState.remotePlayer = null;
  }
}

/**
 * Cancels matchmaking and returns to the main menu.
 */
export function cancelMultiplayer() {
  networkManager.disconnect();
  resetMultiplayerState();
  removeRemotePlayer();
  UIManager.hideConnectionOverlay();
  UIManager.hideCountdown();
  UIManager.hideOpponentHud();
  UIManager.hideRaceResult();

  // Reset player position
  player1.position.x = playerStartPositionX;
  player1.position.y = playerStartPositionY;

  // Show main menu
  gameState.isPaused = true;
  UIManager.showStartOverlay();
}

/**
 * Returns to the main menu from multiplayer mode.
 */
export function returnToMenuFromMultiplayer() {
  cancelMultiplayer();
}

/**
 * Requests a rematch after a game ends.
 */
export function rematch() {
  UIManager.hideRaceResult();

  // Apply the selected character model to local player
  const selectedModelPath = getSelectedModelPath();
  SceneManager.changePlayerModel(selectedModelPath);

  // Reset game state for new match
  player1.position.x = multiplayerState.localPlayerNumber === 1 ? -2 : 2;
  player1.position.y = playerStartPositionY;
  gameState.velocityY = 0;
  gameState.isOnGround = false;

  // Request to join a new game with current skin
  multiplayerState.state = 'waiting';
  UIManager.showConnectionOverlay('Finding new opponent...');
  UIManager.showCancelMatchmaking();

  const skinId = getSelectedModelName().toLowerCase();
  networkManager.joinGame(skinId).then((result) => {
    multiplayerState.localPlayerNumber = result.playerNumber;
    player1.position.x = result.startX;

    for (const p of result.players) {
      if (p.id !== result.playerId) {
        createRemotePlayer(p.x, p.y, p.skinId);
      }
    }
  }).catch((error) => {
    console.error('Failed to rematch:', error);
    cancelMultiplayer();
  });
}

/**
 * Sends the player's position to the server.
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} velocityY - Vertical velocity
 */
export function sendPosition(x, y, velocityY) {
  networkManager.sendPosition(x, y, velocityY);
}

/**
 * Notifies the server that the player reached the top.
 * @param {number} completionTime - Time taken to complete
 */
export function sendReachedTop(completionTime) {
  networkManager.sendReachedTop(completionTime);
}

/**
 * Sends an attack action to the server.
 * @param {number} x - Player X position
 * @param {number} y - Player Y position
 * @param {Object} direction - Attack direction {x, y}
 */
export function sendAttack(x, y, direction) {
  networkManager.sendAttack(x, y, direction);
}

/**
 * Gets the local player's network ID.
 * @returns {string|null} The player's socket ID
 */
export function getNetworkPlayerId() {
  return networkManager.playerId;
}

