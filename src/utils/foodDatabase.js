/**
 * Food Database & Nutrition Logger
 * 
 * Contains a curated database of common foods with full nutritional data,
 * plus utilities for searching, custom foods, meal management, and daily logging.
 */

import {
  isCloudSyncReady,
  saveCloudFoodLog,
  saveCloudCustomFoods,
  saveCloudSavedMeals,
  saveCloudBookmarkedFoods
} from './cloudSync';
import {
  BOOKMARKED_FOODS_KEY,
  CUSTOM_FOODS_KEY,
  FOOD_LOG_KEY,
  SAVED_MEALS_KEY,
} from '../constants/storageKeys.js';
import { readJson, writeJson } from './localStorage.js';

const runCloudSync = (task, warningMessage) => {
  if (!isCloudSyncReady()) return;
  task().catch((err) => console.warn(warningMessage, err));
};

// ─── Serving size types ───
export const SERVING_UNITS = {
  SERVING: 'serving',
  GRAM: 'g',
  TBSP: 'tbsp',
  CUP: 'cup',
  PIECE: 'piece',
  SLICE: 'slice',
  OZ: 'oz',
  ML: 'ml',
};

// ─── Food Categories ───
export const FOOD_CATEGORIES = {
  PROTEIN: 'Protein',
  DAIRY: 'Dairy',
  GRAIN: 'Grains & Cereals',
  FRUIT: 'Fruits',
  VEGETABLE: 'Vegetables',
  FAT: 'Fats & Oils',
  SNACK: 'Snacks',
  BEVERAGE: 'Beverages',
  OTHER: 'Other',
};

