import { useState } from 'react';
import { AppData, Goal, LifeDomain, Milestone, Task } from '../types';
import { Plus, Target, Clock, Heart, Briefcase, Activity, Home, Trash2, X, Coins, Sparkles, CheckSquare, Square, CheckCircle, Trophy, RotateCcw, Maximize2, ArrowLeft, Circle, CheckCircle2 } from 'lucide-react';
import { useGoalHistory } from '../hooks/useGoalHistory';
import { GoalHistoryTimeline } from '../components/GoalHistoryTimeline';
import { HelpTooltip } from '../components/HelpTooltip';

interface GoalsProps {
  data: AppData;
  updateData: (data: Partial<AppData>) => void;
  // Vue « focus » : quand un objectif est sélectionné, on n'affiche que lui,
  // avec tout son cheminement. Géré par App pour permettre les liens entre vues.
  focusedGoalId?: string | null;
  onFocusGoal?: (id: string | null) => void;
}

const DOMAINS: { label: LifeDomain; icon: any; color: string }[] = [
  { label: 'Santé & Bien-être', icon: Activity, color: 'text-amber-700 bg-amber-50 border-amber-100 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20' },
  { label: 'Projet Personnel', icon: Target, color: 'text-stone-700 bg-stone-100 border-stone-200 dark:text-stone-300 dark:bg-stone-800 dark:border-stone-700' },
  { label: 'Relations & Famille', icon: Heart, color: 'text-rose-700 bg-rose-50 border-rose-100 dark:text-rose-400 dark:bg-rose-500/10 dark:border-rose-500/20' },
  { label: 'Apprentissage', icon: Briefcase, color: 'text-blue-700 bg-blue-50 border-blue-100 dark:text-blue-400 dark:bg-blue-500/10 dark:border-blue-500/20' },
  { label: 'Finances', icon: Coins, color: 'text-emerald-700 bg-emerald-50 border-emerald-100 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20' },
  { label: 'Spiritualité', icon: Sparkles, color: 'text-indigo-700 bg-indigo-50 border-indigo-100 dark:text-indigo-400 dark:bg-indigo-500/10 dark:border-indigo-500/20' },
  { label: 'Autre', icon: Home, color: 'text-stone-600 bg-stone-50 border-stone-200 dark:text-stone-300 dark:bg-stone-800 dark:border-stone-700' },
];

const VERBS = [
  { id: 'Reprendre', label: 'Reprendre', placeholder: '...le sport / la lecture / le contact avec mes enfants' },
  { id: 'Apprendre', label: 'Apprendre', placeholder: '...une langue / un instrument / la cuisine' },
  { id: 'Créer', label: 'Créer', placeholder: '...un potager / mon entreprise / un album photo' },
  { id: 'Améliorer', label: 'Améliorer', placeholder: '...mon sommeil / mon organisation / mes finances' },
  { id: 'Arrêter', label: 'Arrêter', placeholder: '...de fumer / de procrastiner / de scroller' },
  { id: 'Commencer', label: 'Commencer', placeholder: '...la méditation / un journal / à épargner' },
  { id: 'Autre...', label: 'Autre...', placeholder: 'Ex: Retrouver la forme...' }
];

const addMonths = (date: Date, months: number) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0];
};

const addWeeks = (date: Date, weeks: number) => {
  const d = new Date(date);
  d.setDate(d.getDate() + weeks * 7);
  return d.toISOString().split('T')[0];
};

const DEADLINE_OPTIONS = [
  { label: 'Dans 1 semaine', getValue: () => addWeeks(new Date(), 1) },
  { label: 'Dans 1 mois', getValue: () => addMonths(new Date(), 1) },
  { label: 'Dans 3 mois', getValue: () => addMonths(new Date(), 3) },
  { label: 'Dans 6 mois', getValue: () => addMonths(new Date(), 6) },
];

