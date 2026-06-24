import { AppData, LifeDomain, Goal } from '../types';
import { LIFE_PILLARS } from './lifePillars';
import { isHabitDueOn } from '../hooks/useHabits';

export type GuidePeriod = 'weekly' | 'monthly';

export interface DomainBalance {
  domain: LifeDomain;
  score?: number;
  goals: number;
  activity: number;
  status: 'thriving' | 'fragile' | 'neutral';
}

export interface HabitStat {
  id: string;
  title: string;
  done: number;
  due: number;
  ratio: number; // 0..1
}

export interface ReviewGuideResult {
  dynamics: {
    enough: boolean;
    completed: number;
    total: number;
    rate: number;
    prevRate: number | null;
    deltaPts: number | null;
    activeDays: number;
    periodDays: number;
    trend: 'up' | 'down' | 'flat';
  };
  rhythms: {
    enough: boolean;
    bestWeekday: number | null; // 0=dimanche ... 6=samedi
    bestCount: number;
    sampleSize: number;
  };
  balance: DomainBalance[];
  habits: {
    enough: boolean;
    items: HabitStat[];
    strongest: HabitStat | null;
    slipping: HabitStat | null;
  };
  goals: {
    total: number;
    advancing: number;
    stalled: string[];
    deadlineSoon: { title: string; days: number }[];
  };
  guidance: string[];
}

const toStr = (d: Date) => d.toISOString().split('T')[0];

// Liste des jours (YYYY-MM-DD) d'une fenêtre se terminant aujourd'hui.
function lastNDays(n: number): string[] {
  const out: string[] = [];
  const base = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() - i);
    out.push(toStr(d));
  }
  return out;
}

