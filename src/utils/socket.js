const socket = require("socket.io");
const { z } = require("zod");
const { Chat, Message } = require("../models/chat");
const User = require("../models/user"); 

const sendMessageSchema = z.object({
  userId: z.string().min(1),
  toUserId: z.string().min(1),
  text: z.string().min(1).max(2000),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

const initializeSocket = (server) => {
  const io = socket(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    
    socket.on("joinChat", ({ userId, toUserId }) => {
      const userStr = userId?.toString();
      const toUserStr = toUserId?.toString();
      if (!userStr) return;
      socket.join(userStr);
      if (toUserStr) {
          const roomId = [userStr, toUserStr].sort().join("_");
          socket.join(roomId);
      }
    });

    socket.on("sendMessage", async (payload) => {
      try {
        const validatedData = sendMessageSchema.parse(payload);
        const userId = validatedData.userId.toString();
        const toUserId = validatedData.toUserId.toString();
        const { text } = validatedData;
        const timestamp = new Date();

        let chat = await Chat.findOne({ participants: { $all: [userId, toUserId] } });

        if (!chat) {
          chat = new Chat({ participants: [userId, toUserId], unreadCounts: {} });
        }

        const newMessage = new Message({ chatId: chat._id, senderId: userId, text: text });
        await newMessage.save();

        chat.lastMessage = { text: text, sender: userId, createdAt: timestamp };
        const currentCount = chat.unreadCounts.get(toUserId) || 0;
        chat.unreadCounts.set(toUserId, currentCount + 1);
        await chat.save();

       
        const sender = await User.findById(userId).select("firstName lastName photoUrl");
        const recipient = await User.findById(toUserId).select("firstName lastName photoUrl");

    
        io.to([userId, toUserId].sort().join("_")).emit("messageReceived", {
            _id: newMessage._id,
            senderId: { _id: userId, firstName: sender.firstName, lastName: sender.lastName },
            text: text,
            createdAt: timestamp.toISOString(),
        });

        io.to(toUserId).emit("updateSidebar", {
            type: "received",
            _id: userId, 
            firstName: sender.firstName,
            lastName: sender.lastName,
            photoUrl: sender.photoUrl,
            lastMessage: text,
            lastMessageTime: timestamp.toISOString(),
            unreadCount: 1 
        });
        
     
        io.to(userId).emit("updateSidebar", {
            type: "sent",
            _id: toUserId, 
            firstName: recipient.firstName,
            lastName: recipient.lastName,
            photoUrl: recipient.photoUrl,
            lastMessage: text,
            lastMessageTime: timestamp.toISOString(),
            unreadCount: 0
        });

      } catch (err) {
        console.error("Socket Error:", err);
        if (err instanceof z.ZodError) {
            socket.emit("error", { message: err.errors[0].message });
        }
      }
    });

    socket.on("disconnect", () => {});
  });
};

module.exports = initializeSocket;