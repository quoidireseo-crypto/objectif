import { useState } from 'react';
import { AppData, Goal, LifeDomain } from '../types';
import { Plus, Target, Clock, Heart, Briefcase, Activity, Home, Trash2, X, Coins, Sparkles } from 'lucide-react';

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

export function GoalsView({ data, updateData }: GoalsProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newGoal, setNewGoal] = useState<Partial<Goal>>({
    title: '',
    why: '',
    domain: 'Santé & Bien-être',
    status: 'En cours'
  });

  const handleSave = () => {
    if (!newGoal.title || !newGoal.why) return;

    const goal: Goal = {
      id: Date.now().toString(),
      title: newGoal.title,
      why: newGoal.why,
      domain: newGoal.domain as LifeDomain,
      status: 'En cours',
      createdAt: new Date().toISOString(),
    };

    updateData({ goals: [goal, ...data.goals] });
    setIsAdding(false);
    setNewGoal({ title: '', why: '', domain: 'Santé & Bien-être', status: 'En cours' });
  };

  const deleteGoal = (id: string) => {
    if (confirm("Supprimer cet objectif ?")) {
      updateData({ 
        goals: data.goals.filter(g => g.id !== id),
        // Also remove tasks linked to this goal? Or just leave them unlinked?
        // Let's leave them or unlink them. Here we can just remove the goal.
        tasks: data.tasks.map(t => t.goalId === id ? { ...t, goalId: undefined } : t)
      });
    }
  };

  const getDomainTheme = (domainLabel: string) => {
    return DOMAINS.find(c => c.label === domainLabel) || DOMAINS[0];
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
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
            <div>
              <label className="block text-xs font-bold text-stone-400 uppercase tracking-wide mb-2">Quel est l'objectif ?</label>
              <input
                type="text"
                placeholder="Ex: Retrouver la forme, Écrire un livre, Rénover la cuisine..."
                className="w-full px-4 py-3 rounded-xl border border-stone-200 outline-none focus:ring-1 focus:ring-emerald-700 focus:border-emerald-700 text-stone-800 transition"
                value={newGoal.title}
                onChange={e => setNewGoal({...newGoal, title: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-400 uppercase tracking-wide mb-2">Pourquoi est-ce important pour moi ? (L'intention)</label>
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

            <div className="pt-6 flex justify-end gap-3 border-t border-stone-100 mt-2">
              <button 
                onClick={() => setIsAdding(false)}
                className="px-5 py-2.5 rounded-xl font-bold uppercase tracking-widest text-xs text-stone-500 hover:bg-stone-100 transition"
              >
                Annuler
              </button>
              <button 
                onClick={handleSave}
                disabled={!newGoal.title || !newGoal.why}
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
          {data.goals.map(goal => {
            const theme = getDomainTheme(goal.domain);
            const Icon = theme.icon;

            return (
              <div key={goal.id} className="bg-white border text-left border-stone-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition duration-300 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 w-max ${theme.color}`}>
                    <Icon className="w-4 h-4" />
                    <span className="text-[10px] font-sans font-bold uppercase tracking-wider">{goal.domain}</span>
                  </div>
                  <button onClick={() => deleteGoal(goal.id)} className="text-stone-300 hover:text-red-500 p-1 transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                
                <h3 className="text-2xl font-light text-stone-900 mb-3">{goal.title}</h3>
                
                <div className="bg-[#F5F5F0] p-4 rounded-2xl mt-2 flex-grow border border-stone-200/50">
                  <p className="text-[10px] font-bold font-sans text-stone-500 uppercase tracking-widest mb-2">L'intention</p>
                  <p className="text-stone-700 italic leading-snug">"{goal.why}"</p>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-stone-100 pt-5">
                  <div className="flex items-center gap-2 text-xs text-amber-800 font-sans uppercase font-bold tracking-wider bg-amber-50 px-3 py-1.5 rounded-full">
                    <Clock className="w-4 h-4" />
                    {goal.status}
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
    </div>
  );
}
