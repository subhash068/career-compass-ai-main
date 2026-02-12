import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { authApi } from '@/api/auth.api';
import { LogIn, UserPlus, Check, X, Mail, Shield, Clock, Eye, EyeOff } from 'lucide-react';

type AuthMode = 'login' | 'register' | 'verify' | 'forgotPassword' | 'resetPassword';

export default function Login() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [demoOtp, setDemoOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
  const [newPasswordFocused, setNewPasswordFocused] = useState(false);
  const [confirmNewPasswordFocused, setConfirmNewPasswordFocused] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
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

  // Resend timer effect
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Generate demo OTP
  useEffect(() => {
    if (mode === 'verify') {
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setDemoOtp(generatedOtp);
      toast({
        title: "Verification Code Sent",
        description: `Demo OTP: ${generatedOtp} (Check the notification)`,
      });
    }
  }, [mode, toast]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (mode === 'register') {
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

        try {
          await authApi.register({ email, name, password });
          setMode('verify');
          setResendTimer(30);
        } catch (err) {
          setError('Registration failed. Please try again.');
        }
      } else if (mode === 'login') {
        console.log('Login attempt with email:', email, 'password:', password);
        try {
          const data = await authApi.login({ email, password });
          // Store token and user data
          localStorage.setItem('authToken', data.access_token);
          if (data.refresh_token) {
            localStorage.setItem('refreshToken', data.refresh_token);
          }
          localStorage.setItem('user', JSON.stringify(data.user));

          // Dispatch custom event to notify AuthWrapper of auth change
          window.dispatchEvent(new CustomEvent('authChange'));

          toast({
            title: "Login Successful",
            description: `Welcome back, ${data.user.name}!`,
          });

          // Redirect based on user role
          if (data.user.role.toUpperCase() === 'ADMIN') {
            navigate('/admin');
          } else {
            navigate('/dashboard');
          }
        } catch (err: any) {
          console.error('Login error:', err);
          if (err.response?.status === 401) {
            setError('Invalid email or password');
          } else {
            setError('Login failed. Please check your connection and try again.');
          }
        }
      } else if (mode === 'verify') {
        const otpCode = otp.join('');
        if (otpCode.length !== 6) {
          setError('Please enter the complete 6-digit code.');
          setIsLoading(false);
          return;
        }

        // For demo purposes, accept the generated OTP
        if (otpCode === demoOtp) {
          // Simulate successful verification
          const user = { id: 1, name, email };
          localStorage.setItem('authToken', 'demo-token-' + Date.now());
          localStorage.setItem('user', JSON.stringify(user));

          // Dispatch custom event to notify AuthWrapper of auth change
          window.dispatchEvent(new CustomEvent('authChange'));

          toast({
            title: "Account Verified",
            description: `Welcome to Career AI, ${name}!`,
          });

          navigate('/');
        } else {
          setError('Invalid verification code. Please try again.');
        }
      } else if (mode === 'forgotPassword') {
        // Generate demo reset code
        setResetToken('demo-token-' + Date.now());
        setMode('resetPassword');
        setOtp(['', '', '', '', '', '']);
        const newDemoOtp = Math.floor(100000 + Math.random() * 900000).toString();
        setDemoOtp(newDemoOtp);
        toast({
          title: "Reset Code Sent",
          description: `Demo reset code: ${newDemoOtp}`,
        });
      } else if (mode === 'resetPassword') {
        const otpCode = otp.join('');
        if (otpCode.length !== 6) {
          setError('Please enter the complete 6-digit code.');
          setIsLoading(false);
          return;
        }

        // Validate new password
        const newPasswordValidation = validatePassword(newPassword);
        if (!newPasswordValidation.isValid) {
          setError('New password must meet all strength requirements.');
          setIsLoading(false);
          return;
        }

        // Check password confirmation
        if (newPassword !== confirmNewPassword) {
          setError('New passwords do not match.');
          setIsLoading(false);
          return;
        }

        // For demo purposes, accept the generated OTP
        if (otpCode === demoOtp) {
          toast({
            title: "Password Reset Successful",
            description: "You can now sign in with your new password.",
          });
          setMode('login');
          setPassword('');
          setNewPassword('');
          setConfirmNewPassword('');
          setOtp(['', '', '', '', '', '']);
        } else {
          setError('Invalid reset code. Please try again.');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = () => {
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setDemoOtp(newOtp);
    setResendTimer(30);
    setOtp(['', '', '', '', '', '']);
    otpRefs.current[0]?.focus();

    toast({
      title: "New Code Sent",
      description: `Demo OTP: ${newOtp}`,
    });
  };

  const renderLoginForm = () => (
    <>
      <CardHeader className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4 mx-auto">
          <LogIn className="w-7 h-7 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
        <CardDescription>Sign in to your Career Compass account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              className={`transition-all duration-300 ${
                emailFocused ? 'ring-2 ring-primary/50 shadow-lg scale-[1.02]' : 'hover:shadow-md'
              }`}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                className={`transition-all duration-300 ${
                  passwordFocused ? 'ring-2 ring-primary/50 shadow-lg scale-[1.02]' : 'hover:shadow-md'
                }`}
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
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <Button
            variant="link"
            onClick={() => {
              setMode('forgotPassword');
              setError('');
              setEmail('');
            }}
            className="text-sm"
          >
            Forgot Password?
          </Button>
          <br />
          <Button
            variant="link"
            onClick={() => {
              setMode('register');
              setError('');
              setPassword('');
            }}
            className="text-sm"
          >
            Don't have an account? Sign up
          </Button>
        </div>
      </CardContent>
    </>
  );

  const renderRegisterForm = () => (
    <>
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
                    8+
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

                <div className="flex flex-wrap gap-1 text-xs">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${
                    confirmPassword ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                  }`}>
                    {confirmPassword ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />}
                    Entered
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${
                    password === confirmPassword && confirmPassword ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                  }`}>
                    {password === confirmPassword && confirmPassword ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />}
                    Matches
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

          <Button type="submit" className="w-full" disabled={isLoading || !passwordValidation.isValid}>
            {isLoading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Button
            variant="link"
            onClick={() => {
              setMode('login');
              setError('');
              setPassword('');
              setConfirmPassword('');
            }}
            className="text-sm"
          >
            Already have an account? Sign in
          </Button>
        </div>
      </CardContent>
    </>
  );

  const renderVerifyForm = () => (
    <>
      <CardHeader className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4 mx-auto">
          <Mail className="w-7 h-7 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">Verify Your Email</CardTitle>
        <CardDescription>
          We've sent a 6-digit code to {email}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <Label>Enter Verification Code</Label>
            <div className="flex gap-2 justify-center">
              {otp.map((digit, index) => (
                <Input
                  key={index}
                  ref={(el) => (otpRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  className="w-12 h-12 text-center text-lg font-bold"
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                />
              ))}
            </div>
          </div>

          {/* Demo Email Inbox */}
          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription>
              <strong>Demo Email:</strong> Verification code: <code className="bg-muted px-1 rounded">{demoOtp}</code>
            </AlertDescription>
          </Alert>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={isLoading || otp.some(digit => !digit)}>
            {isLoading ? 'Verifying...' : 'Verify Account'}
          </Button>

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Didn't receive the code?
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={handleResendOtp}
              disabled={resendTimer > 0}
              className="w-full"
            >
              {resendTimer > 0 ? (
                <>
                  <Clock className="w-4 h-4 mr-2" />
                  Resend in {resendTimer}s
                </>
              ) : (
                'Resend Code'
              )}
            </Button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <Button
            variant="link"
            onClick={() => {
              setMode('register');
              setError('');
              setOtp(['', '', '', '', '', '']);
            }}
            className="text-sm"
          >
            Change email address
          </Button>
        </div>
      </CardContent>
    </>
  );

  const renderForgotPasswordForm = () => (
    <>
      <CardHeader className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4 mx-auto">
          <Mail className="w-7 h-7 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
        <CardDescription>Enter your email address and we'll send you a reset code</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              className={`transition-all duration-300 ${
                emailFocused ? 'ring-2 ring-primary/50 shadow-lg scale-[1.02]' : 'hover:shadow-md'
              }`}
              required
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Sending reset code...' : 'Send Reset Code'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Button
            variant="link"
            onClick={() => {
              setMode('login');
              setError('');
            }}
            className="text-sm"
          >
            Back to sign in
          </Button>
        </div>
      </CardContent>
    </>
  );

  const renderResetPasswordForm = () => {
    const newPasswordValidation = validatePassword(newPassword);

    return (
      <>
        <CardHeader className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4 mx-auto">
            <Shield className="w-7 h-7 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Set New Password</CardTitle>
          <CardDescription>Enter the reset code and your new password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              <Label>Enter Reset Code</Label>
              <div className="flex gap-2 justify-center">
                {otp.map((digit, index) => (
                  <Input
                    key={index}
                    ref={(el) => (otpRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    className="w-12 h-12 text-center text-lg font-bold"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  />
                ))}
              </div>
            </div>

            {/* Demo Reset Code */}
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                <strong>Demo Reset Code:</strong> <code className="bg-muted px-1 rounded">{demoOtp}</code>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onFocus={() => setNewPasswordFocused(true)}
                  onBlur={() => setNewPasswordFocused(false)}
                  className={`transition-all duration-300 ${
                    newPasswordFocused ? 'ring-2 ring-primary/50 shadow-lg scale-[1.02]' : 'hover:shadow-md'
                  }`}
                  required
                />
              </div>

              {/* Password Strength Indicator */}
              {newPassword && (
                <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-md border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className={`h-3.5 w-3.5 ${
                        newPasswordValidation.strength === 'Strong' ? 'text-green-500' :
                        newPasswordValidation.strength === 'Moderate' ? 'text-yellow-500' : 'text-red-500'
                      }`} />
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Password Strength</span>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                      newPasswordValidation.strength === 'Strong' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      newPasswordValidation.strength === 'Moderate' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {newPasswordValidation.strength}
                    </span>
                  </div>

                  <Progress
                    value={newPasswordValidation.score}
                    className="h-1.5"
                  />

                  <div className="flex flex-wrap gap-1 text-xs">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${
                      newPasswordValidation.isLongEnough ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                    }`}>
                      {newPasswordValidation.isLongEnough ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />}
                      8+
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${
                      newPasswordValidation.hasUpper ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                    }`}>
                      {newPasswordValidation.hasUpper ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />}
                      A-Z
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${
                      newPasswordValidation.hasLower ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                    }`}>
                      {newPasswordValidation.hasLower ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />}
                      a-z
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${
                      newPasswordValidation.hasNumber ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                    }`}>
                      {newPasswordValidation.hasNumber ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />}
                      0-9
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${
                      newPasswordValidation.hasSpecial ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                    }`}>
                      {newPasswordValidation.hasSpecial ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />}
                      !@#
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmNewPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  onFocus={() => setConfirmNewPasswordFocused(true)}
                  onBlur={() => setConfirmNewPasswordFocused(false)}
                  className={`transition-all duration-300 ${
                    confirmNewPasswordFocused ? 'ring-2 ring-primary/50 shadow-lg scale-[1.02]' : 'hover:shadow-md'
                  }`}
                  required
                />
              </div>

              {/* Confirm Password Match Indicator */}
              {confirmNewPassword && (
                <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-md border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className={`h-3.5 w-3.5 ${
                        newPassword === confirmNewPassword && confirmNewPassword ? 'text-green-500' : 'text-red-500'
                      }`} />
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Password Match</span>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                      newPassword === confirmNewPassword && confirmNewPassword ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {newPassword === confirmNewPassword && confirmNewPassword ? 'Match' : 'No Match'}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1 text-xs">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${
                      confirmNewPassword ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                    }`}>
                      {confirmNewPassword ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />}
                      Entered
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${
                      newPassword === confirmNewPassword && confirmNewPassword ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                    }`}>
                      {newPassword === confirmNewPassword && confirmNewPassword ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />}
                      Matches
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
              disabled={isLoading || !newPasswordValidation.isValid || otp.some(digit => !digit)}
            >
              {isLoading ? 'Resetting password...' : 'Reset Password'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Button
              variant="link"
              onClick={() => {
                setMode('forgotPassword');
                setError('');
                setOtp(['', '', '', '', '', '']);
                setNewPassword('');
                setConfirmNewPassword('');
              }}
              className="text-sm"
            >
              Back to email entry
            </Button>
          </div>
        </CardContent>
      </>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
      <Card className="w-full max-w-md">
        {mode === 'login' && renderLoginForm()}
        {mode === 'register' && renderRegisterForm()}
        {mode === 'verify' && renderVerifyForm()}
        {mode === 'forgotPassword' && renderForgotPasswordForm()}
        {mode === 'resetPassword' && renderResetPasswordForm()}
      </Card>
    </div>
  );
}
