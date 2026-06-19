import { AppData, ViewType } from '../types';
import { LIFE_PILLARS } from './lifePillars';

export type ReminderTone = 'calm' | 'encourage' | 'celebrate' | 'caution';

export interface ReminderSignal {
  id: string;
  message: string;
  tone: ReminderTone;
  cta?: { label: string; view: ViewType };
}

const GENERIC: string[] = [
  "Bonjour ! Une petite action t'attend aujourd'hui. 🌱",
  "C'est le moment de prendre un instant pour toi. Qu'est-ce que tu choisis ?",
  "Un pas, même petit, c'est déjà avancer.",
  "Jette un œil à ta journée, quand tu veux. Sans pression.",
];

const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

const toStr = (d: Date) => d.toISOString().split('T')[0];

// Détecte le signal le plus pertinent du moment, ou renvoie null s'il n'y a rien
// d'utile à dire. « Le meilleur rappel est parfois l'absence de rappel. »
export function getHolisticSignal(data: AppData): ReminderSignal | null {
  try {
    const today = toStr(new Date());
    const inProgressGoals = (data.goals || []).filter(g => g.status === 'En cours');

    // 0. Énergie basse déclarée aujourd'hui — priorité à la douceur.
    const todayEnergy = (data.energyLogs || []).find(e => e.date === today)?.level;
    if (todayEnergy === 'low') {
      return {
        id: 'energy-low',
        tone: 'calm',
        message: "Journée douce aujourd'hui. Pas de liste — juste une petite chose si le cœur t'en dit.",
      };
    }

    // 1. Semaine surchargée — protéger l'énergie.
    const diffToMonday = (new Date().getDay() + 6) % 7;
    const monday = new Date();
    monday.setDate(monday.getDate() - diffToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const weekStart = toStr(monday);
    const weekEnd = toStr(sunday);
    const remainingThisWeek = (data.tasks || []).filter(
      t => !t.isCompleted && t.date >= weekStart && t.date <= weekEnd
    ).length;
    if (remainingThisWeek > 10) {
      return {
        id: 'week-heavy',
        tone: 'caution',
        message: "Beaucoup au programme cette semaine. Protège ton énergie : une seule chose suffit. 🌿",
      };
    }

    // 2. Effet en cascade — une habitude qui nourrit plusieurs objectifs.
    const habits = (data.habits || []).filter(h => !h.isArchived && h.domain);
    for (const h of habits) {
      const count = inProgressGoals.filter(g => g.domain === h.domain).length;
      if (count >= 2) {
        return {
          id: 'lever',
          tone: 'celebrate',
          message: `« ${h.title} » nourrit ${count} de tes objectifs. En la tenant aujourd'hui, tu avances sur plusieurs fronts. 🌱`,
        };
      }
    }

    // 3. Pilier silencieux — fragile et sans objectif.
    const latest = (data.lifeAssessments || [])
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date))[0];
    if (latest) {
      const silent = LIFE_PILLARS.find(p => {
        const score = latest.scores[p.domain];
        const hasGoal = inProgressGoals.some(g => g.domain === p.domain);
        return score !== undefined && score <= 2 && !hasGoal;
      });
      if (silent) {
        return {
          id: 'pillar-silent',
          tone: 'calm',
          message: `Ton pilier « ${silent.domain} » est silencieux ces temps-ci. Un petit geste pour lui ?`,
          cta: { label: 'Mes objectifs', view: 'goals' },
        };
      }
    }

    // 4. Actions prévues aujourd'hui.
    const todayCount = (data.tasks || []).filter(t => t.date === today && !t.isCompleted).length;
    if (todayCount > 0) {
      return {
        id: 'today-actions',
        tone: 'encourage',
        message: `Tu as ${todayCount} action${todayCount > 1 ? 's' : ''} pour aujourd'hui. Un pas à la fois.`,
      };
    }

    // 5. Un objectif en sommeil — sans pression.
    const stalled = inProgressGoals.some(
      g => !(data.tasks || []).some(t => t.goalId === g.id && !t.isCompleted)
    );
    if (stalled) {
      return {
        id: 'stalled',
        tone: 'calm',
        message: "Un de tes objectifs attend peut-être un premier pas. Juste un coup d'œil, quand tu veux.",
        cta: { label: 'Mes objectifs', view: 'goals' },
      };
    }

    return null;
  } catch {
    return null;
  }
}

// Pour la notification poussée : toujours un message (jamais de silence, puisque
// l'utilisateur a explicitement demandé un rappel à heure fixe).
export function getHolisticReminderMessage(data: AppData): string {
  return getHolisticSignal(data)?.message || pick(GENERIC);
}
