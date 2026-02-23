import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2, Package } from 'lucide-react';
import { useGetAllRecipes, useGetAllRawMaterials } from '../hooks/useQueries';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface RecipeListProps {
  onEdit: (recipe: {
    name: string;
    category: string;
    portionWeight: number;
    ingredients: Array<{ rawMaterialId: bigint; quantity: number; unit: string }>;
  }) => void;
}

export default function RecipeList({ onEdit }: RecipeListProps) {
  const { data: recipes, isLoading } = useGetAllRecipes();
  const { data: rawMaterials } = useGetAllRawMaterials();

  // Create a map of raw material ID to raw material data
  const rawMaterialsMap = new Map(
    rawMaterials?.map(rm => [rm.id.toString(), rm]) || []
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!recipes || recipes.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Package className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No recipes added yet</h3>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            Click the "+ New Recipe" button above to create your first recipe
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleDelete = (recipeName: string) => {
    console.log('Delete recipe:', recipeName);
  };

  const handleEdit = (recipe: typeof recipes[0]) => {
    // Convert ingredients to the format expected by the form
    const formattedIngredients = recipe.ingredients.map(ing => ({
      rawMaterialId: ing.rawMaterialId,
      quantity: ing.quantityPerPortion,
      unit: ing.unit,
    }));

    onEdit({
      name: recipe.name,
      category: recipe.category,
      portionWeight: recipe.portionWeight,
      ingredients: formattedIngredients,
    });
  };

  return (
    <Card className="border-[oklch(0.88_0.03_60)]">
      <CardHeader className="bg-gradient-to-r from-[oklch(0.97_0.015_60)] to-[oklch(0.95_0.02_80)]">
        <CardTitle className="text-[oklch(0.35_0.08_35)]">Recipe List</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold">Recipe Name</TableHead>
              <TableHead className="font-semibold">Category</TableHead>
              <TableHead className="text-right font-semibold">Standard Portion Weight</TableHead>
              <TableHead className="text-right font-semibold">No. of Ingredients</TableHead>
              <TableHead className="text-right font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recipes.map((recipe) => (
              <TableRow key={recipe.name}>
                <TableCell className="font-medium">{recipe.name}</TableCell>
                <TableCell>{recipe.category}</TableCell>
                <TableCell className="text-right">{recipe.portionWeight}g</TableCell>
                <TableCell className="text-right">{recipe.ingredients.length}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(recipe)}
                      className="text-[oklch(0.65_0.12_140)] hover:text-[oklch(0.60_0.10_150)]"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the recipe "{recipe.name}". This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(recipe.name)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
