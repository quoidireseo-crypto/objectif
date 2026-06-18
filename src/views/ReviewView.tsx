import { useState, useMemo } from 'react';
import { AppData, OrphanReason } from '../types';
import { Activity, CheckCircle2, CalendarDays, BookOpen, Quote, BarChart as BarChartIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useOrphans } from '../hooks/useOrphans';
import { useGoalHistory } from '../hooks/useGoalHistory';

interface ReviewProps {
  data: AppData;
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

export function ReviewView({ data }: ReviewProps) {
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const orphans = useOrphans(data);
  const { getHistoryForGoal } = useGoalHistory(data, () => {});

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
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 border-b border-stone-200 pb-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-light text-stone-900">Mon Bilan</h2>
          <p className="text-stone-500 font-sans tracking-wide uppercase text-[10px] md:text-xs mt-2 italic">Prendre du recul pour mieux avancer.</p>
        </div>
        <div className="flex bg-stone-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setPeriod('weekly')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-sans font-bold uppercase tracking-wider transition-all ${
              period === 'weekly' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            Hebdomadaire
          </button>
          <button
            onClick={() => setPeriod('monthly')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-sans font-bold uppercase tracking-wider transition-all ${
              period === 'monthly' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            Mensuel
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-emerald-50 rounded-3xl p-6 border border-emerald-100 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4 text-emerald-800">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-sans font-bold uppercase tracking-widest text-[10px]">Tâches Complétées</span>
          </div>
          <div>
            <span className="text-4xl font-light text-emerald-950 block">{stats.completedTasks}</span>
            <span className="text-emerald-700 text-sm italic mt-1 block">sur {stats.totalTasks} au total</span>
          </div>
        </div>

        <div className="bg-amber-50 rounded-3xl p-6 border border-amber-100 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4 text-amber-800">
            <Activity className="w-5 h-5" />
            <span className="font-sans font-bold uppercase tracking-widest text-[10px]">Taux de Régularité</span>
          </div>
          <div>
            <span className="text-4xl font-light text-amber-950 block">{stats.completionRate}%</span>
            <span className="text-amber-700 text-sm italic mt-1 block">des engagements tenus</span>
          </div>
        </div>

        <div className="bg-indigo-50 rounded-3xl p-6 border border-indigo-100 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4 text-indigo-800">
            <BookOpen className="w-5 h-5" />
            <span className="font-sans font-bold uppercase tracking-widest text-[10px]">Jours Documentés</span>
          </div>
          <div>
            <span className="text-4xl font-light text-indigo-950 block">{stats.journalEntries.length}</span>
            <span className="text-indigo-700 text-sm italic mt-1 block">entrées de journal</span>
          </div>
        </div>
      </div>

      {/* Progression des objectifs */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-stone-100 shadow-sm mb-8">
        <div className="flex items-center gap-3 mb-8 border-b border-stone-100 pb-4">
          <BarChartIcon className="w-6 h-6 text-stone-400" />
          <h3 className="text-xl font-light text-stone-900">Progression des objectifs</h3>
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

      {/* Cheminement de tes objectifs */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-stone-100 shadow-sm mb-8">
        <div>
          <h3 className="text-xl font-light text-stone-900">Cheminement de tes objectifs</h3>
          <p className="text-xs font-sans uppercase tracking-widest text-stone-400 mt-1">
            La trace de ton évolution.
          </p>
        </div>

        {goalsWithHistory.length === 0 ? (
          <div className="text-center py-8">
            <p className="italic text-stone-400 text-sm">
              Ton cheminement s'écrira ici au fil de tes modifications.
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
                  className="p-5 bg-stone-50 rounded-2xl border border-stone-100 hover:border-stone-200 transition"
                >
                  <h4 className="font-serif font-light text-lg text-stone-800">
                    {goal.title}{' '}
                    <span className="text-xs text-stone-400 font-sans">
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
                      <span className="text-[10px] text-stone-400 font-sans italic">
                        +{extraCount} autre{extraCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1 mt-3">
                    <p className="text-xs text-stone-400 font-sans">
                      Commencé le {firstEntry.date}
                    </p>
                    {achievedEntry && (
                      <p className="text-xs text-emerald-600 font-sans font-bold flex items-center gap-1">
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

      {/* Rétrospective */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-stone-100 shadow-sm">
        <div className="flex items-center gap-3 mb-8 border-b border-stone-100 pb-4">
          <CalendarDays className="w-6 h-6 text-stone-400" />
          <h3 className="text-xl font-light text-stone-900">Rétrospective</h3>
        </div>

        {stats.journalEntries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-stone-500 font-sans font-bold">Aucune entrée pour cette période.</p>
            <p className="text-stone-400 text-sm mt-1 italic">N'hésite pas à écrire pour garder une trace d'où tu viens.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {stats.journalEntries.map(entry => (
              <div key={entry.id} className="relative pl-6 border-l-2 border-stone-100 pb-2">
                <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-stone-300" />
                <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-stone-400 block mb-2">
                  {new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(entry.date))}
                </span>
                <div className="bg-[#F5F5F0] rounded-2xl p-4 text-stone-700 border border-stone-200/50">
                  <Quote className="w-4 h-4 text-stone-300 mb-2 rotate-180" />
                  <p className="italic leading-relaxed">{entry.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Intentions en sommeil */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-stone-100 shadow-sm mt-8">
        {orphans.length === 0 ? (
          <>
            <h3 className="text-xl font-light text-stone-900 mb-6">Intentions en sommeil</h3>
            <div className="text-center py-8">
              <p className="italic text-stone-400 text-sm">
                Aucune intention en sommeil. Tout est relié et actif.
              </p>
            </div>
          </>
        ) : (
          <>
            <h3 className="text-xl font-light text-stone-900 mb-6">
              {orphans.length} intention(s) méritent ton attention
            </h3>
            <div className="divide-y divide-stone-50">
              {orphans.map(orphan => {
                const dotColor = orphan.reason === 'goal-inactive' ? 'bg-amber-400' : 'bg-stone-300';
                return (
                  <div key={orphan.id} className="flex items-start gap-3 py-3 border-b border-stone-50 last:border-0">
                    <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${dotColor}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-stone-700 font-sans text-sm break-words">{orphan.title}</p>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
                        <span className="text-stone-400 text-xs italic">
                          {REASON_TEXTS[orphan.reason]}
                        </span>
                        <span className="text-stone-300 text-xs">
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
