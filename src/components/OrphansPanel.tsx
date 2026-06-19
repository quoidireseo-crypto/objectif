import { useState } from 'react';
import { AlertCircle, ChevronDown } from 'lucide-react';
import { AppData, Goal, OrphanItem, ViewType } from '../types';
import { useOrphans } from '../hooks/useOrphans';
import { useGoalHistory } from '../hooks/useGoalHistory';
import { OrphanCard } from './OrphanCard';

interface OrphansPanelProps {
  data: AppData;
  updateData: (data: Partial<AppData>) => void;
  onChangeView: (view: ViewType) => void;
}

// Retrouve l'id réel de l'objet derrière l'id synthétique d'un orphelin.
const GOAL_ORPHAN_PREFIXES = ['orphan-goal-inactive-', 'orphan-goal-no-action-', 'orphan-goal-no-milestone-'];
const extractRealId = (orphanId: string): string => {
  for (const prefix of [...GOAL_ORPHAN_PREFIXES, 'orphan-task-no-goal-', 'orphan-ms-abandoned-']) {
    if (orphanId.startsWith(prefix)) return orphanId.slice(prefix.length);
  }
  return orphanId;
};

export function OrphansPanel({ data, updateData, onChangeView }: OrphansPanelProps) {
  const orphans = useOrphans(data);
  const { addHistoryEntry } = useGoalHistory(data, updateData);
  const [isExpanded, setIsExpanded] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  const visibleOrphans = orphans.filter(
    o => !dismissedIds.includes(o.id)
  );

  if (visibleOrphans.length === 0) {
    return null;
  }

  // Droit de lâcher : mettre un objectif en pause, en douceur et sans confirmation
  // brutale. Le geste est honoré et tracé dans l'historique.
  const handlePauseGoal = (orphan: OrphanItem) => {
    const realId = extractRealId(orphan.id);
    const goal = data.goals.find((g: Goal) => g.id === realId);
    if (!goal) return;
    const oldStatus = goal.status;
    updateData({
      goals: data.goals.map((g: Goal) => (g.id === realId ? { ...g, status: 'En pause' as const } : g)),
    });
    addHistoryEntry(realId, 'paused', oldStatus, 'En pause');
    setDismissedIds(prev => [...prev, orphan.id]);
  };

  // Découper : aller poser une petite action concrète pour relancer l'objectif.
  const handleBreakDown = (orphan: OrphanItem) => {
    onChangeView('tasks');
    setDismissedIds(prev => [...prev, orphan.id]);
  };

  const handleReactivate = (orphan: OrphanItem) => {
    // Extract real item id from synthetic orphan id (e.g. "orphan-goal-inactive-xxx" or "orphan-task-no-goal-xxx")
    let realId = orphan.id;
    if (realId.startsWith('orphan-goal-inactive-')) {
      realId = realId.slice('orphan-goal-inactive-'.length);
    } else if (realId.startsWith('orphan-goal-no-action-')) {
      realId = realId.slice('orphan-goal-no-action-'.length);
    } else if (realId.startsWith('orphan-goal-no-milestone-')) {
      realId = realId.slice('orphan-goal-no-milestone-'.length);
    } else if (realId.startsWith('orphan-task-no-goal-')) {
      realId = realId.slice('orphan-task-no-goal-'.length);
    } else if (realId.startsWith('orphan-ms-abandoned-')) {
      realId = realId.slice('orphan-ms-abandoned-'.length);
    }

    if (orphan.type === 'goal') {
      onChangeView('goals');
    } else if (orphan.type === 'task') {
      onChangeView('tasks');
    } else if (orphan.type === 'milestone') {
      onChangeView('goals');
    }

    setDismissedIds(prev => [...prev, orphan.id]);
  };

  const handleArchive = (orphan: OrphanItem) => {
    let realId = orphan.id;
    if (realId.startsWith('orphan-goal-inactive-')) {
      realId = realId.slice('orphan-goal-inactive-'.length);
    } else if (realId.startsWith('orphan-goal-no-action-')) {
      realId = realId.slice('orphan-goal-no-action-'.length);
    } else if (realId.startsWith('orphan-goal-no-milestone-')) {
      realId = realId.slice('orphan-goal-no-milestone-'.length);
    } else if (realId.startsWith('orphan-task-no-goal-')) {
      realId = realId.slice('orphan-task-no-goal-'.length);
    } else if (realId.startsWith('orphan-ms-abandoned-')) {
      realId = realId.slice('orphan-ms-abandoned-'.length);
    }

    const isConfirmed = window.confirm(`Archiver '${orphan.title}' ? Tu pourras toujours le retrouver dans tes données.`);
    if (!isConfirmed) return;

    if (orphan.type === 'goal') {
      // Put goal on pause (archive)
      const updatedGoals = (data.goals || []).map(g => 
        g.id === realId ? { ...g, status: 'En pause' as const } : g
      );
      updateData({ goals: updatedGoals });
    } else if (orphan.type === 'task') {
      // Remove task
      const updatedTasks = (data.tasks || []).filter(t => t.id !== realId);
      updateData({ tasks: updatedTasks });
    } else if (orphan.type === 'milestone') {
      // Mark milestone as completed
      const updatedMilestones = (data.milestones || []).map(m => 
        m.id === realId ? { ...m, isCompleted: true } : m
      );
      updateData({ milestones: updatedMilestones });
    }

    setDismissedIds(prev => [...prev, orphan.id]);
  };

  return (
    <div className="bg-white dark:bg-stone-900 border border-amber-100 dark:border-amber-500/20 rounded-3xl shadow-sm overflow-hidden transition-all duration-300">
      {/* Panel Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between p-5 cursor-pointer select-none"
      >
        <div className="flex items-center">
          <AlertCircle className="text-amber-500 w-5 h-5" />
          <span className="font-sans font-bold text-stone-700 dark:text-stone-300 text-sm ml-2">À reprendre</span>
          <span className="bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold text-xs px-2 py-0.5 rounded-full ml-2">
            {visibleOrphans.length}
          </span>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-stone-400 dark:text-stone-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
        />
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
          <p className="text-sm italic text-stone-500 dark:text-stone-400 px-5 pb-4 leading-relaxed">
            Ces éléments attendent peut-être un petit geste de ta part. Reprends-les ou range-les.
          </p>
          <div className="space-y-3 px-5 pb-5">
            {visibleOrphans.map(orphan => (
              <OrphanCard
                key={orphan.id}
                orphan={orphan}
                onReactivate={handleReactivate}
                onArchive={handleArchive}
                onPauseGoal={handlePauseGoal}
                onBreakDown={handleBreakDown}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
