import { Card } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Users } from 'lucide-react';

interface SpecialistRoutingChartProps {
  routingData: Record<string, number>;
}

export const SpecialistRoutingChart = ({ routingData }: SpecialistRoutingChartProps) => {
  const chartData = Object.entries(routingData).map(([specialist, count]) => ({
    specialist,
    count,
    load: count * 10 // Simulated load percentage
  }));

  const COLORS = [
    'hsl(200 95% 45%)',
    'hsl(280 70% 60%)',
    'hsl(145 65% 45%)',
    'hsl(35 95% 55%)',
    'hsl(340 85% 55%)'
  ];

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-card to-card/50 p-6 shadow-xl backdrop-blur-sm animate-fade-in">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <Users className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground">Specialist Routing & Load</h3>
          <p className="text-sm text-muted-foreground">Recommended specialist assignments</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <defs>
            {COLORS.map((color, idx) => (
              <linearGradient key={idx} id={`specGrad${idx}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={color} stopOpacity={0.3}/>
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis 
            dataKey="specialist" 
            angle={-45} 
            textAnchor="end" 
            height={80}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
          />
          <YAxis 
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            label={{ value: 'Patient Count', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
            formatter={(value: number, name: string) => {
              if (name === 'count') return [value, 'Patients'];
              return [value + '%', 'Load'];
            }}
          />
          <Bar 
            dataKey="count" 
            radius={[8, 8, 0, 0]}
            maxBarSize={80}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={`url(#specGrad${index % COLORS.length})`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {chartData.map((item, idx) => (
          <div key={item.specialist} className="rounded-lg bg-muted/50 p-3 text-center">
            <div 
              className="mx-auto mb-2 h-3 w-3 rounded-full" 
              style={{ backgroundColor: COLORS[idx % COLORS.length] }}
            />
            <p className="text-xs font-medium text-muted-foreground">{item.specialist}</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{item.count}</p>
            <p className="text-xs text-muted-foreground">patients</p>
          </div>
        ))}
      </div>
    </Card>
  );
};
