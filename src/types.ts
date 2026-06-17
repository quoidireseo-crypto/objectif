export type ViewType = 'dashboard' | 'goals' | 'tasks' | 'journal' | 'review' | 'calendar' | 'cartography' | 'settings';

export type LifeDomain = 'Santé & Bien-être' | 'Projet Personnel' | 'Relations & Famille' | 'Apprentissage' | 'Finances' | 'Spiritualité' | 'Autre';

export interface Milestone {
  id: string;
  goalId: string;
  title: string;
  isCompleted: boolean;
  order: number; // 1, 2, 3, 4 max
}

export interface Goal {
  id: string;
  title: string;
  why: string; // The "Why this is important" field to give intention
  domain: LifeDomain;
  deadline?: string;
  status: 'En cours' | 'Atteint' | 'En pause';
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  goalId?: string; // Links a task to a larger goal
  milestoneId?: string; // Links a task to a specific milestone
  domain?: LifeDomain; // Category/Tag for the task
  isCompleted: boolean;
  date: string;
  isImportant?: boolean;
}

export interface JournalEntry {
  id: string;
  date: string;
  content: string;
  mood: 'Super' | 'Bien' | 'Moyen' | 'Difficile';
}

export interface AppData {
  goals: Goal[];
  milestones: Milestone[];
  tasks: Task[];
  journal: JournalEntry[];
}
