/**
 * GameRoom - Manages a single game room with 2 players
 * Handles player joining, countdown, position sync, and win/disconnect logic
 */

import GamePlayer from './GamePlayer.js';

// Attack/Knockback constants
const ATTACK_RANGE = 1.2; // How far the attack hitbox extends
const ATTACK_HEIGHT = 1.2; // Height of the attack hitbox
const KNOCKBACK_X = 5; // Horizontal knockback force
const KNOCKBACK_Y = 8; // Vertical knockback force
const HIT_COOLDOWN = 500; // ms before player can be hit again

export default class GameRoom {
  constructor(id, io) {
    this.id = id;
    this.io = io;
    this.players = new Map(); // socketId maps to unique GamePlayer
    this.state = 'waiting'; //`waiting`, `countdown`, `racing`, `finished`
    this.countdownInterval = null;
    this.winnerId = null;
  }

  /**
   * Add a player to the room
   * @param {Socket} socket - The player's socket
   * @returns {Object} Join result with player info
   */
  addPlayer(socket) {
    const playerNumber = this.players.size + 1;
    
    const player = new GamePlayer(socket, playerNumber);
    
    this.players.set(socket.id, player);
    socket.join(this.id);
    socket.roomId = this.id;
    
    console.log(`Player ${playerNumber} (${socket.id}) joined room ${this.id}`);
    
    // Notify other players in the room
    socket.to(this.id).emit('playerJoined', player.toJSON());
    
    if (this.players.size === 2) {
      this.startCountdown();
    }
    
    return {
      roomId: this.id,
      playerId: socket.id,
      playerNumber,
      startX: player.x,
      players: this.getPlayersArray(),
      state: this.state
    };
  }

  /**
   * Remove a player from the room
   * @param {string} socketId - The player's socket ID
   * @returns {boolean} Whether the room is now empty
   */
  removePlayer(socketId) {
    const player = this.players.get(socketId);
    if (!player) return false;
    
    console.log(`Player ${player.playerNumber} (${socketId}) left room ${this.id}`);
    
    this.players.delete(socketId);
    
    // If game was in progress, opponent wins by forfeit
    if (this.state === 'racing' || this.state === 'countdown') {
      this.clearCountdown();
      
      // Find remaining player and declare them winner
      const remainingPlayer = this.players.values().next().value;
      if (remainingPlayer) {
        this.state = 'finished';
        this.winnerId = remainingPlayer.id;
        
        this.io.to(this.id).emit('gameOver', {
          winnerId: remainingPlayer.id,
          winnerNumber: remainingPlayer.playerNumber,
          reason: 'opponent_disconnected'
        });
      }
    }
    
    // Notify remaining players
    this.io.to(this.id).emit('playerLeft', { id: socketId });
    
    // If waiting state and player left, reset for new player
    if (this.state === 'waiting') {
      for (const p of this.players.values()) {
        p.playerNumber = 1;
        p.x = -2;
      }
    }
    
    return this.players.size === 0;
  }

  /**
   * Update a player's position and broadcast to others
   * @param {string} socketId - The player's socket ID
   * @param {Object} data - Position data { x, y, velocityY, state }
   */
  updatePosition(socketId, data) {
    const player = this.players.get(socketId);
    if (!player) return;
    
    player.updatePosition(data.x, data.y, data.state);
    
    // Broadcast to other players in the room
    this.io.to(this.id).except(socketId).emit('playerPosition', {
      id: socketId,
      x: data.x,
      y: data.y,
      velocityY: data.velocityY,
      state: data.state
    });
  }

  /**
   * Handle a player reaching the top
   * @param {string} socketId - The player's socket ID
   * @param {number} time - The player's finishing time
   */
  playerReachedTop(socketId, time) {
    if (this.state !== 'racing') return;
    
    const player = this.players.get(socketId);
    if (!player) return;
    
    player.finish(time);
    this.state = 'finished';
    this.winnerId = socketId;
    
    console.log(`Player ${player.playerNumber} won in room ${this.id}!`);
    
    this.io.to(this.id).emit('gameOver', {
      winnerId: socketId,
      winnerNumber: player.playerNumber,
      winnerTime: time,
      reason: 'reached_top'
    });
  }

