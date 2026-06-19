import { useCallback, useMemo } from 'react';
import { AppData, Habit } from '../types';

const todayStr = () => new Date().toISOString().split('T')[0];

export function isHabitDueOn(habit: Habit, date: Date): boolean {
  if (habit.frequency === 'daily') return true;
  return (habit.daysOfWeek || []).includes(date.getDay());
}

export function useHabits(data: AppData, updateData: (newData: Partial<AppData>) => void) {
  const habits = data.habits || [];
  const completions = data.habitCompletions || [];

  const activeHabits = useMemo(() => habits.filter(h => !h.isArchived), [habits]);

  const todaysHabits = useMemo(() => {
    const today = new Date();
    return activeHabits.filter(h => isHabitDueOn(h, today));
  }, [activeHabits]);

  const isCompletedOn = useCallback(
    (habitId: string, date: string) => completions.some(c => c.habitId === habitId && c.date === date),
    [completions]
  );

  const addHabit = useCallback((input: Omit<Habit, 'id' | 'createdAt' | 'isArchived'>) => {
    const habit: Habit = {
      ...input,
      id: 'habit_' + Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    updateData({ habits: [...habits, habit] });
  }, [habits, updateData]);

  const archiveHabit = useCallback((id: string) => {
    updateData({ habits: habits.map(h => (h.id === id ? { ...h, isArchived: true } : h)) });
  }, [habits, updateData]);

  const deleteHabit = useCallback((id: string) => {
    updateData({
      habits: habits.filter(h => h.id !== id),
      habitCompletions: completions.filter(c => c.habitId !== id),
    });
  }, [habits, completions, updateData]);

  const toggleCompletion = useCallback((habitId: string, date: string = todayStr()) => {
    const exists = completions.some(c => c.habitId === habitId && c.date === date);
    if (exists) {
      updateData({ habitCompletions: completions.filter(c => !(c.habitId === habitId && c.date === date)) });
    } else {
      updateData({
        habitCompletions: [...completions, { id: 'hc_' + Date.now().toString(), habitId, date }],
      });
    }
  }, [completions, updateData]);

  // Régularité douce : nombre de fois où l'habitude a été tenue sur les 30
  // derniers jours. Un jour manqué ne remet jamais le compteur à zéro.
  const getRegularity = useCallback((habitId: string) => {
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    let count = 0;
    for (let i = 0; i < 30; i++) {
      if (isCompletedOn(habitId, cursor.toISOString().split('T')[0])) count++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return count;
  }, [isCompletedOn]);

  return {
    habits,
    activeHabits,
    todaysHabits,
    completions,
    isCompletedOn,
    addHabit,
    archiveHabit,
    deleteHabit,
    toggleCompletion,
    getRegularity,
  };
}
