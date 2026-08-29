const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const { updateMyProfile, getUserProfile } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.put(
  '/me',
  protect,
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('organizationName').optional().isString().isLength({ max: 100 }),
    body('customFields').optional().isArray({ max: 10 }).withMessage('Maximum 10 custom fields'),
    body('customFields.*.label').optional().isString().isLength({ max: 40 }),
    body('customFields.*.value').optional().isString().isLength({ max: 200 })
  ],
  validate,
  updateMyProfile
);

router.get(
  '/:id',
  protect,
  [param('id').isMongoId().withMessage('Invalid user ID')],
  validate,
  getUserProfile
);

module.exports = router;