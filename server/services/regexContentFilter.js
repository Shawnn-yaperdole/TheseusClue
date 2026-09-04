// Layer 1: fast, deterministic pattern matching. Catches the well-structured
// categories (email, phone, links/handles) including common obfuscation.
// Known limitation: phone regex is tuned for common US-style formats and
// won't catch every international format; the semantic layer (Layer 2)
// is the backstop for anything this misses.

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+\s*(@|\(at\)|\[at\]|\bat\b)\s*[a-zA-Z0-9.-]+\s*(\.|\bdot\b)\s*[a-zA-Z]{2,}/i;

const URL_HANDLE_REGEX = /(https?:\/\/|www\.)\S+|(\binstagram\.com\/|wa\.me\/|t\.me\/|discord\.gg\/|facebook\.com\/|twitter\.com\/|x\.com\/)\S*|@[a-zA-Z0-9_.]{3,}/i;

// Matches 10-11 raw digits, or common separated formats like 555-123-4567 / (555) 123-4567
const PHONE_REGEX = /\b\d{10,11}\b|\(?\d{3}\)?[-.\s]\d{3}[-.\s]?\d{4}\b/;

const NUMBER_WORDS = {
  zero: '0', oh: '0', one: '1', two: '2', three: '3', four: '4',
  five: '5', six: '6', seven: '7', eight: '8', nine: '9'
};

const normalizeSpelledDigits = (text) => {
  let normalized = text.toLowerCase();
  Object.entries(NUMBER_WORDS).forEach(([word, digit]) => {
    normalized = normalized.replace(new RegExp(`\\b${word}\\b`, 'g'), digit);
  });
  return normalized;
};

const checkRegexViolations = (text) => {
  const categories = [];

  if (EMAIL_REGEX.test(text)) categories.push('email');
  if (URL_HANDLE_REGEX.test(text)) categories.push('social_or_link');

  const normalized = normalizeSpelledDigits(text);
  if (PHONE_REGEX.test(normalized)) categories.push('phone_number');

  return { violates: categories.length > 0, categories };
};

module.exports = { checkRegexViolations };