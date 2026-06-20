import { AppData, Goal } from '../types';
import { LIFE_PILLARS } from './lifePillars';

export type InsightPeriod = 'weekly' | 'monthly';

export interface InsightSummary {
  // Phrases d'observation, tirées des vraies données (2-3 max), de la plus
  // marquante à la plus secondaire.
  observations: string[];
  // L'éclairage : une seule suggestion concrète et douce, ou null.
  insight: string | null;
  // Vrai quand il y a trop peu de données pour dire quelque chose d'utile.
  isSparse: boolean;
}

const toStr = (d: Date) => d.toISOString().split('T')[0];
const plural = (n: number) => (n > 1 ? 's' : '');

// Construit un petit résumé en langage naturel à partir des données de
// l'utilisateur. 100 % local, sans IA. Chaque phrase s'appuie sur un fait réel ;
// on reste honnête (on nomme doucement ce qui est délaissé) et bref.
export function getInsightSummary(data: AppData, period: InsightPeriod): InsightSummary {
  try {
    const days = period === 'weekly' ? 7 : 30;
    const periodLabel = period === 'weekly' ? 'cette semaine' : 'ce mois-ci';

    const today = new Date();
    const todayStr = toStr(today);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - (days - 1));
    const cutoffStr = toStr(cutoff);

    const inPeriod = (d?: string) => !!d && d >= cutoffStr && d <= todayStr;

    // --- Faits bruts ---
    const periodTasks = (data.tasks || []).filter(t => inPeriod(t.date));
    const totalTasks = periodTasks.length;
    const completedTasks = periodTasks.filter(t => t.isCompleted).length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const moments = (data.eveningReflections || []).filter(r => inPeriod(r.date));

    const inProgressGoals = (data.goals || []).filter(g => g.status === 'En cours');
    const achievedGoals = (data.goals || []).filter(g => g.status === 'Atteint');

    const habits = (data.habits || []).filter(h => !h.isArchived);

    // Geste-clé : une habitude dont le domaine porte au moins 2 objectifs en cours.
    let leverHabit: { title: string; count: number } | null = null;
    for (const h of habits) {
      if (!h.domain) continue;
      const count = inProgressGoals.filter(g => g.domain === h.domain).length;
      if (count >= 2 && (!leverHabit || count > leverHabit.count)) {
        leverHabit = { title: h.title, count };
      }
    }

    // Domaine fragile et silencieux : ressenti <= 2 à la roue de la vie et aucun
    // objectif en cours rattaché.
    const latestAssessment = (data.lifeAssessments || [])
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date))[0];
    let silentPillar: string | null = null;
    if (latestAssessment) {
      const p = LIFE_PILLARS.find(p => {
        const score = latestAssessment.scores[p.domain];
        const hasGoal = inProgressGoals.some(g => g.domain === p.domain);
        return score !== undefined && score <= 2 && !hasGoal;
      });
      silentPillar = p ? p.domain : null;
    }

    // Objectifs en sommeil : en cours, sans aucune action à venir.
    const stalledGoals: Goal[] = inProgressGoals.filter(
      g => !(data.tasks || []).some(t => t.goalId === g.id && !t.isCompleted)
    );

    // Semaine surchargée (seulement en hebdo) : beaucoup d'actions restantes.
    const remainingThisPeriod = periodTasks.filter(t => !t.isCompleted).length;
    const isOverloaded = period === 'weekly' && remainingThisPeriod > 10;

    // --- Cas « pas assez de données » ---
    if (totalTasks === 0 && moments.length === 0 && inProgressGoals.length === 0 && achievedGoals.length === 0) {
      return {
        observations: [],
        insight: `Tu débutes — encore peu de traces pour en tirer un fil. Continue à noter tes moments et tes actions : d'ici quelques jours, un éclairage plus net apparaîtra ici.`,
        isSparse: true,
      };
    }

    // --- Observations (priorité : élan → moments → point d'appui → attention) ---
    const observations: string[] = [];

    // 1. Régularité / élan.
    if (completedTasks > 0 && completionRate >= 70) {
      observations.push(`Tu as tenu ${completedTasks} de tes ${totalTasks} action${plural(totalTasks)} ${periodLabel} — ton élan est réel.`);
    } else if (completedTasks > 0) {
      observations.push(`Tu as avancé sur ${completedTasks} action${plural(completedTasks)} ${periodLabel}, sur ${totalTasks} posée${plural(totalTasks)}.`);
    } else if (totalTasks > 0) {
      observations.push(`Tu avais posé ${totalTasks} action${plural(totalTasks)} ${periodLabel} ; aucune n'a encore abouti, et ce n'est pas grave.`);
    }

    // 2. Bons moments notés.
    const momentsThreshold = Math.ceil(days * 0.4);
    if (moments.length >= momentsThreshold && moments.length > 0) {
      observations.push(`Tu as gardé un bon moment ${moments.length} jour${plural(moments.length)} ${periodLabel}.`);
    } else if (moments.length > 0) {
      observations.push(`Tu as noté ${moments.length} bon moment${plural(moments.length)} ${periodLabel}.`);
    }

    // 3. Point d'appui (geste-clé) — uniquement si on a encore de la place.
    if (leverHabit && observations.length < 3) {
      observations.push(`Ton petit geste « ${leverHabit.title} » soutient ${leverHabit.count} de tes objectifs : c'est ton point d'appui.`);
    }

    // 4. Un point d'attention, en dernier (silencieux > sommeil).
    if (silentPillar) {
      observations.push(`En revanche, ton domaine « ${silentPillar} » est silencieux : aucun objectif ne s'y rattache en ce moment.`);
    } else if (stalledGoals.length > 0 && observations.length < 3) {
      observations.push(`${stalledGoals.length} de tes objectifs attend${stalledGoals.length > 1 ? 'ent' : ''} peut-être un premier pas.`);
    }

    // On garde au plus 3 phrases.
    const trimmed = observations.slice(0, 3);

    // --- Éclairage (une seule suggestion, par ordre de pertinence) ---
    let insight: string | null = null;
    if (isOverloaded) {
      insight = `Tu n'as pas à tout porter. Choisis les 2-3 actions qui comptent vraiment, et laisse le reste respirer.`;
    } else if (silentPillar) {
      insight = `Un seul petit geste vers « ${silentPillar} » ${periodLabel} suffirait à rééquilibrer l'ensemble.`;
    } else if (stalledGoals.length > 0) {
      insight = `Un premier petit pas sur « ${stalledGoals[0].title} » relancerait peut-être l'élan.`;
    } else if (habits.length === 0 && inProgressGoals.length > 0) {
      insight = `Une petite habitude régulière pourrait devenir le point d'appui de tes objectifs.`;
    } else if (moments.length < momentsThreshold) {
      insight = `Le soir, prends dix secondes pour noter un bon moment — même minuscule. C'est ce qui éclaire la durée.`;
    } else {
      insight = `Continue à ton rythme. Ce qui compte, c'est la régularité, pas la performance.`;
    }

    return { observations: trimmed, insight, isSparse: false };
  } catch {
    return { observations: [], insight: null, isSparse: true };
  }
}
