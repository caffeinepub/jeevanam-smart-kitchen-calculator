import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import RawMaterialForm from '../components/RawMaterialForm';
import RawMaterialTable from '../components/RawMaterialTable';
import type { RawMaterial } from '../backend';

export default function RawMaterialMaster() {
  const [editingRawMaterial, setEditingRawMaterial] = useState<RawMaterial | null>(null);
  const [showErrorAlert, setShowErrorAlert] = useState(false);

  const handleEdit = (rawMaterial: RawMaterial) => {
    setEditingRawMaterial(rawMaterial);
    setShowErrorAlert(false);
  };

  const handleCancelEdit = () => {
    setEditingRawMaterial(null);
  };

  const handleSaveComplete = () => {
    setEditingRawMaterial(null);
    setShowErrorAlert(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[oklch(0.35_0.08_35)]">Raw Material Master</h1>
          <p className="text-muted-foreground mt-1">Manage your raw materials inventory with unique entries</p>
        </div>
      </div>

      {showErrorAlert && (
        <Alert variant="destructive" className="border-[oklch(0.55_0.18_30)]">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Service Issue</AlertTitle>
          <AlertDescription>
            The service is temporarily unavailable. Your data has been preserved and you can retry saving. If the issue persists, please contact support.
          </AlertDescription>
        </Alert>
      )}

      <RawMaterialForm
        editingRawMaterial={editingRawMaterial}
        onCancelEdit={handleCancelEdit}
        onSaveComplete={handleSaveComplete}
      />

      <RawMaterialTable onEdit={handleEdit} />
    </div>
  );
}
