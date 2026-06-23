import { useCallback } from 'react';
import { AppData, TrashEntry } from '../types';

// Gestion de la corbeille : restauration et suppression définitive.
// La logique de mise à la corbeille (moveToTrash) vit dans les vues, au moment
// de la suppression ; ici on gère la sortie de corbeille.
export function useTrash(data: AppData, updateData: (data: Partial<AppData>) => void) {
  const trash = data.trash || [];

  const restore = useCallback((entryId: string) => {
    const entry = trash.find(e => e.id === entryId);
    if (!entry) return;

    const patch: Partial<AppData> = {};
    const p = entry.payload || {};

    switch (entry.kind) {
      case 'task': {
        if (p.task) patch.tasks = [...data.tasks, p.task];
        break;
      }
      case 'journal': {
        if (p.entry) patch.journal = [p.entry, ...data.journal];
        break;
      }
      case 'habit': {
        if (p.habit) patch.habits = [...(data.habits || []), p.habit];
        if (p.completions?.length) patch.habitCompletions = [...(data.habitCompletions || []), ...p.completions];
        break;
      }
      case 'milestone': {
        if (p.milestone) patch.milestones = [...data.milestones, p.milestone];
        // Re-relier les actions qui pointaient vers cette étape (si elles existent encore).
        if (p.taskLinks?.length) {
          const links: Record<string, string> = {};
          p.taskLinks.forEach((l: { id: string; milestoneId?: string }) => { if (l.milestoneId) links[l.id] = l.milestoneId; });
          patch.tasks = data.tasks.map(t => (links[t.id] ? { ...t, milestoneId: links[t.id] } : t));
        }
        break;
      }
      case 'goal': {
        if (p.goal) patch.goals = [p.goal, ...data.goals];
        if (p.milestones?.length) patch.milestones = [...data.milestones, ...p.milestones];
        if (p.history?.length) patch.goalsHistory = [...(data.goalsHistory || []), ...p.history];
        // Re-relier les actions à l'objectif et à leur étape.
        if (p.taskLinks?.length) {
          const byId: Record<string, { goalId?: string; milestoneId?: string }> = {};
          p.taskLinks.forEach((l: { id: string; goalId?: string; milestoneId?: string }) => { byId[l.id] = l; });
          patch.tasks = data.tasks.map(t => (byId[t.id] ? { ...t, goalId: byId[t.id].goalId, milestoneId: byId[t.id].milestoneId } : t));
        }
        break;
      }
    }

    patch.trash = trash.filter(e => e.id !== entryId);
    updateData(patch);
  }, [data, trash, updateData]);

  const purge = useCallback((entryId: string) => {
    updateData({ trash: trash.filter(e => e.id !== entryId) });
  }, [trash, updateData]);

  const empty = useCallback(() => {
    updateData({ trash: [] });
  }, [updateData]);

  return { trash, restore, purge, empty };
}

// Fabrique un identifiant d'entrée de corbeille.
export function newTrashEntry(kind: TrashEntry['kind'], label: string, payload: any): TrashEntry {
  return {
    id: 'tr_' + Date.now().toString() + '_' + Math.random().toString(36).slice(2, 6),
    kind,
    label,
    deletedAt: new Date().toISOString(),
    payload,
  };
}
