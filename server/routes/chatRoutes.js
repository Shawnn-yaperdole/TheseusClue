const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const { getOrCreateSingleChat, getMyChats, getChatById } = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

router.post(
  '/single',
  protect,
  [body('targetUserId').isMongoId().withMessage('Valid targetUserId is required')],
  validate,
  getOrCreateSingleChat
);

router.get('/', protect, getMyChats);

router.get(
  '/:id',
  protect,
  [param('id').isMongoId().withMessage('Invalid chat ID')],
  validate,
  getChatById
);

module.exports = router;