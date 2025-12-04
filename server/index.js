import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import GameState from "./GameState.js";

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:5173", // Vite dev server
      "http://localhost:4173", // Vite preview
      "https://joyeleke.github.io", // GitHub Pages production
    ],
    methods: ["GET", "POST"],
  },
});

// Initialize game state manager
const gameState = new GameState(io);

app.get("/", (req, res) => {
  const stats = gameState.getStats();
  res.json({
    status: "ok",
    game: "Blocky's Big Adventure - Multiplayer Server",
    ...stats,
  });
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log(`Player connected: ${socket.id}`);

  /**
   * Player requests to join a game
   * Finds an available room or creates a new one
   */
  socket.on("joinGame", (callback) => {
    try {
      const room = gameState.findOrCreateRoom();
      const result = room.addPlayer(socket);

      if (typeof callback === "function") {
        callback(result);
      }
    } catch (error) {
      console.error("Error joining game:", error);
      if (typeof callback === "function") {
        callback({ error: "Failed to join game" });
      }
    }
  });

  /**
   * Player sends position update
   * Broadcast to other players in the same room
   */
  socket.on("position", (data) => {
    if (!socket.roomId) return;

    const room = gameState.getRoom(socket.roomId);
    if (room) {
      room.updatePosition(socket.id, data);
    }
  });

  /**
   * Player reached the top (finish line)
   */
  socket.on("reachedTop", (data) => {
    if (!socket.roomId) return;

    const room = gameState.getRoom(socket.roomId);
    if (room) {
      room.playerReachedTop(socket.id, data?.time);
    }
  });

  /**
   * Player requests to leave current game
   */
  socket.on("leaveGame", () => {
    handlePlayerLeave(socket);
  });

  /**
   * Player disconnects (closes browser, loses connection, etc.)
   */
  socket.on("disconnect", (reason) => {
    console.log(`Player disconnected: ${socket.id} (${reason})`);
    handlePlayerLeave(socket);
  });
});

/**
 * Handle a player leaving (disconnect or manual leave)
 */
function handlePlayerLeave(socket) {
  if (!socket.roomId) return;

  const room = gameState.getRoom(socket.roomId);
  if (room) {
    const isEmpty = room.removePlayer(socket.id);

    if (isEmpty) {
      gameState.removeRoom(room.id);
    }
  }

  socket.roomId = null;
}

// Start server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Blocky's Big Adventure - Multiplayer Server: Server running on port ${PORT}`);
});

// Periodic cleanup of empty rooms (every 5 minutes)
setInterval(() => {
  gameState.cleanupEmptyRooms();
}, 5 * 60 * 1000);
