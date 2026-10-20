import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  Zap,
  MapPin,
  User,
  ListFilter,
} from 'lucide-react';
import { RunOfShowItem, TimelineMilestone } from '../types/event';

interface TimelineEngineProps {
  milestones: TimelineMilestone[];
  runOfShow: RunOfShowItem[];
  daysRemaining: number;
  isSprintMode: boolean;
  eventDate: string;
  onToggleMilestone: (id: string) => void;
}

export const TimelineEngine: React.FC<TimelineEngineProps> = ({
  milestones,
  runOfShow,
  daysRemaining,
  isSprintMode,
  eventDate,
  onToggleMilestone,
}) => {
  const [activeTab, setActiveTab] = useState<'macro' | 'micro'>('macro');
  const [filterCriticalOnly, setFilterCriticalOnly] = useState(false);

  const completedCount = milestones.filter((m) => m.completed).length;
  const progressPercent = Math.round((completedCount / (milestones.length || 1)) * 100);

  const displayedMilestones = filterCriticalOnly
    ? milestones.filter((m) => m.critical)
    : milestones;

  return (
    <div className="space-y-6">
      {/* View Switcher & Timeline Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-rose-500" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Reverse-Engineered Event Timeline
              </h2>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">
              Engineered backwards from target date <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono">{eventDate}</span>. Tracks macro countdown deadlines and micro day-of run-of-show logistics.
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('macro')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'macro'
                  ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Macro Countdown</span>
            </button>
            <button
              onClick={() => setActiveTab('micro')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'micro'
                  ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Day-Of Run-of-Show</span>
            </button>
          </div>
        </div>

        {/* Sprint Mode / Days Remaining Callout */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-black font-mono text-sm ${
                isSprintMode
                  ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 animate-pulse'
                  : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
              }`}
            >
              {daysRemaining}d
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  {daysRemaining > 0 ? `${daysRemaining} Days Until Event` : 'Event Day / Concluded'}
                </span>
                {isSprintMode && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-300 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-red-600 dark:text-red-400" />
                    Sprint Mode Active (&lt; 14 Days)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300">
                {isSprintMode
                  ? 'High-urgency daily cadence enabled. Critical operational tasks prioritized.'
                  : 'Strategic macro milestone checkpoints scheduled across preparatory phases.'}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-3 min-w-[200px]">
            <div className="flex-1">
              <div className="flex justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <span>Milestones Completed</span>
                <span className="font-mono">
                  {completedCount}/{milestones.length} ({progressPercent}%)
                </span>
              </div>
              <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* View 1: Macro Countdown Milestones */}
      {activeTab === 'macro' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 px-1">
            <span className="font-medium">
              Showing {displayedMilestones.length} milestones
            </span>
            <button
              onClick={() => setFilterCriticalOnly(!filterCriticalOnly)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-colors ${
                filterCriticalOnly
                  ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900 font-semibold'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>{filterCriticalOnly ? 'Showing Critical Only' : 'Filter Critical Only'}</span>
            </button>
          </div>

          <div className="space-y-3">
            {displayedMilestones.map((milestone) => (
              <div
                key={milestone.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border transition-all ${
                  milestone.completed
                    ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/20 dark:bg-emerald-950/10'
                    : milestone.critical
                    ? 'border-rose-200 dark:border-rose-900/70'
                    : 'border-slate-200 dark:border-slate-800'
                } shadow-sm flex items-start gap-3.5`}
              >
                {/* Completion Checkbox */}
                <button
                  onClick={() => onToggleMilestone(milestone.id)}
                  className="mt-0.5 text-slate-400 hover:text-emerald-600 dark:text-slate-500 dark:hover:text-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 rounded"
                  aria-label={
                    milestone.completed
                      ? `Mark ${milestone.title} as incomplete`
                      : `Mark ${milestone.title} as completed`
                  }
                >
                  {milestone.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-50 dark:fill-emerald-950" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </button>

                {/* Milestone Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {milestone.timeframe}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300">
                      {milestone.category}
                    </span>
                    {milestone.critical && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                        Critical
                      </span>
                    )}
                    <span className="text-[11px] text-slate-700 dark:text-slate-300 font-mono ml-auto">
                      Due: {milestone.dueDate}
                    </span>
                  </div>

                  <h3
                    className={`font-bold text-sm ${
                      milestone.completed
                        ? 'line-through text-slate-400 dark:text-slate-500'
                        : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {milestone.title}
                  </h3>

                  <p
                    className={`text-xs mt-1 leading-relaxed ${
                      milestone.completed
                        ? 'text-slate-400 dark:text-slate-500'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {milestone.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View 2: Micro Day-Of Run-of-Show */}
      {activeTab === 'micro' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-rose-500" />
              Day-Of Run-of-Show Master Protocol
            </h3>
            <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">
              Precision execution timeline for leads, vendors, and coordinators on event day.
            </p>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {runOfShow.map((item, idx) => (
              <div
                key={item.id || idx}
                className="p-4 sm:p-5 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors flex flex-col sm:flex-row sm:items-start gap-4"
              >
                {/* Time Badge */}
                <div className="sm:w-32 shrink-0">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold font-mono bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                    <Clock className="w-3 h-3 text-rose-500" />
                    {item.time}
                  </span>
                </div>

                {/* Details */}
                <div className="flex-1 space-y-1.5">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    {item.activity}
                  </h4>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-700 dark:text-slate-300">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <strong className="font-semibold text-slate-700 dark:text-slate-300">Lead:</strong>{' '}
                      {item.owner}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <strong className="font-semibold text-slate-700 dark:text-slate-300">Zone:</strong>{' '}
                      {item.location}
                    </span>
                  </div>

                  {item.notes && (
                    <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 mt-2">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Operational Note: </span>
                      {item.notes}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
