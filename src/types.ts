export type Priority = 'Crucial' | 'High' | 'Medium' | 'Low';

export interface Task {
  id: string;
  title: string;
  priority: Priority;
  completed: boolean;
  createdAt: string;
}

export interface DayData {
  date: string;
  tasks: Task[];
  completionRate: number;
}