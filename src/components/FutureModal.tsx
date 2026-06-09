import { motion } from 'framer-motion';

interface FutureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FutureModal({ isOpen, onClose }: FutureModalProps) {
  if (!isOpen) return null;

  const features = [
    'AI Coach voice mode',
    'Cross-device sync',
    'Wearable integration',
    'Community challenges',
    'Advanced analytics + predictions'
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur z-[60] flex items-center justify-center p-6" onClick={onClose}>
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        className="bg-[#121218] rounded-3xl p-9 max-w-lg w-full border border-white/10" 
        onClick={e => e.stopPropagation()}
      >
        <div className="font-semibold tracking-tight text-2xl mb-2">Future Features</div>
        <div className="text-white/60 text-sm mb-8">Coming in Q2 2026 updates</div>
        
        <div className="space-y-3 text-sm">
          {features.map((f, i) => (
            <div key={i} className="px-5 py-4 bg-white/5 rounded-2xl flex justify-between">
              <span>{f}</span>
              <span className="text-white/30">Soon</span>
            </div>
          ))}
        </div>
        
        <button onClick={onClose} className="mt-8 w-full py-4 rounded-2xl bg-white text-black font-medium">Got it</button>
      </motion.div>
    </div>
  );
}
