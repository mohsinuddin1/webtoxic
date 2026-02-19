const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY

const GEMINI_API_URL =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

function getAnalysisPrompt(scanMode = 'Label') {
    const modeInstructions = {
        Item: 'The user has scanned the FULL PRODUCT (front of packaging). Identify the product by its packaging, branding, and any visible information. Infer likely ingredients based on your knowledge of this product/brand.',
        Label: 'The user has scanned the INGREDIENT LABEL. Carefully read and extract ALL ingredients text visible on the label. Be precise — this is the most important scan mode.',
        Barcode: 'The user has scanned the BARCODE or back of packaging. Try to identify the product from any visible text, barcodes, or brand markings, then provide ingredient analysis based on your knowledge of this product.',
    }

    return `You are a world-class toxicology and nutrition expert. Analyze the product shown in this image.

SCAN MODE: ${scanMode.toUpperCase()}
${modeInstructions[scanMode] || modeInstructions.Label}

INSTRUCTIONS:
1. Identify the product name and brand from the image.
2. Extract ALL visible ingredients from the label/packaging. If ingredients aren't clearly visible, use your knowledge of this product.
3. Detect product type: "food" or "cosmetic".
4. For EACH ingredient, classify it:
   - Categories: "carcinogen", "endocrine_disruptor", "neurotoxin", "irritant", "allergen", "safe"
   - Risk level: "low", "moderate", "high"
   - Short explanation (1 sentence)
5. If FOOD: estimate macros (calories, protein, carbs, fats, sugar) and assign a nutrition grade A-E.
6. If COSMETIC: assess hormone disruption risk, skin irritation risk, and assign toxicity score 1-5.
7. Calculate an overall toxicity score (0-100) where 0 is perfectly safe and 100 is extremely toxic.
8. Assign an overall grade: A (0-20), B (21-40), C (41-60), D (61-80), E (81-100).

RESPOND ONLY WITH VALID JSON in this exact structure:
{
  "productName": "string",
  "brand": "string",
  "productType": "food" | "cosmetic",
  "overallGrade": "A" | "B" | "C" | "D" | "E",
  "toxicityScore": number,
  "summary": "string (2-3 sentence summary of findings)",
  "ingredients": [
    {
      "name": "string",
      "category": "carcinogen" | "endocrine_disruptor" | "neurotoxin" | "irritant" | "allergen" | "safe",
      "riskLevel": "low" | "moderate" | "high",
      "explanation": "string"
    }
  ],
  "harmfulChemicals": [
    {
      "name": "string",
      "category": "string",
      "riskLevel": "string",
      "explanation": "string"
    }
  ],
  "additives": ["string"],
  "macros": {
    "calories": number | null,
    "protein": number | null,
    "carbs": number | null,
    "fats": number | null,
    "sugar": number | null
  } | null,
  "nutriGrade": "A" | "B" | "C" | "D" | "E" | null,
  "cosmeticRisks": {
    "hormoneDisruptor": boolean,
    "skinIrritationRisk": "low" | "moderate" | "high",
    "toxicityScore": number
  } | null
}

IMPORTANT: Return ONLY the JSON object, no markdown, no code blocks, no extra text.`
}

export async function analyzeProductImage(imageBase64, scanMode = 'Label') {
    if (!GEMINI_API_KEY) {
        throw new Error('Gemini API key not configured. Set VITE_GEMINI_API_KEY in .env')
    }

    const ANALYSIS_PROMPT = getAnalysisPrompt(scanMode)

    const body = {
        contents: [
            {
                parts: [
                    { text: ANALYSIS_PROMPT },
                    {
                        inline_data: {
                            mime_type: 'image/jpeg',
                            data: imageBase64,
                        },
                    },
                ],
            },
        ],
        generationConfig: {
            temperature: 0.2,
            topK: 32,
            topP: 1,
            maxOutputTokens: 4096,
        },
    }

    // Add timeout to prevent infinite loading
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    let response
    try {
        response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: controller.signal,
        })
    } catch (fetchErr) {
        clearTimeout(timeoutId)
        if (fetchErr.name === 'AbortError') {
            throw new Error('Analysis timed out. Please try again.')
        }
        throw new Error(`Network error: ${fetchErr.message}`)
    } finally {
        clearTimeout(timeoutId)
    }

    if (!response.ok) {
        const err = await response.text()
        throw new Error(`Gemini API error: ${response.status} - ${err}`)
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!text) {
        throw new Error('No response from Gemini')
    }

    // Clean the response (remove markdown code blocks if present)
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    try {
        return JSON.parse(cleaned)
    } catch {
        throw new Error('Failed to parse Gemini response as JSON')
    }
}
