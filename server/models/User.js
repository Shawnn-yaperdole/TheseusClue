const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true }, // hashed, never store plain text
    roles: {
      type: [String],
      enum: ['planner', 'vendor'],
      default: ['planner']
    },
    // Only populated/relevant if 'vendor' is in roles
    vendorProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'VendorProfile', default: null },
    avatarUrl: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);