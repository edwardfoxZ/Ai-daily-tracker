import { Target } from 'lucide-react';
import { Task } from '../types';
import TaskItem from './TaskItem';

interface TaskListProps {
  tasks: Task[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function TaskList({ tasks, onToggle, onDelete }: TaskListProps) {
  const sortedTasks = [...tasks].sort((a, b) => {
    const order: Record<string, number> = { Crucial: 0, High: 1, Medium: 2, Low: 3 };
    return order[a.priority] - order[b.priority];
  });

  if (tasks.length === 0) {
    return (
      <div className="h-[380px] flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
          <Target className="w-8 h-8 text-white/30" />
        </div>
        <p className="text-white/60">No tasks yet. Add your first crucial task.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {sortedTasks.map((task, index) => (
        <TaskItem 
          key={task.id} 
          task={task} 
          index={index} 
          onToggle={onToggle} 
          onDelete={onDelete} 
        />
      ))}
    </div>
  );
}
