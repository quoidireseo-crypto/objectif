export type ViewType = 'dashboard' | 'goals' | 'tasks' | 'journal';

export type Category = 'Personnel' | 'Professionnel' | 'Santé' | 'Loisirs' | 'Maison';

export interface Goal {
  id: string;
  title: string;
  why: string; // The "Why this is important" field to give intention
  category: Category;
  deadline?: string;
  status: 'En cours' | 'Atteint' | 'En pause';
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  goalId?: string; // Links a task to a larger goal
  isCompleted: boolean;
  date: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  content: string;
  mood: 'Super' | 'Bien' | 'Moyen' | 'Difficile';
}

export interface AppData {
  goals: Goal[];
  tasks: Task[];
  journal: JournalEntry[];
}
