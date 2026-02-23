import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Save, X, Trash2 } from 'lucide-react';
import { useGetAllRecipes, useGetAllRawMaterials } from '../hooks/useQueries';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface IngredientCostData {
  rawMaterialId: string;
  name: string;
  costPerUnit: string;
  unit: string;
  lastUpdated: string;
  isEditing: boolean;
}

export default function IngredientCostForm() {
  const { data: recipes } = useGetAllRecipes();
  const { data: rawMaterials } = useGetAllRawMaterials();
  const [ingredientCosts, setIngredientCosts] = useState<IngredientCostData[]>([]);

  // Get unique raw material IDs from recipes
  const uniqueRawMaterialIds = recipes
    ? Array.from(
        new Set(
          recipes.flatMap((recipe) =>
            recipe.ingredients.map((ing) => ing.rawMaterialId.toString())
          )
        )
      )
    : [];

  useEffect(() => {
    if (!rawMaterials || uniqueRawMaterialIds.length === 0) {
      setIngredientCosts([]);
      return;
    }

    // Create ingredient costs from raw materials that are used in recipes
    const costs = uniqueRawMaterialIds
      .map((rawMaterialId) => {
        const rawMaterial = rawMaterials.find(rm => rm.id.toString() === rawMaterialId);
        if (!rawMaterial) return null;

        return {
          rawMaterialId,
          name: rawMaterial.rawMaterialName,
          costPerUnit: rawMaterial.pricePerUnit > 0 ? rawMaterial.pricePerUnit.toString() : '',
          unit: rawMaterial.unitType,
          lastUpdated: '',
          isEditing: false,
        };
      })
      .filter((item): item is IngredientCostData => item !== null)
      .sort((a, b) => a.name.localeCompare(b.name));

    setIngredientCosts(costs);
  }, [recipes, rawMaterials]);

  const handleEdit = (index: number) => {
    const updated = [...ingredientCosts];
    updated[index].isEditing = true;
    setIngredientCosts(updated);
  };

  const handleCancel = (index: number) => {
    const updated = [...ingredientCosts];
    updated[index].isEditing = false;
    setIngredientCosts(updated);
  };

  const handleCostChange = (index: number, value: string) => {
    const updated = [...ingredientCosts];
    updated[index].costPerUnit = value;
    setIngredientCosts(updated);
  };

  const handleSave = async (index: number) => {
    const ingredient = ingredientCosts[index];
    const cost = parseFloat(ingredient.costPerUnit);

    if (isNaN(cost) || cost <= 0) {
      toast.error('Please enter a valid cost');
      return;
    }

    toast.info('Please update costs in the Raw Material Master page');
    
    const updated = [...ingredientCosts];
    updated[index].isEditing = false;
    setIngredientCosts(updated);
  };

  const handleClearAll = () => {
    toast.info('Please manage costs in the Raw Material Master page');
  };

  return (
    <Card className="border-[oklch(0.88_0.03_60)]">
      <CardHeader className="bg-gradient-to-r from-[oklch(0.97_0.015_60)] to-[oklch(0.95_0.02_80)]">
        <div className="flex items-center justify-between">
          <CardTitle className="text-[oklch(0.35_0.08_35)]">Master Ingredient Costing</CardTitle>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Clear All Data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Manage in Raw Material Master</AlertDialogTitle>
                <AlertDialogDescription>
                  Ingredient costs are now managed in the Raw Material Master page. Please go there to add, edit, or delete raw material costs.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Close</AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {ingredientCosts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No ingredients found. Please add recipes and raw materials first.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold">Ingredient Name</TableHead>
                <TableHead className="font-semibold">Cost per Unit (₹)</TableHead>
                <TableHead className="font-semibold">Unit</TableHead>
                <TableHead className="text-right font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ingredientCosts.map((ingredient, index) => (
                <TableRow key={ingredient.rawMaterialId}>
                  <TableCell className="font-medium">{ingredient.name}</TableCell>
                  <TableCell>
                    {ingredient.isEditing ? (
                      <Input
                        type="number"
                        value={ingredient.costPerUnit}
                        onChange={(e) => handleCostChange(index, e.target.value)}
                        placeholder="Enter cost"
                        min="0"
                        step="0.01"
                        className="w-32"
                      />
                    ) : (
                      <span className="text-muted-foreground">
                        {ingredient.costPerUnit ? `₹${parseFloat(ingredient.costPerUnit).toFixed(2)}` : '-'}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{ingredient.unit}</TableCell>
                  <TableCell className="text-right">
                    {ingredient.isEditing ? (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSave(index)}
                          className="bg-[oklch(0.65_0.12_140)] hover:bg-[oklch(0.60_0.10_150)] text-white"
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancel(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(index)}
                        className="text-[oklch(0.65_0.12_140)] hover:text-[oklch(0.60_0.10_150)]"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
