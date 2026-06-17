import { useState, useRef } from 'react';
import { AppData, JournalEntry } from '../types';
import { BookHeart, Send, Smile, Meh, Frown, Sparkles, Mic, Square, Loader2 } from 'lucide-react';

interface JournalProps {
  data: AppData;
  updateData: (data: Partial<AppData>) => void;
}

const MOODS = [
  { label: 'Super', icon: Sparkles, color: 'text-amber-800 bg-amber-50 border-amber-200 hover:bg-amber-100' },
  { label: 'Bien', icon: Smile, color: 'text-emerald-800 bg-emerald-50 border-emerald-200 hover:bg-emerald-100' },
  { label: 'Moyen', icon: Meh, color: 'text-stone-600 bg-stone-100 border-stone-200 hover:bg-stone-200' },
  { label: 'Difficile', icon: Frown, color: 'text-amber-900 bg-amber-100 border-amber-300 hover:bg-amber-200' },
] as const;

export function JournalView({ data, updateData }: JournalProps) {
  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState<JournalEntry['mood']>('Bien');
  
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const todayDate = new Date().toISOString().split('T')[0];
  const hasEntryToday = data.journal.some(j => j.date === todayDate);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64data = reader.result?.toString().split(',')[1];
          if (base64data) {
            setIsTranscribing(true);
            try {
              const res = await fetch('/api/transcribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ audioData: base64data, mimeType: 'audio/webm' })
              });
              const data = await res.json();
              if (data.text) {
                setContent(prev => prev ? prev + '\\n\\n' + data.text : data.text);
              }
            } catch(e) {
              console.error(e);
            } finally {
              setIsTranscribing(false);
            }
          }
        };
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access denied", err);
      alert("Accès au microphone refusé ou indisponible.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

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

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="mb-6 md:mb-8 border-b border-stone-200 pb-6">
        <h2 className="text-3xl md:text-4xl font-light text-stone-900 flex items-center gap-3">
          Journal de bord
        </h2>
        <p className="text-stone-500 font-sans tracking-wide uppercase text-[10px] md:text-xs mt-2 italic">Un instant pour réfléchir, sans jugement.</p>
      </header>

      {!hasEntryToday && (
        <div className="bg-[#EAE7E2] rounded-3xl p-8 mb-10 border border-stone-200">
          <h3 className="text-sm uppercase tracking-widest text-stone-500 mb-6 font-sans">Journal d'Intention</h3>
          
          <div className="flex flex-wrap gap-3 mb-6 font-sans">
            {MOODS.map(mood => {
              const Icon = mood.icon;
              const isSelected = selectedMood === mood.label;
              return (
                <button
                  key={mood.label}
                  onClick={() => setSelectedMood(mood.label as JournalEntry['mood'])}
                  className={`flex items-center gap-2 px-5 py-3 rounded-2xl border transition-all text-xs font-bold uppercase tracking-wider ${
                    isSelected ? mood.color + ' ring-1 ring-offset-2 ring-stone-400' : 'border-stone-200/60 bg-stone-50 text-stone-500 hover:bg-white'
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
            className="w-full bg-white border border-stone-100 rounded-3xl p-6 min-h-[160px] outline-none focus:ring-1 focus:ring-emerald-700 text-lg leading-snug font-light italic transition-shadow mb-6 resize-y text-stone-800"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isTranscribing}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-sans text-xs uppercase tracking-widest font-bold transition ${
                  isRecording 
                    ? 'bg-red-100 text-red-600 border border-red-200 animate-pulse' 
                    : isTranscribing
                    ? 'bg-stone-100 text-stone-500 border border-stone-200 cursor-not-allowed'
                    : 'bg-white border-2 border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                {isRecording ? (
                  <>
                    <Square className="w-4 h-4 fill-current" />
                    Enregistrement...
                  </>
                ) : isTranscribing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Transcription...
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" />
                    Mémo vocal
                  </>
                )}
              </button>
            </div>

            <button
              onClick={handleSave}
              disabled={!content.trim() || isTranscribing}
              className="bg-stone-800 text-white px-6 py-3 rounded-xl font-sans text-xs uppercase tracking-widest font-bold hover:bg-stone-900 disabled:opacity-50 flex items-center gap-2 transition"
            >
              <Send className="w-4 h-4" />
              Enregistrer ma journée
            </button>
          </div>
        </div>
      )}

      {data.journal.length > 0 ? (
        <div className="space-y-6">
          <h3 className="text-2xl font-light text-stone-800 pb-2">Mes réflexions passées</h3>
          {data.journal.map(entry => {
            const moodData = MOODS.find(m => m.label === entry.mood) || MOODS[1];
            const MoodIcon = moodData.icon;
            
            return (
              <div key={entry.id} className="bg-white border text-left border-stone-100 p-8 rounded-3xl shadow-sm hover:shadow-md transition">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-xs font-sans uppercase tracking-widest font-bold text-stone-400">
                    {new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(entry.date))}
                  </span>
                  <div className={`px-3 py-1.5 rounded-full text-[10px] font-sans font-bold uppercase tracking-wider flex items-center gap-1.5 ${moodData.color.split(' ').slice(0,2).join(' ')}`}>
                    <MoodIcon className="w-3.5 h-3.5" />
                    {entry.mood}
                  </div>
                </div>
                <p className="text-stone-800 text-lg whitespace-pre-wrap leading-snug font-light italic">"{entry.content}"</p>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-[#F5F5F0]">
          <p className="text-stone-400 italic">Aucune réflexion enregistrée pour le moment.</p>
        </div>
      )}
    </div>
  );
}
