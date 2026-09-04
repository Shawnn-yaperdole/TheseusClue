const mongoose = require('mongoose');
const { VENDOR_CATEGORY_VALUES } = require('../constants/vendorCategories');

const collaboratorSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    vendorCategory: { type: String, required: true },
    inviteStatus: {
      type: String,
      enum: ['pending', 'requested', 'accepted', 'declined', 'left', 'removed'],
      default: 'pending'
    },
    termsStatus: {
      type: String,
      enum: ['not_submitted', 'pending', 'accepted', 'rejected'],
      default: 'not_submitted'
    },
    proposedTerms: {
      price: { type: Number },
      deliverables: { type: String },
      dateConfirmed: { type: Date },
      notes: { type: String }
    },
    chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', default: null },
    history: [
      {
        event: {
          type: String,
          enum: ['invited', 'requested', 'accepted', 'declined', 'left', 'removed', 're-invited', 'terms_proposed', 'terms_accepted', 'terms_rejected']
        },
        at: { type: Date, default: Date.now }
      }
    ]
  },
  { _id: false }
);

const requiredVendorSchema = new mongoose.Schema(
  {
    category: { type: String, enum: VENDOR_CATEGORY_VALUES, required: true },
    customLabel: { type: String, trim: true, default: '' }, // used when category === 'other'
    fulfilled: { type: Boolean, default: false }
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    budget: {
      total: { type: Number, default: 0 },
      breakdown: [
        {
          category: { type: String },
          amount: { type: Number }
        }
      ]
    },
    schedule: [
      {
        item: { type: String },
        date: { type: Date },
        time: { type: String }
      }
    ],
    requiredVendors: [requiredVendorSchema],
    status: {
      type: String,
      enum: ['draft', 'building', 'pending_approval', 'pending_payment', 'locked', 'in_progress', 'completed', 'cancelled'],
      default: 'draft'
    },
    payment: {
      status: { type: String, enum: ['unpaid', 'paid'], default: 'unpaid' },
      amount: { type: Number, default: 0 },
      cardLast4: { type: String, default: '' },
      paidAt: { type: Date, default: null }
    },
    openToRequests: { type: Boolean, default: false },
    collaborators: [collaboratorSchema],
    favoritedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    groupChatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);