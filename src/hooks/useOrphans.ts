import { useMemo } from 'react';
import { AppData, OrphanItem, OrphanReason } from '../types';

export function useOrphans(data: AppData): OrphanItem[] {
  return useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Safe date parser to avoid local timezone issues for YYYY-MM-DD
    const parseLocalDate = (str: string): Date => {
      if (!str) return new Date();
      if (str.includes('T') || str.includes(' ')) {
        const d = new Date(str);
        return new Date(d.getFullYear(), d.getMonth(), d.getDate());
      }
      const parts = str.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        return new Date(year, month, day);
      }
      return new Date(str);
    };

    const safeDaysBetween = (pastDateStr: string, todayDate: Date): number => {
      const d = parseLocalDate(pastDateStr);
      const utcPast = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
      const utcToday = Date.UTC(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate());
      const diff = Math.floor((utcToday - utcPast) / (1000 * 60 * 60 * 24));
      return diff < 0 ? 0 : diff;
    };

    const orphansList: OrphanItem[] = [];

    // Analyze Goals & Milestones
    const goals = data.goals || [];
    const tasks = data.tasks || [];
    const milestones = data.milestones || [];

    goals.forEach(goal => {
      if (goal.status !== 'En cours') return;

      const goalAge = safeDaysBetween(goal.createdAt, today);
      const linkedTasks = tasks.filter(t => t.goalId === goal.id);

      // 1 & 5. Action check
      let daysSinceAnyTask = goalAge;
      if (linkedTasks.length > 0) {
        const lastAnyDate = linkedTasks.reduce((max, t) => {
          return t.date > max ? t.date : max;
        }, linkedTasks[0].date);
        daysSinceAnyTask = safeDaysBetween(lastAnyDate, today);
      }

      let isInactive = false;
      let isNoAction = false;

      if (daysSinceAnyTask >= 30) {
        isInactive = true;
      } else if (daysSinceAnyTask >= 14) {
        isNoAction = true;
      }

      if (isInactive) {
        // daysSinceLastActivity = jours depuis la dernière tâche complétée liée
        const completedLinkedTasks = linkedTasks.filter(t => t.isCompleted);
        let completedDays = goalAge;
        if (completedLinkedTasks.length > 0) {
          const lastCompDate = completedLinkedTasks.reduce((max, t) => {
            return t.date > max ? t.date : max;
          }, completedLinkedTasks[0].date);
          completedDays = safeDaysBetween(lastCompDate, today);
        }

        orphansList.push({
          id: `orphan-goal-inactive-${goal.id}`,
          type: 'goal',
          title: goal.title,
          reason: 'goal-inactive',
          daysSinceLastActivity: completedDays,
        });
      } else if (isNoAction) {
        // daysSinceLastActivity = nombre de jours depuis la dernière tâche liée, ou depuis createdAt
        orphansList.push({
          id: `orphan-goal-no-action-${goal.id}`,
          type: 'goal',
          title: goal.title,
          reason: 'goal-no-action',
          daysSinceLastActivity: daysSinceAnyTask,
        });
      }

      // 2. goal-no-milestone
      const hasMilestone = milestones.some(m => m.goalId === goal.id);
      if (!hasMilestone && goalAge > 7) {
        orphansList.push({
          id: `orphan-goal-no-milestone-${goal.id}`,
          type: 'goal',
          title: goal.title,
          reason: 'goal-no-milestone',
          daysSinceLastActivity: goalAge,
        });
      }
    });

    // 3. task-no-goal
    tasks.forEach(task => {
      if (!task.isCompleted && !task.goalId && !task.milestoneId) {
        const taskAge = safeDaysBetween(task.date, today);
        if (taskAge > 3) {
          orphansList.push({
            id: `orphan-task-no-goal-${task.id}`,
            type: 'task',
            title: task.title,
            reason: 'task-no-goal',
            daysSinceLastActivity: taskAge,
          });
        }
      }
    });

    // 4. milestone-abandoned
    milestones.forEach(milestone => {
      if (!milestone.isCompleted) {
        const parentGoal = goals.find(g => g.id === milestone.goalId);
        if (parentGoal) {
          const parentGoalAge = safeDaysBetween(parentGoal.createdAt, today);
          if (parentGoalAge > 21) {
            const hasLinkedTask = tasks.some(t => t.milestoneId === milestone.id);
            if (!hasLinkedTask) {
              orphansList.push({
                id: `orphan-ms-abandoned-${milestone.id}`,
                type: 'milestone',
                title: milestone.title,
                reason: 'milestone-abandoned',
                daysSinceLastActivity: parentGoalAge,
                linkedGoalTitle: parentGoal.title,
              });
            }
          }
        }
      }
    });

    // Sort descending by daysSinceLastActivity
    orphansList.sort((a, b) => b.daysSinceLastActivity - a.daysSinceLastActivity);

    // Limit to top 8 items
    return orphansList.slice(0, 8);
  }, [data]);
}
