import { Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AIRoutineBannerProps {
  suggestion: string;
  onDismiss: () => void;
}

export default function AIRoutineBanner({ suggestion, onDismiss }: AIRoutineBannerProps) {
  return (
    <AnimatePresence>
      {suggestion && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          exit={{ opacity: 0 }}
          className="mb-8 p-5 rounded-3xl bg-gradient-to-r from-violet-950/60 to-indigo-950/60 border border-violet-500/30 flex items-center gap-4"
        >
          <div className="text-violet-400"><Sparkles /></div>
          <div className="flex-1 text-lg text-white/90">{suggestion}</div>
          <button onClick={onDismiss} className="text-xs px-4 py-1 rounded-full bg-white/10">Dismiss</button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
