import { useMemo } from 'react';
import { Task } from '../types';

export function useStreak(tasks: Task[]) {
  return useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all dates where at least 1 task was completed
    const completedDates = new Set<string>();
    
    tasks.forEach(task => {
      if (task.isCompleted && task.date) {
        const tDate = new Date(task.date);
        tDate.setHours(0, 0, 0, 0);
        // Only count up to today, not future tasks
        if (tDate.getTime() <= today.getTime()) {
           completedDates.add(tDate.toISOString().split('T')[0]);
        }
      }
    });

    let currentStreak = 0;
    
    const todayStr = today.toISOString().split('T')[0];
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - 1);
    const yesterdayStr = checkDate.toISOString().split('T')[0];

    const dateIterator = new Date(today);
    
    // If no tasks completed today and not yesterday either, streak is 0
    if (!completedDates.has(todayStr) && !completedDates.has(yesterdayStr)) {
       return { currentStreak: 0 };
    }

    if (!completedDates.has(todayStr) && completedDates.has(yesterdayStr)) {
       // Streak alive, started yesterday
       dateIterator.setDate(dateIterator.getDate() - 1);
    }

    while (true) {
       const dateStr = dateIterator.toISOString().split('T')[0];
       if (completedDates.has(dateStr)) {
          currentStreak++;
          dateIterator.setDate(dateIterator.getDate() - 1);
       } else {
          break;
       }
    }

    return { currentStreak };
  }, [tasks]);
}
