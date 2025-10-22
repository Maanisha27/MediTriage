import { Card } from '@/components/ui/card';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis } from 'recharts';
import { TriageResult } from '@/lib/triageAlgorithms';
import { Activity } from 'lucide-react';

interface AgeSeverityScatterChartProps {
  results: TriageResult[];
}

export const AgeSeverityScatterChart = ({ results }: AgeSeverityScatterChartProps) => {
  const chartData = results.map(r => ({
    age: r.age,
    severity: r.severity,
    painLevel: r.painLevel * 10, // Scale for bubble size
    id: r.id,
    priority: r.priority
  }));

  const COLORS = {
    Critical: 'hsl(0 85% 60%)',
    High: 'hsl(35 95% 55%)',
    Medium: 'hsl(280 70% 60%)',
    Low: 'hsl(145 65% 45%)'
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
          <p className="font-semibold text-foreground">{data.id}</p>
          <p className="text-sm text-muted-foreground">Age: {data.age} years</p>
          <p className="text-sm text-muted-foreground">Severity: {data.severity}</p>
          <p className="text-sm text-muted-foreground">Pain: {data.painLevel / 10}/10</p>
          <p className="text-sm font-medium" style={{ color: COLORS[data.priority as keyof typeof COLORS] }}>
            {data.priority} Priority
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-card to-card/50 p-6 shadow-xl backdrop-blur-sm animate-fade-in">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <Activity className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground">Age vs Severity Analysis</h3>
          <p className="text-sm text-muted-foreground">Bubble size represents pain level</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
          <defs>
            <radialGradient id="criticalGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="hsl(0 85% 60%)" stopOpacity={0.8} />
              <stop offset="100%" stopColor="hsl(0 85% 60%)" stopOpacity={0.3} />
            </radialGradient>
            <radialGradient id="highGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="hsl(35 95% 55%)" stopOpacity={0.8} />
              <stop offset="100%" stopColor="hsl(35 95% 55%)" stopOpacity={0.3} />
            </radialGradient>
            <radialGradient id="mediumGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="hsl(280 70% 60%)" stopOpacity={0.8} />
              <stop offset="100%" stopColor="hsl(280 70% 60%)" stopOpacity={0.3} />
            </radialGradient>
            <radialGradient id="lowGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="hsl(145 65% 45%)" stopOpacity={0.8} />
              <stop offset="100%" stopColor="hsl(145 65% 45%)" stopOpacity={0.3} />
            </radialGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis 
            type="number" 
            dataKey="age" 
            name="Age"
            domain={[0, 'dataMax + 10']}
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
            label={{ value: 'Age (years)', position: 'insideBottom', offset: -10, fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis 
            type="number" 
            dataKey="severity" 
            name="Severity"
            domain={[0, 100]}
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
            label={{ value: 'Severity', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))' }}
          />
          <ZAxis type="number" dataKey="painLevel" range={[50, 400]} />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
          
          {['Critical', 'High', 'Medium', 'Low'].map((priority) => (
            <Scatter
              key={priority}
              name={priority}
              data={chartData.filter(d => d.priority === priority)}
              fill={`url(#${priority.toLowerCase()}Grad)`}
            />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    </Card>
  );
};
