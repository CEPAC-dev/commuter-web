'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

// Mock credentials for the mockup
const MOCK_EMAIL = 'ahmed@commuter.eg';
const MOCK_PASSWORD = 'driver123';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  function validate() {
    const e: typeof errors = {};
    if (!email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email address';
    if (!password) e.password = 'Password is required';
    else if (password.length < 6) e.password = 'Password must be at least 6 characters';
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);

    // Simulate API call
    await new Promise((res) => setTimeout(res, 1200));

    if (email === MOCK_EMAIL && password === MOCK_PASSWORD) {
      toast.success('Welcome back, Ahmed!');
      await new Promise((res) => setTimeout(res, 600));
      router.replace('/driver/requests');
    } else {
      setLoading(false);
      toast.error('Invalid email or password');
      setErrors({ password: 'Invalid email or password' });
    }
  }

  return (
    <div className="min-h-screen bg-surface flex">
      <Toaster position="top-right" />

      {/* Left panel — branding (hidden on mobile) */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-primary px-12 py-10">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-md bg-secondary flex items-center justify-center">
            <span className="text-primary font-black text-base">C</span>
          </div>
          <span className="text-white font-bold text-xl tracking-wide">commuter</span>
        </div>

        {/* Tagline block */}
        <div className="space-y-4">
          <h1 className="text-white text-4xl font-black leading-tight">
            Drive smarter.<br />
            <span className="text-secondary">Earn better.</span>
          </h1>
          <p className="text-white/60 text-base leading-relaxed max-w-sm">
            Join Egypt&apos;s leading ride-pooling platform. Connect with weekly cycle passengers and grow your income on your own schedule.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { value: '12,000+', label: 'Active drivers' },
            { value: '10,000 EGP', label: 'Avg. monthly earn' },
          ].map((s) => (
            <div key={s.label} className="bg-white/5 rounded-lg px-4 py-3">
              <p className="text-secondary font-bold text-lg">{s.value}</p>
              <p className="text-white/50 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <p className="text-white/30 text-xs">© {new Date().getFullYear()} Commuter. Egypt Standard Time (UTC+2)</p>
      </div>

      {/* Right panel — sign-in form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center">
            <span className="text-primary font-black text-sm">C</span>
          </div>
          <span className="text-primary font-bold text-lg tracking-wide">commuter</span>
        </div>

        <div className="w-full max-w-[400px] space-y-8">
          {/* Header */}
          <div>
            <h2 className="text-2xl font-bold text-primary">Driver sign in</h2>
            <p className="text-text-muted text-sm mt-1">Enter your credentials to access the driver portal</p>
          </div>

          {/* Mock hint */}
          <div className="bg-secondary-lt border border-secondary/30 rounded-md px-4 py-3 text-xs text-text-muted space-y-0.5">
            <p><span className="font-semibold text-primary">Demo email:</span> ahmed@commuter.eg</p>
            <p><span className="font-semibold text-primary">Demo password:</span> driver123</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-primary">
                Email address
              </label>
              <div className={[
                'flex items-center border rounded-md overflow-hidden transition-colors focus-within:ring-2 focus-within:ring-secondary',
                errors.email ? 'border-danger' : 'border-gray-200',
              ].join(' ')}>
                <span className="px-3 py-2.5 bg-secondary-lt border-r border-gray-200 text-text-muted">
                  <Mail size={16} aria-hidden="true" />
                </span>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }}
                  placeholder="you@commuter.eg"
                  className="flex-1 px-3 py-2.5 text-sm text-primary outline-none bg-white placeholder:text-text-muted/50"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
              </div>
              {errors.email && (
                <p id="email-error" role="alert" className="text-xs text-danger">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-primary">
                  Password
                </label>
                <button
                  type="button"
                  className="text-xs text-secondary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded"
                  onClick={() => toast('Password reset coming soon')}
                >
                  Forgot password?
                </button>
              </div>
              <div className={[
                'flex items-center border rounded-md overflow-hidden transition-colors focus-within:ring-2 focus-within:ring-secondary',
                errors.password ? 'border-danger' : 'border-gray-200',
              ].join(' ')}>
                <span className="px-3 py-2.5 bg-secondary-lt border-r border-gray-200 text-text-muted">
                  <Lock size={16} aria-hidden="true" />
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); }}
                  placeholder="••••••••"
                  className="flex-1 px-3 py-2.5 text-sm text-primary outline-none bg-white placeholder:text-text-muted/50"
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="px-3 text-text-muted hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" role="alert" className="text-xs text-danger">{errors.password}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-md bg-secondary text-primary font-semibold text-sm hover:bg-secondary/90 disabled:opacity-60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" aria-hidden="true" />
                  Signing in…
                </span>
              ) : 'Sign in'}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-xs text-text-muted">
            Not registered yet?{' '}
            <button
              type="button"
              className="text-secondary font-medium hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded"
              onClick={() => toast('Driver registration coming soon')}
            >
              Apply to become a driver
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
