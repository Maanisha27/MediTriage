import { Card } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { TriageResult } from '@/lib/triageAlgorithms';
import { PieChart as PieChartIcon } from 'lucide-react';

interface PriorityDistributionChartProps {
  results: TriageResult[];
}

export const PriorityDistributionChart = ({ results }: PriorityDistributionChartProps) => {
  const priorityCounts = results.reduce((acc, r) => {
    acc[r.priority] = (acc[r.priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(priorityCounts).map(([name, value]) => ({
    name,
    value,
    percentage: ((value / results.length) * 100).toFixed(1)
  }));

  const COLORS = {
    Critical: 'hsl(0 85% 60%)',
    High: 'hsl(35 95% 55%)',
    Medium: 'hsl(280 70% 60%)',
    Low: 'hsl(145 65% 45%)'
  };

  const renderLabel = (entry: any) => {
    return `${entry.name}: ${entry.percentage}%`;
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-card to-card/50 p-6 shadow-xl backdrop-blur-sm animate-fade-in">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <PieChartIcon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground">Priority Distribution</h3>
          <p className="text-sm text-muted-foreground">Patient categorization breakdown</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderLabel}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[entry.name as keyof typeof COLORS]} 
              />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            iconType="circle"
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {chartData.map((item) => (
          <div key={item.name} className="rounded-lg bg-muted/50 p-3 text-center">
            <div 
              className="mx-auto mb-2 h-3 w-3 rounded-full" 
              style={{ backgroundColor: COLORS[item.name as keyof typeof COLORS] }}
            />
            <p className="text-xs font-medium text-muted-foreground">{item.name}</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{item.value}</p>
            <p className="text-xs text-muted-foreground">{item.percentage}%</p>
          </div>
        ))}
      </div>
    </Card>
  );
};