// ─── The Database ───
// All values are per 1 default serving
export const DEFAULT_FOODS = [
  {
    "id": "egg",
    "name": "Egg",
    "category": FOOD_CATEGORIES.PROTEIN,
    "servingSize": "1 whole",
    "servingGrams": 50,
    "availableUnits": [
      SERVING_UNITS.PIECE,
      SERVING_UNITS.GRAM
    ],
    "calories": 70,
    "protein": 6.3,
    "carbs": 0.6,
    "fats": 5,
    "saturatedFat": 1.6,
    "polyunsaturatedFat": 0.7,
    "monounsaturatedFat": 2,
    "cholesterol": 186,
    "sodium": 71,
    "fiber": 0,
    "sugar": 0.6,
    "potassium": 69,
    "vitaminA": 80,
    "vitaminC": 0,
    "calcium": 28,
    "iron": 0.9
  },
  {
    "id": "whey_protein",
    "name": "Whey Protein Scoop",
    "category": FOOD_CATEGORIES.PROTEIN,
    "servingSize": "1 scoop",
    "servingGrams": 30,
    "availableUnits": [
      SERVING_UNITS.SERVING,
      SERVING_UNITS.GRAM
    ],
    "calories": 140,
    "protein": 25,
    "carbs": 3,
    "fats": 3,
    "saturatedFat": 0.5,
    "polyunsaturatedFat": 0,
    "monounsaturatedFat": 0,
    "cholesterol": 45,
    "sodium": 130,
    "fiber": 0,
    "sugar": 2,
    "potassium": 160,
    "vitaminA": 0,
    "vitaminC": 0,
    "calcium": 120,
    "iron": 0.4
  },
  {
    "id": "milk_whole",
    "name": "Whole Milk",
    "category": FOOD_CATEGORIES.DAIRY,
    "servingSize": "100ml",
    "servingGrams": 100,
    "availableUnits": [
      SERVING_UNITS.ML,
      SERVING_UNITS.CUP,
      SERVING_UNITS.SERVING
    ],
    "calories": 61,
    "protein": 3.2,
    "carbs": 4.8,
    "fats": 3.3,
    "saturatedFat": 2,
    "polyunsaturatedFat": 0,
    "monounsaturatedFat": 1,
    "cholesterol": 10,
    "sodium": 40,
    "fiber": 0,
    "sugar": 4.8,
    "potassium": 130,
    "vitaminA": 28,
    "vitaminC": 0,
    "calcium": 110,
    "iron": 0
  },
  {
    "id": "oats",
    "name": "Oats (Dry)",
    "category": FOOD_CATEGORIES.GRAIN,
    "servingSize": "80g",
    "servingGrams": 80,
    "availableUnits": [
      SERVING_UNITS.GRAM,
      SERVING_UNITS.SERVING,
      SERVING_UNITS.CUP
    ],
    "calories": 296,
    "protein": 10.1,
    "carbs": 53.4,
    "fats": 6.5,
    "saturatedFat": 0.9,
    "polyunsaturatedFat": 1.8,
    "monounsaturatedFat": 1.6,
    "cholesterol": 0,
    "sodium": 2,
    "fiber": 8,
    "sugar": 1,
    "potassium": 336,
    "vitaminA": 0,
    "vitaminC": 0,
    "calcium": 42,
    "iron": 3.4
  },
  {
    "id": "banana",
    "name": "Banana",
    "category": FOOD_CATEGORIES.FRUIT,
    "servingSize": "1 medium",
    "servingGrams": 100,
    "availableUnits": [
      SERVING_UNITS.PIECE,
      SERVING_UNITS.GRAM
    ],
    "calories": 89,
    "protein": 1,
    "carbs": 23,
    "fats": 0,
    "saturatedFat": 0,
    "polyunsaturatedFat": 0,
    "monounsaturatedFat": 0,
    "cholesterol": 0,
    "sodium": 1,
    "fiber": 2.6,
    "sugar": 12,
    "potassium": 358,
    "vitaminA": 3,
    "vitaminC": 8.7,
    "calcium": 5,
    "iron": 0.3
  },
  {
    "id": "peanut_butter",
    "name": "Peanut Butter",
    "category": FOOD_CATEGORIES.FAT,
    "servingSize": "8g",
    "servingGrams": 8,
    "availableUnits": [
      SERVING_UNITS.GRAM,
      SERVING_UNITS.SERVING,
      SERVING_UNITS.TBSP
    ],
    "calories": 50,
    "protein": 2.4,
    "carbs": 1.5,
    "fats": 4,
    "saturatedFat": 0.5,
    "polyunsaturatedFat": 1,
    "monounsaturatedFat": 1.5,
    "cholesterol": 0,
    "sodium": 36,
    "fiber": 0.5,
    "sugar": 0.5,
    "potassium": 52,
    "vitaminA": 0,
    "vitaminC": 0,
    "calcium": 3.5,
    "iron": 0.1
  },
  {
    "id": "almonds",
    "name": "Almonds",
    "category": FOOD_CATEGORIES.FAT,
    "servingSize": "7g",
    "servingGrams": 7,
    "availableUnits": [
      SERVING_UNITS.GRAM,
      SERVING_UNITS.SERVING,
      SERVING_UNITS.OZ
    ],
    "calories": 40,
    "protein": 1.5,
    "carbs": 1.5,
    "fats": 3.5,
    "saturatedFat": 0.3,
    "polyunsaturatedFat": 0.8,
    "monounsaturatedFat": 2.2,
    "cholesterol": 0,
    "sodium": 0,
    "fiber": 0.9,
    "sugar": 0.3,
    "potassium": 52,
    "vitaminA": 0,
    "vitaminC": 0,
    "calcium": 19,
    "iron": 0.3
  },
  {
    "id": "honey",
    "name": "Honey",
    "category": FOOD_CATEGORIES.SNACK,
    "servingSize": "10g",
    "servingGrams": 10,
    "availableUnits": [
      SERVING_UNITS.GRAM,
      SERVING_UNITS.SERVING,
      SERVING_UNITS.TBSP
    ],
    "calories": 32,
    "protein": 0,
    "carbs": 8.5,
    "fats": 0,
    "saturatedFat": 0,
    "polyunsaturatedFat": 0,
    "monounsaturatedFat": 0,
    "cholesterol": 0,
    "sodium": 0,
    "fiber": 0,
    "sugar": 8.5,
    "potassium": 5,
    "vitaminA": 0,
    "vitaminC": 0,
    "calcium": 0,
    "iron": 0
  },
  {
    "id": "raisins",
    "name": "Raisins",
    "category": FOOD_CATEGORIES.SNACK,
    "servingSize": "15g",
    "servingGrams": 15,
    "availableUnits": [
      SERVING_UNITS.GRAM,
      SERVING_UNITS.SERVING
    ],
    "calories": 45,
    "protein": 0,
    "carbs": 11,
    "fats": 0,
    "saturatedFat": 0,
    "polyunsaturatedFat": 0,
    "monounsaturatedFat": 0,
    "cholesterol": 0,
    "sodium": 0,
    "fiber": 0.5,
    "sugar": 9,
    "potassium": 110,
    "vitaminA": 0,
    "vitaminC": 0,
    "calcium": 8,
    "iron": 0.3
  },
  {
    "id": "figs",
    "name": "Figs",
    "category": FOOD_CATEGORIES.FRUIT,
    "servingSize": "20g",
    "servingGrams": 20,
    "availableUnits": [
      SERVING_UNITS.GRAM,
      SERVING_UNITS.SERVING
    ],
    "calories": 50,
    "protein": 0,
    "carbs": 13,
    "fats": 0,
    "saturatedFat": 0,
    "polyunsaturatedFat": 0,
    "monounsaturatedFat": 0,
    "cholesterol": 0,
    "sodium": 0,
    "fiber": 1,
    "sugar": 10,
    "potassium": 136,
    "vitaminA": 0,
    "vitaminC": 0.2,
    "calcium": 32,
    "iron": 0.4
  },
  {
    "id": "chia_seeds",
    "name": "Chia Seeds",
    "category": FOOD_CATEGORIES.FAT,
    "servingSize": "5g",
    "servingGrams": 5,
    "availableUnits": [
      SERVING_UNITS.GRAM,
      SERVING_UNITS.SERVING
    ],
    "calories": 25,
    "protein": 1,
    "carbs": 2,
    "fats": 2,
    "saturatedFat": 0.2,
    "polyunsaturatedFat": 1.4,
    "monounsaturatedFat": 0.1,
    "cholesterol": 0,
    "sodium": 1,
    "fiber": 1.7,
    "sugar": 0,
    "potassium": 20,
    "vitaminA": 0,
    "vitaminC": 0,
    "calcium": 31,
    "iron": 0.4
  },
  {
    "id": "sabja_seeds",
    "name": "Sabja Seeds",
    "category": FOOD_CATEGORIES.OTHER,
    "servingSize": "5g",
    "servingGrams": 5,
    "availableUnits": [
      SERVING_UNITS.GRAM,
      SERVING_UNITS.SERVING
    ],
    "calories": 20,
    "protein": 0,
    "carbs": 2,
    "fats": 0,
    "saturatedFat": 0,
    "polyunsaturatedFat": 0,
    "monounsaturatedFat": 0,
    "cholesterol": 0,
    "sodium": 0,
    "fiber": 1.5,
    "sugar": 0,
    "potassium": 0,
    "vitaminA": 0,
    "vitaminC": 0,
    "calcium": 0,
    "iron": 0
  },
  {
    "id": "gond_katira",
    "name": "Gond Katira",
    "category": FOOD_CATEGORIES.OTHER,
    "servingSize": "5g",
    "servingGrams": 5,
    "availableUnits": [
      SERVING_UNITS.GRAM,
      SERVING_UNITS.SERVING
    ],
    "calories": 10,
    "protein": 0,
    "carbs": 2,
    "fats": 0,
    "saturatedFat": 0,
    "polyunsaturatedFat": 0,
    "monounsaturatedFat": 0,
    "cholesterol": 0,
    "sodium": 0,
    "fiber": 1.5,
    "sugar": 0,
    "potassium": 0,
    "vitaminA": 0,
    "vitaminC": 0,
    "calcium": 0,
    "iron": 0
  },
  {
    "id": "whey_isolate",
    "name": "Whey Isolate",
    "category": FOOD_CATEGORIES.PROTEIN,
    "servingSize": "1 scoop",
    "servingGrams": 30,
    "availableUnits": [
      SERVING_UNITS.SERVING,
      SERVING_UNITS.GRAM
    ],
    "calories": 110,
    "protein": 25,
    "carbs": 1,
    "fats": 0,
    "saturatedFat": 0,
    "polyunsaturatedFat": 0,
    "monounsaturatedFat": 0,
    "cholesterol": 0,
    "sodium": 50,
    "fiber": 0,
    "sugar": 0,
    "potassium": 0,
    "vitaminA": 0,
    "vitaminC": 0,
    "calcium": 150,
    "iron": 0
  },
  {
    "id": "watermelon",
    "name": "Watermelon",
    "category": FOOD_CATEGORIES.FRUIT,
    "servingSize": "100g",
    "servingGrams": 100,
    "availableUnits": [
      SERVING_UNITS.GRAM,
      SERVING_UNITS.SERVING
    ],
    "calories": 30,
    "protein": 0,
    "carbs": 7.6,
    "fats": 0,
    "saturatedFat": 0,
    "polyunsaturatedFat": 0,
    "monounsaturatedFat": 0,
    "cholesterol": 0,
    "sodium": 1,
    "fiber": 0.4,
    "sugar": 6.2,
    "potassium": 112,
    "vitaminA": 569,
    "vitaminC": 8.1,
    "calcium": 7,
    "iron": 0.2
  },
  {
    "id": "mixed_fruit",
    "name": "Mixed Fruit",
    "category": FOOD_CATEGORIES.FRUIT,
    "servingSize": "120g",
    "servingGrams": 120,
    "availableUnits": [
      SERVING_UNITS.GRAM,
      SERVING_UNITS.SERVING
    ],
    "calories": 60,
    "protein": 0,
    "carbs": 15,
    "fats": 0,
    "saturatedFat": 0,
    "polyunsaturatedFat": 0,
    "monounsaturatedFat": 0,
    "cholesterol": 0,
    "sodium": 0,
    "fiber": 2,
    "sugar": 12,
    "potassium": 0,
    "vitaminA": 0,
    "vitaminC": 0,
    "calcium": 0,
    "iron": 0
  },
  {
    "id": "egg_whites",
    "name": "Egg Whites",
    "category": FOOD_CATEGORIES.PROTEIN,
    "servingSize": "3 whites (99g)",
    "servingGrams": 99,
    "availableUnits": [
      SERVING_UNITS.PIECE,
      SERVING_UNITS.GRAM,
      SERVING_UNITS.SERVING
    ],
    "calories": 51,
    "protein": 11,
    "carbs": 1,
    "fats": 0,
    "saturatedFat": 0,
    "polyunsaturatedFat": 0,
    "monounsaturatedFat": 0,
    "cholesterol": 0,
    "sodium": 165,
    "fiber": 0,
    "sugar": 0,
    "potassium": 162,
    "vitaminA": 0,
    "vitaminC": 0,
    "calcium": 7,
    "iron": 0.1
  },
  {
    "id": "soya_chunks",
    "name": "Soya Chunks",
    "category": FOOD_CATEGORIES.PROTEIN,
    "servingSize": "20g",
    "servingGrams": 20,
    "availableUnits": [
      SERVING_UNITS.GRAM,
      SERVING_UNITS.SERVING
    ],
    "calories": 69,
    "protein": 10.4,
    "carbs": 6.6,
    "fats": 0.2,
    "saturatedFat": 0,
    "polyunsaturatedFat": 0.1,
    "monounsaturatedFat": 0,
    "cholesterol": 0,
    "sodium": 0,
    "fiber": 3.5,
    "sugar": 0,
    "potassium": 0,
    "vitaminA": 0,
    "vitaminC": 0,
    "calcium": 55,
    "iron": 1.5
  },
  {
    "id": "onion_tomato_mix",
    "name": "Onion & Tomato Mix",
    "category": FOOD_CATEGORIES.VEGETABLE,
    "servingSize": "200g",
    "servingGrams": 200,
    "availableUnits": [
      SERVING_UNITS.GRAM,
      SERVING_UNITS.SERVING
    ],
    "calories": 60,
    "protein": 0,
    "carbs": 14,
    "fats": 0,
    "saturatedFat": 0,
    "polyunsaturatedFat": 0,
    "monounsaturatedFat": 0,
    "cholesterol": 0,
    "sodium": 10,
    "fiber": 3,
    "sugar": 8,
    "potassium": 400,
    "vitaminA": 800,
    "vitaminC": 25,
    "calcium": 30,
    "iron": 0.5
  },
  {
    "id": "white_rice_raw",
    "name": "White Rice (Raw)",
    "category": FOOD_CATEGORIES.GRAIN,
    "servingSize": "100g",
    "servingGrams": 100,
    "availableUnits": [
      SERVING_UNITS.GRAM,
      SERVING_UNITS.SERVING
    ],
    "calories": 365,
    "protein": 7,
    "carbs": 79,
    "fats": 0.4,
    "saturatedFat": 0.1,
    "polyunsaturatedFat": 0.1,
    "monounsaturatedFat": 0.1,
    "cholesterol": 0,
    "sodium": 1,
    "fiber": 1.3,
    "sugar": 0.1,
    "potassium": 115,
    "vitaminA": 0,
    "vitaminC": 0,
    "calcium": 28,
    "iron": 0.8
  },
  {
    "id": "potato",
    "name": "Potato",
    "category": FOOD_CATEGORIES.VEGETABLE,
    "servingSize": "250g",
    "servingGrams": 250,
    "availableUnits": [
      SERVING_UNITS.GRAM,
      SERVING_UNITS.SERVING
    ],
    "calories": 218,
    "protein": 2,
    "carbs": 50,
    "fats": 0,
    "saturatedFat": 0,
    "polyunsaturatedFat": 0,
    "monounsaturatedFat": 0,
    "cholesterol": 0,
    "sodium": 10,
    "fiber": 4,
    "sugar": 2,
    "potassium": 1000,
    "vitaminA": 0,
    "vitaminC": 40,
    "calcium": 30,
    "iron": 1.5
  },
  {
    "id": "papaya",
    "name": "Papaya",
    "category": FOOD_CATEGORIES.FRUIT,
    "servingSize": "150g",
    "servingGrams": 150,
    "availableUnits": [
      SERVING_UNITS.GRAM,
      SERVING_UNITS.SERVING
    ],
    "calories": 60,
    "protein": 0,
    "carbs": 15,
    "fats": 0,
    "saturatedFat": 0,
    "polyunsaturatedFat": 0,
    "monounsaturatedFat": 0,
    "cholesterol": 0,
    "sodium": 12,
    "fiber": 2.5,
    "sugar": 11,
    "potassium": 385,
    "vitaminA": 700,
    "vitaminC": 92,
    "calcium": 30,
    "iron": 0.4
  },
  {
    "id": "chicken_breast_raw",
    "name": "Chicken Breast (Raw)",
    "category": FOOD_CATEGORIES.PROTEIN,
    "servingSize": "120g",
    "servingGrams": 120,
    "availableUnits": [
      SERVING_UNITS.GRAM,
      SERVING_UNITS.OZ,
      SERVING_UNITS.SERVING
    ],
    "calories": 144,
    "protein": 27.6,
    "carbs": 0,
    "fats": 3,
    "saturatedFat": 0.9,
    "polyunsaturatedFat": 0.6,
    "monounsaturatedFat": 1,
    "cholesterol": 85,
    "sodium": 54,
    "fiber": 0,
    "sugar": 0,
    "potassium": 300,
    "vitaminA": 5,
    "vitaminC": 0,
    "calcium": 13,
    "iron": 0.5
  },
  {
    "id": "mixed_vegetables",
    "name": "Mixed Vegetables",
    "category": FOOD_CATEGORIES.VEGETABLE,
    "servingSize": "300g",
    "servingGrams": 300,
    "availableUnits": [
      SERVING_UNITS.GRAM,
      SERVING_UNITS.SERVING
    ],
    "calories": 100,
    "protein": 0,
    "carbs": 20,
    "fats": 0,
    "saturatedFat": 0,
    "polyunsaturatedFat": 0,
    "monounsaturatedFat": 0,
    "cholesterol": 0,
    "sodium": 50,
    "fiber": 8,
    "sugar": 10,
    "potassium": 600,
    "vitaminA": 2000,
    "vitaminC": 50,
    "calcium": 40,
    "iron": 1.5
  },
  {
    "id": "cooking_oil",
    "name": "Cooking Oil",
    "category": FOOD_CATEGORIES.FAT,
    "servingSize": "5g",
    "servingGrams": 5,
    "availableUnits": [
      SERVING_UNITS.GRAM,
      SERVING_UNITS.SERVING
    ],
    "calories": 45,
    "protein": 0,
    "carbs": 0,
    "fats": 5,
    "saturatedFat": 0.7,
    "polyunsaturatedFat": 1.4,
    "monounsaturatedFat": 2.9,
    "cholesterol": 0,
    "sodium": 0,
    "fiber": 0,
    "sugar": 0,
    "potassium": 0,
    "vitaminA": 0,
    "vitaminC": 0,
    "calcium": 0,
    "iron": 0
  }
];
 
