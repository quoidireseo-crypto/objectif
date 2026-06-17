import { useEffect } from 'react';

const REMINDER_MESSAGES = [
  "Bonjour ! Une petite action vers ton cap t'attend aujourd'hui. 🧭",
  "C'est l'heure de ton rendez-vous avec toi-même. Qu'est-ce que tu choisis ?",
  "Un pas, même petit, c'est déjà avancer. Qu'est-ce que tu fais aujourd'hui ?",
  "Ta boussole t'attend. Jette un œil à tes intentions du jour.",
  "Rappel bienveillant : tu as des caps à honorer. Sans pression, juste un regard."
];

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
      const msg = REMINDER_MESSAGES[Math.floor(Math.random() * REMINDER_MESSAGES.length)];
      if ('Notification' in window && Notification.permission === 'granted') {
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then((registration) => {
            registration.showNotification("Ton Cap", {
              body: msg,
              vibrate: [200, 100, 200]
            } as any);
          });
        } else {
          new Notification("Ton Cap", { body: msg });
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
