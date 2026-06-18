import { useCallback } from 'react';
import { AppData, GoalChangeType, GoalHistoryEntry } from '../types';

export function useGoalHistory(
  data: AppData,
  updateData: (data: Partial<AppData>) => void
) {
  const getHistoryForGoal = useCallback((goalId: string): GoalHistoryEntry[] => {
    const history = data.goalsHistory || [];
    return history
      .filter(entry => entry.goalId === goalId)
      .sort((a, b) => {
        // Since id is Date.now().toString(), we can sort numerically by id desc for most reliable sorting
        const numA = Number(a.id) || 0;
        const numB = Number(b.id) || 0;
        return numB - numA;
      });
  }, [data.goalsHistory]);

  const addHistoryEntry = useCallback((
    goalId: string,
    changeType: GoalChangeType,
    previousValue?: string,
    newValue?: string
  ): void => {
    let description = '';

    switch (changeType) {
      case 'created':
        description = 'Objectif créé.';
        break;
      case 'title-changed':
        description = `Titre modifié : '${previousValue}' → '${newValue}'`;
        break;
      case 'why-changed':
        description = "La raison a changé.";
        break;
      case 'status-changed':
        description = `Statut changé : ${previousValue} → ${newValue}`;
        break;
      case 'milestone-added':
        description = `Nouvelle étape ajoutée : '${newValue}'`;
        break;
      case 'milestone-completed':
        description = `Étape accomplie : '${newValue}'`;
        break;
      case 'deadline-changed':
        description = `Échéance fixée au ${newValue}`;
        break;
      case 'domain-changed':
        description = `Domaine changé : ${previousValue} → ${newValue}`;
        break;
      case 'reactivated':
        description = 'Objectif réactivé. Un nouveau départ.';
        break;
      case 'achieved':
        description = 'Objectif atteint. Bravo !';
        break;
      case 'paused':
        description = 'Objectif mis en pause.';
        break;
      default:
        description = `Modification de l'objectif.`;
    }

    const newEntry: GoalHistoryEntry = {
      id: Date.now().toString(),
      goalId,
      changeType,
      date: new Date().toLocaleString('fr-FR'),
      previousValue,
      newValue,
      description,
    };

    const updatedHistory = [...(data.goalsHistory || []), newEntry];
    updateData({ goalsHistory: updatedHistory });
  }, [data.goalsHistory, updateData]);

  const clearHistoryForGoal = useCallback((goalId: string): void => {
    const history = data.goalsHistory || [];
    const updatedHistory = history.filter(entry => entry.goalId !== goalId);
    updateData({ goalsHistory: updatedHistory });
  }, [data.goalsHistory, updateData]);

  return {
    getHistoryForGoal,
    addHistoryEntry,
    clearHistoryForGoal,
  };
}
