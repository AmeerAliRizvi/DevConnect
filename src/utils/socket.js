// backend/socket.js

const socket = require("socket.io");
const { Chat } = require("../models/chat");

const initializeSocket = (server) => {
  const io = socket(server, {
    cors: {
      origin: "http://localhost:5173", // Your frontend URL
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join a room between two users
    socket.on("joinChat", ({ userId, toUserId }) => {
      if (!userId || !toUserId) return;
      const roomId = [userId, toUserId].sort().join("_");
      socket.join(roomId);
      console.log(`User ${socket.id} joined room: ${roomId}`);
    });

    // Send a message
    socket.on("sendMessage", async ({ userId, toUserId, text, firstName, lastName }) => {
      try {
        const roomId = [userId, toUserId].sort().join("_");
        const timestamp = new Date();

        let chat = await Chat.findOne({
          participants: { $all: [userId, toUserId] },
        });

        const messagePayload = {
          senderId: userId,
          firstName,
          lastName,
          text,
          timestamp: timestamp.toISOString(),
        };

        // If no chat exists, create a new one
        if (!chat) {
          chat = new Chat({
            participants: [userId, toUserId],
            messages: [],
          });
        }

        // Push the message properly
        chat.messages.push(messagePayload);
        await chat.save();

        // Emit to the room
        io.to(roomId).emit("messageReceived", messagePayload);
      } catch (err) {
        console.error("Error sending message:", err.message);
        socket.emit("error", { error: "Message could not be sent" });
      }
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
};

module.exports = initializeSocket;
