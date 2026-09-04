const env = require('../config/env');

const GEMINI_ENDPOINT = (model) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

const SYSTEM_INSTRUCTION = `You are a content moderation classifier for a wedding/event-planning marketplace chat. Your ONLY job is to detect whether a message attempts to share information that would let two users contact each other outside this platform, or arrange to meet in person to bypass it. This enforces a policy that payment must happen on-platform before contact details are exchanged.

Flag a message if it contains ANY of:
- A person's full name offered as a way to find or contact them elsewhere
- A physical address or specific location meant for meeting up or sending something
- A phone number, in any format, including spelled out or disguised
- An email address, in any format, including spelled out or disguised
- A specific plan, time, or place to meet in person, or a suggestion to continue the conversation elsewhere

Do NOT flag:
- Venue names, ceremony times, or schedules that are normal event-planning discussion
- General conversation, price/terms negotiation, or descriptions of services
- A vendor mentioning their own business name

Respond ONLY with strict JSON, nothing else:
{"violates": boolean, "categories": string[], "reason": string}
categories may only use: "full_name", "address_or_location", "phone_number", "email", "meetup_plan".
"reason" is a short, one-sentence, user-facing explanation if violates is true, or "" if false.`;

const classifyMessage = async (text) => {
  if (!env.GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY not set — semantic content filtering is disabled (regex layer still active).');
    return { violates: false, categories: [], reason: '' };
  }

  const response = await fetch(`${GEMINI_ENDPOINT(env.GEMINI_MODEL)}?key=${env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
      contents: [{ role: 'user', parts: [{ text }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0 }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) throw new Error('Gemini returned no classification content');

  const parsed = JSON.parse(raw);
  return {
    violates: !!parsed.violates,
    categories: Array.isArray(parsed.categories) ? parsed.categories : [],
    reason: parsed.reason || ''
  };
};

module.exports = { classifyMessage };