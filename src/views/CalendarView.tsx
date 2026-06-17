import { useState, useMemo } from 'react';
import { AppData, Task, LifeDomain } from '../types';
import { ChevronLeft, ChevronRight, CheckCircle2, Circle, Plus, Tag } from 'lucide-react';

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

  const handleAddTask = (e: React.FormEvent) => {
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
          className={`min-h-[80px] p-2 border border-stone-200 flex flex-col items-start transition hover:bg-stone-50 ${
            isSelected ? 'bg-emerald-50 border-emerald-500 relative z-10' : 'bg-white'
          }`}
        >
          <span className={`text-sm font-sans font-bold flex items-center justify-center w-6 h-6 rounded-full ${
            isToday ? 'bg-stone-800 text-white' : 'text-stone-700'
          }`}>
            {i}
          </span>
          
          <div className="mt-auto w-full flex flex-wrap gap-1">
            {totalCount > 0 && (
              <div className="text-[10px] bg-stone-100 px-1 rounded text-stone-600 font-sans">
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
        <header className="flex items-center justify-between mb-8 pb-4 border-b border-stone-200">
          <div>
            <h2 className="text-3xl md:text-4xl font-light text-stone-900 capitalize">
              {currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </h2>
            <p className="text-stone-500 font-sans tracking-wide uppercase text-[10px] md:text-xs mt-2 italic">Vision globale.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrevMonth} className="p-2 border border-stone-200 rounded-xl hover:bg-stone-50 transition">
              <ChevronLeft className="w-5 h-5 text-stone-600" />
            </button>
            <button onClick={() => setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1))} className="px-4 py-2 text-xs font-sans font-bold border border-stone-200 rounded-xl hover:bg-stone-50 transition">
              Aujourd'hui
            </button>
            <button onClick={handleNextMonth} className="p-2 border border-stone-200 rounded-xl hover:bg-stone-50 transition">
              <ChevronRight className="w-5 h-5 text-stone-600" />
            </button>
          </div>
        </header>

        <div className="overflow-hidden rounded-2xl border border-stone-200 shadow-sm bg-white">
          <div className="grid grid-cols-7 bg-stone-50 border-b border-stone-200">
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
              <div key={day} className="py-3 text-center text-xs font-sans font-bold text-stone-500 uppercase tracking-widest">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 border-t border-stone-200 -mt-px select-none">
            {renderCalendarDays()}
          </div>
        </div>
      </div>

      {/* Detail Panel */}
      <div className="lg:w-80 flex flex-col gap-6">
        <div className="bg-white border text-center border-stone-200 rounded-3xl p-6 shadow-sm sticky top-6">
          <h3 className="text-xl font-light text-stone-900 capitalize mb-1">
            {selectedDate.toLocaleDateString('fr-FR', { weekday: 'long' })}
          </h3>
          <p className="text-sm font-sans font-bold text-stone-500 uppercase tracking-widest mb-6">
            {selectedDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>

          <form onSubmit={handleAddTask} className="mb-6 flex flex-col gap-3">
            <input 
              type="text" 
              placeholder="Ajouter une tâche..." 
              className="w-full bg-stone-50 border border-stone-200 text-stone-800 font-sans text-sm py-3 px-4 rounded-xl outline-none focus:ring-1 focus:ring-emerald-700 transition"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
            />
            <select 
              className="w-full bg-stone-50 border border-stone-200 text-stone-600 font-sans text-xs py-3 px-3 rounded-xl outline-none focus:ring-1 focus:ring-emerald-700"
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
              className="w-full bg-stone-800 text-white p-3 rounded-xl hover:bg-stone-900 transition flex justify-center items-center gap-2 disabled:opacity-50 font-sans text-sm font-bold uppercase tracking-widest"
            >
              <Plus className="w-4 h-4" /> Ajouter
            </button>
          </form>

          <div className="space-y-4 max-h-[40vh] overflow-y-auto hidden-scrollbar text-left">
            <h4 className="text-xs font-sans font-bold text-stone-400 uppercase tracking-widest border-b border-stone-100 pb-2">Tâches du jour</h4>
            {selectedDayTasks.length === 0 ? (
              <p className="text-stone-400 text-sm italic py-4 text-center">Aucune tâche prévue.</p>
            ) : (
              selectedDayTasks.map(task => (
                <div key={task.id} className="flex items-start gap-3 p-3 bg-stone-50 rounded-xl border border-stone-100 group">
                  <button onClick={() => toggleTask(task.id)} className="shrink-0 mt-0.5">
                    {task.isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Circle className="w-5 h-5 text-stone-300 group-hover:text-stone-400" />
                    )}
                  </button>
                  <div>
                    <p className={`font-sans text-sm font-bold ${task.isCompleted ? 'text-stone-400 line-through' : 'text-stone-800'}`}>
                      {task.title}
                    </p>
                    {task.domain && (
                      <div className="flex items-center gap-1 text-[9px] text-stone-500 font-sans font-bold uppercase tracking-widest mt-1">
                        <Tag className="w-3 h-3" />
                        {task.domain}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {selectedDayJournal && (
              <>
                <h4 className="text-xs font-sans font-bold text-stone-400 uppercase tracking-widest border-b border-stone-100 pb-2 mt-6">Journal</h4>
                <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                  <p className="text-sm italic text-stone-600">"{selectedDayJournal.content}"</p>
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
