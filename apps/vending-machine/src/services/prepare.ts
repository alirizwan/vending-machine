import { PrismaClient, type Beverage as BeverageModel, type Ingredient as IngredientModel, type Recipe as RecipeModel } from '@prisma/client';
import { Mutex } from '../utils/mutex.js';

const prisma = new PrismaClient();
const prepareMutex = new Mutex(); // one-per-process (per machine instance)

export class BeverageNotFoundError extends Error {
  constructor(public readonly beverageId: number) {
    super(`Beverage ${beverageId} not found`);
    this.name = 'BeverageNotFoundError';
  }
}

export interface StockIssue {
  ingredientId: number;
  ingredient: string;
  required: number;
  available: number;
  unit: string;
}

export class InsufficientStockError extends Error {
  constructor(public readonly beverageId: number, public readonly shortages: StockIssue[]) {
    super('Insufficient stock to prepare beverage');
    this.name = 'InsufficientStockError';
  }
}

export interface PrepareResult {
  beverageId: number;
  beverageName: string;
  consumed: Array<{ ingredientId: number; ingredient: string; quantity: number; unit: string }>;
}

type BeverageWithRecipe = BeverageModel & {
  recipe: Array<RecipeModel & { ingredient: IngredientModel }>;
};

export async function prepareBeverage(beverageId: number): Promise<PrepareResult> {
  // Serialize end-to-end so only one prepare runs at a time in this process.
  const release = await prepareMutex.acquire();
  try {
    // Load beverage + recipe
    const bev = await prisma.beverage.findUnique({
      where: { id: beverageId },
      include: { recipe: { include: { ingredient: true } } },
    });
    if (!bev) throw new BeverageNotFoundError(beverageId);
    const b = bev as BeverageWithRecipe;

    // Check stock availability first (read-only)
    const shortages: StockIssue[] = [];
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
      for (const line of b.recipe) {
        // No guard needed now; serialized prepares ensure no concurrent decrements.
        await tx.ingredient.update({
          where: { id: line.ingredientId },
          data: { stockUnits: { decrement: line.quantity } },
        });
      }
      // (Optional) persist a preparation record here
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
