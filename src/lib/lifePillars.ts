import { Activity, Target, Heart, Briefcase, Coins, Sparkles, LucideIcon } from 'lucide-react';
import { LifeDomain } from '../types';

export interface PillarMeta {
  domain: LifeDomain;
  short: string; // courte description du pilier
  icon: LucideIcon;
  bar: string; // couleur de remplissage des segments
  text: string; // accent texte / icône
  soft: string; // fond doux pour la pastille d'icône
}

// Les 6 piliers de vie évaluables dans la « roue de la vie ».
// On exclut volontairement « Autre », qui n'est pas un pilier à part entière.
export const LIFE_PILLARS: PillarMeta[] = [
  { domain: 'Santé & Bien-être', short: 'Corps, esprit, énergie', icon: Activity, bar: 'bg-amber-400', text: 'text-amber-600 dark:text-amber-400', soft: 'bg-amber-50 dark:bg-amber-500/10' },
  { domain: 'Projet Personnel', short: 'Rêves et créations', icon: Target, bar: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', soft: 'bg-emerald-50 dark:bg-emerald-500/10' },
  { domain: 'Relations & Famille', short: 'Liens et proches', icon: Heart, bar: 'bg-rose-400', text: 'text-rose-600 dark:text-rose-400', soft: 'bg-rose-50 dark:bg-rose-500/10' },
  { domain: 'Apprentissage', short: 'Curiosité et savoir', icon: Briefcase, bar: 'bg-blue-400', text: 'text-blue-600 dark:text-blue-400', soft: 'bg-blue-50 dark:bg-blue-500/10' },
  { domain: 'Finances', short: 'Sérénité matérielle', icon: Coins, bar: 'bg-teal-500', text: 'text-teal-600 dark:text-teal-400', soft: 'bg-teal-50 dark:bg-teal-500/10' },
  { domain: 'Spiritualité', short: 'Sens et intériorité', icon: Sparkles, bar: 'bg-indigo-400', text: 'text-indigo-600 dark:text-indigo-400', soft: 'bg-indigo-50 dark:bg-indigo-500/10' },
];
