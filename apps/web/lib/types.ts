export interface StockShortage {
  ingredientId: number;
  ingredient: string;
  required: number;
  available: number;
  unit: string;
}

export interface RecipeLine {
  ingredient: string;
  quantity: number;
  unit: string;
}

export interface Beverage {
  id: number;
  name: string;
  price: number;
  recipe: RecipeLine[];
  availability: boolean;
  shortages: StockShortage[];
}

export interface Ingredient {
  id: number;
  name: string;
  stockUnits: number;
}

export interface Payment {
  id: string;
  amountCents: number;
  currency: 'EUR' | 'USD';
  method: 'card' | 'cash' | 'mock';
  description?: string;
  machineId?: string;
  status: 'succeeded' | 'declined';
  createdAt: string;
}
