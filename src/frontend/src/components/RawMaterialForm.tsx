import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAddRawMaterial, useEditRawMaterial, useGetAllRawMaterials } from '../hooks/useQueries';
import type { RawMaterial } from '../backend';
import { Save, X } from 'lucide-react';

interface RawMaterialFormProps {
  editingRawMaterial: RawMaterial | null;
  onCancelEdit: () => void;
  onSaveComplete: () => void;
}

export default function RawMaterialForm({ editingRawMaterial, onCancelEdit, onSaveComplete }: RawMaterialFormProps) {
  const [rawMaterialName, setRawMaterialName] = useState('');
  const [unitType, setUnitType] = useState('');
  const [pricePerUnit, setPricePerUnit] = useState('');

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
  }, [editingRawMaterial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
        // Only clear form on success
        setRawMaterialName('');
        setUnitType('');
        setPricePerUnit('');
        onSaveComplete();
      } else {
        await addMutation.mutateAsync({
          rawMaterialName: rawMaterialName.trim(),
          unitType,
          pricePerUnit: parseFloat(pricePerUnit),
        });
        toast.success('Raw material added successfully');
        // Only clear form on success
        setRawMaterialName('');
        setUnitType('');
        setPricePerUnit('');
        onSaveComplete();
      }
    } catch (error: any) {
      // Enhanced error handling for IC0508 and other canister errors
      let errorMessage = 'Failed to save raw material';
      
      if (error?.message) {
        const errorStr = error.message.toLowerCase();
        
        // Check for canister stopped error (IC0508)
        if (errorStr.includes('ic0508') || errorStr.includes('canister') && errorStr.includes('stopped')) {
          errorMessage = 'Service temporarily unavailable. The canister is stopped. Please try again in a moment.';
        } 
        // Check for other rejection errors
        else if (errorStr.includes('reject')) {
          errorMessage = 'Request was rejected by the service. Please try again.';
        }
        // Check for duplicate error from backend
        else if (errorStr.includes('already exists')) {
          errorMessage = 'Raw material with this name already exists';
        }
        // Use the original error message if it's user-friendly
        else if (!errorStr.includes('actor') && !errorStr.includes('undefined')) {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage);
      console.error('Raw material save error:', error);
      
      // DO NOT clear form fields on error - preserve user input
      // User can retry without re-entering data
    }
  };

  const handleCancel = () => {
    setRawMaterialName('');
    setUnitType('');
    setPricePerUnit('');
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
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="rawMaterialName">Raw Material Name *</Label>
              <Input
                id="rawMaterialName"
                value={rawMaterialName}
                onChange={(e) => setRawMaterialName(e.target.value)}
                placeholder="e.g., Rice, Ghee, Salt"
                disabled={isLoading}
                className="bg-card"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unitType">Unit Type *</Label>
              <Select value={unitType} onValueChange={setUnitType} disabled={isLoading}>
                <SelectTrigger id="unitType">
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Kg">Kg</SelectItem>
                  <SelectItem value="Liter">Liter</SelectItem>
                  <SelectItem value="Piece">Piece</SelectItem>
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
                className="bg-card"
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            {editingRawMaterial && (
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isLoading}>
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-[oklch(0.62_0.15_35)] to-[oklch(0.55_0.18_30)] hover:from-[oklch(0.58_0.15_35)] hover:to-[oklch(0.51_0.18_30)] text-white"
            >
              {isLoading ? (
                editingRawMaterial ? 'Updating...' : 'Saving...'
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {editingRawMaterial ? 'Update' : 'Save'}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
