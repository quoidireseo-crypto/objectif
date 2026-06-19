import { useState } from 'react';
import { BookOpen, ExternalLink, Lightbulb, ChevronDown, Sparkles } from 'lucide-react';
import { LifeDomain } from '../types';
import { getResourcesForDomain, Resource } from '../lib/resources';

interface GoalResourcesPanelProps {
  domain: LifeDomain;
}

// Petite icône selon le type de ressource.
function ResourceIcon({ type }: { type: Resource['type'] }) {
  if (type === 'book') return <BookOpen className="w-4 h-4 shrink-0" />;
  if (type === 'link') return <ExternalLink className="w-4 h-4 shrink-0" />;
  return <Lightbulb className="w-4 h-4 shrink-0" />;
}

// Panneau « Pour aller plus loin » : suggestions de livres, liens et conseils
// rattachés au domaine de l'objectif. Replié par défaut pour ne pas alourdir la
// fiche — l'utilisateur l'ouvre quand il cherche de l'inspiration.
export function GoalResourcesPanel({ domain }: GoalResourcesPanelProps) {
  const [open, setOpen] = useState(false);
  const resources = getResourcesForDomain(domain);

  if (resources.length === 0) return null;

  return (
    <div className="mt-5 border-t border-stone-100/50 dark:border-stone-800 pt-4">
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="w-full flex items-center gap-2 text-left group/res"
      >
        <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        <span className="text-[10px] font-sans font-bold text-stone-500 dark:text-stone-400 uppercase tracking-widest">
          Pour aller plus loin
        </span>
        <ChevronDown
          className={`w-4 h-4 text-stone-400 dark:text-stone-500 transition-transform duration-300 ml-auto ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <ul className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-1 duration-300">
          {resources.map((r, i) => {
            const content = (
              <span className="flex items-start gap-2.5">
                <span className="mt-0.5 text-emerald-600 dark:text-emerald-400">
                  <ResourceIcon type={r.type} />
                </span>
                <span className="flex-1">
                  <span className="text-sm font-sans text-stone-700 dark:text-stone-200 leading-snug">
                    {r.title}
                    {r.author && (
                      <span className="text-stone-400 dark:text-stone-500"> — {r.author}</span>
                    )}
                    {r.type === 'link' && (
                      <ExternalLink className="inline-block w-3 h-3 ml-1 -mt-0.5 text-stone-400 dark:text-stone-500" />
                    )}
                  </span>
                  {r.description && (
                    <span className="block text-xs text-stone-500 dark:text-stone-400 italic mt-0.5 leading-snug">
                      {r.description}
                    </span>
                  )}
                </span>
              </span>
            );

            return (
              <li key={i}>
                {r.url ? (
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-xl px-2 py-1 -mx-2 hover:bg-stone-50 dark:hover:bg-stone-800/60 transition-colors"
                  >
                    {content}
                  </a>
                ) : (
                  <div className="px-2 py-1 -mx-2">{content}</div>
                )}
              </li>
            );
          })}
          <li className="pt-1">
            <p className="text-[10px] text-stone-400 dark:text-stone-500 italic leading-snug">
              Suggestions générales selon le domaine. À prendre ou à laisser. 🌱
            </p>
          </li>
        </ul>
      )}
    </div>
  );
}
