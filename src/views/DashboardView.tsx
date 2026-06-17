import { useMemo, useState, useEffect } from 'react';
import { AppData } from '../types';
import { Target, CheckCircle2, Sparkles, Flame, RefreshCw, Feather } from 'lucide-react';
import { ProgressChart } from '../components/ProgressChart';
import { GoalDomainChart } from '../components/GoalDomainChart';
import { useStreak } from '../hooks/useStreak';

interface DashboardProps {
  data: AppData;
  onChangeView: (view: any) => void;
}

const QUOTES = [
  { text: "Il n'est jamais trop tard pour devenir ce que l'on aurait pu être.", author: "George Eliot" },
  { text: "La meilleure façon de prédire l'avenir est de le créer.", author: "Peter Drucker" },
  { text: "Ce n'est pas le vent qui décide de ta destination, c'est l'orientation que tu donnes à ta voile.", author: "Jim Rohn" },
  { text: "Le meilleur moment pour planter un arbre était il y a 20 ans. Le deuxième meilleur moment est maintenant.", author: "Proverbe chinois" },
  { text: "Chaque jour est une nouvelle chance d'être acteur de sa vie.", author: "Anonyme" },
  { text: "Il n'y a pas d'âge pour se réinventer.", author: "Anonyme" },
  { text: "La vie ce n'est pas d'attendre que les orages passent, c'est d'apprendre à danser sous la pluie.", author: "Sénèque" },
  { text: "La bienveillance envers soi-même est le premier pas vers l'harmonie.", author: "Anonyme" },
  { text: "Prends le temps de faire ce qui rend ton âme heureuse.", author: "Anonyme" },
  { text: "Nul besoin de courir, il suffit d'avancer à son rythme.", author: "Anonyme" }
];

const WEEKLY_CHALLENGES = [
  "Prendre 10 minutes pour observer la nature sans téléphone.",
  "Envoyer un message à une personne chère juste pour lui dire qu'on pense à elle.",
  "Cuisiner un repas inédit ou tester un nouvel ingrédient.",
  "Lire 15 pages d'un livre qui traîne sur la table de chevet.",
  "Sourire à un inconnu dans la rue.",
  "Prendre 5 minutes pour écrire 3 choses positives de la journée.",
  "Marcher dans un quartier ou un endroit qu'on ne connaît pas bien.",
  "Ranger ou désencombrer un petit espace de la maison pendant 15 minutes.",
  "Écouter attentivement quelqu'un sans chercher à préparer sa réponse.",
  "Se coucher 30 minutes plus tôt avec un livre plutôt qu'un écran."
];

