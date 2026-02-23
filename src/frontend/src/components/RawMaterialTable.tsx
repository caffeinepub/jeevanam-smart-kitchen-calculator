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
import { Edit, Trash2, AlertCircle, RefreshCw } from 'lucide-react';
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

  const handleDeleteClick = (rawMaterial: RawMaterial) => {
    setSelectedRawMaterial(rawMaterial);
    setDeleteDialogOpen(true);
    setCanisterError(null);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedRawMaterial) return;

    try {
      await deleteMutation.mutateAsync(selectedRawMaterial.id);
      toast.success('Raw material deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedRawMaterial(null);
      setCanisterError(null);
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      
      // Check if it's a canister stopped error
      if (isCanisterStoppedError(error)) {
        setCanisterError(errorMessage);
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
    handleDeleteConfirm();
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
                            className="border-[oklch(0.65_0.12_140)] text-[oklch(0.65_0.12_140)] hover:bg-[oklch(0.65_0.12_140)] hover:text-white transition-colors"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick(rawMaterial)}
                            className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
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
            <AlertDialogTitle>
              {canisterError ? 'Service Temporarily Unavailable' : 'Are you sure?'}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                {canisterError ? (
                  <>
                    <Alert variant="destructive" className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Cannot Complete Delete Operation</AlertTitle>
                      <AlertDescription>
                        <p className="mb-2">{canisterError}</p>
                        <p className="text-sm">
                          The backend canister is currently stopped. Please wait a moment and try again.
                        </p>
                      </AlertDescription>
                    </Alert>
                    <p className="text-sm text-muted-foreground">
                      Your delete request for "{selectedRawMaterial?.rawMaterialName}" will be processed once the service is available.
                    </p>
                  </>
                ) : (
                  <p>
                    This will permanently delete "{selectedRawMaterial?.rawMaterialName}". This action cannot be undone.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {canisterError ? (
              <>
                <AlertDialogCancel onClick={() => {
                  setCanisterError(null);
                  setDeleteDialogOpen(false);
                }}>
                  Cancel
                </AlertDialogCancel>
                <Button
                  onClick={handleRetryDelete}
                  disabled={deleteMutation.isPending}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleteMutation.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Retrying...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry Delete
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteConfirm}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleteMutation.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </AlertDialogAction>
              </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
