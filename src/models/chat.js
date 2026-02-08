const mongoose = require('mongoose');


const messageSchema = new mongoose.Schema({
    chatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Chat",
        required: true,
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    text: {
        type: String,
        required: true,
    }
}, { timestamps: true });

const Message = mongoose.model("Message", messageSchema);


const chatSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    }],
    lastMessage: {
        text: String,
        sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        createdAt: Date
    },
    
    unreadCounts: {
        type: Map,
        of: Number,
        default: {}
    }
}, { timestamps: true });

const Chat = mongoose.model("Chat", chatSchema);

module.exports = { Chat, Message };