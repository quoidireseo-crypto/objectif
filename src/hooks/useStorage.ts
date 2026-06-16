import { useState, useEffect } from 'react';
import { AppData } from '../types';

const STORAGE_KEY = 'didier_boussole_data';

const defaultData: AppData = {
  goals: [],
  tasks: [],
  journal: []
};

export function useStorage() {
  const [data, setData] = useState<AppData>(() => {
    try {
      const item = window.localStorage.getItem(STORAGE_KEY);
      return item ? JSON.parse(item) : defaultData;
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
