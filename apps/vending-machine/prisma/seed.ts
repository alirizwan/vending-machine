import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  // Ingredients
  const espresso = await prisma.ingredient.upsert({
    where: { name: 'espresso' },
    update: {},
    create: { name: 'espresso', stockUnits: 1000 }, // stock in "shots"
  });

  const milk = await prisma.ingredient.upsert({
    where: { name: 'milk' },
    update: {},
    create: { name: 'milk', stockUnits: 5000 }, // stock in "ml"
  });

  const sugar = await prisma.ingredient.upsert({
    where: { name: 'sugar' },
    update: {},
    create: { name: 'sugar', stockUnits: 2000 }, // stock in "grams"
  });

  // Espresso (1 shot espresso)
  await prisma.beverage.upsert({
    where: { name: 'Espresso' },
    update: {},
    create: {
      name: 'Espresso',
      price: 2.0,
      recipe: {
        create: [
          { ingredientId: espresso.id, quantity: 1, unit: 'shot' },
        ],
      },
    },
  });

  // Cappuccino (1 shot espresso + 150ml milk + 5g sugar)
  await prisma.beverage.upsert({
    where: { name: 'Cappuccino' },
    update: {},
    create: {
      name: 'Cappuccino',
      price: 3.0,
      recipe: {
        create: [
          { ingredientId: espresso.id, quantity: 1, unit: 'shot' },
          { ingredientId: milk.id, quantity: 150, unit: 'ml' },
          { ingredientId: sugar.id, quantity: 5, unit: 'gram' },
        ],
      },
    },
  });
}

main()
  .then(async () => {
    console.log('✅ Seed complete');
  })
  .catch(async (e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
