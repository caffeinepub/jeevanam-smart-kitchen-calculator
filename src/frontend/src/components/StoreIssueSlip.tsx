import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Printer, Download } from 'lucide-react';
import { useGetStoreIssueSlip, useGetAllRawMaterials } from '../hooks/useQueries';
import { generateStoreIssueSlipPDF } from '../utils/pdfGenerator';
import { toast } from 'sonner';
import type { Ingredient } from '../backend';

interface StoreIssueSlipProps {
  recipeName: string;
  quantity: number;
}

// Helper function to format numbers with minimal decimal places
const formatNumber = (value: number): string => {
  return parseFloat(value.toFixed(3)).toString();
};

export default function StoreIssueSlip({ recipeName, quantity }: StoreIssueSlipProps) {
  const [slipData, setSlipData] = useState<{
    date: string;
    recipeName: string;
    productionQuantity: number;
    ingredients: Ingredient[];
  } | null>(null);

  const getSlipMutation = useGetStoreIssueSlip();
  const { data: rawMaterials } = useGetAllRawMaterials();

  // Create a map of raw material ID to raw material data
  const rawMaterialsMap = new Map(
    rawMaterials?.map(rm => [rm.id.toString(), rm]) || []
  );

  useEffect(() => {
    const fetchSlip = async () => {
      try {
        const result = await getSlipMutation.mutateAsync({ recipeName, quantity });
        setSlipData(result);
      } catch (error) {
        console.error('Failed to fetch store issue slip:', error);
        toast.error('Failed to load store issue slip');
      }
    };

    fetchSlip();
  }, [recipeName, quantity]);

  const convertUnit = (quantity: number, unit: string): { value: string; unit: string } => {
    // Convert grams to kg if >= 1000
    if (unit === 'g' && quantity >= 1000) {
      return { value: formatNumber(quantity / 1000), unit: 'Kg' };
    }
    // Convert ml to L if >= 1000
    if (unit === 'ml' && quantity >= 1000) {
      return { value: formatNumber(quantity / 1000), unit: 'L' };
    }
    return { value: formatNumber(quantity), unit };
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    if (!slipData) return;

    // Convert ingredients to include names from raw materials
    const ingredientsWithNames = slipData.ingredients.map(ing => {
      const rawMaterial = rawMaterialsMap.get(ing.rawMaterialId.toString());
      const converted = convertUnit(ing.quantityPerPortion, ing.unit);
      return {
        name: rawMaterial?.rawMaterialName || `Ingredient ${ing.rawMaterialId}`,
        quantity: converted.value,
        unit: converted.unit,
      };
    });

    generateStoreIssueSlipPDF({
      date: slipData.date,
      recipeName: slipData.recipeName,
      productionQuantity: slipData.productionQuantity,
      ingredients: ingredientsWithNames,
    });
    toast.success('PDF downloaded successfully');
  };

  if (!slipData) {
    return (
      <Card className="border-[oklch(0.88_0.03_60)]">
        <CardContent className="py-12 text-center text-muted-foreground">
          Loading store issue slip...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-[oklch(0.88_0.03_60)] print:shadow-none">
      <CardHeader className="bg-gradient-to-r from-[oklch(0.62_0.15_35)] to-[oklch(0.55_0.18_30)] print:bg-none">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white print:text-[oklch(0.35_0.08_35)]">Store Issue Slip</CardTitle>
          <div className="flex gap-2 print:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="bg-white text-[oklch(0.62_0.15_35)] hover:bg-[oklch(0.97_0.015_60)]"
            >
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPDF}
              className="bg-white text-[oklch(0.62_0.15_35)] hover:bg-[oklch(0.97_0.015_60)]"
            >
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Date:</span>
              <span className="ml-2 font-medium">{slipData.date}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Recipe:</span>
              <span className="ml-2 font-medium">{slipData.recipeName}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Production Quantity:</span>
              <span className="ml-2 font-medium">{slipData.productionQuantity}</span>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold">Ingredient</TableHead>
                <TableHead className="text-right font-semibold">Required Quantity</TableHead>
                <TableHead className="text-right font-semibold">Unit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slipData.ingredients.map((ing, idx) => {
                const rawMaterial = rawMaterialsMap.get(ing.rawMaterialId.toString());
                const ingredientName = rawMaterial?.rawMaterialName || `Ingredient ${idx + 1}`;
                const converted = convertUnit(ing.quantityPerPortion, ing.unit);
                return (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{ingredientName}</TableCell>
                    <TableCell className="text-right font-semibold text-[oklch(0.55_0.18_30)]">
                      {converted.value}
                    </TableCell>
                    <TableCell className="text-right">{converted.unit}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <div className="grid grid-cols-2 gap-8 pt-8 print:pt-16">
            <div className="border-t border-[oklch(0.88_0.03_60)] pt-2">
              <p className="text-sm text-muted-foreground">Prepared By</p>
            </div>
            <div className="border-t border-[oklch(0.88_0.03_60)] pt-2">
              <p className="text-sm text-muted-foreground">Approved By</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
