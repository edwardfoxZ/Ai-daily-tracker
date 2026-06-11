import { useState } from 'react';
import { useConnect, useAccount } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { Wallet, Mail, ChevronRight } from 'lucide-react';
import ProfileModal from './ProfileModal';
import EmailAuth from './EmailAuth';

const walletOptions = [
  {
    name: "MetaMask",
    icon: "🦊",
    connector: injected({ target: 'metaMask' }),
    description: "Most popular browser wallet",
  },
  {
    name: "Trust Wallet",
    icon: "🛡️",
    connector: injected({ target: 'trust' }),
    description: "Mobile & Extension Wallet",
  },
  {
    name: "Other Wallets",
    icon: "🌐",
    connector: injected(),
    description: "Coinbase, Rainbow, etc.",
  },
];

export default function WalletConnect() {
  const { connect } = useConnect();
  const { address, isConnected } = useAccount();
  const [authMode, setAuthMode] = useState<'wallet' | 'email'>('wallet');
  const [showProfileModal, setShowProfileModal] = useState(false);

  const handleWalletConnect = async (option: any) => {
    try {
      await connect({ connector: option.connector });
    } catch (error) {
      console.error("Wallet connection failed:", error);
      alert("Failed to connect wallet. Please try again.");
    }
  };

  // Auto open profile modal after wallet connects
  if (isConnected && address && !showProfileModal) {
    setShowProfileModal(true);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-black to-zinc-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-6xl font-bold tracking-tighter bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            ESTHER
          </h1>
          <p className="text-zinc-400 mt-3 text-lg">AI Daily Routine</p>
        </div>

        {/* Auth Mode Tabs */}
        <div className="flex bg-zinc-900 rounded-2xl p-1 mb-8 border border-white/10">
          <button
            onClick={() => setAuthMode('wallet')}
            className={`flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
              authMode === 'wallet' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Wallet className="w-5 h-5" />
            Wallet
          </button>
          <button
            onClick={() => setAuthMode('email')}
            className={`flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
              authMode === 'email' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Mail className="w-5 h-5" />
            Email
          </button>
        </div>

        {/* Wallet Options */}
        {authMode === 'wallet' ? (
          <div className="space-y-3">
            {walletOptions.map((wallet, index) => (
              <button
                key={index}
                onClick={() => handleWalletConnect(wallet)}
                className="w-full flex items-center justify-between p-5 bg-zinc-900 hover:bg-zinc-800 border border-white/10 rounded-2xl transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{wallet.icon}</div>
                  <div className="text-left">
                    <p className="font-semibold text-white text-lg">{wallet.name}</p>
                    <p className="text-sm text-zinc-400">{wallet.description}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-white transition" />
              </button>
            ))}
          </div>
        ) : (
          <EmailAuth />
        )}
      </div>

      {/* Profile Modal for Wallet Signup */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        address={address || ''}
      />
    </div>
  );
}