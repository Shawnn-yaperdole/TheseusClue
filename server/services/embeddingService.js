const env = require('../config/env');

const VOYAGE_ENDPOINT = 'https://api.voyageai.com/v1/embeddings';

// input_type must be 'document' when embedding vendor profiles (indexing),
// and 'query' when embedding a search request — Voyage optimizes each differently.
const getEmbedding = async (text, inputType = 'document') => {
  if (!env.VOYAGE_API_KEY) {
    throw new Error('Voyage API key is not configured');
  }

  const response = await fetch(VOYAGE_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.VOYAGE_API_KEY}`
    },
    body: JSON.stringify({
      input: [text],
      model: env.VOYAGE_MODEL,
      input_type: inputType,
      output_dimension: 1024
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Voyage API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
};

module.exports = { getEmbedding };