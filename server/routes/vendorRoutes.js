const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const {
  createVendorProfile,
  getVendors,
  getVendorById,
  updateVendorProfile,
  getMyVendorProfile
} = require('../controllers/vendorController');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const { VENDOR_CATEGORY_VALUES } = require('../constants/vendorCategories');

router.post(
  '/',
  protect,
  requireRole('vendor'),
  [
    body('category').isIn(VENDOR_CATEGORY_VALUES).withMessage('Invalid category'),
    body('customCategoryLabel').optional().isString().isLength({ max: 60 }),
    body('businessName').optional().isString().isLength({ max: 100 }),
    body('description').trim().notEmpty().withMessage('Description is required').isLength({ max: 1000 }),
    body('location').optional().isString().isLength({ max: 100 }),
    body('priceType').optional().isIn(['fixed', 'negotiable']),
    body('fixedAmount').optional().isFloat({ min: 0 }),
    body('negotiableOpen').optional().isBoolean(),
    body('negotiableMin').optional().isFloat({ min: 0 }),
    body('negotiableMax').optional().isFloat({ min: 0 })
  ],
  validate,
  createVendorProfile
);

router.get('/', protect, getVendors);

router.get('/me/profile', protect, requireRole('vendor'), getMyVendorProfile);

router.get(
  '/:id',
  protect,
  [param('id').isMongoId().withMessage('Invalid vendor ID')],
  validate,
  getVendorById
);

router.put(
  '/:id',
  protect,
  requireRole('vendor'),
  [
    param('id').isMongoId().withMessage('Invalid vendor ID'),
    body('businessName').optional().isString().isLength({ max: 100 }),
    body('customCategoryLabel').optional().isString().isLength({ max: 60 }),
    body('description').optional().trim().isLength({ max: 1000 }),
    body('location').optional().isString().isLength({ max: 100 }),
    body('priceType').optional().isIn(['fixed', 'negotiable']),
    body('fixedAmount').optional().isFloat({ min: 0 }),
    body('negotiableOpen').optional().isBoolean(),
    body('negotiableMin').optional().isFloat({ min: 0 }),
    body('negotiableMax').optional().isFloat({ min: 0 })
  ],
  validate,
  updateVendorProfile
);

module.exports = router;