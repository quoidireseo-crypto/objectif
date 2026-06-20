import { Eye, Lightbulb, ArrowRight } from 'lucide-react';
import { AppData, ViewType } from '../types';
import { getInsightSummary, InsightPeriod } from '../lib/insightSummary';

interface InsightCardProps {
  data: AppData;
  period: InsightPeriod;
  // 'full' : paragraphe complet (Bilan). 'compact' : version courte + lien (Accueil).
  variant?: 'full' | 'compact';
  onSeeMore?: (view: ViewType) => void;
}

// « Ce que je remarque » — un court résumé en mots des données de l'utilisateur,
// avec un éclairage doux. 100 % local, sans IA.
export function InsightCard({ data, period, variant = 'full', onSeeMore }: InsightCardProps) {
  const { observations, insight, isSparse } = getInsightSummary(data, period);

  // Rien d'utile à dire et pas de message de secours : on n'affiche rien.
  if (isSparse && !insight) return null;

  // Sur l'Accueil (version courte), on n'affiche pas le message « tu débutes » :
  // la carte « Premiers pas » couvre déjà ce moment. Il reste visible dans le Bilan.
  if (isSparse && variant === 'compact') return null;

  // En version courte, on ne montre que la première observation (la plus marquante).
  const shownObservations = variant === 'compact' ? observations.slice(0, 1) : observations;
  const paragraph = shownObservations.join(' ');

  return (
    <div className="bg-gradient-to-br from-stone-50 to-white dark:from-stone-800/60 dark:to-stone-900 border border-stone-150 dark:border-stone-800 rounded-3xl p-6 md:p-7 shadow-sm mb-6">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-xl">
          <Eye className="w-4 h-4" />
        </div>
        <h3 className="text-[11px] font-sans font-bold uppercase tracking-[0.22em] text-stone-500 dark:text-stone-400">
          Ce que je remarque
        </h3>
      </div>

      {paragraph && (
        <p className="font-serif text-base md:text-lg leading-relaxed text-stone-700 dark:text-stone-200">
          {paragraph}
        </p>
      )}

      {insight && (
        <div className="flex items-start gap-2.5 mt-4 bg-amber-50/70 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-2xl px-4 py-3">
          <Lightbulb className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-sm text-stone-700 dark:text-stone-200 font-sans italic leading-relaxed">
            {insight}
          </p>
        </div>
      )}

      {variant === 'compact' && onSeeMore && (
        <button
          onClick={() => onSeeMore('review')}
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-sans font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 transition cursor-pointer"
        >
          Voir mon bilan complet
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
