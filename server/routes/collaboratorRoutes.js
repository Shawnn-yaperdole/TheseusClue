const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const {
  inviteCollaborator,
  respondToInvite,
  proposeTerms,
  respondToTerms,
  leaveProject,
  removeCollaborator,
  requestToJoin,
  respondToRequest,
  payForProject
} = require('../controllers/collaboratorController');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');

router.post(
  '/:id/invite',
  protect,
  [
    param('id').isMongoId().withMessage('Invalid project ID'),
    body('targetUserId').isMongoId().withMessage('Valid targetUserId is required'),
    body('vendorCategory').trim().notEmpty().withMessage('Vendor category is required'),
    body('chatId').optional().isMongoId().withMessage('Invalid chat ID')
  ],
  validate,
  inviteCollaborator
);

router.post(
  '/:id/invite/respond',
  protect,
  [
    param('id').isMongoId().withMessage('Invalid project ID'),
    body('accept').isBoolean().withMessage('accept must be true or false')
  ],
  validate,
  respondToInvite
);

router.post(
  '/:id/terms',
  protect,
  [
    param('id').isMongoId().withMessage('Invalid project ID'),
    body('targetUserId').isMongoId().withMessage('Valid targetUserId is required'),
    body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('deliverables').optional().isString(),
    body('dateConfirmed').optional().isISO8601().withMessage('dateConfirmed must be a valid date'),
    body('notes').optional().isString()
  ],
  validate,
  proposeTerms
);

router.post(
  '/:id/terms/respond',
  protect,
  [
    param('id').isMongoId().withMessage('Invalid project ID'),
    body('accept').isBoolean().withMessage('accept must be true or false')
  ],
  validate,
  respondToTerms
);

router.post(
  '/:id/leave',
  protect,
  [param('id').isMongoId().withMessage('Invalid project ID')],
  validate,
  leaveProject
);

router.post(
  '/:id/remove',
  protect,
  [
    param('id').isMongoId().withMessage('Invalid project ID'),
    body('targetUserId').isMongoId().withMessage('Valid targetUserId is required')
  ],
  validate,
  removeCollaborator
);

router.post(
  '/:id/request',
  protect,
  requireRole('vendor'),
  [
    param('id').isMongoId().withMessage('Invalid project ID'),
    body('vendorCategory').trim().notEmpty().withMessage('Vendor category is required'),
    body('chatId').optional().isMongoId().withMessage('Invalid chat ID')
  ],
  validate,
  requestToJoin
);

router.post(
  '/:id/request/respond',
  protect,
  [
    param('id').isMongoId().withMessage('Invalid project ID'),
    body('targetUserId').isMongoId().withMessage('Valid targetUserId is required'),
    body('accept').isBoolean().withMessage('accept must be true or false')
  ],
  validate,
  respondToRequest
);

router.post(
  '/:id/pay',
  protect,
  [
    param('id').isMongoId().withMessage('Invalid project ID'),
    body('cardNumber').isString().isLength({ min: 12, max: 24 }),
    body('expiry').isString().isLength({ min: 4, max: 7 }),
    body('cvc').isString().isLength({ min: 3, max: 4 }),
    body('nameOnCard').isString().trim().notEmpty()
  ],
  validate,
  payForProject
);

module.exports = router;