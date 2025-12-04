/**
 * GamePlayer - Represents a player in a game room
 * Encapsulates player state and provides serialization for network
 */

export default class GamePlayer {
  constructor(socket, playerNumber) {
    this.id = socket.id;
    this.socket = socket;
    this.playerNumber = playerNumber;
    this.x = playerNumber === 1 ? -2 : 2;
    this.y = 0;
    this.state = {}; // Additional state info (e.g. jumping, moving)
    this.finished = false;
    this.finishTime = null;
  }

  /**
   * Update player position from network data
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {Object} state - Player state object
   */
  updatePosition(x, y, state) {
    this.x = x;
    this.y = y;
    this.state = state || {};
  }

  /**
   * Mark player as finished the race
   * @param {number} time - Finish time in milliseconds
   */
  finish(time) {
    this.finished = true;
    this.finishTime = time;
  }

  /**
   * Reset player to starting state (for rematch)
   */
  reset() {
    this.x = this.playerNumber === 1 ? -2 : 2;
    this.y = 0;
    this.state = {};
    this.finished = false;
    this.finishTime = null;
  }

  /**
   * Serialize player data for network transmission
   * Excludes socket reference which cannot be serialized
   * @returns {Object} Safe player data for JSON
   */
  toJSON() {
    return {
      id: this.id,
      playerNumber: this.playerNumber,
      x: this.x,
      y: this.y,
      state: this.state,
      finished: this.finished,
      finishTime: this.finishTime
    };
  }
}
