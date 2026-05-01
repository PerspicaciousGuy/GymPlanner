import { useState } from 'react';
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2, LogIn, Mail, Lock, Eye, EyeOff, ArrowRight, X } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

export default function LoginDialog({ open, onOpenChange, authState }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

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
      onOpenChange(false);
      // Reset form
      setEmail('');
      setPassword('');
      setIsSignUp(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden bg-[#f0f2f5] [&>button]:hidden">
        {/* Top Header Section */}
        <div className="relative bg-[#161a2b] pt-10 px-10 pb-20 text-white">
          {/* Subtle background glow/gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#161a2b] via-[#1a1f35] to-[#252c4a]" />

          {/* Close button top right */}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-6 right-6 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors z-20"
          >
            <X size={16} className="text-white/70" />
          </button>

          {/* Icon top left */}
          <div className="relative z-10 w-16 h-16 bg-transparent border border-white/10 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
            <LogIn size={26} className="text-white" strokeWidth={1.5} />
          </div>

          <div className="relative z-10">
            <h2 className="text-4xl font-bold tracking-tight mb-2">
              {isSignUp ? 'Create ' : 'Welcome '}
              <span className="text-[#8470ff]">{isSignUp ? 'Account' : 'Back'}</span>
            </h2>
            <p className="text-slate-300 font-medium text-[15px]">
              {isSignUp ? 'Sign up to start tracking your workouts.' : 'Sign in to sync your workouts to the cloud.'}
            </p>
          </div>

          {/* Wavy bottom SVG */}
          <svg className="absolute bottom-0 left-0 w-full h-16 text-[#f0f2f5] translate-y-[2px]" viewBox="0 0 1440 320" preserveAspectRatio="none">
            <path fill="currentColor" fillOpacity="1" d="M0,224L60,202.7C120,181,240,139,360,133.3C480,128,600,160,720,176C840,192,960,192,1080,170.7C1200,149,1320,107,1380,85.3L1440,64L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"></path>
          </svg>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="px-10 pb-10 pt-2 space-y-6 relative z-10">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 text-red-600 mb-2">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <p className="text-xs font-semibold">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[11px] font-bold uppercase tracking-widest text-slate-500 ml-1">Email Address</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <Mail size={18} className="text-[#8470ff]" strokeWidth={2} />
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder="athlete@gymplanner.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-[60px] rounded-[1.2rem] border-slate-200 bg-white focus:border-[#8470ff] focus:ring-1 focus:ring-[#8470ff] transition-all font-medium pl-14 pr-6 text-[15px] shadow-sm"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[11px] font-bold uppercase tracking-widest text-slate-500 ml-1">Password</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <Lock size={18} className="text-[#8470ff]" strokeWidth={2} />
                </div>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-[60px] rounded-[1.2rem] border-slate-200 bg-white focus:border-[#8470ff] focus:ring-1 focus:ring-[#8470ff] transition-all font-medium pl-14 pr-12 text-[15px] tracking-widest placeholder:tracking-widest shadow-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} strokeWidth={1.5} /> : <Eye size={20} strokeWidth={1.5} />}
                </button>
              </div>
            </div>
          </div>

          {/* Remember me & Forgot Password */}
          {!isSignUp && (
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className={`w-[18px] h-[18px] rounded-[4px] border flex items-center justify-center transition-colors ${rememberMe ? 'bg-transparent border-[#8470ff]' : 'border-slate-300 bg-white group-hover:border-[#8470ff]'}`}>
                  {rememberMe && <svg viewBox="0 0 14 14" fill="none" className="w-3.5 h-3.5 text-[#8470ff]"><path d="M3 7.5L5.5 10L11 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                </div>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="text-[13px] font-medium text-slate-500">Remember me</span>
              </label>

              <button type="button" className="text-[13px] font-medium text-[#3b82f6] hover:text-[#8470ff] transition-colors">
                Forgot password?
              </button>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-[60px] bg-gradient-to-r from-[#4262dd] to-[#9254f1] hover:opacity-90 text-white rounded-[1.2rem] font-bold text-[16px] shadow-lg shadow-indigo-200/50 transition-all active:scale-[0.98] relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center justify-center w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {isSignUp ? 'Creating...' : 'Authenticating...'}
                  </>
                ) : (
                  <>
                    {isSignUp ? 'Create Account' : 'Sign In Now'}
                    <ArrowRight size={20} className="absolute right-6" />
                  </>
                )}
              </span>
            </Button>
          </div>

          {/* Divider */}
          <div className="flex items-center justify-center gap-4 pt-1">
            <div className="h-px bg-slate-200 w-16" />
            <span className="text-[13px] font-medium text-slate-400">or</span>
            <div className="h-px bg-slate-200 w-16" />
          </div>

          {/* Toggle Sign Up / Sign In */}
          <div className="text-center pb-2">
            <span className="text-[13px] font-medium text-slate-500 mr-1">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            </span>
            <button
              type="button"
              onClick={toggleMode}
              className="text-[13px] font-bold text-[#3b82f6] hover:text-[#8470ff] transition-colors"
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
