const { checkRegexViolations } = require('./regexContentFilter');
const { classifyMessage } = require('./semanticContentFilter');

const CATEGORY_LABELS = {
  email: 'an email address',
  social_or_link: 'a link or social media handle',
  phone_number: 'a phone number',
  full_name: 'a full name',
  address_or_location: 'a physical address or location',
  meetup_plan: 'a plan to meet outside the platform'
};

const describeCategories = (categories) => categories.map((c) => CATEGORY_LABELS[c] || c).join(', ');

// Fails CLOSED: if the semantic layer errors (rate limit, network, bad
// response), the message is blocked rather than silently allowed through.
const moderateMessage = async (text) => {
  const regexResult = checkRegexViolations(text);
  if (regexResult.violates) {
    return {
      blocked: true,
      reason: `Your message appears to contain ${describeCategories(regexResult.categories)}. Contact details can't be shared until this event is locked and paid for.`
    };
  }

  try {
    const semanticResult = await classifyMessage(text);
    if (semanticResult.violates) {
      return {
        blocked: true,
        reason: semanticResult.reason || `Your message appears to contain ${describeCategories(semanticResult.categories)}.`
      };
    }
    return { blocked: false, reason: '' };
  } catch (err) {
    console.error('Semantic content filter error, failing closed:', err.message, err.stack);
    return { blocked: true, reason: "We couldn't verify this message right now. Please try again in a moment." };
  }
};

module.exports = { moderateMessage };