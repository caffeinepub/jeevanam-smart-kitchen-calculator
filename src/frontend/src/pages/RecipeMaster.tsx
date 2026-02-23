import { useState } from 'react';
import RecipeMasterForm from '../components/RecipeMasterForm';
import RecipeList from '../components/RecipeList';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function RecipeMaster() {
  const [isCreating, setIsCreating] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<{
    name: string;
    category: string;
    portionWeight: number;
    ingredients: Array<{ name: string; quantity: number; unit: string }>;
  } | null>(null);

  const handleEdit = (recipe: {
    name: string;
    category: string;
    portionWeight: number;
    ingredients: Array<{ name: string; quantity: number; unit: string }>;
  }) => {
    setEditingRecipe(recipe);
    setIsCreating(true);
  };

  const handleClose = () => {
    setIsCreating(false);
    setEditingRecipe(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[oklch(0.35_0.08_35)]">Recipe Master</h1>
          <p className="text-muted-foreground mt-1">Create and manage your standard recipes</p>
        </div>
      </div>

      {/* Recipe List - Always visible above the form */}
      {!isCreating && <RecipeList onEdit={handleEdit} />}

      {/* New Recipe Button */}
      {!isCreating && (
        <div className="flex justify-center">
          <Button
            onClick={() => setIsCreating(true)}
            className="bg-gradient-to-r from-[oklch(0.62_0.15_35)] to-[oklch(0.55_0.18_30)] hover:from-[oklch(0.58_0.15_35)] hover:to-[oklch(0.51_0.18_30)] text-white"
            size="lg"
          >
            <Plus className="mr-2 h-5 w-5" />
            New Recipe
          </Button>
        </div>
      )}

      {/* Recipe Form */}
      {isCreating && <RecipeMasterForm editingRecipe={editingRecipe} onClose={handleClose} />}
    </div>
  );
}
