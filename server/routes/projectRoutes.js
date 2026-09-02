const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const {
  createProject,
  getMyProjects,
  getProjectById,
  updateProject,
  deleteProject,
  toggleFavorite,
  toggleOpenToRequests,
  getOpenProjects,
  getRecommendations
} = require('../controllers/projectController');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const { VENDOR_CATEGORY_VALUES } = require('../constants/vendorCategories');

router.post(
  '/',
  protect,
  requireRole('planner'),
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').optional().isString(),
    body('budget.total').optional().isFloat({ min: 0 }).withMessage('Budget total must be a positive number'),
    body('schedule').optional().isArray(),
  ],
  validate,
  createProject
);

router.post(
  '/:id/favorite',
  protect,
  [param('id').isMongoId().withMessage('Invalid project ID')],
  validate,
  toggleFavorite
);

router.post(
  '/:id/toggle-open',
  protect,
  requireRole('planner'),
  [param('id').isMongoId().withMessage('Invalid project ID')],
  validate,
  toggleOpenToRequests
);

router.get('/open/browse', protect, requireRole('vendor'), getOpenProjects);

router.get('/', protect, getMyProjects);

router.get(
  '/:id',
  protect,
  [param('id').isMongoId().withMessage('Invalid project ID')],
  validate,
  getProjectById
);

router.get(
  '/:id/recommendations',
  protect,
  requireRole('planner'),
  [param('id').isMongoId().withMessage('Invalid project ID')],
  validate,
  getRecommendations
);

router.put(
  '/:id',
  protect,
  requireRole('planner'),
  [
    param('id').isMongoId().withMessage('Invalid project ID'),
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    body('budget.total').optional().isFloat({ min: 0 }).withMessage('Budget total must be a positive number'),
    body('requiredVendors').optional().isArray({ max: 20 }).withMessage('Too many required vendor entries'),
    body('requiredVendors.*.category').optional().isIn(VENDOR_CATEGORY_VALUES).withMessage('Invalid vendor category'),
    body('requiredVendors.*.customLabel').optional().isString().isLength({ max: 60 }),
    body('requiredVendors.*.fulfilled').optional().isBoolean()
  ],
  validate,
  updateProject
);

router.delete(
  '/:id',
  protect,
  requireRole('planner'),
  [param('id').isMongoId().withMessage('Invalid project ID')],
  validate,
  deleteProject
);

module.exports = router;