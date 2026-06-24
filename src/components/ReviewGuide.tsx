import { TrendingUp, TrendingDown, Minus, CalendarDays, Compass, Repeat, Flag, Lightbulb, Clock, Moon } from 'lucide-react';
import { AppData } from '../types';
import { getReviewGuide, GuidePeriod } from '../lib/reviewGuide';
import { CollapsibleZone } from './CollapsibleZone';

interface ReviewGuideProps {
  data: AppData;
  period: GuidePeriod;
}

const WEEKDAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

const card = 'bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-100 dark:border-stone-800 shadow-sm';
const patience = (text: string) => (
  <div className={card}>
    <p className="text-sm italic text-stone-400 dark:text-stone-500 flex items-center gap-2">
      <Clock className="w-4 h-4 shrink-0" /> {text}
    </p>
  </div>
);

// Le Bilan-guide : interprète les données en sections repliables (dynamique,
// rythmes, équilibre, habitudes, objectifs, conseils). 100 % local.
export function ReviewGuide({ data, period }: ReviewGuideProps) {
  const g = getReviewGuide(data, period);
  const periodWord = period === 'weekly' ? 'cette semaine' : 'ce mois-ci';

  return (
    <div className="mb-8">
      {/* ② Ma dynamique */}
      <CollapsibleZone title="Ma dynamique" help="L'évolution de ta régularité par rapport à la période précédente.">
        {!g.dynamics.enough ? (
          patience("Pas encore d'action sur cette période — reviens quand tu auras avancé.")
        ) : (
          <div className={card}>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-light text-stone-900 dark:text-stone-100">{g.dynamics.rate}</span>
                <span className="text-lg text-stone-400 dark:text-stone-500">%</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-sans uppercase tracking-widest text-stone-400 dark:text-stone-500">Régularité {periodWord}</span>
                {g.dynamics.deltaPts != null ? (
                  <span className={`text-sm font-sans font-bold flex items-center gap-1 ${
                    g.dynamics.trend === 'up' ? 'text-emerald-600 dark:text-emerald-400'
                    : g.dynamics.trend === 'down' ? 'text-amber-600 dark:text-amber-400'
                    : 'text-stone-500 dark:text-stone-400'
                  }`}>
                    {g.dynamics.trend === 'up' ? <TrendingUp className="w-4 h-4" /> : g.dynamics.trend === 'down' ? <TrendingDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                    {g.dynamics.deltaPts > 0 ? '+' : ''}{g.dynamics.deltaPts} pts vs période précédente
                  </span>
                ) : (
                  <span className="text-sm text-stone-500 dark:text-stone-400 italic">Première période suivie.</span>
                )}
              </div>
            </div>
            <p className="text-sm text-stone-600 dark:text-stone-300 mt-4">
              {g.dynamics.completed} action{g.dynamics.completed > 1 ? 's' : ''} accomplie{g.dynamics.completed > 1 ? 's' : ''} · {g.dynamics.activeDays} jour{g.dynamics.activeDays > 1 ? 's' : ''} actif{g.dynamics.activeDays > 1 ? 's' : ''} sur {g.dynamics.periodDays}.
            </p>
          </div>
        )}
      </CollapsibleZone>

      {/* ③ Mes rythmes */}
      <CollapsibleZone title="Mes rythmes" help="Tes tendances dans le temps : les jours où tu accomplis le plus.">
        {!g.rhythms.enough ? (
          patience("Encore un peu de patience — après ~2 semaines d'usage, tes rythmes apparaîtront ici.")
        ) : (
          <div className={card}>
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <p className="text-stone-700 dark:text-stone-200 font-serif text-lg leading-snug">
                  Ton meilleur jour : le <span className="font-semibold">{g.rhythms.bestWeekday != null ? WEEKDAYS[g.rhythms.bestWeekday] : '—'}</span>.
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                  {g.rhythms.bestCount} actions accomplies ce jour-là sur les dernières semaines.
                </p>
                <p className="text-sm text-emerald-700 dark:text-emerald-400 italic mt-3">
                  💡 Réserves-y ton action la plus importante.
                </p>
              </div>
            </div>
          </div>
        )}
      </CollapsibleZone>

      {/* ④ Mon équilibre */}
      <CollapsibleZone title="Mon équilibre" help="L'état de chaque domaine de vie : ressenti, objectifs et activité récente.">
        <div className={card}>
          <div className="space-y-2.5">
            {g.balance.map(b => {
              const color = b.status === 'thriving' ? 'bg-emerald-500' : b.status === 'fragile' ? 'bg-amber-400' : 'bg-stone-300 dark:bg-stone-600';
              const label = b.status === 'thriving' ? 'florissant' : b.status === 'fragile' ? 'en retrait' : 'stable';
              const labelColor = b.status === 'thriving' ? 'text-emerald-700 dark:text-emerald-400' : b.status === 'fragile' ? 'text-amber-700 dark:text-amber-400' : 'text-stone-400 dark:text-stone-500';
              return (
                <div key={b.domain} className="flex items-center gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${color}`} />
                  <span className="text-sm font-sans text-stone-700 dark:text-stone-200 flex-1 min-w-0 truncate">{b.domain}</span>
                  <span className="text-[11px] font-sans text-stone-400 dark:text-stone-500 shrink-0">
                    {b.score !== undefined ? `ressenti ${b.score}/5 · ` : ''}{b.goals} obj.
                  </span>
                  <span className={`text-[10px] font-sans font-bold uppercase tracking-wider shrink-0 w-20 text-right ${labelColor}`}>{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </CollapsibleZone>

      {/* ⑤ Mes habitudes */}
      <CollapsibleZone title="Mes habitudes" help="Lesquelles tiennent, lesquelles décrochent sur la période.">
        {!g.habits.enough ? (
          patience("Tu n'as pas encore d'habitude — en créer une te donnera un point d'appui.")
        ) : (
          <div className={card}>
            <div className="space-y-3">
              {g.habits.items.map(h => {
                const pct = Math.round(h.ratio * 100);
                const isStrong = g.habits.strongest?.id === h.id;
                const isSlip = g.habits.slipping?.id === h.id;
                return (
                  <div key={h.id}>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-sm font-sans text-stone-700 dark:text-stone-200 truncate flex items-center gap-1.5">
                        {h.title}
                        {isStrong && <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded">point d'appui</span>}
                        {isSlip && <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded">décroche</span>}
                      </span>
                      <span className="text-[11px] font-sans text-stone-400 dark:text-stone-500 shrink-0">{h.done}/{h.due}</span>
                    </div>
                    <div className="w-full bg-stone-100 dark:bg-stone-800 rounded-full h-1.5 overflow-hidden">
                      <div className={`h-1.5 rounded-full ${isSlip ? 'bg-amber-400' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CollapsibleZone>

      {/* ⑥ Mes objectifs */}
      <CollapsibleZone title="Mes objectifs" help="Un triage rapide : ce qui avance, ce qui dort, ce qui presse.">
        <div className={card}>
          {g.goals.total === 0 ? (
            <p className="text-sm italic text-stone-400 dark:text-stone-500">Aucun objectif en cours.</p>
          ) : (
            <div className="space-y-3 text-sm">
              <p className="flex items-center gap-2 text-stone-700 dark:text-stone-200">
                <Flag className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span><strong>{g.goals.advancing}</strong> objectif{g.goals.advancing > 1 ? 's' : ''} en mouvement sur {g.goals.total}.</span>
              </p>
              {g.goals.deadlineSoon.length > 0 && (
                <p className="flex items-start gap-2 text-stone-700 dark:text-stone-200">
                  <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <span>Échéance proche : {g.goals.deadlineSoon.map(d => `« ${d.title} » (${d.days === 0 ? "auj." : `J-${d.days}`})`).join(', ')}.</span>
                </p>
              )}
              {g.goals.stalled.length > 0 && (
                <p className="flex items-start gap-2 text-stone-700 dark:text-stone-200">
                  <Moon className="w-4 h-4 text-stone-400 dark:text-stone-500 shrink-0 mt-0.5" />
                  <span>{g.goals.stalled.length} en sommeil : {g.goals.stalled.slice(0, 3).map(t => `« ${t} »`).join(', ')}{g.goals.stalled.length > 3 ? '…' : ''}.</span>
                </p>
              )}
            </div>
          )}
        </div>
      </CollapsibleZone>

      {/* ⑦ Mon guide pour la suite */}
      <CollapsibleZone title="Mon guide pour la suite" help="1 à 3 conseils concrets, déduits de tout ce qui précède." defaultOpenMobile>
        <div className="bg-gradient-to-br from-emerald-50/70 to-white dark:from-emerald-500/10 dark:to-stone-900 rounded-3xl p-6 border border-emerald-100 dark:border-emerald-500/20 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Compass className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            <span className="text-[11px] font-sans font-bold uppercase tracking-[0.18em] text-emerald-800 dark:text-emerald-400">Ton cap pour la suite</span>
          </div>
          <ul className="space-y-3">
            {g.guidance.map((tip, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center mt-0.5">
                  <Lightbulb className="w-3.5 h-3.5" />
                </span>
                <span className="text-sm text-stone-700 dark:text-stone-200 font-sans leading-relaxed">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </CollapsibleZone>
    </div>
  );
}
