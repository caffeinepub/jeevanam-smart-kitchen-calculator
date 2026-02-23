import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Save, X } from 'lucide-react';
import { useAddRecipe, useGetAllRawMaterials } from '../hooks/useQueries';
import { toast } from 'sonner';

const CATEGORIES = [
  'Tiffin',
  'Lunch',
  'Snacks',
  'Chat',
  'Chinese',
  'Soup',
  'Bread',
  'Gravy',
  'Chutney',
  'Juice',
  'Wellness Bowl',
  'Special Item',
  'Other',
];

interface RecipeMasterFormProps {
  editingRecipe?: {
    name: string;
    category: string;
    portionWeight: number;
    ingredients: Array<{ rawMaterialId: bigint; quantity: number; unit: string }>;
  } | null;
  onClose: () => void;
}

export default function RecipeMasterForm({ editingRecipe, onClose }: RecipeMasterFormProps) {
  const [recipeName, setRecipeName] = useState('');
  const [category, setCategory] = useState('');
  const [portionWeight, setPortionWeight] = useState('');
  const [ingredients, setIngredients] = useState<Array<{ rawMaterialId: string; name: string; quantity: string; unit: string }>>([
    { rawMaterialId: '', name: '', quantity: '', unit: 'g' },
  ]);

  const addRecipeMutation = useAddRecipe();
  const { data: rawMaterials = [] } = useGetAllRawMaterials();

  useEffect(() => {
    if (editingRecipe && rawMaterials.length > 0) {
      setRecipeName(editingRecipe.name);
      setCategory(editingRecipe.category);
      setPortionWeight(editingRecipe.portionWeight.toString());
      
      // Map ingredient rawMaterialIds to raw material data
      setIngredients(
        editingRecipe.ingredients.map((ing) => {
          // Find the raw material by ID
          const matchingRawMaterial = rawMaterials.find(
            rm => rm.id === ing.rawMaterialId
          );
          
          return {
            rawMaterialId: ing.rawMaterialId.toString(),
            name: matchingRawMaterial?.rawMaterialName || '',
            quantity: ing.quantity.toString(),
            unit: ing.unit || 'g',
          };
        })
      );
    }
  }, [editingRecipe, rawMaterials]);

  const addIngredient = () => {
    setIngredients([...ingredients, { rawMaterialId: '', name: '', quantity: '', unit: 'g' }]);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: 'rawMaterialId' | 'name' | 'quantity' | 'unit', value: string) => {
    const updated = [...ingredients];
    
    if (field === 'rawMaterialId') {
      // When raw material is selected, populate the name
      const selectedRawMaterial = rawMaterials.find(rm => rm.id.toString() === value);
      if (selectedRawMaterial) {
        updated[index].rawMaterialId = value;
        updated[index].name = selectedRawMaterial.rawMaterialName;
      }
    } else {
      updated[index][field] = value;
    }
    
    setIngredients(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!recipeName || !category || !portionWeight) {
      toast.error('Please fill in all required fields');
      return;
    }

    const validIngredients = ingredients.filter((ing) => ing.rawMaterialId && ing.quantity);
    if (validIngredients.length === 0) {
      toast.error('Please add at least one ingredient');
      return;
    }

    try {
      await addRecipeMutation.mutateAsync({
        name: recipeName,
        category,
        portionWeight: parseFloat(portionWeight),
        ingredients: validIngredients.map((ing) => ({
          rawMaterialId: BigInt(ing.rawMaterialId),
          quantityPerPortion: parseFloat(ing.quantity),
          unit: ing.unit,
        })),
      });

      toast.success(editingRecipe ? 'Recipe updated successfully' : 'Recipe saved successfully');
      
      // Clear form
      setRecipeName('');
      setCategory('');
      setPortionWeight('');
      setIngredients([{ rawMaterialId: '', name: '', quantity: '', unit: 'g' }]);
      
      onClose();
    } catch (error) {
      toast.error(editingRecipe ? 'Failed to update recipe' : 'Failed to save recipe');
      console.error(error);
    }
  };

  return (
    <Card className="border-[oklch(0.88_0.03_60)]">
      <CardHeader className="bg-gradient-to-r from-[oklch(0.97_0.015_60)] to-[oklch(0.95_0.02_80)]">
        <div className="flex items-center justify-between">
          <CardTitle className="text-[oklch(0.35_0.08_35)]">
            {editingRecipe ? 'Edit Recipe' : 'Create New Recipe'}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="recipeName">Recipe Name *</Label>
              <Input
                id="recipeName"
                placeholder="e.g., Masala Dosa"
                value={recipeName}
                onChange={(e) => setRecipeName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="portionWeight">Standard Portion Weight (grams) *</Label>
              <Input
                id="portionWeight"
                type="number"
                placeholder="e.g., 400"
                value={portionWeight}
                onChange={(e) => setPortionWeight(e.target.value)}
                required
                min="1"
                step="0.1"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base">Ingredients per Portion</Label>
              <Button type="button" variant="outline" size="sm" onClick={addIngredient}>
                <Plus className="mr-2 h-4 w-4" />
                Add Ingredient
              </Button>
            </div>

            <div className="space-y-3">
              {ingredients.map((ingredient, index) => (
                <div key={index} className="flex gap-3 items-end">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor={`ingredient-name-${index}`} className="text-sm">
                      Ingredient Name
                    </Label>
                    <Select
                      value={ingredient.rawMaterialId}
                      onValueChange={(value) => updateIngredient(index, 'rawMaterialId', value)}
                    >
                      <SelectTrigger id={`ingredient-name-${index}`}>
                        <SelectValue placeholder="Select raw material" />
                      </SelectTrigger>
                      <SelectContent>
                        {rawMaterials.map((rm) => (
                          <SelectItem key={rm.id.toString()} value={rm.id.toString()}>
                            {rm.rawMaterialName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-32 space-y-2">
                    <Label htmlFor={`ingredient-quantity-${index}`} className="text-sm">
                      Quantity
                    </Label>
                    <Input
                      id={`ingredient-quantity-${index}`}
                      type="number"
                      placeholder="100"
                      value={ingredient.quantity}
                      onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
                      min="0"
                      step="0.1"
                    />
                  </div>
                  <div className="w-24 space-y-2">
                    <Label htmlFor={`ingredient-unit-${index}`} className="text-sm">
                      Unit
                    </Label>
                    <Select
                      value={ingredient.unit}
                      onValueChange={(value) => updateIngredient(index, 'unit', value)}
                    >
                      <SelectTrigger id={`ingredient-unit-${index}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="g">g</SelectItem>
                        <SelectItem value="ml">ml</SelectItem>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="l">l</SelectItem>
                        <SelectItem value="pcs">pcs</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeIngredient(index)}
                    disabled={ingredients.length === 1}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={addRecipeMutation.isPending || !category}
              className="bg-gradient-to-r from-[oklch(0.62_0.15_35)] to-[oklch(0.55_0.18_30)] hover:from-[oklch(0.58_0.15_35)] hover:to-[oklch(0.51_0.18_30)] text-white"
            >
              {addRecipeMutation.isPending ? (
                editingRecipe ? 'Updating...' : 'Saving...'
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {editingRecipe ? 'Update Recipe' : 'Save Recipe'}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
