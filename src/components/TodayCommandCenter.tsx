import { useMemo, useState } from 'react';
import { AppData, Task, ViewType } from '../types';
import {
  CheckCircle2,
  Circle,
  RotateCcw,
  Inbox,
  Plus,
  Star,
  Sunrise,
  ArrowRight,
  Target,
  X,
} from 'lucide-react';

interface TodayCommandCenterProps {
  data: AppData;
  updateData: (data: Partial<AppData>) => void;
  onChangeView: (view: ViewType) => void;
}

// Poste de commande « Aujourd'hui » : ce que l'utilisateur a à faire maintenant.
// Regroupe les actions en retard à reprendre, les actions du jour (cochables sur
// place) et une capture rapide qui alimente une boîte de réception à trier.
export function TodayCommandCenter({ data, updateData, onChangeView }: TodayCommandCenterProps) {
  const todayDate = new Date().toISOString().split('T')[0];
  const [noteInput, setNoteInput] = useState('');

  const todayTasks = useMemo(
    () => data.tasks.filter(t => t.date === todayDate),
    [data.tasks, todayDate]
  );

  // En retard : actions datées d'avant aujourd'hui, encore à faire.
  const overdueTasks = useMemo(
    () => data.tasks
      .filter(t => t.date && t.date < todayDate && !t.isCompleted)
      .sort((a, b) => a.date.localeCompare(b.date)),
    [data.tasks, todayDate]
  );

  // Boîte de réception : notes capturées sans date ni objectif, à trier.
  const inboxTasks = useMemo(
    () => data.tasks.filter(t => !t.date && !t.goalId && !t.isCompleted),
    [data.tasks]
  );

  // Objectifs en cours, cibles possibles d'un tri.
  const inProgressGoals = useMemo(
    () => data.goals.filter(g => g.status === 'En cours'),
    [data.goals]
  );

  const remainingToday = todayTasks.filter(t => !t.isCompleted).length;
  const completedToday = todayTasks.filter(t => t.isCompleted).length;

  const toggleTask = (id: string) => {
    updateData({
      tasks: data.tasks.map(t => (t.id === id ? { ...t, isCompleted: !t.isCompleted } : t)),
    });
  };

  const moveToToday = (id: string) => {
    updateData({
      tasks: data.tasks.map(t => (t.id === id ? { ...t, date: todayDate } : t)),
    });
  };

  const removeTask = (id: string) => {
    updateData({ tasks: data.tasks.filter(t => t.id !== id) });
  };

  // Rattacher une note à un objectif : elle quitte l'inbox et devient une
  // action « en réserve » de cet objectif (sans date tant qu'elle n'est pas planifiée).
  const attachToGoal = (id: string, goalId: string) => {
    if (!goalId) return;
    updateData({
      tasks: data.tasks.map(t => (t.id === id ? { ...t, goalId } : t)),
    });
  };

  const addNote = () => {
    const value = noteInput.trim();
    if (!value) return;
    const task: Task = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
      title: value,
      isCompleted: false,
      date: '', // sans date = boîte de réception
    };
    updateData({ tasks: [task, ...data.tasks] });
    setNoteInput('');
  };

  const dayLabel = (dateStr: string) =>
    new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

  return (
    <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 md:p-8 border border-stone-100 dark:border-stone-800 shadow-sm mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-light text-stone-900 dark:text-stone-100">À faire aujourd'hui</h3>
            <p className="text-xs font-sans uppercase tracking-widest text-stone-400 dark:text-stone-500 mt-0.5">
              {remainingToday > 0
                ? `${remainingToday} action${remainingToday > 1 ? 's' : ''} restante${remainingToday > 1 ? 's' : ''}`
                : todayTasks.length > 0
                ? 'Tout est fait, bravo'
                : 'Rien de prévu pour l\'instant'}
            </p>
          </div>
        </div>
        <button
          onClick={() => onChangeView('tasks')}
          className="text-sm text-emerald-700 dark:text-emerald-400 font-sans uppercase tracking-widest hover:text-emerald-800 dark:hover:text-emerald-300 transition shrink-0"
        >
          Tout voir &rarr;
        </button>
      </div>

      {/* À reprendre (en retard) */}
      {overdueTasks.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <RotateCcw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <h4 className="text-[11px] font-sans font-bold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-400">
              À reprendre ({overdueTasks.length})
            </h4>
          </div>
          <div className="space-y-2">
            {overdueTasks.slice(0, 5).map(task => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-amber-50/60 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/20"
              >
                <button
                  onClick={() => toggleTask(task.id)}
                  className="shrink-0 text-stone-300 dark:text-stone-600 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
                  title="Marquer comme fait"
                >
                  <Circle className="w-5 h-5" />
                </button>
                <span className="flex-1 font-sans text-sm text-stone-700 dark:text-stone-200 truncate">
                  {task.title}
                </span>
                <span className="text-[10px] font-sans text-amber-600 dark:text-amber-400 shrink-0 max-sm:hidden">
                  {dayLabel(task.date)}
                </span>
                <button
                  onClick={() => moveToToday(task.id)}
                  className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white dark:bg-stone-800 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 text-[11px] font-sans font-bold hover:bg-amber-100 dark:hover:bg-amber-500/10 transition"
                  title="Reporter à aujourd'hui"
                >
                  <ArrowRight className="w-3 h-3" />
                  Aujourd'hui
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions du jour */}
      {todayTasks.length > 0 ? (
        <div className="space-y-2">
          {todayTasks.map(task => {
            const done = task.isCompleted;
            return (
              <button
                key={task.id}
                onClick={() => toggleTask(task.id)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-stone-50/70 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all text-left"
              >
                <span className={`shrink-0 transition-colors ${done ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-300 dark:text-stone-600'}`}>
                  {done ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                </span>
                <span className={`flex-1 font-sans text-sm font-bold ${done ? 'text-stone-400 dark:text-stone-500 line-through' : 'text-stone-700 dark:text-stone-200'}`}>
                  {task.title}
                </span>
                {task.isImportant && !done && (
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                )}
              </button>
            );
          })}
          {completedToday > 0 && (
            <p className="text-[11px] text-stone-400 dark:text-stone-500 font-sans pl-1 pt-1">
              {completedToday} action{completedToday > 1 ? 's' : ''} accomplie{completedToday > 1 ? 's' : ''} aujourd'hui.
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50/70 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-2xl px-4 py-4">
          <div className="flex items-center gap-3">
            <Sunrise className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <p className="text-sm font-sans text-stone-600 dark:text-stone-300">
              Aucune action prévue aujourd'hui. Pose un premier petit pas.
            </p>
          </div>
          <button
            onClick={() => onChangeView('tasks')}
            className="shrink-0 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#047857] dark:bg-emerald-700 text-white text-xs font-sans font-bold uppercase tracking-widest hover:bg-[#059669] dark:hover:bg-emerald-800 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Une action
          </button>
        </div>
      )}

      {/* Capture rapide + boîte de réception */}
      <div className="mt-6 pt-6 border-t border-stone-100 dark:border-stone-800">
        <div className="flex items-center gap-2 mb-3">
          <Inbox className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500" />
          <h4 className="text-[11px] font-sans font-bold uppercase tracking-[0.18em] text-stone-400 dark:text-stone-500">
            Note rapide{inboxTasks.length > 0 ? ` · à trier (${inboxTasks.length})` : ''}
          </h4>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addNote(); }}
            placeholder="Vide ta tête : une idée, une chose à ne pas oublier…"
            className="flex-1 px-4 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-stone-800 dark:text-stone-100 font-sans text-sm transition"
            maxLength={140}
          />
          <button
            onClick={addNote}
            disabled={!noteInput.trim()}
            className="shrink-0 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-stone-900 dark:bg-stone-700 text-white text-xs font-sans font-bold uppercase tracking-widest hover:bg-stone-800 dark:hover:bg-stone-600 disabled:opacity-50 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Noter
          </button>
        </div>

        {inboxTasks.length > 0 && (
          <div className="space-y-2 mt-3">
            {inboxTasks.map(task => (
              <div
                key={task.id}
                className="flex items-center gap-2 flex-wrap p-3 rounded-xl bg-stone-50/70 dark:bg-stone-800 border border-dashed border-stone-200 dark:border-stone-700"
              >
                <Inbox className="w-4 h-4 text-stone-300 dark:text-stone-600 shrink-0" />
                <span className="flex-1 min-w-[8rem] font-sans text-sm text-stone-700 dark:text-stone-200 truncate">
                  {task.title}
                </span>

                {inProgressGoals.length > 0 && (
                  <div className="relative shrink-0">
                    <Target className="w-3 h-3 text-stone-400 dark:text-stone-500 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      value=""
                      onChange={(e) => attachToGoal(task.id, e.target.value)}
                      className="appearance-none pl-7 pr-3 py-1.5 rounded-lg bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 text-stone-600 dark:text-stone-300 text-[11px] font-sans font-bold cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-600 transition outline-none focus:ring-1 focus:ring-emerald-500"
                      title="Rattacher à un objectif"
                    >
                      <option value="">Rattacher…</option>
                      {inProgressGoals.map(g => (
                        <option key={g.id} value={g.id}>{g.title}</option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  onClick={() => moveToToday(task.id)}
                  className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 text-emerald-700 dark:text-emerald-400 text-[11px] font-sans font-bold hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition"
                  title="Planifier pour aujourd'hui"
                >
                  <ArrowRight className="w-3 h-3" />
                  Aujourd'hui
                </button>
                <button
                  onClick={() => removeTask(task.id)}
                  className="shrink-0 p-1.5 rounded-lg text-stone-300 dark:text-stone-600 hover:text-stone-500 dark:hover:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700 transition"
                  title="Retirer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
