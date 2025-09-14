import { Router, type RequestHandler } from 'express';

import { authenticate, requireTechnician } from '../middleware/auth';
import { envSchema, type Env } from '../schemas/env';
import { BulkAdjustSchema, type BulkAdjustBody } from '../schemas/ingredients';
import { listIngredients, adjustIngredientQuantities } from '../services/ingredients';

const env: Env = envSchema.parse(process.env);

export default function ingredientsRoutes(): Router {
  const list: RequestHandler = async (_req, res, next) => {
    try {
      const data = await listIngredients();
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  };

  const adjust: RequestHandler = async (req, res, next) => {
    try {
      const parsed = BulkAdjustSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ message: 'Invalid body', issues: parsed.error.issues });
        return;
      }
      const body: BulkAdjustBody = parsed.data;
      const data = await adjustIngredientQuantities(body);
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  };

  return Router()
    .get('/ingredients', authenticate(env.JWT_SECRET), requireTechnician, list)
    .patch('/ingredients', authenticate(env.JWT_SECRET), requireTechnician, adjust);
}
