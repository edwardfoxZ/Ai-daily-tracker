import { useState } from 'react';
import { Mail, Lock, User, ArrowRight, Check } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function EmailAuth() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { setUser } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const endpoint = mode === 'signup' 
      ? '/api/auth/register' 
      : '/api/auth/login';

    try {
      const body = mode === 'signup' 
        ? { email, password, username } 
        : { email, password };

      const res = await fetch(`http://localhost:8080${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      setSuccess(mode === 'signup' ? 'Account created successfully!' : 'Login successful! 🎉');

      // Update auth store
      setUser({
        address: '', 
        username: data.username || username || email.split('@')[0],
        email: email,
      });

      // Important: Do NOT use window.location.reload()
      // Just let the parent App.tsx detect the state change

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8">
      <h2 className="text-3xl text-white font-bold text-center mb-2">
        {mode === 'login' ? 'Welcome Back' : 'Create Account'}
      </h2>
      <p className="text-zinc-400 text-center mb-8">
        {mode === 'login' 
          ? 'Sign in to continue' 
          : 'Join ESTHER today'}
      </p>

      {/* Toggle Login / Signup */}
      <div className="flex bg-zinc-800 rounded-2xl p-1 mb-8">
        <button
          onClick={() => setMode('login')}
          className={`flex-1 py-3 rounded-xl font-medium transition ${
            mode === 'login' ? 'bg-white text-black' : 'text-zinc-400'
          }`}
        >
          Login
        </button>
        <button
          onClick={() => setMode('signup')}
          className={`flex-1 py-3 rounded-xl font-medium transition ${
            mode === 'signup' ? 'bg-white text-black' : 'text-zinc-400'
          }`}
        >
          Sign Up
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {mode === 'signup' && (
          <div>
            <label className="text-xs uppercase tracking-widest text-zinc-500 mb-2 block">
              USERNAME
            </label>
            <div className="relative">
              <User className="absolute left-4 top-4 text-zinc-500" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="yourusername"
                className="w-full bg-zinc-800 border border-white/10 rounded-2xl pl-11 py-4 focus:border-violet-500 outline-none"
                required
              />
            </div>
          </div>
        )}

        <div>
          <label className="text-xs uppercase tracking-widest text-zinc-500 mb-2 block">
            EMAIL ADDRESS
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-4 text-zinc-500" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full text-white bg-zinc-800 border border-white/10 rounded-2xl pl-11 py-4 focus:border-violet-500 outline-none"
              required
            />
          </div>
        </div>

        <div>
          <label className="text-xs uppercase tracking-widest text-zinc-500 mb-2 block">
            PASSWORD
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-4 text-zinc-500" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full text-white bg-zinc-800 border border-white/10 rounded-2xl pl-11 py-4 focus:border-violet-500 outline-none"
              required
            />
          </div>
        </div>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        {success && (
          <p className="text-emerald-500 text-sm text-center flex items-center justify-center gap-2">
            <Check className="w-4 h-4" /> {success}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-2xl font-semibold text-lg hover:brightness-110 transition flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {loading ? 'Processing...' : 
            mode === 'login' ? 'Sign In' : 'Create Account'}
          <ArrowRight className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}