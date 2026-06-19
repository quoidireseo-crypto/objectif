import { useMemo } from 'react';
import { AppData, Goal, LifeDomain, ViewType } from '../types';
import { Link2, AlertTriangle, ArrowRight, Spline } from 'lucide-react';
import { LIFE_PILLARS } from '../lib/lifePillars';
import { HelpTooltip } from './HelpTooltip';

interface GoalRelationsPanelProps {
  data: AppData;
  onChangeView: (view: ViewType) => void;
}

const domainText = (domain: LifeDomain) =>
  LIFE_PILLARS.find(p => p.domain === domain)?.text || 'text-stone-600 dark:text-stone-300';

// Rend visibles les arbitrages entre objectifs : ceux qui se renforcent
// (même domaine) et ceux qui se disputent ton énergie (trop nombreux, ou
// échéances rapprochées). Le cœur de l'approche systémique.
export function GoalRelationsPanel({ data, onChangeView }: GoalRelationsPanelProps) {
  const inProgressGoals = useMemo(
    () => data.goals.filter(g => g.status === 'En cours'),
    [data.goals]
  );

  // Synergies : domaines portant au moins 2 objectifs en cours.
  const synergies = useMemo(() => {
    const byDomain = {} as Record<LifeDomain, Goal[]>;
    inProgressGoals.forEach(g => {
      (byDomain[g.domain] = byDomain[g.domain] || []).push(g);
    });
    return (Object.entries(byDomain) as [LifeDomain, Goal[]][])
      .filter(([, list]) => list.length >= 2)
      .map(([domain, list]) => ({ domain, goals: list }));
  }, [inProgressGoals]);

  // Échéances rapprochées : objectifs en cours dont la date butoir tombe dans
  // les 21 prochains jours.
  const closeDeadlines = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const horizon = new Date(today);
    horizon.setDate(today.getDate() + 21);
    return inProgressGoals.filter(g => {
      if (!g.deadline) return false;
      const d = new Date(g.deadline);
      return d >= today && d <= horizon;
    });
  }, [inProgressGoals]);

  const overloaded = inProgressGoals.length >= 4;
  const hasTension = overloaded || closeDeadlines.length >= 2;

  // Rien de notable à signaler : on n'encombre pas le tableau de bord.
  if (synergies.length === 0 && !hasTension) return null;

  return (
    <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 md:p-8 border border-stone-100 dark:border-stone-800 shadow-sm mb-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="p-2.5 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-xl">
          <Spline className="w-5 h-5" />
        </div>
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-light text-stone-900 dark:text-stone-100">Tensions & synergies</h3>
          <HelpTooltip text="Tes objectifs ne vivent pas seuls : certains se renforcent, d'autres se disputent ton temps et ton énergie. Voici ce qui se joue entre eux." />
        </div>
      </div>

      <div className="space-y-5">
        {/* Synergies */}
        {synergies.map(syn => (
          <div key={syn.domain} className="flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
              <Link2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-sans text-stone-700 dark:text-stone-200 leading-relaxed">
                <span className={`font-bold ${domainText(syn.domain)}`}>{syn.domain}</span> — {syn.goals.length} objectifs
                avancent dans la même direction.
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-sans mt-1 leading-relaxed">
                Une seule action peut souvent en servir plusieurs : {syn.goals.map(g => `« ${g.title} »`).join(', ')}.
              </p>
            </div>
          </div>
        ))}

        {/* Tensions */}
        {(overloaded || closeDeadlines.length >= 2) && (
          <div className={`flex items-start gap-3 ${synergies.length > 0 ? 'pt-5 border-t border-stone-100 dark:border-stone-800' : ''}`}>
            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              {overloaded && (
                <p className="text-sm font-sans text-stone-700 dark:text-stone-200 leading-relaxed">
                  Tu poursuis <strong>{inProgressGoals.length} objectifs</strong> en même temps. Ils se disputent ton
                  temps et ton énergie — et si tu en mettais un ou deux en pause, pour mieux avancer sur le reste ?
                </p>
              )}
              {closeDeadlines.length >= 2 && (
                <p className={`text-sm font-sans text-stone-700 dark:text-stone-200 leading-relaxed ${overloaded ? 'mt-2' : ''}`}>
                  <strong>{closeDeadlines.length} échéances</strong> se rapprochent en même temps. Anticipe pour ne pas
                  tout subir d'un coup.
                </p>
              )}
              <button
                onClick={() => onChangeView('goals')}
                className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-sans font-bold text-amber-700 dark:text-amber-400 hover:underline"
              >
                Revoir mes objectifs
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
