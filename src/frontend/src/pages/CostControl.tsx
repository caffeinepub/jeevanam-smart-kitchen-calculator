import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import CostAnalysis from '../components/CostAnalysis';

export default function CostControl() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[oklch(0.35_0.08_35)]">Cost Control</h1>
        <p className="text-muted-foreground mt-1">Analyze recipe costs and calculate profit margins</p>
      </div>

      {/* Important Note */}
      <Alert className="border-[oklch(0.65_0.12_140)] bg-[oklch(0.97_0.015_140)]">
        <AlertCircle className="h-4 w-4 text-[oklch(0.65_0.12_140)]" />
        <AlertTitle className="text-[oklch(0.35_0.08_35)]">Important</AlertTitle>
        <AlertDescription className="text-[oklch(0.40_0.05_35)]">
          Make sure all ingredients used in your recipes are added to the <strong>Raw Material Master</strong> with their costs before calculating recipe costs.
          The ingredient names in recipes must exactly match the raw material names (case-insensitive).
        </AlertDescription>
      </Alert>

      {/* Recipe Cost Calculation & Profit Margin Calculator */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold text-[oklch(0.35_0.08_35)]">Recipe Cost Analysis</h2>
          <p className="text-sm text-muted-foreground mt-1">Calculate total batch cost, cost per portion, and profit margins</p>
        </div>
        <CostAnalysis />
      </div>
    </div>
  );
}
