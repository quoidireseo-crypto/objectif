import React, { useState } from 'react';
import { History, ChevronDown } from 'lucide-react';
import { AppData } from '../types';
import { useGoalHistory } from '../hooks/useGoalHistory';

interface GoalHistoryTimelineProps {
  goalId: string;
  data: AppData;
  updateData: (data: Partial<AppData>) => void;
  onClose?: () => void;
}

const DOT_COLORS: Record<string, string> = {
  'created': 'bg-emerald-400',
  'achieved': 'bg-emerald-600',
  'reactivated': 'bg-emerald-500',
  'paused': 'bg-stone-400',
  'title-changed': 'bg-blue-400',
  'why-changed': 'bg-indigo-400',
  'milestone-added': 'bg-amber-400',
  'milestone-completed': 'bg-amber-500',
  'deadline-changed': 'bg-orange-400',
  'domain-changed': 'bg-stone-400',
  'status-changed': 'bg-stone-500',
};

export function GoalHistoryTimeline({ goalId, data, updateData, onClose }: GoalHistoryTimelineProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { getHistoryForGoal, clearHistoryForGoal } = useGoalHistory(data, updateData);

  const entries = getHistoryForGoal(goalId);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    const isConfirmed = window.confirm("Effacer tout l'historique de cet objectif ?");
    if (isConfirmed) {
      clearHistoryForGoal(goalId);
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between cursor-pointer py-3 border-t border-stone-100 mt-4 select-none"
      >
        <div className="flex items-center">
          <History className="w-4 h-4 text-stone-400" />
          <span className="font-sans text-xs font-bold uppercase tracking-widest text-stone-500 ml-2">
            Trace du cheminement
          </span>
          <span className="bg-stone-100 text-stone-500 text-[10px] font-sans px-2 py-0.5 rounded-full ml-2">
            {entries.length} modification{entries.length > 1 ? 's' : ''}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-stone-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
        />
      </div>

      {/* Expanded Timeline Content */}
      {isExpanded && (
        <div className="animate-in fade-in slide-in-from-top-1 duration-200">
          {entries.length === 0 ? (
            <p className="text-sm italic text-stone-400 text-center py-4">
              Aucun historique pour le moment.<br /> Les modifications futures seront tracées ici.
            </p>
          ) : (
            <>
              <div className="mt-3 space-y-0 max-h-64 overflow-y-auto hidden-scrollbar pb-2">
                {entries.map((entry, index) => {
                  const isCreated = entry.changeType === 'created';
                  const isAchieved = entry.changeType === 'achieved';
                  const dotColor = DOT_COLORS[entry.changeType] || 'bg-stone-400';
                  const isLast = index === entries.length - 1;

                  return (
                    <div key={entry.id} className="relative flex items-start gap-3 pb-4 last:pb-0">
                      {/* Vertical Connecting Line */}
                      {!isLast && (
                        <div className="absolute left-[7px] top-4 bottom-0 w-px bg-stone-100" />
                      )}

                      {/* Timeline Dot */}
                      <div
                        className={`rounded-full shrink-0 z-10 relative ${
                          isCreated ? 'w-4 h-4 -ml-[1px]' : 'w-3.5 h-3.5'
                        } mt-1 ${dotColor}`}
                      />

                      {/* Text Content */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-serif text-sm leading-snug text-stone-750 ${
                            isCreated ? 'font-bold text-stone-800' : 'text-stone-700'
                          }`}
                        >
                          {isAchieved && <span className="text-emerald-600 mr-1">✦</span>}
                          {entry.description}
                        </p>
                        <p className="font-sans text-[10px] text-stone-400 mt-1">
                          {entry.date}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Clear History Button */}
              <div className="flex justify-end mt-2 pt-2 border-t border-stone-100/50">
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-[10px] text-stone-300 font-sans hover:text-red-400 transition cursor-pointer underline"
                >
                  Effacer l'historique
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
