import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // 1. Handle CORS preflight requests securely
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 2. Validate JWT explicitly inside Edge Function for perfect debugging and robust security
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            })
        }

        const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
        const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')
        const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')

        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error('Missing Supabase Config')
        if (!GEMINI_API_KEY) throw new Error('Missing Gemini Config')

        // 3. Create a scoped client exactly for this user request
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            global: { headers: { Authorization: authHeader } }
        })

        // 4. Securely fetch user info via Supabase backend
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            console.error('JWT Verification Failed:', authError?.message)
            return new Response(JSON.stringify({ error: 'Unauthorized: Invalid or expired token' }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            })
        }

        console.log(`✅ Authorized User: ${user.id}`)

        // 5. Parse request body
        const { imageUrl, imageBase64, scanMode } = await req.json()

        console.log(`Analyzing scan. Mode: ${scanMode}. Data Source: ${imageUrl ? 'URL' : (imageBase64 ? 'Base64' : 'Missing')}`)

        // 1. Prepare Prompt
        const modeInstructions = {
            Item: 'The user has scanned the FULL PRODUCT (front of packaging). Identify the product by its packaging, branding, and any visible information. Infer likely ingredients based on your knowledge of this product/brand.',
            Ingredient: 'The user has scanned the INGREDIENT LABEL. Carefully read and extract ALL ingredients text visible on the label. Be precise — this is the most important scan mode.',
        }

        const prompt = `You are a world-class toxicology and nutrition expert. Analyze the product shown in this image.

SCAN MODE: ${(scanMode || 'Ingredient').toUpperCase()}
${modeInstructions[scanMode] || modeInstructions.Ingredient}

INSTRUCTIONS:
1. Identify the product name and brand from the image.
2. Extract ALL visible ingredients from the label/packaging.
3. Detect product type: "food" or "cosmetic".
4. For EACH ingredient, classify it and assess risk.
5. If FOOD: estimate macros and assign nutrition grade.
6. If COSMETIC: assess risks and assign toxicity score.
7. Calculate overall toxicity score (0-100) and grade (A-E).

RESPOND ONLY WITH VALID JSON in this exact structure:
{
  "productName": "string",
  "brand": "string",
  "productType": "food" | "cosmetic",
  "overallGrade": "A" | "B" | "C" | "D" | "E",
  "toxicityScore": number,
  "summary": "string (2-3 sentences)",
  "ingredients": [
    {
      "name": "string",
      "category": "carcinogen" | "endocrine_disruptor" | "neurotoxin" | "irritant" | "allergen" | "safe",
      "riskLevel": "low" | "moderate" | "high",
      "explanation": "string"
    }
  ],
  "harmfulChemicals": [
     { "name": "string", "category": "string", "riskLevel": "string", "explanation": "string" }
  ],
  "macros": { "calories": number, "protein": number, "carbs": number, "fats": number, "sugar": number } | null,
  "nutriGrade": "A" | "B" | "C" | "D" | "E" | null,
  "cosmeticRisks": { "hormoneDisruptor": boolean, "skinIrritationRisk": "string", "toxicityScore": number } | null
}
IMPORTANT: Return ONLY the JSON object.`

        // 2. Prepare Image Data
        let finalBase64 = imageBase64

        // If URL provided, try to fetch it to get base64
        if (imageUrl) {
            try {
                const imageRes = await fetch(imageUrl)
                if (imageRes.ok) {
                    const imageBlob = await imageRes.blob()
                    const arrayBuffer = await imageBlob.arrayBuffer()
                    finalBase64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
                } else {
                    console.warn(`Failed to fetch image from URL: ${imageUrl}, falling back to base64 if available.`)
                }
            } catch (err) {
                console.error('Error fetching image URL:', err)
            }
        }

        if (!finalBase64) {
            throw new Error('No image data provided (neither URL nor Base64)')
        }

        const body = {
            contents: [{
                parts: [
                    { text: prompt },
                    { inline_data: { mime_type: "image/jpeg", data: finalBase64 } }
                ]
            }],
            generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 4096,
            }
        }

        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        })

        if (!geminiRes.ok) {
            throw new Error(`Gemini API Error: ${geminiRes.statusText}`)
        }

        const geminiData = await geminiRes.json()
        const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text
        if (!text) throw new Error('No response from Gemini')

        const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        const analysisResult = JSON.parse(cleaned)

        // 3. Return the analysis result (Frontend will handle saving for now to keep permissions simple, 
        // or we can save here if we have user context. For "Fast API", simpler to verify by returning data first).

        return new Response(
            JSON.stringify(analysisResult),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )

    } catch (error) {
        console.error(error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
    }
})
