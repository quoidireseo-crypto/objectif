import { useEffect } from 'react';
import { AppData } from '../types';
import { getHolisticReminderMessage } from '../lib/holisticReminder';

const FALLBACK_MESSAGE = "Petit rappel : ta journée t'attend. Sans pression, juste un coup d'œil.";

// Lit les données courantes (stockage local) pour composer un rappel contextuel.
const buildMessage = (): string => {
  try {
    const raw = window.localStorage.getItem('didier_boussole_data');
    if (!raw) return FALLBACK_MESSAGE;
    const data = JSON.parse(raw) as AppData;
    return getHolisticReminderMessage(data);
  } catch {
    return FALLBACK_MESSAGE;
  }
};

export function useReminder() {
  useEffect(() => {
    let timeoutId: number | null = null;

    const setupReminder = () => {
      if (timeoutId) clearTimeout(timeoutId);

      const enabled = window.localStorage.getItem('didier_reminder_enabled') === 'true';
      if (!enabled) return;

      const time = window.localStorage.getItem('didier_reminder_time') || '09:00';
      const [hours, minutes] = time.split(':').map(Number);

      const now = new Date();
      const target = new Date();
      target.setHours(hours, minutes, 0, 0);

      // Si l'heure est déjà passée aujourd'hui, on planifie pour demain
      if (target.getTime() <= now.getTime()) {
        target.setDate(target.getDate() + 1);
      }

      const delayMs = target.getTime() - now.getTime();

      timeoutId = window.setTimeout(() => {
        showNotification();
        // Reprogrammer pour demain
        setupReminder();
      }, delayMs);
    };

    const showNotification = () => {
      const msg = buildMessage();
      if ('Notification' in window && Notification.permission === 'granted') {
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then((registration) => {
            registration.showNotification("SKOPOS", {
              body: msg,
              vibrate: [200, 100, 200]
            } as any);
          });
        } else {
          new Notification("SKOPOS", { body: msg });
        }
      }
    };

    setupReminder();
    
    window.addEventListener('didier_reminder_changed', setupReminder);
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener('didier_reminder_changed', setupReminder);
    };
  }, []);
}
