import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const Login = () => {
  const [userId, setUserId] = useState('');
  const [userType, setUserType] = useState<'patient' | 'doctor'>('patient');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId.trim()) {
      toast.error('Please enter a valid ID');
      return;
    }

    try {
      if (userType === 'patient') {
        // Check if patient exists
        const response = await fetch(`http://localhost:3001/api/patients/${userId}`);
        if (response.ok) {
          localStorage.setItem('userType', 'patient');
          localStorage.setItem('userId', userId);
          navigate('/dashboard');
          toast.success('Patient login successful');
        } else {
          toast.error('Patient not found');
        }
      } else {
        // Check if doctor exists
        const response = await fetch(`http://localhost:3001/api/doctors/${userId}`);
        if (response.ok) {
          localStorage.setItem('userType', 'doctor');
          localStorage.setItem('userId', userId);
          navigate('/dashboard');
          toast.success('Doctor login successful');
        } else {
          toast.error('Doctor not found');
        }
      }
    } catch (error) {
      toast.error('Login failed. Please try again.');
      console.error('Login error:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-indigo-800">Medical Triage System</CardTitle>
          <CardDescription>Login to access the system</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userId">User ID</Label>
              <Input
                id="userId"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter your ID (e.g., P001 for patients, CARD_01 for doctors)"
                className="border-indigo-200 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            
            <div className="space-y-2">
              <Label>User Type</Label>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    checked={userType === 'patient'}
                    onChange={() => setUserType('patient')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Patient</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    checked={userType === 'doctor'}
                    onChange={() => setUserType('doctor')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Doctor</span>
                </label>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Login
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="w-full border-t border-gray-200 pt-4">
            <p className="text-center text-sm text-gray-600 mb-3">New to our system?</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                variant="outline" 
                className="flex-1 border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                onClick={() => navigate('/register/patient')}
              >
                Register as Patient
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                onClick={() => navigate('/register/doctor')}
              >
                Register as Doctor
              </Button>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="w-full border-indigo-300 text-indigo-700 hover:bg-indigo-50"
            onClick={() => navigate('/dashboard')}
          >
            Continue as Guest (Demo Mode)
          </Button>
          <Button 
            variant="ghost" 
            className="w-full text-gray-500 hover:text-gray-700 text-sm"
            onClick={() => navigate('/admin/login')}
          >
            Admin Login
          </Button>
          <p className="text-xs text-gray-500 text-center mt-2">
            Sample IDs: P001-P010 (patients), CARD_01, NEUR_02, etc. (doctors)
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;