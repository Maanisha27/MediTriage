import { Card } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TriageResult } from '@/lib/triageAlgorithms';
import { BarChart3 } from 'lucide-react';

interface TOPSISComparisonChartProps {
  results: TriageResult[];
}

export const TOPSISComparisonChart = ({ results }: TOPSISComparisonChartProps) => {
  const chartData = results.map(r => ({
    id: r.id,
    TOPSIS: Number(r.topsisScore.toFixed(3)),
    PROMETHEE: Number((r.prometheeScore + 0.5).toFixed(3)), // Normalize to 0-1 range
    Priority: r.priority
  }));

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-card to-card/50 p-6 shadow-xl backdrop-blur-sm animate-fade-in">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <BarChart3 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground">TOPSIS vs PROMETHEE Scores</h3>
          <p className="text-sm text-muted-foreground">Multi-criteria decision analysis comparison</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <defs>
            <linearGradient id="topsisGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(200 95% 45%)" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="hsl(200 95% 45%)" stopOpacity={0.3}/>
            </linearGradient>
            <linearGradient id="prometheeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(280 70% 60%)" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="hsl(280 70% 60%)" stopOpacity={0.3}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis 
            dataKey="id" 
            angle={-45} 
            textAnchor="end" 
            height={80}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
          />
          <YAxis 
            domain={[0, 1]}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
          />
          <Bar 
            dataKey="TOPSIS" 
            fill="url(#topsisGrad)" 
            radius={[8, 8, 0, 0]}
            maxBarSize={60}
          />
          <Bar 
            dataKey="PROMETHEE" 
            fill="url(#prometheeGrad)" 
            radius={[8, 8, 0, 0]}
            maxBarSize={60}
          />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};
