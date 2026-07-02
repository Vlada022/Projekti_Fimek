import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Database, Shield, Lock, User, Mail, ShieldAlert, Key, LogIn, UserPlus } from 'lucide-react';

interface LoginFormProps {
  onLoginSuccess: () => Promise<void>;
}

export default function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form Fields State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!username.trim() || !password.trim()) {
      setErrorMsg('Username and password are required fields.');
      return;
    }

    setIsLoading(true);
    try {
      if (activeTab === 'signin') {
        // Sign In Request
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: username.trim(),
            password: password.trim()
          })
        });

        const data = await res.json();
        if (res.ok) {
          await onLoginSuccess();
        } else {
          setErrorMsg(data.error || 'Authentication failed. Please verify credentials.');
        }
      } else {
        // Sign Up Request
        const res = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: username.trim(),
            password: password.trim(),
            display_name: displayName.trim() || username.trim(),
            email: email.trim() || null
          })
        });

        const data = await res.json();
        if (res.ok) {
          await onLoginSuccess();
        } else {
          setErrorMsg(data.error || 'Registration failed. Try a different username.');
        }
      }
    } catch (err) {
      console.error('Authentication Error:', err);
      setErrorMsg('Server connection lost. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Prefill helper for immediate testing
  const handlePrefill = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setErrorMsg(null);
    setActiveTab('signin');
  };

  return (
    <div id="login-container" className="min-h-screen bg-neutral-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans">
      {/* Background Decorative Mesh */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.07),transparent_50%)] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_left,rgba(59,130,246,0.05),transparent_50%)] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-2xl relative z-10"
      >
        {/* Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-3 bg-emerald-950/40 border border-emerald-800/40 rounded-xl mb-3 text-emerald-400">
            <Database className="w-8 h-8" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white tracking-tight">
            Login for Movie Review & Finder
          </h1>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-neutral-800 mb-6 bg-neutral-950 p-1.5 rounded-xl">
          <button
            onClick={() => {
              setActiveTab('signin');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'signin'
                ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700/50'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            Sign In
          </button>
          <button
            onClick={() => {
              setActiveTab('signup');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'signup'
                ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700/50'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Create Account
          </button>
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3.5 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-300 flex items-start gap-2.5"
          >
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </motion.div>
        )}

        {/* Custom Auth Form */}
        <form onSubmit={handleAuthSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider block">Username *</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-neutral-500">@</span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 text-white rounded-lg pl-8 pr-3 py-2 text-sm outline-none transition-colors"
                placeholder="username"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider block">Password *</label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 absolute left-3 top-3 text-neutral-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 text-white rounded-lg pl-9 pr-3 py-2 text-sm outline-none transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          {activeTab === 'signup' && (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider block">Display Name</label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 absolute left-3 top-3 text-neutral-500" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 text-white rounded-lg pl-9 pr-3 py-2 text-sm outline-none transition-colors"
                    placeholder="E.g. Elon Musk"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider block">Email Address</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-neutral-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 text-white rounded-lg pl-9 pr-3 py-2 text-sm outline-none transition-colors"
                    placeholder="name@email.com"
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors duration-200 cursor-pointer disabled:opacity-50 mt-2"
          >
            <Shield className="w-4 h-4" />
            {isLoading ? 'Verifying SQLite records...' : activeTab === 'signin' ? 'Sign In' : 'Register Account'}
          </button>
        </form>

        {/* Database Seed Presets for Instant Evaluation */}
        <div className="mt-6 pt-5 border-t border-neutral-800">
          <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-wider block mb-3">
            test accounts:
          </span>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <button
              onClick={() => handlePrefill('admin', 'admin123')}
              className="p-2.5 bg-neutral-950 border border-neutral-800 hover:border-emerald-500/40 rounded-xl text-left transition-all cursor-pointer group"
            >
              <span className="text-emerald-400 font-semibold block group-hover:text-emerald-300">@admin</span>
              <span className="text-[10px] text-neutral-500 block font-mono mt-0.5">pass: admin123</span>
            </button>
            <button
              onClick={() => handlePrefill('developer', 'devpass')}
              className="p-2.5 bg-neutral-950 border border-neutral-800 hover:border-emerald-500/40 rounded-xl text-left transition-all cursor-pointer group"
            >
              <span className="text-emerald-400 font-semibold block group-hover:text-emerald-300">@developer</span>
              <span className="text-[10px] text-neutral-500 block font-mono mt-0.5">pass: devpass</span>
            </button>
          </div>
        </div>
      </motion.div>


    </div>
  );
}
