require('dotenv').config();

// Centralized, validated access to environment variables.
// Import from here everywhere instead of using process.env directly.

const requiredVars = ['MONGO_URI', 'JWT_SECRET'];

const missing = requiredVars.filter((key) => !process.env[key]);
if (missing.length > 0) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

const env = {
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  VOYAGE_API_KEY: process.env.VOYAGE_API_KEY || null,
  VOYAGE_MODEL: process.env.VOYAGE_MODEL || 'voyage-4',
  PLATFORM_LOCK_FEE: Number(process.env.PLATFORM_LOCK_FEE) || 25,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || null,
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite'
};

module.exports = env;