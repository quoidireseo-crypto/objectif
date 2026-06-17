import { useState, useEffect } from 'react';
import { AppData } from '../types';

const STORAGE_KEY = 'didier_boussole_data';

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
        const parsed: AppData = JSON.parse(item);
        // Ensure backward compatibility
        if (!parsed.milestones) parsed.milestones = [];
        
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

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Error saving to localStorage', error);
    }
  }, [data]);

  const updateData = (newData: Partial<AppData>) => {
    setData(prev => ({ ...prev, ...newData }));
  };

  return { data, updateData };
}
