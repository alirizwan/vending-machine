export class BeverageNotFoundError extends Error {
  constructor(public readonly beverageId: number) {
    super(`Beverage ${beverageId} not found`);
    this.name = 'BeverageNotFoundError';
  }
}
export class InsufficientStockError extends Error {
  constructor(public readonly beverageId: number, public readonly shortages: StockShortage[]) {
    super('Insufficient stock to prepare beverage');
    this.name = 'InsufficientStockError';
  }
}