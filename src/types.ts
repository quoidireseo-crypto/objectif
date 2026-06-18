export type ViewType = 'dashboard' | 'goals' | 'tasks' | 'journal' | 'review' | 'calendar' | 'settings' | 'graph';

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
  morningRituals: MorningRitual[];
}

export type MorningRitualStatus = 'pending' | 'completed' | 'skipped';

export interface MorningRitual {
  id: string;
  date: string; // (format YYYY-MM-DD)
  priority: string; // (la priorité absolue du jour, texte libre)
  goalId?: string; // (cap choisi pour aujourd'hui)
  mood: 'Super' | 'Bien' | 'Moyen' | 'Difficile';
  status: MorningRitualStatus;
  createdAt: string;
}

export type OrphanReason = 
  | 'goal-no-action'        
  | 'goal-no-milestone'     
  | 'task-no-goal'          
  | 'milestone-abandoned'   
  | 'goal-inactive';

export interface OrphanItem {
  id: string;
  type: 'goal' | 'milestone' | 'task';
  title: string;
  reason: OrphanReason;
  daysSinceLastActivity: number;
  linkedGoalTitle?: string;
}

