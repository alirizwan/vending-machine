/*
  Warnings:

  - You are about to drop the `BeverageIngredient` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "BeverageIngredient";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Recipe" (
    "beverageId" INTEGER NOT NULL,
    "ingredientId" INTEGER NOT NULL,
    "quantity" REAL NOT NULL,
    "unit" TEXT NOT NULL,

    PRIMARY KEY ("beverageId", "ingredientId"),
    CONSTRAINT "Recipe_beverageId_fkey" FOREIGN KEY ("beverageId") REFERENCES "Beverage" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Recipe_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
