import { useState, useEffect } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

import { Task, Priority, DayData } from './types';
import Navbar from './components/Navbar';
import TaskList from './components/TaskList';
import StatsCards from './components/StatsCards';
import ProductivityChart from './components/ProductivityChart';
import PriorityChart from './components/PriorityChart';
import PerformanceChart from './components/PerformanceChart';
import AIRoutineBanner from './components/AIRoutineBanner';
import AddTaskModal from './components/AddTaskModal';
import ProfileModal from './components/ProfileModal';
import FutureModal from './components/FutureModal';

export default function AetherDailyRoutine() {
  const [currentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [tasks, setTasks] = useState<Task[]>([]);
  const [history, setHistory] = useState<DayData[]>([]);
  const [aiSuggestion, setAiSuggestion] = useState('');
  
  const [showProfile, setShowProfile] = useState(false);
  const [showFuture, setShowFuture] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const savedTasks = localStorage.getItem(`tasks-${currentDate}`);
    const savedHistory = localStorage.getItem('routine-history');
    
    if (savedTasks) setTasks(JSON.parse(savedTasks));
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, [currentDate]);

  // Save tasks + update history
  useEffect(() => {
    localStorage.setItem(`tasks-${currentDate}`, JSON.stringify(tasks));
    
    const completionRate = tasks.length > 0 
      ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) 
      : 0;
    
    const dayData: DayData = { date: currentDate, tasks: [...tasks], completionRate };
    const updatedHistory = history.filter(h => h.date !== currentDate);
    const newHistory = [...updatedHistory, dayData]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14);
    
    setHistory(newHistory);
    localStorage.setItem('routine-history', JSON.stringify(newHistory));
  }, [tasks, currentDate]);

  const todayCompletion = tasks.length > 0 
    ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) 
    : 0;

  const crucialTasks = tasks.filter(t => t.priority === 'Crucial').length;

  // Add Task
  const addTask = (title: string, priority: Priority) => {
    const task: Task = {
      id: Date.now().toString(36),
      title,
      priority,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setTasks([...tasks, task]);
    setShowAddTask(false);
  };

  const toggleComplete = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  // AI Routine Generator
  const generateAIRoutine = () => {
    const suggestions = [
      `Focus on your ${crucialTasks} crucial tasks first — they drive 80% of your impact.`,
      `Break your day into 3 deep work blocks. Start with the highest priority task.`,
      `Add 25-minute Pomodoro sessions between tasks for optimal flow.`,
      `Review your completion rate daily — aim for 85%+ consistency.`,
      `Incorporate 2 creative tasks to boost innovation metrics.`,
    ];
    
    const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
    setAiSuggestion(randomSuggestion);
    
    if (tasks.length < 3) {
      const smartTasks: Omit<Task, 'id' | 'completed' | 'createdAt'>[] = [
        { title: "Deep focus block: Creative project", priority: 'Crucial' },
        { title: "Review weekly goals & metrics", priority: 'High' },
      ];
      
      const newSmart = smartTasks.slice(0, 2 - tasks.length).map((st, i) => ({
        id: (Date.now() + i).toString(36),
        title: st.title,
        priority: st.priority,
        completed: false,
        createdAt: new Date().toISOString(),
      }));
      setTasks([...tasks, ...newSmart]);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden">
      <Navbar 
        currentDate={currentDate} 
        onProfileClick={() => setShowProfile(true)} 
        onFutureClick={() => setShowFuture(true)} 
      />

      <div className="pt-20 max-w-7xl mx-auto px-6 pb-12">
        {/* Hero Header */}
        <div className="pt-12 pb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <div className="inline-block px-4 py-1 rounded-full bg-white/5 text-xs tracking-[3px] mb-3">PERSONAL GROWTH OS</div>
            <h1 className="text-7xl font-semibold tracking-[-4.5px] leading-none">Your day.<br />Optimized.</h1>
            <p className="mt-4 text-xl text-white/60 max-w-md">Track crucial tasks. Visualize growth. Become exceptional.</p>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={generateAIRoutine}
              className="group flex items-center gap-3 px-8 h-14 rounded-3xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:brightness-110 active:scale-[0.985] transition-all shadow-xl shadow-indigo-950"
            >
              <Sparkles className="w-5 h-5 group-hover:rotate-12 transition" /> 
              <span className="font-medium">Generate AI Routine</span>
            </button>
            <button 
              onClick={() => setShowAddTask(true)}
              className="flex items-center gap-3 px-8 h-14 rounded-3xl border border-white/20 hover:bg-white/5 active:bg-white/10 transition-all"
            >
              <Plus className="w-5 h-5" /> Add Task
            </button>
          </div>
        </div>

        <AIRoutineBanner suggestion={aiSuggestion} onDismiss={() => setAiSuggestion('')} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* TASKS SECTION */}
          <div className="lg:col-span-7">
            <div className="flex justify-between items-center mb-5 px-1">
              <div className="flex items-center gap-3">
                <span className="font-medium tracking-tight text-xl">Today's Tasks</span>
              </div>
              <div className="text-sm text-white/50 tabular-nums">{tasks.length} tasks • {todayCompletion}% complete</div>
            </div>

            <div className="bg-[#121218] border border-white/10 rounded-3xl p-2 min-h-[420px]">
              <TaskList tasks={tasks} onToggle={toggleComplete} onDelete={deleteTask} />
            </div>
          </div>

          {/* STATS + CHARTS */}
          <div className="lg:col-span-5 space-y-6">
            <StatsCards completion={todayCompletion} crucialCount={crucialTasks} />
            <ProductivityChart history={history} todayCompletion={todayCompletion} />
            <PriorityChart tasks={tasks} />
          </div>
        </div>

        <PerformanceChart tasks={tasks} />
      </div>

      {/* Modals */}
      <AddTaskModal 
        isOpen={showAddTask} 
        onClose={() => setShowAddTask(false)} 
        onAdd={addTask} 
      />
      <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />
      <FutureModal isOpen={showFuture} onClose={() => setShowFuture(false)} />
    </div>
  );
}
