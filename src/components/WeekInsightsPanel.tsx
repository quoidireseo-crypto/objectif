import { useMemo } from 'react';
import { AppData, ViewType } from '../types';
import { Gauge, Repeat, ArrowRight, Sparkles } from 'lucide-react';
import { LIFE_PILLARS } from '../lib/lifePillars';

interface WeekInsightsPanelProps {
  data: AppData;
  onChangeView: (view: ViewType) => void;
}

const toStr = (d: Date) => d.toISOString().split('T')[0];

// Deux lectures « recul » de la semaine : la charge (prévenir la surcharge) et
// l'habitude-levier (le petit geste régulier qui soutient le plus).
export function WeekInsightsPanel({ data, onChangeView }: WeekInsightsPanelProps) {
  const { weekStart, weekEnd } = useMemo(() => {
    const now = new Date();
    const diffToMonday = (now.getDay() + 6) % 7; // lundi = début de semaine
    const monday = new Date(now);
    monday.setDate(now.getDate() - diffToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { weekStart: toStr(monday), weekEnd: toStr(sunday) };
  }, []);

  const week = useMemo(() => {
    const inWeek = data.tasks.filter(t => t.date >= weekStart && t.date <= weekEnd);
    const planned = inWeek.length;
    const done = inWeek.filter(t => t.isCompleted).length;
    const remaining = planned - done;

    let level: 'light' | 'balanced' | 'heavy' = 'light';
    if (remaining > 10) level = 'heavy';
    else if (remaining >= 5) level = 'balanced';

    return { planned, done, remaining, level };
  }, [data.tasks, weekStart, weekEnd]);

  // Habitude-levier : celle dont le domaine porte le plus d'objectifs en cours ;
  // à défaut, l'ancre la plus régulière des 14 derniers jours.
  const lever = useMemo(() => {
    const habits = (data.habits || []).filter(h => !h.isArchived);
    if (habits.length === 0) return null;

    const inProgressGoals = data.goals.filter(g => g.status === 'En cours');

    let best = habits[0];
    let bestGoals = 0;
    for (const h of habits) {
      if (!h.domain) continue;
      const c = inProgressGoals.filter(g => g.domain === h.domain).length;
      if (c > bestGoals) {
        bestGoals = c;
        best = h;
      }
    }

    if (bestGoals > 0) {
      return { habit: best, byDomain: true, goalCount: bestGoals };
    }

    // Repli : régularité sur 14 jours.
    const since = toStr(new Date(Date.now() - 13 * 86400000));
    const recent = (data.habitCompletions || []).filter(c => c.date >= since);
    let anchor = habits[0];
    let anchorCount = -1;
    for (const h of habits) {
      const c = recent.filter(rc => rc.habitId === h.id).length;
      if (c > anchorCount) {
        anchorCount = c;
        anchor = h;
      }
    }
    return { habit: anchor, byDomain: false, completions: Math.max(0, anchorCount) };
  }, [data.habits, data.goals, data.habitCompletions]);

  const loadMeta = {
    light: { label: 'Légère', bar: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', width: 'w-1/3' },
    balanced: { label: 'Équilibrée', bar: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', width: 'w-2/3' },
    heavy: { label: 'Chargée', bar: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', width: 'w-full' },
  }[week.level];

  const pillarText = (domain?: string) =>
    LIFE_PILLARS.find(p => p.domain === domain)?.text || 'text-stone-500 dark:text-stone-400';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Charge de la semaine */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-100 dark:border-stone-800 shadow-sm flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-xl">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-light text-stone-900 dark:text-stone-100">Charge de la semaine</h3>
            <p className={`text-xs font-sans uppercase tracking-widest mt-0.5 ${loadMeta.text}`}>
              {loadMeta.label}
            </p>
          </div>
        </div>

        {week.planned === 0 ? (
          <p className="text-sm text-stone-500 dark:text-stone-400 italic flex-1">
            Aucune action prévue cette semaine pour l'instant. Tout reste possible.
          </p>
        ) : (
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-light text-stone-900 dark:text-stone-100">{week.remaining}</span>
              <span className="text-sm text-stone-400 dark:text-stone-500 font-sans">
                action{week.remaining > 1 ? 's' : ''} à venir cette semaine
              </span>
            </div>
            <div className="h-2 w-full bg-stone-100 dark:bg-stone-800 rounded-full mt-4 overflow-hidden">
              <div className={`h-full rounded-full ${loadMeta.bar} ${loadMeta.width} transition-all`} />
            </div>
            <p className="text-xs text-stone-400 dark:text-stone-500 font-sans mt-2">
              {week.done} déjà faite{week.done > 1 ? 's' : ''} sur {week.planned} cette semaine.
            </p>
          </div>
        )}

        {week.level === 'heavy' && (
          <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-800 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-sm font-serif italic text-stone-600 dark:text-stone-300 leading-relaxed">
              Semaine chargée — protège ton énergie. Et si tu choisissais l'essentiel, et laissais le reste respirer ?
            </p>
          </div>
        )}
      </div>

      {/* Habitude-levier */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-100 dark:border-stone-800 shadow-sm flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-xl">
            <Repeat className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-light text-stone-900 dark:text-stone-100">Ton habitude-levier</h3>
            <p className="text-xs font-sans uppercase tracking-widest text-stone-400 dark:text-stone-500 mt-0.5">
              Petit geste, grand effet
            </p>
          </div>
        </div>

        {!lever ? (
          <div className="flex-1 flex flex-col justify-between gap-4">
            <p className="text-sm text-stone-500 dark:text-stone-400 italic">
              Une habitude est un petit geste régulier qui soutient plusieurs objectifs à la fois. Tu n'en as pas encore.
            </p>
            <button
              onClick={() => onChangeView('habits')}
              className="self-start inline-flex items-center gap-1.5 text-sm text-emerald-700 dark:text-emerald-400 font-sans uppercase tracking-widest hover:text-emerald-800 dark:hover:text-emerald-300 transition"
            >
              Créer une habitude
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex-1">
            <p className={`text-xl font-serif italic leading-snug ${pillarText(lever.habit.domain)}`}>
              « {lever.habit.title} »
            </p>
            <p className="text-sm text-stone-600 dark:text-stone-300 font-sans mt-3 leading-relaxed">
              {lever.byDomain ? (
                <>
                  En la tenant, tu nourris <strong>{lever.goalCount} objectif{lever.goalCount! > 1 ? 's' : ''}</strong> du
                  domaine {lever.habit.domain}. C'est ton point d'appui.
                </>
              ) : (
                <>C'est ton ancre la plus régulière ces temps-ci. Souvent, c'est sur ce petit geste que tout le reste s'appuie.</>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
