import React from 'react';
import {
  Sparkles,
  Key,
  ShieldCheck,
  Zap,
  Download,
  Moon,
  Sun,
  Crown,
  PartyPopper,
  Trees,
  CheckCircle2,
  FolderOpen,
} from 'lucide-react';
import { EventVertical } from '../types/event';

interface HeaderProps {
  onLoadPreset: (vertical: EventVertical) => void;
  activeVertical?: EventVertical;
  hasCustomKey: boolean;
  onOpenKeyModal: () => void;
  onOpenCrisisModal: () => void;
  onOpenExportModal: () => void;
  onOpenSavedPlansModal: () => void;
  savedPlansCount: number;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onNewPlanClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onLoadPreset,
  activeVertical,
  hasCustomKey,
  onOpenKeyModal,
  onOpenCrisisModal,
  onOpenExportModal,
  onOpenSavedPlansModal,
  savedPlansCount,
  darkMode,
  onToggleDarkMode,
  onNewPlanClick,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={onNewPlanClick}
              className="flex items-center gap-2.5 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 rounded-lg p-1"
              aria-label="EventCraft AI Home - Plan a new celebration"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-pink-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-slate-900 via-rose-900 to-slate-900 dark:from-white dark:via-rose-200 dark:to-white bg-clip-text text-transparent">
                    EventCraft AI
                  </span>
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                    <ShieldCheck className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                    CSEP
                  </span>
                </div>
                <p className="text-[11px] text-slate-700 dark:text-slate-300 hidden sm:block">
                  Certified Special Events Intelligence
                </p>
              </div>
            </button>
          </div>

          {/* Instant Preset Evaluator Pills */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 px-2 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              Instant Demo Presets:
            </span>
            <button
              onClick={() => onLoadPreset('wedding')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                activeVertical === 'wedding'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700'
              }`}
              title="Load Royal Heritage Fusion Wedding (220 guests, Jaipur, ₹28L)"
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Wedding</span>
            </button>
            <button
              onClick={() => onLoadPreset('birthday')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                activeVertical === 'birthday'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700'
              }`}
              title="Load Cyberpunk Neon Loft 30th Birthday (65 guests, Austin, $4,200)"
            >
              <PartyPopper className="w-3.5 h-3.5" />
              <span>Birthday</span>
            </button>
            <button
              onClick={() => onLoadPreset('community')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                activeVertical === 'community'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700'
              }`}
              title="Load Oakridge Valley Eco-Harvest Community Fair (650 guests, $11,500)"
            >
              <Trees className="w-3.5 h-3.5" />
              <span>Community</span>
            </button>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2">
            {/* Saved Plans Manager */}
            <button
              onClick={onOpenSavedPlansModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 shadow-sm"
              title="Manage and switch between saved event blueprints"
              aria-label={`Open Saved Events Library (${savedPlansCount} saved)`}
            >
              <FolderOpen className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span className="hidden sm:inline font-bold">My Plans</span>
              <span className="px-1.5 py-0.2 text-[10px] font-extrabold rounded-md bg-rose-200/80 dark:bg-rose-900/80 text-rose-900 dark:text-rose-200">
                {savedPlansCount}
              </span>
            </button>

            {/* What-If Crisis Simulator */}
            <button
              onClick={onOpenCrisisModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              title="Test crisis mitigation: Guest count surges, rain forecast, budget cuts"
            >
              <Zap className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="hidden md:inline font-semibold">What-If Co-Pilot</span>
            </button>

            {/* Export Blueprint */}
            <button
              onClick={onOpenExportModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
              title="Export complete master plan as JSON, CSV, or Markdown"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>

            {/* BYOK API Key Button */}
            <button
              onClick={onOpenKeyModal}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 ${
                hasCustomKey
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
              title={hasCustomKey ? 'Custom Gemini API Key Connected' : 'Free Demo Mode Active (Click to add your Gemini API Key)'}
              aria-label="Manage Gemini API Key"
            >
              <Key className={`w-3.5 h-3.5 ${hasCustomKey ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`} />
              <span className="hidden sm:inline font-medium">
                {hasCustomKey ? 'API Key Active' : 'API Key / Demo'}
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  hasCustomKey ? 'bg-emerald-500' : 'bg-amber-400'
                }`}
                aria-hidden="true"
              />
            </button>

            {/* Dark / Light Toggle */}
            <button
              onClick={onToggleDarkMode}
              className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
