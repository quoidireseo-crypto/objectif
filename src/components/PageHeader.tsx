import { ReactNode } from 'react';
import { AccentKey, ACCENTS } from '../lib/accents';
import { HelpTooltip } from './HelpTooltip';

interface PageHeaderProps {
  eyebrow: string; // petit sur-titre coloré (identité de la page)
  title: string;
  subtitle?: string;
  accent: AccentKey;
  help?: string;
  children?: ReactNode; // action(s) à droite (bouton, sélecteur…)
}

// En-tête éditorial : grand titre + barre d'accent colorée + eyebrow. Donne à
// chaque page une identité visuelle forte et différenciée.
export function PageHeader({ eyebrow, title, subtitle, accent, help, children }: PageHeaderProps) {
  const a = ACCENTS[accent];
  return (
    <header className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8 border-b border-stone-200 dark:border-stone-800 pb-6">
      <div className="min-w-0">
        <div className="flex items-center gap-2.5 mb-2.5">
          <span className={`h-6 w-1.5 rounded-full ${a.bar}`} />
          <span className={`text-[11px] font-sans font-bold uppercase tracking-[0.2em] ${a.text}`}>{eyebrow}</span>
        </div>
        <div className="flex items-center gap-2">
          <h2 className="text-4xl md:text-5xl font-light tracking-tight text-stone-900 dark:text-stone-100 leading-none">{title}</h2>
          {help && <HelpTooltip text={help} />}
        </div>
        {subtitle && (
          <p className="text-stone-500 dark:text-stone-400 font-sans text-sm mt-3 italic">{subtitle}</p>
        )}
      </div>
      {children && <div className="shrink-0 w-full sm:w-auto">{children}</div>}
    </header>
  );
}
