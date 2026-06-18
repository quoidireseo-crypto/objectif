import { useState } from 'react';
import { useStorage } from './hooks/useStorage';
import { useMorningRitual } from './hooks/useMorningRitual';
import { useTheme } from './hooks/useTheme';
import { useAuth } from './hooks/useAuth';
import { ViewType, AppData } from './types';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './views/DashboardView';
import { GoalsView } from './views/GoalsView';
import { TasksView } from './views/TasksView';
import { HabitsView } from './views/HabitsView';
import { JournalView } from './views/JournalView';
import { ReviewView } from './views/ReviewView';
import { CalendarView } from './views/CalendarView';
import { SettingsView } from './views/SettingsView';
import { NotificationToast } from './components/NotificationToast';
import { useReminder } from './hooks/useReminder';
import { SkoposLogo } from './components/SkoposLogo';
import { LandingView } from './views/LandingView';
import { GraphView } from './views/GraphView';
import { MorningRitualScreen } from './components/MorningRitualScreen';
import { WelcomeBackScreen } from './components/WelcomeBackScreen';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const { data, updateData, shouldRemindExport, dismissExportReminder } = useStorage();
  const { shouldShowRitual, completeRitual, skipRitual } = useMorningRitual(data, updateData);
  const { mode: themeMode, setThemeMode } = useTheme();
  const { hasPassword, isUnlocked, setPassword, removePassword, unlock, logout } = useAuth();

  const [userProfile, setUserProfile] = useState<{ name: string; ageGroup?: string; focusArea?: string } | null>(() => {
    const raw = window.localStorage.getItem('skopos_user_profile');
    try {
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  });

  const handleUpdateProfile = (profile: { name: string; ageGroup?: string; focusArea?: string } | null) => {
    if (profile === null) {
      window.localStorage.removeItem('skopos_user_profile');
    } else {
      window.localStorage.setItem('skopos_user_profile', JSON.stringify(profile));
    }
    setUserProfile(profile);
  };

  useReminder();

  const handleImportData = (importedData: AppData) => {
    const sanitizedData = {
      ...importedData,
      goals: importedData.goals || [],
      milestones: importedData.milestones || [],
      tasks: importedData.tasks || [],
      journal: importedData.journal || [],
      morningRituals: importedData.morningRituals || [],
      goalsHistory: importedData.goalsHistory || [],
      eveningReflections: importedData.eveningReflections || [],
      habits: importedData.habits || [],
      habitCompletions: importedData.habitCompletions || [],
      weeklyReviews: importedData.weeklyReviews || [],
    };
    updateData(sanitizedData);
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView data={data} updateData={updateData} onChangeView={setCurrentView} userProfile={userProfile} />;
      case 'goals':
        return <GoalsView data={data} updateData={updateData} />;
      case 'tasks':
        return <TasksView data={data} updateData={updateData} />;
      case 'habits':
        return <HabitsView data={data} updateData={updateData} />;
      case 'journal':
        return <JournalView data={data} updateData={updateData} />;
      case 'calendar':
        return <CalendarView data={data} updateData={updateData} />;
      case 'review':
        return <ReviewView data={data} updateData={updateData} />;
      case 'graph':
        return <GraphView data={data} onChangeView={setCurrentView} />;
      case 'settings':
        return (
          <SettingsView
            data={data}
            onImportData={handleImportData}
            userProfile={userProfile}
            onUpdateProfile={handleUpdateProfile}
            themeMode={themeMode}
            onChangeThemeMode={setThemeMode}
            hasPassword={hasPassword}
            onSetPassword={setPassword}
            onRemovePassword={removePassword}
            onLogout={logout}
          />
        );
      default:
        return <DashboardView data={data} updateData={updateData} onChangeView={setCurrentView} userProfile={userProfile} />;
    }
  };

  if (!userProfile) {
    return <LandingView onComplete={handleUpdateProfile} />;
  }

  if (!isUnlocked) {
    return <WelcomeBackScreen name={userProfile.name} hasPassword={hasPassword} onUnlock={unlock} />;
  }

  return (
    <div className="flex min-h-screen bg-[#F5F5F0] dark:bg-stone-950 font-serif text-stone-800 dark:text-stone-200 selection:bg-emerald-200 selection:text-emerald-900">
      <Sidebar currentView={currentView} onChangeView={setCurrentView} onLogout={logout} />

      <div className="flex-1 flex flex-col h-[100dvh] md:ml-64 relative overflow-hidden">
        {/* Mobile Top Header */}
        <header className="md:hidden flex flex-col items-center justify-center px-5 py-3.5 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 shrink-0 z-40 shadow-xs text-center">
          <div className="flex items-center gap-3">
            <SkoposLogo className="text-[#047857] dark:text-emerald-400" size={26} />
            <span className="text-lg font-sans font-bold tracking-widest text-[#1C1917] dark:text-stone-100">SKOPOS</span>
          </div>
          <p className="text-[11px] text-[#047857] dark:text-emerald-400 font-serif italic mt-1">chaque jour son nouveau départ</p>
        </header>

        {shouldShowRitual && (
          <MorningRitualScreen
            data={data}
            userProfile={userProfile}
            onComplete={completeRitual}
            onSkip={skipRitual}
          />
        )}

        <main className="flex-1 px-4 py-6 sm:p-6 md:p-8 lg:p-12 pb-44 md:pb-8 lg:pb-12 overflow-y-auto relative h-full">
          <div className="max-w-[1024px] mx-auto min-h-full flex flex-col">
            {shouldRemindExport && (
              <div className="mb-6 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0 shadow-sm animate-in fade-in">
                <p className="text-amber-900 dark:text-amber-200 font-sans font-medium text-sm">
                  💾 Il y a plus de 7 jours que tu n'as pas sauvegardé tes données.
                </p>
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                  <button 
                    onClick={() => {
                      const dataStr = JSON.stringify(data, null, 2);
                      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
                      const exportFileDefaultName = `skopos_export_${new Date().toISOString().split('T')[0]}.json`;
                      
                      const linkElement = document.createElement('a');
                      linkElement.setAttribute('href', dataUri);
                      linkElement.setAttribute('download', exportFileDefaultName);
                      linkElement.click();
                      
                      window.localStorage.setItem('didier_last_export_date', new Date().toISOString());
                      window.dispatchEvent(new Event('didier_export_occurred'));
                      dismissExportReminder();
                    }}
                    className="bg-amber-100 text-amber-900 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-amber-200 transition shrink-0"
                  >
                    Télécharger ma sauvegarde
                  </button>
                  <button 
                    onClick={dismissExportReminder}
                    className="text-amber-700/80 hover:text-amber-900 text-xs font-bold uppercase tracking-wider px-2 py-2 shrink-0"
                  >
                    Me rappeler plus tard
                  </button>
                </div>
              </div>
            )}
            
            <div className="flex-1">
              {renderView()}
            </div>
          </div>
        </main>
      </div>

      <NotificationToast data={data} />
    </div>
  );
}
