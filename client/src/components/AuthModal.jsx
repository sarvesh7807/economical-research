import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { X, Mail, Lock, User, Chrome } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, mode = 'login' }) {
  const { login, signup, loginWithGoogle } = useAuth();
  const [isLogin, setIsLogin] = useState(mode === 'login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogle = async () => {
    setLoading(true);
    setError('');
    try {
      const user = await loginWithGoogle();
      onClose && onClose(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      let user;
      if (isLogin) {
        user = await login(email, password);
      } else {
        user = await signup(email, password, name);
      }
      onClose && onClose(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-fade-in">
      <div class="glass-card w-full max-w-md rounded-[2rem] p-8 relative shadow-2xl border border-white/20">
        <button 
          onClick={() => onClose && onClose()}
          class="absolute top-5 right-5 text-gray-500 hover:text-white bg-gray-100 dark:bg-white/10 rounded-full p-2 transition-all hover:bg-red-500"
        >
          <X size={20} />
        </button>
        
        <div class="text-center mb-8">
          <h2 class="font-display text-3xl font-black text-navy dark:text-white mb-2">
            {isLogin ? 'Welcome Back' : 'Join the Vanguard'}
          </h2>
          <p class="text-sm font-sans text-gray-500 dark:text-gray-400">
            Economical Research PRO
          </p>
        </div>

        {error && (
          <div class="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 p-3 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleEmail} class="space-y-4">
          {!isLogin && (
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User size={18} class="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                class="w-full pl-10 pr-4 py-3.5 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-navy dark:text-white text-sm"
              />
            </div>
          )}
          
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail size={18} class="text-gray-400" />
            </div>
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              class="w-full pl-10 pr-4 py-3.5 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-navy dark:text-white text-sm"
            />
          </div>

          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock size={18} class="text-gray-400" />
            </div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              class="w-full pl-10 pr-4 py-3.5 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-navy dark:text-white text-sm"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            class="w-full py-4 mt-4 bg-gradient-to-r from-navy to-primary dark:from-primary dark:to-accent-purple text-white font-bold rounded-xl shadow-lg hover:shadow-purple-glow hover:scale-[1.02] transition-all text-sm uppercase tracking-wider"
          >
            {loading ? 'Processing...' : isLogin ? 'Sign In →' : 'Create Account →'}
          </button>
        </form>

        <div class="my-6 flex items-center">
          <div class="flex-grow border-t border-gray-200 dark:border-white/10"></div>
          <span class="px-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Or</span>
          <div class="flex-grow border-t border-gray-200 dark:border-white/10"></div>
        </div>

        <button 
          onClick={handleGoogle} 
          disabled={loading}
          class="w-full py-3.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-navy dark:text-white font-bold rounded-xl flex items-center justify-center gap-3 hover:bg-gray-50 dark:hover:bg-white/10 transition-all group"
        >
          <Chrome size={20} class="text-blue-500 group-hover:scale-110 transition-transform" />
          <span class="text-sm">Continue with Google</span>
        </button>

        <p class="text-center mt-8 text-sm text-gray-500">
          {isLogin ? "New to the platform? " : "Already registered? "}
          <button 
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            class="text-primary dark:text-accent-neon font-bold hover:underline cursor-pointer"
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  );
}