export function GoalsView({ data, updateData, focusedGoalId, onFocusGoal }: GoalsProps) {
  const { addHistoryEntry } = useGoalHistory(data, updateData);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedVerb, setSelectedVerb] = useState(VERBS[0].id);
  const [goalComplement, setGoalComplement] = useState('');
  const [firstAction, setFirstAction] = useState('');
  const [newMilestoneTitles, setNewMilestoneTitles] = useState<{ [goalId: string]: string }>({});
  const [newActionTitles, setNewActionTitles] = useState<{ [goalId: string]: string }>({});
  const [celebrationMessage, setCelebrationMessage] = useState<{title: string} | null>(null);
  
  const [newGoal, setNewGoal] = useState<Partial<Goal>>({
    why: '',
    domain: 'Santé & Bien-être',
    deadline: '',
    status: 'En cours'
  });

  const getFinalTitle = () => {
    const comp = goalComplement.trim();
    if (!comp) return '';
    if (selectedVerb === 'Autre...') return comp;
    return `Je veux ${selectedVerb.toLowerCase()} ${comp}`;
  };

  const handleSave = () => {
    const finalTitle = getFinalTitle();
    if (!finalTitle || !newGoal.why) return;

    const goalId = Date.now().toString();
    const goal: Goal = {
      id: goalId,
      title: finalTitle,
      why: newGoal.why,
      domain: newGoal.domain as LifeDomain,
      deadline: newGoal.deadline,
      status: 'En cours',
      createdAt: new Date().toISOString(),
    };

    const newTasks: Task[] = [...data.tasks];
    
    if (firstAction.trim()) {
      const todayDate = new Date().toISOString().split('T')[0];
      newTasks.push({
        id: 'task_' + Date.now().toString(),
        title: firstAction.trim(),
        goalId: goal.id,
        isCompleted: false,
        date: todayDate,
        domain: goal.domain
      });
    }

    updateData({ 
      goals: [goal, ...data.goals],
      tasks: newTasks
    });

    addHistoryEntry(goal.id, 'created');

    setIsAdding(false);
    setFirstAction('');
    setSelectedVerb(VERBS[0].id);
    setGoalComplement('');
    setNewGoal({ why: '', domain: 'Santé & Bien-être', deadline: '', status: 'En cours' });

    // Prop 5 : on atterrit directement sur le nouvel objectif pour voir son
    // cheminement et poser la suite.
    onFocusGoal?.(goal.id);
  };

  // Prop 1 : ajouter une action reliée à l'objectif (et à son étape en cours)
  // sans quitter la page.
  const addAction = (goalId: string) => {
    const title = newActionTitles[goalId]?.trim();
    if (!title) return;

    // Étape en cours = première étape non terminée (par ordre).
    const currentMilestone = (data.milestones || [])
      .filter(m => m.goalId === goalId && !m.isCompleted)
      .sort((a, b) => a.order - b.order)[0];

    const goal = data.goals.find(g => g.id === goalId);

    const newTask: Task = {
      id: 'task_' + Date.now().toString(),
      title,
      goalId,
      isCompleted: false,
      date: new Date().toISOString().split('T')[0],
      ...(currentMilestone ? { milestoneId: currentMilestone.id } : {}),
      ...(goal?.domain ? { domain: goal.domain } : {}),
    };

    updateData({ tasks: [...data.tasks, newTask] });
    setNewActionTitles(prev => ({ ...prev, [goalId]: '' }));
  };

  const toggleTask = (id: string) => {
    updateData({
      tasks: data.tasks.map(t => (t.id === id ? { ...t, isCompleted: !t.isCompleted } : t)),
    });
  };

  const deleteGoal = (id: string) => {
    if (window.confirm("Supprimer cet objectif ?")) {
      updateData({ 
        goals: data.goals.filter(g => g.id !== id),
        tasks: data.tasks.map(t => t.goalId === id ? { ...t, goalId: undefined, milestoneId: undefined } : t),
        milestones: data.milestones.filter(m => m.goalId !== id),
        goalsHistory: (data.goalsHistory || []).filter(h => h.goalId !== id)
      });
    }
  };

  const handleStatusChange = (goalId: string, newStatus: Goal['status']) => {
    const goal = data.goals.find(g => g.id === goalId);
    if (!goal) return;
    const oldStatus = goal.status;

    if (newStatus === 'Atteint') {
      setCelebrationMessage({ title: goal.title });
      setTimeout(() => {
        setCelebrationMessage(null);
      }, 3000);
    }

    updateData({
      goals: data.goals.map(g => g.id === goalId ? { ...g, status: newStatus } : g)
    });

    if (newStatus === 'Atteint') {
      addHistoryEntry(goalId, 'achieved', oldStatus, 'Atteint');
    } else if (newStatus === 'En pause') {
      addHistoryEntry(goalId, 'paused', oldStatus, 'En pause');
    } else if (newStatus === 'En cours' && oldStatus === 'En pause') {
      addHistoryEntry(goalId, 'reactivated', oldStatus, 'En cours');
    } else {
      addHistoryEntry(goalId, 'status-changed', oldStatus, newStatus);
    }
  };

  const markAsAchieved = (id: string) => {
    handleStatusChange(id, 'Atteint');
  };

  const addMilestone = (goalId: string) => {
    const title = newMilestoneTitles[goalId]?.trim();
    if (!title) return;

    const goalMilestones = data.milestones.filter(m => m.goalId === goalId);
    if (goalMilestones.length >= 4) return;

    const newMilestone: Milestone = {
      id: 'ms_' + Date.now().toString(),
      goalId,
      title,
      isCompleted: false,
      order: goalMilestones.length + 1
    };

    updateData({
      milestones: [...data.milestones, newMilestone]
    });

    setNewMilestoneTitles(prev => ({ ...prev, [goalId]: '' }));

    addHistoryEntry(
      goalId,
      'milestone-added',
      undefined,
      newMilestone.title
    );
  };

  const toggleMilestone = (id: string) => {
    const milestone = data.milestones.find(m => m.id === id);
    if (!milestone) return;

    const willBeCompleted = !milestone.isCompleted;

    updateData({
      milestones: data.milestones.map(m => m.id === id ? { ...m, isCompleted: willBeCompleted } : m)
    });

    if (willBeCompleted) {
      addHistoryEntry(
        milestone.goalId,
        'milestone-completed',
        undefined,
        milestone.title
      );
    }
  };

  const deleteMilestone = (id: string) => {
    updateData({
      milestones: data.milestones.filter(m => m.id !== id),
      tasks: data.tasks.map(t => t.milestoneId === id ? { ...t, milestoneId: undefined } : t)
    });
  };

  const getDomainTheme = (domainLabel: string) => {
    return DOMAINS.find(c => c.label === domainLabel) || DOMAINS[0];
  };

  // Date d'obtention d'un trophée : on la lit dans l'historique (événement
  // « achieved »). Cette date est déjà une chaîne française lisible
  // (« JJ/MM/AAAA HH:MM:SS »), on en garde juste la partie date — surtout pas
  // de re-parsing via new Date(), qui échoue sur le format français.
  const getAchievedDate = (goal: Goal): string => {
    const entry = (data.goalsHistory || [])
      .filter(h => h.goalId === goal.id && h.changeType === 'achieved')
      .sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0))[0];
    if (entry?.date) return entry.date.split(' ')[0];
    // Repli : la date de création est au format ISO, parsable sans risque.
    try {
      return new Intl.DateTimeFormat('fr-FR').format(new Date(goal.createdAt));
    } catch {
      return '';
    }
  };

  const getDeadlineBadge = (goal: Goal) => {
    if (goal.status === 'Atteint') {
      return (
        <div className="flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-400 font-sans uppercase font-bold tracking-wider bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 w-max px-3 py-1.5 rounded-full">
          <Target className="w-3.5 h-3.5" />
          Atteint
        </div>
      );
    }

    if (goal.status === 'En pause') {
      return (
        <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 font-sans uppercase font-bold tracking-wider bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 w-max px-3 py-1.5 rounded-full">
          <Clock className="w-3.5 h-3.5" />
          En pause
        </div>
      );
    }

    if (!goal.deadline) {
       return (
         <div className="flex items-center gap-2 text-xs text-amber-800 dark:text-amber-400 font-sans uppercase font-bold tracking-wider bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 w-max px-3 py-1.5 rounded-full">
           <Clock className="w-3.5 h-3.5" />
           En cours
         </div>
       );
    }
    
    // Check deadline
    const today = new Date();
    today.setHours(0,0,0,0);
    const deadlineDate = new Date(goal.deadline);
    deadlineDate.setHours(0,0,0,0);
    
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return (
        <div className="flex items-center gap-2 text-xs text-red-800 dark:text-red-400 font-sans uppercase font-bold tracking-wider bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 px-3 py-1.5 rounded-full">
          <Clock className="w-3.5 h-3.5" />
          Échéance dépassée
        </div>
      );
    }

    if (diffDays === 0) {
      return (
        <div className="flex items-center gap-2 text-xs text-amber-800 dark:text-amber-400 font-sans uppercase font-bold tracking-wider bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 px-3 py-1.5 rounded-full">
          <Clock className="w-3.5 h-3.5" />
          Aujourd'hui
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 text-xs text-blue-800 dark:text-blue-400 font-sans uppercase font-bold tracking-wider bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 px-3 py-1.5 rounded-full">
        <Clock className="w-3.5 h-3.5" />
        Dans {diffDays} jour{diffDays > 1 ? 's' : ''}
      </div>
    );
  };

  const activeGoals = data.goals.filter(g => g.status !== 'Atteint');
  const achievedGoals = data.goals.filter(g => g.status === 'Atteint');

  // Vue « focus » : si un objectif est sélectionné et toujours actif, on n'affiche
  // que lui (en pleine largeur) ; sinon, la grille habituelle.
  const focusedGoal = focusedGoalId ? activeGoals.find(g => g.id === focusedGoalId) : null;
  const isFocusMode = !!focusedGoal;
  const goalsToShow = focusedGoal ? [focusedGoal] : activeGoals;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {celebrationMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-stone-900 p-8 rounded-3xl shadow-xl max-w-sm text-center animate-in zoom-in-95 duration-500 border border-emerald-100 dark:border-emerald-500/20">
            <div className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5">
              <Target className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-light text-stone-900 dark:text-stone-100 mb-2">Bravo !</h3>
            <p className="text-emerald-800 dark:text-emerald-400 font-medium mb-4 italic text-lg leading-tight">
              Tu as atteint : "{celebrationMessage.title}"
            </p>
            <p className="text-stone-500 dark:text-stone-400 text-sm leading-relaxed mb-6 font-light">
              Tu peux en être fier(e) ! <br/>
              Qu'est-ce que tu choisis maintenant ?
            </p>
          </div>
        </div>
      )}

      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 border-b border-stone-200 dark:border-stone-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-3xl md:text-4xl font-light text-stone-900 dark:text-stone-100">Mes Objectifs</h2>
            <HelpTooltip text="Un objectif décrit ce que tu veux atteindre et pourquoi c'est important pour toi. Tu peux le découper en petites étapes, puis le relier à tes actions du quotidien." />
          </div>
          <p className="text-stone-500 dark:text-stone-400 font-sans tracking-wide uppercase text-[10px] md:text-xs mt-2 italic">Définir une direction. Pourquoi je fais les choses.</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="bg-stone-800 dark:bg-emerald-700 w-full sm:w-auto justify-center hover:bg-stone-900 dark:hover:bg-emerald-800 text-white px-5 py-3 rounded-xl font-sans uppercase tracking-widest text-xs flex items-center gap-2 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nouvel objectif
        </button>
      </header>

      {isAdding && (
        <div className="bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 shadow-sm rounded-3xl p-8 mb-8 relative animate-in fade-in zoom-in-95">
          <button
            onClick={() => setIsAdding(false)}
             className="absolute top-6 right-6 text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300"
          >
            <X className="w-5 h-5" />
          </button>

          <h3 className="text-2xl font-light mb-6 text-stone-900 dark:text-stone-100">Définir un nouvel objectif</h3>

          <div className="space-y-6 font-sans">
            <div className="bg-[#F5F5F0]/50 dark:bg-stone-800/60 p-5 rounded-2xl border border-stone-200/60 dark:border-stone-700">
              <label className="block text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wide mb-3">Étape 1 : Choisir une action</label>
              <div className="flex flex-wrap gap-2 mb-6">
                {VERBS.map(v => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVerb(v.id)}
                    className={`px-4 py-2 rounded-full text-sm font-sans transition-all ${
                      selectedVerb === v.id
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:bg-stone-200 dark:hover:bg-stone-700'
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>

              <label className="block text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wide mb-2">Étape 2 : Compléter l'objectif</label>
              {selectedVerb !== 'Autre...' && (
                <p className="text-emerald-700 dark:text-emerald-400 italic font-medium mb-3 font-serif text-lg">
                  "Je veux {selectedVerb.toLowerCase()} <span className={goalComplement ? 'text-emerald-700 dark:text-emerald-400' : 'text-stone-400 dark:text-stone-500'}>{goalComplement || '[...]'}</span>"
                </p>
              )}
              <input
                type="text"
                placeholder={VERBS.find(v => v.id === selectedVerb)?.placeholder}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 outline-none focus:ring-1 focus:ring-emerald-700 focus:border-emerald-700 text-stone-800 dark:text-stone-100 transition shadow-inner bg-white dark:bg-stone-800 placeholder-stone-400 dark:placeholder-stone-500"
                value={goalComplement}
                onChange={e => setGoalComplement(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wide mb-3">Étape 3 : Échéance (Optionnel)</label>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="flex flex-wrap gap-2">
                  {DEADLINE_OPTIONS.map(opt => {
                    const val = opt.getValue();
                    const isSelected = newGoal.deadline === val;
                    return (
                      <button
                        key={opt.label}
                        onClick={() => setNewGoal({...newGoal, deadline: val})}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-sans transition-all ${
                          isSelected ? 'border-emerald-700 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 font-bold' : 'border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'
                        }`}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
                <input
                  type="date"
                  className="w-full sm:w-auto px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 outline-none focus:ring-1 focus:ring-emerald-700 focus:border-emerald-700 text-stone-800 dark:text-stone-100 bg-white dark:bg-stone-800 transition font-sans text-sm"
                  value={newGoal.deadline || ''}
                  onChange={e => setNewGoal({...newGoal, deadline: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wide mb-2">Pourquoi est-ce important pour moi ? (Le sens profond / motivation)</label>
              <textarea
                placeholder="Je veux faire cela parce que..."
                className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 outline-none focus:ring-1 focus:ring-emerald-700 focus:border-emerald-700 text-stone-800 dark:text-stone-100 bg-white dark:bg-stone-800 placeholder-stone-400 dark:placeholder-stone-500 transition min-h-[100px] resize-y"
                value={newGoal.why}
                onChange={e => setNewGoal({...newGoal, why: e.target.value})}
              />
            </div>

            <div>
               <label className="block text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wide mb-3">Domaine de vie</label>
               <div className="flex flex-wrap gap-3">
                 {DOMAINS.map(dom => {
                   const Icon = dom.icon;
                   const isSelected = newGoal.domain === dom.label;
                   return (
                     <button
                       key={dom.label}
                       onClick={() => setNewGoal({...newGoal, domain: dom.label})}
                       className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-sm ${
                         isSelected ? 'border-emerald-700 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400' : 'border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'
                       }`}
                     >
                       <Icon className="w-4 h-4" />
                       <span className="font-bold">{dom.label}</span>
                     </button>
                   )
                 })}
               </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wide mb-2">
                Quelle est la toute première petite chose que tu pourrais faire cette semaine pour avancer vers cet objectif ? <span className="text-stone-300 dark:text-stone-600 normal-case font-normal italic">(Optionnel)</span>
              </label>
              <input
                type="text"
                placeholder="Ex : Marcher 15 minutes demain matin..."
                className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 outline-none focus:ring-1 focus:ring-emerald-700 focus:border-emerald-700 text-stone-800 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 transition shadow-inner bg-[#F5F5F0]/50 dark:bg-stone-800/60"
                value={firstAction}
                onChange={e => setFirstAction(e.target.value)}
              />
            </div>

            <div className="pt-6 flex justify-end gap-3 border-t border-stone-100 dark:border-stone-800 mt-2">
              <button
                onClick={() => setIsAdding(false)}
                className="px-5 py-2.5 rounded-xl font-bold uppercase tracking-widest text-xs text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={!getFinalTitle() || !newGoal.why}
                className="bg-stone-800 dark:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-stone-900 dark:hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Valider l'objectif
              </button>
            </div>
          </div>
        </div>
      )}

      {data.goals.length === 0 && !isAdding ? (
        <div className="text-center py-20 bg-[#EAE7E2] dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800">
          <Target className="w-12 h-12 text-stone-300 dark:text-stone-600 mx-auto mb-3" />
          <p className="text-stone-500 dark:text-stone-400 font-sans font-bold">Aucun objectif pour l'instant</p>
          <p className="text-stone-400 dark:text-stone-500 text-sm mt-1.5 mb-6 italic max-w-sm mx-auto leading-relaxed">
            Un objectif, c'est ta direction : ce qui compte pour toi, et pourquoi. Tout part d'ici — tes étapes et tes actions s'y rattachent ensuite.
          </p>
          <button
            onClick={() => setIsAdding(true)}
            className="text-emerald-800 dark:text-emerald-400 font-sans text-xs uppercase tracking-widest font-bold hover:underline"
          >
            Choisir mon premier objectif
          </button>
        </div>
      ) : (
        <>
        {isFocusMode && (
          <button
            onClick={() => onFocusGoal?.(null)}
            className="flex items-center gap-2 mb-5 text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-100 font-sans text-xs uppercase tracking-widest font-bold transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Tous mes objectifs
          </button>
        )}
        <div className={isFocusMode ? 'grid grid-cols-1 gap-6 max-w-2xl' : 'grid grid-cols-1 lg:grid-cols-2 gap-6'}>
          {goalsToShow.map(goal => {
            const theme = getDomainTheme(goal.domain);
            const Icon = theme.icon;

            return (
              <div key={goal.id} className="bg-white dark:bg-stone-900 border text-left border-stone-100 dark:border-stone-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition duration-300 flex flex-col h-full group">
                <div className="flex justify-between items-start mb-4">
                  <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 w-max ${theme.color}`}>
                    <Icon className="w-4 h-4" />
                    <span className="text-[10px] font-sans font-bold uppercase tracking-wider">{goal.domain}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {!isFocusMode && onFocusGoal && (
                      <button onClick={() => onFocusGoal(goal.id)} className="text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors" title="Voir le cheminement">
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    )}
                    <div className={`flex items-center gap-1 transition-opacity ${isFocusMode ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                      <button onClick={() => markAsAchieved(goal.id)} className="text-stone-300 dark:text-stone-600 hover:text-emerald-600 dark:hover:text-emerald-400 p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors" title="Marquer comme atteint">
                        <CheckCircle className="w-5 h-5" />
                      </button>
                      <button onClick={() => deleteGoal(goal.id)} className="text-stone-300 dark:text-stone-600 hover:text-red-500 p-1.5 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors" title="Supprimer">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                <h3
                  onClick={() => !isFocusMode && onFocusGoal?.(goal.id)}
                  className={`text-2xl font-light text-stone-900 dark:text-stone-100 mb-3 ${!isFocusMode && onFocusGoal ? 'cursor-pointer hover:text-emerald-800 dark:hover:text-emerald-400 transition-colors' : ''}`}
                >
                  {goal.title}
                </h3>

                <div className="bg-[#F5F5F0] dark:bg-stone-800 p-4 rounded-2xl mt-2 flex-grow border border-stone-200/50 dark:border-stone-700">
                  <p className="text-[10px] font-bold font-sans text-emerald-700/80 dark:text-emerald-400/80 uppercase tracking-widest mb-2">1 · Le sens profond</p>
                  <p className="text-stone-700 dark:text-stone-300 italic leading-snug mb-4">"{goal.why}"</p>

                  <div className="border-t border-stone-200/50 dark:border-stone-700 pt-4 mt-2">
                    <div className="flex items-center gap-1.5 mb-3">
                      <p className="text-[10px] font-bold font-sans text-emerald-700/80 dark:text-emerald-400/80 uppercase tracking-widest">2 · Mes étapes</p>
                      <HelpTooltip text="De grands paliers vers ton objectif (4 max). Ex. « Tenir une conversation de 5 minutes en espagnol »." />
                    </div>
                    
                    {(() => {
                      const goalMilestones = (data.milestones || []).filter(m => m.goalId === goal.id).sort((a,b) => a.order - b.order);
                      const completedCount = goalMilestones.filter(m => m.isCompleted).length;
                      
                      return (
                        <div className="space-y-3">
                          {goalMilestones.length > 0 && (
                            <div className="w-full bg-stone-200 dark:bg-stone-700 rounded-full h-1.5 mb-4 overflow-hidden">
                              <div
                                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${(completedCount / goalMilestones.length) * 100}%` }}
                              />
                            </div>
                          )}

                          {goalMilestones.map(ms => (
                            <div key={ms.id} className="flex items-start gap-2 group">
                              <button
                                onClick={() => toggleMilestone(ms.id)}
                                className={`mt-0.5 shrink-0 transition-colors ${ms.isCompleted ? 'text-emerald-500' : 'text-stone-300 dark:text-stone-600 hover:text-stone-400 dark:hover:text-stone-500'}`}
                              >
                                {ms.isCompleted ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                              </button>
                              <span className={`text-sm font-sans flex-1 transition-all ${ms.isCompleted ? 'text-stone-400 dark:text-stone-500 line-through' : 'text-stone-700 dark:text-stone-300'}`}>
                                {ms.title}
                              </span>
                              <button
                                onClick={() => deleteMilestone(ms.id)}
                                className="text-stone-300 dark:text-stone-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}

                          {goalMilestones.length < 4 && (
                            <div className="flex flex-col gap-2 mt-2">
                              <div className="flex items-end gap-2">
                                <input
                                  type="text"
                                  placeholder="+ Ajouter une étape..."
                                  value={newMilestoneTitles[goal.id] || ''}
                                  onChange={e => setNewMilestoneTitles({...newMilestoneTitles, [goal.id]: e.target.value})}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') addMilestone(goal.id);
                                  }}
                                  className="flex-1 bg-transparent border-b border-stone-200 dark:border-stone-700 text-sm py-1 outline-none focus:border-emerald-500 transition-colors font-sans placeholder:text-stone-400 dark:placeholder:text-stone-500 text-stone-800 dark:text-stone-100"
                                />
                                {newMilestoneTitles[goal.id]?.trim() && (
                                  <button
                                    onClick={() => addMilestone(goal.id)}
                                    className="text-[10px] font-sans font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 transition"
                                  >
                                    Ajouter
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  <div className="border-t border-stone-200/50 dark:border-stone-700 pt-4 mt-4">
                    <div className="flex items-center gap-1.5 mb-3">
                      <p className="text-[10px] font-bold font-sans text-emerald-700/80 dark:text-emerald-400/80 uppercase tracking-widest">3 · Ma prochaine action</p>
                      <HelpTooltip text="De petits gestes du quotidien qui font avancer vers l'étape en cours. Ex. « 10 minutes de Duolingo aujourd'hui ». Elles rejoignent ton Quotidien." />
                    </div>

                    {(() => {
                      const goalTasks = (data.tasks || []).filter(t => t.goalId === goal.id);
                      const todo = goalTasks.filter(t => !t.isCompleted);
                      const doneCount = goalTasks.length - todo.length;
                      const currentMilestone = (data.milestones || [])
                        .filter(m => m.goalId === goal.id && !m.isCompleted)
                        .sort((a, b) => a.order - b.order)[0];

                      return (
                        <div className="space-y-2.5">
                          {goalTasks.length === 0 && (
                            <p className="text-xs text-stone-400 dark:text-stone-500 italic">Quel petit pas concret cette semaine ? Note-le ci-dessous, il rejoindra ton Quotidien.</p>
                          )}

                          {todo.map(task => (
                            <div key={task.id} className="flex items-start gap-2">
                              <button
                                onClick={() => toggleTask(task.id)}
                                className="mt-0.5 shrink-0 text-stone-300 dark:text-stone-600 hover:text-emerald-500 transition-colors"
                                title="Marquer comme faite"
                              >
                                <Circle className="w-4 h-4" />
                              </button>
                              <span className="text-sm font-sans flex-1 text-stone-700 dark:text-stone-300">{task.title}</span>
                            </div>
                          ))}

                          {doneCount > 0 && (
                            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-sans flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> {doneCount} action{doneCount > 1 ? 's' : ''} déjà faite{doneCount > 1 ? 's' : ''}
                            </p>
                          )}

                          {currentMilestone && (
                            <p className="text-[10px] text-stone-400 dark:text-stone-500 font-sans italic mt-1">
                              → fait avancer l'étape : {currentMilestone.title}
                            </p>
                          )}

                          <div className="flex items-end gap-2 mt-1">
                            <input
                              type="text"
                              placeholder="+ Ajouter une action pour cet objectif..."
                              value={newActionTitles[goal.id] || ''}
                              onChange={e => setNewActionTitles({ ...newActionTitles, [goal.id]: e.target.value })}
                              onKeyDown={e => { if (e.key === 'Enter') addAction(goal.id); }}
                              className="flex-1 bg-transparent border-b border-stone-200 dark:border-stone-700 text-sm py-1 outline-none focus:border-emerald-500 transition-colors font-sans placeholder:text-stone-400 dark:placeholder:text-stone-500 text-stone-800 dark:text-stone-100"
                            />
                            {newActionTitles[goal.id]?.trim() && (
                              <button
                                onClick={() => addAction(goal.id)}
                                className="text-[10px] font-sans font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 transition"
                              >
                                Ajouter
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <GoalHistoryTimeline
                  goalId={goal.id}
                  data={data}
                  updateData={updateData}
                  onClose={() => {}}
                />

                <div className="mt-5 flex items-center justify-between border-t border-stone-100/50 dark:border-stone-800 pt-5">
                  <div className="flex items-center gap-2">
                    <select
                      value={goal.status}
                      onChange={(e) => handleStatusChange(goal.id, e.target.value as Goal['status'])}
                      className={`text-xs font-sans uppercase font-bold tracking-wider px-3 py-1.5 rounded-full border cursor-pointer outline-none transition ${
                        goal.status === 'En cours'
                          ? 'text-amber-850 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20 hover:bg-amber-100/50 dark:hover:bg-amber-500/20'
                          : goal.status === 'En pause'
                          ? 'text-stone-550 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 hover:bg-stone-200/50 dark:hover:bg-stone-700'
                          : 'text-emerald-850 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20 hover:bg-emerald-100/50 dark:hover:bg-emerald-500/20'
                      }`}
                    >
                      <option value="En cours">En cours</option>
                      <option value="En pause">En pause</option>
                      <option value="Atteint">Atteint</option>
                    </select>

                    {goal.status === 'En cours' && goal.deadline && (() => {
                      const today = new Date();
                      today.setHours(0,0,0,0);
                      const deadlineDate = new Date(goal.deadline);
                      deadlineDate.setHours(0,0,0,0);
                      const diffTime = deadlineDate.getTime() - today.getTime();
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      
                      if (diffDays < 0) {
                        return (
                          <span className="text-[10px] font-sans font-bold uppercase tracking-wider bg-red-50 dark:bg-red-500/10 text-red-800 dark:text-red-400 border border-red-100 dark:border-red-500/20 px-2.5 py-1.5 rounded-full">
                            Échéance dépassée
                          </span>
                        );
                      } else if (diffDays === 0) {
                        return (
                          <span className="text-[10px] font-sans font-bold uppercase tracking-wider bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20 px-2.5 py-1.5 rounded-full">
                            Aujourd’hui
                          </span>
                        );
                      } else {
                        return (
                          <span className="text-[10px] font-sans font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-500/10 text-blue-800 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20 px-2.5 py-1.5 rounded-full">
                            J-{diffDays}
                          </span>
                        );
                      }
                    })()}
                  </div>
                  <span className="text-[10px] text-stone-400 dark:text-stone-500 font-sans uppercase">
                    Créé le {new Intl.DateTimeFormat('fr-FR').format(new Date(goal.createdAt))}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
        </>
      )}

      {achievedGoals.length > 0 && (
        <div className="mt-16 pt-10 border-t border-stone-200 dark:border-stone-800">
          <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
            <h3 className="text-lg font-light text-stone-600 dark:text-stone-300 flex items-center gap-2.5">
              <Trophy className="w-5 h-5 text-amber-500 dark:text-amber-400" />
              Mes trophées
            </h3>
            <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 px-3 py-1.5 rounded-full">
              {achievedGoals.length} objectif{achievedGoals.length > 1 ? 's' : ''} atteint{achievedGoals.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievedGoals.map(goal => (
              <div
                key={goal.id}
                className="relative bg-gradient-to-b from-amber-50/70 to-white dark:from-amber-500/10 dark:to-stone-900 border border-amber-100 dark:border-amber-500/20 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full group text-center"
              >
                <button
                  onClick={() => deleteGoal(goal.id)}
                  title="Supprimer ce trophée"
                  className="absolute top-3 right-3 text-stone-300 dark:text-stone-600 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="mx-auto mb-3 w-14 h-14 rounded-full bg-amber-100/80 dark:bg-amber-500/15 flex items-center justify-center ring-4 ring-amber-50 dark:ring-amber-500/5">
                  <Trophy className="w-7 h-7 text-amber-500 dark:text-amber-400" />
                </div>

                <span className="text-[9px] font-sans font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest mb-1.5">{goal.domain}</span>
                <h4 className="text-lg font-medium text-stone-800 dark:text-stone-100 leading-snug mb-3">{goal.title}</h4>

                <div className="mt-auto pt-3 border-t border-amber-100/60 dark:border-amber-500/10 flex items-center justify-center gap-2">
                  <span className="text-[10px] text-stone-500 dark:text-stone-400 font-sans uppercase tracking-wide">
                    {getAchievedDate(goal) ? `Atteint le ${getAchievedDate(goal)}` : 'Atteint'}
                  </span>
                  <button
                    onClick={() => handleStatusChange(goal.id, 'En cours')}
                    title="Replacer parmi les objectifs en cours"
                    className="flex items-center gap-1 text-[10px] font-sans font-bold uppercase tracking-wide text-stone-400 dark:text-stone-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Réactiver
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
