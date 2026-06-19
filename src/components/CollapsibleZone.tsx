import { ReactNode, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { HelpTooltip } from './HelpTooltip';

interface CollapsibleZoneProps {
  title: string;
  help?: string;
  children: ReactNode;
  defaultOpenMobile?: boolean;
}

// Divulgation progressive : sur mobile, les zones de « recul » sont repliées par
// défaut (un écran = une intention). Sur desktop (md+), tout reste déployé.
export function CollapsibleZone({ title, help, children, defaultOpenMobile = false }: CollapsibleZoneProps) {
  const [open, setOpen] = useState(defaultOpenMobile);

  return (
    <section className="mb-2">
      {/* En-tête : bouton repliable sur mobile, simple titre + filet sur desktop */}
      <button
        onClick={() => setOpen(o => !o)}
        className="md:pointer-events-none w-full flex items-center gap-4 mb-5 mt-4 text-left"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-sans font-bold uppercase tracking-[0.22em] text-stone-400 dark:text-stone-500">
            {title}
          </span>
          {help && <HelpTooltip text={help} />}
        </span>
        <span className="hidden md:block h-px flex-1 bg-stone-200/70 dark:bg-stone-800" />
        <ChevronDown
          className={`md:hidden w-5 h-5 text-stone-400 dark:text-stone-500 transition-transform duration-300 ml-auto ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Contenu : visible si ouvert (mobile) ; toujours visible en md+ */}
      <div className={`${open ? 'block' : 'hidden'} md:block`}>
        {children}
      </div>
    </section>
  );
}
