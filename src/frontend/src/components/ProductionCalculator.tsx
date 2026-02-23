import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calculator } from 'lucide-react';
import { useGetAllCategories, useGetRecipesByCategory, useCalculateProduction, useGetAllRawMaterials } from '../hooks/useQueries';
import { toast } from 'sonner';
import type { Ingredient } from '../backend';

interface ProductionCalculatorProps {
  onCalculationComplete: (result: { recipeName: string; quantity: number }) => void;
}

// Helper function to format numbers with minimal decimal places
const formatNumber = (value: number): string => {
  return parseFloat(value.toFixed(3)).toString();
};

export default function ProductionCalculator({ onCalculationComplete }: ProductionCalculatorProps) {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState('');
  const [quantity, setQuantity] = useState('');
  const [calculationResult, setCalculationResult] = useState<{
    totalPortionWeight: number;
    ingredients: Ingredient[];
  } | null>(null);

  const { data: categories = [] } = useGetAllCategories();
  const { data: recipes = [] } = useGetRecipesByCategory(selectedCategory);
  const { data: rawMaterials = [] } = useGetAllRawMaterials();
  const calculateMutation = useCalculateProduction();

  // Create a map of raw material ID to raw material data
  const rawMaterialsMap = new Map(
    rawMaterials.map(rm => [rm.id.toString(), rm])
  );

  const convertUnit = (quantity: number, unit: string): { value: string; unit: string } => {
    // Convert grams to kg if >= 1000
    if (unit === 'g' && quantity >= 1000) {
      return { value: formatNumber(quantity / 1000), unit: 'Kg' };
    }
    // Convert ml to L if >= 1000
    if (unit === 'ml' && quantity >= 1000) {
      return { value: formatNumber(quantity / 1000), unit: 'L' };
    }
    return { value: formatNumber(quantity), unit };
  };

  const handleCalculate = async () => {
    if (!selectedRecipe || !quantity) {
      toast.error('Please select a recipe and enter quantity');
      return;
    }

    try {
      const result = await calculateMutation.mutateAsync({
        recipeName: selectedRecipe,
        quantity: parseFloat(quantity),
      });

      setCalculationResult(result);
      onCalculationComplete({
        recipeName: selectedRecipe,
        quantity: Number(quantity),
      });
      toast.success('Production calculated successfully');
    } catch (error) {
      toast.error('Failed to calculate production');
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-[oklch(0.88_0.03_60)]">
        <CardHeader className="bg-gradient-to-r from-[oklch(0.97_0.015_60)] to-[oklch(0.95_0.02_80)]">
          <CardTitle className="text-[oklch(0.35_0.08_35)]">Calculate Production</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="category">Food Category</Label>
              <Select
                value={selectedCategory}
                onValueChange={(value) => {
                  setSelectedCategory(value);
                  setSelectedRecipe('');
                  setCalculationResult(null);
                }}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipe">Recipe Name</Label>
              <Select
                value={selectedRecipe}
                onValueChange={(value) => {
                  setSelectedRecipe(value);
                  setCalculationResult(null);
                }}
                disabled={!selectedCategory}
              >
                <SelectTrigger id="recipe">
                  <SelectValue placeholder="Select recipe" />
                </SelectTrigger>
                <SelectContent>
                  {recipes.map((recipeName) => (
                    <SelectItem key={recipeName} value={recipeName}>
                      {recipeName}
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
                onChange={(e) => {
                  setQuantity(e.target.value);
                  setCalculationResult(null);
                }}
                min="1"
                step="0.1"
              />
            </div>
          </div>

          <Button
            onClick={handleCalculate}
            disabled={!selectedRecipe || !quantity || calculateMutation.isPending}
            className="w-full mt-6 bg-gradient-to-r from-[oklch(0.62_0.15_35)] to-[oklch(0.55_0.18_30)] hover:from-[oklch(0.58_0.15_35)] hover:to-[oklch(0.51_0.18_30)] text-white h-12"
          >
            <Calculator className="mr-2 h-5 w-5" />
            {calculateMutation.isPending ? 'Calculating...' : 'Calculate Raw Materials'}
          </Button>
        </CardContent>
      </Card>

      {calculationResult && (
        <Card className="border-[oklch(0.88_0.03_60)]">
          <CardHeader className="bg-gradient-to-r from-[oklch(0.65_0.12_140)] to-[oklch(0.60_0.10_150)]">
            <CardTitle className="text-white">Required Raw Materials</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">Ingredient</TableHead>
                  <TableHead className="text-right font-semibold">Required Quantity</TableHead>
                  <TableHead className="text-right font-semibold">Unit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calculationResult.ingredients.map((ing, idx) => {
                  const rawMaterial = rawMaterialsMap.get(ing.rawMaterialId.toString());
                  const ingredientName = rawMaterial?.rawMaterialName || `Ingredient ${idx + 1}`;
                  const converted = convertUnit(ing.quantityPerPortion, ing.unit);
                  return (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{ingredientName}</TableCell>
                      <TableCell className="text-right font-semibold text-[oklch(0.55_0.18_30)]">
                        {converted.value}
                      </TableCell>
                      <TableCell className="text-right">{converted.unit}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
