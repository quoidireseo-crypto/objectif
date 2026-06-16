import { AppData } from '../types';
import { Target, CheckCircle2 } from 'lucide-react';
import { ProgressChart } from '../components/ProgressChart';

interface DashboardProps {
  data: AppData;
  onChangeView: (view: any) => void;
}

export function DashboardView({ data, onChangeView }: DashboardProps) {
  const activeGoals = data.goals.filter(g => g.status === 'En cours').length;
  const todayDate = new Date().toISOString().split('T')[0];
  const todayTasks = data.tasks.filter(t => t.date === todayDate);
  const completedToday = todayTasks.filter(t => t.isCompleted).length;

  const formattedDate = new Intl.DateTimeFormat('fr-FR', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }).format(new Date());

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col min-h-full">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8 border-b border-stone-200 pb-6 w-full">
        <div>
          <h2 className="text-3xl md:text-4xl font-light text-stone-900 flex items-center gap-3">
            Bonjour, Didier
          </h2>
          <p className="text-stone-500 font-sans tracking-wide uppercase text-[10px] md:text-xs mt-2 md:mt-3 italic max-w-sm">
            L'art de l'intention — 60 ans, le nouveau départ
          </p>
        </div>
        <div className="text-left md:text-right w-full md:w-auto">
          <p className="text-[10px] md:text-sm text-stone-400 font-sans uppercase tracking-tighter capitalize mb-1 md:mb-0">{formattedDate}</p>
          <p className="text-xl md:text-2xl font-light text-emerald-800 mt-0 md:mt-1">Choisir plutôt que subir.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-stone-800">
        <div className="bg-white rounded-3xl p-6 border border-stone-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-stone-400 uppercase font-sans font-bold">Cap en cours</p>
              <p className="text-2xl font-light text-stone-900">{activeGoals} Objectif{activeGoals > 1 ? 's' : ''}</p>
            </div>
          </div>
          <button 
            onClick={() => onChangeView('goals')}
            className="text-left text-sm text-emerald-700 font-sans uppercase tracking-widest hover:text-emerald-800 transition"
          >
            Examiner la direction &rarr;
          </button>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-stone-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-stone-400 uppercase font-sans font-bold">Actions du jour</p>
              <p className="text-2xl font-light text-stone-900">{completedToday} / {todayTasks.length} accomplis</p>
            </div>
          </div>
          <button 
            onClick={() => onChangeView('tasks')}
            className="text-left text-sm text-emerald-700 font-sans uppercase tracking-widest hover:text-emerald-800 transition"
          >
            Voir mon quotidien &rarr;
          </button>
        </div>

        <div className="bg-emerald-900 text-stone-100 rounded-3xl p-6 shadow-md flex flex-col justify-center relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="font-light text-lg mb-2">Le Rappel</h3>
            <p className="text-sm opacity-80 italic leading-relaxed">
              "Il n'est jamais trop tard pour devenir ce que l'on aurait pu être."
            </p>
            <p className="text-xs text-right mt-4 opacity-50 font-sans">— George Eliot</p>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <ProgressChart tasks={data.tasks} />
      </div>

      {data.goals.length === 0 && (
        <div className="bg-[#EAE7E2] rounded-3xl p-6 md:p-8 text-center max-w-2xl mx-auto border border-stone-200 w-full shrink-0">
          <h3 className="text-xs md:text-sm uppercase tracking-widest text-stone-500 mb-4 font-sans">La première étape</h3>
          <p className="text-base md:text-lg leading-snug font-light italic mb-6">
            60 ans, c'est le début d'un nouveau chapitre. Cet outil est là pour t'aider à définir ce que tu veux vraiment, sans pression, juste avec de l'intention.
          </p>
          <button 
            onClick={() => onChangeView('goals')}
            className="bg-stone-800 w-full sm:w-auto flex justify-center mx-auto text-white px-6 py-3.5 md:py-3 rounded-xl font-sans text-xs uppercase tracking-widest font-bold hover:bg-stone-900 active:scale-95 transition-all shadow-sm"
          >
            Fixer ma première intention
          </button>
        </div>
      )}
    </div>
  );
}
