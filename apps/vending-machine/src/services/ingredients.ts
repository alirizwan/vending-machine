import { PrismaClient, type Ingredient as IngredientModel } from '@prisma/client';
import type { BulkAdjustBody, AdjustLine } from '../schemas/ingredients.js';

const prisma = new PrismaClient();

export interface IngredientResponse {
  id: number;
  name: string;
  stockUnits: number;
}

/** List all ingredients (for maintenance) */
export async function listIngredients(): Promise<IngredientResponse[]> {
  const rows: IngredientModel[] = await prisma.ingredient.findMany({
    orderBy: { name: 'asc' },
  });
  return rows.map((i) => ({ id: i.id, name: i.name, stockUnits: i.stockUnits }));
}

/**
 * Adjust ingredient quantities in bulk, atomically.
 * Supports 'set' | 'increment' | 'decrement'.
 * Throws if any id does not exist or if a decrement would go below zero.
 */
export async function adjustIngredientQuantities(body: BulkAdjustBody): Promise<IngredientResponse[]> {
  // Preload all referenced ingredients
  const ids = body.changes.map((c) => c.id);
  const found = await prisma.ingredient.findMany({ where: { id: { in: ids } } });
  const byId = new Map(found.map((i) => [i.id, i]));

  // Validate existence & floor at 0
  for (const change of body.changes) {
    const current = byId.get(change.id);
    if (!current) {
      throw Object.assign(new Error(`Ingredient ${change.id} not found`), { status: 404 });
    }
    const preview = previewNewValue(current.stockUnits, change);
    if (preview < 0) {
      throw Object.assign(
        new Error(`Insufficient stock for ingredient ${change.id} (${current.name})`),
        { status: 409, ingredientId: change.id, current: current.stockUnits, attempt: preview },
      );
    }
  }

  // Apply atomically
  const updated = await prisma.$transaction(async (tx) => {
    const results: IngredientModel[] = [];
    for (const change of body.changes) {
      const current = byId.get(change.id)!;
      let data: { stockUnits: number } | { stockUnits: { increment: number } } | { stockUnits: { decrement: number } } | undefined = undefined;

      switch (change.op) {
        case 'set':
          data = { stockUnits: previewNewValue(current.stockUnits, change) };
          break;
        case 'increment':
          data = { stockUnits: { increment: change.amount } };
          break;
        case 'decrement':
          data = { stockUnits: { decrement: change.amount } };
          break;
      }

      const row = await tx.ingredient.update({
        where: { id: change.id },
        data,
      });
      results.push(row);
      // Keep the map in sync if multiple changes hit same id
      byId.set(change.id, row);
    }
    // Return full, sorted state after changes
    return tx.ingredient.findMany({ orderBy: { name: 'asc' } });
  });

  return updated.map((i) => ({ id: i.id, name: i.name, stockUnits: i.stockUnits }));
}

/** Pure helper to compute the new value for a single change (used for validation/preview) */
function previewNewValue(current: number, change: AdjustLine): number {
  switch (change.op) {
    case 'set':
      return change.amount;
    case 'increment':
      return current + change.amount;
    case 'decrement':
      return current - change.amount;
  }

  throw new Error('Invalid operation');
}
