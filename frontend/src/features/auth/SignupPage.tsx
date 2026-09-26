import { useState } from 'react';
import {
  Satellite,
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Loader,
  Globe2,
} from 'lucide-react';
import { loginUser } from '../../services/authService';

interface SignupPageProps {
  onSuccess: () => void;
  onNavigateLogin: () => void;
}

export function SignupPage({ onSuccess, onNavigateLogin }: SignupPageProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');

  const validateForm = (): boolean => {
    let valid = true;
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setGeneralError('');

    if (!fullName.trim()) {
      setNameError('Full name is required.');
      valid = false;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError('Email address is required.');
      valid = false;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        setEmailError('Please enter a valid institutional email.');
        valid = false;
      }
    }

    if (!password) {
      setPasswordError('Password cannot be empty.');
      valid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      valid = false;
    }

    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || loading) return;

    setLoading(true);
    setGeneralError('');

    try {
      const response = await loginUser({ email, password, rememberMe: true });
      if (response.success) {
        onSuccess();
      } else {
        setGeneralError(response.error || 'Account creation failed. Please try again.');
      }
    } catch {
      setGeneralError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-black text-white font-sans overflow-x-hidden flex flex-col justify-between select-none">
      {/* ════════════════════════════════════════════════════════
          CINEMATIC SPACEX-STYLE EARTH ORBIT BACKGROUND
      ════════════════════════════════════════════════════════ */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{
          backgroundImage: `url('/spacex_earth_cinematic.jpg')`,
        }}
      />

      {/* Atmospheric Gradient Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 75% 35%, transparent 20%, rgba(0,0,0,0.65) 65%, rgba(0,0,0,0.92) 100%), linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.85) 100%)',
        }}
      />

      {/* ════════════════════════════════════════════════════════
          TOP AEROSPACE WATERMARK BAR (ISRO BRANDING)
      ════════════════════════════════════════════════════════ */}
      <header className="relative z-30 flex items-center justify-between px-6 md:px-12 py-5 border-b border-white/10 backdrop-blur-md bg-black/40">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-white/95 p-1 flex items-center justify-center shadow-sm border border-white/30">
            <img src="/isro_logo.png" alt="ISRO Logo" className="h-full w-full object-contain" />
          </div>
          <div>
            <div className="text-xs sm:text-sm font-bold tracking-[0.16em] uppercase text-white font-mono">
              Indian Space Research Organisation
            </div>
            <div className="text-[10px] text-zinc-400 font-mono tracking-wider">
              Department of Space · Government of India
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#C29B53]/15 border border-[#C29B53]/30 flex items-center justify-center">
            <Satellite size={15} className="text-[#C29B53]" />
          </div>
          <span className="text-sm font-bold tracking-[0.18em] uppercase text-white font-mono">
            SATQUERY <span className="text-[#C29B53]">AI</span>
          </span>
        </div>
      </header>

      {/* ════════════════════════════════════════════════════════
          MAIN VIEWPORT
      ════════════════════════════════════════════════════════ */}
      <main className="relative z-20 flex-1 flex flex-col lg:flex-row items-center justify-between px-6 md:px-12 lg:px-16 py-8 lg:py-12 gap-12 max-w-7xl mx-auto w-full">
        {/* LEFT COLUMN — SATQUERY AI HERO */}
        <div className="flex-1 max-w-2xl text-left">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tight text-white leading-[1.05] font-sans">
            SatQuery <span className="text-[#C29B53]">AI</span>
          </h1>

          <p className="mt-6 text-2xl sm:text-3xl lg:text-4xl text-zinc-100 font-light tracking-tight leading-tight">
            Intelligent Earth Observation, Simplified.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3 text-xs sm:text-sm font-mono tracking-[0.25em] uppercase text-[#C29B53] font-semibold">
            <span>Analyze</span>
            <span className="text-zinc-600">•</span>
            <span>Detect</span>
            <span className="text-zinc-600">•</span>
            <span>Understand</span>
            <span className="text-zinc-600">•</span>
            <span>Discover</span>
          </div>
        </div>

        {/* RIGHT COLUMN — SIGNUP FORM */}
        <div className="w-full lg:w-[440px] shrink-0">
          <div className="relative rounded-2xl p-7 md:p-8 backdrop-blur-2xl bg-black/60 border border-white/15 shadow-[0_20px_80px_rgba(0,0,0,0.85)]">
            <div className="flex items-start justify-between mb-6 text-left">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white font-sans">
                  Request Access
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Create a SatQuery AI researcher account
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center border border-white/20 shrink-0 shadow-sm">
                <img src="/isro_logo.png" alt="ISRO" className="h-full w-full object-contain" />
              </div>
            </div>

            {generalError && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/50 border border-red-500/40 text-red-300 text-xs text-left font-medium flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0 text-red-400" />
                <span>{generalError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4 text-left">
              {/* Full Name */}
              <div>
                <label className="block text-[11px] font-mono font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                    <UserIcon size={15} />
                  </div>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (nameError) setNameError('');
                    }}
                    placeholder="Dr. Vikram Sarabhai"
                    className={`
                      w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl outline-none transition-all
                      bg-white/[0.05] text-white placeholder:text-zinc-500 font-mono
                      ${
                        nameError
                          ? 'border border-red-500'
                          : 'border border-white/15 focus:border-[#C29B53] focus:bg-white/[0.08]'
                      }
                    `}
                  />
                </div>
                {nameError && (
                  <p className="text-[11px] text-red-400 mt-1 font-mono">{nameError}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-[11px] font-mono font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                  Institutional Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                    <Mail size={15} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError('');
                    }}
                    placeholder="researcher@isro.gov.in"
                    className={`
                      w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl outline-none transition-all
                      bg-white/[0.05] text-white placeholder:text-zinc-500 font-mono
                      ${
                        emailError
                          ? 'border border-red-500'
                          : 'border border-white/15 focus:border-[#C29B53] focus:bg-white/[0.08]'
                      }
                    `}
                  />
                </div>
                {emailError && (
                  <p className="text-[11px] text-red-400 mt-1 font-mono">{emailError}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-[11px] font-mono font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                    <Lock size={15} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) setPasswordError('');
                    }}
                    placeholder="Minimum 6 characters"
                    className={`
                      w-full pl-10 pr-10 py-2.5 text-sm rounded-xl outline-none transition-all
                      bg-white/[0.05] text-white placeholder:text-zinc-500 font-mono
                      ${
                        passwordError
                          ? 'border border-red-500'
                          : 'border border-white/15 focus:border-[#C29B53] focus:bg-white/[0.08]'
                      }
                    `}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-[11px] text-red-400 mt-1 font-mono">{passwordError}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`
                  w-full py-3.5 px-4 rounded-xl text-xs md:text-sm font-bold uppercase tracking-[0.16em] transition-all font-mono
                  flex items-center justify-center gap-2 cursor-pointer shadow-sm mt-2
                  ${
                    loading
                      ? 'bg-[#C29B53]/50 text-black cursor-not-allowed'
                      : 'bg-[#C29B53] hover:bg-[#CCA563]  text-black active:scale-[0.99]'
                  }
                `}
              >
                {loading ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    <span>Processing Request…</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* Bottom Login Navigation */}
            <div className="mt-6 pt-4 border-t border-white/10 text-center text-xs text-zinc-400">
              <span>Already have credentials? </span>
              <button
                type="button"
                onClick={onNavigateLogin}
                className="text-[#C29B53] hover:underline font-semibold font-mono cursor-pointer"
              >
                Sign in
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* ════════════════════════════════════════════════════════
          BOTTOM MINIMAL FOOTER
      ════════════════════════════════════════════════════════ */}
      <footer className="relative z-30 px-6 md:px-12 py-4 border-t border-white/10 backdrop-blur-md bg-black/40 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-zinc-400 gap-2">
        <div className="flex items-center gap-2">
          <Globe2 size={13} className="text-[#C29B53]" />
          <span>SatQuery AI · Intelligent Earth Observation Platform</span>
        </div>
        <div className="flex items-center gap-3">
          <span>ISRO Satellite Services</span>
          <span className="text-zinc-600">|</span>
          <span>Earth Observation Wing</span>
        </div>
      </footer>
    </div>
  );
}
