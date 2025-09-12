-- CreateTable
CREATE TABLE "Beverage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Ingredient" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "stockUnits" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "BeverageIngredient" (
    "beverageId" INTEGER NOT NULL,
    "ingredientId" INTEGER NOT NULL,

    PRIMARY KEY ("beverageId", "ingredientId"),
    CONSTRAINT "BeverageIngredient_beverageId_fkey" FOREIGN KEY ("beverageId") REFERENCES "Beverage" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BeverageIngredient_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Beverage_name_key" ON "Beverage"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Ingredient_name_key" ON "Ingredient"("name");
