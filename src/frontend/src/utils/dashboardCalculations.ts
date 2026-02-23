interface ProductionRecord {
  date: string;
  recipeName: string;
  quantity: number;
  cost: number;
  ingredients: Array<{ name: string; quantity: number }>;
}

export function calculateTotalConsumption(productions: ProductionRecord[]): Record<string, number> {
  const consumption: Record<string, number> = {};

  productions.forEach((prod) => {
    prod.ingredients.forEach((ing) => {
      if (consumption[ing.name]) {
        consumption[ing.name] += ing.quantity;
      } else {
        consumption[ing.name] = ing.quantity;
      }
    });
  });

  return consumption;
}

export function findTopIngredients(
  productions: ProductionRecord[]
): Array<{ name: string; quantity: number }> {
  const consumption = calculateTotalConsumption(productions);

  return Object.entries(consumption)
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);
}

export function calculateTotalCost(productions: ProductionRecord[]): number {
  return productions.reduce((total, prod) => total + prod.cost, 0);
}
