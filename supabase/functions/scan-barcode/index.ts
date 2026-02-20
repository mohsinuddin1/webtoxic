import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 1. Validate auth
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

        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            global: { headers: { Authorization: authHeader } }
        })

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            })
        }

        // 2. Parse request
        const { barcode, category } = await req.json()

        if (!barcode) {
            return new Response(JSON.stringify({ error: 'Barcode is required' }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            })
        }

        console.log(`Scanning barcode: ${barcode}, category: ${category}`)

        // 3. Call the appropriate API
        const apiUrl = category === 'cosmetics'
            ? `https://world.openbeautyfacts.org/api/v2/product/${barcode}`
            : `https://world.openfoodfacts.org/api/v2/product/${barcode}`

        const apiResponse = await fetch(apiUrl)

        if (!apiResponse.ok) {
            return new Response(JSON.stringify({
                error: 'Product not found',
                fallback: true,
                message: 'Product not found. Please use the Ingredient method instead — take a photo of the ingredient label.'
            }), {
                status: 404,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            })
        }

        const apiData = await apiResponse.json()

        if (!apiData.product) {
            return new Response(JSON.stringify({
                error: 'Product not found',
                fallback: true,
                message: 'Product not found. Please use the Ingredient method instead — take a photo of the ingredient label.'
            }), {
                status: 404,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            })
        }

        const product = apiData.product

        // ============================================================
        // 4. EXTRACT EVERYTHING DIRECTLY FROM API — zero AI cost
        // ============================================================
        const productName = product.product_name || product.product_name_en || 'Unknown Product'
        const brand = product.brands || ''
        const ingredientsText = product.ingredients_text || product.ingredients_text_en || ''
        const imageUrl = product.image_front_url || product.image_url || null

        // Macros — directly from nutriments
        const n = product.nutriments || {}
        const macros = {
            calories: Math.round(n['energy-kcal_100g'] || n['energy-kcal'] || 0),
            protein: Math.round((n.proteins_100g || n.proteins || 0) * 10) / 10,
            carbs: Math.round((n.carbohydrates_100g || n.carbohydrates || 0) * 10) / 10,
            fats: Math.round((n.fat_100g || n.fat || 0) * 10) / 10,
            sugar: Math.round((n.sugars_100g || n.sugars || 0) * 10) / 10,
            fiber: Math.round((n.fiber_100g || n.fiber || 0) * 10) / 10,
            salt: Math.round((n.salt_100g || n.salt || 0) * 100) / 100,
            saturatedFat: Math.round((n['saturated-fat_100g'] || 0) * 10) / 10,
        }

        // Nutri-Score grade (A-E) — already computed by OpenFoodFacts
        const nutriGrade = (product.nutriscore_grade || product.nutrition_grades || '').toUpperCase() || null

        // Nova group (1-4) — food processing level
        const novaGroup = product.nova_group || null

        // Allergens — cleaned tag list
        const allergens = (product.allergens_tags || []).map((t: string) => t.replace('en:', ''))

        // Additives — E-numbers
        const additives = (product.additives_tags || []).map((t: string) => t.replace('en:', ''))

        // Nutrient levels (fat/sugar/salt: low/moderate/high)
        const nutrientLevels = product.nutrient_levels || {}

        // Structured ingredient names from API
        const apiIngredientNames = (product.ingredients || []).map((ing: any) => ing.text || ing.id?.replace('en:', '')).filter(Boolean)

        // Categories
        const categories = product.categories || ''

        // If no ingredients at all, fallback
        if (!ingredientsText && apiIngredientNames.length === 0) {
            return new Response(JSON.stringify({
                error: 'Ingredients not available',
                fallback: true,
                productName,
                brand,
                message: 'Ingredients not available for this product. Please use the Ingredient method instead — take a photo of the ingredient label.'
            }), {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            })
        }

        // ============================================================
        // 5. MINIMAL Gemini call — ONLY ingredient risk classification
        // ============================================================
        const ingredientsList = ingredientsText || apiIngredientNames.join(', ')

        const prompt = `Classify each ingredient's health risk level.

Ingredients: "${ingredientsList}"
Product type: "${category === 'cosmetics' ? 'cosmetic' : 'food'}"

For each ingredient return: name, riskLevel (one of: "Cancer Causing", "Harmful", "Moderate", "Low Risk", "Unknown Risk"), effect (2-3 words max), category.
Also return: summary (1-2 sentences about overall product safety).

RESPOND ONLY WITH JSON:
{
  "summary": "string",
  "ingredients": [{"name":"string","riskLevel":"string","effect":"string","category":"carcinogen"|"endocrine_disruptor"|"neurotoxin"|"irritant"|"allergen"|"safe"}],
  "harmfulChemicals": [{"name":"string","category":"string","riskLevel":"string","explanation":"string"}]
}`

        const body = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 2048 }
        }

        const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            }
        )

        if (!geminiRes.ok) {
            throw new Error(`Gemini API Error: ${geminiRes.statusText}`)
        }

        const geminiData = await geminiRes.json()
        const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text
        if (!text) throw new Error('No response from Gemini')

        const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        let aiResult
        try {
            aiResult = JSON.parse(cleaned)
        } catch {
            const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                aiResult = JSON.parse(jsonMatch[0])
            } else {
                throw new Error('Gemini returned invalid JSON.')
            }
        }

        // ============================================================
        // 6. COMPUTE toxicityScore & overallGrade from ingredient data
        // ============================================================
        const RISK_WEIGHTS: Record<string, number> = {
            'Cancer Causing': 100,
            'Harmful': 60,
            'Moderate': 30,
            'Unknown Risk': 20,
            'Low Risk': 5,
        }

        function computeToxicityScore(ingredients: any[], nova: number | null, additivesCount: number): number {
            if (!ingredients || ingredients.length === 0) return 50

            const totalWeight = ingredients.reduce((sum: number, ing: any) => {
                return sum + (RISK_WEIGHTS[ing.riskLevel] ?? 20)
            }, 0)

            let score = totalWeight / ingredients.length

            // Penalties from API data (free, no AI)
            if (nova === 4) score += 8
            else if (nova === 3) score += 4

            score += Math.min(additivesCount * 2, 10)

            return Math.min(Math.max(Math.round(score), 0), 100)
        }

        function computeGrade(score: number): string {
            if (score <= 15) return 'A'
            if (score <= 35) return 'B'
            if (score <= 55) return 'C'
            if (score <= 75) return 'D'
            return 'E'
        }

        const toxicityScore = computeToxicityScore(aiResult.ingredients, novaGroup, additives.length)
        const overallGrade = computeGrade(toxicityScore)

        // ============================================================
        // 7. MERGE: API data (free) + AI classification + computed scores
        // ============================================================
        const finalResult = {
            // Identity — from API
            productName,
            brand,
            barcode,
            productType: category === 'cosmetics' ? 'cosmetic' : 'food',
            imageUrl,
            method: 'barcode',

            // Grades — computed from ingredient classifications + API data
            overallGrade,
            toxicityScore,
            nutriGrade,
            novaGroup,
            summary: aiResult.summary || '',

            // Ingredients — from AI classification
            ingredients: aiResult.ingredients || [],
            harmfulChemicals: aiResult.harmfulChemicals || [],

            // Macros & nutrition — directly from API (no AI needed)
            macros,
            allergens,
            additives,
            nutrientLevels,
            categories,
        }

        return new Response(
            JSON.stringify(finalResult),
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