export function DashboardView({ data, onChangeView }: DashboardProps) {
  const activeGoals = data.goals.filter(g => g.status === 'En cours').length;
  const todayDate = new Date().toISOString().split('T')[0];
  const todayTasks = data.tasks.filter(t => t.date === todayDate);
  const completedToday = todayTasks.filter(t => t.isCompleted).length;
  const { currentStreak } = useStreak(data.tasks);

  const [weeklyChallenge, setWeeklyChallenge] = useState<{ text: string, date: string } | null>(null);

  useEffect(() => {
    const currentChallengeStr = window.localStorage.getItem('didier_weekly_challenge');
    const now = new Date();
    let isCurrentValid = false;

    if (currentChallengeStr) {
      try {
        const current = JSON.parse(currentChallengeStr);
        const challengeDate = new Date(current.date);
        const diffTime = now.getTime() - challengeDate.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        
        if (diffDays <= 7) {
          setWeeklyChallenge(current);
          isCurrentValid = true;
        }
      } catch (e) {
        // invalid JSON
      }
    }

    if (!isCurrentValid) {
      const newWeekly = {
        text: WEEKLY_CHALLENGES[Math.floor(Math.random() * WEEKLY_CHALLENGES.length)],
        date: now.toISOString()
      };
      window.localStorage.setItem('didier_weekly_challenge', JSON.stringify(newWeekly));
      setWeeklyChallenge(newWeekly);
    }
  }, []);

  const refreshChallenge = () => {
    let newChallengeIndex = Math.floor(Math.random() * WEEKLY_CHALLENGES.length);
    while (weeklyChallenge && WEEKLY_CHALLENGES[newChallengeIndex] === weeklyChallenge.text) {
      newChallengeIndex = Math.floor(Math.random() * WEEKLY_CHALLENGES.length);
    }
    const newWeekly = {
      text: WEEKLY_CHALLENGES[newChallengeIndex],
      date: new Date().toISOString()
    };
    window.localStorage.setItem('didier_weekly_challenge', JSON.stringify(newWeekly));
    setWeeklyChallenge(newWeekly);
  };

  const formattedDate = new Intl.DateTimeFormat('fr-FR', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }).format(new Date());

  const dailyQuote = useMemo(() => {
    // We can use the current day of the year to pick a consistent quote for the day
    const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
    return QUOTES[dayOfYear % QUOTES.length];
  }, []);

  let streakColor = 'bg-stone-50 text-stone-500 border-stone-200';
  let streakIconColor = 'text-stone-400 bg-white border-stone-100';
  let streakMessage = "Commence aujourd'hui.";
  let streakValueColor = 'text-stone-900';

  if (currentStreak >= 7) {
    streakColor = 'bg-emerald-50 text-emerald-800 border-emerald-100';
    streakIconColor = 'text-emerald-600 bg-white border-emerald-50';
    streakMessage = "Remarquable constance.";
  } else if (currentStreak >= 3) {
    streakColor = 'bg-amber-50 text-amber-800 border-amber-100';
    streakIconColor = 'text-amber-600 bg-white border-amber-50';
    streakMessage = "Tu tiens le rythme !";
  } else if (currentStreak > 0) {
    // 1 or 2 days
    streakColor = 'bg-stone-50 text-stone-600 border-stone-100';
    streakIconColor = 'text-amber-500 bg-white border-stone-100';
    streakMessage = "Continue sur ta lancée.";
  }

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 text-stone-800">
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

        <div className={`rounded-3xl p-6 border shadow-sm flex flex-col justify-between ${streakColor}`}>
          <div className="flex items-center gap-4 mb-4">
            <div className={`p-3 rounded-xl border ${streakIconColor}`}>
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs uppercase font-sans font-bold leading-tight opacity-70">Régularité</p>
              <p className={`text-2xl font-light ${streakValueColor}`}>{currentStreak} jour{currentStreak > 1 ? 's' : ''}</p>
            </div>
          </div>
          <p className="text-left text-sm font-sans uppercase tracking-widest font-medium opacity-90">
            {streakMessage}
          </p>
        </div>

        <div className="bg-emerald-900 text-stone-100 rounded-3xl p-6 shadow-md flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Sparkles className="w-16 h-16" />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <h3 className="font-sans text-[10px] uppercase tracking-widest text-emerald-300 font-bold mb-3">Inspiration du Jour</h3>
              <p className="text-sm opacity-90 italic leading-relaxed">
                "{dailyQuote.text}"
              </p>
            </div>
            <p className="text-xs text-right mt-4 opacity-50 font-sans font-bold">— {dailyQuote.author}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ProgressChart tasks={data.tasks} />
        {data.goals.length > 0 && <GoalDomainChart goals={data.goals} />}
      </div>

      {weeklyChallenge && (
        <div className="bg-stone-50 border border-stone-200 rounded-3xl p-6 md:p-8 mb-8 relative overflow-hidden group w-full">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
            <div className="flex items-start gap-4">
              <div className="p-3.5 bg-white shadow-sm border border-stone-100 rounded-2xl text-stone-600 shrink-0">
                <Feather className="w-6 h-6 z-10 relative" />
              </div>
              <div>
                <h3 className="text-xs uppercase font-sans font-bold tracking-widest text-stone-500 mb-1.5 flex items-center gap-2">
                  Défi de la semaine
                </h3>
                <p className="text-lg md:text-xl font-light text-stone-800 leading-snug max-w-2xl">
                  {weeklyChallenge.text}
                </p>
              </div>
            </div>
            
            <button 
              onClick={refreshChallenge}
              className="px-4 py-2 bg-white hover:bg-stone-100 text-stone-500 text-xs font-sans font-bold uppercase tracking-wider rounded-xl transition border border-stone-200 flex items-center gap-2 shrink-0"
              title="Changer de défi"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Nouveau
            </button>
          </div>
        </div>
      )}

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
