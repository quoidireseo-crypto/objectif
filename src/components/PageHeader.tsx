import { ReactNode } from 'react';
import { AccentKey, ACCENTS } from '../lib/accents';
import { HelpTooltip } from './HelpTooltip';

interface PageHeaderProps {
  eyebrow: string; // petit sur-titre (identité de la page)
  title: string;
  subtitle?: string;
  accent: AccentKey;
  help?: string;
  children?: ReactNode; // action(s) à droite (bouton, sélecteur…)
}

// En-tête en relief : bannière colorée en dégradé, ombre portée et halos diffus —
// chaque page a une identité visuelle forte et un vrai volume.
export function PageHeader({ eyebrow, title, subtitle, accent, help, children }: PageHeaderProps) {
  const a = ACCENTS[accent];
  return (
    <header className={`relative overflow-hidden rounded-3xl p-6 md:p-8 mb-8 shadow-xl bg-gradient-to-br ${a.grad} text-white`}>
      {/* Halos diffus pour la profondeur */}
      <div className={`absolute -top-16 -right-10 w-56 h-56 ${a.glow} rounded-full blur-3xl pointer-events-none`} />
      <div className="absolute -bottom-20 -left-10 w-56 h-56 bg-black/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 mb-2">
            <span className="h-5 w-1.5 rounded-full bg-white/70" />
            <span className="text-[11px] font-sans font-bold uppercase tracking-[0.2em] text-white/80">{eyebrow}</span>
          </div>
          <div className="flex items-center gap-2">
            <h2 className="text-4xl md:text-5xl font-light tracking-tight text-white leading-none drop-shadow-sm">{title}</h2>
            {help && <HelpTooltip text={help} />}
          </div>
          {subtitle && (
            <p className="text-white/85 font-sans text-sm mt-3 italic">{subtitle}</p>
          )}
        </div>
        {children && <div className="shrink-0 w-full sm:w-auto">{children}</div>}
      </div>
    </header>
  );
}
