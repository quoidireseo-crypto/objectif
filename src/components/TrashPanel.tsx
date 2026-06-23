import { Trash2, RotateCcw, X, Flag, CheckSquare, ListChecks, Repeat, BookHeart } from 'lucide-react';
import { AppData, TrashKind } from '../types';
import { useTrash } from '../hooks/useTrash';

interface TrashPanelProps {
  data: AppData;
  updateData: (data: Partial<AppData>) => void;
}

const KIND_META: Record<TrashKind, { label: string; icon: any }> = {
  goal: { label: 'Objectif', icon: Flag },
  task: { label: 'Action', icon: CheckSquare },
  milestone: { label: 'Étape', icon: ListChecks },
  habit: { label: 'Habitude', icon: Repeat },
  journal: { label: 'Note', icon: BookHeart },
};

// Corbeille : liste les éléments supprimés, avec restauration ou suppression
// définitive. Filet de sécurité contre les suppressions accidentelles.
export function TrashPanel({ data, updateData }: TrashPanelProps) {
  const { trash, restore, purge, empty } = useTrash(data, updateData);

  return (
    <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 md:p-8 border border-stone-100 dark:border-stone-800 shadow-sm">
      <div className="flex items-center justify-between gap-4 mb-2">
        <h3 className="text-lg font-bold font-sans uppercase tracking-widest text-stone-800 dark:text-stone-100 flex items-center gap-2">
          <Trash2 className="w-5 h-5 text-stone-400 dark:text-stone-500" />
          Corbeille
        </h3>
        {trash.length > 0 && (
          <button
            onClick={() => { if (window.confirm('Vider définitivement la corbeille ? Cette action est irréversible.')) empty(); }}
            className="text-xs font-sans font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 hover:text-red-500 transition"
          >
            Vider
          </button>
        )}
      </div>
      <p className="text-sm text-stone-500 dark:text-stone-400 mb-5">
        Les éléments supprimés atterrissent ici. Tu peux les restaurer à tout moment.
      </p>

      {trash.length === 0 ? (
        <p className="text-sm italic text-stone-400 dark:text-stone-500 text-center py-6">
          La corbeille est vide.
        </p>
      ) : (
        <div className="space-y-2.5">
          {trash.map(entry => {
            const meta = KIND_META[entry.kind];
            const Icon = meta?.icon || Trash2;
            return (
              <div key={entry.id} className="flex items-center gap-3 bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-700 rounded-2xl px-4 py-3">
                <div className="p-2 rounded-xl bg-white dark:bg-stone-800 text-stone-400 dark:text-stone-500 shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-sans font-semibold text-stone-700 dark:text-stone-200 truncate">{entry.label || meta?.label}</p>
                  <p className="text-[10px] font-sans uppercase tracking-wider text-stone-400 dark:text-stone-500">
                    {meta?.label} · supprimé le {new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(new Date(entry.deletedAt))}
                  </p>
                </div>
                <button
                  onClick={() => restore(entry.id)}
                  className="flex items-center gap-1.5 text-xs font-sans font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 transition shrink-0"
                  title="Restaurer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Restaurer</span>
                </button>
                <button
                  onClick={() => { if (window.confirm('Supprimer définitivement cet élément ?')) purge(entry.id); }}
                  className="text-stone-300 dark:text-stone-600 hover:text-red-500 transition shrink-0 p-1"
                  title="Supprimer définitivement"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
