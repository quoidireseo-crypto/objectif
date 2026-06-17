import { useState } from 'react';
import { useStorage } from './hooks/useStorage';
import { ViewType, AppData } from './types';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './views/DashboardView';
import { GoalsView } from './views/GoalsView';
import { TasksView } from './views/TasksView';
import { JournalView } from './views/JournalView';
import { ReviewView } from './views/ReviewView';
import { CalendarView } from './views/CalendarView';
import { SettingsView } from './views/SettingsView';
import { NotificationToast } from './components/NotificationToast';
import { useReminder } from './hooks/useReminder';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const { data, updateData, shouldRemindExport, dismissExportReminder } = useStorage();

  useReminder();

  const handleImportData = (importedData: AppData) => {
    updateData(importedData);
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView data={data} onChangeView={setCurrentView} />;
      case 'goals':
        return <GoalsView data={data} updateData={updateData} />;
      case 'tasks':
        return <TasksView data={data} updateData={updateData} />;
      case 'journal':
        return <JournalView data={data} updateData={updateData} />;
      case 'calendar':
        return <CalendarView data={data} updateData={updateData} />;
      case 'review':
        return <ReviewView data={data} />;
      case 'settings':
        return <SettingsView data={data} onImportData={handleImportData} />;
      default:
        return <DashboardView data={data} onChangeView={setCurrentView} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F5F5F0] font-serif text-stone-800 selection:bg-emerald-200 selection:text-emerald-900">
      <Sidebar currentView={currentView} onChangeView={setCurrentView} />
      
      <main className="flex-1 md:ml-64 p-4 sm:p-6 md:p-8 lg:p-12 pb-24 md:pb-8 lg:pb-12 overflow-y-auto relative h-[100dvh]">
        <div className="max-w-[1024px] mx-auto h-full flex flex-col">
          {shouldRemindExport && (
            <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0 shadow-sm animate-in fade-in">
              <p className="text-amber-900 font-sans font-medium text-sm">
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

      <NotificationToast data={data} />
    </div>
  );
}
