const User = require('../models/User');
const VendorProfile = require('../models/VendorProfile');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// @route PUT /api/users/me
const updateMyProfile = asyncHandler(async (req, res) => {
  const { name, organizationName, customFields } = req.body;

  const user = await User.findById(req.user.id);
  if (!user) throw new AppError('User not found', 404);

  if (name !== undefined) user.name = name;
  if (organizationName !== undefined) user.organizationName = organizationName;
  if (customFields !== undefined) {
    // Drop any blank rows the user left empty rather than storing junk
    user.customFields = customFields.filter((f) => f.label?.trim() && f.value?.trim());
  }

  await user.save();

  res.json({
    id: user._id,
    name: user.name,
    email: user.email,
    roles: user.roles,
    organizationName: user.organizationName,
    customFields: user.customFields,
    vendorProfile: user.vendorProfile,
    avatarUrl: user.avatarUrl
  });
});

// @route GET /api/users/:id
// Public-safe view of another user — used for the profile page linked from
// collaborator rows, vendor cards, and chat headers.
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select(
    'name organizationName customFields roles avatarUrl vendorProfile'
  );
  if (!user) throw new AppError('User not found', 404);

  let vendorProfile = null;
  if (user.roles.includes('vendor') && user.vendorProfile) {
    vendorProfile = await VendorProfile.findById(user.vendorProfile).select(
      'category customCategoryLabel businessName description location pricing rating reviewCount'
    );
  }

  res.json({
    id: user._id,
    name: user.name,
    organizationName: user.organizationName,
    customFields: user.customFields,
    roles: user.roles,
    avatarUrl: user.avatarUrl,
    vendorProfile
  });
});

module.exports = { updateMyProfile, getUserProfile };