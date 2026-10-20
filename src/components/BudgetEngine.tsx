import React from 'react';
import {
  Lock,
  Unlock,
  Lightbulb,
  Shield,
  PieChart,
  RotateCcw,
} from 'lucide-react';
import { BudgetItem, Currency } from '../types/event';
import { formatCurrency, rebalanceBudget } from '../utils/plannerLogic';

interface BudgetEngineProps {
  items: BudgetItem[];
  totalBudget: number;
  currency: Currency;
  contingencyPercentage: number;
  onUpdateItems: (newItems: BudgetItem[]) => void;
  onResetDistribution: () => void;
}

const CATEGORY_COLORS: Record<BudgetItem['category'], { bar: string; badge: string; border: string }> = {
  venue: {
    bar: 'bg-rose-500',
    badge: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-900',
  },
  catering: {
    bar: 'bg-amber-500',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-900',
  },
  decor: {
    bar: 'bg-pink-500',
    badge: 'bg-pink-100 text-pink-800 dark:bg-pink-950/60 dark:text-pink-300',
    border: 'border-pink-200 dark:border-pink-900',
  },
  entertainment: {
    bar: 'bg-purple-500',
    badge: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-900',
  },
  logistics: {
    bar: 'bg-blue-500',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-900',
  },
  contingency: {
    bar: 'bg-emerald-500',
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-900',
  },
};

export const BudgetEngine: React.FC<BudgetEngineProps> = ({
  items,
  totalBudget,
  currency,
  contingencyPercentage,
  onUpdateItems,
  onResetDistribution,
}) => {
  const totalPercentage = items.reduce((sum, item) => sum + item.percentage, 0);
  const roundedTotalPercentage = Math.round(totalPercentage * 10) / 10;

  const handlePercentageChange = (id: string, newPercentage: number) => {
    const updated = rebalanceBudget(items, id, newPercentage, totalBudget);
    onUpdateItems(updated);
  };

  const toggleLock = (id: string) => {
    const updated = items.map((item) =>
      item.id === id ? { ...item, locked: !item.locked } : item
    );
    onUpdateItems(updated);
  };

  return (
    <div className="space-y-6">
      {/* Top Summary Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-rose-500" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Dynamic Budget Allocator ({roundedTotalPercentage}% Allocated)
              </h2>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">
              Lock fixed commitments and adjust flexible categories. Unlocked pillars automatically rebalance to guarantee a balanced budget.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onResetDistribution}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
              title="Reset to recommended CSEP distribution"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Ratios</span>
            </button>
            <div className="text-right">
              <span className="text-[11px] uppercase tracking-wider text-slate-700 dark:text-slate-300 font-semibold block">
                Total Budget
              </span>
              <span className="text-lg font-black text-rose-600 dark:text-rose-400 font-mono">
                {formatCurrency(totalBudget, currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Stacked Progress Visualizer */}
        <div className="space-y-2">
          <div className="h-4 w-full rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 flex shadow-inner">
            {items.map((item) => (
              <div
                key={item.id}
                style={{ width: `${Math.max(1, item.percentage)}%` }}
                className={`${CATEGORY_COLORS[item.category]?.bar || 'bg-slate-500'} transition-all duration-300 relative group`}
                title={`${item.name}: ${item.percentage.toFixed(1)}% (${formatCurrency(item.allocatedAmount, currency)})`}
              />
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-600 dark:text-slate-400">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${CATEGORY_COLORS[item.category]?.bar}`} />
                <span className="font-medium text-slate-700 dark:text-slate-300 capitalize">
                  {item.category}:
                </span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">
                  {item.percentage.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contingency Safety Notice */}
      <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300">
              Contingency Reserve: {contingencyPercentage}% ({formatCurrency((contingencyPercentage / 100) * totalBudget, currency)})
            </div>
            <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80">
              CSEP standard practice locks 8%–12% to cushion against sudden weather shelter requirements, sound licensing overtime, and late attendee surges.
            </p>
          </div>
        </div>
        <div className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 shrink-0">
          Protected
        </div>
      </div>

      {/* Grid of Budget Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item) => {
          const styling = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.venue;

          return (
            <div
              key={item.id}
              className={`bg-white dark:bg-slate-900 rounded-2xl p-5 border ${styling.border} shadow-sm flex flex-col justify-between transition-all`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-1 ${styling.badge}`}>
                      {item.category}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                      {item.name}
                    </h3>
                  </div>

                  {/* Lock/Unlock Button */}
                  <button
                    onClick={() => toggleLock(item.id)}
                    className={`p-1.5 rounded-lg border transition-colors ${
                      item.locked
                        ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                        : 'bg-slate-50 text-slate-400 border-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                    title={item.locked ? 'Locked: Percentage will not change during auto-rebalance' : 'Unlocked: Click to lock this percentage'}
                    aria-label={item.locked ? `Unlock ${item.name}` : `Lock ${item.name}`}
                  >
                    {item.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Amount & Percentage Row */}
                <div className="flex items-baseline justify-between mb-3 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-xs text-slate-700 dark:text-slate-300">Allocated Amount:</span>
                  <div className="text-right">
                    <span className="text-base font-extrabold text-slate-900 dark:text-white font-mono">
                      {formatCurrency(item.allocatedAmount, currency)}
                    </span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1.5 font-mono">
                      ({item.percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>

                {/* Slider */}
                <div className="space-y-1.5 mb-3">
                  <div className="flex justify-between text-[11px] text-slate-700 dark:text-slate-300">
                    <span>Adjust Share</span>
                    <span className="font-mono">{item.percentage.toFixed(1)}%</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="65"
                    step="0.5"
                    disabled={item.locked}
                    value={item.percentage}
                    onChange={(e) => handlePercentageChange(item.id, Number(e.target.value))}
                    className={`w-full accent-rose-500 cursor-pointer ${item.locked ? 'opacity-40 cursor-not-allowed' : ''}`}
                  />
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 mb-3">{item.notes}</p>
              </div>

              {/* Cost Saving Tip */}
              {item.costSavingTip && (
                <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/50 rounded-xl p-3 text-xs text-amber-900 dark:text-amber-300 flex items-start gap-2 mt-2">
                  <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-amber-800 dark:text-amber-300">Cost Saving Tip: </span>
                    {item.costSavingTip}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
