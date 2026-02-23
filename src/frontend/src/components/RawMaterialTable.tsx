import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useGetAllRawMaterials, useDeleteRawMaterial } from '../hooks/useQueries';
import type { RawMaterial } from '../backend';

interface RawMaterialTableProps {
  onEdit: (rawMaterial: RawMaterial) => void;
}

export default function RawMaterialTable({ onEdit }: RawMaterialTableProps) {
  const { data: rawMaterials = [], isLoading } = useGetAllRawMaterials();
  const deleteMutation = useDeleteRawMaterial();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRawMaterial, setSelectedRawMaterial] = useState<RawMaterial | null>(null);

  const handleDeleteClick = (rawMaterial: RawMaterial) => {
    setSelectedRawMaterial(rawMaterial);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedRawMaterial) return;

    try {
      await deleteMutation.mutateAsync(selectedRawMaterial.id);
      toast.success('Raw material deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedRawMaterial(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete raw material');
    }
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
        <AlertDialogContent className="border-[oklch(0.88_0.03_60)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[oklch(0.35_0.08_35)]">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedRawMaterial?.rawMaterialName}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
