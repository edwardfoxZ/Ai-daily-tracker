'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Wallet } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  address: string;
}

export default function ProfileModal({ isOpen, onClose, address }: ProfileModalProps) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setUser } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Username is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('http://localhost:8080/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          username: username.trim(),
          email: email.trim() || null,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save profile');
      }

      const data = await res.json();
      
      setUser({
        address: data.address,
        username: data.username,
        email: data.email,
      });

      alert('✅ Profile created successfully!');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-zinc-900 border border-white/10 rounded-3xl w-full max-w-md overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Complete Your Profile</h2>
                  <p className="text-sm text-zinc-400">Let's get to know you better</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-zinc-400 hover:text-white transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-zinc-500 font-medium">Wallet Address</label>
                <div className="flex items-center gap-3 bg-zinc-800/50 border border-white/10 rounded-2xl px-4 py-3">
                  <Wallet className="w-5 h-5 text-emerald-400" />
                  <p className="font-mono text-sm text-zinc-400 break-all">{address}</p>
                </div>
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest text-zinc-500 font-medium mb-1.5 block">
                  USERNAME <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="@yourusername"
                  className="w-full bg-zinc-800 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500 transition"
                  required
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest text-zinc-500 font-medium mb-1.5 block">
                  EMAIL (OPTIONAL)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-zinc-800 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500 transition"
                />
              </div>

              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || !username.trim()}
                className="w-full py-4 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 rounded-2xl font-semibold text-lg disabled:opacity-70 hover:brightness-110 transition-all duration-200 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>Saving Profile...</>
                ) : (
                  <>Complete Setup →</>
                )}
              </button>
            </form>

            <div className="p-6 text-center text-xs text-zinc-500 border-t border-white/10">
              Your data is stored securely on our servers
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}