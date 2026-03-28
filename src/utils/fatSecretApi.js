/**
 * FatSecret Platform API v2 Integration
 * 
 * Uses OAuth 2.0 Client Credentials flow.
 * Requests are proxied through Vite dev server to avoid CORS.
 */

const CLIENT_ID = import.meta.env.VITE_FATSECRET_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_FATSECRET_CLIENT_SECRET;
const CACHE_KEY = 'gymplanner_fatsecret_food_cache';

let cachedToken = null;
let tokenExpiry = 0;

// ─── OAuth 2.0 Token ───

async function getAccessToken() {
  // Return cached token if still valid
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const response = await fetch('/fatsecret-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      scope: 'basic',
    }),
  });

  if (!response.ok) {
    throw new Error(`Token request failed: ${response.status}`);
  }

  const data = await response.json();
  cachedToken = data.access_token;
  // Set expiry 5 minutes before actual to be safe
  tokenExpiry = Date.now() + (data.expires_in - 300) * 1000;
  return cachedToken;
}


// ─── API Calls ───

async function apiCall(params) {
  const token = await getAccessToken();

  const response = await fetch('/fatsecret-api', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      ...params,
      format: 'json',
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('FatSecret API error response:', text);
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json();
}


// ─── Search Foods ───

/**
 * Search FatSecret for foods by query.
 * @param {string} query - Search term
 * @param {number} page - Page number (0-indexed)
 * @param {number} maxResults - Max results per page (default 20)
 * @returns {Promise<{foods: Array, totalResults: number}>}
 */
export async function searchFatSecretFoods(query, page = 0, maxResults = 20) {
  if (!query || query.trim().length < 2) return { foods: [], totalResults: 0 };

  try {
    const data = await apiCall({
      method: 'foods.search',
      search_expression: query.trim(),
      page_number: page,
      max_results: maxResults,
    });

    if (!data.foods?.food) return { foods: [], totalResults: 0 };

    // Normalize to array (API returns object if single result)
    const rawFoods = Array.isArray(data.foods.food)
      ? data.foods.food
      : [data.foods.food];

    const foods = rawFoods.map(f => normalizeFatSecretSearchResult(f));

    return {
      foods,
      totalResults: parseInt(data.foods.total_results) || 0,
    };
  } catch (err) {
    console.error('FatSecret search error:', err);
    return { foods: [], totalResults: 0 };
  }
}


// ─── Get Food Detail ───

/**
 * Get full nutrition detail for a specific food.
 * @param {string|number} foodId - FatSecret food ID
 * @returns {Promise<Object|null>}
 */
export async function getFatSecretFoodDetail(foodId) {
  try {
    const data = await apiCall({
      method: 'food.get.v4',
      food_id: foodId,
    });

    if (!data.food) return null;

    const normalized = normalizeFatSecretDetail(data.food);

    // Cache it for offline use
    cacheFoodLocally(normalized);

    return normalized;
  } catch (err) {
    console.error('FatSecret detail error:', err);
    // Try to return from cache
    return getCachedFood(String(foodId));
  }
}


// ─── Normalization ───

/**
 * Parse the description string from search results.
 * FatSecret returns something like: 
 * "Per 1 tbsp - Calories: 94kcal | Fat: 8.00g | Carbs: 3.50g | Protein: 3.80g"
 */
function parseDescription(desc) {
  if (!desc) return { calories: 0, fats: 0, carbs: 0, protein: 0, servingDesc: '' };

  const result = { calories: 0, fats: 0, carbs: 0, protein: 0, servingDesc: '' };

  // Extract serving description (e.g., "Per 1 tbsp")
  const servingMatch = desc.match(/^Per\s+(.+?)\s*-/i);
  if (servingMatch) result.servingDesc = servingMatch[1];

  // Extract values
  const calMatch = desc.match(/Calories:\s*([\d.]+)/i);
  const fatMatch = desc.match(/Fat:\s*([\d.]+)/i);
  const carbMatch = desc.match(/Carbs:\s*([\d.]+)/i);
  const protMatch = desc.match(/Protein:\s*([\d.]+)/i);

  if (calMatch) result.calories = parseFloat(calMatch[1]);
  if (fatMatch) result.fats = parseFloat(fatMatch[1]);
  if (carbMatch) result.carbs = parseFloat(carbMatch[1]);
  if (protMatch) result.protein = parseFloat(protMatch[1]);

  return result;
}

/**
 * Normalize a search result item to our internal format.
 */
function normalizeFatSecretSearchResult(item) {
  const parsed = parseDescription(item.food_description);

  return {
    id: `fs_${item.food_id}`,
    fatSecretId: item.food_id,
    name: item.food_name || 'Unknown',
    brand: item.brand_name || null,
    category: item.food_type === 'Brand' ? 'Branded' : 'Generic',
    servingSize: parsed.servingDesc || '1 serving',
    servingGrams: 100, // Will be refined on detail fetch
    availableUnits: ['serving', 'g'],
    calories: parsed.calories,
    protein: parsed.protein,
    carbs: parsed.carbs,
    fats: parsed.fats,
    // Micros not available in search, only in detail
    saturatedFat: 0,
    polyunsaturatedFat: 0,
    monounsaturatedFat: 0,
    cholesterol: 0,
    sodium: 0,
    fiber: 0,
    sugar: 0,
    potassium: 0,
    vitaminA: 0,
    vitaminC: 0,
    calcium: 0,
    iron: 0,
    isFatSecret: true,
    _needsDetailFetch: true,
  };
}

/**
 * Normalize a full food detail response.
 */
function normalizeFatSecretDetail(food) {
  // Get the default serving (usually the first one, or "per 100g")
  let servings = food.servings?.serving;
  if (!servings) return null;
  if (!Array.isArray(servings)) servings = [servings];

  // Prefer "per 100g" or the first serving
  const serving = servings.find(s =>
    s.measurement_description?.toLowerCase().includes('100') ||
    s.metric_serving_unit === 'g'
  ) || servings[0];

  const availableUnits = [...new Set(
    servings.map(s => s.measurement_description?.toLowerCase() || 'serving')
  )].slice(0, 5);

  return {
    id: `fs_${food.food_id}`,
    fatSecretId: food.food_id,
    name: food.food_name || 'Unknown',
    brand: food.brand_name || null,
    category: food.food_type === 'Brand' ? 'Branded' : 'Generic',
    servingSize: serving.serving_description || '1 serving',
    servingGrams: parseFloat(serving.metric_serving_amount) || 100,
    availableUnits,
    calories: parseFloat(serving.calories) || 0,
    protein: parseFloat(serving.protein) || 0,
    carbs: parseFloat(serving.carbohydrate) || 0,
    fats: parseFloat(serving.fat) || 0,
    saturatedFat: parseFloat(serving.saturated_fat) || 0,
    polyunsaturatedFat: parseFloat(serving.polyunsaturated_fat) || 0,
    monounsaturatedFat: parseFloat(serving.monounsaturated_fat) || 0,
    cholesterol: parseFloat(serving.cholesterol) || 0,
    sodium: parseFloat(serving.sodium) || 0,
    fiber: parseFloat(serving.fiber) || 0,
    sugar: parseFloat(serving.sugar) || 0,
    potassium: parseFloat(serving.potassium) || 0,
    vitaminA: parseFloat(serving.vitamin_a) || 0,
    vitaminC: parseFloat(serving.vitamin_c) || 0,
    calcium: parseFloat(serving.calcium) || 0,
    iron: parseFloat(serving.iron) || 0,
    isFatSecret: true,
    _needsDetailFetch: false,
    // Store all servings for unit switching
    _allServings: servings.map(s => ({
      id: s.serving_id,
      description: s.serving_description,
      measurement: s.measurement_description,
      metricAmount: parseFloat(s.metric_serving_amount) || 0,
      metricUnit: s.metric_serving_unit || 'g',
      calories: parseFloat(s.calories) || 0,
      protein: parseFloat(s.protein) || 0,
      carbs: parseFloat(s.carbohydrate) || 0,
      fats: parseFloat(s.fat) || 0,
      saturatedFat: parseFloat(s.saturated_fat) || 0,
      polyunsaturatedFat: parseFloat(s.polyunsaturated_fat) || 0,
      monounsaturatedFat: parseFloat(s.monounsaturated_fat) || 0,
      cholesterol: parseFloat(s.cholesterol) || 0,
      sodium: parseFloat(s.sodium) || 0,
      fiber: parseFloat(s.fiber) || 0,
      sugar: parseFloat(s.sugar) || 0,
      potassium: parseFloat(s.potassium) || 0,
      vitaminA: parseFloat(s.vitamin_a) || 0,
      vitaminC: parseFloat(s.vitamin_c) || 0,
      calcium: parseFloat(s.calcium) || 0,
      iron: parseFloat(s.iron) || 0,
    })),
  };
}


// ─── Local Cache ───

function getCachedFoods() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY)) || {};
  } catch { return {}; }
}

function cacheFoodLocally(food) {
  const cache = getCachedFoods();
  cache[food.fatSecretId || food.id] = {
    ...food,
    cachedAt: Date.now(),
  };
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

function getCachedFood(fatSecretId) {
  const cache = getCachedFoods();
  return cache[fatSecretId] || null;
}

/**
 * Get all cached FatSecret foods (for suggestions).
 */
export function getCachedFatSecretFoods() {
  const cache = getCachedFoods();
  return Object.values(cache).sort((a, b) => (b.cachedAt || 0) - (a.cachedAt || 0));
}
