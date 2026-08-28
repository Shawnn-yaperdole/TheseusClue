const Notification = require('../models/Notification');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// @route GET /api/notifications
const getMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ userId: req.user.id })
    .sort({ createdAt: -1 })
    .limit(50);

  res.json(notifications);
});

// @route POST /api/notifications/:id/read
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) throw new AppError('Notification not found', 404);
  if (!notification.userId.equals(req.user.id)) throw new AppError('Forbidden', 403);

  notification.read = true;
  await notification.save();
  res.json(notification);
});

// @route POST /api/notifications/read-all
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ userId: req.user.id, read: false }, { read: true });
  res.json({ message: 'All notifications marked as read' });
});

module.exports = { getMyNotifications, markAsRead, markAllAsRead };