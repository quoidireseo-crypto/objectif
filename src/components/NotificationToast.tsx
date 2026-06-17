import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { AppData } from '../types';

interface NotificationToastProps {
  data?: AppData;
}

export function NotificationToast({ data }: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const lastNotified = window.localStorage.getItem('didier_last_notified');
    const today = new Date().toISOString().split('T')[0];

    // Only show once per day
    if (lastNotified !== today) {
      // Determine message contextually
      let contextualMessage = "Bonjour, as-tu pris un instant pour consulter tes objectifs aujourd'hui ?";
      
      if (data) {
        const todayTasks = data.tasks.filter(t => t.date === today);
        if (todayTasks.length === 0) {
          contextualMessage = "Tu n'as encore rien planifié pour aujourd'hui.";
        } else {
          const pendingCount = todayTasks.filter(t => !t.isCompleted).length;
          if (pendingCount > 0) {
            contextualMessage = `Tu as ${pendingCount} action${pendingCount > 1 ? 's' : ''} en attente aujourd'hui.`;
          } else {
            contextualMessage = "Bravo, tu as honoré tous tes engagements du jour ! 🎉";
          }
        }
      }
      
      setMessage(contextualMessage);

      const timer = setTimeout(() => {
        setIsVisible(true);
        window.localStorage.setItem('didier_last_notified', today);
      }, 2000);

      const hideTimer = setTimeout(() => {
        setIsVisible(false);
      }, 10000);

      return () => {
        clearTimeout(timer);
        clearTimeout(hideTimer);
      };
    }
  }, [data]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-24 md:bottom-8 right-4 md:right-8 bg-stone-800 text-stone-100 p-5 rounded-3xl shadow-xl animate-in slide-in-from-bottom-8 fade-in duration-500 z-50 flex items-start gap-4 max-w-sm border border-stone-700">
      <div className="bg-emerald-500/20 p-2.5 rounded-2xl text-emerald-400 shrink-0 mt-0.5">
        <Bell className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <h4 className="font-sans font-bold text-sm text-white mb-1.5 uppercase tracking-wider">Petit rappel</h4>
        <p className="text-sm text-stone-300 font-serif italic leading-snug">
          {message}
        </p>
      </div>
      <button 
        onClick={() => setIsVisible(false)}
        className="text-stone-400 hover:text-white transition-colors p-1"
        aria-label="Fermer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
