import { Ingredient, PrismaClient } from '@prisma/client';

import { BeverageWithRecipe } from '../types/beverage';
import { BeverageNotFoundError, InsufficientStockError } from '../utils/errors';
import { applyOptionsToRecipe, eightyTwenty, computeAvailability } from '../utils/helpers';
import { Mutex } from '../utils/mutex';

const prisma = new PrismaClient();
const prepareMutex = new Mutex(); // one-per-process (per machine instance)

export interface PrepareResult {
  beverageId: number;
  beverageName: string;
  consumed: Array<{ ingredientId: number; ingredient: string; quantity: number; unit: string }>;
}

export async function prepareBeverage(beverageId: number, options: { sugar?: number; shots?: number; paymentId: string }): Promise<PrepareResult> {

  // Serialize end-to-end so only one prepare runs at a time in this process.
  const release = await prepareMutex.acquire();
  try {

    const beverage = await prisma.beverage.findUnique({
      where: { id: beverageId },
      include: { recipe: { include: { ingredient: true } } },
    });

    if (!beverage) throw new BeverageNotFoundError(beverageId);
    const b = beverage as BeverageWithRecipe;

    const sugar: Ingredient | null = await prisma.ingredient.findFirst({
      where: { name: 'sugar' },
    });

    if (!sugar && options.sugar && options.sugar > 0) {
       throw new Error('Sugar ingredient not found in inventory.');
    }

    const recipe = applyOptionsToRecipe(b.recipe, sugar, { sugar: options.sugar ?? 0, espresso: options.shots ?? 0 });

    const { shortages } = computeAvailability(recipe);

    if (shortages.length) {
      throw new InsufficientStockError(beverageId, shortages);
    }

    if (!eightyTwenty()) {
      throw new Error('Payment processing failed.');
    } else { /* Payment succeeded */ }

    // Atomic decrement (transaction for consistency)
    await prisma.$transaction(async (tx) => {
      for (const line of recipe) {
        await tx.ingredient.update({
          where: { id: line.ingredientId },
          data: { stockUnits: { decrement: line.quantity } },
        });
      }
    });

    return {
      beverageId: b.id,
      beverageName: b.name,
      consumed: b.recipe.map((r) => ({
        ingredientId: r.ingredientId,
        ingredient: r.ingredient.name,
        quantity: r.quantity,
        unit: r.unit,
      })),
    };
  } finally {
    release();
  }
}
