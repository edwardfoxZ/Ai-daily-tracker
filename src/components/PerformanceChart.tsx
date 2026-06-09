import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Task } from '../types';

interface PerformanceChartProps {
  tasks: Task[];
}

export default function PerformanceChart({ tasks }: PerformanceChartProps) {
  const priorities = ['Crucial', 'High', 'Medium', 'Low'] as const;

  const data = priorities.map(p => {
    const prioTasks = tasks.filter(t => t.priority === p);
    const completed = prioTasks.filter(t => t.completed).length;
    return {
      priority: p,
      completed,
      total: prioTasks.length,
      rate: prioTasks.length ? Math.round((completed / prioTasks.length) * 100) : 0,
    };
  }).filter(d => d.total > 0);

  if (data.length === 0) return null;

  return (
    <div className="mt-6 bg-[#121218] border border-white/10 rounded-3xl p-8">
      <div className="font-medium mb-8 flex items-center gap-3">
        Crucial Task Performance <span className="text-xs text-white/40">BY PRIORITY</span>
      </div>
      <div className="h-72">
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid stroke="#ffffff10" />
            <XAxis dataKey="priority" stroke="#ffffff30" />
            <YAxis domain={[0, 100]} stroke="#ffffff30" />
            <Tooltip contentStyle={{background:'#121218', border:'none', borderRadius:'12px'}} />
            <Bar dataKey="rate" fill="#6366f1" radius={6} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
