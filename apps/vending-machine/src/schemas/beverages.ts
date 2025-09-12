import { z } from 'zod';

export const RecipeLineSchema = z.object({
  ingredient: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.string().min(1), // e.g., "ml", "gram", "shot"
});

export const CreateBeverageSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
  recipe: z.array(RecipeLineSchema).min(1),
});

export const IdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type CreateBeverageBody = z.infer<typeof CreateBeverageSchema>;