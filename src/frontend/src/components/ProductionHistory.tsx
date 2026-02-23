import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import { useGetProductionHistory } from '../hooks/useQueries';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProductionHistory() {
  const { data: history, isLoading } = useGetProductionHistory();

  const todayProductions = history?.filter((prod) => {
    const prodDate = new Date(prod.date);
    const today = new Date();
    return prodDate.toDateString() === today.toDateString();
  }) || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-[oklch(0.88_0.03_60)]">
      <CardHeader className="bg-gradient-to-r from-[oklch(0.97_0.015_60)] to-[oklch(0.95_0.02_80)]">
        <CardTitle className="text-[oklch(0.35_0.08_35)]">Today's Production History</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {todayProductions.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No production recorded today</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Recipe</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {todayProductions.map((prod, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">
                    {new Date(prod.date).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </TableCell>
                  <TableCell>{prod.recipeName}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary">{prod.quantity} portions</Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-[oklch(0.55_0.18_30)]">
                    ₹{(prod.cost / 100).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
