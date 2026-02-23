import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChefHat, TrendingUp, Package, DollarSign } from 'lucide-react';
import DashboardSummary from '../components/DashboardSummary';
import ProductionHistory from '../components/ProductionHistory';

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[oklch(0.35_0.08_35)] mb-2">Production Dashboard</h1>
        <p className="text-muted-foreground">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <DashboardSummary />
      <ProductionHistory />
    </div>
  );
}
