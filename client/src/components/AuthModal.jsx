import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { X, Mail, Lock, User, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export default function AuthModal({ isOpen, onClose }) {
  const { login, signup, loginWithGoogle, isFirebaseConfigured } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (isSignUp) {
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError("Password should be at least 6 characters.");
        setLoading(false);
        return;
      }
    }

    try {
      if (isSignUp) {
        await signup(email, password, displayName);
      } else {
        await login(email, password);
      }
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Google Sign-In failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm transition-all duration-300">
      <div class="bg-paper dark:bg-paper-cardDark border border-gold/40 max-w-md w-full rounded shadow-2xl relative overflow-hidden transition-all duration-200">
        {/* Double Gold Line Accents */}
        <div class="h-1 bg-gradient-to-r from-navy via-gold to-navy"></div>

        {/* Close button */}
        <button 
          onClick={onClose} 
          class="absolute top-4 right-4 text-gray-400 hover:text-navy dark:hover:text-gold transition-colors"
          title="Close Modal"
        >
          <X size={18} />
        </button>

        <div class="p-6 md:p-8">
          {/* Header */}
          <div class="text-center mb-6">
            <h2 class="font-serif text-2xl font-black text-navy dark:text-gold uppercase tracking-tight">
              {isSignUp ? 'Apply for Press Pass' : 'Editorial Log In'}
            </h2>
            <p class="text-[11px] font-sans text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">
              {isSignUp ? 'Create your research account' : 'Access saved reports & search wire'}
            </p>
          </div>

          {/* Database Mode Warning Banner */}
          <div class="mb-4 py-1.5 px-3 bg-navy/5 dark:bg-paper-dark border border-paper-border dark:border-paper-borderDark text-[10px] text-gray-500 dark:text-gray-400 flex items-center justify-between rounded font-medium">
            <span class="flex items-center gap-1">
              <ShieldCheck size={11} class="text-gold" />
              <span>Auth Core:</span>
            </span>
            <span class="font-semibold text-navy dark:text-gold">
              {isFirebaseConfigured ? 'Firebase Service Active' : 'Offline Sandbox Simulator'}
            </span>
          </div>

          {/* Error Alert */}
          {error && (
            <div class="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-semibold rounded flex items-start gap-1.5">
              <AlertCircle size={14} class="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Main Form */}
          <form onSubmit={handleSubmit} class="space-y-4">
            {isSignUp && (
              <div>
                <label class="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <div class="relative flex items-center">
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    class="w-full pl-8 pr-3 py-2 text-xs rounded bg-white dark:bg-paper-dark border border-paper-border dark:border-paper-borderDark text-navy dark:text-white focus:outline-none focus:ring-1 focus:ring-gold"
                  />
                  <User size={13} class="absolute left-2.5 text-gray-400" />
                </div>
              </div>
            )}

            <div>
              <label class="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div class="relative flex items-center">
                <input
                  type="email"
                  required
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  class="w-full pl-8 pr-3 py-2 text-xs rounded bg-white dark:bg-paper-dark border border-paper-border dark:border-paper-borderDark text-navy dark:text-white focus:outline-none focus:ring-1 focus:ring-gold"
                />
                <Mail size={13} class="absolute left-2.5 text-gray-400" />
              </div>
            </div>

            <div>
              <label class="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                Password
              </label>
              <div class="relative flex items-center">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  class="w-full pl-8 pr-3 py-2 text-xs rounded bg-white dark:bg-paper-dark border border-paper-border dark:border-paper-borderDark text-navy dark:text-white focus:outline-none focus:ring-1 focus:ring-gold"
                />
                <Lock size={13} class="absolute left-2.5 text-gray-400" />
              </div>
            </div>

            {isSignUp && (
              <div>
                <label class="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                  Confirm Password
                </label>
                <div class="relative flex items-center">
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    class="w-full pl-8 pr-3 py-2 text-xs rounded bg-white dark:bg-paper-dark border border-paper-border dark:border-paper-borderDark text-navy dark:text-white focus:outline-none focus:ring-1 focus:ring-gold"
                  />
                  <Lock size={13} class="absolute left-2.5 text-gray-400" />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              class="w-full py-2.5 bg-navy hover:bg-navy-light text-gold font-bold text-xs uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-1.5"
            >
              <span>{isSignUp ? 'Create Press Account' : 'Authenticate Credentials'}</span>
              <ArrowRight size={13} />
            </button>
          </form>

          {/* Or Divider */}
          <div class="my-4 flex items-center justify-between text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            <span class="w-[40%] h-[1px] bg-paper-border dark:bg-paper-borderDark"></span>
            <span>Or</span>
            <span class="w-[40%] h-[1px] bg-paper-border dark:bg-paper-borderDark"></span>
          </div>

          {/* Google Login button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            type="button"
            class="w-full py-2 px-3 border border-paper-border dark:border-paper-borderDark bg-white dark:bg-paper-dark hover:bg-gray-50 dark:hover:bg-navy-light/20 text-navy dark:text-white text-xs font-bold rounded flex items-center justify-center gap-2 transition-colors"
          >
            {/* Simple Inline Google Logo */}
            <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.51 0-6.38-2.87-6.38-6.38s2.87-6.38 6.38-6.38c1.54 0 2.946.548 4.043 1.464l3.14-3.14C19.123 2.146 15.932 1 12.24 1 5.866 1 .7 6.166.7 12.54s5.166 11.54 11.54 11.54c6.332 0 11.587-5.12 11.587-11.54 0-.742-.08-1.48-.24-2.255H12.24z"
              />
            </svg>
            <span>Google Account Sign-In</span>
          </button>

          {/* Toggle Login/SignUp link */}
          <div class="mt-6 text-center text-xs text-gray-500 dark:text-gray-400 font-medium">
            {isSignUp ? 'Already have an active account?' : 'Need a new credential set?'}
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
              class="ml-1 text-navy dark:text-gold hover:underline font-bold"
            >
              {isSignUp ? 'Log in here' : 'Sign up here'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
