import { useState, useMemo, FormEvent } from 'react';
import { AppData, Task, LifeDomain } from '../types';
import { newTrashEntry } from '../hooks/useTrash';
import { ChevronLeft, ChevronRight, CheckCircle2, Circle, Plus, Tag, Trash2 } from 'lucide-react';

interface CalendarProps {
  data: AppData;
  updateData: (newData: Partial<AppData>) => void;
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

export function CalendarView({ data, updateData }: CalendarProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<LifeDomain | ''>('');

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  // Adjust so Monday is the first day of the week (0)
  const emptyDaysOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const selectedDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
  
  const selectedDayTasks = data.tasks.filter(t => t.date === selectedDateStr);
  const selectedDayJournal = data.journal.find(j => j.date === selectedDateStr);

  const handleAddTask = (e: FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const task: Task = {
      id: Date.now().toString(),
      title: newTaskTitle.trim(),
      isCompleted: false,
      date: selectedDateStr,
      ...(selectedDomain ? { domain: selectedDomain as LifeDomain } : {})
    };

    updateData({ tasks: [task, ...data.tasks] });
    setNewTaskTitle('');
    setSelectedDomain('');
  };

  const toggleTask = (id: string) => {
    const newTasks = data.tasks.map(t => 
      t.id === id ? { ...t, isCompleted: !t.isCompleted } : t
    );
    updateData({ tasks: newTasks });
  };

  const deleteTask = (id: string) => {
    if (!window.confirm("Supprimer cette action ?")) return;
    const task = data.tasks.find(t => t.id === id);
    const entry = task ? newTrashEntry('task', task.title, { task }) : null;
    updateData({ tasks: data.tasks.filter(t => t.id !== id), ...(entry ? { trash: [entry, ...(data.trash || [])] } : {}) });
  };

  const renderCalendarDays = () => {
    const days = [];
    for (let i = 0; i < emptyDaysOffset; i++) {
      days.push(<div key={`empty-${i}`} className="p-2 border border-transparent"></div>);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      
      const dayTasks = data.tasks.filter(t => t.date === dateStr);
      const completedCount = dayTasks.filter(t => t.isCompleted).length;
      const totalCount = dayTasks.length;
      
      const hasJournal = data.journal.some(j => j.date === dateStr);

      const isToday = date.toDateString() === today.toDateString();
      const isSelected = date.toDateString() === selectedDate.toDateString();

      days.push(
        <button
          key={i}
          onClick={() => setSelectedDate(date)}
          className={`min-h-[80px] p-2 border border-stone-200 dark:border-stone-800 flex flex-col items-start transition hover:bg-stone-50 dark:hover:bg-stone-800 ${
            isSelected ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500 dark:border-emerald-500/40 relative z-10' : 'bg-white dark:bg-stone-900'
          }`}
        >
          <span className={`text-sm font-sans font-bold flex items-center justify-center w-6 h-6 rounded-full ${
            isToday ? 'bg-stone-800 dark:bg-emerald-700 text-white' : 'text-stone-700 dark:text-stone-300'
          }`}>
            {i}
          </span>

          <div className="mt-auto w-full flex flex-wrap gap-1">
            {totalCount > 0 && (
              <div className="text-[10px] bg-stone-100 dark:bg-stone-800 px-1 rounded text-stone-600 dark:text-stone-300 font-sans">
                {completedCount}/{totalCount}
              </div>
            )}
            {hasJournal && (
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 self-center"></div>
            )}
          </div>
        </button>
      );
    }

    return days;
  };

  return (
    <div className="animate-in fade-in py-4 max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
      {/* Calendar View */}
      <div className="flex-1">
        <header className="flex items-center justify-between mb-8 pb-4 border-b border-stone-200 dark:border-stone-800">
          <div>
            <h2 className="text-3xl md:text-4xl font-light text-stone-900 dark:text-stone-100 capitalize">
              {currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </h2>
            <p className="text-stone-500 dark:text-stone-400 font-sans tracking-wide uppercase text-[10px] md:text-xs mt-2 italic">Vision globale.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrevMonth} className="p-2 border border-stone-200 dark:border-stone-700 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 transition">
              <ChevronLeft className="w-5 h-5 text-stone-600 dark:text-stone-300" />
            </button>
            <button onClick={() => setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1))} className="px-4 py-2 text-xs font-sans font-bold border border-stone-200 dark:border-stone-700 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 transition dark:text-stone-300">
              Aujourd'hui
            </button>
            <button onClick={handleNextMonth} className="p-2 border border-stone-200 dark:border-stone-700 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 transition">
              <ChevronRight className="w-5 h-5 text-stone-600 dark:text-stone-300" />
            </button>
          </div>
        </header>

