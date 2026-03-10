const express = require('express');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const SYSTEM_PROMPT = `You are an expert visual geolocation AI. Analyze images to determine the most likely geographic location.
Examine ALL visual clues: road signs, text/language/script on signs or buildings, architectural style and era, landscape/vegetation/terrain, temples/churches/mosques, vehicles and license plates, utility poles, clothing styles, sky conditions, street layout, shadows/sun angle, any text visible.

Respond ONLY with valid JSON — no markdown, no explanation outside JSON.

Required JSON structure:
{
  "location": "City or Area Name",
  "country": "Country Name",
  "region": "State/Province/Region",
  "confidence": 75,
  "lat": 13.7563,
  "lng": 100.5018,
  "clues": [
    {"emoji":"🪧","label":"Clue type","description":"Specific observation and how it helps"},
    {"emoji":"🏛️","label":"Architecture","description":"..."},
    {"emoji":"🌿","label":"Vegetation","description":"..."}
  ],
  "reasoning": "2-3 sentence explanation of key factors that led to this location estimate.",
  "alternatives": [
    {"name":"City, Country","confidence":30,"lat":0,"lng":0},
    {"name":"City, Country","confidence":15,"lat":0,"lng":0}
  ]
}

Rules:
- confidence: integer 0-100 (realistic — 85+ only when very certain)
- lat/lng: best decimal coordinate estimate for city center or identified location
- clues: 3-6 most significant visual clues
- alternatives: 2 plausible alternative locations
- If impossible to determine location, use lat:0 lng:0 confidence:5
- IMPORTANT: Write ALL text fields (reasoning, clues[].label, clues[].description, alternatives[].name) in Thai language. Keep location, country, region as proper nouns in their native/English spelling. Coordinates remain numeric.`;

// POST /api/geo/analyze
router.post('/analyze', authMiddleware, async (req, res) => {
  try {
    const { imageBase64, mediaType } = req.body;

    if (!imageBase64 || !mediaType) {
      return res.status(400).json({ error: 'IMAGE_AND_MEDIA_TYPE_REQUIRED' });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GROQ_API_KEY_NOT_CONFIGURED' });
    }

    const body = JSON.stringify({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      max_tokens: 1024,
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mediaType};base64,${imageBase64}` },
            },
            {
              type: 'text',
              text: 'Analyze this image and identify the geographic location. Return ONLY the JSON object.',
            },
          ],
        },
      ],
    });

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body,
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'GROQ_API_ERROR' });
    }

    let raw = data.choices?.[0]?.message?.content || '';
    raw = raw.replace(/```json|```/g, '').trim();

    const result = JSON.parse(raw);
    res.json(result);
  } catch (err) {
    console.error('[GEO ERROR]', err.message);
    res.status(500).json({ error: err.message || 'INTERNAL_SERVER_ERROR' });
  }
});

module.exports = router;