const getFood = (id) => DEFAULT_FOODS.find(f => f.id === id);
 
export const DEFAULT_MEALS = [
  {
    id: "meal_early_morning",
    name: "Early Morning",
    items: [
      { food: getFood("almonds"), servings: 1 },
      { food: getFood("raisins"), servings: 1 },
      { food: getFood("figs"), servings: 1 },
      { food: getFood("chia_seeds"), servings: 1 },
      { food: getFood("sabja_seeds"), servings: 1 },
      { food: getFood("gond_katira"), servings: 1 }
    ]
  },
  {
    id: "meal_breakfast",
    name: "Breakfast",
    items: [
      { food: getFood("oats"), servings: 1 },
      { food: getFood("whey_isolate"), servings: 1 },
      { food: getFood("milk_whole"), servings: 3 },
      { food: getFood("peanut_butter"), servings: 1 },
      { food: getFood("banana"), servings: 1 },
      { food: getFood("watermelon"), servings: 1 }
    ]
  },
  {
    id: "meal_mid_snack",
    name: "Mid Snack",
    items: [
      { food: getFood("mixed_fruit"), servings: 1 },
      { food: getFood("milk_whole"), servings: 1 }
    ]
  },
  {
    id: "meal_lunch",
    name: "Lunch",
    items: [
      { food: getFood("white_rice_raw"), servings: 1.15 },
      { food: getFood("egg"), servings: 1 },
      { food: getFood("egg_whites"), servings: 1 },
      { food: getFood("soya_chunks"), servings: 1 },
      { food: getFood("onion_tomato_mix"), servings: 1 },
      { food: getFood("cooking_oil"), servings: 1 },
      { food: getFood("watermelon"), servings: 2 }
    ]
  },
  {
    id: "meal_pre_workout",
    name: "Pre-Workout",
    items: [
      { food: getFood("potato"), servings: 1 },
      { food: getFood("banana"), servings: 1 },
      { food: getFood("honey"), servings: 1 }
    ]
  },
  {
    id: "meal_post_workout",
    name: "Post-Workout",
    items: [
      { food: getFood("whey_protein"), servings: 1 },
      { food: getFood("milk_whole"), servings: 3 }
    ]
  },
  {
    id: "meal_dinner",
    name: "Dinner",
    items: [
      { food: getFood("chicken_breast_raw"), servings: 1 },
      { food: getFood("white_rice_raw"), servings: 0.65 },
      { food: getFood("mixed_vegetables"), servings: 1 },
      { food: getFood("cooking_oil"), servings: 0.4 },
      { food: getFood("papaya"), servings: 1 }
    ]
  },
  {
    id: "meal_before_sleep",
    name: "Before Sleep",
    items: [
      { food: getFood("milk_whole"), servings: 2 }
    ]
  }
];



