import { useMemo, useState } from 'react';
import { AppData, ViewType } from '../types';
import { getHolisticSignal, ReminderTone } from '../lib/holisticReminder';
import { Leaf, Sparkles, Sunrise, AlertTriangle, ArrowRight, X } from 'lucide-react';

interface DailyWordBannerProps {
  data: AppData;
  onChangeView: (view: ViewType) => void;
}

const DISMISS_KEY = 'skopos_daily_word_dismissed';

// Le poste de commande affiche déjà les actions du jour : inutile de le répéter
// en bandeau. On garde le bandeau pour les éclairages moins évidents.
const SUPPRESSED_IDS = ['today-actions'];

const TONE: Record<ReminderTone, { icon: typeof Leaf; wrap: string; chip: string; accent: string }> = {
  calm: {
    icon: Leaf,
    wrap: 'bg-indigo-50/60 dark:bg-indigo-500/5 border-indigo-100 dark:border-indigo-500/20',
    chip: 'bg-indigo-100 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400',
    accent: 'text-indigo-700 dark:text-indigo-400',
  },
  encourage: {
    icon: Sunrise,
    wrap: 'bg-emerald-50/60 dark:bg-emerald-500/5 border-emerald-100 dark:border-emerald-500/20',
    chip: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    accent: 'text-emerald-700 dark:text-emerald-400',
  },
  celebrate: {
    icon: Sparkles,
    wrap: 'bg-emerald-50/60 dark:bg-emerald-500/5 border-emerald-100 dark:border-emerald-500/20',
    chip: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    accent: 'text-emerald-700 dark:text-emerald-400',
  },
  caution: {
    icon: AlertTriangle,
    wrap: 'bg-amber-50/60 dark:bg-amber-500/5 border-amber-100 dark:border-amber-500/20',
    chip: 'bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400',
    accent: 'text-amber-700 dark:text-amber-400',
  },
};

export function DailyWordBanner({ data, onChangeView }: DailyWordBannerProps) {
  const today = new Date().toISOString().split('T')[0];
  const [dismissed, setDismissed] = useState(
    () => window.localStorage.getItem(DISMISS_KEY) === today
  );

  const signal = useMemo(() => getHolisticSignal(data), [data]);

  if (dismissed || !signal || SUPPRESSED_IDS.includes(signal.id)) return null;

  const tone = TONE[signal.tone];
  const Icon = tone.icon;

  const handleDismiss = () => {
    window.localStorage.setItem(DISMISS_KEY, today);
    setDismissed(true);
  };

  return (
    <div className={`flex items-start gap-3 rounded-3xl border px-5 py-4 mb-6 ${tone.wrap} animate-in fade-in slide-in-from-top-2 duration-500`}>
      <div className={`p-2 rounded-xl shrink-0 ${tone.chip}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-widest font-sans font-bold text-stone-400 dark:text-stone-500 mb-0.5">
          Le mot du jour
        </p>
        <p className="text-sm font-serif italic text-stone-700 dark:text-stone-200 leading-relaxed">
          {signal.message}
        </p>
        {signal.cta && (
          <button
            onClick={() => onChangeView(signal.cta!.view)}
            className={`mt-2 inline-flex items-center gap-1.5 text-xs font-sans font-bold hover:underline ${tone.accent}`}
          >
            {signal.cta.label}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <button
        onClick={handleDismiss}
        aria-label="Masquer"
        className="p-1 rounded-full text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-white/50 dark:hover:bg-stone-800/50 transition shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
