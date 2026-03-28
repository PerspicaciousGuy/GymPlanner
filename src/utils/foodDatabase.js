/**
 * Food Database & Nutrition Logger
 * 
 * Contains a curated database of common foods with full nutritional data,
 * plus utilities for searching, custom foods, meal management, and daily logging.
 */

const CUSTOM_FOODS_KEY = 'gymplanner_custom_foods';
const SAVED_MEALS_KEY = 'gymplanner_saved_meals';
const FOOD_LOG_KEY = 'gymplanner_food_log';
const BOOKMARKED_FOODS_KEY = 'gymplanner_bookmarked_foods';

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
  // ── Proteins ──
  {
    id: 'egg',
    name: 'Egg',
    category: FOOD_CATEGORIES.PROTEIN,
    servingSize: 'large',
    servingGrams: 50,
    availableUnits: [SERVING_UNITS.PIECE, SERVING_UNITS.GRAM],
    calories: 74,
    protein: 6,
    carbs: 0.6,
    fats: 5,
    saturatedFat: 1.6,
    polyunsaturatedFat: 0.7,
    monounsaturatedFat: 2,
    cholesterol: 186,
    sodium: 71,
    fiber: 0,
    sugar: 0.6,
    potassium: 69,
    vitaminA: 80,
    vitaminC: 0,
    calcium: 28,
    iron: 0.9,
  },
  {
    id: 'chicken_breast',
    name: 'Chicken Breast',
    category: FOOD_CATEGORIES.PROTEIN,
    servingSize: '100g',
    servingGrams: 100,
    availableUnits: [SERVING_UNITS.GRAM, SERVING_UNITS.OZ, SERVING_UNITS.SERVING],
    calories: 165,
    protein: 31,
    carbs: 0,
    fats: 3.6,
    saturatedFat: 1,
    polyunsaturatedFat: 0.8,
    monounsaturatedFat: 1.2,
    cholesterol: 85,
    sodium: 74,
    fiber: 0,
    sugar: 0,
    potassium: 256,
    vitaminA: 6,
    vitaminC: 0,
    calcium: 15,
    iron: 1,
  },
  {
    id: 'salmon',
    name: 'Salmon',
    category: FOOD_CATEGORIES.PROTEIN,
    servingSize: 'fillet (100g)',
    servingGrams: 100,
    availableUnits: [SERVING_UNITS.GRAM, SERVING_UNITS.OZ, SERVING_UNITS.SERVING],
    calories: 208,
    protein: 20,
    carbs: 0,
    fats: 13,
    saturatedFat: 3.1,
    polyunsaturatedFat: 3.9,
    monounsaturatedFat: 4.4,
    cholesterol: 55,
    sodium: 59,
    fiber: 0,
    sugar: 0,
    potassium: 363,
    vitaminA: 50,
    vitaminC: 0,
    calcium: 12,
    iron: 0.3,
  },
  {
    id: 'tuna',
    name: 'Tuna (Canned)',
    category: FOOD_CATEGORIES.PROTEIN,
    servingSize: '100g',
    servingGrams: 100,
    availableUnits: [SERVING_UNITS.GRAM, SERVING_UNITS.OZ, SERVING_UNITS.SERVING],
    calories: 116,
    protein: 26,
    carbs: 0,
    fats: 0.8,
    saturatedFat: 0.2,
    polyunsaturatedFat: 0.3,
    monounsaturatedFat: 0.1,
    cholesterol: 30,
    sodium: 338,
    fiber: 0,
    sugar: 0,
    potassium: 237,
    vitaminA: 7,
    vitaminC: 0,
    calcium: 11,
    iron: 1.3,
  },
  {
    id: 'paneer',
    name: 'Paneer',
    category: FOOD_CATEGORIES.PROTEIN,
    servingSize: '100g',
    servingGrams: 100,
    availableUnits: [SERVING_UNITS.GRAM, SERVING_UNITS.SERVING],
    calories: 265,
    protein: 18,
    carbs: 1.2,
    fats: 21,
    saturatedFat: 13,
    polyunsaturatedFat: 0.6,
    monounsaturatedFat: 5.7,
    cholesterol: 68,
    sodium: 18,
    fiber: 0,
    sugar: 1.2,
    potassium: 100,
    vitaminA: 200,
    vitaminC: 0,
    calcium: 480,
    iron: 0.2,
  },
  {
    id: 'tofu',
    name: 'Tofu (Firm)',
    category: FOOD_CATEGORIES.PROTEIN,
    servingSize: '100g',
    servingGrams: 100,
    availableUnits: [SERVING_UNITS.GRAM, SERVING_UNITS.SERVING],
    calories: 76,
    protein: 8,
    carbs: 1.9,
    fats: 4.8,
    saturatedFat: 0.7,
    polyunsaturatedFat: 2.7,
    monounsaturatedFat: 1.1,
    cholesterol: 0,
    sodium: 7,
    fiber: 0.3,
    sugar: 0.6,
    potassium: 121,
    vitaminA: 85,
    vitaminC: 0.1,
    calcium: 350,
    iron: 5.4,
  },
  {
    id: 'whey_protein',
    name: 'Whey Protein Scoop',
    category: FOOD_CATEGORIES.PROTEIN,
    servingSize: 'scoop (30g)',
    servingGrams: 30,
    availableUnits: [SERVING_UNITS.SERVING, SERVING_UNITS.GRAM],
    calories: 120,
    protein: 24,
    carbs: 3,
    fats: 1.5,
    saturatedFat: 0.5,
    polyunsaturatedFat: 0,
    monounsaturatedFat: 0,
    cholesterol: 45,
    sodium: 130,
    fiber: 0,
    sugar: 2,
    potassium: 160,
    vitaminA: 0,
    vitaminC: 0,
    calcium: 120,
    iron: 0.4,
  },

  // ── Dairy ──
  {
    id: 'milk_whole',
    name: 'Whole Milk',
    category: FOOD_CATEGORIES.DAIRY,
    servingSize: 'cup (240ml)',
    servingGrams: 244,
    availableUnits: [SERVING_UNITS.CUP, SERVING_UNITS.ML, SERVING_UNITS.SERVING],
    calories: 149,
    protein: 8,
    carbs: 12,
    fats: 8,
    saturatedFat: 4.6,
    polyunsaturatedFat: 0.5,
    monounsaturatedFat: 2,
    cholesterol: 24,
    sodium: 105,
    fiber: 0,
    sugar: 12,
    potassium: 322,
    vitaminA: 68,
    vitaminC: 0,
    calcium: 276,
    iron: 0.1,
  },
  {
    id: 'greek_yogurt',
    name: 'Greek Yogurt',
    category: FOOD_CATEGORIES.DAIRY,
    servingSize: 'cup (200g)',
    servingGrams: 200,
    availableUnits: [SERVING_UNITS.CUP, SERVING_UNITS.GRAM, SERVING_UNITS.SERVING],
    calories: 130,
    protein: 22,
    carbs: 8,
    fats: 0.7,
    saturatedFat: 0.4,
    polyunsaturatedFat: 0,
    monounsaturatedFat: 0.1,
    cholesterol: 10,
    sodium: 68,
    fiber: 0,
    sugar: 7,
    potassium: 240,
    vitaminA: 0,
    vitaminC: 0,
    calcium: 200,
    iron: 0.1,
  },
  {
    id: 'cheddar_cheese',
    name: 'Cheddar Cheese',
    category: FOOD_CATEGORIES.DAIRY,
    servingSize: 'slice (28g)',
    servingGrams: 28,
    availableUnits: [SERVING_UNITS.SLICE, SERVING_UNITS.GRAM, SERVING_UNITS.OZ],
    calories: 113,
    protein: 7,
    carbs: 0.4,
    fats: 9,
    saturatedFat: 5.7,
    polyunsaturatedFat: 0.3,
    monounsaturatedFat: 2.7,
    cholesterol: 28,
    sodium: 174,
    fiber: 0,
    sugar: 0.1,
    potassium: 21,
    vitaminA: 75,
    vitaminC: 0,
    calcium: 200,
    iron: 0.2,
  },

  // ── Grains & Cereals ──
  {
    id: 'white_rice',
    name: 'White Rice (Cooked)',
    category: FOOD_CATEGORIES.GRAIN,
    servingSize: 'cup (158g)',
    servingGrams: 158,
    availableUnits: [SERVING_UNITS.CUP, SERVING_UNITS.GRAM, SERVING_UNITS.SERVING],
    calories: 206,
    protein: 4.3,
    carbs: 45,
    fats: 0.4,
    saturatedFat: 0.1,
    polyunsaturatedFat: 0.1,
    monounsaturatedFat: 0.1,
    cholesterol: 0,
    sodium: 1.6,
    fiber: 0.6,
    sugar: 0,
    potassium: 55,
    vitaminA: 0,
    vitaminC: 0,
    calcium: 16,
    iron: 1.9,
  },
  {
    id: 'brown_rice',
    name: 'Brown Rice (Cooked)',
    category: FOOD_CATEGORIES.GRAIN,
    servingSize: 'cup (195g)',
    servingGrams: 195,
    availableUnits: [SERVING_UNITS.CUP, SERVING_UNITS.GRAM, SERVING_UNITS.SERVING],
    calories: 216,
    protein: 5,
    carbs: 45,
    fats: 1.8,
    saturatedFat: 0.4,
    polyunsaturatedFat: 0.6,
    monounsaturatedFat: 0.6,
    cholesterol: 0,
    sodium: 10,
    fiber: 3.5,
    sugar: 0.7,
    potassium: 154,
    vitaminA: 0,
    vitaminC: 0,
    calcium: 20,
    iron: 0.8,
  },
  {
    id: 'oats',
    name: 'Oats (Dry)',
    category: FOOD_CATEGORIES.GRAIN,
    servingSize: 'cup (80g)',
    servingGrams: 80,
    availableUnits: [SERVING_UNITS.CUP, SERVING_UNITS.GRAM, SERVING_UNITS.SERVING],
    calories: 307,
    protein: 11,
    carbs: 55,
    fats: 5,
    saturatedFat: 0.9,
    polyunsaturatedFat: 1.8,
    monounsaturatedFat: 1.6,
    cholesterol: 0,
    sodium: 2,
    fiber: 8,
    sugar: 1,
    potassium: 336,
    vitaminA: 0,
    vitaminC: 0,
    calcium: 42,
    iron: 3.4,
  },
  {
    id: 'whole_wheat_bread',
    name: 'Whole Wheat Bread',
    category: FOOD_CATEGORIES.GRAIN,
    servingSize: 'slice (30g)',
    servingGrams: 30,
    availableUnits: [SERVING_UNITS.SLICE, SERVING_UNITS.GRAM],
    calories: 81,
    protein: 4,
    carbs: 14,
    fats: 1.1,
    saturatedFat: 0.2,
    polyunsaturatedFat: 0.5,
    monounsaturatedFat: 0.2,
    cholesterol: 0,
    sodium: 146,
    fiber: 1.9,
    sugar: 1.4,
    potassium: 81,
    vitaminA: 0,
    vitaminC: 0,
    calcium: 40,
    iron: 0.7,
  },
  {
    id: 'pasta',
    name: 'Pasta (Cooked)',
    category: FOOD_CATEGORIES.GRAIN,
    servingSize: 'cup (140g)',
    servingGrams: 140,
    availableUnits: [SERVING_UNITS.CUP, SERVING_UNITS.GRAM, SERVING_UNITS.SERVING],
    calories: 220,
    protein: 8,
    carbs: 43,
    fats: 1.3,
    saturatedFat: 0.2,
    polyunsaturatedFat: 0.5,
    monounsaturatedFat: 0.2,
    cholesterol: 0,
    sodium: 1,
    fiber: 2.5,
    sugar: 0.8,
    potassium: 62,
    vitaminA: 0,
    vitaminC: 0,
    calcium: 10,
    iron: 1.8,
  },
  {
    id: 'roti',
    name: 'Roti / Chapati',
    category: FOOD_CATEGORIES.GRAIN,
    servingSize: '1 piece (40g)',
    servingGrams: 40,
    availableUnits: [SERVING_UNITS.PIECE, SERVING_UNITS.GRAM],
    calories: 120,
    protein: 3.5,
    carbs: 20,
    fats: 3.5,
    saturatedFat: 0.6,
    polyunsaturatedFat: 1,
    monounsaturatedFat: 1.5,
    cholesterol: 0,
    sodium: 190,
    fiber: 3.2,
    sugar: 0.4,
    potassium: 65,
    vitaminA: 0,
    vitaminC: 0,
    calcium: 10,
    iron: 1,
  },

  // ── Fruits ──
  {
    id: 'banana',
    name: 'Banana',
    category: FOOD_CATEGORIES.FRUIT,
    servingSize: 'medium (118g)',
    servingGrams: 118,
    availableUnits: [SERVING_UNITS.PIECE, SERVING_UNITS.GRAM],
    calories: 105,
    protein: 1.3,
    carbs: 27,
    fats: 0.4,
    saturatedFat: 0.1,
    polyunsaturatedFat: 0.1,
    monounsaturatedFat: 0,
    cholesterol: 0,
    sodium: 1,
    fiber: 3.1,
    sugar: 14,
    potassium: 422,
    vitaminA: 3,
    vitaminC: 10.3,
    calcium: 6,
    iron: 0.3,
  },
  {
    id: 'apple',
    name: 'Apple',
    category: FOOD_CATEGORIES.FRUIT,
    servingSize: 'medium (182g)',
    servingGrams: 182,
    availableUnits: [SERVING_UNITS.PIECE, SERVING_UNITS.GRAM],
    calories: 95,
    protein: 0.5,
    carbs: 25,
    fats: 0.3,
    saturatedFat: 0.1,
    polyunsaturatedFat: 0.1,
    monounsaturatedFat: 0,
    cholesterol: 0,
    sodium: 2,
    fiber: 4.4,
    sugar: 19,
    potassium: 195,
    vitaminA: 3,
    vitaminC: 8.4,
    calcium: 11,
    iron: 0.2,
  },
  {
    id: 'avocado',
    name: 'Avocado',
    category: FOOD_CATEGORIES.FRUIT,
    servingSize: 'half (68g)',
    servingGrams: 68,
    availableUnits: [SERVING_UNITS.SERVING, SERVING_UNITS.GRAM],
    calories: 130,
    protein: 1.3,
    carbs: 6,
    fats: 12,
    saturatedFat: 1.6,
    polyunsaturatedFat: 1.5,
    monounsaturatedFat: 7.6,
    cholesterol: 0,
    sodium: 5,
    fiber: 5,
    sugar: 0.2,
    potassium: 345,
    vitaminA: 5,
    vitaminC: 6,
    calcium: 9,
    iron: 0.4,
  },
  {
    id: 'mango',
    name: 'Mango',
    category: FOOD_CATEGORIES.FRUIT,
    servingSize: 'cup sliced (165g)',
    servingGrams: 165,
    availableUnits: [SERVING_UNITS.CUP, SERVING_UNITS.PIECE, SERVING_UNITS.GRAM],
    calories: 99,
    protein: 1.4,
    carbs: 25,
    fats: 0.6,
    saturatedFat: 0.1,
    polyunsaturatedFat: 0.1,
    monounsaturatedFat: 0.2,
    cholesterol: 0,
    sodium: 2,
    fiber: 2.6,
    sugar: 23,
    potassium: 277,
    vitaminA: 89,
    vitaminC: 60,
    calcium: 18,
    iron: 0.3,
  },
  {
    id: 'orange',
    name: 'Orange',
    category: FOOD_CATEGORIES.FRUIT,
    servingSize: 'medium (131g)',
    servingGrams: 131,
    availableUnits: [SERVING_UNITS.PIECE, SERVING_UNITS.GRAM],
    calories: 62,
    protein: 1.2,
    carbs: 15,
    fats: 0.2,
    saturatedFat: 0,
    polyunsaturatedFat: 0,
    monounsaturatedFat: 0,
    cholesterol: 0,
    sodium: 0,
    fiber: 3.1,
    sugar: 12,
    potassium: 237,
    vitaminA: 14,
    vitaminC: 70,
    calcium: 52,
    iron: 0.1,
  },

  // ── Vegetables ──
  {
    id: 'spinach',
    name: 'Spinach',
    category: FOOD_CATEGORIES.VEGETABLE,
    servingSize: 'cup raw (30g)',
    servingGrams: 30,
    availableUnits: [SERVING_UNITS.CUP, SERVING_UNITS.GRAM],
    calories: 7,
    protein: 0.9,
    carbs: 1.1,
    fats: 0.1,
    saturatedFat: 0,
    polyunsaturatedFat: 0,
    monounsaturatedFat: 0,
    cholesterol: 0,
    sodium: 24,
    fiber: 0.7,
    sugar: 0.1,
    potassium: 167,
    vitaminA: 141,
    vitaminC: 8.4,
    calcium: 30,
    iron: 0.8,
  },
  {
    id: 'broccoli',
    name: 'Broccoli',
    category: FOOD_CATEGORIES.VEGETABLE,
    servingSize: 'cup (91g)',
    servingGrams: 91,
    availableUnits: [SERVING_UNITS.CUP, SERVING_UNITS.GRAM],
    calories: 31,
    protein: 2.6,
    carbs: 6,
    fats: 0.3,
    saturatedFat: 0,
    polyunsaturatedFat: 0,
    monounsaturatedFat: 0,
    cholesterol: 0,
    sodium: 30,
    fiber: 2.4,
    sugar: 1.5,
    potassium: 288,
    vitaminA: 31,
    vitaminC: 81,
    calcium: 43,
    iron: 0.7,
  },
  {
    id: 'sweet_potato',
    name: 'Sweet Potato',
    category: FOOD_CATEGORIES.VEGETABLE,
    servingSize: 'medium (114g)',
    servingGrams: 114,
    availableUnits: [SERVING_UNITS.PIECE, SERVING_UNITS.GRAM],
    calories: 103,
    protein: 2.3,
    carbs: 24,
    fats: 0.1,
    saturatedFat: 0,
    polyunsaturatedFat: 0,
    monounsaturatedFat: 0,
    cholesterol: 0,
    sodium: 41,
    fiber: 3.8,
    sugar: 7,
    potassium: 438,
    vitaminA: 1096,
    vitaminC: 22,
    calcium: 38,
    iron: 0.7,
  },

  // ── Fats & Oils ──
  {
    id: 'peanut_butter',
    name: 'Peanut Butter',
    category: FOOD_CATEGORIES.FAT,
    servingSize: 'tbsp (16g)',
    servingGrams: 16,
    availableUnits: [SERVING_UNITS.TBSP, SERVING_UNITS.GRAM, SERVING_UNITS.SERVING],
    calories: 94,
    protein: 4,
    carbs: 3,
    fats: 8,
    saturatedFat: 1,
    polyunsaturatedFat: 2,
    monounsaturatedFat: 3,
    cholesterol: 0,
    sodium: 73,
    fiber: 1,
    sugar: 1,
    potassium: 104,
    vitaminA: 0,
    vitaminC: 0,
    calcium: 7,
    iron: 0.3,
  },
  {
    id: 'olive_oil',
    name: 'Olive Oil',
    category: FOOD_CATEGORIES.FAT,
    servingSize: 'tbsp (14g)',
    servingGrams: 14,
    availableUnits: [SERVING_UNITS.TBSP, SERVING_UNITS.GRAM],
    calories: 119,
    protein: 0,
    carbs: 0,
    fats: 14,
    saturatedFat: 1.9,
    polyunsaturatedFat: 1.4,
    monounsaturatedFat: 10,
    cholesterol: 0,
    sodium: 0,
    fiber: 0,
    sugar: 0,
    potassium: 0,
    vitaminA: 0,
    vitaminC: 0,
    calcium: 0,
    iron: 0.1,
  },
  {
    id: 'almonds',
    name: 'Almonds',
    category: FOOD_CATEGORIES.FAT,
    servingSize: '1 oz (28g)',
    servingGrams: 28,
    availableUnits: [SERVING_UNITS.OZ, SERVING_UNITS.GRAM, SERVING_UNITS.SERVING],
    calories: 164,
    protein: 6,
    carbs: 6,
    fats: 14,
    saturatedFat: 1.1,
    polyunsaturatedFat: 3.4,
    monounsaturatedFat: 8.9,
    cholesterol: 0,
    sodium: 0,
    fiber: 3.5,
    sugar: 1.2,
    potassium: 208,
    vitaminA: 0,
    vitaminC: 0,
    calcium: 76,
    iron: 1.1,
  },
  {
    id: 'butter',
    name: 'Butter',
    category: FOOD_CATEGORIES.FAT,
    servingSize: 'tbsp (14g)',
    servingGrams: 14,
    availableUnits: [SERVING_UNITS.TBSP, SERVING_UNITS.GRAM],
    calories: 102,
    protein: 0.1,
    carbs: 0,
    fats: 11.5,
    saturatedFat: 7.3,
    polyunsaturatedFat: 0.4,
    monounsaturatedFat: 3,
    cholesterol: 31,
    sodium: 2,
    fiber: 0,
    sugar: 0,
    potassium: 3,
    vitaminA: 97,
    vitaminC: 0,
    calcium: 3,
    iron: 0,
  },
  {
    id: 'ghee',
    name: 'Ghee',
    category: FOOD_CATEGORIES.FAT,
    servingSize: 'tbsp (14g)',
    servingGrams: 14,
    availableUnits: [SERVING_UNITS.TBSP, SERVING_UNITS.GRAM],
    calories: 120,
    protein: 0,
    carbs: 0,
    fats: 14,
    saturatedFat: 9,
    polyunsaturatedFat: 0.5,
    monounsaturatedFat: 4,
    cholesterol: 36,
    sodium: 0,
    fiber: 0,
    sugar: 0,
    potassium: 0,
    vitaminA: 108,
    vitaminC: 0,
    calcium: 0,
    iron: 0,
  },

  // ── Snacks & Common Items ──
  {
    id: 'dark_chocolate',
    name: 'Dark Chocolate (70%)',
    category: FOOD_CATEGORIES.SNACK,
    servingSize: '1 oz (28g)',
    servingGrams: 28,
    availableUnits: [SERVING_UNITS.OZ, SERVING_UNITS.GRAM, SERVING_UNITS.PIECE],
    calories: 170,
    protein: 2.2,
    carbs: 13,
    fats: 12,
    saturatedFat: 6.9,
    polyunsaturatedFat: 0.4,
    monounsaturatedFat: 3.6,
    cholesterol: 2,
    sodium: 6,
    fiber: 3.1,
    sugar: 7,
    potassium: 200,
    vitaminA: 0,
    vitaminC: 0,
    calcium: 21,
    iron: 3.3,
  },
  {
    id: 'honey',
    name: 'Honey',
    category: FOOD_CATEGORIES.SNACK,
    servingSize: 'tbsp (21g)',
    servingGrams: 21,
    availableUnits: [SERVING_UNITS.TBSP, SERVING_UNITS.GRAM],
    calories: 64,
    protein: 0.1,
    carbs: 17,
    fats: 0,
    saturatedFat: 0,
    polyunsaturatedFat: 0,
    monounsaturatedFat: 0,
    cholesterol: 0,
    sodium: 1,
    fiber: 0,
    sugar: 17,
    potassium: 11,
    vitaminA: 0,
    vitaminC: 0.1,
    calcium: 1,
    iron: 0.1,
  },
  {
    id: 'protein_bar',
    name: 'Protein Bar',
    category: FOOD_CATEGORIES.SNACK,
    servingSize: '1 bar (60g)',
    servingGrams: 60,
    availableUnits: [SERVING_UNITS.PIECE, SERVING_UNITS.GRAM],
    calories: 210,
    protein: 20,
    carbs: 22,
    fats: 7,
    saturatedFat: 3,
    polyunsaturatedFat: 1,
    monounsaturatedFat: 2,
    cholesterol: 5,
    sodium: 180,
    fiber: 4,
    sugar: 6,
    potassium: 150,
    vitaminA: 0,
    vitaminC: 0,
    calcium: 200,
    iron: 2,
  },

  // ── Legumes ──
  {
    id: 'lentils',
    name: 'Lentils (Cooked)',
    category: FOOD_CATEGORIES.PROTEIN,
    servingSize: 'cup (198g)',
    servingGrams: 198,
    availableUnits: [SERVING_UNITS.CUP, SERVING_UNITS.GRAM, SERVING_UNITS.SERVING],
    calories: 230,
    protein: 18,
    carbs: 40,
    fats: 0.8,
    saturatedFat: 0.1,
    polyunsaturatedFat: 0.3,
    monounsaturatedFat: 0.1,
    cholesterol: 0,
    sodium: 4,
    fiber: 15.6,
    sugar: 3.6,
    potassium: 731,
    vitaminA: 8,
    vitaminC: 3,
    calcium: 38,
    iron: 6.6,
  },
  {
    id: 'chickpeas',
    name: 'Chickpeas (Cooked)',
    category: FOOD_CATEGORIES.PROTEIN,
    servingSize: 'cup (164g)',
    servingGrams: 164,
    availableUnits: [SERVING_UNITS.CUP, SERVING_UNITS.GRAM, SERVING_UNITS.SERVING],
    calories: 269,
    protein: 14.5,
    carbs: 45,
    fats: 4.2,
    saturatedFat: 0.4,
    polyunsaturatedFat: 1.9,
    monounsaturatedFat: 1,
    cholesterol: 0,
    sodium: 11,
    fiber: 12.5,
    sugar: 8,
    potassium: 474,
    vitaminA: 1,
    vitaminC: 2.1,
    calcium: 80,
    iron: 4.7,
  },

  // ── Beverages ──
  {
    id: 'black_coffee',
    name: 'Black Coffee',
    category: FOOD_CATEGORIES.BEVERAGE,
    servingSize: 'cup (240ml)',
    servingGrams: 240,
    availableUnits: [SERVING_UNITS.CUP, SERVING_UNITS.ML],
    calories: 2,
    protein: 0.3,
    carbs: 0,
    fats: 0,
    saturatedFat: 0,
    polyunsaturatedFat: 0,
    monounsaturatedFat: 0,
    cholesterol: 0,
    sodium: 5,
    fiber: 0,
    sugar: 0,
    potassium: 116,
    vitaminA: 0,
    vitaminC: 0,
    calcium: 5,
    iron: 0,
  },
  {
    id: 'orange_juice',
    name: 'Orange Juice',
    category: FOOD_CATEGORIES.BEVERAGE,
    servingSize: 'cup (240ml)',
    servingGrams: 240,
    availableUnits: [SERVING_UNITS.CUP, SERVING_UNITS.ML],
    calories: 112,
    protein: 1.7,
    carbs: 26,
    fats: 0.5,
    saturatedFat: 0.1,
    polyunsaturatedFat: 0.1,
    monounsaturatedFat: 0.1,
    cholesterol: 0,
    sodium: 2,
    fiber: 0.5,
    sugar: 21,
    potassium: 496,
    vitaminA: 25,
    vitaminC: 124,
    calcium: 27,
    iron: 0.5,
  },
  {
    id: 'coconut_water',
    name: 'Coconut Water',
    category: FOOD_CATEGORIES.BEVERAGE,
    servingSize: 'cup (240ml)',
    servingGrams: 240,
    availableUnits: [SERVING_UNITS.CUP, SERVING_UNITS.ML],
    calories: 46,
    protein: 1.7,
    carbs: 9,
    fats: 0.5,
    saturatedFat: 0.4,
    polyunsaturatedFat: 0,
    monounsaturatedFat: 0,
    cholesterol: 0,
    sodium: 252,
    fiber: 2.6,
    sugar: 6.3,
    potassium: 600,
    vitaminA: 0,
    vitaminC: 5.8,
    calcium: 58,
    iron: 0.7,
  },
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
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_FOODS_KEY)) || [];
  } catch { return []; }
};

