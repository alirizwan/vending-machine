import { Router, type RequestHandler } from 'express';
import { PrismaClient, type Ingredient as IngredientModel } from '@prisma/client';
import { authenticate, requireMaintenance } from '../middleware/auth.js';
import { envSchema, type Env } from '../types/env.js';

const prisma: PrismaClient = new PrismaClient();
const env: Env = envSchema.parse(process.env);

export interface IngredientResponse {
  id: number;
  name: string;
  stockUnits: number;
}

const listIngredients: RequestHandler = async (_req, res) => {
  const list: IngredientModel[] = await prisma.ingredient.findMany({ orderBy: { name: 'asc' } });
  const payload: IngredientResponse[] = list.map((i) => ({ id: i.id, name: i.name, stockUnits: i.stockUnits }));
  res.json(payload);
};

export const ingredientsRouter: Router = Router()
  .get('/ingredients', authenticate(env.JWT_SECRET), requireMaintenance, listIngredients);
