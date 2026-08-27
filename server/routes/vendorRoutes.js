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

const validCategories = ['venue', 'photographer', 'caterer', 'decorator', 'entertainment', 'other'];

router.post(
  '/',
  protect,
  requireRole('vendor'),
  [
    body('category').isIn(validCategories).withMessage('Invalid category'),
    body('businessName').trim().notEmpty().withMessage('Business name is required'),
    body('description').optional().isString(),
    body('location').optional().isString(),
    body('priceRange.min').optional().isFloat({ min: 0 }).withMessage('Min price must be a positive number'),
    body('priceRange.max').optional().isFloat({ min: 0 }).withMessage('Max price must be a positive number')
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
    body('businessName').optional().trim().notEmpty().withMessage('Business name cannot be empty'),
    body('priceRange.min').optional().isFloat({ min: 0 }),
    body('priceRange.max').optional().isFloat({ min: 0 })
  ],
  validate,
  updateVendorProfile
);

module.exports = router;