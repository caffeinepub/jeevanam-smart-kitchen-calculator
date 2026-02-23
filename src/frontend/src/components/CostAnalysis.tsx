import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Calculator, DollarSign, AlertCircle, Loader2 } from 'lucide-react';
import { useGetAllRecipes, useCalculateCost, useGetAllRawMaterials } from '../hooks/useQueries';
import { toast } from 'sonner';
import type { RecipeCostAnalysis } from '../backend';

export default function CostAnalysis() {
  const [selectedRecipe, setSelectedRecipe] = useState('');
  const [quantity, setQuantity] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [costResult, setCostResult] = useState<RecipeCostAnalysis | null>(null);

  const { data: recipes, isLoading: recipesLoading, error: recipesError } = useGetAllRecipes();
  const { data: rawMaterials, isLoading: rawMaterialsLoading, error: rawMaterialsError } = useGetAllRawMaterials();
  const calculateCostMutation = useCalculateCost();

  // Create a map of raw material ID to raw material data for quick lookup
  const rawMaterialsMap = new Map(
    rawMaterials?.map(rm => [rm.id.toString(), rm]) || []
  );

  // Helper function to convert ingredient quantity to match raw material unit
  const convertQuantityToRawMaterialUnit = (ingredientQty: number, ingredientUnit: string, rawMaterialUnit: string): number => {
    // If ingredient is in grams and raw material is in Kg, convert grams to kg
    if (ingredientUnit === 'g' && rawMaterialUnit === 'Kg') {
      return ingredientQty / 1000;
    }
    // If ingredient is in ml and raw material is in L, convert ml to liters
    if (ingredientUnit === 'ml' && rawMaterialUnit === 'L') {
      return ingredientQty / 1000;
    }
    // Otherwise, assume units match
    return ingredientQty;
  };

  const handleCalculate = async () => {
    if (!selectedRecipe || !quantity) {
      toast.error('Please select a recipe and enter quantity');
      return;
    }

    // Find the selected recipe to check if all ingredients have costs
    const recipe = recipes?.find(r => r.name === selectedRecipe);
    
    if (!recipe) {
      toast.error('Recipe not found');
      return;
    }

    // Check if all ingredients have costs set in Raw Material Master using rawMaterialId
    const missingCosts: Array<{ rawMaterialId: bigint; rawMaterialName: string }> = [];
    
    recipe.ingredients.forEach(ing => {
      const rawMaterial = rawMaterialsMap.get(ing.rawMaterialId.toString());
      
      // Missing cost if: no raw material found OR pricePerUnit is 0, null, or undefined
      if (!rawMaterial || !rawMaterial.pricePerUnit || rawMaterial.pricePerUnit === 0) {
        missingCosts.push({
          rawMaterialId: ing.rawMaterialId,
          rawMaterialName: rawMaterial?.rawMaterialName || `ID: ${ing.rawMaterialId}`
        });
      }
    });

    if (missingCosts.length > 0) {
      const errorMsg = `Missing costs for: ${missingCosts.map(m => m.rawMaterialName).join(', ')}. Please set ingredient costs in the Raw Material Master first.`;
      toast.error(errorMsg);
      return;
    }

    try {
      const result = await calculateCostMutation.mutateAsync({
        recipeName: selectedRecipe,
        quantity: parseFloat(quantity),
      });

      // Check if we got any breakdown results
      if (!result.breakdown || result.breakdown.length === 0) {
        toast.error('No cost data available. Please ensure ingredient costs are set in the Raw Material Master.');
        return;
      }

      // Correct the cost calculation by applying unit conversion
      // The backend multiplies raw quantities without unit conversion
      // We need to recalculate with proper unit conversion
      let correctedTotalCost = 0;
      const correctedBreakdown = result.breakdown.map((item, idx) => {
        const ingredient = recipe.ingredients[idx];
        const rawMaterial = rawMaterialsMap.get(ingredient.rawMaterialId.toString());
        
        if (!rawMaterial) {
          return item;
        }

        // Calculate the total quantity needed for this production batch
        const totalIngredientQty = ingredient.quantityPerPortion * parseFloat(quantity);
        
        // Convert ingredient quantity to match raw material unit
        const convertedQty = convertQuantityToRawMaterialUnit(
          totalIngredientQty,
          ingredient.unit,
          rawMaterial.unitType
        );
        
        // Calculate correct cost with converted quantity
        const correctedTotalCost = convertedQty * rawMaterial.pricePerUnit;
        
        return {
          costPerUnit: rawMaterial.pricePerUnit,
          totalCost: correctedTotalCost
        };
      });

      // Sum up corrected total costs
      correctedTotalCost = correctedBreakdown.reduce((sum, item) => sum + item.totalCost, 0);

      const correctedResult: RecipeCostAnalysis = {
        totalBatchCost: correctedTotalCost,
        costPerPortion: correctedTotalCost / parseFloat(quantity),
        breakdown: correctedBreakdown
      };

      setCostResult(correctedResult);
      toast.success('Cost calculated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to calculate cost. Make sure ingredient costs are set.');
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

  // Check if selected recipe has all ingredient costs set using rawMaterialId
  const selectedRecipeData = recipes?.find(r => r.name === selectedRecipe);
  const missingCostsForSelectedRecipe = selectedRecipeData?.ingredients.filter(ing => {
    // Find the raw material by ID
    const rawMaterial = rawMaterialsMap.get(ing.rawMaterialId.toString());
    
    // Missing cost if: no raw material found OR pricePerUnit is 0, null, or undefined
    if (!rawMaterial) {
      return true;
    }
    
    // Check if pricePerUnit is missing, null, or exactly 0
    return !rawMaterial.pricePerUnit || rawMaterial.pricePerUnit === 0;
  }) || [];

  // Get raw material names for missing costs display
  const missingCostNames = missingCostsForSelectedRecipe.map(ing => {
    const rawMaterial = rawMaterialsMap.get(ing.rawMaterialId.toString());
    return rawMaterial?.rawMaterialName || `ID: ${ing.rawMaterialId}`;
  });

  // Show loading state
  if (recipesLoading || rawMaterialsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-[oklch(0.62_0.15_35)]" />
          <p className="text-muted-foreground">Loading data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (recipesError || rawMaterialsError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Connection Error</AlertTitle>
        <AlertDescription>
          {recipesError && <div>Failed to load recipes: {String(recipesError)}</div>}
          {rawMaterialsError && <div>Failed to load raw materials: {String(rawMaterialsError)}</div>}
          <div className="mt-2">Please check your connection and try refreshing the page.</div>
        </AlertDescription>
      </Alert>
    );
  }

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

          {selectedRecipe && missingCostsForSelectedRecipe.length > 0 && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Missing Ingredient Costs</AlertTitle>
              <AlertDescription>
                The following ingredients don't have costs set: <strong>{missingCostNames.join(', ')}</strong>. 
                Please set their costs in the Raw Material Master before calculating.
              </AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleCalculate}
            disabled={!selectedRecipe || !quantity || calculateCostMutation.isPending || missingCostsForSelectedRecipe.length > 0}
            className="w-full mt-6 bg-gradient-to-r from-[oklch(0.62_0.15_35)] to-[oklch(0.55_0.18_30)] hover:from-[oklch(0.58_0.15_35)] hover:to-[oklch(0.51_0.18_30)] text-white"
          >
            {calculateCostMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Calculating...
              </>
            ) : (
              <>
                <Calculator className="mr-2 h-4 w-4" />
                Calculate Cost
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {costResult && costResult.breakdown.length > 0 && (
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
                    <TableHead className="text-right font-semibold">Cost per Unit</TableHead>
                    <TableHead className="text-right font-semibold">Total Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {costResult.breakdown.map((item, idx) => {
                    // Get ingredient details from recipe to display name
                    const ingredient = selectedRecipeData?.ingredients[idx];
                    const rawMaterial = ingredient ? rawMaterialsMap.get(ingredient.rawMaterialId.toString()) : null;
                    const ingredientName = rawMaterial?.rawMaterialName || `Ingredient ${idx + 1}`;
                    
                    return (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{ingredientName}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.costPerUnit)}</TableCell>
                        <TableCell className="text-right font-semibold text-[oklch(0.55_0.18_30)]">
                          {formatCurrency(item.totalCost)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
                        <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Profit Per Portion
                        </CardTitle>
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

                  <div className="bg-[oklch(0.97_0.015_60)] p-4 rounded-lg border border-[oklch(0.88_0.03_60)]">
                    <h4 className="font-semibold text-[oklch(0.35_0.08_35)] mb-2">Summary</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cost per portion:</span>
                        <span className="font-medium">{formatCurrency(costResult.costPerPortion)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Selling price:</span>
                        <span className="font-medium">{formatCurrency(parseFloat(sellingPrice))}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-[oklch(0.88_0.03_60)]">
                        <span className="font-semibold">Profit per portion:</span>
                        <span className="font-semibold text-[oklch(0.65_0.12_140)]">
                          {formatCurrency(calculateProfitPerPortion())}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
