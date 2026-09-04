const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['text', 'system'], default: 'text' },
    content: { type: String, required: true },
    systemEvent: {
      type: String,
      enum: ['invite_sent', 'invite_accepted', 'invite_declined', 'terms_proposed', 'terms_accepted', 'project_locked', 'member_left', 'member_removed', 'payment_required', null],
      default: null
    }
  },
  { timestamps: true }
);

const chatSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['single', 'group'], required: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null }, // only set for group chats
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    messages: [messageSchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Chat', chatSchema);