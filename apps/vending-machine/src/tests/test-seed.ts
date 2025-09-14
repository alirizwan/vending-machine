import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  // Ingredients
  const espresso = await prisma.ingredient.create({
    data: { name: 'espresso', stockUnits: 10 }, // 10 shots
  });
  const milk = await prisma.ingredient.create({
    data: { name: 'milk', stockUnits: 1000 }, // ml
  });
  await prisma.ingredient.create({
    data: { name: 'sugar', stockUnits: 500 }, // grams
  });

  // Beverage: Cappuccino (requires espresso 1 shot + milk 150ml)
  const cap = await prisma.beverage.create({
    data: { name: 'Cappuccino', price: 300 },
  });

  await prisma.recipe.createMany({
    data: [
      { beverageId: cap.id, ingredientId: espresso.id, quantity: 1, unit: 'shot' },
      { beverageId: cap.id, ingredientId: milk.id, quantity: 150, unit: 'ml' },
      // Note: sugar intentionally omitted from recipe for override tests
    ],
  });

  // Another: Espresso (1 shot)
  const esp = await prisma.beverage.create({
    data: { name: 'Espresso', price: 200 },
  });
  await prisma.recipe.create({
    data: { beverageId: esp.id, ingredientId: espresso.id, quantity: 1, unit: 'shot' },
  });
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
