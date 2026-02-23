import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChefHat, Package, TrendingUp, DollarSign } from 'lucide-react';
import { useGetDashboardStats } from '../hooks/useQueries';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardSummary() {
  const { data: stats, isLoading } = useGetDashboardStats();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="border-[oklch(0.88_0.03_60)]">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Recipes</CardTitle>
          <ChefHat className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-[oklch(0.55_0.18_30)]">
            {stats ? Number(stats.totalRecipes) : 0}
          </div>
          <p className="text-xs text-muted-foreground mt-1">recipes in system</p>
        </CardContent>
      </Card>

      <Card className="border-[oklch(0.88_0.03_60)]">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Ingredients</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-[oklch(0.55_0.18_30)]">
            {stats ? Number(stats.totalIngredients) : 0}
          </div>
          <p className="text-xs text-muted-foreground mt-1">unique ingredients</p>
        </CardContent>
      </Card>

      <Card className="border-[oklch(0.88_0.03_60)]">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Most Produced Item</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-[oklch(0.55_0.18_30)]">
            {stats?.mostProducedItem || '-'}
          </div>
          <p className="text-xs text-muted-foreground mt-1">top recipe</p>
        </CardContent>
      </Card>

      <Card className="border-[oklch(0.88_0.03_60)]">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Average Food Cost %</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-[oklch(0.55_0.18_30)]">
            {stats ? stats.averageFoodCostPercentage.toFixed(1) : '0.0'}%
          </div>
          <p className="text-xs text-muted-foreground mt-1">across all recipes</p>
        </CardContent>
      </Card>
    </div>
  );
}
