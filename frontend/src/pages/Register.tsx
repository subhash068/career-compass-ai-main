import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { authApi } from '@/api/auth.api';
import { UserPlus, Check, X, Shield, Eye, EyeOff, ArrowLeft } from 'lucide-react';

export default function Register() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Password strength validation
  const validatePassword = (password: string) => {
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    const isLongEnough = password.length >= 8;

    const score = [hasLower, hasUpper, hasNumber, hasSpecial, isLongEnough].filter(Boolean).length;
    let strength = 'Weak';
    let color = 'bg-red-500';

    if (score >= 4) {
      strength = 'Strong';
      color = 'bg-green-500';
    } else if (score >= 3) {
      strength = 'Moderate';
      color = 'bg-yellow-500';
    }

    return {
      hasLower,
      hasUpper,
      hasNumber,
      hasSpecial,
      isLongEnough,
      isValid: hasLower && hasUpper && hasNumber && hasSpecial && isLongEnough,
      score: (score / 5) * 100,
      strength,
      color
    };
  };

  const passwordValidation = validatePassword(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Validate password
      if (!passwordValidation.isValid) {
        setError('Password must meet all strength requirements.');
        setIsLoading(false);
        return;
      }

      // Check password confirmation
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        setIsLoading(false);
        return;
      }

      await authApi.register({ email, name, password });
      
      toast({
        title: "Registration Successful",
        description: "Your account has been created. Please sign in.",
      });

      // Redirect to login
      navigate('/login');
    } catch (err: any) {
      console.error('Registration error:', err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4 mx-auto">
            <UserPlus className="w-7 h-7 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
          <CardDescription>Join Career Compass to start your journey</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>

              {/* Password Strength Indicator */}
              {password && (
                <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-md border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className={`h-3.5 w-3.5 ${
                        passwordValidation.strength === 'Strong' ? 'text-green-500' :
                        passwordValidation.strength === 'Moderate' ? 'text-yellow-500' : 'text-red-500'
                      }`} />
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Password Strength</span>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                      passwordValidation.strength === 'Strong' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      passwordValidation.strength === 'Moderate' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {passwordValidation.strength}
                    </span>
                  </div>

                  <Progress
                    value={passwordValidation.score}
                    className="h-1.5"
                  />

                  <div className="flex flex-wrap gap-1 text-xs">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${
                      passwordValidation.isLongEnough ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                    }`}>
                      {passwordValidation.isLongEnough ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />}
                      8+ chars
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${
                      passwordValidation.hasUpper ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                    }`}>
                      {passwordValidation.hasUpper ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />}
                      A-Z
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${
                      passwordValidation.hasLower ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                    }`}>
                      {passwordValidation.hasLower ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />}
                      a-z
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${
                      passwordValidation.hasNumber ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                    }`}>
                      {passwordValidation.hasNumber ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />}
                      0-9
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${
                      passwordValidation.hasSpecial ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                    }`}>
                      {passwordValidation.hasSpecial ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />}
                      !@#
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>

              {/* Confirm Password Match Indicator */}
              {confirmPassword && (
                <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-md border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className={`h-3.5 w-3.5 ${
                        password === confirmPassword && confirmPassword ? 'text-green-500' : 'text-red-500'
                      }`} />
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Password Match</span>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                      password === confirmPassword && confirmPassword ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {password === confirmPassword && confirmPassword ? 'Match' : 'No Match'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !passwordValidation.isValid}
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="text-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
