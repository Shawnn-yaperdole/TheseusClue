const Chat = require('../models/Chat');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// @route POST /api/chats/single
const getOrCreateSingleChat = asyncHandler(async (req, res) => {
  const { targetUserId } = req.body;

  if (!targetUserId) {
    throw new AppError('targetUserId is required', 400);
  }

  if (targetUserId === req.user.id) {
    throw new AppError("Can't create a chat with yourself", 400);
  }

  let chat = await Chat.findOne({
    type: 'single',
    participants: { $all: [req.user.id, targetUserId], $size: 2 }
  });

  if (!chat) {
    chat = await Chat.create({
      type: 'single',
      participants: [req.user.id, targetUserId],
      messages: []
    });
  }

  res.status(200).json(chat);
});

// @route GET /api/chats
const getMyChats = asyncHandler(async (req, res) => {
  const chats = await Chat.find({ participants: req.user.id })
    .populate('participants', 'name email')
    .populate('projectId', 'title status')
    .sort({ updatedAt: -1 });

  res.json({
    single: chats.filter((c) => c.type === 'single'),
    group: chats.filter((c) => c.type === 'group')
  });
});

// @route GET /api/chats/:id
const getChatById = asyncHandler(async (req, res) => {
  const chat = await Chat.findById(req.params.id)
    .populate('participants', 'name email')
    .populate('messages.senderId', 'name')
    .populate('projectId', 'title status');

  if (!chat) throw new AppError('Chat not found', 404);

  const isParticipant = chat.participants.some((p) => p._id.equals(req.user.id));
  if (!isParticipant) {
    throw new AppError('Forbidden', 403);
  }

  res.json(chat);
});

// Shared helper — used by both the socket layer and collaboratorController.
// Not an Express route handler, so it keeps its own try/catch-free plain async form;
// callers (socket handler, collaboratorController) are responsible for handling failures.
const addMessage = async (chatId, senderId, content, type = 'text', systemEvent = null) => {
  const chat = await Chat.findById(chatId);
  if (!chat) throw new AppError('Chat not found', 404);

  const message = { senderId, content, type, systemEvent };
  chat.messages.push(message);
  await chat.save();

  return chat.messages[chat.messages.length - 1];
};

module.exports = {
  getOrCreateSingleChat,
  getMyChats,
  getChatById,
  addMessage
};