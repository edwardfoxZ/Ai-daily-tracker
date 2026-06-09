import { motion } from 'framer-motion';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[60] flex items-center justify-center p-6" onClick={onClose}>
      <motion.div 
        initial={{ scale: 0.96, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        className="bg-[#121218] border border-white/10 rounded-3xl p-9 max-w-md w-full" 
        onClick={e => e.stopPropagation()}
      >
        <div className="text-center">
          <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 mb-6" />
          <div className="text-3xl tracking-tight font-medium">Alex Rivera</div>
          <div className="text-white/50">Level 42 • 184 day streak</div>
          
          <div className="my-8 text-sm text-left bg-white/5 rounded-2xl p-6">
            <div>Creative Score: <span className="font-mono text-emerald-400">92</span></div>
            <div>Process Efficiency: <span className="font-mono text-emerald-400">87</span></div>
            <div>Crucial Completion: <span className="font-mono text-emerald-400">94</span></div>
          </div>
        </div>
        <button onClick={onClose} className="w-full py-4 rounded-2xl bg-white/10 hover:bg-white/15">Close</button>
      </motion.div>
    </div>
  );
}
