const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const env = require('../config/env');

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, roles: user.roles },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
};

// @route POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password, roles } = req.body;

  if (!name || !email || !password) {
    throw new AppError('Name, email, and password are required', 400);
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new AppError('Email already in use', 409);
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    roles: roles && roles.length ? roles : ['planner']
  });

  const token = generateToken(user);

  res.status(201).json({
    token,
    user: { id: user._id, name: user.name, email: user.email, roles: user.roles }
  });
});

// @route POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('Email and password are required', 400);
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AppError('Invalid credentials', 401);
  }

  const token = generateToken(user);

  res.json({
    token,
    user: { id: user._id, name: user.name, email: user.email, roles: user.roles }
  });
});

// @route GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  if (!user) throw new AppError('User not found', 404);

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

module.exports = { register, login, getMe };