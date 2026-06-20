export type ViewType = 'dashboard' | 'goals' | 'tasks' | 'habits' | 'journal' | 'review' | 'calendar' | 'settings' | 'graph';

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

export interface EveningReflection {
  date: string; // format YYYY-MM-DD
  content: string; // la victoire / réussite du jour
  createdAt: string;
}

export interface AppData {
  goals: Goal[];
  milestones: Milestone[];
  tasks: Task[];
  journal: JournalEntry[];
  morningRituals: MorningRitual[];
  goalsHistory: GoalHistoryEntry[];
  eveningReflections: EveningReflection[];
  habits: Habit[];
  habitCompletions: HabitCompletion[];
  weeklyReviews: WeeklyReview[];
  lifeAssessments: LifeAssessment[];
  energyLogs: EnergyLog[];
}

export type EnergyLevel = 'low' | 'medium' | 'high';

// Niveau d'énergie ressenti pour un jour donné. Sert à adapter les suggestions
// (les jours « basse énergie », l'app invite à n'en faire qu'une).
export interface EnergyLog {
  id: string;
  date: string; // format YYYY-MM-DD
  level: EnergyLevel;
}

// Bilan d'équilibre de vie : ressenti de satisfaction (1 à 5) sur chaque domaine,
// à un instant donné. On garde l'historique pour voir l'évolution dans le temps.
export interface LifeAssessment {
  id: string;
  date: string; // format YYYY-MM-DD
  scores: Partial<Record<LifeDomain, number>>; // 1..5 par pilier évalué
}

export type HabitFrequency = 'daily' | 'weekly';

export interface Habit {
  id: string;
  title: string;
  domain?: LifeDomain;
  frequency: HabitFrequency;
  daysOfWeek?: number[]; // 0 = dimanche ... 6 = samedi, utilisé si frequency === 'weekly'
  createdAt: string;
  isArchived?: boolean;
}

export interface HabitCompletion {
  id: string;
  habitId: string;
  date: string; // format YYYY-MM-DD
}

export interface WeeklyReview {
  id: string;
  weekStartDate: string; // lundi de la semaine concernée, format YYYY-MM-DD
  win: string;
  challenge: string;
  intention: string;
  createdAt: string;
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

export type GoalChangeType =
  | 'created'
  | 'title-changed'
  | 'why-changed'
  | 'status-changed'
  | 'milestone-added'
  | 'milestone-completed'
  | 'deadline-changed'
  | 'domain-changed'
  | 'reactivated'
  | 'achieved'
  | 'paused';

export interface GoalHistoryEntry {
  id: string;
  goalId: string;
  changeType: GoalChangeType;
  date: string; // format YYYY-MM-DD HH:MM
  previousValue?: string;
  newValue?: string;
  description: string; // phrase lisible générée automatiquement
}


