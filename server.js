const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const express = require("express");
require("dotenv").config();
const app = express();
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  }),
);
app.get("/", (req, res) => {
  res.send("Socket.IO Server Running");
});

const PORT = 4000;
const ADMIN_SECRET = process.env.SOCKET_ADMIN_SECRET || "admin-secret-key";
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Handle joining rooms
  socket.on("join", (room) => {
    socket.join(room);
    console.log(`Socket ${socket.id} joined room: ${room}`);
  });

  // Handle leaving rooms
  socket.on("leave", (room) => {
    socket.leave(room);
    console.log(`Socket ${socket.id} left room: ${room}`);
  });

  // Handle admin broadcast (triggered by backend)
  socket.on("backend:trigger", (data) => {
    const { secret, room, event, payload } = data;

    if (secret !== ADMIN_SECRET) {
      console.log(`Unauthorized trigger attempt from ${socket.id}`);
      return;
    }

    if (room) {
      io.to(room).emit(event, payload);
      console.log(`Broadcast to [${room}]: ${event}`);
    } else {
      io.emit(event, payload);
      console.log(`Broadcast to all: ${event}`);
    }
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`> Socket.IO server running on port ${PORT}`);
});
