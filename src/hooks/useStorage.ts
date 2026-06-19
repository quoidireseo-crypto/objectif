import { useState, useEffect } from 'react';
import { AppData } from '../types';

const STORAGE_KEY = 'didier_boussole_data';
const BACKUP_KEY_1 = 'didier_boussole_backup_1';
const BACKUP_KEY_2 = 'didier_boussole_backup_2';

const defaultData: AppData = {
  goals: [],
  milestones: [],
  tasks: [],
  journal: [],
  morningRituals: [],
  goalsHistory: [],
  eveningReflections: [],
  habits: [],
  habitCompletions: [],
  weeklyReviews: [],
  lifeAssessments: [],
  energyLogs: []
};

// One-time migration: the evening "Bilan du soir" used to live in standalone
// localStorage keys (skopos_success_<date>), which meant it was never included
// in exports/backups. We pull those into AppData so they're saved like the rest.
const migrateEveningReflections = (parsed: AppData) => {
  if (window.localStorage.getItem('skopos_evening_migrated') === 'true') return;

  const existingDates = new Set((parsed.eveningReflections || []).map(r => r.date));
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key && key.startsWith('skopos_success_') && !key.endsWith('_saved')) {
      const date = key.replace('skopos_success_', '');
      const content = window.localStorage.getItem(key);
      if (content && !existingDates.has(date)) {
        parsed.eveningReflections.push({ date, content, createdAt: new Date().toISOString() });
        existingDates.add(date);
      }
    }
  }
  window.localStorage.setItem('skopos_evening_migrated', 'true');
};

export function useStorage() {
  const [data, setData] = useState<AppData>(() => {
    try {
      const item = window.localStorage.getItem(STORAGE_KEY);
      if (item) {
        const parsed: AppData = JSON.parse(item);
        // Ensure backward compatibility
        if (!parsed.goals) parsed.goals = [];
        if (!parsed.milestones) parsed.milestones = [];
        if (!parsed.tasks) parsed.tasks = [];
        if (!parsed.journal) parsed.journal = [];
        if (!parsed.morningRituals) parsed.morningRituals = [];
        if (!parsed.goalsHistory) parsed.goalsHistory = [];
        if (!parsed.eveningReflections) parsed.eveningReflections = [];
        if (!parsed.habits) parsed.habits = [];
        if (!parsed.habitCompletions) parsed.habitCompletions = [];
        if (!parsed.weeklyReviews) parsed.weeklyReviews = [];
        if (!parsed.lifeAssessments) parsed.lifeAssessments = [];
        if (!parsed.energyLogs) parsed.energyLogs = [];

        migrateEveningReflections(parsed);

        let hasChanges = false;
        
        // Auto-pause goals if deadline passed by more than 7 days
        const updatedGoals = parsed.goals.map(g => {
          if (g.status === 'En cours' && g.deadline) {
            const today = new Date();
            today.setHours(0,0,0,0);
            const deadlineDate = new Date(g.deadline);
            deadlineDate.setHours(0,0,0,0);
            
            const diffTime = deadlineDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays < -7) {
              hasChanges = true;
              return { ...g, status: 'En pause' as const };
            }
          }
          return g;
        });
        
        if (hasChanges) {
          parsed.goals = updatedGoals;
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        }

        return parsed;
      }
      return defaultData;
    } catch (error) {
      console.warn('Error reading localStorage', error);
      return defaultData;
    }
  });

  const [shouldRemindExport, setShouldRemindExport] = useState(false);

  useEffect(() => {
    const checkExport = () => {
      const lastExportStr = window.localStorage.getItem('didier_last_export_date');
      let shouldRemind = false;
      
      if (!lastExportStr) {
         shouldRemind = true;
      } else {
         const lastExport = new Date(lastExportStr);
         const diffTime = Date.now() - lastExport.getTime();
         const diffDays = diffTime / (1000 * 60 * 60 * 24);
         if (diffDays > 7) {
            shouldRemind = true;
         }
      }

      const dismissedStr = window.localStorage.getItem('didier_export_reminder_dismissed');
      if (dismissedStr) {
          const dismissedDate = new Date(dismissedStr);
          const today = new Date();
          if (dismissedDate.toDateString() === today.toDateString()) {
              shouldRemind = false;
          }
      }

      if (shouldRemind && (data.goals.length >= 1 || data.tasks.length >= 5)) {
         setShouldRemindExport(true);
      } else {
         setShouldRemindExport(false);
      }
    };

    checkExport();

    window.addEventListener('didier_export_occurred', checkExport);
    return () => window.removeEventListener('didier_export_occurred', checkExport);
  }, [data.goals.length, data.tasks.length]);

  useEffect(() => {
    try {
      const currentRaw = window.localStorage.getItem(STORAGE_KEY);
      
      const lastRotation = window.localStorage.getItem('didier_last_rotation');
      const now = Date.now();
      const ONE_HOUR = 60 * 60 * 1000;
      
      if (currentRaw && (!lastRotation || now - parseInt(lastRotation, 10) > ONE_HOUR)) {
        const backup1 = window.localStorage.getItem(BACKUP_KEY_1);
        const backup1Date = window.localStorage.getItem(BACKUP_KEY_1 + '_date');
        if (backup1) {
          window.localStorage.setItem(BACKUP_KEY_2, backup1);
          if (backup1Date) {
              window.localStorage.setItem(BACKUP_KEY_2 + '_date', backup1Date);
          }
        }
        window.localStorage.setItem(BACKUP_KEY_1, currentRaw);
        window.localStorage.setItem(BACKUP_KEY_1 + '_date', new Date().toISOString());
        window.localStorage.setItem('didier_last_rotation', now.toString());
      }

      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Error saving to localStorage', error);
    }
  }, [data]);

  const updateData = (newData: Partial<AppData>) => {
    setData(prev => ({ ...prev, ...newData }));
  };

  const dismissExportReminder = () => {
    window.localStorage.setItem('didier_export_reminder_dismissed', new Date().toISOString());
    setShouldRemindExport(false);
  };

  return { data, updateData, shouldRemindExport, dismissExportReminder };
}
