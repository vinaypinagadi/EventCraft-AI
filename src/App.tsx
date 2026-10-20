import React, { useState, useEffect } from 'react';
import {
  PieChart,
  Calendar,
  Briefcase,
  Palette,
  CheckCircle2,
  ArrowLeft,
  FolderOpen,
  Copy,
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
import {
  loadSavedPlans,
  saveSavedPlans,
  loadActivePlanId,
  saveActivePlanId,
  clonePlan,
} from './utils/planStorage';
import { Header } from './components/Header';
import { OnboardingForm } from './components/OnboardingForm';
import { BudgetEngine } from './components/BudgetEngine';
import { TimelineEngine } from './components/TimelineEngine';
import { VendorEngine } from './components/VendorEngine';
import { IdeationEngine } from './components/IdeationEngine';
import { ApiKeyModal } from './components/ApiKeyModal';
import { CrisisSimulatorModal } from './components/CrisisSimulatorModal';
import { ExportModal } from './components/ExportModal';
import { SavedPlansModal } from './components/SavedPlansModal';

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

  // Saved Plans Library & Active Plan State
  const [savedPlans, setSavedPlans] = useState<FullEventPlan[]>(() => loadSavedPlans());
  const [activePlan, setActivePlan] = useState<FullEventPlan | null>(() => {
    const plans = loadSavedPlans();
    const activeId = loadActivePlanId(plans);
    return plans.find((p) => p.id === activeId) || plans[0] || DEMO_PRESETS.wedding;
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
  const [isSavedPlansModalOpen, setIsSavedPlansModalOpen] = useState(false);

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

  // Persist Saved Plans & Active Plan ID
  useEffect(() => {
    saveSavedPlans(savedPlans);
  }, [savedPlans]);

  useEffect(() => {
    if (activePlan) {
      saveActivePlanId(activePlan.id);
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

  /**
   * Helper to update active plan in state and simultaneously update its record in the saved plans library
   */
  const updateActivePlanAndSync = (updatedPlan: FullEventPlan) => {
    setActivePlan(updatedPlan);
    setSavedPlans((prev) =>
      prev.map((p) => (p.id === updatedPlan.id ? updatedPlan : p))
    );
  };

  const handleSelectPlan = (planId: string) => {
    const found = savedPlans.find((p) => p.id === planId);
    if (found) {
      setActivePlan(found);
      saveActivePlanId(planId);
      setCurrentView('dashboard');
      showToast(`Switched to "${found.summary.title}"`);
    }
  };

  const handleDuplicatePlan = (planId: string) => {
    const target = savedPlans.find((p) => p.id === planId);
    if (!target) return;
    const cloned = clonePlan(target);
    setSavedPlans((prev) => [cloned, ...prev]);
    setActivePlan(cloned);
    saveActivePlanId(cloned.id);
    setCurrentView('dashboard');
    showToast(`Plan duplicated as "${cloned.summary.title}"`);
  };

  const handleRenamePlan = (planId: string, newTitle: string) => {
    setSavedPlans((prev) =>
      prev.map((p) => {
        if (p.id === planId) {
          return {
            ...p,
            lastUpdated: new Date().toISOString(),
            input: { ...p.input, eventName: newTitle },
            summary: { ...p.summary, title: newTitle },
          };
        }
        return p;
      })
    );
    if (activePlan?.id === planId) {
      setActivePlan((prev) =>
        prev
          ? {
              ...prev,
              lastUpdated: new Date().toISOString(),
              input: { ...prev.input, eventName: newTitle },
              summary: { ...prev.summary, title: newTitle },
            }
          : null
      );
    }
    showToast(`Plan renamed to "${newTitle}"`);
  };

  const handleDeletePlan = (planId: string) => {
    if (savedPlans.length <= 1) {
      showToast('Cannot delete the last remaining plan in your library.');
      return;
    }
    const remaining = savedPlans.filter((p) => p.id !== planId);
    setSavedPlans(remaining);
    if (activePlan?.id === planId) {
      const nextPlan: FullEventPlan | null = remaining[0] ?? null;
      setActivePlan(nextPlan);
      if (nextPlan) {
        saveActivePlanId(nextPlan.id);
        showToast(`Deleted plan. Active blueprint set to "${nextPlan.summary.title}"`);
      }
    } else {
      showToast('Plan removed from library.');
    }
  };

  const handleImportPlan = (plan: FullEventPlan) => {
    setSavedPlans((prev) => [plan, ...prev.filter((p) => p.id !== plan.id)]);
    setActivePlan(plan);
    saveActivePlanId(plan.id);
    setCurrentView('dashboard');
    showToast(`Imported "${plan.summary.title}" blueprint successfully!`);
  };

  const handleLoadPreset = (vertical: EventVertical) => {
    const preset = DEMO_PRESETS[vertical];
    setSavedPlans((prev) => {
      const exists = prev.some((p) => p.id === preset.id);
      if (!exists) {
        return [preset, ...prev];
      }
      return prev;
    });
    setActivePlan(preset);
    saveActivePlanId(preset.id);
    setCurrentView('dashboard');
    showToast(`Loaded "${preset.summary.title}" demo preset successfully.`);
  };

  const handleGeneratePlan = async (input: EventPlanInput) => {
    setIsLoading(true);
    try {
      const plan = await generateEventPlan(input);
      setSavedPlans((prev) => [plan, ...prev.filter((p) => p.id !== plan.id)]);
      setActivePlan(plan);
      saveActivePlanId(plan.id);
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
    updateActivePlanAndSync({
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
    updateActivePlanAndSync({
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
    updateActivePlanAndSync({
      ...activePlan,
      lastUpdated: new Date().toISOString(),
      vendors: updatedVendors,
    });
    showToast(`Vendor status updated to "${status}".`);
  };

  const handleSelectActiveConcept = (conceptId: string) => {
    if (!activePlan) return;
    updateActivePlanAndSync({
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
    updateActivePlanAndSync(recalculatedPlan);
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
        onOpenSavedPlansModal={() => setIsSavedPlansModalOpen(true)}
        savedPlansCount={savedPlans.length}
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

                  {/* Duplicate Plan Action */}
                  <button
                    onClick={() => handleDuplicatePlan(activePlan.id)}
                    className="flex items-center gap-1.5 px-3 py-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors shadow-sm"
                    title="Duplicate this plan to test alternative budgets or ideas"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span className="hidden sm:inline">Duplicate</span>
                  </button>

                  {/* Switch / View Saved Plans Button */}
                  <button
                    onClick={() => setIsSavedPlansModalOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-3 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-xs font-bold border border-rose-200 dark:border-rose-900 transition-colors shadow-sm"
                    title="Open Saved Plans Manager"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>My Plans ({savedPlans.length})</span>
                  </button>

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

      <SavedPlansModal
        isOpen={isSavedPlansModalOpen}
        onClose={() => setIsSavedPlansModalOpen(false)}
        savedPlans={savedPlans}
        activePlanId={activePlan?.id || ''}
        onSelectPlan={handleSelectPlan}
        onDuplicatePlan={handleDuplicatePlan}
        onRenamePlan={handleRenamePlan}
        onDeletePlan={handleDeletePlan}
        onImportPlan={handleImportPlan}
        onNewPlanClick={() => {
          setIsSavedPlansModalOpen(false);
          setCurrentView('onboarding');
        }}
      />
    </div>
  );
};

export default App;
