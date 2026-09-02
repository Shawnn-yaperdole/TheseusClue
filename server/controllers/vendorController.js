const VendorProfile = require('../models/VendorProfile');
const User = require('../models/User');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { syncVendorEmbedding } = require('../services/vendorEmbeddingService');

const buildPricing = (category, body) => {
  if (category === 'other') return undefined;

  const { priceType, fixedAmount, negotiableOpen, negotiableMin, negotiableMax } = body;

  if (priceType === 'negotiable') {
    return {
      priceType: 'negotiable',
      fixedAmount: null,
      negotiableOpen: !!negotiableOpen,
      negotiableMin: negotiableOpen ? null : Number(negotiableMin) || 0,
      negotiableMax: negotiableOpen ? null : Number(negotiableMax) || 0
    };
  }

  return {
    priceType: 'fixed',
    fixedAmount: Number(fixedAmount) || 0,
    negotiableOpen: false,
    negotiableMin: null,
    negotiableMax: null
  };
};

// @route POST /api/vendors
const createVendorProfile = asyncHandler(async (req, res) => {
  const existing = await VendorProfile.findOne({ userId: req.user.id });
  if (existing) throw new AppError('Vendor profile already exists', 409);

  const { category, customCategoryLabel, businessName, description, location } = req.body;

  if (!category) throw new AppError('Category is required', 400);
  if (!description || !description.trim()) throw new AppError('Description is required', 400);

  if (category === 'other' && (!customCategoryLabel || !customCategoryLabel.trim())) {
    throw new AppError('Please specify your vendor category', 400);
  }
  if (category !== 'other' && (!businessName || !businessName.trim())) {
    throw new AppError('Business name is required', 400);
  }

  const vendorProfile = await VendorProfile.create({
    userId: req.user.id,
    category,
    customCategoryLabel: category === 'other' ? customCategoryLabel : '',
    businessName: category === 'other' ? '' : businessName,
    description,
    location: location || '',
    pricing: buildPricing(category, req.body)
  });

  await User.findByIdAndUpdate(req.user.id, { vendorProfile: vendorProfile._id });

  try {
    await syncVendorEmbedding(vendorProfile);
  } catch (err) {
    console.error('Embedding generation failed for new vendor profile:', err.message);
  }
  
  res.status(201).json(vendorProfile);
});

// @route GET /api/vendors
const getVendors = asyncHandler(async (req, res) => {
  const { category, location, search } = req.query;
  const filter = {};

  if (category) filter.category = category;
  if (location) filter.location = { $regex: location, $options: 'i' };
  if (search) {
    filter.$or = [
      { businessName: { $regex: search, $options: 'i' } },
      { customCategoryLabel: { $regex: search, $options: 'i' } }
    ];
  }

  const vendors = await VendorProfile.find(filter)
    .populate('userId', 'name email')
    .sort({ rating: -1, createdAt: -1 });

  res.json(vendors);
});

// @route GET /api/vendors/:id
const getVendorById = asyncHandler(async (req, res) => {
  const vendor = await VendorProfile.findById(req.params.id).populate('userId', 'name email');
  if (!vendor) throw new AppError('Vendor not found', 404);
  res.json(vendor);
});

// @route PUT /api/vendors/:id
const updateVendorProfile = asyncHandler(async (req, res) => {
  const vendor = await VendorProfile.findById(req.params.id);
  if (!vendor) throw new AppError('Vendor not found', 404);
  if (!vendor.userId.equals(req.user.id)) throw new AppError('Forbidden', 403);

  const { businessName, description, location, customCategoryLabel } = req.body;

  if (description !== undefined) {
    if (!description.trim()) throw new AppError('Description is required', 400);
    vendor.description = description;
  }
  if (location !== undefined) vendor.location = location;

  if (vendor.category === 'other') {
    if (customCategoryLabel !== undefined) vendor.customCategoryLabel = customCategoryLabel;
  } else {
    if (businessName !== undefined) {
      if (!businessName.trim()) throw new AppError('Business name is required', 400);
      vendor.businessName = businessName;
    }
    const pricing = buildPricing(vendor.category, req.body);
    if (pricing) vendor.pricing = pricing;
  }

  await vendor.save();
  
  try {
    await syncVendorEmbedding(vendor);
  } catch (err) {
    console.error('Embedding refresh failed for vendor profile update:', err.message);
  }

  res.json(vendor);
});

// @route GET /api/vendors/me/profile
const getMyVendorProfile = asyncHandler(async (req, res) => {
  const vendor = await VendorProfile.findOne({ userId: req.user.id });
  if (!vendor) throw new AppError('No vendor profile found', 404);
  res.json(vendor);
});

module.exports = {
  createVendorProfile,
  getVendors,
  getVendorById,
  updateVendorProfile,
  getMyVendorProfile
};