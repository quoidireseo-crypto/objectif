import { useRef, useState } from 'react';
import { AppData } from '../types';
import { Download, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';

interface SettingsProps {
  data: AppData;
  onImportData: (data: AppData) => void;
}

export function SettingsView({ data, onImportData }: SettingsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleExport = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `boussole-sauvegarde-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
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
        </div>
      </div>
    </div>
  );
}
