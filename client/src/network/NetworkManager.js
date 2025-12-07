/**
 * NetworkManager - Client-side networking layer for multiplayer
 *
 * Handles all communication with the game server via Socket.IO.
 * Acts as a bridge between the game logic (main.js) and the server.
 *
 */

import { io } from "socket.io-client";

class NetworkManager {
  constructor() {
    this.socket = null;
    this.playerId = null;
    this.playerNumber = null;
    this.roomId = null;
    this.startX = null;

    /** Called when another player joins the room */
    this.onPlayerJoined = null;

    /** Called when another player leaves/disconnects */
    this.onPlayerLeft = null;

    /** Called when receiving another player's position update */
    this.onPlayerPosition = null;

    /** Called during countdown (3, 2, 1) */
    this.onCountdown = null;

    /** Called when race starts (countdown finished) */
    this.onRaceStart = null;

    /** Called when game ends (win/disconnect) */
    this.onGameOver = null;

    /** Called on connection error */
    this.onError = null;

    /** Called when disconnected from server */
    this.onDisconnect = null;

    /** Called when this player gets hit and receives knockback */
    this.onKnockback = null;

    /** Called when any player gets hit (for visual feedback) */
    this.onPlayerHit = null;
  }

  /**
   * Connect to the game server
   * @param {string} serverUrl - The server URL
   * @returns {Promise<void>} Resolves when connected
   */
  connect(serverUrl) {
    return new Promise((resolve, reject) => {
      console.log(`[Network] Connecting to ${serverUrl}...`);

      this.socket = io(serverUrl, {
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      this.socket.on("connect", () => {
        console.log(`[Network] Connected! Socket ID: ${this.socket.id}`);
        resolve();
      });

      this.socket.on("connect_error", (error) => {
        console.error("[Network] Connection error:", error.message);
        if (this.onError) this.onError(error);
        reject(error);
      });

      this.socket.on("disconnect", (reason) => {
        console.log(`[Network] Disconnected: ${reason}`);
        if (this.onDisconnect) this.onDisconnect(reason);
      });

      // Game events from server
      this.socket.on("playerJoined", (playerData) => {
        console.log("[Network] Player joined:", playerData);
        if (this.onPlayerJoined) this.onPlayerJoined(playerData);
      });

      this.socket.on("playerLeft", (data) => {
        console.log("[Network] Player left:", data.id);
        if (this.onPlayerLeft) this.onPlayerLeft(data);
      });

      this.socket.on("playerPosition", (data) => {
        if (this.onPlayerPosition) this.onPlayerPosition(data);
      });

      this.socket.on("countdown", (data) => {
        console.log(`[Network] Countdown: ${data.count}`);
        if (this.onCountdown) this.onCountdown(data);
      });

      this.socket.on("raceStart", (data) => {
        console.log("[Network] Race started!");
        if (this.onRaceStart) this.onRaceStart(data);
      });

      this.socket.on("gameOver", (data) => {
        console.log("[Network] Game over:", data);
        if (this.onGameOver) this.onGameOver(data);
      });

      this.socket.on("knockback", (data) => {
        console.log("[Network] Received knockback:", data);
        if (this.onKnockback) this.onKnockback(data);
      });

      this.socket.on("playerHit", (data) => {
        console.log("[Network] Player hit:", data);
        if (this.onPlayerHit) this.onPlayerHit(data);
      });
    });
  }

  /**
   * Request to join a game room
   * Server will either put you in an existing room or create a new one
   */
  joinGame() {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error("Not connected to server"));
        return;
      }

      console.log("[Network] Requesting to join game...");

      this.socket.emit("joinGame", (response) => {
        if (response.error) {
          console.error("[Network] Failed to join:", response.error);
          reject(new Error(response.error));
          return;
        }

        this.playerId = response.playerId;
        this.playerNumber = response.playerNumber;
        this.roomId = response.roomId;
        this.startX = response.startX;

        console.log(
          `[Network] Joined room ${this.roomId} as Player ${this.playerNumber}`
        );
        resolve(response);
      });
    });
  }

  /**
   * Send local player's position to server
   * Call this frequently (~25 times/second) during gameplay
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} velocityY - Vertical velocity (for prediction)
   * @param {Object} state - Player state { isJumping, isGliding, isOnWall, etc. }
   */
  sendPosition(x, y, velocityY, state) {
    if (!this.socket) return;

    this.socket.emit("position", {
      x,
      y,
      velocityY,
      state,
    });
  }

  /**
   * Notify server that this player reached the top (finish line)
   * @param {number} time - Finishing time in milliseconds
   */
  sendReachedTop(time) {
    if (!this.socket) return;

    console.log(`[Network] Sending reachedTop with time: ${time}ms`);
    this.socket.emit("reachedTop", { time });
  }

  /**
   * Send an attack to the server
   * @param {number} x - Player X position
   * @param {number} y - Player Y position
   * @param {Object} direction - Attack direction { x: -1/0/1, y: -1/0/1 }
   */
  sendAttack(x, y, direction) {
    if (!this.socket) return;

    this.socket.emit("attack", { x, y, direction });
  }

  /**
   * Leave the current game room
   */
  leaveGame() {
    if (!this.socket) return;

    console.log("[Network] Leaving game...");
    this.socket.emit("leaveGame");

    this.playerId = null;
    this.playerNumber = null;
    this.roomId = null;
    this.startX = null;
  }

  /**
   * Disconnect from the server entirely
   */
  disconnect() {
    if (this.socket) {
      console.log("[Network] Disconnecting...");
      this.socket.disconnect();
      this.socket = null;
    }

    this.playerId = null;
    this.playerNumber = null;
    this.roomId = null;
    this.startX = null;
  }

  /**
   * Check if currently connected to server
   * @returns {boolean}
   */
  isConnected() {
    return this.socket?.connected ?? false;
  }

  /**
   * Check if currently in a game room
   * @returns {boolean}
   */
  isInRoom() {
    return this.roomId !== null;
  }
}

export const networkManager = new NetworkManager();
