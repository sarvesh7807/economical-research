import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { X, Mail, Lock, User, AlertCircle, ArrowRight } from 'lucide-react';

export default function AuthModal({ isOpen, onClose }) {
  const { login, signup, loginWithGoogle, loginWithApple } = useAuth();
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

  const handleAppleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithApple();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Apple Sign-In failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm transition-all duration-300">
      <div className="bg-paper dark:bg-paper-cardDark border border-gold/40 max-w-md w-full rounded shadow-2xl relative overflow-hidden transition-all duration-200">
        {/* Double Gold Line Accents */}
        <div className="h-1 bg-gradient-to-r from-navy via-gold to-navy"></div>

        {/* Close button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-navy dark:hover:text-gold transition-colors"
          title="Close Modal"
        >
          <X size={18} />
        </button>

        <div className="p-6 md:p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="font-serif text-2xl font-black text-navy dark:text-gold uppercase tracking-tight">
              Welcome to Economical Research
            </h2>
            <p className="text-[11px] font-sans text-gray-550 dark:text-gray-400 uppercase tracking-widest mt-1.5 font-bold">
              {isSignUp ? 'Apply for Press Pass & Credentials' : 'Access Saved Intelligence & Wire Feeds'}
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-semibold rounded flex items-start gap-1.5">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-3 mb-4">
            {/* Google Login button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              type="button"
              className="w-full py-2.5 px-4 border border-gray-200 dark:border-paper-borderDark bg-white dark:bg-paper-dark hover:bg-gray-50 dark:hover:bg-navy-light/20 text-navy dark:text-white text-xs font-bold rounded flex items-center justify-center gap-2.5 transition-colors"
            >
              {/* Colored Google Logo */}
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.51 0-6.38-2.87-6.38-6.38s2.87-6.38 6.38-6.38c1.54 0 2.946.548 4.043 1.464l3.14-3.14C19.123 2.146 15.932 1 12.24 1 5.866 1 .7 6.166.7 12.54s5.166 11.54 11.54 11.54c6.332 0 11.587-5.12 11.587-11.54 0-.742-.08-1.48-.24-2.255H12.24z"
                />
              </svg>
              <span>Sign In with Google</span>
            </button>

            {/* Apple Login button */}
            <button
              onClick={handleAppleSignIn}
              disabled={loading}
              type="button"
              className="w-full py-2.5 px-4 bg-black hover:bg-gray-900 text-white text-xs font-bold rounded flex items-center justify-center gap-2.5 transition-colors border border-gray-800"
            >
              {/* White Apple Logo SVG */}
              <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.01 2.96 1.12.09 2.27-.57 2.95-1.39z" />
              </svg>
              <span>Sign In with Apple</span>
            </button>
          </div>

          {/* OR Divider */}
          <div className="my-4 flex items-center justify-between text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            <span className="w-[42%] h-[1px] bg-paper-border dark:bg-paper-borderDark"></span>
            <span>OR</span>
            <span className="w-[42%] h-[1px] bg-paper-border dark:bg-paper-borderDark"></span>
          </div>

          {/* Main Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs rounded bg-white dark:bg-paper-dark border border-paper-border dark:border-paper-borderDark text-navy dark:text-white focus:outline-none focus:ring-1 focus:ring-gold"
                  />
                  <User size={13} className="absolute left-2.5 text-gray-400" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative flex items-center">
                <input
                  type="email"
                  required
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs rounded bg-white dark:bg-paper-dark border border-paper-border dark:border-paper-borderDark text-navy dark:text-white focus:outline-none focus:ring-1 focus:ring-gold"
                />
                <Mail size={13} className="absolute left-2.5 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative flex items-center">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs rounded bg-white dark:bg-paper-dark border border-paper-border dark:border-paper-borderDark text-navy dark:text-white focus:outline-none focus:ring-1 focus:ring-gold"
                />
                <Lock size={13} className="absolute left-2.5 text-gray-400" />
              </div>
            </div>

            {isSignUp && (
              <div>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                  Confirm Password
                </label>
                <div className="relative flex items-center">
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs rounded bg-white dark:bg-paper-dark border border-paper-border dark:border-paper-borderDark text-navy dark:text-white focus:outline-none focus:ring-1 focus:ring-gold"
                  />
                  <Lock size={13} className="absolute left-2.5 text-gray-400" />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-navy hover:bg-navy-light text-gold font-bold text-xs uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-1.5"
            >
              <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
              <ArrowRight size={13} />
            </button>
          </form>

          {/* Toggle Login/SignUp link */}
          <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400 font-medium">
            {isSignUp ? 'Already have an active account?' : 'Need a new credential set?'}
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
              className="ml-1 text-navy dark:text-gold hover:underline font-bold"
            >
              {isSignUp ? 'Sign in here' : 'Create Account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
