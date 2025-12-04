import GameRoom from './GameRoom.js';

/**
 * GameState - Manages all game rooms and matchmaking
 */

export default class GameState {
  constructor(io) {
    this.io = io;
    this.rooms = new Map(); // roomId maps to a unique GameRoom
    this.roomCounter = 0;
  }

  /**
   * Find an available room or create a new one
   * @returns {GameRoom}
   */
  findOrCreateRoom() {
    for (const [_roomId, room] of this.rooms) {
      if (room.isAvailable()) {
        return room;
      }
    }

    return this.createRoom();
  }

  /**
   * Create a new game room
   * @returns {GameRoom}
   */
  createRoom() {
    this.roomCounter++;
    const roomId = `room_${this.roomCounter}_${Date.now()}`;
    const room = new GameRoom(roomId, this.io);
    this.rooms.set(roomId, room);
    
    console.log(`Created new room: ${roomId}`);
    return room;
  }

  /**
   * Get a room by ID
   * @param {string} roomId
   * @returns {GameRoom|undefined}
   */
  getRoom(roomId) {
    return this.rooms.get(roomId);
  }

  /**
   * Remove a room
   * @param {string} roomId
   */
  removeRoom(roomId) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.clearCountdown();
      this.rooms.delete(roomId);
      console.log(`Removed room: ${roomId}`);
    }
  }

  /**
   * Clean up empty rooms
   */
  cleanupEmptyRooms() {
    for (const [roomId, room] of this.rooms) {
      if (room.isEmpty()) {
        this.removeRoom(roomId);
      }
    }
  }

  /**
   * Get stats about current game state
   */
  getStats() {
    let waiting = 0;
    let playing = 0;
    let totalPlayers = 0;
    
    for (const [, room] of this.rooms) {
      totalPlayers += room.players.size;
      if (room.state === 'waiting') waiting++;
      else if (room.state === 'racing' || room.state === 'countdown') playing++;
    }
    
    return {
      totalRooms: this.rooms.size,
      waitingRooms: waiting,
      playingRooms: playing,
      totalPlayers
    };
  }
}
