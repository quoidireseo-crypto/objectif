import { Check, Circle, ArrowRight, Compass, X } from 'lucide-react';
import { AppData, ViewType } from '../types';

interface FirstStepsCardProps {
  data: AppData;
  userProfile: { name: string } | null;
  onChangeView: (view: ViewType) => void;
  onDismiss: () => void;
}

// Parcours « Premiers pas » : une checklist guidée pour les nouveaux utilisateurs.
// Chaque étape se coche d'elle-même quand elle est accomplie ; la carte disparaît
// une fois tout terminé. Apprendre la logique de l'app en faisant.
export function FirstStepsCard({ data, userProfile, onChangeView, onDismiss }: FirstStepsCardProps) {
  const steps = [
    {
      id: 'profile',
      label: 'Te présenter',
      hint: 'Bien joué, c\'est fait !',
      done: !!userProfile?.name,
      view: null as ViewType | null,
    },
    {
      id: 'goal',
      label: 'Définir ton premier objectif',
      hint: 'Ce qui compte pour toi, et pourquoi.',
      done: (data.goals || []).length > 0,
      view: 'goals' as ViewType,
    },
    {
      id: 'action',
      label: 'Ajouter ta première action',
      hint: 'Un petit pas concret pour avancer.',
      done: (data.tasks || []).length > 0,
      view: 'tasks' as ViewType,
    },
    {
      id: 'moment',
      label: 'Noter ton premier bon moment',
      hint: 'Ce soir, plus bas sur cet écran.',
      done: (data.eveningReflections || []).length > 0,
      view: null as ViewType | null,
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  const allDone = doneCount === steps.length;

  // Une fois tout accompli, la carte n'a plus de raison d'être.
  if (allDone) return null;

  // La prochaine étape à accomplir (première non faite), mise en avant.
  const nextStepId = steps.find((s) => !s.done)?.id;

  return (
    <div className="relative bg-gradient-to-br from-emerald-50/80 to-white dark:from-emerald-500/10 dark:to-stone-900 border border-emerald-100 dark:border-emerald-500/20 rounded-3xl p-6 md:p-7 shadow-sm mb-6 animate-in fade-in slide-in-from-top-2 duration-500">
      <button
        onClick={onDismiss}
        aria-label="Masquer les premiers pas"
        title="Masquer"
        className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-2.5 mb-1">
        <div className="p-2 bg-emerald-100/80 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 rounded-xl">
          <Compass className="w-4 h-4" />
        </div>
        <h3 className="text-[11px] font-sans font-bold uppercase tracking-[0.18em] text-emerald-800 dark:text-emerald-400">
          Premiers pas
        </h3>
      </div>
      <p className="text-stone-600 dark:text-stone-300 font-serif text-base md:text-lg leading-snug mb-1">
        Bienvenue{userProfile?.name ? `, ${userProfile.name}` : ''} — voici par où commencer.
      </p>
      <p className="text-xs font-sans text-stone-400 dark:text-stone-500 mb-5">{doneCount} / {steps.length} accompli{doneCount > 1 ? 's' : ''}</p>

      <ul className="space-y-2">
        {steps.map((step) => {
          const isNext = step.id === nextStepId;
          const clickable = !step.done && !!step.view;
          return (
            <li key={step.id}>
              <button
                onClick={() => step.view && onChangeView(step.view)}
                disabled={!clickable}
                className={`w-full flex items-center gap-3 text-left rounded-2xl px-3 py-2.5 transition ${
                  clickable ? 'hover:bg-white dark:hover:bg-stone-800 cursor-pointer' : 'cursor-default'
                } ${isNext ? 'bg-white dark:bg-stone-800 shadow-xs ring-1 ring-emerald-200/70 dark:ring-emerald-500/20' : ''}`}
              >
                <span
                  className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition ${
                    step.done
                      ? 'bg-emerald-500 text-white'
                      : 'border-2 border-stone-300 dark:border-stone-600 text-transparent'
                  }`}
                >
                  {step.done ? <Check className="w-3.5 h-3.5" /> : <Circle className="w-2 h-2" />}
                </span>
                <span className="flex-1 min-w-0">
                  <span
                    className={`block text-sm font-sans font-semibold ${
                      step.done
                        ? 'text-stone-400 dark:text-stone-500 line-through'
                        : 'text-stone-800 dark:text-stone-100'
                    }`}
                  >
                    {step.label}
                  </span>
                  <span className="block text-xs font-sans text-stone-400 dark:text-stone-500 mt-0.5">{step.hint}</span>
                </span>
                {clickable && (
                  <ArrowRight className={`w-4 h-4 shrink-0 ${isNext ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-300 dark:text-stone-600'}`} />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
