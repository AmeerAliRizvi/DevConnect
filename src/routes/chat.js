const express = require("express");
const authUser = require("../middelware/auth");
const { Chat, Message } = require("../models/chat");
const chatRouter = express.Router();

chatRouter.get("/chat/users", authUser, async (req, res) => {
    const userId = req.user._id.toString();

    try {
        const chats = await Chat.find({ participants: userId })
            .populate("participants", "firstName lastName photoUrl")
            .sort({ updatedAt: -1 }); 

        const users = chats.map(chat => {
            const otherUser = chat.participants.find(
                p => p._id.toString() !== userId
            );

            // Safe check if otherUser exists
            if (!otherUser) return null;

            return {
                _id: otherUser._id,
                firstName: otherUser.firstName,
                lastName: otherUser.lastName,
                photoUrl: otherUser.photoUrl,
                lastMessage: chat.lastMessage?.text || null,
                lastMessageTime: chat.lastMessage?.createdAt || null,
                unreadCount: chat.unreadCounts.get(userId) || 0 // Count for ME
            };
        }).filter(Boolean); // Remove nulls

        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

chatRouter.get("/chat/:toUserId", authUser, async (req, res) => {
    const { toUserId } = req.params;
    const userId = req.user._id.toString();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    try {
        let chat = await Chat.findOne({
            participants: { $all: [userId, toUserId] }
        });

        if (!chat) {
            return res.json({ chat: null, messages: [], hasMore: false });
        }

        // RESET UNREAD COUNT for the logged-in user
        if (chat.unreadCounts.get(userId) > 0) {
            chat.unreadCounts.set(userId, 0);
            await chat.save();
        }

        const messages = await Message.find({ chatId: chat._id })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("senderId", "firstName lastName photoUrl");

        const totalMessages = await Message.countDocuments({ chatId: chat._id });
        const hasMore = totalMessages > (skip + messages.length);

        res.json({ chat, sortedMessages: messages.reverse(), hasMore });

    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

module.exports = chatRouter;