import { PrismaClient, type Beverage as BeverageModel, type Ingredient as IngredientModel, type Recipe as RecipeModel } from '@prisma/client';
//import { CreateBeverageSchema, type CreateBeverageBody } from '../schemas/beverages';

const prisma: PrismaClient = new PrismaClient();

export interface RecipeLineResponse {
  ingredient: string;
  quantity: number;
  unit: string;
}

export interface BeverageResponse {
  id: number;
  name: string;
  price: number;
  recipe: RecipeLineResponse[];
  availability: boolean;
  shortages: StockShortage[];
}

export type BeverageWithRecipe = BeverageModel & {
  recipe: Array<RecipeModel & { ingredient: IngredientModel }>;
};

export interface StockShortage {
  ingredientId: number;
  ingredient: string;
  required: number;
  available: number;
  unit: string;
}

export interface Availability {
  canPrepare: boolean;
  shortages: StockShortage[];
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

export interface StockShortage {
  ingredientId: number;
  ingredient: string;
  required: number;
  available: number;
  unit: string;
}

export interface Availability {
  canPrepare: boolean;
  shortages: StockShortage[];
}

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

export const createBeverage = async (body: CreateBeverageBody): Promise<BeverageResponse> => {

  const connected = await Promise.all(
    body.ingredients.map(async (n) => {
      const ing = await prisma.ingredient.upsert({
        where: { name: n },
        update: {},
        create: { name: n, stockUnits: 100 },
      });
      return { ingredientId: ing.id };
    }),
  );

  const created = await prisma.beverage.create({
    data: { name: body.name, price: body.price, ingredients: { create: connected } },
    include: { ingredients: { include: { ingredient: true } } },
  });

  return created;

};
