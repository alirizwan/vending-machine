import { PrismaClient, type Recipe as RecipeModel } from '@prisma/client';

import { BeverageResponse, BeverageWithRecipe, StockShortage, Availability } from '../types/beverage';

const prisma: PrismaClient = new PrismaClient();

export function computeAvailability(b: BeverageWithRecipe): Availability {
  const shortages: StockShortage[] = [];

  for (const line of b.recipe) {
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

function toResponse(beverage: BeverageWithRecipe): BeverageResponse {
  const availability = computeAvailability(beverage);
  return {
    id: beverage.id,
    name: beverage.name,
    price: beverage.price,
    recipe: beverage.recipe.map((recipe: RecipeModel) => ({
      ingredient: recipe.ingredient.name,
      quantity: recipe.quantity,
      unit: recipe.unit,
    })),
    availability: availability.canPrepare,
    shortages: availability.shortages
  };
}

export const listBeverages = async (): Promise<BeverageResponse[]> => {

  const list = await prisma.beverage.findMany({
    include: { recipe: { include: { ingredient: true } } },
    orderBy: { name: 'asc' },
  });

  const payload: BeverageResponse[] = (list as BeverageWithRecipe[]).map((beverage) => toResponse(beverage));

  return payload;

};

export async function getBeverageById(id: number): Promise<BeverageResponse | null> {
  const row = await prisma.beverage.findUnique({
    where: { id },
    include: { recipe: { include: { ingredient: true } } },
  });
  if (!row) return null;

  const beverage = row as BeverageWithRecipe;

  return toResponse(beverage);
}