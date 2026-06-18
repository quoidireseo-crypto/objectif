import { useState } from 'react';
import { SkoposLogo } from '../components/SkoposLogo';
import { ArrowRight, User, Compass, Sparkles, Target, BookmarkCheck } from 'lucide-react';
import { motion } from 'motion/react';

interface LandingViewProps {
  onComplete: (profile: { name: string; ageGroup?: string; focusArea?: string }) => void;
}

export function LandingView({ onComplete }: LandingViewProps) {
  const [name, setName] = useState('');
  const [ageGroup, setAgeGroup] = useState('');
  const [focusArea, setFocusArea] = useState('');
  const [step, setStep] = useState(1);

  const focusOptions = [
    { id: 'Sante', label: 'Santé & Bien-être', desc: 'Prendre soin de son corps, de son esprit et de son énergie.' },
    { id: 'Projet', label: 'Projets Personnels', desc: 'Concrétiser un rêve, une passion ou une nouvelle activité.' },
    { id: 'Relations', label: 'Relations & Famille', desc: 'Consolider les liens essentiels avec ses proches.' },
    { id: 'Apprentissage', label: 'Nouveaux Apprentissages', desc: 'Nourrir sa curiosité et apprendre de nouvelles choses.' },
  ];

  const handleNext = () => {
    if (step === 1 && name.trim().length >= 2) {
      setStep(2);
    } else if (step === 2) {
      // Complete profile and save
      onComplete({
        name: name.trim(),
        ageGroup: ageGroup || undefined,
        focusArea: focusArea || undefined,
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] dark:bg-stone-950 flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden font-serif selection:bg-emerald-200 selection:text-emerald-900">

      {/* Soft ethereal ambient background lights */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-100/40 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-100/40 dark:bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-xl bg-white dark:bg-stone-900 border border-stone-200/50 dark:border-stone-800 rounded-3xl p-8 md:p-12 shadow-md relative z-10"
      >
        {/* LOGO & TITLE */}
        <div className="flex flex-col items-center text-center mb-8">
          <motion.div
            initial={{ scale: 0.9, rotate: -5 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 100 }}
            className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl mb-4 text-[#047857] dark:text-emerald-400"
          >
            <SkoposLogo size={36} />
          </motion.div>

          <h1 className="text-3xl font-sans tracking-widest font-bold text-stone-900 dark:text-stone-100">
            SKOPOS
          </h1>
          <p className="text-xs text-[#047857] dark:text-emerald-400 uppercase tracking-widest font-sans font-bold mt-1">
            Chaque jour son nouveau départ
          </p>
          <p className="text-[11px] text-stone-400 dark:text-stone-500 font-serif italic mt-2">
            Garder en vue ce qui compte.
          </p>
        </div>

        {/* STEP 1: WELCOME & IDENTITY */}
        {step === 1 ? (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <h2 className="text-xl md:text-2xl font-light text-stone-800 dark:text-stone-100 leading-snug">
                Donnez une direction à votre quotidien.
              </h2>
              <p className="text-stone-500 dark:text-stone-400 font-sans text-xs md:text-sm leading-relaxed max-w-md mx-auto">
                Skopos vous aide à transformer ce qui compte pour vous en petits gestes concrets, jour après jour et à votre rythme.
              </p>
            </div>

            {/* Les trois temps de SKOPOS */}
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { icon: Target, label: 'Mes objectifs', desc: 'Ce qui compte' },
                { icon: BookmarkCheck, label: 'Agir au quotidien', desc: 'À mon rythme' },
                { icon: Sparkles, label: 'Faire le point', desc: 'Mes réussites' },
              ].map((pillar) => {
                const Icon = pillar.icon;
                return (
                  <div key={pillar.label} className="flex flex-col items-center text-center gap-1.5 bg-stone-50/70 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-700/60 rounded-2xl px-2 py-3.5">
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-[#047857] dark:text-emerald-400 rounded-xl">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-sans font-bold text-stone-700 dark:text-stone-200 leading-tight">{pillar.label}</span>
                    <span className="text-[9px] font-sans text-stone-400 dark:text-stone-500 uppercase tracking-wider">{pillar.desc}</span>
                  </div>
                );
              })}
            </div>

            <div className="space-y-4 pt-4 border-t border-stone-100 dark:border-stone-800">
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wider font-sans font-bold text-stone-400 dark:text-stone-500 block">
                  Quel est votre prénom ?
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Claire, Robert, Marc..."
                    className="w-full pl-11 pr-4 py-3.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl outline-none focus:ring-1 focus:ring-[#047857] focus:border-[#047857] text-stone-800 dark:text-stone-100 font-sans text-sm transition placeholder-stone-400 dark:placeholder-stone-500"
                    maxLength={20}
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wider font-sans font-bold text-stone-400 dark:text-stone-500 block">
                  Tranche de vie / Décennie (Optionnel)
                </label>
                <select
                  value={ageGroup}
                  onChange={(e) => setAgeGroup(e.target.value)}
                  className="w-full px-4 py-3.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl outline-none focus:ring-1 focus:ring-[#047857] focus:border-[#047857] text-stone-700 dark:text-stone-300 font-sans text-sm transition cursor-pointer appearance-none"
                >
                  <option value="">Sélectionner (ou laisser vide)...</option>
                  <option value="Trente">La trentaine — Consolider mes bases</option>
                  <option value="Quarante">La quarantaine — Vivre pleinement</option>
                  <option value="Cinquante">La cinquantaine — Nouveaux horizons</option>
                  <option value="Soixante">La soixantaine — Un nouveau chapitre</option>
                  <option value="SoixanteDix">La soixante-dizaine et plus — Transmettre et profiter</option>
                  <option value="Autre">Autre – Évolution personnelle</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleNext}
              disabled={name.trim().length < 2}
              className="w-full mt-6 bg-[#047857] text-amber-100 py-4 px-6 rounded-2xl font-sans text-xs uppercase tracking-widest font-bold hover:bg-[#059669] active:scale-98 disabled:opacity-45 disabled:hover:bg-[#047857] transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              Suivant
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        ) : (
          /* STEP 2: MOTIVATION / ANCHOR */
          <motion.div 
            key="step2"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <h2 className="text-xl md:text-2xl font-light text-stone-800 dark:text-stone-100 leading-snug">
                Ravi de faire votre connaissance, {name}.
              </h2>
              <p className="text-stone-500 dark:text-stone-400 font-sans text-xs md:text-sm leading-relaxed max-w-sm mx-auto">
                Qu'est-ce qui compte le plus pour vous en ce moment ? Cela nous aidera à personnaliser votre tableau de bord.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 max-h-[280px] overflow-y-auto pr-1">
              {focusOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setFocusArea(opt.label)}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex gap-3.5 ${
                    focusArea === opt.label
                      ? 'bg-[#FFFBEB] dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/30 shadow-sm'
                      : 'bg-stone-50/50 dark:bg-stone-800/50 hover:bg-stone-50 dark:hover:bg-stone-800 border-stone-200/60 dark:border-stone-700/60'
                  }`}
                >
                  <div className={`p-2 rounded-xl border shrink-0 ${
                    focusArea === opt.label ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-500/20' : 'bg-white dark:bg-stone-900 text-stone-400 dark:text-stone-500 border-stone-200/60 dark:border-stone-700/60'
                  }`}>
                    <Compass className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-sans font-bold text-stone-800 dark:text-stone-100">{opt.label}</h4>
                    <p className="text-[11px] font-sans text-stone-500 dark:text-stone-400 leading-normal mt-0.5">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-3 pt-4 border-t border-stone-100 dark:border-stone-800">
              <button
                onClick={() => setStep(1)}
                className="flex-1 border-2 border-stone-150 dark:border-stone-700 py-3.5 px-6 rounded-2xl font-sans text-xs uppercase tracking-widest font-bold text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 active:scale-98 transition-all cursor-pointer"
              >
                Retour
              </button>
              <button
                onClick={handleNext}
                className="flex-[2] bg-[#047857] text-[#FFFBEB] py-3.5 px-6 rounded-2xl font-sans text-xs uppercase tracking-widest font-bold hover:bg-[#059669] active:scale-98 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                Créer mon espace
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Philosophy Footnote */}
        <p className="text-center text-[10px] text-stone-400 dark:text-stone-500 mt-8 font-sans leading-relaxed">
          🔒 Stockage local privé. Aucune donnée ne quitte votre ordinateur.
        </p>

      </motion.div>
    </div>
  );
}
