import CostAnalysis from '../components/CostAnalysis';

export default function CostControl() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[oklch(0.35_0.08_35)]">Cost Control</h1>
        <p className="text-muted-foreground mt-1">Analyze recipe costs and calculate profit margins</p>
      </div>

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
