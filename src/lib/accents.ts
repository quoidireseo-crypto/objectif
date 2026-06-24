// Couleurs signature par vue, pour différencier nettement chaque page
// (direction « contraste éditorial »). Chaque accent fournit les classes utiles.
export type AccentKey = 'emerald' | 'amber' | 'teal' | 'blue' | 'rose' | 'indigo' | 'violet' | 'stone';

export interface Accent {
  bar: string;   // barre / pastille pleine
  text: string;  // texte d'accent (eyebrow, libellés)
  soft: string;  // fond doux teinté
  ring: string;  // bordure douce teintée
  grad: string;  // dégradé riche (bannières en relief)
  glow: string;  // halo coloré (profondeur)
}

export const ACCENTS: Record<AccentKey, Accent> = {
  emerald: { bar: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400', soft: 'bg-emerald-50 dark:bg-emerald-500/10', ring: 'border-emerald-200 dark:border-emerald-500/30', grad: 'from-emerald-500 via-emerald-600 to-teal-700', glow: 'bg-emerald-300/30' },
  amber:   { bar: 'bg-amber-500',   text: 'text-amber-700 dark:text-amber-400',   soft: 'bg-amber-50 dark:bg-amber-500/10',   ring: 'border-amber-200 dark:border-amber-500/30',   grad: 'from-amber-400 via-amber-500 to-orange-600', glow: 'bg-amber-300/30' },
  teal:    { bar: 'bg-teal-500',    text: 'text-teal-700 dark:text-teal-400',     soft: 'bg-teal-50 dark:bg-teal-500/10',     ring: 'border-teal-200 dark:border-teal-500/30',     grad: 'from-teal-400 via-teal-500 to-cyan-700',   glow: 'bg-teal-300/30' },
  blue:    { bar: 'bg-blue-500',    text: 'text-blue-700 dark:text-blue-400',     soft: 'bg-blue-50 dark:bg-blue-500/10',     ring: 'border-blue-200 dark:border-blue-500/30',     grad: 'from-blue-500 via-blue-600 to-indigo-700', glow: 'bg-blue-300/30' },
  rose:    { bar: 'bg-rose-500',    text: 'text-rose-700 dark:text-rose-400',     soft: 'bg-rose-50 dark:bg-rose-500/10',     ring: 'border-rose-200 dark:border-rose-500/30',     grad: 'from-rose-400 via-rose-500 to-pink-700',   glow: 'bg-rose-300/30' },
  indigo:  { bar: 'bg-indigo-500',  text: 'text-indigo-700 dark:text-indigo-400', soft: 'bg-indigo-50 dark:bg-indigo-500/10', ring: 'border-indigo-200 dark:border-indigo-500/30', grad: 'from-indigo-500 via-indigo-600 to-violet-700', glow: 'bg-indigo-300/30' },
  violet:  { bar: 'bg-violet-500',  text: 'text-violet-700 dark:text-violet-400', soft: 'bg-violet-50 dark:bg-violet-500/10', ring: 'border-violet-200 dark:border-violet-500/30', grad: 'from-violet-500 via-violet-600 to-purple-700', glow: 'bg-violet-300/30' },
  stone:   { bar: 'bg-stone-500',   text: 'text-stone-600 dark:text-stone-300',   soft: 'bg-stone-100 dark:bg-stone-800',     ring: 'border-stone-200 dark:border-stone-700',     grad: 'from-stone-600 via-stone-700 to-stone-800', glow: 'bg-stone-300/20' },
};
