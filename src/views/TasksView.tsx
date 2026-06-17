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
  const notifiedTasksRef = useRef<Set<string>>(new Set());

  const todayDate = new Date().toISOString().split('T')[0];
  const todayTasks = data.tasks.filter(t => t.date === todayDate);

  // Demander la permission au chargement
  useEffect(() => {
    if ('Notification' in window) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }
  }, []);

  // Simuler le rappel (toutes les X minutes) pour les tâches importantes non complétées.
  // Pour la démo, on vérifie après l'ajout ou au clic.
  const triggerLocalNotification = (taskTitle: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification("Rappel Important", {
            body: `N'oublie pas : ${taskTitle}`,
            icon: '/apple-touch-icon.png',
            badge: '/mask-icon.svg',
            vibrate: [200, 100, 200]
          } as any);
        });
      } else {
        new Notification("Rappel Important", { body: `N'oublie pas : ${taskTitle}` });
      }
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') triggerLocalNotification(taskTitle);
      });
    }
  };

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
      date: todayDate,
      isImportant: isNewTaskImportant,
      ...(goalId ? { goalId } : {}),
      ...(milestoneId ? { milestoneId } : {}),
      ...(selectedDomain ? { domain: selectedDomain as LifeDomain } : {})
    };

    updateData({ tasks: [task, ...data.tasks] });
    setNewTaskTitle('');
    setSelectedReference('');
    setSelectedDomain('');
    setIsNewTaskImportant(false);
    
    // Test notification for important tasks
    if (task.isImportant) {
      triggerLocalNotification(task.title);
    }
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
    
    // Demander la permission si on active l'importance
    if (!task.isImportant && 'Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          triggerLocalNotification(task.title);
        }
      });
    } else if (!task.isImportant) {
       triggerLocalNotification(task.title);
    }

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
      <header className="mb-6 md:mb-8 border-b border-stone-200 pb-6">
        <h2 className="text-3xl md:text-4xl font-light text-stone-900 flex items-center gap-3">
          Mon Quotidien
        </h2>
        <p className="text-stone-500 font-sans tracking-wide uppercase text-[10px] md:text-xs mt-2 italic">Ce que je choisis de faire aujourd'hui.</p>
      </header>

      {/* Add Task Form */}
      <form onSubmit={handleAddTask} className="bg-white p-2 flex flex-col md:flex-row items-stretch md:items-center gap-3 mb-8 md:mb-10 rounded-2xl border border-stone-100 shadow-sm focus-within:ring-1 focus-within:ring-emerald-700 transition">
        <div className="pl-4 text-stone-400 hidden md:block">
          <Plus className="w-5 h-5" />
        </div>
        <input 
          type="text"
          placeholder="Une action pour aujourd'hui..."
          className="flex-1 w-full py-3 px-3 md:px-0 outline-none text-stone-800 placeholder-stone-400 bg-transparent font-sans"
          value={newTaskTitle}
          onChange={e => setNewTaskTitle(e.target.value)}
        />
        
        <button
          type="button"
          onClick={() => setIsNewTaskImportant(!isNewTaskImportant)}
          className={`p-2 rounded-xl transition ${isNewTaskImportant ? 'bg-amber-100 text-amber-600' : 'text-stone-400 hover:bg-stone-50'}`}
          title="Marquer comme important pour recevoir un rappel"
        >
          {isNewTaskImportant ? <BellRing className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
        </button>

        {data.goals.length > 0 && (
          <select 
            className="bg-stone-50 border border-stone-200 text-stone-600 font-sans text-xs py-3 px-3 rounded-xl outline-none focus:ring-1 focus:ring-emerald-700 md:max-w-xs w-full md:w-auto md:mx-0 shrink-0"
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
          className="bg-stone-50 border border-stone-200 text-stone-600 font-sans text-xs py-3 px-3 rounded-xl outline-none focus:ring-1 focus:ring-emerald-700 w-full md:w-auto md:min-w-[140px]"
          value={selectedDomain}
          onChange={(e) => setSelectedDomain(e.target.value as LifeDomain)}
        >
          <option value="">Pilier de vie ?</option>
          {DOMAINS.map(domain => (
            <option key={domain} value={domain}>{domain}</option>
          ))}
        </select>
        
        <button 
          type="submit"
          disabled={!newTaskTitle.trim()}
          className="bg-stone-800 w-full md:w-auto text-white px-5 py-3.5 md:py-3 rounded-xl font-sans uppercase tracking-widest text-xs font-bold hover:bg-stone-900 disabled:opacity-50 transition"
        >
          Ajouter
        </button>
      </form>

      {/* Task List */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <h3 className="text-xl font-light text-stone-800 flex items-center gap-3">
            À faire aujourd'hui
            <span className="bg-emerald-50 text-emerald-800 font-sans uppercase border border-emerald-100 text-xs px-2.5 py-1 rounded-full font-bold">
              {todayTasks.filter(t => !t.isCompleted).length}
            </span>
          </h3>
        </div>

        {todayTasks.length === 0 ? (
          <div className="text-center py-16 bg-[#EAE7E2] rounded-3xl border border-stone-200">
            <CheckSquare className="w-10 h-10 text-stone-300 mx-auto mb-3" />
            <p className="text-stone-500 font-sans font-bold">Ta journée est vierge.</p>
            <p className="text-stone-400 text-sm mt-1 italic">Ajoute une petite action réalisable pour avancer.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {todayTasks.filter(t => !t.isCompleted).map(task => {
              const linkedGoal = data.goals.find(g => g.id === task.goalId);
              const linkedMilestone = task.milestoneId ? data.milestones?.find(m => m.id === task.milestoneId) : undefined;
              
              return (
                <div key={task.id} className="group bg-stone-50/50 border border-stone-100 p-5 rounded-2xl flex items-center gap-4 hover:border-emerald-300 hover:shadow-sm transition-all">
                  <button 
                    onClick={() => toggleTask(task.id)}
                    className="text-stone-300 hover:text-emerald-700 transition-colors shrink-0"
                  >
                    <Circle className="w-6 h-6" />
                  </button>
                  <div className="flex-1">
                    <p className={`font-sans font-bold ${task.isImportant ? 'text-amber-700' : 'text-stone-800'}`}>
                      {task.title}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                       {linkedGoal && (
                        <div className="flex items-center gap-1 text-[10px] text-emerald-800 font-sans font-bold uppercase tracking-wider bg-emerald-50 border border-emerald-100 w-max px-2 py-1 rounded-md">
                          <ChevronRight className="w-3 h-3" />
                          {linkedGoal.title}
                          {linkedMilestone && ` ➔ ${linkedMilestone.title}`}
                        </div>
                      )}
                      {(task.domain || (linkedGoal && linkedGoal.domain)) && (
                        <div className="flex items-center gap-1 text-[9px] text-stone-500 font-sans font-bold uppercase tracking-widest bg-white border border-stone-200 w-max px-2 py-1 rounded-md">
                          <Tag className="w-3 h-3" />
                          {task.domain || (linkedGoal && linkedGoal.domain)}
                        </div>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={() => toggleImportant(task.id)}
                    className={`shrink-0 p-2 transition-colors ${task.isImportant ? 'text-amber-500' : 'text-stone-300 hover:text-amber-500 opacity-0 group-hover:opacity-100'}`}
                    title="Rappel Push activé / désactivé"
                  >
                    {task.isImportant ? <BellRing className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                  </button>
                  <button 
                    onClick={() => deleteTask(task.id)}
                    className="text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              );
            })}

            {/* Completed Tasks */}
            {todayTasks.filter(t => t.isCompleted).length > 0 && (
              <div className="mt-10 pt-8 border-t border-stone-200">
                <h4 className="text-xs font-bold font-sans text-stone-400 mb-5 uppercase tracking-widest">Accomplies</h4>
                <div className="space-y-3 opacity-60">
                  {todayTasks.filter(t => t.isCompleted).map(task => {
                    const linkedGoal = data.goals.find(g => g.id === task.goalId);
                    const linkedMilestone = task.milestoneId ? data.milestones?.find(m => m.id === task.milestoneId) : undefined;
                    return (
                    <div key={task.id} className="bg-transparent border border-stone-200 p-4 rounded-2xl flex items-center gap-4">
                      <button 
                        onClick={() => toggleTask(task.id)}
                        className="text-emerald-700 shrink-0"
                      >
                        <CheckCircle2 className="w-6 h-6" />
                      </button>
                      <div className="flex-1">
                        <p className="text-stone-500 line-through font-sans font-medium">{task.title}</p>
                        {linkedGoal && (
                          <div className="flex items-center gap-1 text-[10px] text-stone-400 font-sans font-bold uppercase tracking-wider w-max pt-1 mt-1">
                            <ChevronRight className="w-3 h-3" />
                            {linkedGoal.title}
                            {linkedMilestone && ` ➔ ${linkedMilestone.title}`}
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={() => deleteTask(task.id)}
                        className="text-stone-400 hover:text-red-500 p-2"
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
