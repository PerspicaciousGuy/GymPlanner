import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2, LogIn, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

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
    <div className="flex min-h-screen bg-[#0A0A0A] w-full absolute inset-0 z-50 text-white font-inter">
      {/* Left side: Hero Image (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 relative bg-black items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/60 to-transparent" />
        <img
          src="/gym_hero_bg.png"
          alt="Gym planner hero"
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
        <div className="relative z-20 p-12 flex flex-col items-start w-full max-w-lg mt-auto pb-20">
          <div className="mb-6 flex items-center justify-center w-16 h-16 rounded-xl border border-white/10 bg-[#121212]/80 backdrop-blur-md">
            <span className="text-4xl font-lexend font-black text-white">G</span>
          </div>
          <h1 className="text-5xl font-lexend font-bold mb-4 leading-[1.1] tracking-tight">
            Elevate Your<br />Training Journey.
          </h1>
          <p className="text-[#c4c9ac] text-lg max-w-sm">
            Track your progress, build routines, and achieve your fitness goals with our intelligent planner.
          </p>
        </div>
      </div>

      {/* Right side: Auth Form */}
      <div className="w-full lg:w-1/2 flex flex-col relative bg-[#0A0A0A] lg:border-l lg:border-[#262626]">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="absolute top-8 left-8 z-50 flex items-center gap-2 text-slate-400 hover:text-white font-space text-[12px] uppercase tracking-widest transition-colors"
        >
          <ArrowRight size={14} className="rotate-180" strokeWidth={2} />
          Back
        </button>

        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 w-full max-w-md mx-auto">

          <div className="w-full space-y-10">
            {/* Header */}
            <div>
              <div className="inline-block px-3 py-1 mb-4 rounded border border-[#262626] bg-[#1C1C1C]">
                <span className="text-[11px] font-space text-[#CCFF00] tracking-widest uppercase font-medium">
                  Secure Authentication
                </span>
              </div>
              <h2 className="text-4xl font-lexend font-bold tracking-tight mb-3">
                {isSignUp ? 'Create ' : 'Welcome '}
                <span className="text-white">{isSignUp ? 'Account' : 'Back'}</span>
              </h2>
              <p className="text-[#8e9379] font-medium text-[16px]">
                {isSignUp ? 'Sign up to start tracking your workouts.' : 'Sign in to access your training data.'}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 bg-[#93000a]/20 border border-[#93000a] rounded-lg flex items-start gap-3 text-[#ffb4ab] mb-2">
                      <AlertCircle size={18} className="shrink-0 mt-0.5" />
                      <p className="text-sm font-medium">{error}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-5">
                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[12px] font-space uppercase tracking-widest text-slate-400">Email Address</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail size={18} className="text-slate-500" strokeWidth={2} />
                    </div>
                    <Input
                      id="email"
                      type="email"
                      placeholder="athlete@gymplanner.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-[56px] rounded-lg border-[#262626] bg-[#121212] text-white focus:bg-[#1C1C1C] focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00] transition-all font-inter pl-12 pr-6 text-[15px]"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[12px] font-space uppercase tracking-widest text-slate-400">Password</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock size={18} className="text-slate-500" strokeWidth={2} />
                    </div>
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-[56px] rounded-lg border-[#262626] bg-[#121212] text-white focus:bg-[#1C1C1C] focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00] transition-all font-inter pl-12 pr-12 text-[15px] tracking-widest placeholder:tracking-widest"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-white transition-colors"
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
                  className="w-full h-[56px] bg-[#CCFF00] hover:bg-[#abd600] text-[#0A0A0A] rounded-lg font-lexend font-bold text-[16px] transition-all active:scale-[0.98] border-none"
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
              <div className="text-center pt-6 mt-6 border-t border-[#262626]">
                <span className="text-[14px] font-inter text-[#8e9379] mr-2">
                  {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                </span>
                <button
                  type="button"
                  onClick={toggleMode}
                  className="text-[14px] font-inter font-semibold text-[#FF5C00] hover:text-[#ffb59a] transition-colors underline underline-offset-4"
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
