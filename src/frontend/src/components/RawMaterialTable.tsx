import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Edit, Trash2, Package, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import { useGetAllRawMaterials, useDeleteRawMaterial, isCanisterStoppedError, getErrorMessage } from '../hooks/useQueries';
import { toast } from 'sonner';
import type { RawMaterial } from '../backend';

interface RawMaterialTableProps {
  onEdit: (rawMaterial: RawMaterial) => void;
}

export default function RawMaterialTable({ onEdit }: RawMaterialTableProps) {
  const { data: rawMaterials = [], isLoading } = useGetAllRawMaterials();
  const deleteMutation = useDeleteRawMaterial();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rawMaterialToDelete, setRawMaterialToDelete] = useState<RawMaterial | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isAutoRetrying, setIsAutoRetrying] = useState(false);

  const handleDeleteClick = (rawMaterial: RawMaterial) => {
    setRawMaterialToDelete(rawMaterial);
    setDeleteDialogOpen(true);
    setDeleteError(null);
    setRetryCount(0);
    setIsAutoRetrying(false);
  };

  const handleDeleteConfirm = async () => {
    if (!rawMaterialToDelete) return;

    setDeleteError(null);
    setIsAutoRetrying(false);

    try {
      await deleteMutation.mutateAsync(rawMaterialToDelete.id);
      toast.success('Raw material deleted successfully');
      setDeleteDialogOpen(false);
      setRawMaterialToDelete(null);
      setRetryCount(0);
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      
      // Check if it's a canister stopped error
      if (isCanisterStoppedError(error)) {
        setDeleteError(errorMessage);
        setRetryCount(prev => prev + 1);
        
        // Keep dialog open to show error
        // Automatic retry with exponential backoff (up to 5 attempts)
        if (retryCount < 5) {
          setIsAutoRetrying(true);
          const delay = Math.min(2000 * Math.pow(2, retryCount), 16000);
          
          setTimeout(() => {
            console.log(`[RawMaterialTable] Auto-retrying delete after ${delay}ms (attempt ${retryCount + 1}/5)`);
            handleDeleteConfirm();
          }, delay);
        }
      } else {
        toast.error(errorMessage);
        setDeleteDialogOpen(false);
        setRawMaterialToDelete(null);
      }
      
      console.error('Delete error:', error);
    }
  };

  const handleRetryDelete = () => {
    setDeleteError(null);
    setIsAutoRetrying(false);
    handleDeleteConfirm();
  };

  if (isLoading) {
    return (
      <Card className="border-[oklch(0.88_0.03_60)]">
        <CardHeader className="bg-gradient-to-r from-[oklch(0.97_0.015_60)] to-[oklch(0.95_0.02_80)]">
          <CardTitle className="text-[oklch(0.35_0.08_35)] flex items-center gap-2">
            <Package className="h-5 w-5" />
            Raw Materials List
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">Loading raw materials...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-[oklch(0.88_0.03_60)]">
        <CardHeader className="bg-gradient-to-r from-[oklch(0.97_0.015_60)] to-[oklch(0.95_0.02_80)]">
          <CardTitle className="text-[oklch(0.35_0.08_35)] flex items-center gap-2">
            <Package className="h-5 w-5" />
            Raw Materials List
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {rawMaterials.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No raw materials added yet. Add your first raw material above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Raw Material Name</TableHead>
                    <TableHead className="font-semibold">Unit Type</TableHead>
                    <TableHead className="text-right font-semibold">Price per Unit (₹)</TableHead>
                    <TableHead className="text-right font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rawMaterials.map((rm) => (
                    <TableRow key={rm.id.toString()}>
                      <TableCell className="font-medium">{rm.rawMaterialName}</TableCell>
                      <TableCell>{rm.unitType}</TableCell>
                      <TableCell className="text-right font-semibold text-[oklch(0.55_0.18_30)]">
                        ₹{rm.pricePerUnit.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(rm)}
                            className="border-[oklch(0.88_0.03_60)] hover:bg-[oklch(0.95_0.02_60)]"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick(rm)}
                            className="border-red-200 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Raw Material</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{rawMaterialToDelete?.rawMaterialName}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {deleteError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Service Temporarily Unavailable</AlertTitle>
              <AlertDescription className="space-y-3">
                <p>{deleteError}</p>
                <p className="text-sm">
                  The backend canister is currently stopped. This usually resolves automatically.
                  {retryCount > 0 && ` (Retry attempt ${retryCount}/5)`}
                </p>
                {isAutoRetrying && (
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Automatically retrying...</span>
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetryDelete}
                  disabled={deleteMutation.isPending || isAutoRetrying}
                  className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Now
                </Button>
              </AlertDescription>
            </Alert>
          )}
          
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setDeleteDialogOpen(false);
                setRawMaterialToDelete(null);
                setDeleteError(null);
                setRetryCount(0);
                setIsAutoRetrying(false);
              }}
              disabled={deleteMutation.isPending || isAutoRetrying}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending || isAutoRetrying}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending || isAutoRetrying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