// Construit l'analyse complète du Bilan. 100 % local et déterministe.
export function getReviewGuide(data: AppData, period: GuidePeriod): ReviewGuideResult {
  const days = period === 'weekly' ? 7 : 30;
  const todayStr = toStr(new Date());

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - (days - 1));
  const cutoffStr = toStr(cutoff);

  const prevEnd = new Date();
  prevEnd.setDate(prevEnd.getDate() - days);
  const prevEndStr = toStr(prevEnd);
  const prevStart = new Date();
  prevStart.setDate(prevStart.getDate() - (2 * days - 1));
  const prevStartStr = toStr(prevStart);

  const tasks = data.tasks || [];
  const inPeriod = (d?: string) => !!d && d >= cutoffStr && d <= todayStr;
  const inPrev = (d?: string) => !!d && d >= prevStartStr && d <= prevEndStr;

  const goalDomain = (goalId?: string) => (goalId ? data.goals.find(g => g.id === goalId)?.domain : undefined);
  const taskDomain = (t: { domain?: LifeDomain; goalId?: string }) => t.domain || goalDomain(t.goalId);

  const inProgressGoals = (data.goals || []).filter(g => g.status === 'En cours');

  // --- ② Dynamique ---
  const curTasks = tasks.filter(t => inPeriod(t.date));
  const curCompleted = curTasks.filter(t => t.isCompleted);
  const total = curTasks.length;
  const completed = curCompleted.length;
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const prevTasks = tasks.filter(t => inPrev(t.date));
  const prevTotal = prevTasks.length;
  const prevRate = prevTotal > 0 ? Math.round((prevTasks.filter(t => t.isCompleted).length / prevTotal) * 100) : null;
  const deltaPts = prevRate != null ? rate - prevRate : null;
  const activeDays = new Set(curCompleted.map(t => t.date)).size;
  const trend: 'up' | 'down' | 'flat' = deltaPts == null ? 'flat' : deltaPts >= 5 ? 'up' : deltaPts <= -5 ? 'down' : 'flat';

  // --- ③ Rythmes (fenêtre plus large pour un signal stable) ---
  const rhythmWindow = new Set(lastNDays(56));
  const byWeekday = [0, 0, 0, 0, 0, 0, 0];
  let rhythmSample = 0;
  tasks.forEach(t => {
    if (t.isCompleted && t.date && rhythmWindow.has(t.date)) {
      const wd = new Date(t.date + 'T00:00:00').getDay();
      byWeekday[wd]++;
      rhythmSample++;
    }
  });
  let bestWeekday: number | null = null;
  let bestCount = 0;
  byWeekday.forEach((c, i) => { if (c > bestCount) { bestCount = c; bestWeekday = i; } });
  const rhythmsEnough = rhythmSample >= 8 && bestCount >= 2;

  // --- ④ Équilibre par domaine ---
  const latestAssessment = (data.lifeAssessments || []).slice().sort((a, b) => b.date.localeCompare(a.date))[0];
  const balance: DomainBalance[] = LIFE_PILLARS.map(p => {
    const score = latestAssessment?.scores[p.domain];
    const goals = inProgressGoals.filter(g => g.domain === p.domain).length;
    const activity = curCompleted.filter(t => taskDomain(t) === p.domain).length;
    let status: DomainBalance['status'] = 'neutral';
    if ((score !== undefined && score >= 4) || (goals >= 1 && activity >= 1)) status = 'thriving';
    else if (score !== undefined && score <= 2 && goals === 0) status = 'fragile';
    return { domain: p.domain, score, goals, activity, status };
  });

  // --- ⑤ Habitudes ---
  const periodDates = lastNDays(days);
  const activeHabits = (data.habits || []).filter(h => !h.isArchived);
  const completions = data.habitCompletions || [];
  const habitItems: HabitStat[] = activeHabits.map(h => {
    let due = 0;
    periodDates.forEach(ds => { if (isHabitDueOn(h, new Date(ds + 'T00:00:00'))) due++; });
    const done = completions.filter(c => c.habitId === h.id && inPeriod(c.date)).length;
    const ratio = due > 0 ? Math.min(1, done / due) : 0;
    return { id: h.id, title: h.title, done, due, ratio };
  }).sort((a, b) => b.ratio - a.ratio);

  const strongest = habitItems.length > 0 && habitItems[0].ratio > 0 ? habitItems[0] : null;
  const slipping = habitItems
    .filter(h => h.due >= 2 && h.ratio < 0.34)
    .sort((a, b) => a.ratio - b.ratio)[0] || null;

  // --- ⑥ Objectifs (triage) ---
  const milestones = data.milestones || [];
  const advancing = inProgressGoals.filter(g => {
    const msDone = milestones.some(m => m.goalId === g.id && m.isCompleted);
    const taskDone = curCompleted.some(t => t.goalId === g.id);
    return msDone || taskDone;
  }).length;

  const stalled = inProgressGoals
    .filter(g => !tasks.some(t => t.goalId === g.id && !t.isCompleted))
    .map(g => g.title);

  const deadlineSoon: { title: string; days: number }[] = [];
  inProgressGoals.forEach(g => {
    if (!g.deadline) return;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const dl = new Date(g.deadline); dl.setHours(0, 0, 0, 0);
    const diff = Math.ceil((dl.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff >= 0 && diff <= 7) deadlineSoon.push({ title: g.title, days: diff });
  });
  deadlineSoon.sort((a, b) => a.days - b.days);

  // --- ⑦ Guide : conseils priorisés (max 3) ---
  const WEEKDAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const guidance: string[] = [];
  const remaining = curTasks.filter(t => !t.isCompleted).length;

  if (deadlineSoon.length > 0) {
    const d = deadlineSoon[0];
    guidance.push(`Échéance proche sur « ${d.title} » (${d.days === 0 ? "aujourd'hui" : `dans ${d.days} j`}) — donne-lui la priorité.`);
  }
  if (stalled.length > 0 && guidance.length < 3) {
    guidance.push(`Relance « ${stalled[0]} » : un premier petit pas suffit à réamorcer.`);
  }
  const fragile = balance.find(b => b.status === 'fragile');
  if (fragile && guidance.length < 3) {
    guidance.push(`Ton domaine « ${fragile.domain} » est en retrait — un seul geste cette semaine rééquilibrerait l'ensemble.`);
  }
  if (slipping && guidance.length < 3) {
    guidance.push(`« ${slipping.title} » décroche — allège : vise juste 2 jours cette semaine.`);
  }
  if (period === 'weekly' && remaining > 10 && guidance.length < 3) {
    guidance.push(`Semaine chargée (${remaining} actions restantes) — choisis les 2-3 qui comptent vraiment.`);
  }
  if (rhythmsEnough && bestWeekday != null && guidance.length < 3) {
    guidance.push(`Ton meilleur jour est le ${WEEKDAYS[bestWeekday]} — réserves-y ton action la plus importante.`);
  }
  if (guidance.length === 0) {
    guidance.push('Continue à ton rythme. La régularité compte plus que la performance.');
  }

  return {
    dynamics: { enough: total > 0, completed, total, rate, prevRate, deltaPts, activeDays, periodDays: days, trend },
    rhythms: { enough: rhythmsEnough, bestWeekday, bestCount, sampleSize: rhythmSample },
    balance,
    habits: { enough: activeHabits.length > 0, items: habitItems, strongest, slipping },
    goals: { total: inProgressGoals.length, advancing, stalled, deadlineSoon },
    guidance: guidance.slice(0, 3),
  };
}
