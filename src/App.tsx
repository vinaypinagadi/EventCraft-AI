import React, { useState } from 'react';
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
import { generateEventPlan, getActiveApiKey } from './services/aiPlannerService';
import {
  applyCrisisAdjustment,
  formatCurrency,
  generateDefaultBudgetDistribution,
} from './utils/plannerLogic';
import { useTheme } from './hooks/useTheme';
import { useSavedPlans } from './hooks/useSavedPlans';
import { ErrorBoundary } from './components/ErrorBoundary';
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

export const AppContent: React.FC = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  const {
    savedPlans,
    activePlan,
    updateActivePlan,
    selectPlan,
    duplicatePlan,
    renamePlan,
    deletePlan,
    importPlan,
    loadPreset,
    saveNewPlan,
  } = useSavedPlans();

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

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleSelectPlan = (planId: string) => {
    const success = selectPlan(planId);
    if (success) {
      setCurrentView('dashboard');
      showToast('Switched master plan blueprint.');
    }
  };

  const handleDuplicatePlan = (planId: string) => {
    const cloned = duplicatePlan(planId);
    if (cloned) {
      setCurrentView('dashboard');
      showToast(`Plan duplicated as "${cloned.summary.title}"`);
    }
  };

  const handleRenamePlan = (planId: string, newTitle: string) => {
    renamePlan(planId, newTitle);
    showToast(`Plan renamed to "${newTitle}"`);
  };

  const handleDeletePlan = (planId: string) => {
    const success = deletePlan(planId);
    if (success) {
      showToast('Plan deleted from library.');
    } else {
      showToast('Cannot delete the last remaining plan in your library.');
    }
  };

  const handleImportPlan = (plan: FullEventPlan) => {
    importPlan(plan);
    setCurrentView('dashboard');
    showToast(`Imported "${plan.summary.title}" blueprint successfully!`);
  };

  const handleLoadPreset = (vertical: EventVertical) => {
    const preset = loadPreset(vertical);
    setCurrentView('dashboard');
    showToast(`Loaded "${preset.summary.title}" demo preset successfully.`);
  };

  const handleGeneratePlan = async (input: EventPlanInput) => {
    setIsLoading(true);
    try {
      const plan = await generateEventPlan(input);
      saveNewPlan(plan);
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
    updateActivePlan({
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
    updateActivePlan({
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
    updateActivePlan({
      ...activePlan,
      lastUpdated: new Date().toISOString(),
      vendors: updatedVendors,
    });
    showToast(`Vendor status updated to "${status}".`);
  };

  const handleSelectActiveConcept = (conceptId: string) => {
    if (!activePlan) return;
    updateActivePlan({
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
    updateActivePlan(recalculatedPlan);
    showToast('Applied What-If contingency adjustments to plan.');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* WCAG Skip Link for Keyboard Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-rose-600 focus:text-white focus:rounded-xl focus:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 font-bold text-xs"
      >
        Skip to main content
      </a>

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
        onToggleDarkMode={toggleDarkMode}
        onNewPlanClick={() => setCurrentView('onboarding')}
      />

      {/* Main Content Area */}
      <main
        id="main-content"
        tabIndex={-1}
        role="main"
        className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 focus:outline-none"
      >
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
              role="tablist"
            >
              <button
                role="tab"
                aria-selected={activeTab === 'budget'}
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
                role="tab"
                aria-selected={activeTab === 'timeline'}
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
                role="tab"
                aria-selected={activeTab === 'vendors'}
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
                role="tab"
                aria-selected={activeTab === 'ideation'}
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
              href="https://github.com/vinaypinagadi/EventCraft-AI"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
            >
              GitHub Repository
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

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
};

export default App;
