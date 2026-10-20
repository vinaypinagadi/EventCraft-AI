import React, { useEffect } from 'react';
import {
  X,
  Zap,
  Users,
  CloudRain,
  TrendingDown,
  AlertOctagon,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { CrisisScenario } from '../types/event';

interface CrisisSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyCrisis: (scenarioType: CrisisScenario['type']) => void;
}

const SCENARIOS: CrisisScenario[] = [
  {
    id: 'sc-1',
    title: 'Guest Headcount Surges (+25%)',
    description: 'RSVP confirmations suddenly exceed expectations by 25%.',
    type: 'guest_spike',
    impactDescription:
      'Recalculates per-guest spending feasibility, triggers immediate scaled catering batch adjustments, and inserts urgent seating order milestones.',
  },
  {
    id: 'sc-2',
    title: 'Severe Wet Weather / Rain Forecast',
    description: 'Meteorological advisory forecasts 85% probability of heavy precipitation on event day.',
    type: 'rain_forecast',
    impactDescription:
      'Switches layout to indoor/covered mode, deploys 40% of emergency contingency fund to marquee hire, and updates Run-of-Show logistics to waterproof zones.',
  },
  {
    id: 'sc-3',
    title: 'Total Budget Cut by 15%',
    description: 'Client or stakeholder reduces available financing by 15% due to fiscal constraints.',
    type: 'budget_cut',
    impactDescription:
      'Deterministically protects the 10% emergency contingency and primary catering quality while re-allocating non-critical decor and entertainment percentages.',
  },
  {
    id: 'sc-4',
    title: 'Critical Vendor Cancellation',
    description: 'Primary high-priority vendor experiences unforeseen equipment loss or illness 72h prior.',
    type: 'vendor_cancel',
    impactDescription:
      'Escalates vendor status to urgent replacement, crafts immediate expedited RFP inquiry broadcast, and flags milestone on the master timeline.',
  },
];

export const CrisisSimulatorModal: React.FC<CrisisSimulatorModalProps> = ({
  isOpen,
  onClose,
  onApplyCrisis,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelect = (type: CrisisScenario['type']) => {
    onApplyCrisis(type);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="crisis-modal-title"
    >
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
          aria-label="Close Simulator"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 id="crisis-modal-title" className="text-lg font-bold text-slate-900 dark:text-white">
              "What-If" Crisis Simulator & Stress Tester
            </h2>
            <p className="text-xs text-slate-700 dark:text-slate-300">
              CSEP Automated Contingency Protocol & Real-Time Plan Recalibration
            </p>
          </div>
        </div>

        {/* Advisory */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 mb-5 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>
            Select a live scenario below to stress-test your master plan. The deterministic CSEP engine will adapt budgets, safety buffers, and timelines in real time.
          </span>
        </div>

        {/* Scenarios Grid */}
        <div className="space-y-3">
          {SCENARIOS.map((scenario) => {
            const icon =
              scenario.type === 'guest_spike' ? (
                <Users className="w-5 h-5 text-blue-500" />
              ) : scenario.type === 'rain_forecast' ? (
                <CloudRain className="w-5 h-5 text-cyan-500" />
              ) : scenario.type === 'budget_cut' ? (
                <TrendingDown className="w-5 h-5 text-amber-500" />
              ) : (
                <AlertOctagon className="w-5 h-5 text-red-500" />
              );

            return (
              <div
                key={scenario.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-600 bg-white dark:bg-slate-850 hover:bg-amber-50/20 dark:hover:bg-amber-950/10 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                    {icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      {scenario.title}
                    </h3>
                    <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">
                      {scenario.description}
                    </p>
                    <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium mt-1">
                      {scenario.impactDescription}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelect(scenario.type)}
                  className="sm:self-center px-4 py-2 rounded-xl text-xs font-bold text-amber-900 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-200 dark:hover:bg-amber-900 border border-amber-300 dark:border-amber-800 transition-colors flex items-center justify-center gap-1.5 shrink-0"
                >
                  <span>Simulate & Recalculate</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
