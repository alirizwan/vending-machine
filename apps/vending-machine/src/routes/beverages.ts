import { Router, type RequestHandler } from 'express';
import { listBeverages, createBeverage, getBeverageById } from '../services/beverages';
import { prepareBeverage, BeverageNotFoundError, InsufficientStockError } from '../services/prepare.js';
import { CreateBeverageSchema, IdParamSchema } from '../schemas/beverages';

export default function beveragesRoutes(): Router {

  const list: RequestHandler = async (_req, res) => {
    console.log('Listing beverages');
    const data = await listBeverages();
    res.status(200).json(data);
  };

  const getOne: RequestHandler = async (req, res, next) => {
    try {
      const parsed = IdParamSchema.safeParse(req.params);
      if (!parsed.success) {
        res.status(400).json({ message: 'Invalid id', issues: parsed.error.issues });
        return;
      }
      const found = await getBeverageById(parsed.data.id);
      if (!found) {
        res.status(404).json({ message: 'Beverage not found' });
        return;
      }
      res.status(200).json(found);
    } catch (err) {
      next(err);
    }
  };

  const create: RequestHandler = async (_req, res) => {

    const parsed = CreateBeverageSchema.safeParse(_req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Invalid body', issues: parsed.error.issues });
      return;
    }

    const data = await createBeverage(parsed.data);
    res.status(201).json(data);
  };

  const prepare: RequestHandler = async (req, res, next) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) return void res.status(400).json({ message: 'Invalid beverage id' });
    try {
      const result = await prepareBeverage(id);
      res.status(200).json(result);
    } catch (err) {
      if (err instanceof BeverageNotFoundError) {
        res.status(404).json({ message: err.message, beverageId: err.beverageId });
      } else if (err instanceof InsufficientStockError) {
        res.status(409).json({ message: err.message, beverageId: err.beverageId, shortages: err.shortages });
      } else {
        next(err);
      }
    }
  };

  return Router()
    .get('/beverages', list)
    .get('/beverages/:id', getOne)
    .post('/beverages', create)
    .post('/beverages/:id/prepare', prepare);
}