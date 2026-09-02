const { getEmbedding } = require('./embeddingService');
const { getCategoryLabel } = require('../constants/vendorCategories');

const buildVendorEmbeddingText = (vendor) => {
  const categoryLabel = vendor.category === 'other'
    ? (vendor.customCategoryLabel || 'Other vendor')
    : getCategoryLabel(vendor.category);

  const parts = [
    `Category: ${categoryLabel}`,
    vendor.businessName ? `Business name: ${vendor.businessName}` : null,
    `Description: ${vendor.description}`,
    vendor.location ? `Location: ${vendor.location}` : null
  ].filter(Boolean);

  return parts.join('. ');
};

// Generates and stores an embedding for a vendor profile.
// Callers should wrap this in try/catch — a failed embedding should never
// block the vendor's own profile create/update, since recommendations are
// an enhancement layered on top, not a core requirement.
const syncVendorEmbedding = async (vendorDoc) => {
  const text = buildVendorEmbeddingText(vendorDoc);
  const embedding = await getEmbedding(text, 'document');
  vendorDoc.embedding = embedding;
  vendorDoc.embeddingUpdatedAt = new Date();
  await vendorDoc.save();
};

module.exports = { buildVendorEmbeddingText, syncVendorEmbedding };