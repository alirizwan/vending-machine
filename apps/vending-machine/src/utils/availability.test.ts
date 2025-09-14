import { PrismaClient, type Ingredient } from '@prisma/client';
import { describe, it, expect } from 'vitest';

import { type BeverageWithRecipe, RecipeLine } from '../types/beverage';

import { computeAvailability } from './helpers';


const prisma = new PrismaClient();

async function loadCappuccino(): Promise<BeverageWithRecipe> {
  const b = await prisma.beverage.findFirstOrThrow({
    where: { name: 'Cappuccino' },
    include: { recipe: { include: { ingredient: true } } },
  });
  return b as unknown as BeverageWithRecipe;
}

describe('computeAvailability', () => {
  it('returns available true for default seeded cappuccino', async () => {
    const b = await loadCappuccino();
    const result = computeAvailability(b.recipe as RecipeLine[]);
    expect(result.canPrepare).toBe(true);
    expect(result.shortages).toEqual([]);
  });

  it('returns shortage when custom recipe requires more than stock', async () => {
    const b = await loadCappuccino();
    const sugar = await prisma.ingredient.findFirstOrThrow({ where: { name: { equals: 'sugar' } } });

    const custom: RecipeLine[] = [
      ...b.recipe.map(r => ({
        beverageId: b.id,
        ingredientId: r.ingredientId,
        ingredient: r.ingredient as Ingredient,
        quantity: r.quantity,
        unit: r.unit,
      })),
      { ingredientId: sugar.id, beverageId: b.id, ingredient: sugar, quantity: 9999, unit: 'gram' },
    ];

    const result = computeAvailability(custom);
    expect(result.canPrepare).toBe(false);
    expect(result.shortages.some(s => s.ingredientId === sugar.id)).toBe(true);
  });
});
