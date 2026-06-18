import { useMemo, useState } from 'react';
import { AppData, ViewType } from '../types';
import { Sprout, ArrowRight, X } from 'lucide-react';

interface NextActionNudgeProps {
  data: AppData;
  onChangeView: (view: ViewType) => void;
}

// Rappel doux : signale, sans presser, les objectifs en cours qui n'ont aucune
// prochaine action concrète. On peut l'écarter pour la journée.
export function NextActionNudge({ data, onChangeView }: NextActionNudgeProps) {
  const todayDate = new Date().toISOString().split('T')[0];

  const [dismissed, setDismissed] = useState(
    () => window.localStorage.getItem('skopos_nextaction_nudge') === todayDate
  );
  const dismiss = () => {
    window.localStorage.setItem('skopos_nextaction_nudge', todayDate);
    setDismissed(true);
  };

  // Objectifs en cours sans aucune action reliée encore à faire.
  const stalledGoals = useMemo(
    () => data.goals.filter(
      g => g.status === 'En cours' &&
        !data.tasks.some(t => t.goalId === g.id && !t.isCompleted)
    ),
    [data.goals, data.tasks]
  );

  if (dismissed || stalledGoals.length === 0) return null;

  const count = stalledGoals.length;

  return (
    <div className="relative bg-amber-50/60 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/20 rounded-3xl p-5 md:p-6 mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <button
        onClick={dismiss}
        className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-amber-100/60 dark:hover:bg-amber-500/10 transition cursor-pointer"
        title="Masquer pour aujourd'hui"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-4 pr-6">
        <div className="p-2.5 bg-white dark:bg-stone-800 border border-amber-100 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-2xl shrink-0">
          <Sprout className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="font-serif text-base md:text-lg text-stone-700 dark:text-stone-200 leading-snug">
            {count === 1
              ? <>« {stalledGoals[0].title} » attend son premier pas.</>
              : <>{count} de tes objectifs attendent un premier pas.</>}
          </p>
          <p className="text-sm text-stone-500 dark:text-stone-400 font-light mt-1">
            Quand tu te sens prêt(e), pose une petite action — rien d'autre pour l'instant.
          </p>

          {count > 1 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {stalledGoals.slice(0, 4).map(g => (
                <span
                  key={g.id}
                  className="px-2.5 py-1 rounded-full bg-white/70 dark:bg-stone-800 border border-amber-100 dark:border-amber-500/20 text-xs font-sans text-stone-600 dark:text-stone-300 max-w-[12rem] truncate"
                >
                  {g.title}
                </span>
              ))}
              {count > 4 && (
                <span className="px-2.5 py-1 text-xs font-sans text-stone-400 dark:text-stone-500">
                  + {count - 4} autre{count - 4 > 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}

          <button
            onClick={() => onChangeView('tasks')}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/90 dark:bg-amber-600 text-white text-xs font-sans font-bold uppercase tracking-widest hover:bg-amber-500 dark:hover:bg-amber-700 transition cursor-pointer"
          >
            Poser une action
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
