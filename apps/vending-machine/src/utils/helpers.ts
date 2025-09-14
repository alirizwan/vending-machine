type RecipeLine = {
  ingredient: string;
  quantity: number;
  unit: string;
};

interface PrepareOptions {
  sugar: number; // can be 0
  shots: number; // requested espresso shots
}

export function applyOptionsToRecipe(
  baseRecipe: RecipeLine[],
  options: PrepareOptions
): RecipeLine[] {
  return baseRecipe.map((line) => {
    if (line.ingredient.toLowerCase() === 'sugar') {
      return { ...line, quantity: options.sugar };
    }
    if (line.ingredient.toLowerCase() === 'espresso' || line.ingredient.toLowerCase() === 'coffee') {
      const finalQty = Math.max(line.quantity, options.shots);
      return { ...line, quantity: finalQty };
    }

    return line;
  });
}

export function fiftyFifty(): boolean {
  return Math.random() < 0.5;
}