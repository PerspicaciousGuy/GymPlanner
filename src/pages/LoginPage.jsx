import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2, LogIn, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function LoginPage({ authState, onLoginSuccess, onBack }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Validate password strength
  const validatePassword = (pass) => {
    const minLength = 8;
    const hasUpper = /[A-Z]/.test(pass);
    const hasLower = /[a-z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pass);

    if (pass.length < minLength) return "Password must be at least 8 characters long.";
    if (!hasUpper) return "Password must contain at least one uppercase letter.";
    if (!hasLower) return "Password must contain at least one lowercase letter.";
    if (!hasNumber) return "Password must contain at least one number.";
    if (!hasSpecial) return "Password must contain at least one special character.";

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    if (isSignUp) {
      const passError = validatePassword(password);
      if (passError) {
        setError(passError);
        return;
      }
    }

    try {
      setLoading(true);
      setError('');
      if (isSignUp) {
        await authState.signup(email, password);
      } else {
        await authState.login(email, password);
      }
      onLoginSuccess();
    } catch (err) {
      setError(err?.message || (isSignUp ? 'Failed to create account. Please try again.' : 'Failed to sign in. Please check your credentials.'));
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setPassword('');
  };

  return (
    <div className="absolute inset-0 z-50 flex min-h-screen w-full bg-[var(--app-bg)] text-foreground">
      <div className="relative hidden w-1/2 items-center justify-center overflow-hidden bg-[var(--app-surface-muted)] lg:flex">
        <div className="absolute inset-0 z-10 bg-background/55" />
        <img
          src="/gym_hero_bg.png"
          alt="Gym planner hero"
          className="absolute inset-0 h-full w-full object-cover opacity-70"
        />
        <div className="relative z-20 mt-auto flex w-full max-w-lg flex-col items-start p-12 pb-20">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface)]/85 shadow-[var(--app-shadow-sm)] backdrop-blur-md">
            <span className="text-4xl font-semibold text-foreground">G</span>
          </div>
          <h1 className="mb-4 text-5xl font-semibold leading-[1.1] tracking-normal text-foreground">
            Elevate Your<br />Training Journey.
          </h1>
          <p className="max-w-sm text-lg font-medium text-muted-foreground">
            Track your progress, build routines, and achieve your fitness goals with our intelligent planner.
          </p>
        </div>
      </div>

      <div className="relative flex w-full flex-col bg-[var(--app-bg)] lg:w-1/2 lg:border-l lg:border-[var(--app-border)]">
        <button
          onClick={onBack}
          className="absolute left-8 top-8 z-50 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-normal text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowRight size={14} className="rotate-180" strokeWidth={2} />
          Back
        </button>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center p-6 sm:p-12">

          <div className="w-full space-y-10">
            <div>
              <div className="mb-4 inline-block rounded-[var(--app-radius-sm)] border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-1">
                <span className="text-[11px] font-semibold uppercase tracking-normal text-muted-foreground">
                  Secure Authentication
                </span>
              </div>
              <h2 className="mb-3 text-4xl font-semibold tracking-normal text-foreground">
                {isSignUp ? 'Create ' : 'Welcome '}
                <span>{isSignUp ? 'Account' : 'Back'}</span>
              </h2>
              <p className="text-[16px] font-medium text-muted-foreground">
                {isSignUp ? 'Sign up to start tracking your workouts.' : 'Sign in to access your training data.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mb-2 flex items-start gap-3 rounded-[var(--app-radius-md)] border border-destructive/20 bg-destructive/10 p-4 text-destructive">
                      <AlertCircle size={18} className="shrink-0 mt-0.5" />
                      <p className="text-sm font-medium">{error}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[12px] font-semibold uppercase tracking-normal text-muted-foreground">Email Address</Label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                      <Mail size={18} className="text-muted-foreground" strokeWidth={2} />
                    </div>
                    <Input
                      id="email"
                      type="email"
                      placeholder="athlete@gymplanner.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-[56px] rounded-[var(--app-radius-md)] border-[var(--app-border)] bg-[var(--app-surface)] pl-12 pr-6 text-[15px] font-medium text-foreground transition-colors focus-visible:border-[var(--app-border-strong)] focus-visible:bg-[var(--app-surface-raised)] focus-visible:ring-0"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[12px] font-semibold uppercase tracking-normal text-muted-foreground">Password</Label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                      <Lock size={18} className="text-muted-foreground" strokeWidth={2} />
                    </div>
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-[56px] rounded-[var(--app-radius-md)] border-[var(--app-border)] bg-[var(--app-surface)] pl-12 pr-12 text-[15px] font-medium text-foreground transition-colors focus-visible:border-[var(--app-border-strong)] focus-visible:bg-[var(--app-surface-raised)] focus-visible:ring-0"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {showPassword ? <EyeOff size={20} strokeWidth={1.5} /> : <Eye size={20} strokeWidth={1.5} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-[56px] w-full rounded-[var(--app-radius-md)] border-none bg-foreground text-[16px] font-semibold text-background transition-colors hover:bg-foreground/90"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {isSignUp ? 'Creating...' : 'Authenticating...'}
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      {isSignUp ? 'Create Account' : 'Sign In'}
                      <ArrowRight size={20} />
                    </span>
                  )}
                </Button>
              </div>

              {/* Toggle Sign Up / Sign In */}
              <div className="mt-6 border-t border-[var(--app-border)] pt-6 text-center">
                <span className="mr-2 text-[14px] font-medium text-muted-foreground">
                  {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                </span>
                <button
                  type="button"
                  onClick={toggleMode}
                  className="text-[14px] font-semibold text-foreground underline underline-offset-4 transition-colors hover:text-muted-foreground"
                >
                  {isSignUp ? 'Sign In' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
