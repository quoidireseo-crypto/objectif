import { Target, ChevronRight, Circle } from 'lucide-react';
import { OrphanItem, OrphanReason } from '../types';

interface OrphanCardProps {
  key?: string;
  orphan: OrphanItem;
  onReactivate: (orphan: OrphanItem) => void;
  onArchive: (orphan: OrphanItem) => void;
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
  'task-no-goal': "Cette action n'est reliée à aucun cap.",
  'milestone-abandoned': "Cette étape n'a pas eu de suite.",
  'goal-inactive': "Cet objectif n'a pas été touché depuis longtemps.",
};

export function OrphanCard({ orphan, onReactivate, onArchive }: OrphanCardProps) {
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

        {/* Action Buttons: group hover in desktop, visible always in mobile */}
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
      </div>
    </div>
  );
}
