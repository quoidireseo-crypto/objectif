import { useState, useEffect } from 'react';
import { AppData } from '../types';

const STORAGE_KEY = 'didier_boussole_data';
const BACKUP_KEY_1 = 'didier_boussole_backup_1';
const BACKUP_KEY_2 = 'didier_boussole_backup_2';

const defaultData: AppData = {
  goals: [],
  milestones: [],
  tasks: [],
  journal: []
};

export function useStorage() {
  const [data, setData] = useState<AppData>(() => {
    try {
      const item = window.localStorage.getItem(STORAGE_KEY);
      if (item) {
        let parsed = JSON.parse(item);
        if (!parsed || typeof parsed !== 'object') {
          parsed = {};
        }
        // Ensure backward compatibility and guarantee arrays
        if (!parsed.goals || !Array.isArray(parsed.goals)) parsed.goals = [];
        if (!parsed.tasks || !Array.isArray(parsed.tasks)) parsed.tasks = [];
        if (!parsed.journal || !Array.isArray(parsed.journal)) parsed.journal = [];
        if (!parsed.milestones || !Array.isArray(parsed.milestones)) parsed.milestones = [];
        
        let hasChanges = false;
        
        // Auto-pause goals if deadline passed by more than 7 days
        const updatedGoals = parsed.goals.map((g: any) => {
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
    setData(prev => {
      const merged = { ...prev, ...newData };
      if (!merged.goals || !Array.isArray(merged.goals)) merged.goals = [];
      if (!merged.tasks || !Array.isArray(merged.tasks)) merged.tasks = [];
      if (!merged.journal || !Array.isArray(merged.journal)) merged.journal = [];
      if (!merged.milestones || !Array.isArray(merged.milestones)) merged.milestones = [];
      return merged;
    });
  };

  const dismissExportReminder = () => {
    window.localStorage.setItem('didier_export_reminder_dismissed', new Date().toISOString());
    setShouldRemindExport(false);
  };

  return { data, updateData, shouldRemindExport, dismissExportReminder };
}
