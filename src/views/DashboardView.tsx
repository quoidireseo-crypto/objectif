import { useMemo, useState, useEffect, ReactNode } from 'react';
import { AppData, ViewType } from '../types';
import { Target, CheckCircle2, Sparkles, Flame, RefreshCw, Feather, Moon, Award, Pencil, Repeat, Circle, Sunrise, ArrowRight, X } from 'lucide-react';
import { ProgressChart } from '../components/ProgressChart';
import { GoalDomainChart } from '../components/GoalDomainChart';
import { useStreak } from '../hooks/useStreak';
import { useHabits } from '../hooks/useHabits';
import { GraphView } from './GraphView';
import { OrphansPanel } from '../components/OrphansPanel';
import { SkoposLogo } from '../components/SkoposLogo';
import { HelpTooltip } from '../components/HelpTooltip';
import { TodayCommandCenter } from '../components/TodayCommandCenter';
import { NextActionNudge } from '../components/NextActionNudge';
import { LifeBalancePanel } from '../components/LifeBalancePanel';

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
  { text: "Fais ce que tu peux, avec ce que tu as, là où tu es.", author: "Theodore Roosevelt" },
  { text: "Il n'y a pas d'âge pour se réinventer.", author: "Anonyme" },
  { text: "La vie ce n'est pas d'attendre que les orages passent, c'est d'apprendre à danser sous la pluie.", author: "Sénèque" },
  { text: "Sois doux avec toi-même, tu fais de ton mieux.", author: "Anonyme" },
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

// Petit intitulé de section pour donner une hiérarchie claire au tableau de bord
function SectionLabel({ children, help }: { children: ReactNode; help?: string }) {
  return (
    <div className="flex items-center gap-4 mb-5 mt-4">
      <div className="flex items-center gap-2 shrink-0">
        <h3 className="text-[11px] font-sans font-bold uppercase tracking-[0.22em] text-stone-400 dark:text-stone-500">
          {children}
        </h3>
        {help && <HelpTooltip text={help} />}
      </div>
      <div className="h-px flex-1 bg-stone-200/70 dark:bg-stone-800" />
    </div>
  );
}

