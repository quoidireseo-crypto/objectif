import { useState, useMemo } from 'react';
import { AppData, OrphanReason } from '../types';
import { Activity, CheckCircle2, CalendarDays, BookOpen, Quote, BarChart as BarChartIcon, Compass, Sparkles, Mountain } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useOrphans } from '../hooks/useOrphans';
import { useGoalHistory } from '../hooks/useGoalHistory';
import { useWeeklyReview } from '../hooks/useWeeklyReview';
import { WeeklyReviewScreen } from '../components/WeeklyReviewScreen';
import { InsightCard } from '../components/InsightCard';
import { ReviewGuide } from '../components/ReviewGuide';
import { PageHeader } from '../components/PageHeader';
import { HelpTooltip } from '../components/HelpTooltip';

interface ReviewProps {
  data: AppData;
  updateData: (data: Partial<AppData>) => void;
}

const REASON_TEXTS: Record<OrphanReason, string> = {
  'goal-no-action': 'Aucune action liée',
  'goal-no-milestone': 'Pas encore découpé',
  'task-no-goal': 'Action isolée',
  'milestone-abandoned': 'Étape sans suite',
  'goal-inactive': 'En sommeil',
};

const DOT_COLORS: Record<string, string> = {
  'created': 'bg-emerald-400',
  'achieved': 'bg-emerald-600',
  'reactivated': 'bg-emerald-500',
  'paused': 'bg-stone-400',
  'title-changed': 'bg-blue-400',
  'why-changed': 'bg-indigo-400',
  'milestone-added': 'bg-amber-400',
  'milestone-completed': 'bg-amber-500',
  'deadline-changed': 'bg-orange-400',
  'domain-changed': 'bg-stone-400',
  'status-changed': 'bg-stone-500',
};

