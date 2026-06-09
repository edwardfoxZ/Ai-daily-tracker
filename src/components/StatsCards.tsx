import { TrendingUp, Target, Award } from 'lucide-react';

interface StatsCardsProps {
  completion: number;
  crucialCount: number;
}

export default function StatsCards({ completion, crucialCount }: StatsCardsProps) {
  const stats = [
    { label: "Completion", value: `${completion}%`, icon: TrendingUp },
    { label: "Crucial", value: crucialCount, icon: Target },
    { label: "Streak", value: "14", icon: Award },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((stat, i) => (
        <div key={i} className="bg-[#121218] border border-white/10 rounded-3xl p-5">
          <stat.icon className="w-4 h-4 text-white/40 mb-4" />
          <div className="text-4xl font-semibold tracking-[-1.5px] tabular-nums">{stat.value}</div>
          <div className="text-xs text-white/50 mt-1">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
