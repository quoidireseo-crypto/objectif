import { useState } from 'react';
import { AppData, Goal, LifeDomain, Milestone, Task } from '../types';
import { Plus, Target, Clock, Heart, Briefcase, Activity, Home, Trash2, X, Coins, Sparkles, CheckSquare, Square, CheckCircle } from 'lucide-react';
import { useGoalHistory } from '../hooks/useGoalHistory';
import { GoalHistoryTimeline } from '../components/GoalHistoryTimeline';

interface GoalsProps {
  data: AppData;
  updateData: (data: Partial<AppData>) => void;
}

const DOMAINS: { label: LifeDomain; icon: any; color: string }[] = [
  { label: 'Santé & Bien-être', icon: Activity, color: 'text-amber-700 bg-amber-50 border-amber-100' },
  { label: 'Projet Personnel', icon: Target, color: 'text-stone-700 bg-stone-100 border-stone-200' },
  { label: 'Relations & Famille', icon: Heart, color: 'text-rose-700 bg-rose-50 border-rose-100' },
  { label: 'Apprentissage', icon: Briefcase, color: 'text-blue-700 bg-blue-50 border-blue-100' },
  { label: 'Finances', icon: Coins, color: 'text-emerald-700 bg-emerald-50 border-emerald-100' },
  { label: 'Spiritualité', icon: Sparkles, color: 'text-indigo-700 bg-indigo-50 border-indigo-100' },
  { label: 'Autre', icon: Home, color: 'text-stone-600 bg-stone-50 border-stone-200' },
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

export function GoalsView({ data, updateData }: GoalsProps) {
  const { addHistoryEntry } = useGoalHistory(data, updateData);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedVerb, setSelectedVerb] = useState(VERBS[0].id);
  const [goalComplement, setGoalComplement] = useState('');
  const [firstAction, setFirstAction] = useState('');
  const [newMilestoneTitles, setNewMilestoneTitles] = useState<{ [goalId: string]: string }>({});
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

  const getDeadlineBadge = (goal: Goal) => {
    if (goal.status === 'Atteint') {
      return (
        <div className="flex items-center gap-2 text-xs text-emerald-800 font-sans uppercase font-bold tracking-wider bg-emerald-50 border border-emerald-100 w-max px-3 py-1.5 rounded-full">
          <Target className="w-3.5 h-3.5" />
          Atteint
        </div>
      );
    }

    if (goal.status === 'En pause') {
      return (
        <div className="flex items-center gap-2 text-xs text-stone-500 font-sans uppercase font-bold tracking-wider bg-stone-100 border border-stone-200 w-max px-3 py-1.5 rounded-full">
          <Clock className="w-3.5 h-3.5" />
          En pause
        </div>
      );
    }

    if (!goal.deadline) {
       return (
         <div className="flex items-center gap-2 text-xs text-amber-800 font-sans uppercase font-bold tracking-wider bg-amber-50 border border-amber-100 w-max px-3 py-1.5 rounded-full">
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
        <div className="flex items-center gap-2 text-xs text-red-800 font-sans uppercase font-bold tracking-wider bg-red-50 border border-red-100 px-3 py-1.5 rounded-full">
          <Clock className="w-3.5 h-3.5" />
          Échéance dépassée
        </div>
      );
    } 
    
    if (diffDays === 0) {
      return (
        <div className="flex items-center gap-2 text-xs text-amber-800 font-sans uppercase font-bold tracking-wider bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-full">
          <Clock className="w-3.5 h-3.5" />
          Aujourd'hui
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 text-xs text-blue-800 font-sans uppercase font-bold tracking-wider bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full">
        <Clock className="w-3.5 h-3.5" />
        Dans {diffDays} jour{diffDays > 1 ? 's' : ''}
      </div>
    );
  };

  const activeGoals = data.goals.filter(g => g.status !== 'Atteint');
  const achievedGoals = data.goals.filter(g => g.status === 'Atteint');

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {celebrationMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm text-center animate-in zoom-in-95 duration-500 border border-emerald-100">
            <div className="bg-emerald-50 text-emerald-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5">
              <Target className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-light text-stone-900 mb-2">Bravo !</h3>
            <p className="text-emerald-800 font-medium mb-4 italic text-lg leading-tight">
              Tu as atteint : "{celebrationMessage.title}"
            </p>
            <p className="text-stone-500 text-sm leading-relaxed mb-6 font-light">
              Ce cap est désormais derrière toi. <br/>
              Qu'est-ce que tu choisis maintenant ?
            </p>
          </div>
        </div>
      )}

      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 border-b border-stone-200 pb-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-light text-stone-900">Mes Objectifs</h2>
          <p className="text-stone-500 font-sans tracking-wide uppercase text-[10px] md:text-xs mt-2 italic">Définir le cap. Pourquoi je fais les choses.</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="bg-stone-800 w-full sm:w-auto justify-center hover:bg-stone-900 text-white px-5 py-3 rounded-xl font-sans uppercase tracking-widest text-xs flex items-center gap-2 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nouveau cap
        </button>
      </header>

      {isAdding && (
        <div className="bg-white border border-stone-100 shadow-sm rounded-3xl p-8 mb-8 relative animate-in fade-in zoom-in-95">
          <button 
            onClick={() => setIsAdding(false)} 
             className="absolute top-6 right-6 text-stone-400 hover:text-stone-600"
          >
            <X className="w-5 h-5" />
          </button>
          
          <h3 className="text-2xl font-light mb-6 text-stone-900">Définir un nouvel objectif</h3>
          
          <div className="space-y-6 font-sans">
            <div className="bg-[#F5F5F0]/50 p-5 rounded-2xl border border-stone-200/60">
              <label className="block text-xs font-bold text-stone-400 uppercase tracking-wide mb-3">Étape 1 : Choisir une action</label>
              <div className="flex flex-wrap gap-2 mb-6">
                {VERBS.map(v => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVerb(v.id)}
                    className={`px-4 py-2 rounded-full text-sm font-sans transition-all ${
                      selectedVerb === v.id 
                        ? 'bg-emerald-600 text-white shadow-md' 
                        : 'bg-stone-100 text-stone-600 border border-stone-200 hover:bg-stone-200'
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>

              <label className="block text-xs font-bold text-stone-400 uppercase tracking-wide mb-2">Étape 2 : Compléter l'objectif</label>
              {selectedVerb !== 'Autre...' && (
                <p className="text-emerald-700 italic font-medium mb-3 font-serif text-lg">
                  "Je veux {selectedVerb.toLowerCase()} <span className={goalComplement ? 'text-emerald-700' : 'text-stone-400'}>{goalComplement || '[...]'}</span>"
                </p>
              )}
              <input
                type="text"
                placeholder={VERBS.find(v => v.id === selectedVerb)?.placeholder}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 outline-none focus:ring-1 focus:ring-emerald-700 focus:border-emerald-700 text-stone-800 transition shadow-inner bg-white"
                value={goalComplement}
                onChange={e => setGoalComplement(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-400 uppercase tracking-wide mb-3">Étape 3 : Échéance (Optionnel)</label>
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
                          isSelected ? 'border-emerald-700 bg-emerald-50 text-emerald-800 font-bold' : 'border-stone-200 text-stone-500 hover:bg-stone-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
                <input
                  type="date"
                  className="w-full sm:w-auto px-4 py-2 rounded-xl border border-stone-200 outline-none focus:ring-1 focus:ring-emerald-700 focus:border-emerald-700 text-stone-800 transition font-sans text-sm"
                  value={newGoal.deadline || ''}
                  onChange={e => setNewGoal({...newGoal, deadline: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-400 uppercase tracking-wide mb-2">Pourquoi est-ce important pour moi ? (Le sens profond / motivation)</label>
              <textarea
                placeholder="Je veux faire cela parce que..."
                className="w-full px-4 py-3 rounded-xl border border-stone-200 outline-none focus:ring-1 focus:ring-emerald-700 focus:border-emerald-700 text-stone-800 transition min-h-[100px] resize-y"
                value={newGoal.why}
                onChange={e => setNewGoal({...newGoal, why: e.target.value})}
              />
            </div>

            <div>
               <label className="block text-xs font-bold text-stone-400 uppercase tracking-wide mb-3">Domaine de vie</label>
               <div className="flex flex-wrap gap-3">
                 {DOMAINS.map(dom => {
                   const Icon = dom.icon;
                   const isSelected = newGoal.domain === dom.label;
                   return (
                     <button
                       key={dom.label}
                       onClick={() => setNewGoal({...newGoal, domain: dom.label})}
                       className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-sm ${
                         isSelected ? 'border-emerald-700 bg-emerald-50 text-emerald-800' : 'border-stone-200 text-stone-500 hover:bg-stone-50'
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
              <label className="block text-xs font-bold text-stone-400 uppercase tracking-wide mb-2">
                Quelle est la toute première petite chose que tu pourrais faire cette semaine pour avancer vers cet objectif ? <span className="text-stone-300 normal-case font-normal italic">(Optionnel)</span>
              </label>
              <input
                type="text"
                placeholder="Ex : Marcher 15 minutes demain matin..."
                className="w-full px-4 py-3 rounded-xl border border-stone-200 outline-none focus:ring-1 focus:ring-emerald-700 focus:border-emerald-700 text-stone-800 transition shadow-inner bg-[#F5F5F0]/50"
                value={firstAction}
                onChange={e => setFirstAction(e.target.value)}
              />
            </div>

            <div className="pt-6 flex justify-end gap-3 border-t border-stone-100 mt-2">
              <button 
                onClick={() => setIsAdding(false)}
                className="px-5 py-2.5 rounded-xl font-bold uppercase tracking-widest text-xs text-stone-500 hover:bg-stone-100 transition"
              >
                Annuler
              </button>
              <button 
                onClick={handleSave}
                disabled={!getFinalTitle() || !newGoal.why}
                className="bg-stone-800 text-white px-6 py-2.5 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-stone-900 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Valider l'objectif
              </button>
            </div>
          </div>
        </div>
      )}

      {data.goals.length === 0 && !isAdding ? (
        <div className="text-center py-20 bg-[#EAE7E2] rounded-3xl border border-stone-200">
          <Target className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <p className="text-stone-500 font-sans font-bold">Aucun objectif défini.</p>
          <p className="text-stone-400 text-sm mt-1 mb-6 italic">Il est temps de choisir une direction.</p>
          <button
            onClick={() => setIsAdding(true)}
            className="text-emerald-800 font-sans text-xs uppercase tracking-widest font-bold hover:underline"
          >
            Fixer mon premier cap
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {activeGoals.map(goal => {
            const theme = getDomainTheme(goal.domain);
            const Icon = theme.icon;

            return (
              <div key={goal.id} className="bg-white border text-left border-stone-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition duration-300 flex flex-col h-full group">
                <div className="flex justify-between items-start mb-4">
                  <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 w-max ${theme.color}`}>
                    <Icon className="w-4 h-4" />
                    <span className="text-[10px] font-sans font-bold uppercase tracking-wider">{goal.domain}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => markAsAchieved(goal.id)} className="text-stone-300 hover:text-emerald-600 p-1.5 rounded-lg hover:bg-emerald-50 transition-colors" title="Marquer comme atteint">
                      <CheckCircle className="w-5 h-5" />
                    </button>
                    <button onClick={() => deleteGoal(goal.id)} className="text-stone-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-stone-50 transition-colors" title="Supprimer">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <h3 className="text-2xl font-light text-stone-900 mb-3">{goal.title}</h3>
                
                <div className="bg-[#F5F5F0] p-4 rounded-2xl mt-2 flex-grow border border-stone-200/50">
                  <p className="text-[10px] font-bold font-sans text-stone-500 uppercase tracking-widest mb-2">Le sens profond</p>
                  <p className="text-stone-700 italic leading-snug mb-4">"{goal.why}"</p>
                  
                  <div className="border-t border-stone-200/50 pt-4 mt-2">
                    <p className="text-[10px] font-bold font-sans text-stone-500 uppercase tracking-widest mb-3">Mes prochaines étapes</p>
                    
                    {(() => {
                      const goalMilestones = (data.milestones || []).filter(m => m.goalId === goal.id).sort((a,b) => a.order - b.order);
                      const completedCount = goalMilestones.filter(m => m.isCompleted).length;
                      
                      return (
                        <div className="space-y-3">
                          {goalMilestones.length > 0 && (
                            <div className="w-full bg-stone-200 rounded-full h-1.5 mb-4 overflow-hidden">
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
                                className={`mt-0.5 shrink-0 transition-colors ${ms.isCompleted ? 'text-emerald-500' : 'text-stone-300 hover:text-stone-400'}`}
                              >
                                {ms.isCompleted ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                              </button>
                              <span className={`text-sm font-sans flex-1 transition-all ${ms.isCompleted ? 'text-stone-400 line-through' : 'text-stone-700'}`}>
                                {ms.title}
                              </span>
                              <button 
                                onClick={() => deleteMilestone(ms.id)}
                                className="text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
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
                                  className="flex-1 bg-transparent border-b border-stone-200 text-sm py-1 outline-none focus:border-emerald-500 transition-colors font-sans placeholder:text-stone-400"
                                />
                                {newMilestoneTitles[goal.id]?.trim() && (
                                  <button 
                                    onClick={() => addMilestone(goal.id)}
                                    className="text-[10px] font-sans font-bold uppercase tracking-widest text-emerald-600 hover:text-emerald-800 transition"
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
                </div>

                <GoalHistoryTimeline
                  goalId={goal.id}
                  data={data}
                  updateData={updateData}
                  onClose={() => {}}
                />

                <div className="mt-5 flex items-center justify-between border-t border-stone-100/50 pt-5">
                  <div className="flex items-center gap-2">
                    <select
                      value={goal.status}
                      onChange={(e) => handleStatusChange(goal.id, e.target.value as Goal['status'])}
                      className={`text-xs font-sans uppercase font-bold tracking-wider px-3 py-1.5 rounded-full border cursor-pointer outline-none transition ${
                        goal.status === 'En cours'
                          ? 'text-amber-850 bg-amber-50 border-amber-100 hover:bg-amber-100/50'
                          : goal.status === 'En pause'
                          ? 'text-stone-550 bg-stone-100 border-stone-200 hover:bg-stone-200/50'
                          : 'text-emerald-850 bg-emerald-50 border-emerald-100 hover:bg-emerald-100/50'
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
                          <span className="text-[10px] font-sans font-bold uppercase tracking-wider bg-red-50 text-red-800 border border-red-100 px-2.5 py-1.5 rounded-full">
                            Échéance dépassée
                          </span>
                        );
                      } else if (diffDays === 0) {
                        return (
                          <span className="text-[10px] font-sans font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-100 px-2.5 py-1.5 rounded-full">
                            Aujourd’hui
                          </span>
                        );
                      } else {
                        return (
                          <span className="text-[10px] font-sans font-bold uppercase tracking-wider bg-blue-50 text-blue-800 border border-blue-100 px-2.5 py-1.5 rounded-full">
                            J-{diffDays}
                          </span>
                        );
                      }
                    })()}
                  </div>
                  <span className="text-[10px] text-stone-400 font-sans uppercase">
                    Créé le {new Intl.DateTimeFormat('fr-FR').format(new Date(goal.createdAt))}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {achievedGoals.length > 0 && (
        <div className="mt-16 pt-10 border-t border-stone-200">
          <h3 className="text-lg font-light text-stone-500 mb-6 flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-600" />
            Caps honorés
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievedGoals.map(goal => {
              const theme = getDomainTheme(goal.domain);
              
              return (
                <div key={goal.id} className="bg-stone-50/50 border border-stone-100 rounded-2xl p-5 opacity-70 hover:opacity-100 transition-opacity flex flex-col h-full group">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[9px] font-sans font-bold text-emerald-800 uppercase tracking-wider">{goal.domain}</span>
                    <button onClick={() => deleteGoal(goal.id)} className="text-stone-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h4 className="text-lg font-medium text-stone-800 line-through mb-2">{goal.title}</h4>
                  <div className="mt-auto pt-3 border-t border-stone-100/50 flex items-center justify-between gap-2">
                    <select
                      value={goal.status}
                      onChange={(e) => handleStatusChange(goal.id, e.target.value as Goal['status'])}
                      className="text-xs font-sans uppercase font-bold tracking-wider px-3 py-1.5 rounded-full border cursor-pointer outline-none transition text-emerald-850 bg-emerald-50 border-emerald-100 hover:bg-emerald-100/50"
                    >
                      <option value="En cours">En cours</option>
                      <option value="En pause">En pause</option>
                      <option value="Atteint">Atteint</option>
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
