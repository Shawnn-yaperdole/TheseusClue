const jwt = require('jsonwebtoken');
const Chat = require('../models/Chat');
const { addMessage } = require('../controllers/chatController');
const env = require('../config/env');
const { moderateMessage } = require('../services/messageModerationService');
const { isFilteringExempt } = require('../services/chatFilterExemption');

const initChatSocket = (io) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication error: no token'));

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error('Authentication error: invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.userId} connected (socket ${socket.id})`);

    socket.join(socket.userId);
    // Client joins a chat "room" when they open that chat in the UI
    socket.on('join_chat', async (chatId) => {
      try {
        const chat = await Chat.findById(chatId);
        if (!chat) return;

        const isParticipant = chat.participants.some((p) => p.equals(socket.userId));
        if (!isParticipant) return; // silently ignore — not their chat

        socket.join(chatId);
      } catch (err) {
        console.error('join_chat error:', err.message);
      }
    });

    socket.on('leave_chat', (chatId) => {
      socket.leave(chatId);
    });

    // Client sends a text message
    socket.on('send_message', async ({ chatId, content }, callback) => {
      const ack = typeof callback === 'function' ? callback : () => {};

      try {
        if (!content || !content.trim()) {
          return ack({ success: false, reason: 'Message cannot be empty.' });
        }

        const chat = await Chat.findById(chatId);
        if (!chat) return ack({ success: false, reason: 'Chat not found.' });

        const exempt = await isFilteringExempt(chat);

        if (!exempt) {
          const moderation = await moderateMessage(content);
          if (moderation.blocked) {
            return ack({ success: false, reason: moderation.reason, filtered: true });
          }
        }

        const message = await addMessage(chatId, socket.userId, content, 'text');
        io.to(chatId).emit('new_message', { chatId, message });
        ack({ success: true });
      } catch (err) {
        ack({ success: false, reason: err.message });
      }
    });

    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected`);
    });
  });
};

// Helper other parts of the backend (e.g. invite/lock logic in Phase 7) can call
// to push a system message into a chat without going through a socket event directly.
const emitSystemMessage = async (io, chatId, senderId, content, systemEvent) => {
  const message = await addMessage(chatId, senderId, content, 'system', systemEvent);
  io.to(chatId).emit('new_message', { chatId, message });
  return message;
};

module.exports = { initChatSocket, emitSystemMessage };