export function DashboardView({ data, updateData, onChangeView, userProfile }: DashboardProps) {
  const inProgressGoals = data.goals.filter(g => g.status === 'En cours');
  const activeGoals = inProgressGoals.length;
  const todayDate = new Date().toISOString().split('T')[0];
  const todayTasks = data.tasks.filter(t => t.date === todayDate);
  const completedToday = todayTasks.filter(t => t.isCompleted).length;
  const { currentStreak } = useStreak(data.tasks);
  const { todaysHabits, isCompletedOn, toggleCompletion } = useHabits(data, updateData);
  const completedHabitsToday = todaysHabits.filter(h => isCompletedOn(h.id, todayDate)).length;

  // Prochaine action concrète d'un objectif (logique GTD) : la première action
  // non faite qui lui est reliée, en privilégiant celles déjà planifiées.
  const getNextAction = (goalId: string) => {
    const candidates = data.tasks.filter(t => t.goalId === goalId && !t.isCompleted);
    candidates.sort((a, b) => {
      if (a.date && b.date) return a.date.localeCompare(b.date);
      if (a.date) return -1;
      if (b.date) return 1;
      return 0;
    });
    return candidates[0] || null;
  };

  const toggleTaskDone = (id: string) => {
    updateData({
      tasks: data.tasks.map(t => (t.id === id ? { ...t, isCompleted: !t.isCompleted } : t)),
    });
  };

  const [weeklyChallenge, setWeeklyChallenge] = useState<{ text: string, date: string } | null>(null);

  const todayReflection = useMemo(
    () => (data.eveningReflections || []).find(r => r.date === todayDate),
    [data.eveningReflections, todayDate]
  );
  const todaySuccess = todayReflection?.content || '';

  const [successInput, setSuccessInput] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const isSaved = !!todaySuccess && !isEditing;

  // Bandeau d'introduction pour les nouveaux utilisateurs (« c'est quoi SKOPOS »)
  const [introDismissed, setIntroDismissed] = useState(() => window.localStorage.getItem('skopos_intro_dismissed') === 'true');
  const dismissIntro = () => {
    window.localStorage.setItem('skopos_intro_dismissed', 'true');
    setIntroDismissed(true);
  };
  const showIntro = !introDismissed && data.goals.length === 0;

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

  let streakMessage = "Commence aujourd'hui.";
  if (currentStreak >= 7) streakMessage = "Remarquable constance.";
  else if (currentStreak >= 3) streakMessage = "Tu tiens le rythme !";
  else if (currentStreak > 0) streakMessage = "Continue sur ta lancée.";

  const todayLabel = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());

  // Le tableau de bord s'adapte au moment de la journée : le soir (à partir de
  // 18h), le bilan « Ma réussite du jour » remonte avant l'agenda du jour.
  const isEvening = new Date().getHours() >= 18;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col min-h-full py-2">

      {/* Bandeau d'introduction — qu'est-ce que SKOPOS (nouveaux utilisateurs) */}
      {showIntro && (
        <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm p-6 md:p-8 mb-6 animate-in fade-in slide-in-from-top-2 duration-500">
          <button
            onClick={dismissIntro}
            className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
            title="Masquer cette présentation"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2.5 mb-3">
            <SkoposLogo className="text-[#047857] dark:text-emerald-400 shrink-0" size={24} />
            <h3 className="text-sm font-sans tracking-widest font-bold text-stone-800 dark:text-stone-100 uppercase">
              Bienvenue dans SKOPOS
            </h3>
          </div>

          <p className="text-stone-600 dark:text-stone-300 font-serif text-base md:text-lg leading-relaxed max-w-2xl">
            SKOPOS t'aide à transformer ce qui compte pour toi en petits gestes concrets, jour après jour et à ton rythme.
            Le principe tient en trois temps :
          </p>

          <div className="grid sm:grid-cols-3 gap-4 mt-6">
            <div className="bg-stone-50/70 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-2xl p-4">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-xl">
                  <Target className="w-4 h-4" />
                </div>
                <span className="font-sans font-bold text-sm text-stone-800 dark:text-stone-100">1 · Mes objectifs</span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-sans leading-relaxed">
                Définir ce qui compte vraiment pour moi.
              </p>
            </div>

            <div className="bg-stone-50/70 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-2xl p-4">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-xl">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span className="font-sans font-bold text-sm text-stone-800 dark:text-stone-100">2 · Agir au quotidien</span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-sans leading-relaxed">
                Avancer un jour après l'autre, sans pression.
              </p>
            </div>

            <div className="bg-stone-50/70 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-2xl p-4">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="p-2 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
                  <Moon className="w-4 h-4" />
                </div>
                <span className="font-sans font-bold text-sm text-stone-800 dark:text-stone-100">3 · Faire le point</span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-sans leading-relaxed">
                Célébrer mes réussites et ajuster ma direction.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-6">
            <button
              onClick={() => onChangeView('goals')}
              className="bg-[#047857] dark:bg-emerald-700 inline-flex justify-center items-center gap-2 text-white px-6 py-3 rounded-xl font-sans text-xs uppercase tracking-widest font-bold hover:bg-[#059669] dark:hover:bg-emerald-800 active:scale-95 transition-all shadow-sm cursor-pointer"
            >
              Choisir mon premier objectif
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={dismissIntro}
              className="text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 text-xs font-sans font-bold uppercase tracking-widest px-4 py-3 transition cursor-pointer"
            >
              J'ai compris
            </button>
          </div>
        </div>
      )}

      {/* ===================== ZONE 1 — AUJOURD'HUI ===================== */}

      {/* Hero : accueil + priorité + repères du jour */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-800 via-emerald-900 to-emerald-950 dark:from-stone-800 dark:via-stone-900 dark:to-stone-950 text-stone-100 p-6 md:p-9 shadow-xl mb-6">
        {/* Décor ambiant */}
        <div className="absolute -top-20 -right-16 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-12 w-72 h-72 bg-amber-300/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          {/* Date + salutation */}
          <p className="text-[11px] uppercase tracking-[0.22em] font-sans font-bold text-emerald-300/80 dark:text-emerald-400/80 mb-2 capitalize">
            {todayLabel}
          </p>
          <h2 className="text-3xl md:text-4xl font-light leading-tight">
            Bonjour, <span className="font-serif italic text-amber-200 dark:text-amber-300">{userProfile?.name}</span>
          </h2>

          {/* Priorité du jour */}
          <div className="mt-6">
            {todayRitual?.priority ? (
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 bg-amber-400/20 text-amber-200 rounded-2xl shrink-0">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-sans font-bold text-emerald-300/70 dark:text-emerald-400/70 mb-1">
                    Ma priorité aujourd'hui
                  </p>
                  <p className="text-lg md:text-xl font-serif italic text-stone-50 leading-snug">
                    « {todayRitual.priority} »
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <Sunrise className="w-5 h-5 text-amber-200 shrink-0" />
                  <p className="text-sm font-sans text-emerald-50/90">
                    Quelle est ta priorité pour aujourd'hui ? Prends un instant pour la poser.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Repères du jour : 3 indicateurs */}
          <div className="grid grid-cols-3 gap-3 mt-7">
            <button
              onClick={() => onChangeView('tasks')}
              className="text-left bg-white/10 hover:bg-white/[0.16] border border-white/10 rounded-2xl p-4 transition group"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-300 mb-2.5" />
              <p className="text-2xl font-light leading-none">
                {completedToday}<span className="text-base text-emerald-200/50">/{todayTasks.length}</span>
              </p>
              <p className="text-[10px] uppercase tracking-wider font-sans font-bold text-emerald-200/70 mt-1.5 group-hover:text-emerald-100 transition">
                Actions
              </p>
            </button>

            <button
              onClick={() => onChangeView('habits')}
              className="text-left bg-white/10 hover:bg-white/[0.16] border border-white/10 rounded-2xl p-4 transition group"
            >
              <Repeat className="w-5 h-5 text-emerald-300 mb-2.5" />
              <p className="text-2xl font-light leading-none">
                {completedHabitsToday}<span className="text-base text-emerald-200/50">/{todaysHabits.length}</span>
              </p>
              <p className="text-[10px] uppercase tracking-wider font-sans font-bold text-emerald-200/70 mt-1.5 group-hover:text-emerald-100 transition">
                Habitudes
              </p>
            </button>

            <div className="bg-white/10 border border-white/10 rounded-2xl p-4" title={streakMessage}>
              <Flame className="w-5 h-5 text-amber-300 mb-2.5" />
              <p className="text-2xl font-light leading-none">
                {currentStreak}<span className="text-base text-emerald-200/50"> j</span>
              </p>
              <p className="text-[10px] uppercase tracking-wider font-sans font-bold text-emerald-200/70 mt-1.5">
                Régularité
              </p>
            </div>
          </div>

          {/* Inspiration du jour */}
          <div className="flex items-start gap-2.5 mt-7 pt-5 border-t border-white/10">
            <Sparkles className="w-4 h-4 text-emerald-300/70 shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-50/70 italic font-serif leading-relaxed">
              « {dailyQuote.text} » <span className="not-italic text-emerald-200/50 font-sans">— {dailyQuote.author}</span>
            </p>
          </div>
        </div>
      </div>

      {/* ZONE 1 (suite) — agenda, habitudes, bilan ; ordre adaptatif matin/soir */}
      <div className="flex flex-col">

        {/* Poste de commande « Aujourd'hui » : reprises, actions du jour, capture rapide */}
        <div className={isEvening ? 'order-2' : 'order-1'}>
          <TodayCommandCenter data={data} updateData={updateData} onChangeView={onChangeView} />
        </div>

      {/* Habitudes du jour */}
      <div className={isEvening ? 'order-3' : 'order-2'}>
      {todaysHabits.length > 0 && (
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-100 dark:border-stone-800 shadow-sm mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-xl">
                <Repeat className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-light text-stone-900 dark:text-stone-100">Habitudes du jour</h3>
                <p className="text-xs font-sans uppercase tracking-widest text-stone-400 dark:text-stone-500 mt-0.5">
                  {completedHabitsToday} / {todaysHabits.length} accomplie{todaysHabits.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <button
              onClick={() => onChangeView('habits')}
              className="text-sm text-emerald-700 dark:text-emerald-400 font-sans uppercase tracking-widest hover:text-emerald-800 dark:hover:text-emerald-300 transition shrink-0"
            >
              Toutes &rarr;
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-2.5">
            {todaysHabits.map(habit => {
              const done = isCompletedOn(habit.id, todayDate);
              return (
                <button
                  key={habit.id}
                  onClick={() => toggleCompletion(habit.id, todayDate)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-stone-50/70 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all text-left"
                >
                  <span className={`shrink-0 transition-colors ${done ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-300 dark:text-stone-600'}`}>
                    {done ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                  </span>
                  <span className={`font-sans text-sm font-bold ${done ? 'text-stone-400 dark:text-stone-500 line-through' : 'text-stone-700 dark:text-stone-200'}`}>
                    {habit.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
      </div>

      {/* Ma réussite du jour (bilan du soir) — remonte en premier le soir */}
      <div className={isEvening ? 'order-1' : 'order-3'}>
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 md:p-8 mb-2 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500/20"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs uppercase font-sans font-bold tracking-widest text-stone-400 dark:text-stone-500">
                  À noter en fin de journée
                </h3>
                <HelpTooltip text="Le soir, note une réussite — même modeste. Au fil des jours, tu construis une collection de petites victoires qui confortent ta direction." />
              </div>
              <p className="text-lg font-serif italic text-stone-800 dark:text-stone-200">
                Ma réussite du jour
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-full">
            <Award className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            <span className="text-xs font-sans font-semibold text-amber-700 dark:text-amber-400">
              {recentDays.filter(d => d.success).length} cette semaine
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Saisie / célébration */}
          <div className="lg:col-span-8 flex flex-col justify-center h-full">
            {!isSaved ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h4 className="text-base font-sans font-semibold text-stone-800 dark:text-stone-200">
                    Quelle est ta réussite d'aujourd'hui ?
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Note un seul fait, une action, un moment précieux ou un accomplissement dont tu es fier(e) aujourd'hui, aussi modeste soit-il.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={successInput}
                    onChange={(e) => setSuccessInput(e.target.value)}
                    placeholder="Ex : j'ai pris le temps de marcher 20 minutes au calme..."
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
                <div className="relative mb-4 flex items-center justify-center">
                  <div className="absolute w-16 h-16 bg-amber-400/20 rounded-full animate-ping opacity-60"></div>
                  <div className="absolute w-12 h-12 bg-amber-400/30 rounded-full"></div>
                  <div className="relative p-2.5 bg-amber-500 text-white rounded-full shadow-md z-10">
                    <Award className="w-8 h-8" />
                  </div>
                </div>

                <span className="text-[10px] uppercase tracking-widest text-amber-700 dark:text-amber-400 font-sans font-bold bg-amber-100 dark:bg-amber-500/20 px-3 py-1 rounded-full mb-3">
                  Réussite du jour notée
                </span>

                <p className="font-serif italic text-lg md:text-xl text-stone-900 dark:text-stone-100 max-w-xl px-2 leading-relaxed">
                  « {todaySuccess} »
                </p>

                <p className="text-xs text-stone-500 dark:text-stone-400 font-sans mt-4 max-w-sm">
                  Chaque réussite, petite ou grande, conforte ta direction. Chaque jour est un nouveau départ.
                </p>

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

          {/* Réussites des 7 derniers jours */}
          <div className="lg:col-span-4 bg-stone-50 dark:bg-stone-800 rounded-2xl p-5 border border-stone-100 dark:border-stone-700">
            <h4 className="text-[10px] uppercase tracking-wider font-sans font-bold text-stone-400 dark:text-stone-500 mb-4 text-center lg:text-left">
              Mes 7 derniers jours
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
                    {day.success ? (
                      <div className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center shadow-xs shrink-0 relative group">
                        <Award className="w-3.5 h-3.5" />
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

                  <span className={`text-[9px] font-sans max-lg:hidden px-2 py-0.5 rounded-full ${
                    day.success
                      ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-100/50 dark:border-amber-500/20'
                      : 'text-stone-400 dark:text-stone-500'
                  }`}>
                    {day.success ? 'Noté' : 'À venir'}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
      </div>

      </div>
      {/* fin ZONE 1 adaptative */}

      {/* ===================== ZONE 2 — MA PROGRESSION ===================== */}
      <SectionLabel help="Une vue d'ensemble de tes objectifs en cours et de ta constance dans la durée.">Ma progression</SectionLabel>

      {/* Rappel doux : objectifs en cours sans prochaine action */}
      <NextActionNudge data={data} onChangeView={onChangeView} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Objectifs en cours */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-100 dark:border-stone-800 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-xl">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-light text-stone-900 dark:text-stone-100">Objectifs en cours</h3>
              <p className="text-xs font-sans uppercase tracking-widest text-stone-400 dark:text-stone-500 mt-0.5">
                {activeGoals} objectif{activeGoals > 1 ? 's' : ''} en route
              </p>
            </div>
          </div>

          {activeGoals > 0 ? (
            <div className="space-y-2.5 flex-1">
              {inProgressGoals.slice(0, 3).map(goal => {
                const next = getNextAction(goal.id);
                return (
                  <div key={goal.id} className="px-3 py-2.5 rounded-xl bg-stone-50/70 dark:bg-stone-800 border border-stone-100 dark:border-stone-700">
                    <div className="flex items-center gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span className="font-sans text-sm font-semibold text-stone-700 dark:text-stone-200 truncate">{goal.title}</span>
                    </div>

                    {next ? (
                      <button
                        onClick={() => toggleTaskDone(next.id)}
                        className="mt-2 ml-4 w-[calc(100%-1rem)] flex items-center gap-2 text-left group"
                        title="Marquer la prochaine action comme faite"
                      >
                        <Circle className="w-4 h-4 text-stone-300 dark:text-stone-600 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition shrink-0" />
                        <span className="font-sans text-xs text-stone-500 dark:text-stone-400 truncate group-hover:text-stone-700 dark:group-hover:text-stone-200 transition">
                          {next.title}
                        </span>
                        {next.date && (
                          <span className="text-[10px] font-sans text-stone-400 dark:text-stone-500 shrink-0 ml-auto">
                            {new Date(next.date + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => onChangeView('tasks')}
                        className="mt-2 ml-4 flex items-center gap-2 text-left text-xs font-sans text-amber-600 dark:text-amber-400 hover:underline"
                      >
                        <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                        Définir la prochaine action
                      </button>
                    )}
                  </div>
                );
              })}
              {activeGoals > 3 && (
                <p className="text-xs text-stone-400 dark:text-stone-500 font-sans pl-1 pt-1">
                  + {activeGoals - 3} autre{activeGoals - 3 > 1 ? 's' : ''}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-stone-500 dark:text-stone-400 italic flex-1">
              Aucun objectif en cours pour l'instant. Choisis une première chose qui compte pour toi.
            </p>
          )}

          <button
            onClick={() => onChangeView('goals')}
            className="mt-4 text-left text-sm text-emerald-700 dark:text-emerald-400 font-sans uppercase tracking-widest hover:text-emerald-800 dark:hover:text-emerald-300 transition"
          >
            Voir mes objectifs &rarr;
          </button>
        </div>

        {/* Régularité du rituel du matin */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-100 dark:border-stone-800 shadow-sm">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-light text-stone-900 dark:text-stone-100">Régularité du rituel</h3>
            <HelpTooltip text="Le rituel du matin est un court moment pour poser ta priorité du jour. Chaque pastille indique ton humeur lors de ce moment sur les 7 derniers jours." />
          </div>
          <p className="text-xs font-sans uppercase tracking-widest text-stone-400 dark:text-stone-500 mt-0.5">7 derniers jours</p>

          <div className="flex flex-wrap items-center gap-4 mt-6">
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
            <p className="italic text-stone-600 dark:text-stone-300 text-sm mt-5">
              Priorité du jour : {todayRitual.priority}
            </p>
          )}
        </div>
      </div>

      {/* Équilibre de vie — roue des piliers */}
      <LifeBalancePanel data={data} updateData={updateData} onChangeView={onChangeView} />

      {/* Intentions en sommeil */}
      <div className="mb-2">
        <OrphansPanel
          data={data}
          updateData={updateData}
          onChangeView={onChangeView}
        />
      </div>

      {/* ===================== ZONE 3 — PRENDRE DU RECUL ===================== */}
      <SectionLabel help="Des graphiques et des repères pour observer ton évolution sur la durée.">Prendre du recul</SectionLabel>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ProgressChart tasks={data.tasks} />
        {data.goals.length > 0 && <GoalDomainChart goals={data.goals} />}
      </div>

      {/* Aperçu de la carte mentale */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800 rounded-3xl p-6 md:p-8 mb-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-serif font-light text-stone-800 dark:text-stone-200">
                Mes objectifs et leurs actions
              </h3>
              <HelpTooltip text="Une carte visuelle qui relie chaque objectif aux étapes et aux actions du quotidien qui y mènent." />
            </div>
            <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">
              Chaque action est reliée à un objectif plus grand.
            </p>
          </div>
          <button
            onClick={() => onChangeView('graph')}
            className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 transition font-sans text-sm font-bold uppercase tracking-widest text-left sm:text-right shrink-0"
          >
            Voir la carte complète &rarr;
          </button>
        </div>

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
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-white dark:to-stone-900 pointer-events-none" />
        </div>
      </div>

      {/* Défi de la semaine */}
      {weeklyChallenge && (
        <div className="bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 md:p-8 mb-6 relative overflow-hidden group w-full">
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

      {/* Première intention (aucun objectif, et bandeau d'intro déjà masqué) */}
      {data.goals.length === 0 && !showIntro && (
        <div className="bg-[#EAE7E2] dark:bg-stone-900 rounded-3xl p-6 md:p-8 text-center max-w-2xl mx-auto border border-stone-200 dark:border-stone-800 w-full shrink-0">
          <h3 className="text-xs md:text-sm uppercase tracking-widest text-[#047857] dark:text-emerald-400 mb-4 font-sans font-bold">La première étape</h3>
          <p className="text-base md:text-lg leading-snug font-light italic text-stone-700 dark:text-stone-300 mb-6 font-serif">
            Par où as-tu envie de commencer ? Choisis simplement une chose importante pour toi en ce moment. Inutile de te mettre la pression.
          </p>
          <button
            onClick={() => onChangeView('goals')}
            className="bg-[#047857] dark:bg-emerald-700 w-full sm:w-auto inline-flex justify-center items-center gap-2 mx-auto text-white px-6 py-3.5 md:py-3 rounded-xl font-sans text-xs uppercase tracking-widest font-bold hover:bg-[#059669] dark:hover:bg-emerald-800 active:scale-95 transition-all shadow-sm cursor-pointer"
          >
            Choisir mon premier objectif
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
