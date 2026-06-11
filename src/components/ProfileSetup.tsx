import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { User, Mail } from 'lucide-react';
import WalletConnect from './WalletConnect';

export default function ProfileSetup({ address }: { address: string }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('http://localhost:8080/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, username, email }),
      });

      if (res.ok) {
        const data = await res.json();
        setUser({ address, username: data.username, email: data.email });
        alert('Profile created successfully!');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      <div>
        <label className="text-xs text-zinc-400">USERNAME</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 mt-1 focus:outline-none focus:border-white/30"
          placeholder="@yourname"
          required
        />
      </div>

      <div>
        <label className="text-xs text-zinc-400">EMAIL</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 mt-1 focus:outline-none focus:border-white/30"
          placeholder="you@example.com"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-2xl font-semibold disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Complete Profile →'}
      </button>
    </form>
  );
}