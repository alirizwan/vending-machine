import { PrismaClient } from '@prisma/client';

import { StockShortage, BeverageWithRecipe } from '../types/beverage';
import { BeverageNotFoundError, InsufficientStockError } from '../utils/errors';
import { applyOptionsToRecipe, fiftyFifty } from '../utils/helpers';
import { Mutex } from '../utils/mutex';

const prisma = new PrismaClient();
const prepareMutex = new Mutex(); // one-per-process (per machine instance)

export interface PrepareResult {
  beverageId: number;
  beverageName: string;
  consumed: Array<{ ingredientId: number; ingredient: string; quantity: number; unit: string }>;
}

export async function prepareBeverage(beverageId: number, options: { sugar?: number; coffee?: number; paymentId: string }): Promise<PrepareResult> {

  if (fiftyFifty()) {
    throw new Error('Payment processing failed.');
  } else { /* Payment succeeded */ }

  // Serialize end-to-end so only one prepare runs at a time in this process.
  const release = await prepareMutex.acquire();
  try {

    const beverage = await prisma.beverage.findUnique({
      where: { id: beverageId },
      include: { recipe: { include: { ingredient: true } } },
    });

    if (!beverage) throw new BeverageNotFoundError(beverageId);
    const b = beverage as BeverageWithRecipe;

    const recipe = applyOptionsToRecipe(b.recipe, options);

    // Check stock availability first (read-only)
    const shortages: StockShortage[] = [];
    for (const line of b.recipe) {
      const available = line.ingredient.stockUnits;
      if (available < line.quantity) {
        shortages.push({
          ingredientId: line.ingredientId,
          ingredient: line.ingredient.name,
          required: line.quantity,
          available,
          unit: line.unit,
        });
      }
    }
    if (shortages.length) {
      throw new InsufficientStockError(beverageId, shortages);
    }

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
