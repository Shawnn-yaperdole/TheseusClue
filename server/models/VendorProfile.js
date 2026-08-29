const mongoose = require('mongoose');
const { VENDOR_CATEGORY_VALUES } = require('../constants/vendorCategories');

const vendorProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    category: {
      type: String,
      enum: VENDOR_CATEGORY_VALUES,
      required: true
    },
    customCategoryLabel: { type: String, trim: true, default: '' }, // only used when category === 'other'
    businessName: { type: String, trim: true, default: '' }, // not required for 'other'
    description: { type: String, required: true, trim: true },
    location: { type: String, default: '' },
    pricing: {
      priceType: { type: String, enum: ['fixed', 'negotiable'], default: 'fixed' },
      fixedAmount: { type: Number, default: null },
      negotiableOpen: { type: Boolean, default: false },
      negotiableMin: { type: Number, default: null },
      negotiableMax: { type: Number, default: null }
    },
    portfolio: [{ type: String }],
    availability: [{ type: Date }],
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('VendorProfile', vendorProfileSchema);