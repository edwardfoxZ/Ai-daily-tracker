import { User, BarChart3, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface NavbarProps {
  currentDate?: string;
  onProfileClick: () => void;
  onFutureClick: () => void;
}

export default function Navbar({ 
  currentDate = new Date().toISOString(), 
  onProfileClick, 
  onFutureClick 
}: NavbarProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#0a0a0f]/90 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 flex items-center justify-center">
              <span className="text-white text-lg">✧</span>
            </div>
            <div>
              <div className="font-semibold tracking-[-1.5px] text-2xl">ESTHER</div>
              <div className="text-[10px] text-white/40 -mt-1">AI ROUTINE 2026</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-white/5 text-sm">
            <Calendar className="w-4 h-4" /> {format(new Date(currentDate), 'EEEE, MMM dd')}
          </div>
          
          <button 
            onClick={onProfileClick}
            className="flex items-center gap-2 px-5 py-2 rounded-2xl bg-white/5 hover:bg-white/10 transition-all active:scale-[0.985]"
          >
            <User className="w-4 h-4" /> Profile
          </button>
          
          <button 
            onClick={onFutureClick}
            className="flex items-center gap-2 px-5 py-2 rounded-2xl bg-white/5 hover:bg-white/10 transition-all active:scale-[0.985]"
          >
            <BarChart3 className="w-4 h-4" /> More Features
          </button>
        </div>
      </div>
    </nav>
  );
}