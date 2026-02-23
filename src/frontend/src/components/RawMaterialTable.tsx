import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Edit, Trash2, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useGetAllRawMaterials, useDeleteRawMaterial, isCanisterStoppedError, getErrorMessage } from '../hooks/useQueries';
import type { RawMaterial } from '../backend';

interface RawMaterialTableProps {
  onEdit: (rawMaterial: RawMaterial) => void;
}

export default function RawMaterialTable({ onEdit }: RawMaterialTableProps) {
  const { data: rawMaterials = [], isLoading } = useGetAllRawMaterials();
  const deleteMutation = useDeleteRawMaterial();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRawMaterial, setSelectedRawMaterial] = useState<RawMaterial | null>(null);
  const [canisterError, setCanisterError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isAutoRetrying, setIsAutoRetrying] = useState(false);

  const handleDeleteClick = (rawMaterial: RawMaterial) => {
    setSelectedRawMaterial(rawMaterial);
    setDeleteDialogOpen(true);
    setCanisterError(null);
    setRetryCount(0);
    setIsAutoRetrying(false);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedRawMaterial) return;

    try {
      await deleteMutation.mutateAsync(selectedRawMaterial.id);
      toast.success('Raw material deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedRawMaterial(null);
      setCanisterError(null);
      setRetryCount(0);
      setIsAutoRetrying(false);
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
            console.log(`[RawMaterialTable] Auto-retrying delete after ${delay}ms (attempt ${retryCount + 1}/5)`);
            handleDeleteConfirm();
          }, delay);
        } else {
          setIsAutoRetrying(false);
        }
        // Keep dialog open to show error and allow retry
      } else {
        toast.error(errorMessage);
        setDeleteDialogOpen(false);
      }
      
      console.error('Delete raw material error:', error);
    }
  };

  const handleRetryDelete = () => {
    setCanisterError(null);
    setRetryCount(0);
    setIsAutoRetrying(false);
    handleDeleteConfirm();
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setSelectedRawMaterial(null);
    setCanisterError(null);
    setRetryCount(0);
    setIsAutoRetrying(false);
  };

  if (isLoading) {
    return (
      <Card className="border-[oklch(0.88_0.03_60)]">
        <CardHeader className="bg-gradient-to-r from-[oklch(0.97_0.015_60)] to-[oklch(0.95_0.02_80)]">
          <CardTitle className="text-[oklch(0.35_0.08_35)]">Raw Materials</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-[oklch(0.88_0.03_60)]">
        <CardHeader className="bg-gradient-to-r from-[oklch(0.97_0.015_60)] to-[oklch(0.95_0.02_80)]">
          <CardTitle className="text-[oklch(0.35_0.08_35)]">Raw Materials</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {rawMaterials.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg">No raw materials added yet</p>
              <p className="text-sm mt-2">Add your first raw material using the form above</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-muted/50 border-[oklch(0.88_0.03_60)]">
                    <TableHead className="font-semibold text-[oklch(0.35_0.08_35)]">Raw Material Name</TableHead>
                    <TableHead className="font-semibold text-[oklch(0.35_0.08_35)]">Unit Type</TableHead>
                    <TableHead className="font-semibold text-[oklch(0.35_0.08_35)]">Price per Unit (₹)</TableHead>
                    <TableHead className="text-right font-semibold text-[oklch(0.35_0.08_35)]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rawMaterials.map((rawMaterial) => (
                    <TableRow 
                      key={rawMaterial.id.toString()} 
                      className="hover:bg-[oklch(0.97_0.015_60)] transition-colors border-[oklch(0.88_0.03_60)]"
                    >
                      <TableCell className="font-medium text-[oklch(0.35_0.08_35)]">
                        {rawMaterial.rawMaterialName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{rawMaterial.unitType}</TableCell>
                      <TableCell className="text-muted-foreground">₹{rawMaterial.pricePerUnit.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(rawMaterial)}
                            className="border-[oklch(0.62_0.15_35)] text-[oklch(0.62_0.15_35)] hover:bg-[oklch(0.62_0.15_35)] hover:text-white"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick(rawMaterial)}
                            className="border-[oklch(0.55_0.18_30)] text-[oklch(0.55_0.18_30)] hover:bg-[oklch(0.55_0.18_30)] hover:text-white"
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
              Are you sure you want to delete "{selectedRawMaterial?.rawMaterialName}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {canisterError && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Service Temporarily Unavailable</AlertTitle>
              <AlertDescription className="space-y-2">
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
              </AlertDescription>
            </Alert>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete} disabled={deleteMutation.isPending || isAutoRetrying}>
              Cancel
            </AlertDialogCancel>
            {canisterError ? (
              <Button
                variant="outline"
                onClick={handleRetryDelete}
                disabled={deleteMutation.isPending || isAutoRetrying}
                className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                {deleteMutation.isPending || isAutoRetrying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry Delete
                  </>
                )}
              </Button>
            ) : (
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                disabled={deleteMutation.isPending}
                className="bg-destructive hover:bg-destructive/90"
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
