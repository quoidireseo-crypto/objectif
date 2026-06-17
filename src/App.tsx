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
  const { data, updateData } = useStorage();

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
        <div className="max-w-[1024px] mx-auto h-full">
          {renderView()}
        </div>
      </main>

      <NotificationToast data={data} />
    </div>
  );
}
