const mongoose = require('mongoose');

const customFieldSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true, maxlength: 40 },
    value: { type: String, required: true, trim: true, maxlength: 200 }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    roles: {
      type: [String],
      enum: ['planner', 'vendor'],
      default: ['planner']
    },
    organizationName: { type: String, trim: true, default: '' },
    customFields: { type: [customFieldSchema], default: [] },
    vendorProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'VendorProfile', default: null },
    avatarUrl: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);