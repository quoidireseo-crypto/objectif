import { useCallback, useMemo } from 'react';
import { AppData, WeeklyReview } from '../types';

const getWeekStart = (d: Date) => {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay(); // 0 = dimanche ... 6 = samedi
  const diffToMonday = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diffToMonday);
  return date.toISOString().split('T')[0];
};

export function useWeeklyReview(data: AppData, updateData: (newData: Partial<AppData>) => void) {
  const reviews = data.weeklyReviews || [];
  const currentWeekStart = useMemo(() => getWeekStart(new Date()), []);

  const currentWeekReview = useMemo(
    () => reviews.find(r => r.weekStartDate === currentWeekStart) || null,
    [reviews, currentWeekStart]
  );

  const sortedReviews = useMemo(
    () => [...reviews].sort((a, b) => b.weekStartDate.localeCompare(a.weekStartDate)),
    [reviews]
  );

  const completeReview = useCallback((input: { win: string; challenge: string; intention: string }) => {
    const review: WeeklyReview = {
      id: 'wr_' + Date.now().toString(),
      weekStartDate: currentWeekStart,
      ...input,
      createdAt: new Date().toISOString(),
    };
    updateData({
      weeklyReviews: [...reviews.filter(r => r.weekStartDate !== currentWeekStart), review],
    });
  }, [reviews, currentWeekStart, updateData]);

  return { reviews: sortedReviews, currentWeekReview, completeReview };
}
