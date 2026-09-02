const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: [
        'invite_received',
        'invite_accepted',
        'invite_declined',
        'terms_proposed',
        'terms_accepted',
        'terms_rejected',
        'project_locked',
        'collaborator_left',
        'collaborator_removed',
        'request_received',
        'request_approved',
        'request_declined'
      ],
      required: true
    },
    message: { type: String, required: true },
    link: { type: String, default: null }, // frontend route to navigate to on click, e.g. /events/123
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
    read: { type: Boolean, default: false }
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);