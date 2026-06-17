import { useRef, useState, ChangeEvent, useEffect } from 'react';
import { AppData } from '../types';
import { Download, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';

interface SettingsProps {
  data: AppData;
  onImportData: (data: AppData) => void;
}

export function SettingsView({ data, onImportData }: SettingsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const [reminderEnabled, setReminderEnabled] = useState(() => window.localStorage.getItem('didier_reminder_enabled') === 'true');
  const [reminderTime, setReminderTime] = useState(() => window.localStorage.getItem('didier_reminder_time') || '09:00');

  const handleExport = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `boussole-sauvegarde-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    window.localStorage.setItem('didier_last_export_date', new Date().toISOString());
    window.dispatchEvent(new Event('didier_export_occurred'));
  };

  const [backup1] = useState<{data: AppData, date: string} | null>(() => {
      const raw = window.localStorage.getItem('didier_boussole_backup_1');
      const date = window.localStorage.getItem('didier_boussole_backup_1_date');
      return raw ? { data: JSON.parse(raw), date: date || 'Inconnue' } : null;
  });

  const [backup2] = useState<{data: AppData, date: string} | null>(() => {
      const raw = window.localStorage.getItem('didier_boussole_backup_2');
      const date = window.localStorage.getItem('didier_boussole_backup_2_date');
      return raw ? { data: JSON.parse(raw), date: date || 'Inconnue' } : null;
  });

  const handleRestore = (backupData: AppData) => {
    if (window.confirm("Cette action remplacera tes données actuelles avec cette sauvegarde. Es-tu sûr ?")) {
      onImportData(backupData);
      setImportStatus('success');
      setTimeout(() => setImportStatus('idle'), 3000);
    }
  };

  const renderBackupInfo = (label: string, backup: {data: AppData, date: string}) => {
    const backupDate = backup.date !== 'Inconnue' 
        ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(backup.date))
        : 'Inconnue';

    return (
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-stone-50 p-4 rounded-xl border border-stone-100 mb-3">
        <div>
          <h4 className="font-bold text-stone-800 text-sm font-sans mb-1">{label} - {backupDate}</h4>
          <p className="text-xs text-stone-500 font-sans">
            {backup.data.goals?.length || 0} objectif(s), {backup.data.tasks?.length || 0} tâche(s)
          </p>
        </div>
        <button 
          onClick={() => handleRestore(backup.data)}
          className="bg-white border border-stone-200 text-stone-700 px-4 py-2 rounded-lg text-xs font-bold font-sans uppercase tracking-wider hover:bg-stone-100 transition whitespace-nowrap"
        >
          Restaurer
        </button>
      </div>
    );
  };

  const handleImport = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsedData = JSON.parse(content) as AppData;
        
        // Basic validation
        if (parsedData.goals && parsedData.tasks && parsedData.journal) {
          onImportData(parsedData);
          setImportStatus('success');
          setTimeout(() => setImportStatus('idle'), 3000);
        } else {
          setImportStatus('error');
          setTimeout(() => setImportStatus('idle'), 3000);
        }
      } catch (err) {
        console.error("Error parsing backup file", err);
        setImportStatus('error');
        setTimeout(() => setImportStatus('idle'), 3000);
      }
      
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleToggleReminder = (enabled: boolean) => {
    setReminderEnabled(enabled);
    window.localStorage.setItem('didier_reminder_enabled', enabled.toString());
    window.dispatchEvent(new Event('didier_reminder_changed'));
    
    if (enabled && 'Notification' in window) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }
  };

  const handleTimeChange = (time: string) => {
    setReminderTime(time);
    window.localStorage.setItem('didier_reminder_time', time);
    window.dispatchEvent(new Event('didier_reminder_changed'));
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
      <header className="mb-8 border-b border-stone-200 pb-6">
        <h2 className="text-3xl md:text-4xl font-light text-stone-900">Paramètres</h2>
        <p className="text-stone-500 font-sans tracking-wide uppercase text-[10px] md:text-xs mt-2 italic">Sauvegarde et gestion des données.</p>
      </header>

      <div className="space-y-6">
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-stone-100 shadow-sm">
          <h3 className="text-lg font-bold font-sans uppercase tracking-widest text-stone-800 mb-2">Sauvegarde Manuelle</h3>
          <p className="text-stone-500 leading-relaxed mb-6 font-light">
            Tes données sont stockées uniquement sur cet appareil. Pense à télécharger une sauvegarde régulière pour ne rien perdre, ou pour transférer tes données vers un autre appareil.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleExport}
              className="flex-1 bg-stone-800 text-white flex items-center justify-center gap-3 px-6 py-4 rounded-xl hover:bg-stone-900 transition-all font-sans font-bold uppercase tracking-widest text-xs"
            >
              <Download className="w-5 h-5" />
              Exporter mes données
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 bg-white border-2 border-stone-200 text-stone-700 flex items-center justify-center gap-3 px-6 py-4 rounded-xl hover:bg-stone-50 hover:border-stone-300 transition-all font-sans font-bold uppercase tracking-widest text-xs"
            >
              <Upload className="w-5 h-5" />
              Importer une sauvegarde
            </button>
            <input 
              type="file" 
              accept=".json" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleImport}
            />
          </div>

          {importStatus === 'success' && (
            <div className="mt-4 p-4 bg-emerald-50 text-emerald-800 rounded-xl flex items-center gap-3 text-sm font-bold font-sans">
              <CheckCircle2 className="w-5 h-5" />
              Sauvegarde importée avec succès !
            </div>
          )}

          {importStatus === 'error' && (
            <div className="mt-4 p-4 bg-rose-50 text-rose-800 rounded-xl flex items-center gap-3 text-sm font-bold font-sans">
              <AlertCircle className="w-5 h-5" />
              Erreur lors de l'importation. Le fichier semble invalide.
            </div>
          )}

          {(backup1 || backup2) && (
            <div className="mt-8 pt-8 border-t border-stone-200">
               <h3 className="text-sm font-bold font-sans uppercase tracking-widest text-stone-800 mb-4">Restaurer une version précédente</h3>
               {backup1 && renderBackupInfo('Sauvegarde 1 (Récente)', backup1)}
               {backup2 && renderBackupInfo('Sauvegarde 2 (Ancienne)', backup2)}
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl p-6 md:p-8 border border-stone-100 shadow-sm">
          <h3 className="text-lg font-bold font-sans uppercase tracking-widest text-stone-800 mb-2">Rappels Bienveillants</h3>
          <p className="text-stone-500 leading-relaxed mb-6 font-light">
            Chaque jour à l'heure choisie, tu recevras un petit mot pour t'inviter à consulter ton cap du jour.
          </p>

          <div className="flex flex-col gap-6">
            <label className="flex items-center gap-3 cursor-pointer w-max">
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={reminderEnabled} 
                  onChange={(e) => handleToggleReminder(e.target.checked)} 
                />
                <div className={`block w-14 h-8 rounded-full transition-colors ${reminderEnabled ? 'bg-emerald-500' : 'bg-stone-200'}`}></div>
                <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${reminderEnabled ? 'transform translate-x-6' : ''}`}></div>
              </div>
              <span className="font-sans font-bold text-stone-700">Activer les rappels quotidiens</span>
            </label>

            {reminderEnabled && (
              <div className="flex items-center gap-3 bg-stone-50 p-4 rounded-xl border border-stone-100">
                <label htmlFor="reminderTime" className="font-sans font-medium text-stone-600 text-sm">Me rappeler à</label>
                <input 
                  type="time" 
                  id="reminderTime"
                  value={reminderTime}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  className="bg-white border border-stone-200 px-3 py-2 rounded-lg font-sans text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
