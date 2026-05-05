import { DEFAULT_FOODS, searchFoods } from '../../utils/foodDatabase';

const popularFoodIds = [
  'egg',
  'chicken_breast_raw',
  'white_rice_raw',
  'banana',
  'peanut_butter',
  'oats',
  'almonds',
  'whey_protein',
  'honey',
];

export function getMealSearchResults(query) {
  if (!query.trim()) {
    return DEFAULT_FOODS.filter((food) => popularFoodIds.includes(food.id));
  }

  return searchFoods(query);
}

export function adjustMealItemServings(items, index, delta) {
  return items.map((item, itemIndex) => {
    if (itemIndex !== index) return item;
    const currentServings = item.servings || 1;
    return { ...item, servings: Math.max(0.5, currentServings + delta) };
  });
}

export function setMealItemServings(items, index, servings) {
  return items.map((item, itemIndex) => (
    itemIndex === index ? { ...item, servings: Math.max(0.1, servings) } : item
  ));
}
