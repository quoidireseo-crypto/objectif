import { useState } from 'react';
import { X, Activity, Target, Heart, Briefcase, Coins, Sparkles, Home } from 'lucide-react';
import { Goal, LifeDomain } from '../types';

interface GoalEditModalProps {
  goal: Goal;
  onSave: (changes: { title: string; why: string; domain: LifeDomain; deadline?: string }) => void;
  onClose: () => void;
}

const DOMAINS: { label: LifeDomain; icon: any }[] = [
  { label: 'Santé & Bien-être', icon: Activity },
  { label: 'Projet Personnel', icon: Target },
  { label: 'Relations & Famille', icon: Heart },
  { label: 'Apprentissage', icon: Briefcase },
  { label: 'Finances', icon: Coins },
  { label: 'Spiritualité', icon: Sparkles },
  { label: 'Autre', icon: Home },
];

// Modale d'édition d'un objectif : titre, sens profond, domaine, échéance.
export function GoalEditModal({ goal, onSave, onClose }: GoalEditModalProps) {
  const [title, setTitle] = useState(goal.title);
  const [why, setWhy] = useState(goal.why);
  const [domain, setDomain] = useState<LifeDomain>(goal.domain);
  const [deadline, setDeadline] = useState(goal.deadline || '');

  const canSave = title.trim().length > 0 && why.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    onSave({ title: title.trim(), why: why.trim(), domain, deadline: deadline || undefined });
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-stone-900/50 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-white dark:bg-stone-900 rounded-t-3xl sm:rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl p-6 md:p-8 max-h-[90dvh] overflow-y-auto animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 font-sans"
      >
        <button
          onClick={onClose}
          aria-label="Fermer"
          className="absolute top-5 right-5 p-1.5 rounded-full text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-light text-stone-900 dark:text-stone-100 mb-6">Modifier l'objectif</h2>

        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wide mb-2">Intitulé</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 outline-none focus:ring-1 focus:ring-emerald-700 focus:border-emerald-700 text-stone-800 dark:text-stone-100 bg-white dark:bg-stone-800 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wide mb-2">Le sens profond</label>
            <textarea
              value={why}
              onChange={(e) => setWhy(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 outline-none focus:ring-1 focus:ring-emerald-700 focus:border-emerald-700 text-stone-800 dark:text-stone-100 bg-white dark:bg-stone-800 transition min-h-[90px] resize-y"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wide mb-3">Domaine de vie</label>
            <div className="flex flex-wrap gap-2">
              {DOMAINS.map((d) => {
                const Icon = d.icon;
                const selected = domain === d.label;
                return (
                  <button
                    key={d.label}
                    onClick={() => setDomain(d.label)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all text-sm ${
                      selected
                        ? 'border-emerald-700 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400'
                        : 'border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-bold">{d.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wide mb-2">Échéance (optionnel)</label>
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 outline-none focus:ring-1 focus:ring-emerald-700 focus:border-emerald-700 text-stone-800 dark:text-stone-100 bg-white dark:bg-stone-800 transition text-sm"
              />
              {deadline && (
                <button onClick={() => setDeadline('')} className="text-xs text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 underline">
                  Retirer
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-7 pt-5 border-t border-stone-100 dark:border-stone-800">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-bold uppercase tracking-widest text-xs text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="bg-stone-800 dark:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-stone-900 dark:hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
