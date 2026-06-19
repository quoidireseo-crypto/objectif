import { AppData } from '../types';
import { LIFE_PILLARS } from './lifePillars';

const GENERIC: string[] = [
  "Bonjour ! Une petite action t'attend aujourd'hui. 🌱",
  "C'est le moment de prendre un instant pour toi. Qu'est-ce que tu choisis ?",
  "Un pas, même petit, c'est déjà avancer.",
  "Jette un œil à ta journée, quand tu veux. Sans pression.",
];

const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

const toStr = (d: Date) => d.toISOString().split('T')[0];

// Construit un rappel qui « voit » l'ensemble de la vie de l'utilisateur, au lieu
// d'un message générique. On choisit le signal le plus pertinent du moment.
export function getHolisticReminderMessage(data: AppData): string {
  try {
    const today = toStr(new Date());
    const inProgressGoals = (data.goals || []).filter(g => g.status === 'En cours');

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
      return pick([
        "Semaine chargée — et si tu choisissais juste l'essentiel aujourd'hui ? 🌿",
        "Beaucoup au programme cette semaine. Protège ton énergie : une seule chose suffit.",
      ]);
    }

    // 2. Effet en cascade — une habitude qui nourrit plusieurs objectifs.
    const habits = (data.habits || []).filter(h => !h.isArchived && h.domain);
    for (const h of habits) {
      const count = inProgressGoals.filter(g => g.domain === h.domain).length;
      if (count >= 2) {
        return `« ${h.title} » nourrit ${count} de tes objectifs. En la tenant aujourd'hui, tu avances sur plusieurs fronts. 🌱`;
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
        return `Ton pilier « ${silent.domain} » est silencieux ces temps-ci. Un petit geste pour lui ?`;
      }
    }

    // 4. Actions prévues aujourd'hui.
    const todayCount = (data.tasks || []).filter(t => t.date === today && !t.isCompleted).length;
    if (todayCount > 0) {
      return `Tu as ${todayCount} action${todayCount > 1 ? 's' : ''} pour aujourd'hui. Un pas à la fois.`;
    }

    // 5. Un objectif en sommeil — sans pression.
    if (inProgressGoals.some(g => !(data.tasks || []).some(t => t.goalId === g.id && !t.isCompleted))) {
      return "Un de tes objectifs attend peut-être un premier pas. Juste un coup d'œil, quand tu veux.";
    }

    return pick(GENERIC);
  } catch {
    return pick(GENERIC);
  }
}
