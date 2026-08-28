const express = require('express');
const router = express.Router();
const { param } = require('express-validator');
const validate = require('../middleware/validate');
const { getMyNotifications, markAsRead, markAllAsRead } = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getMyNotifications);
router.post('/read-all', protect, markAllAsRead);
router.post(
  '/:id/read',
  protect,
  [param('id').isMongoId().withMessage('Invalid notification ID')],
  validate,
  markAsRead
);

module.exports = router;