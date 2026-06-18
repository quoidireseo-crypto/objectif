import { useState } from 'react';
import { Sparkles, Mountain, Compass as CompassIcon, X } from 'lucide-react';

interface WeeklyReviewScreenProps {
  onComplete: (input: { win: string; challenge: string; intention: string }) => void;
  onClose: () => void;
}

export function WeeklyReviewScreen({ onComplete, onClose }: WeeklyReviewScreenProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [win, setWin] = useState('');
  const [challenge, setChallenge] = useState('');
  const [intention, setIntention] = useState('');

  return (
    <div className="fixed inset-0 z-50 bg-[#F5F5F0] dark:bg-stone-950 flex flex-col items-center justify-between p-8 md:p-12 animate-in fade-in duration-700 overflow-y-auto">
      <div className="w-full max-w-2xl flex items-center justify-between mt-4 shrink-0">
        <div className="flex flex-col items-center gap-2 flex-1">
          <CompassIcon className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          <span className="font-sans text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-medium">Bilan hebdomadaire guidé</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="absolute right-8 top-8 text-stone-300 dark:text-stone-600 hover:text-stone-600 dark:hover:text-stone-300 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="w-full max-w-2xl flex flex-col items-center gap-6 mt-2 select-none shrink-0">
        <div className="flex gap-2.5 items-center">
          <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${step > 1 ? 'bg-emerald-500' : step === 1 ? 'bg-stone-300 dark:bg-stone-600' : 'bg-stone-100 dark:bg-stone-800'}`} />
          <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${step > 2 ? 'bg-emerald-500' : step === 2 ? 'bg-stone-300 dark:bg-stone-600' : 'bg-stone-100 dark:bg-stone-800'}`} />
          <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${step === 3 ? 'bg-stone-300 dark:bg-stone-600' : 'bg-stone-100 dark:bg-stone-800'}`} />
        </div>
      </div>

      <div className="w-full max-w-2xl flex-1 flex flex-col items-center justify-center my-8 text-center px-4">
        {step === 1 && (
          <div className="space-y-8 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2">
              <Sparkles className="w-7 h-7 text-amber-500 mx-auto mb-2" />
              <h2 className="text-xl md:text-2xl font-serif text-stone-800 dark:text-stone-200">Quelle a été ta plus grande réussite cette semaine ?</h2>
              <p className="italic text-stone-400 dark:text-stone-500 font-serif font-light text-sm max-w-md mx-auto">
                Même modeste. Ce qui compte, c'est que tu en sois fier(e).
              </p>
            </div>
            <div className="flex flex-col items-center gap-5 w-full">
              <textarea
                className="w-full max-w-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-2xl px-6 py-4 text-base font-serif font-light text-stone-800 dark:text-stone-100 outline-none focus:ring-1 focus:ring-emerald-600 placeholder-stone-300 dark:placeholder-stone-600 text-center shadow-sm min-h-[100px] resize-y"
                placeholder="Ce que je retiens de bon cette semaine..."
                value={win}
                onChange={(e) => setWin(e.target.value)}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!win.trim()}
                className="bg-stone-800 dark:bg-emerald-700 text-white px-8 py-3.5 rounded-xl font-sans text-xs uppercase tracking-widest font-bold transition disabled:opacity-30 disabled:cursor-not-allowed hover:bg-stone-900 dark:hover:bg-emerald-800 active:scale-95 shadow-sm"
              >
                Continuer →
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2">
              <Mountain className="w-7 h-7 text-stone-400 dark:text-stone-500 mx-auto mb-2" />
              <h2 className="text-xl md:text-2xl font-serif text-stone-800 dark:text-stone-200">Quelle a été ta plus grande difficulté ?</h2>
              <p className="italic text-stone-400 dark:text-stone-500 font-serif font-light text-sm max-w-md mx-auto">
                Sans jugement. Juste pour en prendre conscience.
              </p>
            </div>
            <div className="flex flex-col items-center gap-5 w-full">
              <textarea
                className="w-full max-w-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-2xl px-6 py-4 text-base font-serif font-light text-stone-800 dark:text-stone-100 outline-none focus:ring-1 focus:ring-emerald-600 placeholder-stone-300 dark:placeholder-stone-600 text-center shadow-sm min-h-[100px] resize-y"
                placeholder="Ce qui a été plus difficile..."
                value={challenge}
                onChange={(e) => setChallenge(e.target.value)}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={!challenge.trim()}
                className="bg-stone-800 dark:bg-emerald-700 text-white px-8 py-3.5 rounded-xl font-sans text-xs uppercase tracking-widest font-bold transition disabled:opacity-30 disabled:cursor-not-allowed hover:bg-stone-900 dark:hover:bg-emerald-800 active:scale-95 shadow-sm"
              >
                Continuer →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2">
              <CompassIcon className="w-7 h-7 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
              <h2 className="text-xl md:text-2xl font-serif text-stone-800 dark:text-stone-200">Qu'as-tu envie de garder en tête pour la semaine qui vient ?</h2>
              <p className="italic text-stone-400 dark:text-stone-500 font-serif font-light text-sm max-w-md mx-auto">
                Une direction simple à garder en tête.
              </p>
            </div>
            <div className="flex flex-col items-center gap-5 w-full">
              <textarea
                className="w-full max-w-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-2xl px-6 py-4 text-base font-serif font-light text-stone-800 dark:text-stone-100 outline-none focus:ring-1 focus:ring-emerald-600 placeholder-stone-300 dark:placeholder-stone-600 text-center shadow-sm min-h-[100px] resize-y"
                placeholder="Ce que je veux garder en tête la semaine prochaine..."
                value={intention}
                onChange={(e) => setIntention(e.target.value)}
                autoFocus
              />
              <button
                type="button"
                onClick={() => onComplete({ win, challenge, intention })}
                disabled={!intention.trim()}
                className="bg-emerald-700 text-white px-10 py-4 rounded-2xl font-sans text-sm uppercase tracking-widest font-bold hover:bg-emerald-800 transition shadow-sm active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Clore mon bilan de la semaine
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="w-full flex justify-center pb-4 select-none shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="text-stone-300 dark:text-stone-600 text-xs font-sans hover:text-stone-500 dark:hover:text-stone-400 transition tracking-widest uppercase font-medium"
        >
          Plus tard
        </button>
      </div>
    </div>
  );
}
