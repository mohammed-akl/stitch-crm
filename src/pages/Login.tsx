import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      setError(loginError.message);
      setLoading(false);
    } else {
      navigate('/');
    }
  };

  return (
    <main className="flex-grow flex items-center justify-center p-6 bg-slate-50">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-8"
      >
        <header className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-blue-600 p-4 rounded-2xl shadow-lg">
              <Zap className="h-10 w-10 text-white fill-white" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Stitch CRM</h1>
            <p className="text-sm text-slate-500 mt-1">Manage your business leads efficiently</p>
          </div>
        </header>

        <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-1">
              <label 
                className="block text-sm font-medium text-slate-700" 
                htmlFor="email"
              >
                Email Address
              </label>
              <input 
                id="email"
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all text-base"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label 
                  className="block text-sm font-medium text-slate-700" 
                  htmlFor="password"
                >
                  Password
                </label>
                <button type="button" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                  Forgot?
                </button>
              </div>
              <input 
                id="password"
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all text-base"
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}

            <div className="pt-2">
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 active:scale-[0.98] transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </div>
          </form>
        </section>

        <footer className="text-center">
          <p className="text-sm text-slate-600">
            Don't have an account? <button className="text-blue-600 font-semibold hover:underline">Request Access</button>
          </p>
        </footer>
      </motion.div>
    </main>
  );
}
