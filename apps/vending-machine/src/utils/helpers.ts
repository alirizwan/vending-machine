import { RecipeLine, Ingredient, StockShortage, Availability } from '../types/beverage';

interface PrepareOptions {
  sugar: number;
  espresso: number;
}

export function applyOptionsToRecipe(
  baseRecipe: RecipeLine[],
  sugar: Ingredient | null,
  options: PrepareOptions
): RecipeLine[] {
  const updated: RecipeLine[] = [];
  let hasSugar = false;

  for (const line of baseRecipe) {
    if (line.ingredient.name.toLowerCase() === 'sugar') {
      hasSugar = true;
      updated.push({ ...line, quantity: options.sugar }); // can be 0
    } else if (
      line.ingredient.name.toLowerCase() === 'espresso'
    ) {
      const finalQty = Math.max(line.quantity, options.espresso);
      updated.push({ ...line, quantity: finalQty });
    } else {
      updated.push(line);
    }
  }

  // Add sugar if not present and requested
  if (sugar && !hasSugar && options.sugar > 0) {
    updated.push({
      ingredientId: sugar.id,
      beverageId: 0,
      ingredient: sugar,
      quantity: options.sugar,
      unit: 'gram',
    });
  }

  return updated;
}

export function computeAvailability(recipe: Array<RecipeLine>): Availability {
  const shortages: StockShortage[] = [];

  for (const line of recipe) {
    const available = line.ingredient.stockUnits;
    const required = line.quantity;

    if (available < required) {
      shortages.push({
        ingredientId: line.ingredientId,
        ingredient: line.ingredient.name,
        required,
        available,
        unit: line.unit,
      });
    }
  }

  return { canPrepare: shortages.length === 0, shortages };
}

export function eightyTwenty(): boolean {
  return Math.random() < 0.8;
}