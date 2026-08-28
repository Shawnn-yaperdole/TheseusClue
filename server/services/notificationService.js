const Notification = require('../models/Notification');

// Creates a notification and pushes it in real time to that user's personal socket room.
// Called from collaboratorController at each lifecycle event.
const notify = async (io, userId, { type, message, link = null, projectId = null }) => {
  const notification = await Notification.create({ userId, type, message, link, projectId });

  if (io) {
    io.to(userId.toString()).emit('new_notification', notification);
  }

  return notification;
};

module.exports = { notify };