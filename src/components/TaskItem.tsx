import { Trash2, Check, Target, Zap, Clock, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import { Task, Priority } from '../types';

const PRIORITY_COLORS: Record<Priority, string> = {
  Crucial: '#f43f5e',
  High: '#f59e0b',
  Medium: '#8b5cf6',
  Low: '#64748b',
};

const PRIORITY_ICONS: Record<Priority, React.ElementType> = {
  Crucial: Target,
  High: Zap,
  Medium: Clock,
  Low: Award,
};

interface TaskItemProps {
  task: Task;
  index: number;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function TaskItem({ task, index, onToggle, onDelete }: TaskItemProps) {
  const Icon = PRIORITY_ICONS[task.priority];
  const color = PRIORITY_COLORS[task.priority];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ delay: index * 0.02 }}
      className={`group flex items-center gap-4 px-6 py-5 rounded-2xl hover:bg-white/5 transition-all ${task.completed ? 'opacity-60' : ''}`}
    >
      <button 
        onClick={() => onToggle(task.id)} 
        className={`w-7 h-7 flex-shrink-0 rounded-xl border flex items-center justify-center transition-all ${task.completed ? 'bg-emerald-500 border-emerald-500' : 'border-white/30 hover:border-white/70'}`}
      >
        {task.completed && <Check className="w-4 h-4" />}
      </button>
      
      <div className="flex-1 min-w-0">
        <div className={`font-medium text-[15px] tracking-[-0.2px] ${task.completed ? 'line-through text-white/40' : ''}`}>
          {task.title}
        </div>
      </div>

      <div 
        style={{ backgroundColor: color + '22', color }} 
        className="px-4 py-1 text-xs font-medium rounded-2xl flex items-center gap-1.5"
      >
        <Icon className="w-3.5 h-3.5" /> {task.priority}
      </div>

      <button 
        onClick={() => onDelete(task.id)} 
        className="opacity-0 group-hover:opacity-100 p-2 text-white/40 hover:text-rose-400 transition-all"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
