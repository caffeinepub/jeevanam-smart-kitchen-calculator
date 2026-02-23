import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calculator, DollarSign } from 'lucide-react';
import { useGetAllRecipes, useCalculateCost, useGetAllRawMaterials } from '../hooks/useQueries';
import { toast } from 'sonner';
import type { RecipeCostAnalysis, CostBreakdown } from '../backend';

export default function CostAnalysis() {
  const [selectedRecipe, setSelectedRecipe] = useState('');
  const [quantity, setQuantity] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [costResult, setCostResult] = useState<RecipeCostAnalysis | null>(null);

  const { data: recipes } = useGetAllRecipes();
  const { data: rawMaterials } = useGetAllRawMaterials();
  const calculateCostMutation = useCalculateCost();

  const handleCalculate = async () => {
    if (!selectedRecipe || !quantity) {
      toast.error('Please select a recipe and enter quantity');
      return;
    }

    try {
      const result = await calculateCostMutation.mutateAsync({
        recipeName: selectedRecipe,
        quantity: parseFloat(quantity),
      });

      // Find the selected recipe to get ingredient details
      const recipe = recipes?.find(r => r.name === selectedRecipe);
      
      if (!recipe) {
        toast.error('Recipe not found');
        return;
      }

      // Fix backend calculation by applying proper unit conversion
      const fixedBreakdown: CostBreakdown[] = result.breakdown.map(item => {
        // Find the corresponding ingredient in the recipe to get its original unit
        const recipeIngredient = recipe.ingredients.find(ing => ing.name === item.ingredient);
        
        if (!recipeIngredient) {
          return item;
        }

        // Find the raw material to get its unit type
        const rawMaterial = rawMaterials?.find(rm => rm.rawMaterialName === item.ingredient);
        
        if (!rawMaterial) {
          return item;
        }

        // Calculate the correct cost with unit conversion
        let quantityInBaseUnit = item.quantity;
        let correctTotalCost = item.totalCost;

        // Convert grams to kilograms if raw material is in Kg
        if ((recipeIngredient.unit === 'g' || recipeIngredient.unit === 'grams') && rawMaterial.unitType === 'Kg') {
          // quantity_in_kg = quantity_in_grams ÷ 1000
          quantityInBaseUnit = item.quantity / 1000;
          // Ingredient cost = quantity_in_kg × cost_per_kg
          correctTotalCost = quantityInBaseUnit * item.costPerUnit;
        }
        // Convert milliliters to liters if raw material is in Liter
        else if ((recipeIngredient.unit === 'ml' || recipeIngredient.unit === 'milliliters') && rawMaterial.unitType === 'Liter') {
          // quantity_in_L = quantity_in_ml ÷ 1000
          quantityInBaseUnit = item.quantity / 1000;
          // Ingredient cost = quantity_in_L × cost_per_liter
          correctTotalCost = quantityInBaseUnit * item.costPerUnit;
        }

        return {
          ...item,
          quantity: item.quantity, // Keep original recipe quantity for display
          unit: recipeIngredient.unit, // Use original recipe unit for display
          totalCost: correctTotalCost
        };
      });

      // Recalculate totals with fixed values
      const fixedTotalBatchCost = fixedBreakdown.reduce((sum, item) => sum + item.totalCost, 0);
      const fixedCostPerPortion = fixedTotalBatchCost / parseFloat(quantity);

      const fixedResult: RecipeCostAnalysis = {
        breakdown: fixedBreakdown,
        totalBatchCost: fixedTotalBatchCost,
        costPerPortion: fixedCostPerPortion
      };

      setCostResult(fixedResult);
      toast.success('Cost calculated successfully');
    } catch (error) {
      toast.error('Failed to calculate cost. Make sure ingredient costs are set.');
      console.error(error);
    }
  };

  const formatCurrency = (value: number): string => {
    return `₹${value.toFixed(2)}`;
  };

  const calculateProfitPerPortion = (): number => {
    if (!costResult || !sellingPrice) return 0;
    const cost = costResult.costPerPortion;
    const selling = parseFloat(sellingPrice);
    return selling - cost;
  };

  const calculateProfitPercentage = (): number => {
    if (!costResult || !sellingPrice) return 0;
    const cost = costResult.costPerPortion;
    const selling = parseFloat(sellingPrice);
    if (selling === 0) return 0;
    return ((selling - cost) / selling) * 100;
  };

  const calculateFoodCostPercentage = (): number => {
    if (!costResult || !sellingPrice) return 0;
    const cost = costResult.costPerPortion;
    const selling = parseFloat(sellingPrice);
    if (selling === 0) return 0;
    return (cost / selling) * 100;
  };

  return (
    <div className="space-y-6">
      <Card className="border-[oklch(0.88_0.03_60)]">
        <CardHeader className="bg-gradient-to-r from-[oklch(0.97_0.015_60)] to-[oklch(0.95_0.02_80)]">
          <CardTitle className="text-[oklch(0.35_0.08_35)]">Select Recipe</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="recipe">Recipe Name</Label>
              <Select value={selectedRecipe} onValueChange={setSelectedRecipe}>
                <SelectTrigger id="recipe">
                  <SelectValue placeholder="Select recipe" />
                </SelectTrigger>
                <SelectContent>
                  {recipes?.map((recipe) => (
                    <SelectItem key={recipe.name} value={recipe.name}>
                      {recipe.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Production Quantity</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="e.g., 100"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="1"
                step="0.1"
              />
            </div>
          </div>

          <Button
            onClick={handleCalculate}
            disabled={!selectedRecipe || !quantity || calculateCostMutation.isPending}
            className="w-full mt-6 bg-gradient-to-r from-[oklch(0.62_0.15_35)] to-[oklch(0.55_0.18_30)] hover:from-[oklch(0.58_0.15_35)] hover:to-[oklch(0.51_0.18_30)] text-white"
          >
            <Calculator className="mr-2 h-4 w-4" />
            {calculateCostMutation.isPending ? 'Calculating...' : 'Calculate Cost'}
          </Button>
        </CardContent>
      </Card>

      {costResult && (
        <>
          {/* Ingredient Cost Breakdown */}
          <Card className="border-[oklch(0.88_0.03_60)]">
            <CardHeader className="bg-gradient-to-r from-[oklch(0.65_0.12_140)] to-[oklch(0.60_0.10_150)]">
              <CardTitle className="text-white">Ingredient Cost Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Ingredient</TableHead>
                    <TableHead className="text-right font-semibold">Quantity</TableHead>
                    <TableHead className="text-right font-semibold">Cost per Unit</TableHead>
                    <TableHead className="text-right font-semibold">Total Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {costResult.breakdown.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{item.ingredient}</TableCell>
                      <TableCell className="text-right">
                        {item.quantity.toFixed(2)} {item.unit}
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(item.costPerUnit)}</TableCell>
                      <TableCell className="text-right font-semibold text-[oklch(0.55_0.18_30)]">
                        {formatCurrency(item.totalCost)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Total Costs */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-[oklch(0.88_0.03_60)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-muted-foreground">Total Batch Cost</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-[oklch(0.55_0.18_30)]">
                  {formatCurrency(costResult.totalBatchCost)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Total raw material cost</p>
              </CardContent>
            </Card>

            <Card className="border-[oklch(0.88_0.03_60)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-muted-foreground">Cost Per Portion</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-[oklch(0.55_0.18_30)]">
                  {formatCurrency(costResult.costPerPortion)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Cost per serving</p>
              </CardContent>
            </Card>
          </div>

          {/* Section 3: Profit Margin Calculator */}
          <Card className="border-[oklch(0.88_0.03_60)]">
            <CardHeader className="bg-gradient-to-r from-[oklch(0.97_0.015_60)] to-[oklch(0.95_0.02_80)]">
              <CardTitle className="text-[oklch(0.35_0.08_35)]">Section 3: Profit Margin Calculator</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="sellingPrice">Selling Price Per Portion (₹)</Label>
                <Input
                  id="sellingPrice"
                  type="number"
                  placeholder="Enter selling price"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>

              {sellingPrice && parseFloat(sellingPrice) > 0 && (
                <>
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card className="border-[oklch(0.88_0.03_60)]">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-muted-foreground">Profit per Portion</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold text-[oklch(0.65_0.12_140)]">
                          {formatCurrency(calculateProfitPerPortion())}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-[oklch(0.88_0.03_60)]">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-muted-foreground">Profit %</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold text-[oklch(0.65_0.12_140)]">
                          {calculateProfitPercentage().toFixed(2)}%
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-[oklch(0.88_0.03_60)]">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-muted-foreground">Food Cost %</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold text-[oklch(0.55_0.18_30)]">
                          {calculateFoodCostPercentage().toFixed(2)}%
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Summary Box */}
                  <Card className="bg-gradient-to-r from-[oklch(0.65_0.12_140)] to-[oklch(0.60_0.10_150)] border-0">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3 mb-3">
                        <DollarSign className="h-6 w-6 text-white" />
                        <h3 className="text-lg font-semibold text-white">Cost Analysis Summary</h3>
                      </div>
                      <div className="space-y-2 text-white">
                        <p className="text-sm">
                          <strong>Formula:</strong> Food Cost % = (Cost per portion ÷ Selling price) × 100
                        </p>
                        <p className="text-sm">
                          <strong>Calculation:</strong> ({formatCurrency(costResult.costPerPortion)} ÷ {formatCurrency(parseFloat(sellingPrice))}) × 100 = <strong>{calculateFoodCostPercentage().toFixed(2)}%</strong>
                        </p>
                        <p className="text-sm mt-3">
                          {calculateFoodCostPercentage() <= 30 
                            ? '✓ Excellent food cost percentage! Your pricing is optimal.' 
                            : calculateFoodCostPercentage() <= 35
                            ? '✓ Good food cost percentage. Consider minor adjustments for better margins.'
                            : '⚠ High food cost percentage. Consider reviewing your pricing or ingredient costs.'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
