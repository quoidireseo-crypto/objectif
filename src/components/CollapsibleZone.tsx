import { ReactNode, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { HelpTooltip } from './HelpTooltip';
import { AccentKey, ACCENTS } from '../lib/accents';

interface CollapsibleZoneProps {
  title: string;
  help?: string;
  children: ReactNode;
  defaultOpenMobile?: boolean;
  accent?: AccentKey;
}

// Divulgation progressive : sur mobile, les zones de « recul » sont repliées par
// défaut (un écran = une intention). Sur desktop (md+), tout reste déployé.
export function CollapsibleZone({ title, help, children, defaultOpenMobile = false, accent }: CollapsibleZoneProps) {
  const [open, setOpen] = useState(defaultOpenMobile);
  const a = accent ? ACCENTS[accent] : null;

  return (
    <section className="mb-2">
      {/* En-tête : bouton repliable sur mobile, simple titre + filet sur desktop */}
      <button
        onClick={() => setOpen(o => !o)}
        className="md:pointer-events-none w-full flex items-center gap-4 mb-5 mt-4 text-left"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2.5 shrink-0">
          {a && <span className={`h-5 w-1.5 rounded-full ${a.bar}`} />}
          <span className={`text-[12px] font-sans font-bold uppercase tracking-[0.2em] ${a ? a.text : 'text-stone-400 dark:text-stone-500'}`}>
            {title}
          </span>
          {help && <HelpTooltip text={help} />}
        </span>
        <span className={`hidden md:block h-px flex-1 ${a ? a.soft : 'bg-stone-200/70 dark:bg-stone-800'}`} />
        <ChevronDown
          className={`md:hidden w-5 h-5 transition-transform duration-300 ml-auto ${a ? a.text : 'text-stone-400 dark:text-stone-500'} ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Contenu : visible si ouvert (mobile) ; toujours visible en md+ */}
      <div className={`${open ? 'block' : 'hidden'} md:block`}>
        {children}
      </div>
    </section>
  );
}
