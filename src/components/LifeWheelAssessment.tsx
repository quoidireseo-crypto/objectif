import { useState } from 'react';
import { LifeDomain } from '../types';
import { LIFE_PILLARS } from '../lib/lifePillars';

interface LifeWheelAssessmentProps {
  initial?: Partial<Record<LifeDomain, number>>;
  onSave: (scores: Partial<Record<LifeDomain, number>>) => void;
  onSkip?: () => void;
  saveLabel?: string;
  skipLabel?: string;
}

// Évaluation des 6 piliers de vie : pour chacun, un ressenti de 1 (fragile) à
// 5 (épanoui). Réutilisé à l'onboarding et depuis le tableau de bord.
export function LifeWheelAssessment({
  initial,
  onSave,
  onSkip,
  saveLabel = 'Valider',
  skipLabel,
}: LifeWheelAssessmentProps) {
  const [scores, setScores] = useState<Partial<Record<LifeDomain, number>>>(initial || {});
  const ratedCount = Object.keys(scores).length;

  const setScore = (domain: LifeDomain, value: number) => {
    setScores(prev => ({ ...prev, [domain]: value }));
  };

  return (
    <div>
      <div className="space-y-2.5">
        {LIFE_PILLARS.map(pillar => {
          const Icon = pillar.icon;
          const current = scores[pillar.domain] || 0;
          return (
            <div
              key={pillar.domain}
              className="flex items-center gap-3 p-2.5 rounded-2xl bg-stone-50/70 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-700/60"
            >
              <div className={`p-2 rounded-xl ${pillar.soft} ${pillar.text} shrink-0`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-sans font-bold text-stone-700 dark:text-stone-200 truncate leading-tight">
                  {pillar.domain}
                </p>
                <p className="text-[11px] font-sans text-stone-400 dark:text-stone-500 truncate">
                  {pillar.short}
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                {[1, 2, 3, 4, 5].map(v => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setScore(pillar.domain, v)}
                    title={`${v} sur 5`}
                    aria-label={`${pillar.domain} : ${v} sur 5`}
                    className={`w-5 h-7 sm:w-6 rounded-md transition-all hover:scale-110 cursor-pointer ${
                      v <= current ? pillar.bar : 'bg-stone-200 dark:bg-stone-700'
                    }`}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-3 mt-5">
        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="flex-1 border-2 border-stone-150 dark:border-stone-700 py-3 px-4 rounded-2xl font-sans text-xs uppercase tracking-widest font-bold text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 active:scale-98 transition-all cursor-pointer"
          >
            {skipLabel || 'Plus tard'}
          </button>
        )}
        <button
          type="button"
          onClick={() => onSave(scores)}
          disabled={ratedCount === 0}
          className="flex-[2] bg-[#047857] dark:bg-emerald-700 text-[#FFFBEB] py-3 px-4 rounded-2xl font-sans text-xs uppercase tracking-widest font-bold hover:bg-[#059669] dark:hover:bg-emerald-800 active:scale-98 disabled:opacity-45 disabled:hover:bg-[#047857] transition-all shadow-sm cursor-pointer"
        >
          {saveLabel}
        </button>
      </div>
    </div>
  );
}
