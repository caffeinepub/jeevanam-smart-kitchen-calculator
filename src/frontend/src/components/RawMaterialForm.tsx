import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { useAddRawMaterial, useEditRawMaterial, useGetAllRawMaterials, isCanisterStoppedError, getErrorMessage } from '../hooks/useQueries';
import type { RawMaterial } from '../backend';
import { Save, X, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';

interface RawMaterialFormProps {
  editingRawMaterial: RawMaterial | null;
  onCancelEdit: () => void;
  onSaveComplete: () => void;
}

export default function RawMaterialForm({ editingRawMaterial, onCancelEdit, onSaveComplete }: RawMaterialFormProps) {
  const [rawMaterialName, setRawMaterialName] = useState('');
  const [unitType, setUnitType] = useState('');
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [canisterError, setCanisterError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isAutoRetrying, setIsAutoRetrying] = useState(false);

  const { data: allRawMaterials = [] } = useGetAllRawMaterials();
  const addMutation = useAddRawMaterial();
  const editMutation = useEditRawMaterial();

  useEffect(() => {
    if (editingRawMaterial) {
      setRawMaterialName(editingRawMaterial.rawMaterialName);
      setUnitType(editingRawMaterial.unitType);
      setPricePerUnit(editingRawMaterial.pricePerUnit.toString());
    } else {
      setRawMaterialName('');
      setUnitType('');
      setPricePerUnit('');
    }
    setCanisterError(null);
    setRetryCount(0);
    setIsAutoRetrying(false);
  }, [editingRawMaterial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCanisterError(null);
    setIsAutoRetrying(false);

    if (!rawMaterialName.trim()) {
      toast.error('Please enter a raw material name');
      return;
    }

    if (!unitType) {
      toast.error('Please select a unit type');
      return;
    }

    if (!pricePerUnit || parseFloat(pricePerUnit) < 0) {
      toast.error('Please enter a valid price per unit');
      return;
    }

    // Check for duplicate names (case-insensitive)
    const isDuplicate = allRawMaterials.some(
      (rm) =>
        rm.rawMaterialName.toLowerCase() === rawMaterialName.trim().toLowerCase() &&
        (!editingRawMaterial || rm.id !== editingRawMaterial.id)
    );

    if (isDuplicate) {
      toast.error('Raw material with this name already exists');
      return;
    }

    try {
      if (editingRawMaterial) {
        await editMutation.mutateAsync({
          id: editingRawMaterial.id,
          rawMaterialName: rawMaterialName.trim(),
          unitType,
          pricePerUnit: parseFloat(pricePerUnit),
        });
        toast.success('Raw material updated successfully');
        setRawMaterialName('');
        setUnitType('');
        setPricePerUnit('');
        setRetryCount(0);
        onSaveComplete();
      } else {
        await addMutation.mutateAsync({
          rawMaterialName: rawMaterialName.trim(),
          unitType,
          pricePerUnit: parseFloat(pricePerUnit),
        });
        toast.success('Raw material added successfully');
        setRawMaterialName('');
        setUnitType('');
        setPricePerUnit('');
        setRetryCount(0);
        onSaveComplete();
      }
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      
      // Check if it's a canister stopped error
      if (isCanisterStoppedError(error)) {
        setCanisterError(errorMessage);
        setRetryCount(prev => prev + 1);
        
        // Automatic retry with exponential backoff (up to 5 attempts)
        if (retryCount < 5) {
          setIsAutoRetrying(true);
          const delay = Math.min(2000 * Math.pow(2, retryCount), 16000);
          
          setTimeout(() => {
            console.log(`[RawMaterialForm] Auto-retrying after ${delay}ms (attempt ${retryCount + 1}/5)`);
            handleSubmit(e);
          }, delay);
        }
      } else {
        toast.error(errorMessage);
      }
      
      console.error('Raw material save error:', error);
    }
  };

  const handleRetry = () => {
    setCanisterError(null);
    setIsAutoRetrying(false);
    // Trigger form submission again
    const form = document.querySelector('form');
    if (form) {
      form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }
  };

  const handleCancel = () => {
    setRawMaterialName('');
    setUnitType('');
    setPricePerUnit('');
    setCanisterError(null);
    setRetryCount(0);
    setIsAutoRetrying(false);
    onCancelEdit();
  };

  const isLoading = addMutation.isPending || editMutation.isPending;

  return (
    <Card className="border-[oklch(0.88_0.03_60)]">
      <CardHeader className="bg-gradient-to-r from-[oklch(0.97_0.015_60)] to-[oklch(0.95_0.02_80)]">
        <div className="flex items-center justify-between">
          <CardTitle className="text-[oklch(0.35_0.08_35)]">
            {editingRawMaterial ? 'Edit Raw Material' : 'Add Raw Material'}
          </CardTitle>
          {editingRawMaterial && (
            <Button variant="ghost" size="icon" onClick={handleCancel} disabled={isLoading}>
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {canisterError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Service Temporarily Unavailable</AlertTitle>
            <AlertDescription className="space-y-3">
              <p>{canisterError}</p>
              <p className="text-sm">
                The backend canister is currently stopped. This usually resolves automatically during deployment or system recovery.
                {retryCount > 0 && ` (Retry attempt ${retryCount}/5)`}
              </p>
              {isAutoRetrying && (
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Automatically retrying...</span>
                </div>
              )}
              <div className="flex gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  disabled={isLoading || isAutoRetrying}
                  className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Now
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCanisterError(null);
                    setIsAutoRetrying(false);
                  }}
                  disabled={isAutoRetrying}
                >
                  Dismiss
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="rawMaterialName">Raw Material Name *</Label>
              <Input
                id="rawMaterialName"
                value={rawMaterialName}
                onChange={(e) => setRawMaterialName(e.target.value)}
                placeholder="e.g., Rice"
                disabled={isLoading}
                className="border-[oklch(0.88_0.03_60)] focus:border-[oklch(0.62_0.15_35)] focus:ring-[oklch(0.62_0.15_35)]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unitType">Unit Type *</Label>
              <Select value={unitType} onValueChange={setUnitType} disabled={isLoading}>
                <SelectTrigger 
                  id="unitType"
                  className="border-[oklch(0.88_0.03_60)] focus:border-[oklch(0.62_0.15_35)] focus:ring-[oklch(0.62_0.15_35)]"
                >
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Kg">Kilogram (Kg)</SelectItem>
                  <SelectItem value="L">Liter (L)</SelectItem>
                  <SelectItem value="g">Gram (g)</SelectItem>
                  <SelectItem value="ml">Milliliter (ml)</SelectItem>
                  <SelectItem value="Nos">Numbers (Nos)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pricePerUnit">Price per Unit (₹) *</Label>
              <Input
                id="pricePerUnit"
                type="number"
                step="0.01"
                min="0"
                value={pricePerUnit}
                onChange={(e) => setPricePerUnit(e.target.value)}
                placeholder="0.00"
                disabled={isLoading}
                className="border-[oklch(0.88_0.03_60)] focus:border-[oklch(0.62_0.15_35)] focus:ring-[oklch(0.62_0.15_35)]"
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            {editingRawMaterial && (
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
                className="border-[oklch(0.88_0.03_60)] hover:bg-[oklch(0.95_0.02_60)]"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-[oklch(0.62_0.15_35)] to-[oklch(0.55_0.18_30)] hover:from-[oklch(0.58_0.15_35)] hover:to-[oklch(0.51_0.18_30)] text-white shadow-md"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {editingRawMaterial ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {editingRawMaterial ? 'Update' : 'Add'} Raw Material
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
