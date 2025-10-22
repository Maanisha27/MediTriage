import { ReactNode } from 'react';
import { Activity, Users, TrendingUp, Clock } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  color: 'primary' | 'success' | 'warning' | 'emergency';
}

const StatCard = ({ title, value, icon, trend, color }: StatCardProps) => {
  const colorClasses = {
    primary: 'from-primary to-primary-glow border-primary/20',
    success: 'from-success to-success/80 border-success/20',
    warning: 'from-warning to-warning/80 border-warning/20',
    emergency: 'from-destructive to-accent border-destructive/20'
  };

  return (
    <div className={`relative overflow-hidden rounded-xl border bg-gradient-to-br ${colorClasses[color]} p-6 shadow-lg backdrop-blur-sm animate-fade-in`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-white/80">{title}</p>
          <p className="mt-2 text-3xl font-bold text-white">{value}</p>
          {trend && <p className="mt-1 text-xs text-white/70">{trend}</p>}
        </div>
        <div className="rounded-full bg-white/20 p-3 backdrop-blur-sm">
          {icon}
        </div>
      </div>
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
    </div>
  );
};

interface DashboardLayoutProps {
  totalPatients: number;
  criticalCount: number;
  avgWaitTime: string;
  triageAccuracy: string;
  children: ReactNode;
}

export const DashboardLayout = ({
  totalPatients,
  criticalCount,
  avgWaitTime,
  triageAccuracy,
  children
}: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-lg">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                AI Medical Emergency Triage System
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Intelligent Decision Support for Emergency Care
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 animate-pulse rounded-full bg-success"></div>
              <span className="text-sm font-medium text-muted-foreground">System Active</span>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Patients"
            value={totalPatients}
            icon={<Users className="h-6 w-6 text-white" />}
            color="primary"
          />
          <StatCard
            title="Critical Cases"
            value={criticalCount}
            icon={<Activity className="h-6 w-6 text-white" />}
            trend="Requires immediate attention"
            color="emergency"
          />
          <StatCard
            title="Avg Triage Time"
            value={avgWaitTime}
            icon={<Clock className="h-6 w-6 text-white" />}
            trend="38% faster than manual"
            color="warning"
          />
          <StatCard
            title="Triage Accuracy"
            value={triageAccuracy}
            icon={<TrendingUp className="h-6 w-6 text-white" />}
            trend="Based on validation set"
            color="success"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 pb-12">
        {children}
      </div>
    </div>
  );
};
