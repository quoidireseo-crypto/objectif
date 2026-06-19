import { useMemo } from 'react';
import { Task } from '../types';

// Régularité douce : au lieu d'un compteur de jours consécutifs qui retombe
// brutalement à zéro (source d'anxiété), on mesure le nombre de jours actifs
// sur les 30 derniers jours. Un jour manqué ne fait jamais s'effondrer le score.
export function useStreak(tasks: Task[]) {
  return useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const completedDates = new Set<string>();
    tasks.forEach(task => {
      if (task.isCompleted && task.date) {
        const tDate = new Date(task.date);
        tDate.setHours(0, 0, 0, 0);
        if (tDate.getTime() <= today.getTime()) {
          completedDates.add(tDate.toISOString().split('T')[0]);
        }
      }
    });

    let activeDays30 = 0;
    const cursor = new Date(today);
    for (let i = 0; i < 30; i++) {
      if (completedDates.has(cursor.toISOString().split('T')[0])) activeDays30++;
      cursor.setDate(cursor.getDate() - 1);
    }

    return { activeDays30 };
  }, [tasks]);
}
