const mongoose = require('mongoose');

const vendorProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    category: {
      type: String,
      enum: ['venue', 'photographer', 'caterer', 'decorator', 'entertainment', 'other'],
      required: true
    },
    businessName: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    location: { type: String, default: '' },
    priceRange: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 }
    },
    portfolio: [{ type: String }], // image URLs
    availability: [{ type: Date }], // booked-out dates, or invert to "available dates" — your call later
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('VendorProfile', vendorProfileSchema);