export const saveCustomFood = (food) => {
  const foods = getCustomFoods();
  const newFood = {
    ...food,
    id: food.id || `custom_${Date.now()}`,
    isCustom: true,
  };
  foods.push(newFood);
  localStorage.setItem(CUSTOM_FOODS_KEY, JSON.stringify(foods));
  return newFood;
};

export const deleteCustomFood = (id) => {
  const foods = getCustomFoods().filter(f => f.id !== id);
  localStorage.setItem(CUSTOM_FOODS_KEY, JSON.stringify(foods));
};


// ═══════════════════════════════════════════
// ─── Saved Meals ───
// ═══════════════════════════════════════════

export const getSavedMeals = () => {
  try {
    return JSON.parse(localStorage.getItem(SAVED_MEALS_KEY)) || [];
  } catch { return []; }
};

export const saveMeal = (meal) => {
  const meals = getSavedMeals();
  const newMeal = {
    ...meal,
    id: meal.id || `meal_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  meals.push(newMeal);
  localStorage.setItem(SAVED_MEALS_KEY, JSON.stringify(meals));
  return newMeal;
};

export const deleteMeal = (id) => {
  const meals = getSavedMeals().filter(m => m.id !== id);
  localStorage.setItem(SAVED_MEALS_KEY, JSON.stringify(meals));
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
  try {
    const allLogs = JSON.parse(localStorage.getItem(FOOD_LOG_KEY)) || {};
    return allLogs[dateKey] || [];
  } catch { return []; }
};

/**
 * Add a food entry to the daily log.
 * @param {string} dateKey - Format: 'YYYY-MM-DD'
 * @param {Object} entry - { food, servings, loggedAt }
 */
export const addFoodToLog = (dateKey, entry) => {
  const allLogs = JSON.parse(localStorage.getItem(FOOD_LOG_KEY) || '{}');
  if (!allLogs[dateKey]) allLogs[dateKey] = [];
  allLogs[dateKey].push({
    ...entry,
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    loggedAt: new Date().toISOString(),
  });
  localStorage.setItem(FOOD_LOG_KEY, JSON.stringify(allLogs));
  return allLogs[dateKey];
};

/**
 * Remove a food entry from the daily log.
 */
export const removeFoodFromLog = (dateKey, entryId) => {
  const allLogs = JSON.parse(localStorage.getItem(FOOD_LOG_KEY) || '{}');
  if (allLogs[dateKey]) {
    allLogs[dateKey] = allLogs[dateKey].filter(e => e.id !== entryId);
    localStorage.setItem(FOOD_LOG_KEY, JSON.stringify(allLogs));
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
  try {
    return JSON.parse(localStorage.getItem(BOOKMARKED_FOODS_KEY)) || [];
  } catch { return []; }
};

export const toggleBookmark = (foodId) => {
  const bookmarks = getBookmarkedFoods();
  const idx = bookmarks.indexOf(foodId);
  if (idx >= 0) {
    bookmarks.splice(idx, 1);
  } else {
    bookmarks.push(foodId);
  }
  localStorage.setItem(BOOKMARKED_FOODS_KEY, JSON.stringify(bookmarks));
  return bookmarks;
};

export const isBookmarked = (foodId) => {
  return getBookmarkedFoods().includes(foodId);
};
