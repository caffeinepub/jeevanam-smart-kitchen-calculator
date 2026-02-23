import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import RawMaterialForm from '../components/RawMaterialForm';
import RawMaterialTable from '../components/RawMaterialTable';
import type { RawMaterial } from '../backend';

export default function RawMaterialMaster() {
  const [editingRawMaterial, setEditingRawMaterial] = useState<RawMaterial | null>(null);
  const [showGlobalError, setShowGlobalError] = useState(false);

  const handleEdit = (rawMaterial: RawMaterial) => {
    setEditingRawMaterial(rawMaterial);
    setShowGlobalError(false);
  };

  const handleCancelEdit = () => {
    setEditingRawMaterial(null);
  };

  const handleSaveComplete = () => {
    setEditingRawMaterial(null);
    setShowGlobalError(false);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[oklch(0.35_0.08_35)]">Raw Material Master</h1>
          <p className="text-muted-foreground mt-1">Manage your raw materials inventory with unique entries</p>
        </div>
      </div>

      {showGlobalError && (
        <Alert variant="destructive" className="border-[oklch(0.55_0.18_30)]">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Service Temporarily Unavailable</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>
              The backend service is currently stopped and cannot process requests. This is usually a temporary condition that resolves automatically.
            </p>
            <p className="text-sm">
              <strong>What you can do:</strong>
            </p>
            <ul className="text-sm list-disc list-inside space-y-1">
              <li>Wait 30-60 seconds and try your operation again</li>
              <li>Refresh the page to check if the service has recovered</li>
              <li>Your data is safe and will be available once the service restarts</li>
            </ul>
            <div className="flex gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Page
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowGlobalError(false)}
              >
                Dismiss
              </Button>
            </div>
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
