import { PrismaClient, type Recipe as RecipeModel } from '@prisma/client';

import { BeverageResponse, BeverageWithRecipe } from '../types/beverage';
import { computeAvailability } from '../utils/helpers';

const prisma: PrismaClient = new PrismaClient();

function toResponse(beverage: BeverageWithRecipe): BeverageResponse {
  const availability = computeAvailability(beverage.recipe);
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