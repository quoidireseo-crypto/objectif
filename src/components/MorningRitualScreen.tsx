import { useState, useMemo } from 'react';
import { AppData, MorningRitual, LifeDomain } from '../types';
import { Compass, Sparkles, Smile, Meh, Frown, Activity, Target, Heart, Briefcase, Coins, Home, LucideIcon } from 'lucide-react';

interface MorningRitualScreenProps {
  data: AppData;
  userProfile?: { name: string; ageGroup?: string; focusArea?: string } | null;
  onComplete: (ritual: { priority: string; goalId?: string; mood: 'Super' | 'Bien' | 'Moyen' | 'Difficile' }) => void;
  onSkip: () => void;
}

const DOMAINS: { label: LifeDomain; icon: LucideIcon; color: string }[] = [
  { label: 'Santé & Bien-être', icon: Activity, color: 'text-amber-700 bg-amber-50 border-amber-100 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20' },
  { label: 'Projet Personnel', icon: Target, color: 'text-stone-700 bg-stone-100 border-stone-200 dark:text-stone-300 dark:bg-stone-800 dark:border-stone-700' },
  { label: 'Relations & Famille', icon: Heart, color: 'text-rose-700 bg-rose-50 border-rose-100 dark:text-rose-400 dark:bg-rose-500/10 dark:border-rose-500/20' },
  { label: 'Apprentissage', icon: Briefcase, color: 'text-blue-700 bg-blue-50 border-blue-100 dark:text-blue-400 dark:bg-blue-500/10 dark:border-blue-500/20' },
  { label: 'Finances', icon: Coins, color: 'text-emerald-700 bg-emerald-50 border-emerald-100 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20' },
  { label: 'Spiritualité', icon: Sparkles, color: 'text-indigo-700 bg-indigo-50 border-indigo-100 dark:text-indigo-400 dark:bg-indigo-500/10 dark:border-indigo-500/20' },
  { label: 'Autre', icon: Home, color: 'text-stone-600 bg-stone-50 border-stone-200 dark:text-stone-300 dark:bg-stone-800 dark:border-stone-700' },
];

const MOODS = [
  { label: 'Super', icon: Sparkles, color: 'text-amber-800 bg-amber-50 border-amber-200 hover:bg-amber-100 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20 dark:hover:bg-amber-500/20' },
  { label: 'Bien', icon: Smile, color: 'text-emerald-800 bg-emerald-50 border-emerald-200 hover:bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:hover:bg-emerald-500/20' },
  { label: 'Moyen', icon: Meh, color: 'text-stone-600 bg-stone-100 border-stone-200 hover:bg-stone-200 dark:text-stone-300 dark:bg-stone-800 dark:border-stone-700 dark:hover:bg-stone-700' },
  { label: 'Difficile', icon: Frown, color: 'text-amber-900 bg-amber-100 border-amber-300 hover:bg-amber-200 dark:text-amber-200 dark:bg-amber-500/20 dark:border-amber-500/30 dark:hover:bg-amber-500/30' },
] as const;

