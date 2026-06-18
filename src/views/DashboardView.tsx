import { useMemo, useState, useEffect } from 'react';
import { AppData, ViewType } from '../types';
import { Target, CheckCircle2, Sparkles, Flame, RefreshCw, Feather, Moon, Award, Pencil } from 'lucide-react';
import { ProgressChart } from '../components/ProgressChart';
import { GoalDomainChart } from '../components/GoalDomainChart';
import { useStreak } from '../hooks/useStreak';
import { GraphView } from './GraphView';
import { OrphansPanel } from '../components/OrphansPanel';

interface DashboardProps {
  data: AppData;
  updateData: (data: Partial<AppData>) => void;
  onChangeView: (view: ViewType) => void;
  userProfile: { name: string; ageGroup?: string; focusArea?: string } | null;
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

export function DashboardView({ data, updateData, onChangeView, userProfile }: DashboardProps) {
  const activeGoals = data.goals.filter(g => g.status === 'En cours').length;
  const todayDate = new Date().toISOString().split('T')[0];
  const todayTasks = data.tasks.filter(t => t.date === todayDate);
  const completedToday = todayTasks.filter(t => t.isCompleted).length;
  const { currentStreak } = useStreak(data.tasks);

  const [weeklyChallenge, setWeeklyChallenge] = useState<{ text: string, date: string } | null>(null);

  const todayReflection = useMemo(
    () => (data.eveningReflections || []).find(r => r.date === todayDate),
    [data.eveningReflections, todayDate]
  );
  const todaySuccess = todayReflection?.content || '';

  const [successInput, setSuccessInput] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const isSaved = !!todaySuccess && !isEditing;

  const handleSaveSuccess = () => {
    const value = successInput.trim();
    if (!value) return;
    const others = (data.eveningReflections || []).filter(r => r.date !== todayDate);
    updateData({
      eveningReflections: [
        ...others,
        { date: todayDate, content: value, createdAt: new Date().toISOString() },
      ],
    });
    setIsEditing(false);
    setSuccessInput('');
  };

  const handleEditSuccess = () => {
    setSuccessInput(todaySuccess);
    setIsEditing(true);
  };

  // Get recent 7 days (including today) to display their badge statuses
  const recentDays = useMemo(() => {
    const list = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const success = (data.eveningReflections || []).find(r => r.date === dateStr)?.content || '';

      const dayName = d.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '');
      // Capitalize first letter of day name
      const dayNameCap = dayName.charAt(0).toUpperCase() + dayName.slice(1);
      
      list.push({
        dateStr,
        dayName: dayNameCap,
        success,
        isToday: dateStr === todayDate,
        formattedDate: d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
      });
    }
    return list;
  }, [todayDate, data.eveningReflections]);

  const recentRitualDays = useMemo(() => {
    const list = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      const dayName = d.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '');
      const dayNameCap = dayName.charAt(0).toUpperCase() + dayName.slice(1);
      
      const formattedDateFull = d.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      });
      const formattedDateFullCap = formattedDateFull.charAt(0).toUpperCase() + formattedDateFull.slice(1);

      const ritual = (data.morningRituals || []).find(r => r.date === dateStr);
      
      list.push({
        dateStr,
        dayName: dayNameCap,
        formattedDate: formattedDateFullCap,
        ritual
      });
    }
    return list;
  }, [data.morningRituals]);

  const todayRitual = useMemo(() => {
    return (data.morningRituals || []).find(r => r.date === todayDate);
  }, [data.morningRituals, todayDate]);

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

  const dailyQuote = useMemo(() => {
    // We can use the current day of the year to pick a consistent quote for the day
    const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
    return QUOTES[dayOfYear % QUOTES.length];
  }, []);

  let streakColor = 'bg-stone-50 text-stone-500 border-stone-200 dark:bg-stone-800 dark:text-stone-400 dark:border-stone-700';
  let streakIconColor = 'text-stone-400 bg-white border-stone-100 dark:text-stone-500 dark:bg-stone-900 dark:border-stone-800';
  let streakMessage = "Commence aujourd'hui.";
  let streakValueColor = 'text-stone-900 dark:text-stone-100';

  if (currentStreak >= 7) {
    streakColor = 'bg-emerald-50 text-emerald-800 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
    streakIconColor = 'text-emerald-600 bg-white border-emerald-50 dark:text-emerald-400 dark:bg-stone-900 dark:border-emerald-500/20';
    streakMessage = "Remarquable constance.";
  } else if (currentStreak >= 3) {
    streakColor = 'bg-amber-50 text-amber-800 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
    streakIconColor = 'text-amber-600 bg-white border-amber-50 dark:text-amber-400 dark:bg-stone-900 dark:border-amber-500/20';
    streakMessage = "Tu tiens le rythme !";
  } else if (currentStreak > 0) {
    // 1 or 2 days
    streakColor = 'bg-stone-50 text-stone-600 border-stone-100 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700';
    streakIconColor = 'text-amber-500 bg-white border-stone-100 dark:text-amber-400 dark:bg-stone-900 dark:border-stone-800';
    streakMessage = "Continue sur ta lancée.";
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col min-h-full py-2">

      {/* Greeting Banner */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-stone-200/55 dark:border-stone-800 pb-6">
        <div>
          <h2 className="text-3xl font-light text-stone-900 dark:text-stone-100">
            Bonjour, <span className="font-serif italic text-[#047857] dark:text-emerald-400">{userProfile?.name}</span>
          </h2>
          <p className="text-stone-500 dark:text-stone-400 font-sans tracking-wide uppercase text-[10px] md:text-xs mt-2 italic">
            Chaque jour est un nouveau départ.
          </p>
        </div>
        <div className="text-left md:text-right">
          <p className="text-[10px] md:text-xs text-stone-400 dark:text-stone-500 font-sans uppercase tracking-widest leading-none capitalize mb-1">
            {new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}
          </p>
          <p className="text-sm font-serif italic text-[#047857] dark:text-emerald-400 leading-snug">Se donner la direction pour ne pas subir.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 text-stone-800 dark:text-stone-200">
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-100 dark:border-stone-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-xl">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-stone-400 dark:text-stone-500 uppercase font-sans font-bold">Cap en cours</p>
              <p className="text-2xl font-light text-stone-900 dark:text-stone-100">{activeGoals} Objectif{activeGoals > 1 ? 's' : ''}</p>
            </div>
          </div>
          <button
            onClick={() => onChangeView('goals')}
            className="text-left text-sm text-emerald-700 dark:text-emerald-400 font-sans uppercase tracking-widest hover:text-emerald-800 dark:hover:text-emerald-300 transition"
          >
            Examiner la direction &rarr;
          </button>
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-100 dark:border-stone-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-stone-400 dark:text-stone-500 uppercase font-sans font-bold">Actions du jour</p>
              <p className="text-2xl font-light text-stone-900 dark:text-stone-100">{completedToday} / {todayTasks.length} accomplis</p>
            </div>
          </div>
          <button
            onClick={() => onChangeView('tasks')}
            className="text-left text-sm text-emerald-700 dark:text-emerald-400 font-sans uppercase tracking-widest hover:text-emerald-800 dark:hover:text-emerald-300 transition"
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

        <div className="bg-emerald-900 dark:bg-emerald-950 text-stone-100 rounded-3xl p-6 shadow-md flex flex-col justify-center relative overflow-hidden group">
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

      {/* Rituels du matin */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-100 dark:border-stone-800 shadow-sm mb-8 animate-in fade-in slide-in-from-bottom-4 duration-550">
        <h3 className="text-xl font-light text-stone-900 dark:text-stone-100">Régularité du rituel</h3>
        <p className="text-xs font-sans uppercase tracking-widest text-stone-400 dark:text-stone-500 mt-1">7 jours glissants</p>
        
        <div className="flex flex-wrap items-center gap-5 mt-6">
          {recentRitualDays.map((day) => {
            const ritual = day.ritual;
            let colorClass = "";
            let statusTitle = "";
            
            if (!ritual) {
              colorClass = "bg-stone-100 dark:bg-stone-800 border border-dashed border-stone-300 dark:border-stone-700";
              statusTitle = "Aucun rituel";
            } else if (ritual.status === 'skipped') {
              colorClass = "bg-stone-200 dark:bg-stone-700";
              statusTitle = "Passé";
            } else if (ritual.status === 'completed') {
              if (ritual.mood === 'Super') {
                colorClass = "bg-amber-400";
                statusTitle = "Super";
              } else if (ritual.mood === 'Bien') {
                colorClass = "bg-emerald-500";
                statusTitle = "Bien";
              } else if (ritual.mood === 'Moyen') {
                colorClass = "bg-stone-400 dark:bg-stone-500";
                statusTitle = "Moyen";
              } else if (ritual.mood === 'Difficile') {
                colorClass = "bg-stone-600 dark:bg-stone-700";
                statusTitle = "Difficile";
              }
            }

            const priorityText = ritual?.priority ? ` - Priorité : ${ritual.priority}` : '';
            const finalTitle = `${statusTitle} - ${day.formattedDate}${priorityText}`;

            return (
              <div key={day.dateStr} className="flex flex-col items-center gap-2">
                <div 
                  className={`w-8 h-8 rounded-full ${colorClass} transition transform hover:scale-110 cursor-help flex items-center justify-center`}
                  title={finalTitle}
                >
                </div>
                <span className="text-[10px] text-stone-400 dark:text-stone-500 font-sans font-medium">
                  {day.dayName}
                </span>
              </div>
            );
          })}
        </div>

        {todayRitual?.status === 'completed' && todayRitual?.priority && (
          <p className="italic text-stone-600 dark:text-stone-300 text-sm mt-4">
            Priorité du jour : {todayRitual.priority}
          </p>
        )}
      </div>

      <div className="mb-8">
        <OrphansPanel 
          data={data} 
          updateData={updateData}
          onChangeView={onChangeView}
        />
      </div>

      {/* Aperçu de la carte mentale */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800 rounded-3xl p-6 md:p-8 mb-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-xl font-serif font-light text-stone-800 dark:text-stone-200">
              Ta Constellation d'Intentions
            </h3>
            <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">
              Chaque action relie à un cap plus grand.
            </p>
          </div>
          <button
            onClick={() => onChangeView('graph')}
            className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 transition font-sans text-sm font-bold uppercase tracking-widest text-left sm:text-right shrink-0"
          >
            Explorer ma carte complète &rarr;
          </button>
        </div>

        {/* Thumbnail Preview Area */}
        <div className="relative h-[200px] w-full overflow-hidden rounded-3xl border border-stone-100 dark:border-stone-800 bg-stone-50/20 dark:bg-stone-800/20 pointer-events-none select-none">
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              style={{
                width: '1000px',
                height: '600px',
                transform: 'scale(0.4)',
                transformOrigin: 'center',
              }}
              className="shrink-0"
            >
              <GraphView data={data} isPreview={true} />
            </div>
          </div>
          {/* Bottom Fade Gradient for "Aperçu" style */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-white dark:to-stone-900 pointer-events-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ProgressChart tasks={data.tasks} />
        {data.goals.length > 0 && <GoalDomainChart goals={data.goals} />}
      </div>

      {/* BILAN DU SOIR SECTION */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 md:p-8 mb-8 shadow-xs relative overflow-hidden">
        {/* Decorative Top Line/Indicator */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500/10"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs uppercase font-sans font-bold tracking-widest text-stone-400 dark:text-stone-500">
                Le Bilan du Soir
              </h3>
              <p className="text-lg font-serif italic text-stone-800 dark:text-stone-200">
                Le Bilan des Réussites
              </p>
            </div>
          </div>

          {/* Badge Count Subtitle */}
          <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-full">
            <Award className="w-4 h-4 text-amber-500 dark:text-amber-400 animate-pulse" />
            <span className="text-xs font-sans font-semibold text-amber-700 dark:text-amber-400">
              {recentDays.filter(d => d.success).length} badge{recentDays.filter(d => d.success).length > 1 ? 's' : ''} cette semaine
            </span>
          </div>
        </div>

        {/* Dynamic Inner Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Success Area: Form vs Display Badge */}
          <div className="lg:col-span-8 flex flex-col justify-center h-full">
            {!isSaved ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h4 className="text-base font-sans font-semibold text-stone-800 dark:text-stone-200">
                    Quelle est votre victoire d'aujourd'hui ?
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Notez ici un seul fait, une action, un moment précieux ou un accomplissement dont vous êtes fier(e) aujourd'hui, aussi modeste soit-il.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={successInput}
                    onChange={(e) => setSuccessInput(e.target.value)}
                    placeholder="Ex: J'ai pris le temps de marcher 20 minutes en pleine conscience..."
                    className="flex-1 px-4 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-stone-800 dark:text-stone-100 font-sans text-sm transition"
                    maxLength={140}
                  />
                  <button
                    onClick={handleSaveSuccess}
                    disabled={!successInput.trim()}
                    className="px-6 py-3 bg-stone-900 dark:bg-emerald-700 text-amber-300 dark:text-amber-200 rounded-2xl font-sans text-xs uppercase tracking-widest font-bold hover:bg-stone-800 dark:hover:bg-emerald-800 disabled:opacity-55 disabled:hover:bg-stone-900 dark:disabled:hover:bg-emerald-700 transition flex items-center justify-center gap-2 shadow-xs shrink-0 cursor-pointer"
                  >
                    Célébrer &rarr;
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-[#FFFBEB] dark:bg-amber-500/10 border border-amber-200/50 dark:border-amber-500/20 rounded-3xl p-6 relative flex flex-col items-center text-center animate-in zoom-in-95 duration-500">
                {/* Visual Amber Badge Award */}
                <div className="relative mb-4 flex items-center justify-center">
                  {/* Glowing Amber Circles */}
                  <div className="absolute w-16 h-16 bg-amber-400/20 rounded-full animate-ping opacity-60"></div>
                  <div className="absolute w-12 h-12 bg-amber-400/30 rounded-full"></div>
                  <div className="relative p-2.5 bg-amber-500 text-white rounded-full shadow-md z-10">
                    <Award className="w-8 h-8" />
                  </div>
                </div>

                <span className="text-[10px] uppercase tracking-widest text-amber-700 dark:text-amber-400 font-sans font-bold bg-amber-100 dark:bg-amber-500/20 px-3 py-1 rounded-full mb-3">
                  Victoire Célébrée • Badge Obtenu
                </span>

                <p className="font-serif italic text-lg md:text-xl text-stone-900 dark:text-stone-100 max-w-xl px-2 leading-relaxed">
                  « {todaySuccess} »
                </p>

                <p className="text-xs text-stone-500 dark:text-stone-400 font-sans mt-4 max-w-sm">
                  Chaque réussite, petite ou grande, conforte votre direction. Chaque jour est votre nouveau départ.
                </p>

                {/* Adjust/Edit Button */}
                <button
                  onClick={handleEditSuccess}
                  className="mt-6 flex items-center gap-2 text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 text-xs font-sans font-medium hover:underline transition cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Modifier ma réussite
                </button>
              </div>
            )}
          </div>
          
          {/* History / Weekly Badge Progress Tracking Sidebar inside the card */}
          <div className="lg:col-span-4 bg-stone-50 dark:bg-stone-800 rounded-2xl p-5 border border-stone-100 dark:border-stone-700">
            <h4 className="text-[10px] uppercase tracking-wider font-sans font-bold text-stone-400 dark:text-stone-500 mb-4 text-center lg:text-left">
              Vos Badges Hebdomadaires
            </h4>
            
            <div className="grid grid-cols-7 lg:grid-cols-1 gap-2.5">
              {recentDays.map((day) => (
                <div 
                  key={day.dateStr} 
                  className={`flex flex-col lg:flex-row items-center lg:justify-between gap-1.5 lg:gap-3 p-1 rounded-xl transition ${
                    day.isToday ? 'bg-white/80 dark:bg-stone-700/80 shadow-2xs border border-stone-200/50 dark:border-stone-600/50' : ''
                  }`}
                  title={day.success ? `Réussite : ${day.success}` : "Pas de réussite notée pour ce jour"}
                >
                  <div className="flex flex-col lg:flex-row items-center gap-1 lg:gap-2.5">
                    {/* The small Amber visual badge circle */}
                    {day.success ? (
                      <div className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center shadow-xs shrink-0 relative group">
                        <Award className="w-3.5 h-3.5" />

                        {/* Tooltip for hover success view */}
                        <div className="hidden lg:group-hover:block absolute left-full ml-2 w-48 bg-stone-900 dark:bg-stone-700 text-white text-xs p-2 rounded-lg shadow-lg z-50 pointer-events-none font-sans">
                          {day.success}
                        </div>
                      </div>
                    ) : (
                      <div className="w-6 h-6 bg-stone-200 dark:bg-stone-700 text-stone-400 dark:text-stone-500 rounded-full flex items-center justify-center shrink-0 border border-stone-300/30 dark:border-stone-600/30">
                        <span className="text-[9px] font-sans font-bold">{day.isToday ? '•' : ''}</span>
                      </div>
                    )}

                    <div className="text-center lg:text-left">
                      <p className={`text-[10px] font-sans font-semibold leading-none ${
                        day.isToday ? 'text-stone-800 dark:text-stone-100' : 'text-stone-500 dark:text-stone-400'
                      }`}>
                        {day.dayName}
                      </p>
                      <p className="text-[8px] text-stone-400 dark:text-stone-500 font-sans leading-none mt-0.5 max-lg:hidden">
                        {day.formattedDate}
                      </p>
                    </div>
                  </div>

                  {/* Mini label indicator */}
                  <span className={`text-[9px] font-sans max-lg:hidden px-2 py-0.5 rounded-full ${
                    day.success
                      ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-100/50 dark:border-amber-500/20'
                      : 'text-stone-400 dark:text-stone-500'
                  }`}>
                    {day.success ? 'Obtenu' : 'À venir'}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {weeklyChallenge && (
        <div className="bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 md:p-8 mb-8 relative overflow-hidden group w-full">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
            <div className="flex items-start gap-4">
              <div className="p-3.5 bg-white dark:bg-stone-800 shadow-sm border border-stone-100 dark:border-stone-700 rounded-2xl text-stone-600 dark:text-stone-300 shrink-0">
                <Feather className="w-6 h-6 z-10 relative" />
              </div>
              <div>
                <h3 className="text-xs uppercase font-sans font-bold tracking-widest text-stone-500 dark:text-stone-400 mb-1.5 flex items-center gap-2">
                  Défi de la semaine
                </h3>
                <p className="text-lg md:text-xl font-light text-stone-800 dark:text-stone-200 leading-snug max-w-2xl">
                  {weeklyChallenge.text}
                </p>
              </div>
            </div>

            <button
              onClick={refreshChallenge}
              className="px-4 py-2 bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-500 dark:text-stone-400 text-xs font-sans font-bold uppercase tracking-wider rounded-xl transition border border-stone-200 dark:border-stone-700 flex items-center gap-2 shrink-0"
              title="Changer de défi"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Nouveau
            </button>
          </div>
        </div>
      )}

      {data.goals.length === 0 && (
        <div className="bg-[#EAE7E2] dark:bg-stone-900 rounded-3xl p-6 md:p-8 text-center max-w-2xl mx-auto border border-stone-200 dark:border-stone-800 w-full shrink-0">
          <h3 className="text-xs md:text-sm uppercase tracking-widest text-[#047857] dark:text-emerald-400 mb-4 font-sans font-bold">La première étape</h3>
          <p className="text-base md:text-lg leading-snug font-light italic text-stone-700 dark:text-stone-300 mb-6 font-serif">
            Chaque voyage commence par une première direction. Définissez ce qui résonne en vous, sans pression, simplement guidé par l'intention de donner du sens à votre quotidien.
          </p>
          <button
            onClick={() => onChangeView('goals')}
            className="bg-[#047857] dark:bg-emerald-700 w-full sm:w-auto flex justify-center mx-auto text-white px-6 py-3.5 md:py-3 rounded-xl font-sans text-xs uppercase tracking-widest font-bold hover:bg-[#059669] dark:hover:bg-emerald-800 active:scale-95 transition-all shadow-sm cursor-pointer"
          >
            Fixer ma première intention
          </button>
        </div>
      )}
    </div>
  );
}
