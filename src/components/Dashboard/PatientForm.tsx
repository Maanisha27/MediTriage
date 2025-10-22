import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Plus, User } from 'lucide-react';
import { PatientData } from '@/lib/triageAlgorithms';

interface PatientFormProps {
  onAddPatient: (patient: PatientData) => void;
}

export const PatientForm = ({ onAddPatient }: PatientFormProps) => {
  const [formData, setFormData] = useState({
    id: '',
    age: '',
    temperature: '',
    severity: '',
    urgency: '',
    resourceNeed: '',
    waitingImpact: '',
    painLevel: '',
    conditionDesc: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const patient: PatientData = {
      id: formData.id || `P${Date.now().toString().slice(-3)}`,
      age: Number(formData.age),
      temperature: Number(formData.temperature),
      severity: Number(formData.severity),
      urgency: Number(formData.urgency),
      resourceNeed: Number(formData.resourceNeed),
      waitingImpact: Number(formData.waitingImpact),
      ageVulnerability: 0, // Calculated automatically
      painLevel: Number(formData.painLevel),
      conditionDesc: formData.conditionDesc,
      registrationTime: new Date()
    };
    
    onAddPatient(patient);
    
    // Reset form
    setFormData({
      id: '',
      age: '',
      temperature: '',
      severity: '',
      urgency: '',
      resourceNeed: '',
      waitingImpact: '',
      painLevel: '',
      conditionDesc: ''
    });
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-card to-card/50 p-6 shadow-xl backdrop-blur-sm animate-fade-in">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <User className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Add New Patient</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="id" className="text-sm font-medium">
              Patient ID <span className="text-muted-foreground">(auto-generated if empty)</span>
            </Label>
            <Input
              id="id"
              placeholder="P001"
              value={formData.id}
              onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              className="bg-background/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="age" className="text-sm font-medium">
              Age (years) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="age"
              type="number"
              required
              min="0"
              max="120"
              placeholder="45"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              className="bg-background/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="temperature" className="text-sm font-medium">
              Temperature (°C) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="temperature"
              type="number"
              required
              step="0.1"
              min="30"
              max="45"
              placeholder="37.5"
              value={formData.temperature}
              onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
              className="bg-background/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="severity" className="text-sm font-medium">
              Severity (0-100) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="severity"
              type="number"
              required
              min="0"
              max="100"
              placeholder="75"
              value={formData.severity}
              onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
              className="bg-background/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="urgency" className="text-sm font-medium">
              Urgency (0-100) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="urgency"
              type="number"
              required
              min="0"
              max="100"
              placeholder="80"
              value={formData.urgency}
              onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
              className="bg-background/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="resourceNeed" className="text-sm font-medium">
              Resource Need (0-100) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="resourceNeed"
              type="number"
              required
              min="0"
              max="100"
              placeholder="70"
              value={formData.resourceNeed}
              onChange={(e) => setFormData({ ...formData, resourceNeed: e.target.value })}
              className="bg-background/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="waitingImpact" className="text-sm font-medium">
              Waiting Impact (0-100) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="waitingImpact"
              type="number"
              required
              min="0"
              max="100"
              placeholder="65"
              value={formData.waitingImpact}
              onChange={(e) => setFormData({ ...formData, waitingImpact: e.target.value })}
              className="bg-background/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="painLevel" className="text-sm font-medium">
              Pain Level (0-10) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="painLevel"
              type="number"
              required
              min="0"
              max="10"
              placeholder="7"
              value={formData.painLevel}
              onChange={(e) => setFormData({ ...formData, painLevel: e.target.value })}
              className="bg-background/50"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="conditionDesc" className="text-sm font-medium">
            Condition Description <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="conditionDesc"
            required
            placeholder="e.g., Acute Myocardial Infarction"
            value={formData.conditionDesc}
            onChange={(e) => setFormData({ ...formData, conditionDesc: e.target.value })}
            className="min-h-[80px] bg-background/50"
          />
        </div>

        <Button 
          type="submit" 
          className="w-full bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 transition-opacity shadow-lg"
          size="lg"
        >
          <Plus className="mr-2 h-5 w-5" />
          Add Patient & Run Triage
        </Button>
      </form>
    </Card>
  );
};
