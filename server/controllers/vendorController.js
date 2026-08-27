const VendorProfile = require('../models/VendorProfile');
const User = require('../models/User');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// @route POST /api/vendors
const createVendorProfile = asyncHandler(async (req, res) => {
  const existing = await VendorProfile.findOne({ userId: req.user.id });
  if (existing) {
    throw new AppError('Vendor profile already exists', 409);
  }

  const { category, businessName, description, location, priceRange, portfolio } = req.body;

  if (!category || !businessName) {
    throw new AppError('Category and business name are required', 400);
  }

  const vendorProfile = await VendorProfile.create({
    userId: req.user.id,
    category,
    businessName,
    description,
    location,
    priceRange,
    portfolio
  });

  await User.findByIdAndUpdate(req.user.id, { vendorProfile: vendorProfile._id });

  res.status(201).json(vendorProfile);
});

// @route GET /api/vendors
const getVendors = asyncHandler(async (req, res) => {
  const { category, location, minPrice, maxPrice, search } = req.query;
  const filter = {};

  if (category) filter.category = category;
  if (location) filter.location = { $regex: location, $options: 'i' };
  if (search) filter.businessName = { $regex: search, $options: 'i' };

  if (minPrice || maxPrice) {
    filter['priceRange.min'] = {};
    if (minPrice) filter['priceRange.min'].$gte = Number(minPrice);
    if (maxPrice) filter['priceRange.max'] = { $lte: Number(maxPrice) };
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

  if (!vendor.userId.equals(req.user.id)) {
    throw new AppError('Forbidden', 403);
  }

  const { businessName, description, location, priceRange, portfolio, availability } = req.body;
  if (businessName !== undefined) vendor.businessName = businessName;
  if (description !== undefined) vendor.description = description;
  if (location !== undefined) vendor.location = location;
  if (priceRange !== undefined) vendor.priceRange = priceRange;
  if (portfolio !== undefined) vendor.portfolio = portfolio;
  if (availability !== undefined) vendor.availability = availability;

  await vendor.save();
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