  /**
   * Start the countdown sequence
   */
  startCountdown() {
    this.state = 'countdown';
    let count = 3;
    
    console.log(`Starting countdown in room ${this.id}`);
    
    // Send initial countdown
    this.io.to(this.id).emit('countdown', { count });
    
    this.countdownInterval = setInterval(() => {
      count--;
      
      if (count > 0) {
        this.io.to(this.id).emit('countdown', { count });
      } else {
        this.clearCountdown();
        this.state = 'racing';
        this.io.to(this.id).emit('raceStart', {
          timestamp: Date.now()
        });
        console.log(`Race started in room ${this.id}!`);
      }
    }, 1000);
  }

  /**
   * Clear the countdown interval
   */
  clearCountdown() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  /**
   * Get players as an array for sending to clients
   */
  getPlayersArray() {
    return Array.from(this.players.values()).map(p => p.toJSON());
  }

  /**
   * Check if room is full
   */
  isFull() {
    return this.players.size >= 2;
  }

  /**
   * Check if room is empty
   */
  isEmpty() {
    return this.players.size === 0;
  }

  /**
   * Check if room is available for joining
   */
  isAvailable() {
    return this.state === 'waiting' && !this.isFull();
  }

  /**
   * Handle an attack from a player
   * @param {string} attackerId - The attacking player's socket ID
   * @param {Object} data - Attack data { x, y, direction: { x, y } }
   */
  handleAttack(attackerId, data) {
    if (this.state !== 'racing') return;

    const attacker = this.players.get(attackerId);
    if (!attacker) return;

    const { x, y, direction } = data;
    const currentTime = Date.now();

    // Calculate attack hitbox center
    let attackCenterX = x;
    let attackCenterY = y;

    if (direction.x !== 0) {
      attackCenterX += direction.x * 0.8;
    } else {
      attackCenterY += direction.y * 0.8;
    }

    // Check collision with other players
    for (const [playerId, player] of this.players) {
      if (playerId === attackerId) continue; // Don't hit yourself

      // Check hit cooldown
      if (currentTime - player.lastHitTime < HIT_COOLDOWN) continue;

      // Get player bounds
      const playerLeft = player.x - 0.4;
      const playerRight = player.x + 0.4;
      const playerBottom = player.y - 0.7;
      const playerTop = player.y + 0.7;

      // Get attack bounds
      const attackLeft = attackCenterX - 0.4;
      const attackRight = attackCenterX + 0.4;
      const attackBottom = attackCenterY - 0.6;
      const attackTop = attackCenterY + 0.6;

      // Check AABB collision
      const isHit =
        attackRight > playerLeft &&
        attackLeft < playerRight &&
        attackBottom < playerTop &&
        attackTop > playerBottom;

      if (isHit) {
        player.lastHitTime = currentTime;

        // Calculate knockback direction
        let knockbackX = 0;
        let knockbackY = KNOCKBACK_Y; // Always some upward force

        if (direction.x !== 0) {
          // Horizontal attack - knock in attack direction
          knockbackX = direction.x * KNOCKBACK_X;
        } else if (direction.y > 0) {
          // Attack upward - knock up and slightly away
          knockbackY = KNOCKBACK_Y * 1.5;
          knockbackX = (player.x > attacker.x ? 1 : -1) * (KNOCKBACK_X * 0.5);
        } else {
          // Attack downward - knock down and away
          knockbackY = -KNOCKBACK_Y * 0.5;
          knockbackX = (player.x > attacker.x ? 1 : -1) * (KNOCKBACK_X * 0.5);
        }

        console.log(`Player ${attacker.playerNumber} hit Player ${player.playerNumber} in room ${this.id}`);

        // Notify the hit player about the knockback
        player.socket.emit('knockback', {
          x: knockbackX,
          y: knockbackY,
          attackerId: attackerId
        });

        // Notify all players about the hit for visual feedback
        this.io.to(this.id).emit('playerHit', {
          hitPlayerId: player.id,
          attackerId: attackerId,
          direction: direction
        });
      }
    }
  }
}