        <div className="overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm bg-white dark:bg-stone-900">
          <div className="grid grid-cols-7 bg-stone-50 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
              <div key={day} className="py-3 text-center text-xs font-sans font-bold text-stone-500 dark:text-stone-400 uppercase tracking-widest">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 border-t border-stone-200 dark:border-stone-800 -mt-px select-none">
            {renderCalendarDays()}
          </div>
        </div>
      </div>

      {/* Detail Panel */}
      <div className="lg:w-80 flex flex-col gap-6">
        <div className="bg-white dark:bg-stone-900 border text-center border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-sm sticky top-6">
          <h3 className="text-xl font-light text-stone-900 dark:text-stone-100 capitalize mb-1">
            {selectedDate.toLocaleDateString('fr-FR', { weekday: 'long' })}
          </h3>
          <p className="text-sm font-sans font-bold text-stone-500 dark:text-stone-400 uppercase tracking-widest mb-6">
            {selectedDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>

          <form onSubmit={handleAddTask} className="mb-6 flex flex-col gap-3">
            <input
              type="text"
              placeholder="Ajouter une tâche..."
              className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 font-sans text-sm py-3 px-4 rounded-xl outline-none focus:ring-1 focus:ring-emerald-700 transition"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
            />
            <select
              className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 font-sans text-xs py-3 px-3 rounded-xl outline-none focus:ring-1 focus:ring-emerald-700"
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value as LifeDomain)}
            >
              <option value="">Domaine ?</option>
              {DOMAINS.map(domain => (
                <option key={domain} value={domain}>{domain}</option>
              ))}
            </select>
            <button
              type="submit"
              disabled={!newTaskTitle.trim()}
              className="w-full bg-stone-800 dark:bg-emerald-700 text-white p-3 rounded-xl hover:bg-stone-900 dark:hover:bg-emerald-800 transition flex justify-center items-center gap-2 disabled:opacity-50 font-sans text-sm font-bold uppercase tracking-widest"
            >
              <Plus className="w-4 h-4" /> Ajouter
            </button>
          </form>

          <div className="space-y-4 max-h-[40vh] overflow-y-auto hidden-scrollbar text-left">
            <h4 className="text-xs font-sans font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest border-b border-stone-100 dark:border-stone-800 pb-2">Tâches du jour</h4>
            {selectedDayTasks.length === 0 ? (
              <p className="text-stone-400 dark:text-stone-500 text-sm italic py-4 text-center">Aucune tâche prévue.</p>
            ) : (
              selectedDayTasks.map(task => {
                const linkedGoal = data.goals.find(g => g.id === task.goalId);
                const linkedMilestone = task.milestoneId ? data.milestones?.find(m => m.id === task.milestoneId) : undefined;
                return (
                <div key={task.id} className="flex items-start gap-3 p-3 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-100 dark:border-stone-800 group">
                  <button onClick={() => toggleTask(task.id)} className="shrink-0 mt-0.5">
                    {task.isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Circle className="w-5 h-5 text-stone-300 dark:text-stone-600 group-hover:text-stone-400 dark:group-hover:text-stone-500" />
                    )}
                  </button>
                  <div>
                    <p className={`font-sans text-sm font-bold ${task.isCompleted ? 'text-stone-400 dark:text-stone-500 line-through' : 'text-stone-800 dark:text-stone-100'}`}>
                      {task.title}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {linkedGoal && (
                        <div className="flex items-center gap-1 text-[9px] text-emerald-800 dark:text-emerald-400 font-sans font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 w-max px-1.5 py-0.5 rounded">
                          {linkedGoal.title}
                          {linkedMilestone && ` ➔ ${linkedMilestone.title}`}
                        </div>
                      )}
                      {task.domain && (
                        <div className="flex items-center gap-1 text-[9px] text-stone-500 dark:text-stone-400 font-sans font-bold uppercase tracking-widest bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 w-max px-1.5 py-0.5 rounded">
                          <Tag className="w-3 h-3" />
                          {task.domain}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="ml-auto text-stone-300 dark:text-stone-600 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )})
            )}

            {selectedDayJournal && (
              <>
                <h4 className="text-xs font-sans font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest border-b border-stone-100 dark:border-stone-800 pb-2 mt-6">Journal</h4>
                <div className="p-4 bg-indigo-50/50 dark:bg-indigo-500/10 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
                  <p className="text-sm italic text-stone-600 dark:text-stone-300">"{selectedDayJournal.content}"</p>
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
