import { useRef, useState, ChangeEvent, useEffect } from 'react';
import { AppData } from '../types';
import { ThemeMode } from '../hooks/useTheme';
import { Download, Upload, AlertCircle, CheckCircle2, User, RefreshCw, Smartphone, Info, Sun, Moon, Clock } from 'lucide-react';

interface SettingsProps {
  data: AppData;
  onImportData: (data: AppData) => void;
  userProfile: { name: string; ageGroup?: string; focusArea?: string } | null;
  onUpdateProfile: (profile: { name: string; ageGroup?: string; focusArea?: string } | null) => void;
  themeMode: ThemeMode;
  onChangeThemeMode: (mode: ThemeMode) => void;
}

export function SettingsView({ data, onImportData, userProfile, onUpdateProfile, themeMode, onChangeThemeMode }: SettingsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const [profileName, setProfileName] = useState(userProfile?.name || '');
  const [profileAgeGroup, setProfileAgeGroup] = useState(userProfile?.ageGroup || '');
  const [profileFocusArea, setProfileFocusArea] = useState(userProfile?.focusArea || '');

  // Synchronise state with props if changed externally (safely without causing cursor jumps)
  useEffect(() => {
    if (userProfile) {
      if (userProfile.name !== profileName && profileName.trim() === '') {
        setProfileName(userProfile.name || '');
      }
      if (userProfile.ageGroup !== profileAgeGroup) {
        setProfileAgeGroup(userProfile.ageGroup || '');
      }
      if (userProfile.focusArea !== profileFocusArea) {
        setProfileFocusArea(userProfile.focusArea || '');
      }
    }
  }, [userProfile]);

  // Auto-save user profile changes instantly
  useEffect(() => {
    if (profileName.trim()) {
      onUpdateProfile({
        name: profileName.trim(),
        ageGroup: profileAgeGroup || undefined,
        focusArea: profileFocusArea || undefined,
      });
    }
  }, [profileName, profileAgeGroup, profileFocusArea]);

  const handleResetProfile = () => {
    if (window.confirm("Es-tu sûr de vouloir réinitialiser ton profil ? Cette action te renverra vers l'écran d'accueil d'onboarding (tes objectifs et tâches actuels ne seront pas supprimés).")) {
      onUpdateProfile(null);
    }
  };

  const [reminderEnabled, setReminderEnabled] = useState(() => window.localStorage.getItem('didier_reminder_enabled') === 'true');
  const [reminderTime, setReminderTime] = useState(() => window.localStorage.getItem('didier_reminder_time') || '09:00');

  // PWA install prompt handling (Ajouter à l'écran d'accueil)
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true;
    setIsInstalled(standalone);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    const onInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `skopos-sauvegarde-${new Date().toISOString().split('T')[0]}.json`;
    
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-stone-50 dark:bg-stone-800 p-4 rounded-xl border border-stone-100 dark:border-stone-700 mb-3">
        <div>
          <h4 className="font-bold text-stone-800 dark:text-stone-100 text-sm font-sans mb-1">{label} - {backupDate}</h4>
          <p className="text-xs text-stone-500 dark:text-stone-400 font-sans">
            {backup.data.goals?.length || 0} objectif(s), {backup.data.tasks?.length || 0} tâche(s)
          </p>
        </div>
        <button
          onClick={() => handleRestore(backup.data)}
          className="bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 text-stone-700 dark:text-stone-200 px-4 py-2 rounded-lg text-xs font-bold font-sans uppercase tracking-wider hover:bg-stone-100 dark:hover:bg-stone-600 transition whitespace-nowrap"
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
      <header className="mb-8 border-b border-stone-200 dark:border-stone-800 pb-6">
        <h2 className="text-3xl md:text-4xl font-light text-stone-900 dark:text-stone-100">Paramètres</h2>
        <p className="text-stone-500 dark:text-stone-400 font-sans tracking-wide uppercase text-[10px] md:text-xs mt-2 italic">Sauvegarde et gestion des données.</p>
      </header>

      <div className="space-y-6">
        {/* INSTALL APP SECTION */}
        {(installPrompt || isInstalled) && (
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 md:p-8 border border-stone-100 dark:border-stone-800 shadow-sm">
            <h3 className="text-lg font-bold font-sans uppercase tracking-widest text-stone-800 dark:text-stone-100 mb-2 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
              Installer l'application
            </h3>
            <p className="text-stone-500 dark:text-stone-400 leading-relaxed mb-6 font-light">
              Installe SKOPOS sur ton appareil pour l'ouvrir comme une vraie application, même hors connexion, directement depuis ton écran d'accueil.
            </p>
            {isInstalled ? (
              <div className="flex items-center gap-2.5 px-5 py-3.5 bg-emerald-50/70 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl text-[#047857] dark:text-emerald-400 font-sans text-xs uppercase tracking-widest font-bold w-max">
                <CheckCircle2 className="w-4 h-4" />
                Déjà installée sur cet appareil
              </div>
            ) : (
              <button
                onClick={handleInstall}
                className="bg-emerald-700 text-white flex items-center justify-center gap-3 px-6 py-4 rounded-xl hover:bg-emerald-800 transition-all font-sans font-bold uppercase tracking-widest text-xs w-full sm:w-auto"
              >
                <Download className="w-5 h-5" />
                Ajouter à l'écran d'accueil
              </button>
            )}
          </div>
        )}

        {/* PROFILE SECTION */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 md:p-8 border border-stone-100 dark:border-stone-800 shadow-sm">
          <h3 className="text-lg font-bold font-sans uppercase tracking-widest text-stone-800 dark:text-stone-100 mb-2 flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
            Mon Profil Local
          </h3>
          <p className="text-stone-500 dark:text-stone-400 leading-relaxed mb-6 font-light">
            Modifie les informations de ton espace de vie. Ces données restent stockées localement sur ton navigateur.
          </p>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wider font-sans font-bold text-stone-400 dark:text-stone-500 block">
                  Prénom / Pseudonyme
                </label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl outline-none focus:ring-1 focus:ring-emerald-700 focus:border-emerald-700 text-stone-800 dark:text-stone-100 font-sans text-sm transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wider font-sans font-bold text-stone-400 dark:text-stone-500 block">
                  Décennie / Tranche de vie
                </label>
                <select
                  value={profileAgeGroup}
                  onChange={(e) => setProfileAgeGroup(e.target.value)}
                  className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl outline-none focus:ring-1 focus:ring-emerald-700 focus:border-emerald-700 text-stone-700 dark:text-stone-300 font-sans text-sm transition cursor-pointer appearance-none"
                >
                  <option value="">Non déterminé</option>
                  <option value="Trente">La trentaine</option>
                  <option value="Quarante">La quarantaine</option>
                  <option value="Cinquante">La cinquantaine</option>
                  <option value="Soixante">La soixantaine</option>
                  <option value="SoixanteDix">La soixante-dizaine et plus</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wider font-sans font-bold text-stone-400 dark:text-stone-500 block">
                Point d'ancrage principal
              </label>
              <input
                type="text"
                value={profileFocusArea}
                onChange={(e) => setProfileFocusArea(e.target.value)}
                placeholder="Ex: Santé & Bien-être, Projets Personnels..."
                className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl outline-none focus:ring-1 focus:ring-emerald-700 focus:border-emerald-700 text-stone-800 dark:text-stone-100 font-sans text-sm transition"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-stone-100 dark:border-stone-800">
              <div className="flex-1 flex items-center justify-center gap-2.5 px-5 py-3.5 bg-emerald-50/70 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl text-[#047857] dark:text-emerald-400 font-sans text-xs uppercase tracking-widest font-bold">
                <CheckCircle2 className="w-4 h-4" />
                Sauvegardé automatiquement !
              </div>
              <button
                onClick={handleResetProfile}
                className="flex-1 bg-white dark:bg-stone-800 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-400 py-3 px-6 rounded-xl font-sans text-xs uppercase tracking-widest font-bold hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Réinitialiser le profil
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 md:p-8 border border-stone-100 dark:border-stone-800 shadow-sm">
          <h3 className="text-lg font-bold font-sans uppercase tracking-widest text-stone-800 dark:text-stone-100 mb-2">Sauvegarde Manuelle</h3>
          <p className="text-stone-500 dark:text-stone-400 leading-relaxed mb-6 font-light">
            Tes données sont stockées uniquement sur cet appareil. Pense à télécharger une sauvegarde régulière pour ne rien perdre, ou pour transférer tes données vers un autre appareil.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleExport}
              className="flex-1 bg-stone-800 dark:bg-emerald-700 text-white flex items-center justify-center gap-3 px-6 py-4 rounded-xl hover:bg-stone-900 dark:hover:bg-emerald-800 transition-all font-sans font-bold uppercase tracking-widest text-xs"
            >
              <Download className="w-5 h-5" />
              Exporter mes données
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 bg-white dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 flex items-center justify-center gap-3 px-6 py-4 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-700 hover:border-stone-300 dark:hover:border-stone-600 transition-all font-sans font-bold uppercase tracking-widest text-xs"
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
            <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 rounded-xl flex items-center gap-3 text-sm font-bold font-sans">
              <CheckCircle2 className="w-5 h-5" />
              Sauvegarde importée avec succès !
            </div>
          )}

          {importStatus === 'error' && (
            <div className="mt-4 p-4 bg-rose-50 dark:bg-rose-500/10 text-rose-800 dark:text-rose-400 rounded-xl flex items-center gap-3 text-sm font-bold font-sans">
              <AlertCircle className="w-5 h-5" />
              Erreur lors de l'importation. Le fichier semble invalide.
            </div>
          )}

          {(backup1 || backup2) && (
            <div className="mt-8 pt-8 border-t border-stone-200 dark:border-stone-800">
               <h3 className="text-sm font-bold font-sans uppercase tracking-widest text-stone-800 dark:text-stone-100 mb-4">Restaurer une version précédente</h3>
               {backup1 && renderBackupInfo('Sauvegarde 1 (Récente)', backup1)}
               {backup2 && renderBackupInfo('Sauvegarde 2 (Ancienne)', backup2)}
            </div>
          )}
        </div>

        {/* THEME SECTION */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 md:p-8 border border-stone-100 dark:border-stone-800 shadow-sm">
          <h3 className="text-lg font-bold font-sans uppercase tracking-widest text-stone-800 dark:text-stone-100 mb-2 flex items-center gap-2">
            <Moon className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
            Apparence
          </h3>
          <p className="text-stone-500 dark:text-stone-400 leading-relaxed mb-6 font-light">
            Choisis l'apparence de l'application : claire, sombre, ou automatique selon l'heure de la journée (thème du soir).
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => onChangeThemeMode('light')}
              className={`flex-1 flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl font-sans text-xs uppercase tracking-widest font-bold border transition cursor-pointer ${
                themeMode === 'light'
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                  : 'bg-stone-50 dark:bg-stone-800 border-stone-100 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700'
              }`}
            >
              <Sun className="w-4 h-4" />
              Clair
            </button>
            <button
              onClick={() => onChangeThemeMode('dark')}
              className={`flex-1 flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl font-sans text-xs uppercase tracking-widest font-bold border transition cursor-pointer ${
                themeMode === 'dark'
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                  : 'bg-stone-50 dark:bg-stone-800 border-stone-100 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700'
              }`}
            >
              <Moon className="w-4 h-4" />
              Sombre
            </button>
            <button
              onClick={() => onChangeThemeMode('auto')}
              className={`flex-1 flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl font-sans text-xs uppercase tracking-widest font-bold border transition cursor-pointer ${
                themeMode === 'auto'
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                  : 'bg-stone-50 dark:bg-stone-800 border-stone-100 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700'
              }`}
            >
              <Clock className="w-4 h-4" />
              Automatique
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 md:p-8 border border-stone-100 dark:border-stone-800 shadow-sm">
          <h3 className="text-lg font-bold font-sans uppercase tracking-widest text-stone-800 dark:text-stone-100 mb-2">Rappels Bienveillants</h3>
          <p className="text-stone-500 dark:text-stone-400 leading-relaxed mb-6 font-light">
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
                <div className={`block w-14 h-8 rounded-full transition-colors ${reminderEnabled ? 'bg-emerald-500' : 'bg-stone-200 dark:bg-stone-700'}`}></div>
                <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${reminderEnabled ? 'transform translate-x-6' : ''}`}></div>
              </div>
              <span className="font-sans font-bold text-stone-700 dark:text-stone-300">Activer les rappels quotidiens</span>
            </label>

            {reminderEnabled && (
              <div className="flex items-center gap-3 bg-stone-50 dark:bg-stone-800 p-4 rounded-xl border border-stone-100 dark:border-stone-700">
                <label htmlFor="reminderTime" className="font-sans font-medium text-stone-600 dark:text-stone-300 text-sm">Me rappeler à</label>
                <input
                  type="time"
                  id="reminderTime"
                  value={reminderTime}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  className="bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 text-stone-800 dark:text-stone-100 px-3 py-2 rounded-lg font-sans text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>
            )}

            {reminderEnabled && (
              <div className="flex items-start gap-2.5 text-xs text-stone-500 dark:text-stone-400 font-sans bg-stone-50/60 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-700 rounded-xl p-3.5 leading-relaxed">
                <Info className="w-4 h-4 text-stone-400 dark:text-stone-500 shrink-0 mt-0.5" />
                <span>
                  Pour des raisons techniques, ce rappel ne s'affiche que si l'application a été ouverte au moins une fois récemment et reste en arrière-plan. Si tu fermes complètement l'application, la notification du jour peut ne pas apparaître.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
