import { useState } from 'react';
import { motion } from 'framer-motion';
import { Priority } from '../types';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (title: string, priority: Priority) => void;
}

export default function AddTaskModal({ isOpen, onClose, onAdd }: AddTaskModalProps) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('Medium');

  const handleAdd = () => {
    if (!title.trim()) return;
    onAdd(title.trim(), priority);
    setTitle('');
    setPriority('Medium');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/80 flex items-end md:items-center justify-center" onClick={onClose}>
      <motion.div 
        initial={{ y: 60, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        className="bg-[#121218] w-full md:w-[440px] rounded-t-3xl md:rounded-3xl p-8 border-t md:border border-white/10" 
        onClick={e => e.stopPropagation()}
      >
        <div className="font-semibold text-2xl tracking-tight mb-7">New Task</div>
        
        <input 
          value={title} 
          onChange={e => setTitle(e.target.value)} 
          placeholder="What needs to be done?" 
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-[18px] text-lg placeholder:text-white/30 focus:outline-none mb-5" 
        />
        
        <div className="flex gap-2 mb-8">
          {(['Crucial','High','Medium','Low'] as const).map(p => (
            <button 
              key={p} 
              onClick={() => setPriority(p)} 
              className={`flex-1 py-3 rounded-2xl text-sm font-medium transition-all ${priority === p ? 'bg-white text-black' : 'bg-white/5 hover:bg-white/10'}`}
            >
              {p}
            </button>
          ))}
        </div>
        
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-4 rounded-2xl bg-white/10">Cancel</button>
          <button 
            onClick={handleAdd} 
            disabled={!title.trim()} 
            className="flex-1 py-4 rounded-2xl bg-white text-black font-medium disabled:opacity-40"
          >
            Add to Routine
          </button>
        </div>
      </motion.div>
    </div>
  );
}
