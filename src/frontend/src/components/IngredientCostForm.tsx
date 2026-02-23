import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Save, X, Trash2 } from 'lucide-react';
import { useGetAllRecipes, useSetIngredientCost, useUpdateIngredientCost } from '../hooks/useQueries';
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
  name: string;
  costPerUnit: string;
  unit: string;
  lastUpdated: string;
  isEditing: boolean;
}

export default function IngredientCostForm() {
  const { data: recipes } = useGetAllRecipes();
  const setIngredientCostMutation = useSetIngredientCost();
  const updateIngredientCostMutation = useUpdateIngredientCost();
  const [ingredientCosts, setIngredientCosts] = useState<IngredientCostData[]>([]);

  const allIngredients = recipes
    ? Array.from(
        new Set(
          recipes.flatMap((recipe) =>
            recipe.ingredients.map((ing) => ing.name)
          )
        )
      ).sort()
    : [];

  useEffect(() => {
    // Initialize ingredient costs from localStorage or create new entries
    const storedCosts = localStorage.getItem('jeevanam_ingredient_costs');
    const costs: Record<string, { cost: number; unit: string; lastUpdated: string }> = storedCosts
      ? JSON.parse(storedCosts)
      : {};

    const initialCosts = allIngredients.map((name) => ({
      name,
      costPerUnit: costs[name]?.cost?.toString() || '',
      unit: costs[name]?.unit || 'kg',
      lastUpdated: costs[name]?.lastUpdated || '',
      isEditing: false,
    }));

    setIngredientCosts(initialCosts);
  }, [recipes]);

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

    try {
      // Check if this ingredient already has a cost set
      const storedCosts = localStorage.getItem('jeevanam_ingredient_costs');
      const costs = storedCosts ? JSON.parse(storedCosts) : {};
      const isExisting = costs[ingredient.name];

      if (isExisting) {
        await updateIngredientCostMutation.mutateAsync({
          ingredientName: ingredient.name,
          newCostPerUnit: cost,
        });
      } else {
        await setIngredientCostMutation.mutateAsync({
          ingredientName: ingredient.name,
          costPerUnit: cost,
          unit: ingredient.unit,
        });
      }

      const updated = [...ingredientCosts];
      updated[index].isEditing = false;
      updated[index].lastUpdated = new Date().toLocaleDateString();
      setIngredientCosts(updated);

      toast.success('Cost updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update cost');
    }
  };

  const handleClearAll = () => {
    // Clear localStorage
    localStorage.removeItem('jeevanam_ingredient_costs');
    
    // Reset state
    const clearedCosts = allIngredients.map((name) => ({
      name,
      costPerUnit: '',
      unit: 'kg',
      lastUpdated: '',
      isEditing: false,
    }));
    
    setIngredientCosts(clearedCosts);
    toast.success('All ingredient costs cleared');
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
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all ingredient cost data. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {ingredientCosts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No ingredients found. Please add recipes first.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold">Ingredient Name</TableHead>
                <TableHead className="font-semibold">Cost per Kg/L (₹)</TableHead>
                <TableHead className="font-semibold">Last Updated</TableHead>
                <TableHead className="text-right font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ingredientCosts.map((ingredient, index) => (
                <TableRow key={ingredient.name}>
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
                  <TableCell className="text-muted-foreground">
                    {ingredient.lastUpdated ? new Date(ingredient.lastUpdated).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {ingredient.isEditing ? (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSave(index)}
                          disabled={setIngredientCostMutation.isPending || updateIngredientCostMutation.isPending}
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
                        Edit
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