export function MorningRitualScreen({ data, userProfile, onComplete, onSkip }: MorningRitualScreenProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [priority, setPriority] = useState('');
  const [selectedGoalId, setSelectedGoalId] = useState('');
  const [mood, setMood] = useState<'Super' | 'Bien' | 'Moyen' | 'Difficile'>('Bien');

  // French formulated current date
  const formattedDate = useMemo(() => {
    return new Date().toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, []);

  // Yesterday's tasks completed assessment
  const yesterdayTasksSummary = useMemo(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const tasksYesterday = data.tasks.filter(t => t.date === yesterdayStr);
    if (tasksYesterday.length === 0) return null;

    const completedCount = tasksYesterday.filter(t => t.isCompleted).length;
    if (completedCount === 0) return null;

    const isAllCompleted = completedCount === tasksYesterday.length;
    return `Hier tu as accompli ${completedCount} action(s) sur ${tasksYesterday.length}.${isAllCompleted ? ' Bien.' : ''}`;
  }, [data.tasks]);

  const activeGoals = useMemo(() => {
    return data.goals.filter(g => g.status === 'En cours');
  }, [data.goals]);

  const getDomainBadgeStyle = (domainName: LifeDomain) => {
    const dom = DOMAINS.find(d => d.label === domainName);
    return dom ? dom.color : 'text-stone-600 bg-stone-50 border-stone-200 dark:text-stone-300 dark:bg-stone-800 dark:border-stone-700';
  };

  const currentMoodObj = MOODS.find(m => m.label === mood);

  return (
    <div className="fixed inset-0 z-50 bg-[#F5F5F0] dark:bg-stone-950 flex flex-col items-center justify-between p-8 md:p-12 animate-in fade-in duration-700 overflow-y-auto">
      {/* Top Header & Progress */}
      <div className="w-full max-w-2xl flex flex-col items-center gap-6 mt-4 select-none shrink-0">
        <div className="flex flex-col items-center gap-2">
          <Compass className="w-8 h-8 text-emerald-600 dark:text-emerald-500 animate-spin-slow" />
          <span className="font-sans text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-medium">Rituel du matin</span>
        </div>

        {/* Progress Indicator Dots */}
        <div className="flex gap-2.5 items-center">
          <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${step > 1 ? 'bg-emerald-500' : (step === 1 ? 'bg-stone-300 dark:bg-stone-600' : 'bg-stone-100 dark:bg-stone-800')}`} />
          <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${step > 2 ? 'bg-emerald-500' : (step === 2 ? 'bg-stone-300 dark:bg-stone-600' : 'bg-stone-100 dark:bg-stone-800')}`} />
          <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${step > 3 ? 'bg-emerald-500' : (step === 3 ? 'bg-stone-300 dark:bg-stone-600' : 'bg-stone-100 dark:bg-stone-800')}`} />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full max-w-2xl flex-1 flex flex-col items-center justify-center my-8 text-center px-4">
        {step === 1 && (
          <div className="space-y-8 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Salutation & Date */}
            <div className="space-y-2">
              <h1 className="font-serif text-4xl md:text-5xl font-light text-stone-900 dark:text-stone-100 leading-tight">
                Bonjour{userProfile?.name ? `, ${userProfile.name}` : ''}.
              </h1>
              <p className="text-stone-400 dark:text-stone-500 font-sans text-sm capitalize font-light">{formattedDate}</p>
              {yesterdayTasksSummary && (
                <p className="italic text-stone-500 dark:text-stone-400 text-sm mt-3 font-serif font-light">{yesterdayTasksSummary}</p>
              )}
            </div>

            {/* Step Question */}
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl md:text-2xl font-serif text-stone-800 dark:text-stone-200">Quelle est ta priorité absolue aujourd'hui ?</h2>
                <p className="italic text-stone-400 dark:text-stone-500 font-serif font-light text-sm max-w-md mx-auto">
                  "Une seule chose. Si tu ne fais que ça, la journée aura eu du sens."
                </p>
              </div>

              <div className="flex flex-col items-center gap-5 w-full">
                <input
                  type="text"
                  className="w-full max-w-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-2xl px-6 py-4 text-xl font-serif font-light text-stone-800 dark:text-stone-100 outline-none focus:ring-1 focus:ring-emerald-600 placeholder-stone-300 dark:placeholder-stone-600 text-center shadow-sm"
                  placeholder="Ce qui compte vraiment aujourd'hui..."
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  autoFocus
                />

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!priority.trim()}
                  className="bg-stone-800 dark:bg-emerald-700 text-white px-8 py-3.5 rounded-xl font-sans text-xs uppercase tracking-widest font-bold border-none cursor-pointer transition disabled:opacity-30 disabled:cursor-not-allowed hover:bg-stone-900 dark:hover:bg-emerald-800 active:scale-95 shadow-sm"
                >
                  Continuer →
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2">
              <h2 className="text-xl md:text-2xl font-serif text-stone-800 dark:text-stone-200">Sur quoi as-tu envie d'avancer aujourd'hui ?</h2>
              <p className="italic text-stone-400 dark:text-stone-500 font-serif font-light text-sm">
                Optionnel. Sauter si aucun ne s'applique.
              </p>
            </div>

            {activeGoals.length === 0 ? (
              <div className="space-y-5">
                <p className="text-stone-500 dark:text-stone-400 font-serif italic text-base">Tu n'as pas encore d'objectif défini.</p>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="bg-stone-800 dark:bg-emerald-700 text-white px-8 py-3.5 rounded-xl font-sans text-xs uppercase tracking-widest font-bold hover:bg-stone-900 dark:hover:bg-emerald-800 transition active:scale-95 shadow-sm"
                >
                  Continuer →
                </button>
              </div>
            ) : (
              <div className="space-y-8 w-full">
                <div className="flex flex-col gap-3 max-w-md mx-auto max-h-[280px] overflow-y-auto px-2">
                  {activeGoals.map(goal => {
                    const isSelected = selectedGoalId === goal.id;
                    const badgeStyle = getDomainBadgeStyle(goal.domain);

                    return (
                      <button
                        key={goal.id}
                        type="button"
                        onClick={() => setSelectedGoalId(isSelected ? '' : goal.id)}
                        className={`flex items-center gap-3.5 text-left border rounded-2xl px-5 py-4 transition-all duration-200 cursor-pointer text-sm font-sans ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-600 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-400 ring-1 ring-emerald-600/30 dark:ring-emerald-500/30'
                            : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:border-stone-300 dark:hover:border-stone-600 hover:bg-stone-50/50 dark:hover:bg-stone-800/50'
                        }`}
                      >
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border shrink-0 ${badgeStyle}`}>
                          {goal.domain.split(' ')[0]}
                        </span>
                        <span className="font-medium line-clamp-2">{goal.title}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-col items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="bg-stone-800 dark:bg-emerald-700 text-white px-8 py-3.5 rounded-xl font-sans text-xs uppercase tracking-widest font-bold hover:bg-stone-900 dark:hover:bg-emerald-800 transition active:scale-95 shadow-sm"
                  >
                    Continuer →
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedGoalId('');
                      setStep(3);
                    }}
                    className="text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 text-xs tracking-wider transition font-medium"
                  >
                    Passer cette étape
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2">
              <h2 className="text-xl md:text-2xl font-serif text-stone-800 dark:text-stone-200">Comment tu te sens ce matin ?</h2>
              <p className="italic text-stone-400 dark:text-stone-500 font-serif font-light text-sm">
                Sans jugement. Juste un état des lieux.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-3.5 font-sans">
              {MOODS.map(item => {
                const Icon = item.icon;
                const isSelected = mood === item.label;

                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setMood(item.label)}
                    className={`flex items-center gap-2 px-5 py-3.5 rounded-2xl border transition-all text-xs font-bold uppercase tracking-wider cursor-pointer ${
                      isSelected
                        ? item.color + ' ring-1 ring-offset-2 ring-stone-400 dark:ring-stone-600 dark:ring-offset-stone-950 shadow-sm'
                        : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-4 flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => onComplete({ priority, goalId: selectedGoalId || undefined, mood })}
                className="bg-emerald-700 text-white px-10 py-4 rounded-2xl font-sans text-sm uppercase tracking-widest font-bold hover:bg-emerald-800 transition shadow-sm active:scale-95"
              >
                Pour aujourd'hui : {mood === 'Super' ? '✨' : mood === 'Bien' ? '😊' : mood === 'Moyen' ? '😐' : '😔'} C'est parti !
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Option and Space Footer */}
      <div className="w-full flex justify-center pb-4 select-none shrink-0">
        <button
          type="button"
          onClick={onSkip}
          className="text-stone-300 dark:text-stone-600 text-xs font-sans hover:text-stone-500 dark:hover:text-stone-400 transition tracking-widest uppercase font-medium"
        >
          Plus tard
        </button>
      </div>
    </div>
  );
}
