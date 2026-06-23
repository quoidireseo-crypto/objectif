import { useState, useMemo } from 'react';
import { AppData, JournalEntry } from '../types';
import { BookHeart, Send, Smile, Meh, Frown, Sparkles, Trash2, CloudLightning, Pencil } from 'lucide-react';
import { EmptyState } from '../components/EmptyState';

interface JournalProps {
  data: AppData;
  updateData: (data: Partial<AppData>) => void;
}

const MOODS = [
  { label: 'Super', icon: Sparkles, color: 'text-amber-800 bg-amber-50 border-amber-200 hover:bg-amber-100 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20 dark:hover:bg-amber-500/20' },
  { label: 'Bien', icon: Smile, color: 'text-emerald-800 bg-emerald-50 border-emerald-200 hover:bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:hover:bg-emerald-500/20' },
  { label: 'Moyen', icon: Meh, color: 'text-stone-600 bg-stone-100 border-stone-200 hover:bg-stone-200 dark:text-stone-300 dark:bg-stone-800 dark:border-stone-700 dark:hover:bg-stone-700' },
  { label: 'Difficile', icon: Frown, color: 'text-amber-900 bg-amber-100 border-amber-300 hover:bg-amber-200 dark:text-amber-200 dark:bg-amber-500/20 dark:border-amber-500/30 dark:hover:bg-amber-500/30' },
] as const;

const FRENCH_STOP_WORDS = new Set([
  'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'd', 'l', 'à', 'au', 'aux',
  'et', 'ou', 'mais', 'donc', 'or', 'ni', 'car', 'pour', 'par', 'sur', 'sous', 'avec', 'sans', 'dans', 'en', 'vers',
  'qui', 'que', 'quoi', 'dont', 'où', 'je', 'tu', 'il', 'elle', 'on', 'nous', 'vous', 'ils', 'elles',
  'me', 'te', 'se', 'y', 'ce', 'cet', 'cette', 'ces', 'mon', 'ton', 'son', 'ma', 'ta', 'sa', 'mes', 'tes', 'ses',
  'est', 'sont', 'suis', 'es', 'a', 'ont', 'ai', 'as', 'pas', 'plus', 'très', 'trop', 'bien', 'fait', 'faire', 'être', 'avoir',
  'tout', 'tous', 'c', 'j', 'm', 't', 's', 'qu', 'peu', 'beaucoup', 'comme', 'comment', 'quand', 'pourquoi', 'ça', 'cela', 'ceci',
  'ne', 'ici', 'là', 'rien', 'quelque', 'toujours', 'jamais', 'aussi', 'encore', 'oui', 'non', 'même', 'autre', 'autres', 'après', 'avant',
  'jour', 'aujourd', 'hui', 'alors', 'vraiment', 'trop', 'dire', 'dit', 'aller', 'vais', 'vas', 'va', 'vont',
  'été', 'peuvent', 'peut', 'peux', 'voir', 'vu', 'temps', 'fois', 'journée', 'matin', 'soir', 'nuit',
  'cette', 'cet', 'ces', 'ceux', 'celles', 'celui', 'celle', 'votre', 'vos', 'notre', 'nos', 'leur', 'leurs'
]);

