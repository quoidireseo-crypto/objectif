import { useCallback } from 'react';
import { AppData, MorningRitual, Task, LifeDomain } from '../types';

export function useMorningRitual(
  data: AppData,
  updateData: (newData: Partial<AppData>) => void
) {
  // 1. Calculate today's date in YYYY-MM-DD
  const todayDate = new Date().toISOString().split('T')[0];

  // 2. Search if a ritual exists for today
  const todayRitual = data.morningRituals?.find(r => r.date === todayDate) || null;

  // 3. Determine if we should show the ritual
  // shouldShowRitual is true only if:
  // - No ritual exists for today (neither completed nor skipped)
  // - AND current hour is between 5h00 and 11h00
  const currentHour = new Date().getHours();
  const isMorning = currentHour >= 5 && currentHour < 11;
  const shouldShowRitual = !todayRitual && isMorning;

  // 4. completeRitual function
  const completeRitual = useCallback((
    ritualInput: Omit<MorningRitual, 'id' | 'date' | 'createdAt' | 'status'>
  ) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const newRitualId = 'rit_' + Date.now().toString();
    const createdAtStr = new Date().toISOString();

    const newRitual: MorningRitual = {
      ...ritualInput,
      id: newRitualId,
      date: todayStr,
      status: 'completed',
      createdAt: createdAtStr,
    };

    // Find the goal's domain if goalId is specified
    let domain: LifeDomain | undefined = undefined;
    if (ritualInput.goalId) {
      const parentGoal = data.goals.find(g => g.id === ritualInput.goalId);
      if (parentGoal) {
        domain = parentGoal.domain;
      }
    }

    // Create automatically a Task
    const newTaskId = 'task_' + Date.now().toString();
    const newTask: Task = {
      id: newTaskId,
      title: ritualInput.priority,
      date: todayStr,
      isImportant: true,
      goalId: ritualInput.goalId,
      domain,
      isCompleted: false,
    };

    // Update the parent data
    updateData({
      morningRituals: [...(data.morningRituals || []), newRitual],
      tasks: [...(data.tasks || []), newTask],
    });
  }, [data.morningRituals, data.tasks, data.goals, updateData]);

  // 5. skipRitual function
  const skipRitual = useCallback(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const newRitualId = 'rit_skip_' + Date.now().toString();
    const createdAtStr = new Date().toISOString();

    const newRitual: MorningRitual = {
      id: newRitualId,
      date: todayStr,
      priority: '',
      goalId: undefined,
      mood: 'Bien',
      status: 'skipped',
      createdAt: createdAtStr,
    };

    updateData({
      morningRituals: [...(data.morningRituals || []), newRitual],
    });
  }, [data.morningRituals, updateData]);

  return {
    todayRitual,
    shouldShowRitual,
    completeRitual,
    skipRitual,
  };
}
