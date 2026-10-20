import React, { useState } from 'react';
import {
  Briefcase,
  AlertTriangle,
  MessageSquare,
  CheckCircle2,
  Clock,
  Filter,
  ShieldAlert,
} from 'lucide-react';
import { Currency, VendorCriticality, VendorItem, VendorStatus } from '../types/event';
import { formatCurrency } from '../utils/plannerLogic';
import { VendorInquiryModal } from './VendorInquiryModal';

interface VendorEngineProps {
  vendors: VendorItem[];
  currency: Currency;
  onUpdateVendorStatus: (id: string, status: VendorStatus) => void;
}

const STATUS_OPTIONS: VendorStatus[] = [
  'Not Started',
  'Shortlisted',
  'Contract Sent',
  'Booked',
];

export const VendorEngine: React.FC<VendorEngineProps> = ({
  vendors,
  currency,
  onUpdateVendorStatus,
}) => {
  const [criticalityFilter, setCriticalityFilter] = useState<'All' | VendorCriticality>('All');
  const [selectedVendorForModal, setSelectedVendorForModal] = useState<VendorItem | null>(null);

  const filteredVendors = criticalityFilter === 'All'
    ? vendors
    : vendors.filter((v) => v.criticality === criticalityFilter);

  const bookedCount = vendors.filter((v) => v.status === 'Booked').length;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-rose-500" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Smart Vendor Checklist & Procurement Tracker
              </h2>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">
              Prioritized procurement matrix with hidden cost protections and instant 1-click vendor inquiry drafts.
            </p>
          </div>

          {/* Stats Badge */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{bookedCount} of {vendors.length} Booked</span>
            </span>
          </div>
        </div>

        {/* CSEP Advisory Alert */}
        <div className="mt-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
          <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-900 dark:text-white">CSEP Vetting Rule: </span>
            Never sign vendor retainers without written clauses addressing overtime rates, weather contingency obligations, and meal/break provisions for working crew members.
          </div>
        </div>

        {/* Filter Bar */}
        <div className="mt-5 flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
            <Filter className="w-3.5 h-3.5" />
            <span className="font-semibold">Filter by Criticality:</span>
          </div>
          <div className="flex items-center gap-1">
            {(['All', 'High', 'Medium', 'Low'] as const).map((crit) => (
              <button
                key={crit}
                onClick={() => setCriticalityFilter(crit)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  criticalityFilter === crit
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {crit}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Vendor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredVendors.map((vendor) => (
          <div
            key={vendor.id}
            className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between transition-all"
          >
            <div>
              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-2.5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                      {vendor.category}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide ${
                        vendor.criticality === 'High'
                          ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                          : vendor.criticality === 'Medium'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {vendor.criticality} Criticality
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {vendor.vendorRole}
                  </h3>
                </div>

                {/* Estimated Budget */}
                <div className="text-right shrink-0">
                  <span className="text-[10px] uppercase tracking-wider text-slate-700 dark:text-slate-300 font-semibold block">
                    Est. Budget
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                    {formatCurrency(vendor.estimatedBudget, currency)}
                  </span>
                </div>
              </div>

              {/* Status Selector */}
              <div className="my-3 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Status:
                </span>
                <select
                  value={vendor.status}
                  onChange={(e) => onUpdateVendorStatus(vendor.id, e.target.value as VendorStatus)}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-lg border focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                    vendor.status === 'Booked'
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300'
                      : vendor.status === 'Contract Sent'
                      ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-300'
                      : vendor.status === 'Shortlisted'
                      ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              {/* Hidden Cost Traps Preview */}
              {vendor.hiddenCostWarnings.length > 0 && (
                <div className="mb-4 space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Hidden Cost Watchlist:
                  </span>
                  <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1 pl-4 list-disc">
                    {vendor.hiddenCostWarnings.map((cost, idx) => (
                      <li key={idx} className="leading-snug">
                        {cost}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setSelectedVendorForModal(vendor)}
                className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900 transition-colors flex items-center justify-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Draft Inquiry & Vetting Questions</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Inquiry Modal */}
      <VendorInquiryModal
        vendor={selectedVendorForModal}
        isOpen={Boolean(selectedVendorForModal)}
        onClose={() => setSelectedVendorForModal(null)}
      />
    </div>
  );
};
