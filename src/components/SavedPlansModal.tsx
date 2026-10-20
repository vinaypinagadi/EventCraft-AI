import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  FolderOpen,
  Plus,
  Copy,
  Trash2,
  Edit2,
  Check,
  Download,
  Upload,
  Calendar,
  Users,
  MapPin,
  DollarSign,
  Crown,
  PartyPopper,
  Trees,
  Sparkles,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { EventVertical, FullEventPlan } from '../types/event';
import { formatCurrency } from '../utils/plannerLogic';
import { validateImportedPlan } from '../utils/planStorage';

interface SavedPlansModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedPlans: FullEventPlan[];
  activePlanId: string;
  onSelectPlan: (planId: string) => void;
  onDuplicatePlan: (planId: string) => void;
  onRenamePlan: (planId: string, newTitle: string) => void;
  onDeletePlan: (planId: string) => void;
  onImportPlan: (plan: FullEventPlan) => void;
  onNewPlanClick: () => void;
}

export const SavedPlansModal: React.FC<SavedPlansModalProps> = ({
  isOpen,
  onClose,
  savedPlans,
  activePlanId,
  onSelectPlan,
  onDuplicatePlan,
  onRenamePlan,
  onDeletePlan,
  onImportPlan,
  onNewPlanClick,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [planToDeleteId, setPlanToDeleteId] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (editingPlanId) {
          setEditingPlanId(null);
        } else if (planToDeleteId) {
          setPlanToDeleteId(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, editingPlanId, planToDeleteId]);

  if (!isOpen) return null;

  const filteredPlans = savedPlans.filter((p) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      p.summary.title.toLowerCase().includes(query) ||
      p.input.eventName.toLowerCase().includes(query) ||
      p.input.cityName.toLowerCase().includes(query) ||
      p.input.vertical.toLowerCase().includes(query)
    );
  });

  const handleStartRename = (plan: FullEventPlan) => {
    setEditingPlanId(plan.id);
    setEditingTitle(plan.summary.title || plan.input.eventName);
  };

  const handleSaveRename = (planId: string) => {
    if (!editingTitle.trim()) return;
    onRenamePlan(planId, editingTitle.trim());
    setEditingPlanId(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const validPlan = validateImportedPlan(parsed);
        if (validPlan) {
          onImportPlan(validPlan);
          setErrorNotice(null);
        } else {
          setErrorNotice('Invalid Event Blueprint file format.');
        }
      } catch (err) {
        setErrorNotice('Could not parse JSON file.');
      }
    };
    reader.readAsText(file);
    // Reset file input so re-uploading same file triggers change
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExportAll = () => {
    const jsonStr = JSON.stringify(savedPlans, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eventcraft_all_plans_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportSingle = (plan: FullEventPlan) => {
    const jsonStr = JSON.stringify(plan, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = (plan.summary.title || 'event_plan').toLowerCase().replace(/[^a-z0-9]/g, '_');
    a.download = `${safeName}_master.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getVerticalIcon = (vertical: EventVertical) => {
    switch (vertical) {
      case 'wedding':
        return <Crown className="w-3.5 h-3.5 text-rose-500" />;
      case 'birthday':
        return <PartyPopper className="w-3.5 h-3.5 text-amber-500" />;
      case 'community':
        return <Trees className="w-3.5 h-3.5 text-emerald-500" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-blue-500" />;
    }
  };

  const getVerticalBadgeColor = (vertical: EventVertical) => {
    switch (vertical) {
      case 'wedding':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-900';
      case 'birthday':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900';
      case 'community':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900';
      default:
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-900';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="saved-plans-title"
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header Bar */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-600 text-white flex items-center justify-center shadow-md shadow-rose-500/20">
              <FolderOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="saved-plans-title" className="text-xl font-bold text-slate-900 dark:text-white">
                  Saved Event Plans Library
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {savedPlans.length} {savedPlans.length === 1 ? 'Event' : 'Events'}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Switch between master blueprints, duplicate scenarios, or import existing event plans
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close Saved Plans Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar & Search */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search plans by name, city..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm"
              title="Import event blueprint from a JSON file"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>Import Plan</span>
            </button>

            <button
              onClick={handleExportAll}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm"
              title="Backup all saved plans into a single JSON file"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Backup All</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onNewPlanClick();
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-md shadow-rose-500/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Event</span>
            </button>
          </div>
        </div>

        {/* Error notification banner if any */}
        {errorNotice && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 flex items-center justify-between text-xs text-red-700 dark:text-red-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span>{errorNotice}</span>
            </div>
            <button
              onClick={() => setErrorNotice(null)}
              className="p-1 hover:bg-red-100 dark:hover:bg-red-900/60 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Plans List / Grid */}
        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-3.5">
          {filteredPlans.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                No event blueprints found
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {searchQuery
                  ? `No events matching "${searchQuery}"`
                  : 'Start by creating your first celebration blueprint.'}
              </p>
            </div>
          ) : (
            filteredPlans.map((plan) => {
              const isActive = plan.id === activePlanId;
              const isEditing = editingPlanId === plan.id;
              const isDeleting = planToDeleteId === plan.id;

              const bookedVendors = plan.vendors.filter((v) => v.status === 'Booked').length;
              const completedMilestones = plan.timeline.milestones.filter((m) => m.completed).length;

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl border p-4.5 transition-all ${
                    isActive
                      ? 'border-rose-500/80 bg-rose-50/20 dark:bg-rose-950/20 shadow-md shadow-rose-500/5 ring-1 ring-rose-500/50'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Main Info */}
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Vertical Pill */}
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold uppercase tracking-wider border ${getVerticalBadgeColor(
                            plan.input.vertical
                          )}`}
                        >
                          {getVerticalIcon(plan.input.vertical)}
                          <span>{plan.input.vertical}</span>
                        </span>

                        {/* Active Pill */}
                        {isActive && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Currently Active</span>
                          </span>
                        )}

                        <span className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Updated {new Date(plan.lastUpdated).toLocaleDateString()}</span>
                        </span>
                      </div>

                      {/* Title & Editable Name */}
                      {isEditing ? (
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRename(plan.id);
                              if (e.key === 'Escape') setEditingPlanId(null);
                            }}
                            autoFocus
                            className="text-base font-bold text-slate-900 dark:text-white px-3 py-1 rounded-lg border border-rose-500 bg-white dark:bg-slate-800 focus:outline-none w-full max-w-md"
                          />
                          <button
                            onClick={() => handleSaveRename(plan.id)}
                            className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                            title="Save Title"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingPlanId(null)}
                            className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 transition-colors"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 group">
                          <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                            {plan.summary.title || plan.input.eventName}
                          </h3>
                          <button
                            onClick={() => handleStartRename(plan)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition-opacity"
                            title="Rename Plan"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">
                        {plan.summary.tagline}
                      </p>

                      {/* Metadata Chips */}
                      <div className="flex items-center gap-4 flex-wrap pt-1 text-xs text-slate-600 dark:text-slate-300">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-rose-500" />
                          <span>{plan.input.eventDate} ({plan.timeline.daysRemaining}d left)</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-blue-500" />
                          <span>{plan.input.guestCount} guests</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-amber-500" />
                          <span>{plan.input.cityName || 'City'} ({plan.input.setting})</span>
                        </span>
                        <span className="flex items-center gap-1 font-bold text-slate-900 dark:text-white">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{formatCurrency(plan.budget.totalBudget, plan.budget.currency)}</span>
                        </span>
                        <span className="text-[11px] text-slate-600 dark:text-slate-400">
                          ({bookedVendors}/{plan.vendors.length} vendors • {completedMilestones}/{plan.timeline.milestones.length} milestones)
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                      {isDeleting ? (
                        <div className="flex items-center gap-2 p-1.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800">
                          <span className="text-xs text-red-700 dark:text-red-300 font-semibold px-1">
                            Delete?
                          </span>
                          <button
                            onClick={() => {
                              onDeletePlan(plan.id);
                              setPlanToDeleteId(null);
                            }}
                            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-red-600 text-white hover:bg-red-700"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setPlanToDeleteId(null)}
                            className="px-2 py-1 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => onDuplicatePlan(plan.id)}
                            className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
                            title="Duplicate Plan"
                          >
                            <Copy className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleExportSingle(plan)}
                            className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
                            title="Export Blueprint JSON"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setPlanToDeleteId(plan.id)}
                            disabled={savedPlans.length <= 1}
                            className={`p-2 rounded-xl transition-colors ${
                              savedPlans.length <= 1
                                ? 'opacity-30 cursor-not-allowed text-slate-400'
                                : 'text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40'
                            }`}
                            title={
                              savedPlans.length <= 1
                                ? 'Cannot delete the only remaining plan'
                                : 'Delete Plan'
                            }
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          {isActive ? (
                            <button
                              onClick={onClose}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Active</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                onSelectPlan(plan.id);
                                onClose();
                              }}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 shadow-md shadow-rose-500/20 transition-all hover:translate-x-0.5"
                            >
                              <span>Switch</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>All plans are automatically saved to your local browser storage</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