export function JournalView({ data, updateData }: JournalProps) {
  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState<JournalEntry['mood']>('Bien');
  const [search, setSearch] = useState('');
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editMood, setEditMood] = useState<JournalEntry['mood']>('Bien');

  const startEditEntry = (entry: JournalEntry) => {
    setEditingEntryId(entry.id);
    setEditContent(entry.content);
    setEditMood(entry.mood);
  };

  const saveEditEntry = () => {
    const c = editContent.trim();
    if (editingEntryId && c) {
      updateData({ journal: data.journal.map(j => (j.id === editingEntryId ? { ...j, content: c, mood: editMood } : j)) });
    }
    setEditingEntryId(null);
    setEditContent('');
  };

  const filteredJournal = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data.journal;
    return data.journal.filter(
      j => j.content.toLowerCase().includes(q) || j.mood.toLowerCase().includes(q)
    );
  }, [data.journal, search]);

  const todayDate = new Date().toISOString().split('T')[0];
  const hasEntryToday = data.journal.some(j => j.date === todayDate);

  const handleSave = () => {
    if (!content.trim()) return;

    const entry: JournalEntry = {
      id: Date.now().toString(),
      date: todayDate,
      content: content.trim(),
      mood: selectedMood
    };

    updateData({ journal: [entry, ...data.journal] });
    setContent('');
  };

  const deleteJournalEntry = (id: string) => {
    if (confirm("Supprimer cette réflexion ?")) {
      updateData({ journal: data.journal.filter(j => j.id !== id) });
    }
  };

  const wordCloud = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentEntries = data.journal.filter(j => new Date(j.date) >= thirtyDaysAgo);
    
    if (recentEntries.length === 0) return [];

    const wordsCounter: Record<string, number> = {};
    
    recentEntries.forEach(entry => {
      if (entry.mood) {
         const moodWord = entry.mood.toLowerCase();
         wordsCounter[moodWord] = (wordsCounter[moodWord] || 0) + 2;
      }
  
      const words = entry.content.toLowerCase().split(/[\s,.;:!?()'"’]+/);
      words.forEach(w => {
        if (w.length > 3 && !FRENCH_STOP_WORDS.has(w)) {
          wordsCounter[w] = (wordsCounter[w] || 0) + 1;
        }
      });
    });
  
    const sortedWords = Object.entries(wordsCounter)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 25);
  
    // Pseudo-randomizing output order based on word string itself for stability between re-renders
    return sortedWords.sort((a, b) => {
        return (a[0].charCodeAt(0) % 3) - (b[0].charCodeAt(0) % 3);
    });
  }, [data.journal]);

  const getWordStyle = (count: number) => {
    if (count === 1) return 'text-stone-400 dark:text-stone-500 text-xs md:text-sm font-light opacity-60';
    if (count === 2) return 'text-stone-500 dark:text-stone-400 text-sm md:text-base font-medium opacity-80';
    if (count === 3) return 'text-emerald-700 dark:text-emerald-400 text-base md:text-lg font-bold';
    if (count === 4) return 'text-emerald-800 dark:text-emerald-300 text-lg md:text-xl font-bold tracking-tight';
    return 'text-amber-700 dark:text-amber-400 text-xl md:text-2xl font-black tracking-tighter';
  };

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="mb-6 md:mb-8 border-b border-stone-200 dark:border-stone-800 pb-6">
        <h2 className="text-3xl md:text-4xl font-light text-stone-900 dark:text-stone-100 flex items-center gap-3">
          Vos sentiments et impressions du jour !
        </h2>
        <p className="text-stone-500 dark:text-stone-400 font-sans tracking-wide text-xs md:text-sm mt-3 leading-relaxed max-w-2xl font-light">
          Prenez un moment pour vous. Cet espace est fait pour noter vos impressions, vos ressentis, ce qui a fonctionné ou qui n'a pas marché aujourd'hui.
        </p>
      </header>

      {!hasEntryToday && (
        <div className="bg-[#EAE7E2] dark:bg-stone-900 rounded-3xl p-8 mb-10 border border-stone-200 dark:border-stone-800">
          <h3 className="text-xs uppercase tracking-widest text-[#047857] dark:text-emerald-400 mb-6 font-sans font-bold">Mon état d'esprit & impressions</h3>
          
          <div className="flex flex-wrap gap-3 mb-6 font-sans">
            {MOODS.map(mood => {
              const Icon = mood.icon;
              const isSelected = selectedMood === mood.label;
              return (
                <button
                  key={mood.label}
                  onClick={() => setSelectedMood(mood.label as JournalEntry['mood'])}
                  className={`flex items-center gap-2 px-5 py-3 rounded-2xl border transition-all text-xs font-bold uppercase tracking-wider ${
                    isSelected ? mood.color + ' ring-1 ring-offset-2 ring-stone-400 dark:ring-offset-stone-900 dark:ring-stone-600' : 'border-stone-200/60 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:bg-white dark:hover:bg-stone-700'
                  } ${isSelected ? 'shadow-sm' : ''}`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{mood.label}</span>
                </button>
              )
            })}
          </div>

          <textarea
            placeholder="Qu'est-ce qui a bien marché ? Qu'est-ce qui a posé problème ? Une pensée à garder en tête..."
            className="w-full bg-white dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-3xl p-6 min-h-[160px] outline-none focus:ring-1 focus:ring-emerald-700 text-lg leading-snug font-light italic transition-shadow mb-6 resize-y text-stone-800 dark:text-stone-100"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={!content.trim()}
              className="bg-stone-800 dark:bg-emerald-700 text-white px-6 py-3 rounded-xl font-sans text-xs uppercase tracking-widest font-bold hover:bg-stone-900 dark:hover:bg-emerald-800 disabled:opacity-50 flex items-center gap-2 transition"
            >
              <Send className="w-4 h-4" />
              Enregistrer ma journée
            </button>
          </div>
        </div>
      )}

      {wordCloud.length > 0 && (
        <div className="bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-3xl p-6 md:p-8 mb-10 shadow-sm animate-in fade-in duration-700">
          <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400 mb-6">
            <CloudLightning className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-xs font-sans uppercase tracking-widest font-bold">Mots-clés des 30 derniers jours</h3>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-4 px-4 py-2">
            {wordCloud.map(([word, count]) => (
              <span key={word} className={`transition-all duration-300 hover:scale-110 cursor-default ${getWordStyle(count)}`}>
                {word}
              </span>
            ))}
          </div>
        </div>
      )}

      {data.journal.length > 0 ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
            <h3 className="text-2xl font-light text-stone-800 dark:text-stone-200">Mes réflexions passées</h3>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un mot, une humeur..."
              className="w-full sm:w-64 px-4 py-2.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl outline-none focus:ring-1 focus:ring-emerald-700 focus:border-emerald-700 text-stone-800 dark:text-stone-100 font-sans text-sm transition"
            />
          </div>
          {filteredJournal.length === 0 && (
            <p className="text-stone-400 dark:text-stone-500 italic text-sm py-4">Aucune réflexion ne correspond à « {search} ».</p>
          )}
          {filteredJournal.map(entry => {
            const moodData = MOODS.find(m => m.label === entry.mood) || MOODS[1];
            const MoodIcon = moodData.icon;
            
            return (
              <div key={entry.id} className="bg-white dark:bg-stone-900 border text-left border-stone-100 dark:border-stone-800 p-8 rounded-3xl shadow-sm hover:shadow-md transition">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-xs font-sans uppercase tracking-widest font-bold text-stone-400 dark:text-stone-500">
                    {new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(entry.date))}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1.5 rounded-full text-[10px] font-sans font-bold uppercase tracking-wider flex items-center gap-1.5 ${moodData.color.split(' ').slice(0,2).join(' ')} ${moodData.color.split(' ').filter(c => c.startsWith('dark:')).slice(0,2).join(' ')}`}>
                      <MoodIcon className="w-3.5 h-3.5" />
                      {entry.mood}
                    </div>
                    <button onClick={() => startEditEntry(entry)} className="text-stone-300 dark:text-stone-600 hover:text-stone-600 dark:hover:text-stone-300 p-1 transition-colors" title="Modifier">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteJournalEntry(entry.id)} className="text-stone-300 dark:text-stone-600 hover:text-red-500 p-1 transition-colors" title="Supprimer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {editingEntryId === entry.id ? (
                  <div className="space-y-3">
                    <textarea
                      autoFocus
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 outline-none focus:ring-1 focus:ring-emerald-700 focus:border-emerald-700 text-stone-800 dark:text-stone-100 bg-white dark:bg-stone-800 transition min-h-[100px] resize-y font-sans text-base"
                    />
                    <div className="flex flex-wrap gap-2">
                      {MOODS.map(mood => {
                        const MIcon = mood.icon;
                        const sel = editMood === mood.label;
                        return (
                          <button
                            key={mood.label}
                            onClick={() => setEditMood(mood.label as JournalEntry['mood'])}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-sans font-bold transition ${sel ? 'border-emerald-700 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400' : 'border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'}`}
                          >
                            <MIcon className="w-3.5 h-3.5" />
                            {mood.label}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex justify-end gap-2">
                      <button onClick={() => { setEditingEntryId(null); setEditContent(''); }} className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition">Annuler</button>
                      <button onClick={saveEditEntry} disabled={!editContent.trim()} className="px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-widest bg-stone-800 dark:bg-emerald-700 text-white hover:bg-stone-900 dark:hover:bg-emerald-800 disabled:opacity-50 transition">Enregistrer</button>
                    </div>
                  </div>
                ) : (
                  <p className="text-stone-800 dark:text-stone-100 text-lg whitespace-pre-wrap leading-snug font-light italic">"{entry.content}"</p>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <EmptyState
          icon={BookHeart}
          title="Ton journal est encore vierge"
          description="Le journal garde une trace de ton cheminement : ressentis, idées, petits progrès."
          hint="Écris une première note quand tu veux, même une seule phrase."
        />
      )}
    </div>
  );
}
