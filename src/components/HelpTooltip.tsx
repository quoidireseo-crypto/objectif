import { useState, useRef, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';

interface HelpTooltipProps {
  text: string;
  label?: string;
}

// Petite bulle d'aide « ? » — fonctionne au survol (desktop) et au clic (mobile)
export function HelpTooltip({ text, label = 'En savoir plus' }: HelpTooltipProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  return (
    <span ref={ref} className="relative inline-flex align-middle group">
      <button
        type="button"
        aria-label={label}
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        className="text-stone-300 dark:text-stone-600 hover:text-stone-500 dark:hover:text-stone-400 transition cursor-pointer"
      >
        <HelpCircle className="w-4 h-4" />
      </button>
      <span
        className={`absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 w-60 max-w-[75vw] bg-stone-900 dark:bg-stone-700 text-stone-100 text-xs font-sans font-normal leading-relaxed normal-case tracking-normal p-3 rounded-xl shadow-lg pointer-events-none transition-opacity duration-150 ${
          open ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
      >
        {text}
      </span>
    </span>
  );
}
