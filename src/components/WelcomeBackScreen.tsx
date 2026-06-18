import { useState, FormEvent } from 'react';
import { SkoposLogo } from './SkoposLogo';
import { Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface WelcomeBackScreenProps {
  name?: string;
  hasPassword: boolean;
  onUnlock: (password: string) => Promise<boolean>;
}

export function WelcomeBackScreen({ name, hasPassword, onUnlock }: WelcomeBackScreenProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(false);
    const ok = await onUnlock(hasPassword ? password : '');
    if (!ok) {
      setError(true);
      setPassword('');
    }
    setBusy(false);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] dark:bg-stone-950 flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden font-serif selection:bg-emerald-200 selection:text-emerald-900">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-100/40 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-100/40 dark:bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="w-full max-w-md bg-white dark:bg-stone-900 border border-stone-200/50 dark:border-stone-800 rounded-3xl p-8 md:p-10 shadow-md relative z-10"
      >
        <div className="flex flex-col items-center text-center mb-8">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl mb-4 text-[#047857] dark:text-emerald-400">
            <SkoposLogo size={34} />
          </div>
          <h1 className="text-2xl font-sans tracking-widest font-bold text-stone-900 dark:text-stone-100">
            SKOPOS
          </h1>
          <p className="text-xs text-[#047857] dark:text-emerald-400 uppercase tracking-widest font-sans font-bold mt-1">
            Garder en vue ce qui compte
          </p>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-xl font-light text-stone-800 dark:text-stone-100">
            Bon retour{name ? <>, <span className="font-serif italic text-[#047857] dark:text-emerald-400">{name}</span></> : ''}.
          </h2>
          <p className="text-stone-500 dark:text-stone-400 font-sans text-xs md:text-sm mt-2">
            {hasPassword
              ? 'Saisis ton mot de passe pour retrouver ton espace.'
              : 'Ton espace t’attend, reprends quand tu veux.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {hasPassword && (
            <div className="space-y-1">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(false); }}
                  placeholder="Mot de passe"
                  className="w-full pl-11 pr-4 py-3.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl outline-none focus:ring-1 focus:ring-[#047857] focus:border-[#047857] text-stone-800 dark:text-stone-100 font-sans text-sm transition placeholder-stone-400 dark:placeholder-stone-500"
                  autoFocus
                />
              </div>
              {error && (
                <p className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-sans pl-1 pt-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Mot de passe incorrect. Réessaie.
                </p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={busy || (hasPassword && !password.trim())}
            className="w-full bg-[#047857] dark:bg-emerald-700 text-white py-3.5 px-6 rounded-2xl font-sans text-xs uppercase tracking-widest font-bold hover:bg-[#059669] dark:hover:bg-emerald-800 active:scale-98 disabled:opacity-45 disabled:hover:bg-[#047857] transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            {hasPassword ? 'Déverrouiller' : 'Reprendre'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-[10px] text-stone-400 dark:text-stone-500 mt-8 font-sans leading-relaxed">
          🔒 Tes données restent stockées localement sur cet appareil.
        </p>
      </motion.div>
    </div>
  );
}