// ═══════════════════════════════════════════
// ─── Search & Filter Utilities ───
// ═══════════════════════════════════════════

/**
 * Search foods by name (fuzzy match).
 * Searches both default database and custom foods.
 */
export const searchFoods = (query) => {
  if (!query || query.trim() === '') return getAllFoods();
  const q = query.toLowerCase().trim();
  return getAllFoods().filter(food =>
    food.name.toLowerCase().includes(q) ||
    food.category?.toLowerCase().includes(q)
  );
};

/**
 * Get all foods: default + user's custom foods.
 */
export const getAllFoods = () => {
  const custom = getCustomFoods();
  return [...DEFAULT_FOODS, ...custom];
};

/**
 * Get a single food by ID.
 */
export const getFoodById = (id) => {
  return getAllFoods().find(f => f.id === id) || null;
};

/**
 * Get foods by category.
 */
export const getFoodsByCategory = (category) => {
  return getAllFoods().filter(f => f.category === category);
};

/**
 * Calculate nutrition for a food at a given serving count.
 */
export const calculateNutrition = (food, servings = 1) => {
  const keys = [
    'calories', 'protein', 'carbs', 'fats',
    'saturatedFat', 'polyunsaturatedFat', 'monounsaturatedFat',
    'cholesterol', 'sodium', 'fiber', 'sugar', 'potassium',
    'vitaminA', 'vitaminC', 'calcium', 'iron'
  ];
  const result = {};
  keys.forEach(k => {
    result[k] = Math.round((food[k] || 0) * servings * 10) / 10;
  });
  return result;
};


