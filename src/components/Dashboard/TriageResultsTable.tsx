import { TriageResult } from '@/lib/triageAlgorithms';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, Activity } from 'lucide-react';

interface TriageResultsTableProps {
  results: TriageResult[];
  onSelectPatient: (patientId: string) => void;
}

export const TriageResultsTable = ({ results, onSelectPatient }: TriageResultsTableProps) => {
  const getPriorityColor = (priority: string) => {
    const colors = {
      Critical: 'bg-destructive text-destructive-foreground',
      High: 'bg-warning text-warning-foreground',
      Medium: 'bg-secondary text-secondary-foreground',
      Low: 'bg-success text-success-foreground'
    };
    return colors[priority as keyof typeof colors] || colors.Low;
  };

  if (results.length === 0) {
    return (
      <Card className="border-border/50 bg-card/50 p-12 text-center backdrop-blur-sm">
        <Activity className="mx-auto h-16 w-16 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-semibold text-foreground">No Patient Data</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Add patients using the form above to see triage results
        </p>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-card to-card/50 p-6 shadow-xl backdrop-blur-sm animate-fade-in overflow-hidden">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <AlertCircle className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Triage Results</h2>
          <p className="text-sm text-muted-foreground">Ranked by TOPSIS score (highest priority first)</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-muted/30">
              <TableHead className="font-semibold">Rank</TableHead>
              <TableHead className="font-semibold">Patient ID</TableHead>
              <TableHead className="font-semibold">Age</TableHead>
              <TableHead className="font-semibold">Condition</TableHead>
              <TableHead className="font-semibold text-center">TOPSIS</TableHead>
              <TableHead className="font-semibold text-center">PROMETHEE</TableHead>
              <TableHead className="font-semibold text-center">Priority</TableHead>
              <TableHead className="font-semibold">Fuzzy Label</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((result, index) => (
              <TableRow
                key={result.id}
                className="cursor-pointer border-border/30 transition-colors hover:bg-muted/50"
                onClick={() => onSelectPatient(result.id)}
              >
                <TableCell className="font-mono font-medium">#{index + 1}</TableCell>
                <TableCell className="font-mono font-semibold text-primary">
                  {result.id}
                </TableCell>
                <TableCell>{result.age}</TableCell>
                <TableCell className="max-w-[200px] truncate" title={result.conditionDesc}>
                  {result.conditionDesc}
                </TableCell>
                <TableCell className="text-center">
                  <span className="font-mono font-semibold text-foreground">
                    {result.topsisScore.toFixed(3)}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="font-mono text-sm text-muted-foreground">
                    {result.prometheeScore.toFixed(4)}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <Badge className={getPriorityColor(result.priority)}>
                    {result.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">{result.fuzzyLabel}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};
