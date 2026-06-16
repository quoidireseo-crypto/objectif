import { Compass, Target, CheckSquare, BookHeart } from 'lucide-react';
import { ViewType } from '../types';

interface SidebarProps {
  currentView: ViewType;
  onChangeView: (view: ViewType) => void;
}

export function Sidebar({ currentView, onChangeView }: SidebarProps) {
  const navItems: { id: ViewType; label: string; icon: any }[] = [
    { id: 'dashboard', label: 'Tableau de bord', icon: Compass },
    { id: 'goals', label: 'Mes Objectifs', icon: Target },
    { id: 'tasks', label: 'Mon Quotidien', icon: CheckSquare },
    { id: 'journal', label: 'Journal de bord', icon: BookHeart },
  ];

  return (
    <>
      <aside className="hidden md:flex w-64 bg-stone-900 text-stone-200 h-screen flex-col fixed left-0 top-0 border-r border-stone-800 z-50">
        <div className="p-6 border-b border-stone-800">
          <h1 className="text-xl font-light text-white flex items-center gap-3">
            <Compass className="text-emerald-500 w-6 h-6 shrink-0" />
            La Boussole
          </h1>
          <p className="text-xs text-stone-400 mt-2 font-sans font-medium tracking-wide uppercase">Espace de Didier</p>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-2 font-sans">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onChangeView(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm ${
                  isActive 
                    ? 'bg-emerald-500/10 text-emerald-400 font-medium' 
                    : 'hover:bg-stone-800/60 text-stone-400 hover:text-stone-200'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-400' : 'text-stone-500'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-6 text-sm text-stone-500 border-t border-stone-800">
          <p className="font-serif italic opacity-80 leading-relaxed">"Le meilleur moment pour planter un arbre était il y a 20 ans. Le deuxième meilleur moment est maintenant."</p>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-stone-900/95 backdrop-blur-md border-t border-stone-800 flex justify-around items-center p-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] z-50">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`flex flex-col items-center justify-center p-2 min-w-[4rem] transition-all duration-200 ${
                isActive ? 'text-emerald-400' : 'text-stone-500'
              }`}
            >
              <Icon className={`w-5 h-5 mb-1 ${isActive ? 'text-emerald-400' : 'text-stone-500'}`} />
              <span className="text-[10px] font-sans font-medium leading-none">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