// ═══════════════════════════════════════════
// ─── Custom Foods (User Created) ───
// ═══════════════════════════════════════════

export const getCustomFoods = () => {
  return readJson(CUSTOM_FOODS_KEY, []);
};

export const saveCustomFood = (food) => {
  const foods = getCustomFoods();
  const newFood = {
    ...food,
    id: food.id || `custom_${Date.now()}`,
    isCustom: true,
  };
  foods.push(newFood);
  writeJson(CUSTOM_FOODS_KEY, foods);
  runCloudSync(
    () => saveCloudCustomFoods(foods),
    '[foodDb] Cloud custom food sync failed:'
  );
  return newFood;
};

export const deleteCustomFood = (id) => {
  const foods = getCustomFoods().filter(f => f.id !== id);
  writeJson(CUSTOM_FOODS_KEY, foods);
  runCloudSync(
    () => saveCloudCustomFoods(foods),
    '[foodDb] Cloud custom food delete failed:'
  );
};


// ═══════════════════════════════════════════
// ─── Saved Meals ───
// ═══════════════════════════════════════════

export const getSavedMeals = () => {
  const saved = readJson(SAVED_MEALS_KEY, null);
  
  // If no saved meals exist, return a COPY of the defaults
  if (saved === null || (Array.isArray(saved) && saved.length === 0)) {
    return [...DEFAULT_MEALS];
  }

  // Defensive: Ensure IDs are unique in case of storage corruption
  const seen = new Set();
  return saved.filter(meal => {
    if (seen.has(meal.id)) return false;
    seen.add(meal.id);
    return true;
  });
};

