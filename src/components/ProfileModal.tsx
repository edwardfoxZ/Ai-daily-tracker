import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Camera, Check } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  address?: string;
  isEditMode?: boolean;
}

export default function ProfileModal({ 
  isOpen, 
  onClose, 
  address = '', 
  isEditMode = false 
}: ProfileModalProps) {

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { setUser, user } = useAuthStore();

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setEmail(user.email || '');
      setAvatarUrl(user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username || Date.now()}`);
    } else if (address) {
      setAvatarUrl(`https://api.dicebear.com/7.x/avataaars/svg?seed=${address}`);
    }
  }, [user, address]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatarUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const randomizeAvatar = () => {
    const seed = Date.now().toString();
    setAvatarUrl(`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`);
  };

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
          address: address.toLowerCase(),
          username: username.trim().toLowerCase(),
          email: email.trim() || null,
          avatarUrl: avatarUrl,
        }),
      });

      if (!res.ok) throw new Error('Failed to save profile');

      const data = await res.json();

      setUser({
        address: data.address,
        username: data.username,
        email: data.email,
        avatarUrl: data.avatarUrl || avatarUrl,
      });

      setSuccess(true);
      setTimeout(() => onClose(), 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-zinc-900 border border-white/10 rounded-3xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-2xl font-bold">{isEditMode ? "Edit Profile" : "Complete Profile"}</h2>
              <button onClick={onClose}><X className="w-6 h-6" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-8">
              {/* Avatar */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="w-28 h-28 rounded-2xl object-cover border-4 border-zinc-800"
                  />
                  <label className="absolute bottom-1 right-1 bg-black/70 hover:bg-black p-2 rounded-full cursor-pointer">
                    <Camera className="w-4 h-4" />
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                </div>
                <button
                  type="button"
                  onClick={randomizeAvatar}
                  className="mt-3 text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1"
                >
                  🎲 Randomize Avatar
                </button>
              </div>

              {/* Username */}
              <div>
                <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-2">
                  USERNAME <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-zinc-800 border border-white/10 rounded-2xl px-5 py-4 focus:border-violet-500"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-2">
                  EMAIL
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-800 border border-white/10 rounded-2xl px-5 py-4 focus:border-violet-500"
                />
              </div>

              {error && <p className="text-red-500 text-center">{error}</p>}
              {success && <p className="text-emerald-500 text-center flex justify-center gap-2"><Check className="w-4 h-4" /> Saved successfully!</p>}

              <button
                type="submit"
                disabled={loading || !username.trim()}
                className="w-full py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-2xl font-semibold disabled:opacity-70"
              >
                {loading ? 'Saving...' : isEditMode ? 'Save Changes' : 'Complete Profile'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}