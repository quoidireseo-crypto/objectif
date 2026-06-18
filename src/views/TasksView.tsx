import { useState, FormEvent, useEffect, useRef } from 'react';
import { AppData, Task, LifeDomain } from '../types';
import { CheckSquare, Plus, Circle, CheckCircle2, ChevronRight, Bell, BellRing, Tag, Trash2 } from 'lucide-react';

interface TasksProps {
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

export function TasksView({ data, updateData }: TasksProps) {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedReference, setSelectedReference] = useState<string>(''); // format: goalId or goalId|milestoneId
  const [selectedDomain, setSelectedDomain] = useState<LifeDomain | ''>('');
  const [isNewTaskImportant, setIsNewTaskImportant] = useState(false);

  const todayDate = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayDate);
  const [plannedNotice, setPlannedNotice] = useState<string>('');
  const todayTasks = data.tasks.filter(t => t.date === todayDate);

  // Demander la permission au chargement
  useEffect(() => {
    if ('Notification' in window) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }
  }, []);

  const handleAddTask = (e: FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    let goalId: string | undefined;
    let milestoneId: string | undefined;

    if (selectedReference) {
      const parts = selectedReference.split('|');
      goalId = parts[0];
      if (parts.length > 1) {
        milestoneId = parts[1];
      }
    }

    const task: Task = {
      id: Date.now().toString(),
      title: newTaskTitle.trim(),
      isCompleted: false,
      date: selectedDate || todayDate,
      isImportant: isNewTaskImportant,
      ...(goalId ? { goalId } : {}),
      ...(milestoneId ? { milestoneId } : {}),
      ...(selectedDomain ? { domain: selectedDomain as LifeDomain } : {})
    };

    updateData({ tasks: [task, ...data.tasks] });

    if (task.date !== todayDate) {
      const label = new Date(task.date + 'T00:00:00').toLocaleDateString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long'
      });
      setPlannedNotice(`Action planifiée pour ${label}. Retrouve-la dans ton calendrier le jour venu.`);
    } else {
      setPlannedNotice('');
    }

    setNewTaskTitle('');
    setSelectedReference('');
    setSelectedDomain('');
    setIsNewTaskImportant(false);
    setSelectedDate(todayDate);
  };

  const toggleTask = (id: string) => {
    const newTasks = data.tasks.map(t => 
      t.id === id ? { ...t, isCompleted: !t.isCompleted } : t
    );
    updateData({ tasks: newTasks });
  };

  const toggleImportant = (id: string) => {
    const task = data.tasks.find(t => t.id === id);
    if (!task) return;

    const newTasks = data.tasks.map(t => 
      t.id === id ? { ...t, isImportant: !t.isImportant } : t
    );
    updateData({ tasks: newTasks });
  };

  const deleteTask = (id: string) => {
    updateData({ tasks: data.tasks.filter(t => t.id !== id) });
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="mb-6 md:mb-8 border-b border-stone-200 dark:border-stone-800 pb-6">
        <h2 className="text-3xl md:text-4xl font-light text-stone-900 dark:text-stone-100 flex items-center gap-3">
          Mon Quotidien
        </h2>
        <p className="text-stone-500 dark:text-stone-400 font-sans tracking-wide uppercase text-[10px] md:text-xs mt-2 italic">Ce que je choisis de faire aujourd'hui.</p>
      </header>

      {/* Add Task Form */}
      <form onSubmit={handleAddTask} className="bg-white dark:bg-stone-900 p-2 flex flex-col md:flex-row items-stretch md:items-center gap-3 mb-8 md:mb-10 rounded-2xl border border-stone-100 dark:border-stone-800 shadow-sm focus-within:ring-1 focus-within:ring-emerald-700 transition">
        <div className="pl-4 text-stone-400 dark:text-stone-500 hidden md:block">
          <Plus className="w-5 h-5" />
        </div>
        <input
          type="text"
          placeholder="Une action pour aujourd'hui..."
          className="flex-1 w-full py-3 px-3 md:px-0 outline-none text-stone-800 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 bg-transparent font-sans"
          value={newTaskTitle}
          onChange={e => setNewTaskTitle(e.target.value)}
        />

        <button
          type="button"
          onClick={() => setIsNewTaskImportant(!isNewTaskImportant)}
          className={`p-2 rounded-xl transition ${isNewTaskImportant ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'text-stone-400 dark:text-stone-500 hover:bg-stone-50 dark:hover:bg-stone-800'}`}
          title="Marquer comme important pour recevoir un rappel"
        >
          {isNewTaskImportant ? <BellRing className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
        </button>

        {data.goals.length > 0 && (
          <select
            className="bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 font-sans text-xs py-3 px-3 rounded-xl outline-none focus:ring-1 focus:ring-emerald-700 md:max-w-xs w-full md:w-auto md:mx-0 shrink-0"
            value={selectedReference}
            onChange={(e) => setSelectedReference(e.target.value)}
          >
            <option value="">Lier à un objectif ?</option>
            {data.goals.filter(g => g.status === 'En cours').map(g => {
              const milestones = (data.milestones || []).filter(m => m.goalId === g.id && !m.isCompleted);
              
              if (milestones.length > 0) {
                return (
                  <optgroup key={g.id} label={g.title}>
                    <option value={g.id}>Objectif global</option>
                    {milestones.sort((a,b) => a.order - b.order).map(m => (
                      <option key={m.id} value={`${g.id}|${m.id}`}>→ Étape {m.order} : {m.title}</option>
                    ))}
                  </optgroup>
                );
              }
              return <option key={g.id} value={g.id}>{g.title}</option>;
            })}
          </select>
        )}

        {/* Domaine / Catégorie selector */}
        <select
          className="bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 font-sans text-xs py-3 px-3 rounded-xl outline-none focus:ring-1 focus:ring-emerald-700 w-full md:w-auto md:min-w-[140px]"
          value={selectedDomain}
          onChange={(e) => setSelectedDomain(e.target.value as LifeDomain)}
        >
          <option value="">Pilier de vie ?</option>
          {DOMAINS.map(domain => (
            <option key={domain} value={domain}>{domain}</option>
          ))}
        </select>

        {/* Date selector (aujourd'hui par défaut, planification possible) */}
        <input
          type="date"
          min={todayDate}
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          title="Planifier pour un autre jour (aujourd'hui par défaut)"
          className="bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 font-sans text-xs py-3 px-3 rounded-xl outline-none focus:ring-1 focus:ring-emerald-700 w-full md:w-auto shrink-0"
        />

        <button
          type="submit"
          disabled={!newTaskTitle.trim()}
          className="bg-stone-800 dark:bg-emerald-700 w-full md:w-auto text-white px-5 py-3.5 md:py-3 rounded-xl font-sans uppercase tracking-widest text-xs font-bold hover:bg-stone-900 dark:hover:bg-emerald-800 disabled:opacity-50 transition"
        >
          Ajouter
        </button>
      </form>

      {plannedNotice && (
        <div className="-mt-4 mb-8 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-800 dark:text-blue-400 text-sm font-sans rounded-2xl px-4 py-3 flex items-center justify-between gap-3 animate-in fade-in">
          <span>{plannedNotice}</span>
          <button onClick={() => setPlannedNotice('')} className="text-blue-400 dark:text-blue-500 hover:text-blue-700 dark:hover:text-blue-300 text-xs font-bold uppercase tracking-wider shrink-0">OK</button>
        </div>
      )}

      {/* Task List */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <h3 className="text-xl font-light text-stone-800 dark:text-stone-200 flex items-center gap-3">
            À faire aujourd'hui
            <span className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 font-sans uppercase border border-emerald-100 dark:border-emerald-500/20 text-xs px-2.5 py-1 rounded-full font-bold">
              {todayTasks.filter(t => !t.isCompleted).length}
            </span>
          </h3>
        </div>

        {todayTasks.length === 0 ? (
          <div className="text-center py-16 bg-[#EAE7E2] dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800">
            <CheckSquare className="w-10 h-10 text-stone-300 dark:text-stone-600 mx-auto mb-3" />
            <p className="text-stone-500 dark:text-stone-400 font-sans font-bold">Ta journée est vierge.</p>
            <p className="text-stone-400 dark:text-stone-500 text-sm mt-1 italic">Ajoute une petite action réalisable pour avancer.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {todayTasks.filter(t => !t.isCompleted).map(task => {
              const linkedGoal = data.goals.find(g => g.id === task.goalId);
              const linkedMilestone = task.milestoneId ? data.milestones?.find(m => m.id === task.milestoneId) : undefined;
              
              return (
                <div key={task.id} className="group bg-stone-50/50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800 p-5 rounded-2xl flex items-center gap-4 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-sm transition-all">
                  <button
                    onClick={() => toggleTask(task.id)}
                    className="text-stone-300 dark:text-stone-600 hover:text-emerald-700 dark:hover:text-emerald-500 transition-colors shrink-0"
                  >
                    <Circle className="w-6 h-6" />
                  </button>
                  <div className="flex-1">
                    <p className={`font-sans font-bold ${task.isImportant ? 'text-amber-700 dark:text-amber-400' : 'text-stone-800 dark:text-stone-100'}`}>
                      {task.title}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                       {linkedGoal && (
                        <div className="flex items-center gap-1 text-[10px] text-emerald-800 dark:text-emerald-400 font-sans font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 w-max px-2 py-1 rounded-md">
                          <ChevronRight className="w-3 h-3" />
                          {linkedGoal.title}
                          {linkedMilestone && ` ➔ ${linkedMilestone.title}`}
                        </div>
                      )}
                      {(task.domain || (linkedGoal && linkedGoal.domain)) && (
                        <div className="flex items-center gap-1 text-[9px] text-stone-500 dark:text-stone-400 font-sans font-bold uppercase tracking-widest bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 w-max px-2 py-1 rounded-md">
                          <Tag className="w-3 h-3" />
                          {task.domain || (linkedGoal && linkedGoal.domain)}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleImportant(task.id)}
                    className={`shrink-0 p-2 transition-colors ${task.isImportant ? 'text-amber-500 dark:text-amber-400' : 'text-stone-300 dark:text-stone-600 hover:text-amber-500 dark:hover:text-amber-400 opacity-0 group-hover:opacity-100'}`}
                    title="Rappel Push activé / désactivé"
                  >
                    {task.isImportant ? <BellRing className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="text-stone-300 dark:text-stone-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              );
            })}

            {/* Completed Tasks */}
            {todayTasks.filter(t => t.isCompleted).length > 0 && (
              <div className="mt-10 pt-8 border-t border-stone-200 dark:border-stone-800">
                <h4 className="text-xs font-bold font-sans text-stone-400 dark:text-stone-500 mb-5 uppercase tracking-widest">Accomplies</h4>
                <div className="space-y-3 opacity-60">
                  {todayTasks.filter(t => t.isCompleted).map(task => {
                    const linkedGoal = data.goals.find(g => g.id === task.goalId);
                    const linkedMilestone = task.milestoneId ? data.milestones?.find(m => m.id === task.milestoneId) : undefined;
                    return (
                    <div key={task.id} className="bg-transparent border border-stone-200 dark:border-stone-700 p-4 rounded-2xl flex items-center gap-4">
                      <button
                        onClick={() => toggleTask(task.id)}
                        className="text-emerald-700 dark:text-emerald-400 shrink-0"
                      >
                        <CheckCircle2 className="w-6 h-6" />
                      </button>
                      <div className="flex-1">
                        <p className="text-stone-500 dark:text-stone-400 line-through font-sans font-medium">{task.title}</p>
                        {linkedGoal && (
                          <div className="flex items-center gap-1 text-[10px] text-stone-400 dark:text-stone-500 font-sans font-bold uppercase tracking-wider w-max pt-1 mt-1">
                            <ChevronRight className="w-3 h-3" />
                            {linkedGoal.title}
                            {linkedMilestone && ` ➔ ${linkedMilestone.title}`}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="text-stone-400 dark:text-stone-500 hover:text-red-500 p-2"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  )})}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
