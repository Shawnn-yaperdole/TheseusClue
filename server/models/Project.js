const mongoose = require('mongoose');

const collaboratorSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    vendorCategory: { type: String, required: true },
    inviteStatus: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'left', 'removed'],
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
          enum: ['invited', 'accepted', 'declined', 'left', 'removed', 're-invited', 'terms_proposed', 'terms_accepted', 'terms_rejected']
        },
        at: { type: Date, default: Date.now }
      }
    ]
  },
  { _id: false } // no need for a separate _id per collaborator sub-doc; userId is the identifier
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
    venue: {
      name: { type: String, default: '' },
      address: { type: String, default: '' },
      vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
    },
    status: {
      type: String,
      enum: ['draft', 'building', 'pending_approval', 'locked', 'in_progress', 'completed', 'cancelled'],
      default: 'draft'
    },
    collaborators: [collaboratorSchema],
    groupChatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);