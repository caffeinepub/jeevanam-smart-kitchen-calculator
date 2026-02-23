import { useState } from 'react';
import ProductionCalculator from '../components/ProductionCalculator';
import StoreIssueSlip from '../components/StoreIssueSlip';
import { Card } from '@/components/ui/card';

export default function ProductionCalculatorPage() {
  const [calculationResult, setCalculationResult] = useState<{
    recipeName: string;
    quantity: number;
  } | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[oklch(0.35_0.08_35)]">Production Calculator</h1>
        <p className="text-muted-foreground mt-1">Calculate raw material requirements for production</p>
      </div>

      <ProductionCalculator onCalculationComplete={setCalculationResult} />

      {calculationResult && (
        <StoreIssueSlip
          recipeName={calculationResult.recipeName}
          quantity={calculationResult.quantity}
        />
      )}
    </div>
  );
}
