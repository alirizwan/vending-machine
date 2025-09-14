import { type Beverage as BeverageModel, type Ingredient as IngredientModel, type Recipe as RecipeModel } from '@prisma/client';

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

export interface IngredientResponse {
  id: number;
  name: string;
  stockUnits: number;
}