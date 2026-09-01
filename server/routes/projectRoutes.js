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
  toggleFavorite
} = require('../controllers/projectController');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');

router.post(
  '/',
  protect,
  requireRole('planner'),
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').optional().isString(),
    body('budget.total').optional().isFloat({ min: 0 }).withMessage('Budget total must be a positive number'),
    body('schedule').optional().isArray(),
    body('venue').optional().isObject()
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

router.get('/', protect, getMyProjects);

router.get(
  '/:id',
  protect,
  [param('id').isMongoId().withMessage('Invalid project ID')],
  validate,
  getProjectById
);

router.put(
  '/:id',
  protect,
  requireRole('planner'),
  [
    param('id').isMongoId().withMessage('Invalid project ID'),
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    body('budget.total').optional().isFloat({ min: 0 }).withMessage('Budget total must be a positive number')
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