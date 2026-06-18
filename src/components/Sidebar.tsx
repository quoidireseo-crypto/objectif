import { useState } from 'react';
import { LayoutDashboard, Flag, CheckSquare, BookHeart, PieChart, Settings, Calendar as CalendarIcon, LayoutGrid, X, Network, Repeat } from 'lucide-react';
import { ViewType } from '../types';
import { SkoposLogo } from './SkoposLogo';

interface SidebarProps {
  currentView: ViewType;
  onChangeView: (view: ViewType) => void;
}

export function Sidebar({ currentView, onChangeView }: SidebarProps) {
  const [isSpaceMenuOpen, setIsSpaceMenuOpen] = useState(false);

  const navItems: { id: ViewType; label: string; icon: any }[] = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'goals', label: 'Mes Objectifs', icon: Flag },
    { id: 'tasks', label: 'Mon Quotidien', icon: CheckSquare },
    { id: 'habits', label: 'Mes Habitudes', icon: Repeat },
    { id: 'calendar', label: 'Calendrier', icon: CalendarIcon },
    { id: 'journal', label: 'Journal de bord', icon: BookHeart },
    { id: 'review', label: 'Mon Bilan', icon: PieChart },
    { id: 'graph', label: 'Ma Carte Mentale', icon: Network },
    { id: 'settings', label: 'Paramètres', icon: Settings },
  ];

  // Secondary views grouped under "Mon Espace" on mobile
  const spaceViews: { id: ViewType; label: string; description: string; icon: any; colorClass: string; iconColor: string }[] = [
    {
      id: 'habits',
      label: 'Mes Habitudes',
      description: 'Construire la régularité, jour après jour',
      icon: Repeat,
      colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      iconColor: 'text-emerald-600'
    },
    {
      id: 'calendar',
      label: 'Calendrier', 
      description: 'Planifier et voir vos journées', 
      icon: CalendarIcon,
      colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      iconColor: 'text-emerald-600'
    },
    { 
      id: 'journal', 
      label: 'Journal de bord', 
      description: 'Consigner vos réflexions et vos progrès', 
      icon: BookHeart,
      colorClass: 'bg-rose-50 text-rose-700 border-rose-100',
      iconColor: 'text-rose-600'
    },
    { 
      id: 'graph', 
      label: 'Ma Carte Mentale', 
      description: 'Visualiser les liens objectifs et actions', 
      icon: Network,
      colorClass: 'bg-indigo-50 text-indigo-700 border-indigo-100',
      iconColor: 'text-indigo-600'
    },
    { 
      id: 'review', 
      label: 'Mon Bilan', 
      description: 'Analyser l’évolution et les statistiques', 
      icon: PieChart,
      colorClass: 'bg-amber-50 text-amber-700 border-amber-100',
      iconColor: 'text-amber-600'
    },
    { 
      id: 'settings', 
      label: 'Paramètres', 
      description: 'Rappels, sauvegardes et configuration', 
      icon: Settings,
      colorClass: 'bg-stone-100 text-stone-700 border-stone-200',
      iconColor: 'text-stone-600'
    },
  ];

  const handleSelectMobileView = (view: ViewType) => {
    onChangeView(view);
    setIsSpaceMenuOpen(false);
  };

  const isMoreSpaceActive = ['habits', 'calendar', 'journal', 'review', 'settings', 'graph'].includes(currentView);

  return (
    <>
      {/* Desktop Sidebar (unchanged, clean, spacious) */}
      <aside className="hidden md:flex w-64 bg-stone-900 text-stone-200 h-screen flex-col fixed left-0 top-0 border-r border-stone-800 z-50">
        <div className="p-6 border-b border-stone-800">
          <h1 className="text-2xl font-sans tracking-widest font-bold text-white flex items-center gap-3">
            <SkoposLogo className="text-[#6EE7B7] shrink-0" size={28} />
            SKOPOS
          </h1>
          <p className="text-xs text-emerald-300 mt-2 font-serif italic tracking-wide">chaque jour son nouveau départ</p>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-2 font-sans">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onChangeView(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm cursor-pointer ${
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

      {/* Mobile Bottom Navigation (Highly optimized 4 primary tabs) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-stone-900/95 backdrop-blur-md border-t border-stone-800 flex p-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] z-50 shadow-lg">
        <div className="flex justify-around w-full px-2">
          {/* Dashboard Tab */}
          <button
            onClick={() => handleSelectMobileView('dashboard')}
            className={`flex flex-col items-center justify-center p-2 min-w-[4.5rem] transition-all duration-200 cursor-pointer ${
              currentView === 'dashboard' ? 'text-emerald-400' : 'text-stone-500'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 mb-1 shrink-0" />
            <span className="text-[10px] font-sans font-medium leading-none">Tableau de bord</span>
          </button>

          {/* Goals Tab */}
          <button
            onClick={() => handleSelectMobileView('goals')}
            className={`flex flex-col items-center justify-center p-2 min-w-[4.5rem] transition-all duration-200 cursor-pointer ${
              currentView === 'goals' ? 'text-emerald-400' : 'text-stone-500'
            }`}
          >
            <Flag className="w-5 h-5 mb-1 shrink-0" />
            <span className="text-[10px] font-sans font-medium leading-none">Objectifs</span>
          </button>

          {/* Tasks Tab */}
          <button
            onClick={() => handleSelectMobileView('tasks')}
            className={`flex flex-col items-center justify-center p-2 min-w-[4.5rem] transition-all duration-200 cursor-pointer ${
              currentView === 'tasks' ? 'text-emerald-400' : 'text-stone-500'
            }`}
          >
            <CheckSquare className="w-5 h-5 mb-1 shrink-0" />
            <span className="text-[10px] font-sans font-medium leading-none">Quotidien</span>
          </button>

          {/* Mon Espace Drawer Menu Tab */}
          <button
            onClick={() => setIsSpaceMenuOpen(true)}
            className={`flex flex-col items-center justify-center p-2 min-w-[4.5rem] transition-all duration-200 cursor-pointer ${
              isMoreSpaceActive ? 'text-emerald-400' : 'text-stone-500'
            }`}
          >
            <LayoutGrid className="w-5 h-5 mb-1 shrink-0" />
            <span className="text-[10px] font-sans font-medium leading-none">Mon Espace</span>
          </button>
        </div>
      </nav>

      {/* Sliding Bottom Drawer Sheet for mobile 'Mon Espace' */}
      {isSpaceMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex items-end justify-center animate-in fade-in duration-300">
          {/* Backdrop Click Dismiss */}
          <div 
            className="absolute inset-0 cursor-pointer"
            onClick={() => setIsSpaceMenuOpen(false)}
          />
          
          <div className="relative w-full max-w-lg bg-[#F5F5F0] dark:bg-stone-900 rounded-t-[2.5rem] border-t border-stone-200 dark:border-stone-800 p-6 pb-[calc(2rem+env(safe-area-inset-bottom))] shadow-2xl z-10 animate-in slide-in-from-bottom duration-300">
            {/* Top Indicator Line */}
            <div className="w-12 h-1 bg-stone-300 dark:bg-stone-700 rounded-full mx-auto mb-5" />

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <SkoposLogo className="text-[#047857] dark:text-emerald-400" size={22} />
                <h3 className="text-sm font-sans tracking-widest font-bold text-[#1C1917] dark:text-stone-100 uppercase">
                  Mon Espace
                </h3>
              </div>
              <button
                onClick={() => setIsSpaceMenuOpen(false)}
                className="p-1.5 rounded-full bg-stone-200/60 dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 active:scale-95 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Links Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {spaceViews.map((view) => {
                const Icon = view.icon;
                const isCurrent = currentView === view.id;
                return (
                  <button
                    key={view.id}
                    onClick={() => handleSelectMobileView(view.id)}
                    className={`w-full hover:bg-white text-left p-4 rounded-2xl border transition-all duration-200 flex items-start gap-3.5 cursor-pointer ${
                      isCurrent 
                        ? 'bg-white border-emerald-500/65 shadow-xs' 
                        : 'bg-white/50 hover:shadow-xs border-stone-200/70'
                    }`}
                  >
                    <div className={`p-2 rounded-xl shrink-0 border ${view.colorClass}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-sans font-bold text-stone-800">{view.label}</h4>
                      <p className="text-[11px] font-sans text-stone-500 leading-normal mt-0.5">{view.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Motivational subline */}
            <p className="text-center text-[11px] font-serif italic text-stone-400 mt-6 pt-3 border-t border-stone-200/50">
              « Chaque jour est une nouvelle chance d’être acteur de sa vie »
            </p>
          </div>
        </div>
      )}
    </>
  );
}

