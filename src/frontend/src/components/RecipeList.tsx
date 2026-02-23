import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2, Package } from 'lucide-react';
import { useGetAllRecipes } from '../hooks/useQueries';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface RecipeListProps {
  onEdit: (recipe: {
    name: string;
    category: string;
    portionWeight: number;
    ingredients: Array<{ name: string; quantity: number; unit: string }>;
  }) => void;
}

export default function RecipeList({ onEdit }: RecipeListProps) {
  const { data: recipes, isLoading } = useGetAllRecipes();

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
    // Delete functionality - for now just show a message
    console.log('Delete recipe:', recipeName);
  };

  return (
    <Card className="border-[oklch(0.88_0.03_60)]">
      <CardHeader className="bg-gradient-to-r from-[oklch(0.97_0.015_60)] to-[oklch(0.95_0.02_80)]">
        <CardTitle className="text-[oklch(0.35_0.08_35)]">Recipe List</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold">Recipe Name</TableHead>
                <TableHead className="font-semibold">Category</TableHead>
                <TableHead className="font-semibold">Standard Portion Weight</TableHead>
                <TableHead className="font-semibold">No. of Ingredients</TableHead>
                <TableHead className="text-right font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recipes.map((recipe) => (
                <TableRow key={recipe.name}>
                  <TableCell className="font-medium">{recipe.name}</TableCell>
                  <TableCell>{recipe.category}</TableCell>
                  <TableCell>{recipe.portionWeight}g</TableCell>
                  <TableCell>{recipe.ingredients.length}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          onEdit({
                            name: recipe.name,
                            category: recipe.category,
                            portionWeight: recipe.portionWeight,
                            ingredients: recipe.ingredients.map((ing) => ({
                              name: ing.name,
                              quantity: ing.quantityPerPortion,
                              unit: ing.unit,
                            })),
                          })
                        }
                        className="h-8"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Recipe</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{recipe.name}"? This action cannot be undone.
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
        </div>
      </CardContent>
    </Card>
  );
}
