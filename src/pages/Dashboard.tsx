import { useState } from 'react';
import { useAuthStore } from '../store/authStore';

import Navbar from '../components/Navbar';
import AddTaskModal from '../components/AddTaskModal';
import AIRoutineBanner from '../components/AIRoutineBanner';
import StatsCards from '../components/StatsCards';
import TaskList from '../components/TaskList';
import PriorityChart from '../components/PriorityChart';
import PerformanceChart from '../components/PerformanceChart';
import ProductivityChart from '../components/ProductivityChart';
import ProfileModal from '../components/ProfileModal';

import { Task, Priority } from '../types';

export default function Dashboard() {
  const { user } = useAuthStore();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const aiSuggestion = "Start with your Crucial task today for maximum momentum.";

  const handleAddTask = (title: string, priority: Priority) => {
    const newTask: Task = {
      id: Date.now().toString(),
      title,
      priority,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setTasks([newTask, ...tasks]);
    setShowAddModal(false);
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const completionRate = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
  const crucialCount = tasks.filter(t => t.priority === 'Crucial').length;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <Navbar
        currentDate={new Date().toISOString()}
        onProfileClick={() => setShowProfileModal(true)}
        onFutureClick={() => alert("Future features coming soon ✨")}
      />

      <div className="max-w-5xl mx-auto px-6 pt-24 pb-20">
        <AIRoutineBanner suggestion={aiSuggestion} onDismiss={() => {}} />

        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-5xl font-bold tracking-tight text-white glow-purple">
              Good Morning, {user?.username}!
            </h1>
            <p className="text-white/70 mt-1 text-lg">Let's build better habits today.</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="glow-button bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-8 py-3.5 rounded-2xl font-medium hover:brightness-110 transition-all shadow-lg"
          >
            + New Task
          </button>
        </div>

        <StatsCards completion={completionRate} crucialCount={crucialCount} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <PriorityChart tasks={tasks} />
          <PerformanceChart tasks={tasks} />
        </div>

        <ProductivityChart history={[]} todayCompletion={completionRate} />

        <div className="mt-12">
          <h2 className="text-2xl font-semibold mb-6 text-white">Today's Routine</h2>
          <TaskList tasks={tasks} onToggle={toggleTask} onDelete={deleteTask} />
        </div>
      </div>

      {/* Modals */}
      <AddTaskModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
        onAdd={handleAddTask} 
      />

      <ProfileModal 
        isOpen={showProfileModal} 
        onClose={() => setShowProfileModal(false)} 
        address={user?.address || ''} 
        isEditMode={true}
      />
    </div>
  );
}