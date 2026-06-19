import { useState } from 'react';
import { Target, ChevronRight, Circle, Clock, BatteryLow, HelpCircle, Wind, Users, ArrowLeft } from 'lucide-react';
import { OrphanItem, OrphanReason } from '../types';

interface OrphanCardProps {
  key?: string;
  orphan: OrphanItem;
  onReactivate: (orphan: OrphanItem) => void;
  onArchive: (orphan: OrphanItem) => void;
  onPauseGoal: (orphan: OrphanItem) => void;
  onBreakDown: (orphan: OrphanItem) => void;
}

const BADGE_TEXTS: Record<OrphanReason, string> = {
  'goal-no-action': 'Aucune action liée',
  'goal-no-milestone': 'Pas encore découpé',
  'task-no-goal': 'Action isolée',
  'milestone-abandoned': 'Étape sans suite',
  'goal-inactive': 'En sommeil',
};

const GENTLE_MESSAGES: Record<OrphanReason, string> = {
  'goal-no-action': 'Cet objectif attend une première action.',
  'goal-no-milestone': "Il n'a pas encore été découpé en étapes.",
  'task-no-goal': "Cette action n'est reliée à aucun objectif.",
  'milestone-abandoned': "Cette étape n'a pas eu de suite.",
  'goal-inactive': "Cet objectif n'a pas été touché depuis longtemps.",
};

// Les causes possibles d'un blocage, et la réponse douce associée.
type CauseId = 'time' | 'energy' | 'unclear' | 'desire' | 'external';

const CAUSES: { id: CauseId; label: string; icon: typeof Clock }[] = [
  { id: 'time', label: 'Pas le temps en ce moment', icon: Clock },
  { id: 'energy', label: "Pas l'énergie", icon: BatteryLow },
  { id: 'unclear', label: 'Pas clair, trop gros', icon: HelpCircle },
  { id: 'desire', label: 'Plus vraiment envie', icon: Wind },
  { id: 'external', label: 'Ça dépend de quelqu\'un', icon: Users },
];

type ActionKind = 'pause' | 'letgo' | 'breakdown';

const RESPONSES: Record<CauseId, { msg: string; actions: ActionKind[]; note?: string }> = {
  time: {
    msg: "Le temps reviendra. Mets-le en pause sans culpabilité — il t'attendra, prêt à repartir.",
    actions: ['pause'],
  },
  energy: {
    msg: "Prends soin de toi d'abord. Range-le un moment ; tu le retrouveras quand tu seras prêt(e).",
    actions: ['pause'],
  },
  unclear: {
    msg: "Souvent, un objectif cale parce qu'il est trop gros. Découpe-le en un tout petit premier pas concret.",
    actions: ['breakdown', 'pause'],
  },
  desire: {
    msg: "C'est ok de tourner la page. Honore ce que ce projet t'a appris, puis range-le l'esprit léger.",
    actions: ['letgo'],
    note: 'Tu pourras le supprimer définitivement dans Mes objectifs.',
  },
  external: {
    msg: "Ce qui dépend des autres demande de la patience. Mets-le en pause en attendant le bon moment.",
    actions: ['pause'],
  },
};

