import { useState, FormEvent, useMemo } from 'react';
import { AppData, LifeDomain } from '../types';
import { useHabits, isHabitDueOn } from '../hooks/useHabits';
import { Repeat, Plus, Circle, CheckCircle2, Flame, Trash2, Archive, Tag } from 'lucide-react';

interface HabitsProps {
  data: AppData;
  updateData: (data: Partial<AppData>) => void;
}

const DOMAINS: LifeDomain[] = [
  'Santé & Bien-être',
  'Projet Personnel',
  'Relations & Famille',
  'Apprentissage',
  'Finances',
  'Spiritualité',
  'Autre'
];

const DAY_LABELS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

const todayStr = () => new Date().toISOString().split('T')[0];

export function HabitsView({ data, updateData }: HabitsProps) {
  const { activeHabits, todaysHabits, isCompletedOn, addHabit, deleteHabit, archiveHabit, toggleCompletion, getStreak } = useHabits(data, updateData);

  const [title, setTitle] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [domain, setDomain] = useState<LifeDomain | ''>('');

  const today = todayStr();

  const last7Days = useMemo(() => {
    const list: { dateStr: string; label: string }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      list.push({
        dateStr: d.toISOString().split('T')[0],
        label: d.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', ''),
      });
    }
    return list;
  }, []);

  const toggleDay = (day: number) => {
    setSelectedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort());
  };

  const handleAddHabit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (frequency === 'weekly' && selectedDays.length === 0) return;

    addHabit({
      title: title.trim(),
      frequency,
      daysOfWeek: frequency === 'weekly' ? selectedDays : undefined,
      domain: domain || undefined,
    });

    setTitle('');
    setFrequency('daily');
    setSelectedDays([]);
    setDomain('');
  };

  const getStreakStyle = (streak: number) => {
    if (streak >= 7) return 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
    if (streak >= 3) return 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
    if (streak > 0) return 'bg-stone-50 text-stone-600 border-stone-100 dark:bg-stone-800 dark:text-stone-400 dark:border-stone-700';
    return 'bg-stone-50 text-stone-400 border-stone-100 dark:bg-stone-800 dark:text-stone-500 dark:border-stone-700';
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="mb-6 md:mb-8 border-b border-stone-200 dark:border-stone-800 pb-6">
        <h2 className="text-3xl md:text-4xl font-light text-stone-900 dark:text-stone-100 flex items-center gap-3">
          Mes Habitudes
        </h2>
        <p className="text-stone-500 dark:text-stone-400 font-sans tracking-wide uppercase text-[10px] md:text-xs mt-2 italic">
          Construire la régularité, jour après jour.
        </p>
      </header>

      {/* Add Habit Form */}
      <form onSubmit={handleAddHabit} className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-100 dark:border-stone-800 shadow-sm mb-8 md:mb-10 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="pl-1 text-stone-400 dark:text-stone-500 hidden md:flex items-center">
            <Plus className="w-5 h-5" />
          </div>
          <input
            type="text"
            placeholder="Une nouvelle habitude... (ex: méditer 10 minutes)"
            className="flex-1 py-3 px-3 outline-none text-stone-800 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 bg-stone-50 dark:bg-stone-800 rounded-xl font-sans"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
          <select
            className="bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 font-sans text-xs py-3 px-3 rounded-xl outline-none focus:ring-1 focus:ring-emerald-700 w-full md:w-auto md:min-w-[160px]"
            value={domain}
            onChange={(e) => setDomain(e.target.value as LifeDomain)}
          >
            <option value="">Pilier de vie ?</option>
            {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex bg-stone-100 dark:bg-stone-800 p-1 rounded-xl w-full md:w-auto">
            <button
              type="button"
              onClick={() => setFrequency('daily')}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-sans font-bold uppercase tracking-wider transition-all ${
                frequency === 'daily' ? 'bg-white dark:bg-stone-700 shadow-sm text-stone-900 dark:text-stone-100' : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
              }`}
            >
              Tous les jours
            </button>
            <button
              type="button"
              onClick={() => setFrequency('weekly')}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-sans font-bold uppercase tracking-wider transition-all ${
                frequency === 'weekly' ? 'bg-white dark:bg-stone-700 shadow-sm text-stone-900 dark:text-stone-100' : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
              }`}
            >
              Jours choisis
            </button>
          </div>

          {frequency === 'weekly' && (
            <div className="flex gap-1.5">
              {DAY_LABELS.map((label, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => toggleDay(idx)}
                  className={`w-8 h-8 rounded-full text-xs font-sans font-bold transition ${
                    selectedDays.includes(idx)
                      ? 'bg-emerald-600 text-white'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          <button
            type="submit"
            disabled={!title.trim() || (frequency === 'weekly' && selectedDays.length === 0)}
            className="md:ml-auto bg-stone-800 dark:bg-emerald-700 text-white px-5 py-3 rounded-xl font-sans uppercase tracking-widest text-xs font-bold hover:bg-stone-900 dark:hover:bg-emerald-800 disabled:opacity-50 transition w-full md:w-auto"
          >
            Ajouter
          </button>
        </div>
      </form>

      {/* Today's Habits */}
      <div className="mb-10">
        <h3 className="text-xl font-light text-stone-800 dark:text-stone-200 mb-6">Aujourd'hui</h3>

        {todaysHabits.length === 0 ? (
          <div className="text-center py-16 bg-[#EAE7E2] dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800">
            <Repeat className="w-10 h-10 text-stone-300 dark:text-stone-600 mx-auto mb-3" />
            <p className="text-stone-500 dark:text-stone-400 font-sans font-bold">Aucune habitude prévue aujourd'hui.</p>
            <p className="text-stone-400 dark:text-stone-500 text-sm mt-1 italic">Ajoute une habitude pour commencer à construire ta régularité.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {todaysHabits.map(habit => {
              const done = isCompletedOn(habit.id, today);
              const streak = getStreak(habit.id);
              return (
                <div key={habit.id} className="group bg-stone-50/50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800 p-5 rounded-2xl flex items-center gap-4 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-sm transition-all">
                  <button
                    onClick={() => toggleCompletion(habit.id, today)}
                    className={`shrink-0 transition-colors ${done ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-300 dark:text-stone-600 hover:text-emerald-700 dark:hover:text-emerald-500'}`}
                  >
                    {done ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                  </button>
                  <div className="flex-1">
                    <p className={`font-sans font-bold ${done ? 'text-stone-400 dark:text-stone-500 line-through' : 'text-stone-800 dark:text-stone-100'}`}>
                      {habit.title}
                    </p>
                    {habit.domain && (
                      <div className="flex items-center gap-1 text-[9px] text-stone-500 dark:text-stone-400 font-sans font-bold uppercase tracking-widest bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 w-max px-2 py-1 rounded-md mt-2">
                        <Tag className="w-3 h-3" />
                        {habit.domain}
                      </div>
                    )}
                  </div>
                  <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-sans font-bold shrink-0 ${getStreakStyle(streak)}`}>
                    <Flame className="w-3.5 h-3.5" />
                    {streak}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* All Habits Management */}
      {activeHabits.length > 0 && (
        <div>
          <h3 className="text-xl font-light text-stone-800 dark:text-stone-200 mb-6">Toutes mes habitudes</h3>
          <div className="space-y-3">
            {activeHabits.map(habit => (
              <div key={habit.id} className="bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <p className="font-sans font-bold text-stone-700 dark:text-stone-200 text-sm">{habit.title}</p>
                  <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">
                    {habit.frequency === 'daily' ? 'Tous les jours' : habit.daysOfWeek?.map(d => DAY_LABELS[d]).join(' ')}
                  </p>
                </div>

                <div className="flex gap-1.5">
                  {last7Days.map(day => {
                    const due = isHabitDueOn(habit, new Date(day.dateStr + 'T00:00:00'));
                    const completed = isCompletedOn(habit.id, day.dateStr);
                    return (
                      <div
                        key={day.dateStr}
                        title={`${day.label} : ${!due ? 'non prévu' : completed ? 'fait' : 'non fait'}`}
                        className={`w-3 h-3 rounded-full ${
                          !due ? 'bg-stone-100 dark:bg-stone-800' : completed ? 'bg-emerald-500' : 'bg-stone-200 dark:bg-stone-700'
                        }`}
                      />
                    );
                  })}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => archiveHabit(habit.id)}
                    className="text-stone-300 dark:text-stone-600 hover:text-stone-600 dark:hover:text-stone-300 p-2 transition-colors"
                    title="Archiver cette habitude"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { if (window.confirm('Supprimer cette habitude et son historique ?')) deleteHabit(habit.id); }}
                    className="text-stone-300 dark:text-stone-600 hover:text-red-500 p-2 transition-colors"
                    title="Supprimer définitivement"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
