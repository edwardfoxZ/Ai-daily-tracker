import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Task } from '../types';

const PRIORITY_COLORS = {
  Crucial: '#f43f5e',
  High: '#f59e0b',
  Medium: '#8b5cf6',
  Low: '#64748b',
};

interface PriorityChartProps {
  tasks: Task[];
}

export default function PriorityChart({ tasks }: PriorityChartProps) {
  const data = ['Crucial', 'High', 'Medium', 'Low'].map(p => ({
    name: p,
    value: tasks.filter(t => t.priority === p).length,
    color: PRIORITY_COLORS[p as keyof typeof PRIORITY_COLORS],
  })).filter(d => d.value > 0);

  if (data.length === 0) return null;

  return (
    <div className="bg-[#121218] border border-white/10 rounded-3xl p-7">
      <div className="font-medium mb-6">Task Priority Distribution</div>
      <div className="h-56 flex items-center justify-center -mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={68} outerRadius={105}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap justify-center gap-x-6 gap-y-1 text-xs mt-1">
        {data.map(d => (
          <div key={d.name} className="flex items-center gap-1.5 text-white/60">
            <div className="w-2 h-2 rounded-full" style={{background: d.color}} /> {d.name}
          </div>
        ))}
      </div>
    </div>
  );
}