export function OrphanCard({ orphan, onReactivate, onArchive, onPauseGoal, onBreakDown }: OrphanCardProps) {
  const isGoal = orphan.type === 'goal';
  const [diagnosing, setDiagnosing] = useState(false);
  const [cause, setCause] = useState<CauseId | null>(null);

  const Icon = orphan.type === 'goal'
    ? Target
    : orphan.type === 'milestone'
    ? ChevronRight
    : Circle;

  const iconColor = orphan.type === 'goal'
    ? 'text-amber-600'
    : orphan.type === 'milestone'
    ? 'text-stone-500'
    : 'text-stone-400';

  const badgeColorStyleChanged =
    orphan.reason === 'goal-inactive' || orphan.reason === 'milestone-abandoned'
      ? 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20'
      : orphan.reason === 'goal-no-action'
      ? 'text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700'
      : 'text-stone-500 dark:text-stone-400 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700';

  const actionButton = (kind: ActionKind) => {
    if (kind === 'breakdown') {
      return (
        <button
          key={kind}
          type="button"
          onClick={() => onBreakDown(orphan)}
          className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 rounded-xl px-4 py-2 text-xs font-sans font-bold uppercase tracking-wider hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition cursor-pointer"
        >
          Découper en une petite action
        </button>
      );
    }
    return (
      <button
        key={kind}
        type="button"
        onClick={() => onPauseGoal(orphan)}
        className="bg-white dark:bg-stone-900 text-stone-500 dark:text-stone-400 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-2 text-xs font-sans font-bold uppercase tracking-wider hover:text-stone-700 dark:hover:text-stone-200 transition cursor-pointer"
      >
        {kind === 'letgo' ? "Le ranger pour l'instant" : 'Mettre en pause'}
      </button>
    );
  };

  return (
    <div className="flex items-start gap-4 p-5 bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-2xl hover:border-amber-200 dark:hover:border-amber-500/30 hover:bg-amber-50/30 dark:hover:bg-amber-500/10 transition-all duration-300 group">
      {/* Type Icon */}
      <div className={`p-2 bg-white dark:bg-stone-900 rounded-xl shadow-xs border border-stone-100/50 dark:border-stone-800 shrink-0 ${iconColor}`}>
        <Icon className="w-5 h-5 shrink-0" />
      </div>

      {/* Main Container */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className={`text-[10px] font-sans font-bold uppercase tracking-widest px-2 py-1 rounded-lg ${badgeColorStyleChanged}`}>
            {BADGE_TEXTS[orphan.reason]}
          </span>
        </div>

        <h4 className="font-serif font-light text-stone-800 dark:text-stone-100 text-base leading-snug break-words">
          {orphan.title}
        </h4>

        {orphan.linkedGoalTitle && (
          <p className="text-xs text-stone-400 dark:text-stone-500 font-sans italic mt-1 truncate">
            ↳ {orphan.linkedGoalTitle}
          </p>
        )}

        <p className="text-xs text-stone-400 dark:text-stone-500 font-sans mt-2">
          Inactif depuis {orphan.daysSinceLastActivity} {orphan.daysSinceLastActivity > 1 ? 'jours' : 'jour'}
        </p>

        <p className="text-xs italic text-stone-500 dark:text-stone-400 mt-2 leading-relaxed">
          {GENTLE_MESSAGES[orphan.reason]}
        </p>

        {/* Actions */}
        {!isGoal ? (
          /* Tâches / étapes : comportement existant */
          <div className="flex items-center gap-2 mt-4 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-wrap">
            <button
              type="button"
              onClick={() => onReactivate(orphan)}
              className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 rounded-xl px-4 py-2 text-xs font-sans font-bold uppercase tracking-wider hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition cursor-pointer"
            >
              Réactiver
            </button>
            <button
              type="button"
              onClick={() => onArchive(orphan)}
              className="bg-white dark:bg-stone-900 text-stone-400 dark:text-stone-500 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-2 text-xs font-sans font-bold uppercase tracking-wider hover:text-stone-600 dark:hover:text-stone-300 transition cursor-pointer"
            >
              Archiver
            </button>
          </div>
        ) : !diagnosing ? (
          /* Objectif : point d'entrée du diagnostic doux */
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            <button
              type="button"
              onClick={() => onReactivate(orphan)}
              className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 rounded-xl px-4 py-2 text-xs font-sans font-bold uppercase tracking-wider hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition cursor-pointer"
            >
              Reprendre
            </button>
            <button
              type="button"
              onClick={() => setDiagnosing(true)}
              className="bg-white dark:bg-stone-900 text-stone-500 dark:text-stone-400 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-2 text-xs font-sans font-bold uppercase tracking-wider hover:text-stone-700 dark:hover:text-stone-200 transition cursor-pointer"
            >
              Qu'est-ce qui bloque ?
            </button>
          </div>
        ) : cause === null ? (
          /* Choix de la cause, sans jugement */
          <div className="mt-4">
            <p className="text-xs font-sans text-stone-500 dark:text-stone-400 mb-2.5">
              Qu'est-ce qui bloque, sans te juger ?
            </p>
            <div className="flex flex-col gap-2">
              {CAUSES.map(c => {
                const CIcon = c.icon;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCause(c.id)}
                    className="flex items-center gap-2.5 text-left px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-sm font-sans text-stone-600 dark:text-stone-300 hover:border-amber-300 dark:hover:border-amber-500/40 hover:bg-amber-50/40 dark:hover:bg-amber-500/5 transition cursor-pointer"
                  >
                    <CIcon className="w-4 h-4 text-stone-400 dark:text-stone-500 shrink-0" />
                    {c.label}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setDiagnosing(false)}
              className="flex items-center gap-1.5 mt-3 text-[11px] font-sans font-bold uppercase tracking-widest text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition cursor-pointer"
            >
              <ArrowLeft className="w-3 h-3" />
              Retour
            </button>
          </div>
        ) : (
          /* Réponse adaptée à la cause */
          <div className="mt-4">
            <p className="text-sm font-serif italic text-stone-600 dark:text-stone-300 leading-relaxed">
              {RESPONSES[cause].msg}
            </p>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {RESPONSES[cause].actions.map(a => actionButton(a))}
            </div>
            {RESPONSES[cause].note && (
              <p className="text-[11px] text-stone-400 dark:text-stone-500 font-sans mt-2.5">
                {RESPONSES[cause].note}
              </p>
            )}
            <button
              type="button"
              onClick={() => setCause(null)}
              className="flex items-center gap-1.5 mt-3 text-[11px] font-sans font-bold uppercase tracking-widest text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition cursor-pointer"
            >
              <ArrowLeft className="w-3 h-3" />
              Une autre raison
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
