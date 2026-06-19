import { useMemo, useState } from 'react';
import { AppData, LifeDomain, ViewType } from '../types';
import { LIFE_PILLARS } from '../lib/lifePillars';
import { LifeWheelAssessment } from './LifeWheelAssessment';
import { Compass, X, RefreshCw, ArrowRight, HelpCircle } from 'lucide-react';
import { HelpTooltip } from './HelpTooltip';

interface LifeBalancePanelProps {
  data: AppData;
  updateData: (data: Partial<AppData>) => void;
  onChangeView: (view: ViewType) => void;
}

// Tableau de bord — Équilibre de vie : croise le ressenti sur chaque pilier
// (roue de la vie) avec l'investissement réel (objectifs en cours), et invite
// doucement à prendre soin des piliers à la fois fragiles et délaissés.
export function LifeBalancePanel({ data, updateData, onChangeView }: LifeBalancePanelProps) {
  const [editing, setEditing] = useState(false);

  // Dernier bilan en date.
  const latest = useMemo(() => {
    const list = data.lifeAssessments || [];
    if (list.length === 0) return null;
    return [...list].sort((a, b) => b.date.localeCompare(a.date))[0];
  }, [data.lifeAssessments]);

  // Nombre d'objectifs en cours par pilier.
  const goalsByDomain = useMemo(() => {
    const map = {} as Record<LifeDomain, number>;
    data.goals.filter(g => g.status === 'En cours').forEach(g => {
      map[g.domain] = (map[g.domain] || 0) + 1;
    });
    return map;
  }, [data.goals]);

  const saveAssessment = (scores: Partial<Record<LifeDomain, number>>) => {
    updateData({
      lifeAssessments: [
        ...(data.lifeAssessments || []),
        {
          id: Date.now().toString(),
          date: new Date().toISOString().split('T')[0],
          scores,
        },
      ],
    });
    setEditing(false);
  };

  // Piliers à regarder : ressenti fragile (<= 2) et aucun objectif en cours.
  const toTendTo = latest
    ? LIFE_PILLARS.filter(p => {
        const score = latest.scores[p.domain];
        return score !== undefined && score <= 2 && !(goalsByDomain[p.domain] > 0);
      })
    : [];

  const header = (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
          <Compass className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-light text-stone-900 dark:text-stone-100">Équilibre de vie</h3>
            <HelpTooltip text="Ta roue de la vie : ton ressenti sur chaque pilier, croisé avec les objectifs que tu y as posés. Une façon de prendre soin de l'ensemble, pas d'un seul morceau." />
          </div>
          <p className="text-xs font-sans uppercase tracking-widest text-stone-400 dark:text-stone-500 mt-0.5">
            {latest
              ? `Ressenti du ${new Date(latest.date + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`
              : 'Pas encore évalué'}
          </p>
        </div>
      </div>
      {latest && (
        <button
          onClick={() => setEditing(true)}
          className="shrink-0 flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 font-sans uppercase tracking-widest hover:text-indigo-700 dark:hover:text-indigo-300 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="max-sm:hidden">Mettre à jour</span>
        </button>
      )}
    </div>
  );

  return (
    <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 md:p-8 border border-stone-100 dark:border-stone-800 shadow-sm mb-6">
      {header}

      {!latest ? (
        /* Invitation : aucun bilan encore (ex. utilisateurs existants) */
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-indigo-50/50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl px-5 py-5">
          <div className="flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5" />
            <p className="text-sm font-sans text-stone-600 dark:text-stone-300 leading-relaxed">
              Fais le point sur tes piliers de vie en une minute. Tu verras d'un coup d'œil ce qui t'épanouit
              et ce qui demande peut-être un peu d'attention.
            </p>
          </div>
          <button
            onClick={() => setEditing(true)}
            className="shrink-0 inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-500 dark:bg-indigo-600 text-white text-xs font-sans font-bold uppercase tracking-widest hover:bg-indigo-600 dark:hover:bg-indigo-700 transition cursor-pointer"
          >
            Faire le point
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <>
          {/* Les 6 piliers : ressenti + objectifs en cours */}
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3.5">
            {LIFE_PILLARS.map(pillar => {
              const score = latest.scores[pillar.domain];
              const goals = goalsByDomain[pillar.domain] || 0;
              return (
                <div key={pillar.domain} className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg ${pillar.soft} ${pillar.text} shrink-0`}>
                    <pillar.icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-sans font-bold text-stone-700 dark:text-stone-200 truncate">
                        {pillar.domain}
                      </p>
                      <span className="text-[10px] font-sans text-stone-400 dark:text-stone-500 shrink-0">
                        {goals > 0 ? `${goals} objectif${goals > 1 ? 's' : ''}` : '—'}
                      </span>
                    </div>
                    {/* Jauge de ressenti */}
                    <div className="flex gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map(v => (
                        <span
                          key={v}
                          className={`h-1.5 flex-1 rounded-full ${
                            score !== undefined && v <= score
                              ? pillar.bar
                              : 'bg-stone-200 dark:bg-stone-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Rappel doux : piliers fragiles et sans objectif */}
          {toTendTo.length > 0 && (
            <div className="mt-6 pt-5 border-t border-stone-100 dark:border-stone-800 flex items-start gap-3">
              <Compass className="w-4 h-4 text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-serif italic text-stone-600 dark:text-stone-300 leading-relaxed">
                  {toTendTo.length === 1 ? (
                    <>« {toTendTo[0].domain} » te tient à cœur mais reste fragile, sans objectif pour l'instant.</>
                  ) : (
                    <>Certains piliers te tiennent à cœur mais restent fragiles, sans objectif : {toTendTo.map(p => p.domain).join(', ')}.</>
                  )}
                </p>
                <button
                  onClick={() => onChangeView('goals')}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-sans font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Y poser un objectif ?
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modale d'évaluation */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 md:p-8 shadow-xl animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="text-xl font-light text-stone-900 dark:text-stone-100">Ta roue de la vie</h3>
                <p className="text-sm text-stone-500 dark:text-stone-400 font-light mt-0.5">
                  Note ton ressenti, de 1 à 5, sur chaque pilier.
                </p>
              </div>
              <button
                onClick={() => setEditing(false)}
                className="p-1.5 rounded-full text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <LifeWheelAssessment
              initial={latest?.scores}
              onSave={saveAssessment}
              onSkip={() => setEditing(false)}
              saveLabel="Enregistrer"
              skipLabel="Annuler"
            />
          </div>
        </div>
      )}
    </div>
  );
}
