import { useState, useEffect, useRef } from 'react';
import { X, Plus, Flag, ArrowRight } from 'lucide-react';

interface QuickCaptureSheetProps {
  open: boolean;
  onClose: () => void;
  onAdd: (text: string) => void;
  onNewGoal: () => void;
}

// Capture universelle : le geste le plus fréquent d'une app d'objectifs.
// Une pensée, une action — on l'attrape en deux secondes, sans naviguer.
export function QuickCaptureSheet({ open, onClose, onAdd, onNewGoal }: QuickCaptureSheetProps) {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (open) {
      setText('');
      // Laisse le temps à la feuille de s'ouvrir avant de focaliser.
      const t = setTimeout(() => inputRef.current?.focus(), 250);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!open) return null;

  const submit = () => {
    const value = text.trim();
    if (!value) return;
    onAdd(value);
    setText('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-stone-900/50 dark:bg-black/60 backdrop-blur-sm cursor-pointer" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-[#F5F5F0] dark:bg-stone-900 rounded-t-[2.5rem] border-t border-stone-200 dark:border-stone-800 p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-2xl z-10 animate-in slide-in-from-bottom duration-300">
        <div className="w-12 h-1 bg-stone-300 dark:bg-stone-700 rounded-full mx-auto mb-5" />

        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-sans font-bold text-stone-800 dark:text-stone-100">Capturer une pensée</h3>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="p-2 rounded-full bg-stone-200/60 dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 active:scale-95 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit();
          }}
          rows={3}
          placeholder="Une action, une idée, un rappel…"
          className="w-full px-4 py-3.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 text-stone-800 dark:text-stone-100 font-sans text-base resize-none transition placeholder-stone-400 dark:placeholder-stone-500"
        />

        <button
          onClick={submit}
          disabled={text.trim().length === 0}
          className="w-full mt-4 flex items-center justify-center gap-2 bg-[#047857] dark:bg-emerald-700 text-[#FFFBEB] py-3.5 rounded-2xl font-sans text-xs uppercase tracking-widest font-bold hover:bg-[#059669] dark:hover:bg-emerald-800 active:scale-98 disabled:opacity-45 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Ajouter à ma boîte de réception
        </button>

        <button
          onClick={() => { onClose(); onNewGoal(); }}
          className="w-full mt-3 flex items-center justify-center gap-2 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white/60 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-sans text-xs uppercase tracking-widest font-bold hover:bg-white dark:hover:bg-stone-700 active:scale-98 transition cursor-pointer"
        >
          <Flag className="w-3.5 h-3.5" />
          Plutôt un nouvel objectif
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