export const saveMeal = (meal) => {
  // Get existing meals (this already returns a copy now)
  const meals = getSavedMeals();
  
  const newMeal = {
    ...meal,
    id: meal.id || `meal_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    createdAt: new Date().toISOString(),
  };
  
  meals.push(newMeal);
  writeJson(SAVED_MEALS_KEY, meals);
  runCloudSync(
    () => saveCloudSavedMeals(meals),
    '[foodDb] Cloud meal sync failed:'
  );
  return newMeal;
};

export const deleteMeal = (id) => {
  const meals = getSavedMeals().filter(m => m.id !== id);
  writeJson(SAVED_MEALS_KEY, meals);
  runCloudSync(
    () => saveCloudSavedMeals(meals),
    '[foodDb] Cloud meal delete failed:'
  );
};

/**
 * Calculate total nutrition for a meal (sum of all items).
 */
export const calculateMealNutrition = (mealItems) => {
  const totals = {
    calories: 0, protein: 0, carbs: 0, fats: 0,
    saturatedFat: 0, polyunsaturatedFat: 0, monounsaturatedFat: 0,
    cholesterol: 0, sodium: 0, fiber: 0, sugar: 0, potassium: 0,
    vitaminA: 0, vitaminC: 0, calcium: 0, iron: 0,
  };
  mealItems.forEach(item => {
    const nutrition = calculateNutrition(item.food, item.servings || 1);
    Object.keys(totals).forEach(k => {
      totals[k] = Math.round((totals[k] + (nutrition[k] || 0)) * 10) / 10;
    });
  });
  return totals;
};


// ═══════════════════════════════════════════
// ─── Daily Food Log ───
// ═══════════════════════════════════════════

/**
 * Get the food log for a specific date.
 * @param {string} dateKey - Format: 'YYYY-MM-DD'
 * @returns {Array} Array of logged food entries
 */
export const getFoodLog = (dateKey) => {
  const allLogs = readJson(FOOD_LOG_KEY, {});
  return allLogs[dateKey] || [];
};

/**
 * Add a food entry to the daily log.
 * @param {string} dateKey - Format: 'YYYY-MM-DD'
 * @param {Object} entry - { food, servings, loggedAt }
 */
export const addFoodToLog = (dateKey, entry) => {
  const allLogs = readJson(FOOD_LOG_KEY, {});
  if (!allLogs[dateKey]) allLogs[dateKey] = [];
  allLogs[dateKey].push({
    ...entry,
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    loggedAt: new Date().toISOString(),
  });
  writeJson(FOOD_LOG_KEY, allLogs);
  runCloudSync(
    () => saveCloudFoodLog(allLogs),
    '[foodDb] Cloud food log sync failed:'
  );
  return allLogs[dateKey];
};

/**
 * Remove a food entry from the daily log.
 */
export const removeFoodFromLog = (dateKey, entryId) => {
  const allLogs = readJson(FOOD_LOG_KEY, {});
  if (allLogs[dateKey]) {
    allLogs[dateKey] = allLogs[dateKey].filter(e => e.id !== entryId);
    writeJson(FOOD_LOG_KEY, allLogs);
    runCloudSync(
      () => saveCloudFoodLog(allLogs),
      '[foodDb] Cloud food log delete failed:'
    );
  }
  return allLogs[dateKey] || [];
};

/**
 * Get the total nutrition consumed for a specific date.
 */
export const getDailyTotals = (dateKey) => {
  const log = getFoodLog(dateKey);
  const totals = {
    calories: 0, protein: 0, carbs: 0, fats: 0,
    fiber: 0, sugar: 0, sodium: 0,
  };
  log.forEach(entry => {
    const nutrition = calculateNutrition(entry.food, entry.servings || 1);
    Object.keys(totals).forEach(k => {
      totals[k] = Math.round((totals[k] + (nutrition[k] || 0)) * 10) / 10;
    });
  });
  return totals;
};


// ═══════════════════════════════════════════
// ─── Bookmarks ───
// ═══════════════════════════════════════════

export const getBookmarkedFoods = () => {
  return readJson(BOOKMARKED_FOODS_KEY, []);
};

export const toggleBookmark = (foodId) => {
  const bookmarks = getBookmarkedFoods();
  const idx = bookmarks.indexOf(foodId);
  if (idx >= 0) {
    bookmarks.splice(idx, 1);
  } else {
    bookmarks.push(foodId);
  }
  writeJson(BOOKMARKED_FOODS_KEY, bookmarks);
  runCloudSync(
    () => saveCloudBookmarkedFoods(bookmarks),
    '[foodDb] Cloud bookmark sync failed:'
  );
  return bookmarks;
};

export const isBookmarked = (foodId) => {
  return getBookmarkedFoods().includes(foodId);
};
