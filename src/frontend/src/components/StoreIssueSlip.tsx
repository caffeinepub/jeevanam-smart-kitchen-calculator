import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Printer, Download } from 'lucide-react';
import { useGetStoreIssueSlip } from '../hooks/useQueries';
import { generatePDF } from '../utils/pdfGenerator';
import { toast } from 'sonner';
import type { Ingredient } from '../backend';

interface StoreIssueSlipProps {
  recipeName: string;
  quantity: number;
}

interface SlipData {
  date: string;
  recipeName: string;
  productionQuantity: number;
  ingredients: Ingredient[];
}

// Helper function to format numbers with minimal decimal places
const formatNumber = (value: number): string => {
  return parseFloat(value.toFixed(3)).toString();
};

export default function StoreIssueSlip({ recipeName, quantity }: StoreIssueSlipProps) {
  const [slip, setSlip] = useState<SlipData | null>(null);
  const getStoreIssueSlipMutation = useGetStoreIssueSlip();

  useEffect(() => {
    const fetchSlip = async () => {
      if (recipeName && quantity) {
        try {
          const result = await getStoreIssueSlipMutation.mutateAsync({
            recipeName,
            quantity,
          });
          setSlip(result);
        } catch (error) {
          console.error('Failed to fetch store issue slip:', error);
        }
      }
    };

    fetchSlip();
  }, [recipeName, quantity]);

  const formatQuantity = (value: number, unit: string): string => {
    // Convert grams to kg if >= 1000
    if (unit === 'g' && value >= 1000) {
      return `${formatNumber(value / 1000)} Kg`;
    }
    // Convert ml to L if >= 1000
    if (unit === 'ml' && value >= 1000) {
      return `${formatNumber(value / 1000)} L`;
    }
    return `${formatNumber(value)} ${unit}`;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!slip) return;
    
    try {
      await generatePDF(slip, formatQuantity);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      toast.error('Failed to generate PDF');
      console.error(error);
    }
  };

  if (!slip) return null;

  return (
    <Card className="border-[oklch(0.88_0.03_60)] print:shadow-none print:border-0">
      <CardHeader className="bg-gradient-to-r from-[oklch(0.97_0.015_60)] to-[oklch(0.95_0.02_80)] print:bg-white">
        <div className="flex items-center justify-between">
          <CardTitle className="text-[oklch(0.35_0.08_35)]">Store Issue Slip</CardTitle>
          <div className="flex gap-2 print:hidden">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPDF}
              className="bg-gradient-to-r from-[oklch(0.62_0.15_35)] to-[oklch(0.55_0.18_30)] text-white border-0 hover:from-[oklch(0.58_0.15_35)] hover:to-[oklch(0.51_0.18_30)]"
            >
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Date</p>
            <p className="font-semibold">{new Date().toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Recipe Name</p>
            <p className="font-semibold">{slip.recipeName}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Production Quantity</p>
            <p className="font-semibold">{slip.productionQuantity} portions</p>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-3">Required Ingredients</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold">Ingredient</TableHead>
                <TableHead className="text-right font-semibold">Quantity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slip.ingredients.map((ing, idx) => (
                <TableRow key={idx}>
                  <TableCell>{ing.name}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatQuantity(ing.quantityPerPortion, ing.unit)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="border-t pt-4 print:block hidden">
          <div className="grid grid-cols-2 gap-8 mt-8">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Prepared By</p>
              <div className="border-b border-gray-300 pt-8"></div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Approved By</p>
              <div className="border-b border-gray-300 pt-8"></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
