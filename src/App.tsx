import React, { useState, useEffect } from 'react';
import {
  PieChart,
  Calendar,
  Briefcase,
  Palette,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';
import {
  BudgetItem,
  CrisisScenario,
  EventPlanInput,
  EventVertical,
  FullEventPlan,
  VendorStatus,
} from './types/event';
import { DEMO_PRESETS } from './data/presets';
import { generateEventPlan, getActiveApiKey } from './services/aiPlannerService';
import {
  applyCrisisAdjustment,
  formatCurrency,
  generateDefaultBudgetDistribution,
} from './utils/plannerLogic';
import { Header } from './components/Header';
import { OnboardingForm } from './components/OnboardingForm';
import { BudgetEngine } from './components/BudgetEngine';
import { TimelineEngine } from './components/TimelineEngine';
import { VendorEngine } from './components/VendorEngine';
import { IdeationEngine } from './components/IdeationEngine';
import { ApiKeyModal } from './components/ApiKeyModal';
import { CrisisSimulatorModal } from './components/CrisisSimulatorModal';
import { ExportModal } from './components/ExportModal';

const LOCAL_STORAGE_PLAN_KEY = 'EVENTCRAFT_ACTIVE_PLAN';
const LOCAL_STORAGE_THEME_KEY = 'EVENTCRAFT_THEME';

export const App: React.FC = () => {
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_THEME_KEY);
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Active Plan & Navigation State
  const [activePlan, setActivePlan] = useState<FullEventPlan | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_PLAN_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return null;
        }
      }
    }
    // Default initial landing: start with rich wedding preset for immediate visual preview
    return DEMO_PRESETS.wedding;
  });

  const [currentView, setCurrentView] = useState<'onboarding' | 'dashboard'>('dashboard');
  const [activeTab, setActiveTab] = useState<'budget' | 'timeline' | 'vendors' | 'ideation'>('budget');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasCustomKey, setHasCustomKey] = useState<boolean>(() => Boolean(getActiveApiKey()));
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal visibility states
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [isCrisisModalOpen, setIsCrisisModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Synchronize Dark Mode with DOM
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(LOCAL_STORAGE_THEME_KEY, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(LOCAL_STORAGE_THEME_KEY, 'light');
    }
  }, [darkMode]);

  // Persist Active Plan
  useEffect(() => {
    if (activePlan) {
      localStorage.setItem(LOCAL_STORAGE_PLAN_KEY, JSON.stringify(activePlan));
    }
  }, [activePlan]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleToggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  const handleLoadPreset = (vertical: EventVertical) => {
    const preset = DEMO_PRESETS[vertical];
    setActivePlan(preset);
    setCurrentView('dashboard');
    showToast(`Loaded "${preset.summary.title}" demo preset successfully.`);
  };

  const handleGeneratePlan = async (input: EventPlanInput) => {
    setIsLoading(true);
    try {
      const plan = await generateEventPlan(input);
      setActivePlan(plan);
      setCurrentView('dashboard');
      showToast('Master Blueprint synthesized successfully!');
    } catch (err) {
      console.error('Plan generation failed:', err);
      showToast('Generation encountered an issue; falling back to CSEP blueprint.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateBudgetItems = (newItems: BudgetItem[]) => {
    if (!activePlan) return;
    setActivePlan({
      ...activePlan,
      lastUpdated: new Date().toISOString(),
      source: 'modified',
      budget: {
        ...activePlan.budget,
        items: newItems,
      },
    });
  };

  const handleResetBudgetDistribution = () => {
    if (!activePlan) return;
    const defaultItems = generateDefaultBudgetDistribution(
      activePlan.budget.totalBudget,
      activePlan.input.vertical,
      activePlan.input.priorityWeights,
      activePlan.budget.contingencyPercentage
    );
    handleUpdateBudgetItems(defaultItems);
    showToast('Reset budget allocation to CSEP recommended ratios.');
  };

  const handleToggleMilestone = (id: string) => {
    if (!activePlan) return;
    const updatedMilestones = activePlan.timeline.milestones.map((m) =>
      m.id === id ? { ...m, completed: !m.completed } : m
    );
    setActivePlan({
      ...activePlan,
      lastUpdated: new Date().toISOString(),
      timeline: {
        ...activePlan.timeline,
        milestones: updatedMilestones,
      },
    });
  };

  const handleUpdateVendorStatus = (id: string, status: VendorStatus) => {
    if (!activePlan) return;
    const updatedVendors = activePlan.vendors.map((v) =>
      v.id === id ? { ...v, status } : v
    );
    setActivePlan({
      ...activePlan,
      lastUpdated: new Date().toISOString(),
      vendors: updatedVendors,
    });
    showToast(`Vendor status updated to "${status}".`);
  };

  const handleSelectActiveConcept = (conceptId: string) => {
    if (!activePlan) return;
    setActivePlan({
      ...activePlan,
      lastUpdated: new Date().toISOString(),
      ideation: {
        ...activePlan.ideation,
        activeConceptId: conceptId,
      },
    });
    showToast('Active theme concept updated.');
  };

  const handleApplyCrisis = (scenarioType: CrisisScenario['type']) => {
    if (!activePlan) return;
    const recalculatedPlan = applyCrisisAdjustment(activePlan, scenarioType);
    setActivePlan(recalculatedPlan);
    showToast('Applied What-If contingency adjustments to plan.');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Toast Notification Region */}
      <div
        className="fixed bottom-5 right-5 z-50 pointer-events-none"
        aria-live="polite"
        aria-atomic="true"
      >
        {toastMessage && (
          <div className="pointer-events-auto px-4 py-3 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xl border border-slate-700 dark:border-slate-300 text-xs font-semibold flex items-center gap-2 animate-bounce">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>

      {/* Global Navigation Header */}
      <Header
        onLoadPreset={handleLoadPreset}
        activeVertical={activePlan?.input.vertical}
        hasCustomKey={hasCustomKey}
        onOpenKeyModal={() => setIsKeyModalOpen(true)}
        onOpenCrisisModal={() => setIsCrisisModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        darkMode={darkMode}
        onToggleDarkMode={handleToggleDarkMode}
        onNewPlanClick={() => setCurrentView('onboarding')}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentView === 'onboarding' ? (
          <div>
            {activePlan && (
              <div className="max-w-4xl mx-auto mb-4">
                <button
                  type="button"
                  onClick={() => setCurrentView('dashboard')}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Active Plan Dashboard</span>
                </button>
              </div>
            )}
            <OnboardingForm
              initialValues={activePlan?.input}
              onSubmit={handleGeneratePlan}
              onLoadPreset={handleLoadPreset}
              isLoading={isLoading}
            />
          </div>
        ) : activePlan ? (
          <div className="space-y-6">
            {/* Dashboard Master Banner */}
            <div className="bg-gradient-to-br from-white via-rose-50/30 to-amber-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-rose-950/20 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                      {activePlan.input.vertical.toUpperCase()} BLUEPRINT
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
                      {activePlan.input.setting.toUpperCase()} SETTING
                    </span>
                    <span className="text-xs text-slate-700 dark:text-slate-300">
                      {activePlan.input.cityName} ({activePlan.input.cityTier})
                    </span>
                  </div>

                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {activePlan.summary.title}
                  </h1>

                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 mt-1 max-w-3xl leading-relaxed">
                    {activePlan.summary.tagline}
                  </p>
                </div>

                {/* Key Metrics Quick Ribbon */}
                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  {/* Per Guest Spend Card */}
                  <div className="bg-white/80 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] uppercase font-semibold text-slate-700 dark:text-slate-300 block">
                      Per Guest Allocation
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-sm font-extrabold text-slate-900 dark:text-white font-mono">
                        {formatCurrency(activePlan.summary.perGuestSpend, activePlan.input.currency)}
                      </span>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          activePlan.summary.feasibility.level === 'optimal'
                            ? 'bg-emerald-500'
                            : activePlan.summary.feasibility.level === 'warning'
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        title={`Feasibility: ${activePlan.summary.feasibility.level}`}
                      />
                    </div>
                  </div>

                  {/* Contingency Fund Card */}
                  <div className="bg-white/80 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] uppercase font-semibold text-slate-700 dark:text-slate-300 block">
                      Contingency Reserve
                    </span>
                    <div className="text-sm font-extrabold text-amber-600 dark:text-amber-400 font-mono mt-0.5">
                      {formatCurrency(activePlan.summary.contingencyAmount, activePlan.input.currency)} ({activePlan.budget.contingencyPercentage}%)
                    </div>
                  </div>

                  {/* Edit Parameters Button */}
                  <button
                    onClick={() => setCurrentView('onboarding')}
                    className="px-3.5 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    Edit Context
                  </button>
                </div>
              </div>
            </div>

            {/* Dashboard Tabs Navigation */}
            <nav
              className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto"
              aria-label="Event Planner Engines"
            >
              <button
                onClick={() => setActiveTab('budget')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  activeTab === 'budget'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
                }`}
              >
                <PieChart className="w-4 h-4" />
                <span>Dynamic Budget Allocator</span>
              </button>

              <button
                onClick={() => setActiveTab('timeline')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  activeTab === 'timeline'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Reverse Timeline & Run-of-Show</span>
              </button>

              <button
                onClick={() => setActiveTab('vendors')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  activeTab === 'vendors'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span>Vendor Checklist & RFP Generator</span>
              </button>

              <button
                onClick={() => setActiveTab('ideation')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  activeTab === 'ideation'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
                }`}
              >
                <Palette className="w-4 h-4" />
                <span>Theme Ideas & Menu Concepts</span>
              </button>
            </nav>

            {/* Active Tab Panel */}
            <div className="pt-2">
              {activeTab === 'budget' && (
                <BudgetEngine
                  items={activePlan.budget.items}
                  totalBudget={activePlan.budget.totalBudget}
                  currency={activePlan.budget.currency}
                  contingencyPercentage={activePlan.budget.contingencyPercentage}
                  onUpdateItems={handleUpdateBudgetItems}
                  onResetDistribution={handleResetBudgetDistribution}
                />
              )}

              {activeTab === 'timeline' && (
                <TimelineEngine
                  milestones={activePlan.timeline.milestones}
                  runOfShow={activePlan.timeline.runOfShow}
                  daysRemaining={activePlan.timeline.daysRemaining}
                  isSprintMode={activePlan.timeline.isSprintMode}
                  eventDate={activePlan.input.eventDate}
                  onToggleMilestone={handleToggleMilestone}
                />
              )}

              {activeTab === 'vendors' && (
                <VendorEngine
                  vendors={activePlan.vendors}
                  currency={activePlan.budget.currency}
                  onUpdateVendorStatus={handleUpdateVendorStatus}
                />
              )}

              {activeTab === 'ideation' && (
                <IdeationEngine
                  concepts={activePlan.ideation.concepts}
                  activeConceptId={activePlan.ideation.activeConceptId}
                  onSelectActiveConcept={handleSelectActiveConcept}
                  onOpenCrisisSimulator={() => setIsCrisisModalOpen(true)}
                />
              )}
            </div>
          </div>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 mt-12 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-700 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 dark:text-white">EventCraft AI</span>
            <span>•</span>
            <span>PromptWars Challenge 5 Submission</span>
            <span>•</span>
            <span>Certified Special Events Professional (CSEP) Standard</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsKeyModalOpen(true)}
              className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
            >
              API Key Config
            </button>
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
            >
              Export Blueprint
            </button>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer noopener"
              className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
            >
              GitHub Submission
            </a>
          </div>
        </div>
      </footer>

      {/* Global Modals */}
      <ApiKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        onKeySaved={(hasKey) => {
          setHasCustomKey(hasKey);
          showToast(hasKey ? 'Custom Gemini API Key Connected' : 'Reverted to Instant Demo Preset Mode');
        }}
      />

      <CrisisSimulatorModal
        isOpen={isCrisisModalOpen}
        onClose={() => setIsCrisisModalOpen(false)}
        onApplyCrisis={handleApplyCrisis}
      />

      <ExportModal
        plan={activePlan}
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
};

export default App;
