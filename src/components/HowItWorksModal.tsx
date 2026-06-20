import { X, Target, ListChecks, CheckCircle2, Moon, ArrowRight } from 'lucide-react';
import { SkoposLogo } from './SkoposLogo';

interface HowItWorksModalProps {
  open: boolean;
  onClose: () => void;
}

const STEPS = [
  {
    icon: Target,
    title: '1 · Un objectif',
    desc: "Ce qui compte vraiment pour toi, et pourquoi. C'est ta direction.",
    color: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10',
  },
  {
    icon: ListChecks,
    title: '2 · Des étapes',
    desc: "Découpe ton objectif en quelques petits jalons atteignables.",
    color: 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10',
  },
  {
    icon: CheckCircle2,
    title: '3 · Des actions au quotidien',
    desc: "Un petit pas à la fois, à ton rythme. C'est l'avancée concrète.",
    color: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10',
  },
  {
    icon: Moon,
    title: '4 · Un bilan',
    desc: "Garde tes bons moments, prends du recul, et ajuste ta direction.",
    color: 'text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10',
  },
];

// Guide « Comment ça marche ? » — ré-ouvrable à tout moment depuis l'en-tête ou
// la barre latérale. Explique en un coup d'œil la logique de SKOPOS.
export function HowItWorksModal({ open, onClose }: HowItWorksModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-stone-900/50 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-white dark:bg-stone-900 rounded-t-3xl sm:rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl p-6 md:p-8 max-h-[90dvh] overflow-y-auto animate-in slide-in-from-bottom sm:zoom-in-95 duration-300"
      >
        <button
          onClick={onClose}
          aria-label="Fermer"
          className="absolute top-5 right-5 p-1.5 rounded-full text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-2">
          <SkoposLogo className="text-[#047857] dark:text-emerald-400 shrink-0" size={24} />
          <h2 className="text-xl font-light text-stone-900 dark:text-stone-100">Comment ça marche ?</h2>
        </div>
        <p className="text-sm text-stone-500 dark:text-stone-400 font-sans leading-relaxed mb-6">
          SKOPOS t'aide à traduire ce qui compte pour toi en petites actions simples. La logique tient en quatre temps :
        </p>

        <div className="space-y-3">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="flex items-start gap-3.5 bg-stone-50/70 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800 rounded-2xl p-4"
              >
                <div className={`p-2.5 rounded-xl shrink-0 ${step.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-sans font-bold text-stone-800 dark:text-stone-100">{step.title}</h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 font-sans leading-relaxed mt-0.5">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-stone-400 dark:text-stone-500 font-sans italic text-center mt-6 leading-relaxed">
          Avance à ton rythme, un jour après l'autre. Tu peux rouvrir ce guide à tout moment.
        </p>

        <button
          onClick={onClose}
          className="w-full mt-5 bg-stone-800 dark:bg-emerald-700 text-white py-3.5 rounded-2xl font-sans text-xs uppercase tracking-widest font-bold hover:bg-stone-900 dark:hover:bg-emerald-800 transition flex items-center justify-center gap-2 cursor-pointer"
        >
          J'ai compris
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