export function ReviewView({ data, updateData }: ReviewProps) {
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const orphans = useOrphans(data);
  const { getHistoryForGoal } = useGoalHistory(data, () => {});
  const { reviews: weeklyReviews, currentWeekReview, completeReview } = useWeeklyReview(data, updateData);
  const [showWeeklyReviewScreen, setShowWeeklyReviewScreen] = useState(false);

  const { stats, chartData } = useMemo(() => {
    const days = period === 'weekly' ? 7 : 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

    // Compute stats
    const periodTasks = data.tasks.filter(t => t.date >= cutoffDateStr && t.date <= new Date().toISOString().split('T')[0]);
    const periodJournal = data.journal.filter(j => j.date >= cutoffDateStr && j.date <= new Date().toISOString().split('T')[0]);

    const totalTasks = periodTasks.length;
    const completedTasks = periodTasks.filter(t => t.isCompleted).length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Compute chart data
    const chartData = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      const dayTasks = data.tasks.filter(t => t.date === dateStr);
      const completed = dayTasks.filter(t => t.isCompleted).length;
      
      chartData.push({
        date: d.toLocaleDateString('fr-FR', { 
          day: 'numeric', 
          month: period === 'monthly' ? 'short' : undefined, 
          weekday: period === 'weekly' ? 'short' : undefined 
        }),
        Complétées: completed,
        Total: dayTasks.length
      });
    }

    return {
      stats: {
        totalTasks,
        completedTasks,
        completionRate,
        journalEntries: periodJournal.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      },
      chartData
    };
  }, [data, period]);

  // Compute goals with history
  const goalsWithHistory = useMemo(() => {
    return data.goals.filter(goal => {
      const history = getHistoryForGoal(goal.id);
      return history.length > 0;
    });
  }, [data.goals, getHistoryForGoal]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      {showWeeklyReviewScreen && (
        <WeeklyReviewScreen
          onComplete={(input) => {
            completeReview(input);
            setShowWeeklyReviewScreen(false);
          }}
          onClose={() => setShowWeeklyReviewScreen(false)}
        />
      )}

      {!currentWeekReview && (
        <div className="mb-8 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-3">
            <Compass className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0" />
            <p className="text-emerald-900 dark:text-emerald-200 font-sans font-medium text-sm">
              Cette semaine n'a pas encore son bilan. Prends 2 minutes pour faire le point.
            </p>
          </div>
          <button
            onClick={() => setShowWeeklyReviewScreen(true)}
            className="bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-emerald-800 transition shrink-0 w-full sm:w-auto"
          >
            Commencer mon bilan guidé
          </button>
        </div>
      )}

      <PageHeader
        eyebrow="Prendre du recul"
        title="Mon Bilan"
        subtitle="Prendre du recul pour mieux avancer."
        accent="indigo"
        help="Cet espace réunit tes statistiques, l'évolution de tes objectifs et ton bilan hebdomadaire guidé — un moment pour prendre du recul et ajuster ta direction."
      >
        <div className="flex bg-stone-100 dark:bg-stone-800 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setPeriod('weekly')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-sans font-bold uppercase tracking-wider transition-all ${
              period === 'weekly' ? 'bg-white dark:bg-stone-700 shadow-sm text-stone-900 dark:text-stone-100' : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
            }`}
          >
            Hebdomadaire
          </button>
          <button
            onClick={() => setPeriod('monthly')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-sans font-bold uppercase tracking-wider transition-all ${
              period === 'monthly' ? 'bg-white dark:bg-stone-700 shadow-sm text-stone-900 dark:text-stone-100' : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
            }`}
          >
            Mensuel
          </button>
        </div>
      </PageHeader>

      {/* Ce que je remarque — synthèse en mots, suit le sélecteur Hebdo/Mensuel */}
      <InsightCard data={data} period={period} variant="full" />

      {/* Bilan-guide : sections repliables d'analyse (dynamique → conseils) */}
      <ReviewGuide data={data} period={period} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-3xl p-6 border border-emerald-100 dark:border-emerald-500/20 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4 text-emerald-800 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-sans font-bold uppercase tracking-widest text-[10px]">Tâches Complétées</span>
          </div>
          <div>
            <span className="text-4xl font-light text-emerald-950 dark:text-emerald-200 block">{stats.completedTasks}</span>
            <span className="text-emerald-700 dark:text-emerald-400 text-sm italic mt-1 block">sur {stats.totalTasks} au total</span>
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-500/10 rounded-3xl p-6 border border-amber-100 dark:border-amber-500/20 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4 text-amber-800 dark:text-amber-400">
            <Activity className="w-5 h-5" />
            <span className="font-sans font-bold uppercase tracking-widest text-[10px]">Taux de Régularité</span>
          </div>
          <div>
            <span className="text-4xl font-light text-amber-950 dark:text-amber-200 block">{stats.completionRate}%</span>
            <span className="text-amber-700 dark:text-amber-400 text-sm italic mt-1 block">des engagements tenus</span>
          </div>
        </div>

        <div className="bg-indigo-50 dark:bg-indigo-500/10 rounded-3xl p-6 border border-indigo-100 dark:border-indigo-500/20 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4 text-indigo-800 dark:text-indigo-400">
            <BookOpen className="w-5 h-5" />
            <span className="font-sans font-bold uppercase tracking-widest text-[10px]">Jours Documentés</span>
          </div>
          <div>
            <span className="text-4xl font-light text-indigo-950 dark:text-indigo-200 block">{stats.journalEntries.length}</span>
            <span className="text-indigo-700 dark:text-indigo-400 text-sm italic mt-1 block">entrées de journal</span>
          </div>
        </div>
      </div>

      {/* Progression des objectifs */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 md:p-8 border border-stone-100 dark:border-stone-800 shadow-sm mb-8">
        <div className="flex items-center gap-3 mb-8 border-b border-stone-100 dark:border-stone-800 pb-4">
          <BarChartIcon className="w-6 h-6 text-stone-400 dark:text-stone-500" />
          <h3 className="text-xl font-light text-stone-900 dark:text-stone-100">Progression des objectifs</h3>
        </div>
        <div className="h-64 mt-4 text-xs font-sans">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tickMargin={10} tick={{fill: '#78716c'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#78716c'}} allowDecimals={false} />
              <Tooltip 
                cursor={{fill: '#f5f5f0'}} 
                contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px'}} 
              />
              <Bar dataKey="Total" fill="#e7e5e4" radius={[4, 4, 4, 4]} barSize={period === 'weekly' ? 32 : 12} />
              <Bar dataKey="Complétées" fill="#059669" radius={[4, 4, 4, 4]} barSize={period === 'weekly' ? 32 : 12} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tes objectifs au fil du temps */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 md:p-8 border border-stone-100 dark:border-stone-800 shadow-sm mb-8">
        <div>
          <h3 className="text-xl font-light text-stone-900 dark:text-stone-100">Tes objectifs au fil du temps</h3>
          <p className="text-xs font-sans uppercase tracking-widest text-stone-400 dark:text-stone-500 mt-1">
            Comment ils ont évolué.
          </p>
        </div>

        {goalsWithHistory.length === 0 ? (
          <div className="text-center py-8">
            <p className="italic text-stone-400 dark:text-stone-500 text-sm">
              L'évolution de tes objectifs apparaîtra ici au fil du temps.
            </p>
          </div>
        ) : (
          <div className="space-y-4 mt-6">
            {goalsWithHistory.map(goal => {
              const entries = getHistoryForGoal(goal.id);
              const displayedPastilles = entries.slice(0, 5);
              const extraCount = entries.length - 5;
              const firstEntry = entries[entries.length - 1];
              const achievedEntry = entries.find(e => e.changeType === 'achieved');

              return (
                <div
                  key={goal.id}
                  className="p-5 bg-stone-50 dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-stone-700 hover:border-stone-200 dark:hover:border-stone-600 transition"
                >
                  <h4 className="font-serif font-light text-lg text-stone-800 dark:text-stone-200">
                    {goal.title}{' '}
                    <span className="text-xs text-stone-400 dark:text-stone-500 font-sans">
                      ({entries.length} événement{entries.length > 1 ? 's' : ''})
                    </span>
                  </h4>

                  <div className="flex items-center gap-2 mt-3 overflow-x-auto hidden-scrollbar pb-1">
                    {displayedPastilles.map(entry => {
                      const colorClass = DOT_COLORS[entry.changeType] || 'bg-stone-400';
                      return (
                        <div
                          key={entry.id}
                          className={`w-3 h-3 rounded-full shrink-0 ${colorClass}`}
                          title={`${entry.description} — ${entry.date}`}
                        />
                      );
                    })}
                    {extraCount > 0 && (
                      <span className="text-[10px] text-stone-400 dark:text-stone-500 font-sans italic">
                        +{extraCount} autre{extraCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1 mt-3">
                    <p className="text-xs text-stone-400 dark:text-stone-500 font-sans">
                      Commencé le {firstEntry.date}
                    </p>
                    {achievedEntry && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-sans font-bold flex items-center gap-1">
                        <span>✦</span> Atteint le {achievedEntry.date}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bilans hebdomadaires */}
      {weeklyReviews.length > 0 && (
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 md:p-8 border border-stone-100 dark:border-stone-800 shadow-sm mb-8">
          <div className="flex items-center gap-3 mb-8 border-b border-stone-100 dark:border-stone-800 pb-4">
            <Compass className="w-6 h-6 text-stone-400 dark:text-stone-500" />
            <h3 className="text-xl font-light text-stone-900 dark:text-stone-100">Bilans hebdomadaires</h3>
          </div>
          <div className="space-y-6">
            {weeklyReviews.map(review => {
              const weekStart = new Date(review.weekStartDate + 'T00:00:00');
              const weekEnd = new Date(weekStart);
              weekEnd.setDate(weekStart.getDate() + 6);
              const label = `${weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} → ${weekEnd.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`;

              return (
                <div key={review.id} className="p-5 bg-stone-50 dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-stone-700">
                  <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-stone-400 dark:text-stone-500 block mb-3">{label}</span>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-2.5">
                      <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-stone-700 dark:text-stone-300 italic">{review.win}</p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Mountain className="w-4 h-4 text-stone-400 dark:text-stone-500 shrink-0 mt-0.5" />
                      <p className="text-stone-700 dark:text-stone-300 italic">{review.challenge}</p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Compass className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <p className="text-stone-700 dark:text-stone-300 italic">{review.intention}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Rétrospective */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 md:p-8 border border-stone-100 dark:border-stone-800 shadow-sm">
        <div className="flex items-center gap-3 mb-8 border-b border-stone-100 dark:border-stone-800 pb-4">
          <CalendarDays className="w-6 h-6 text-stone-400 dark:text-stone-500" />
          <h3 className="text-xl font-light text-stone-900 dark:text-stone-100">Rétrospective</h3>
        </div>

        {stats.journalEntries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-stone-500 dark:text-stone-400 font-sans font-bold">Aucune entrée pour cette période.</p>
            <p className="text-stone-400 dark:text-stone-500 text-sm mt-1 italic">N'hésite pas à écrire pour garder une trace d'où tu viens.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {stats.journalEntries.map(entry => (
              <div key={entry.id} className="relative pl-6 border-l-2 border-stone-100 dark:border-stone-800 pb-2">
                <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-stone-300 dark:bg-stone-600" />
                <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-stone-400 dark:text-stone-500 block mb-2">
                  {new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(entry.date))}
                </span>
                <div className="bg-[#F5F5F0] dark:bg-stone-800 rounded-2xl p-4 text-stone-700 dark:text-stone-300 border border-stone-200/50 dark:border-stone-700/50">
                  <Quote className="w-4 h-4 text-stone-300 dark:text-stone-600 mb-2 rotate-180" />
                  <p className="italic leading-relaxed">{entry.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Intentions en sommeil */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 md:p-8 border border-stone-100 dark:border-stone-800 shadow-sm mt-8">
        {orphans.length === 0 ? (
          <>
            <h3 className="text-xl font-light text-stone-900 dark:text-stone-100 mb-6">À reprendre</h3>
            <div className="text-center py-8">
              <p className="italic text-stone-400 dark:text-stone-500 text-sm">
                Rien à reprendre pour l'instant. Tout est en mouvement.
              </p>
            </div>
          </>
        ) : (
          <>
            <h3 className="text-xl font-light text-stone-900 dark:text-stone-100 mb-6">
              {orphans.length} élément(s) attendent peut-être un geste
            </h3>
            <div className="divide-y divide-stone-50 dark:divide-stone-800">
              {orphans.map(orphan => {
                const dotColor = orphan.reason === 'goal-inactive' ? 'bg-amber-400' : 'bg-stone-300 dark:bg-stone-600';
                return (
                  <div key={orphan.id} className="flex items-start gap-3 py-3 border-b border-stone-50 dark:border-stone-800 last:border-0">
                    <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${dotColor}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-stone-700 dark:text-stone-300 font-sans text-sm break-words">{orphan.title}</p>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
                        <span className="text-stone-400 dark:text-stone-500 text-xs italic">
                          {REASON_TEXTS[orphan.reason]}
                        </span>
                        <span className="text-stone-300 dark:text-stone-600 text-xs">
                          Inactif depuis {orphan.daysSinceLastActivity} {orphan.daysSinceLastActivity > 1 ? 'jours' : 'jour'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
