import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DayData } from '../types';

interface ProductivityChartProps {
  history: DayData[];
  todayCompletion: number;
}

export default function ProductivityChart({ history, todayCompletion }: ProductivityChartProps) {
  const data = history.length 
    ? history.map(day => ({
        day: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        rate: day.completionRate,
      }))
    : [{ day: 'Today', rate: todayCompletion }];

  return (
    <div className="bg-[#121218] border border-white/10 rounded-3xl p-7">
      <div className="flex items-center justify-between mb-6">
        <div className="font-medium">14-Day Productivity</div>
        <div className="text-xs px-3 py-px rounded-full bg-emerald-500/10 text-emerald-400">GROWTH</div>
      </div>
      <div className="h-52 -mx-2 overflow-hidden">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="2 2" stroke="#ffffff10" />
            <XAxis dataKey="day" stroke="#ffffff30" fontSize={10} />
            <YAxis domain={[0,100]} stroke="#ffffff30" fontSize={10} />
            <Tooltip contentStyle={{ background: '#121218', border: 'none', borderRadius: '12px' }} />
            <Line type="natural" dataKey="rate" stroke="#6366f1" strokeWidth={3.5} dot={{ fill: '#6366f1', r: 3.5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
