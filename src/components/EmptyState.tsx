import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string; // à quoi sert cette section
  hint?: string; // la chose à faire / comment ça se relie au reste
}

// État vide « pédagogique » : au lieu d'un simple « rien ici », on explique à quoi
// sert la section et la prochaine chose à faire. Aide l'utilisateur à comprendre
// la logique de l'app en explorant.
export function EmptyState({ icon: Icon, title, description, hint }: EmptyStateProps) {
  return (
    <div className="text-center py-14 px-6 bg-[#EAE7E2] dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800">
      <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-white/70 dark:bg-stone-800 flex items-center justify-center">
        <Icon className="w-7 h-7 text-stone-400 dark:text-stone-500" />
      </div>
      <p className="text-stone-700 dark:text-stone-200 font-sans font-bold">{title}</p>
      <p className="text-stone-500 dark:text-stone-400 text-sm mt-1.5 max-w-sm mx-auto leading-relaxed">
        {description}
      </p>
      {hint && (
        <p className="text-stone-400 dark:text-stone-500 text-xs italic mt-3 max-w-sm mx-auto leading-relaxed">
          {hint}
        </p>
      )}
    </div>
  );
}
