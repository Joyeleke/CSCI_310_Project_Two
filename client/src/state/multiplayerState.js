/**
 * multiplayerState.js - Multiplayer Game State
 *
 * Contains state specific to multiplayer gameplay.
 * Separate from gameState to keep concerns isolated.
 *
 * @module state/multiplayerState
 *
 * ## State Flow:
 * 1. none → connecting (player clicks multiplayer)
 * 2. connecting → waiting (connected to server)
 * 3. waiting → countdown (opponent found)
 * 4. countdown → racing (countdown finished)
 * 5. racing → finished (someone wins or disconnects)
 */

// ========================================
// MULTIPLAYER STATE
// ========================================

/**
 * Multiplayer-specific game state.
 * @type {Object}
 */
export const multiplayerState = {
  /** @type {boolean} Whether currently in multiplayer mode */
  isMultiplayerMode: false,

  /**
   * Current multiplayer state
   * @type {'none'|'connecting'|'waiting'|'countdown'|'racing'|'finished'}
   */
  state: 'none',

  /** @type {RemotePlayer|null} Reference to the remote player entity */
  remotePlayer: null,

  /** @type {number} This player's number (1 or 2) */
  localPlayerNumber: 1,

  /** @type {number} Timestamp of last position update sent to server */
  lastPositionSendTime: 0,

  /** @type {number} Timestamp of last collision with remote player */
  lastCollisionTime: 0,
};

/**
 * Resets all multiplayer state to initial values.
 * Called when leaving multiplayer or on disconnect.
 */
export function resetMultiplayerState() {
  multiplayerState.isMultiplayerMode = false;
  multiplayerState.state = 'none';
  multiplayerState.remotePlayer = null;
  multiplayerState.localPlayerNumber = 1;
  multiplayerState.lastPositionSendTime = 0;
  multiplayerState.lastCollisionTime = 0;
}

