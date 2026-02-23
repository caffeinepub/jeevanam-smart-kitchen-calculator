import { useState } from 'react';
import RecipeMasterForm from '../components/RecipeMasterForm';
import RecipeList from '../components/RecipeList';
import { Button } from '@/components/ui/button';
import { List, Plus } from 'lucide-react';

export default function RecipeMaster() {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingRecipe, setEditingRecipe] = useState<{
    name: string;
    category: string;
    portionWeight: number;
    ingredients: Array<{ rawMaterialId: bigint; quantity: number; unit: string }>;
  } | null>(null);

  const handleEdit = (recipe: {
    name: string;
    category: string;
    portionWeight: number;
    ingredients: Array<{ rawMaterialId: bigint; quantity: number; unit: string }>;
  }) => {
    setEditingRecipe(recipe);
    setView('form');
  };

  const handleClose = () => {
    setView('list');
    setEditingRecipe(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/assets/favi-icon.png" alt="Logo" className="h-10 w-10" />
          <div>
            <h1 className="text-3xl font-bold text-[oklch(0.35_0.08_35)]">Recipe Master</h1>
            <p className="text-muted-foreground mt-1">Create and manage your standard recipes</p>
          </div>
        </div>
      </div>

      {/* Toggle Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={() => {
            setView('list');
            setEditingRecipe(null);
          }}
          variant={view === 'list' ? 'default' : 'outline'}
          className={
            view === 'list'
              ? 'bg-gradient-to-r from-[oklch(0.62_0.15_35)] to-[oklch(0.55_0.18_30)] hover:from-[oklch(0.58_0.15_35)] hover:to-[oklch(0.51_0.18_30)] text-white'
              : ''
          }
        >
          <List className="mr-2 h-4 w-4" />
          Recipe List
        </Button>
        <Button
          onClick={() => {
            setView('form');
            setEditingRecipe(null);
          }}
          variant={view === 'form' ? 'default' : 'outline'}
          className={
            view === 'form'
              ? 'bg-gradient-to-r from-[oklch(0.62_0.15_35)] to-[oklch(0.55_0.18_30)] hover:from-[oklch(0.58_0.15_35)] hover:to-[oklch(0.51_0.18_30)] text-white'
              : ''
          }
        >
          <Plus className="mr-2 h-4 w-4" />
          Add New Recipe
        </Button>
      </div>

      {/* Recipe List - Only visible when view is 'list' */}
      {view === 'list' && <RecipeList onEdit={handleEdit} />}

      {/* Recipe Form - Only visible when view is 'form' */}
      {view === 'form' && <RecipeMasterForm editingRecipe={editingRecipe} onClose={handleClose} />}
    </div>
  );
}
