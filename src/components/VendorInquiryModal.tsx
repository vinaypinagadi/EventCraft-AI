import React, { useState } from 'react';
import { X, Copy, Check, MessageSquare, HelpCircle, AlertTriangle } from 'lucide-react';
import { VendorItem } from '../types/event';

interface VendorInquiryModalProps {
  vendor: VendorItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const VendorInquiryModal: React.FC<VendorInquiryModalProps> = ({
  vendor,
  isOpen,
  onClose,
}) => {
  const [copiedText, setCopiedText] = useState(false);
  const [copiedQuestions, setCopiedQuestions] = useState(false);

  if (!isOpen || !vendor) return null;

  const handleCopyInquiry = () => {
    navigator.clipboard.writeText(vendor.defaultInquiryPrompt);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleCopyAll = () => {
    const fullText = `VENDOR INQUIRY: ${vendor.vendorRole} (${vendor.category})

${vendor.defaultInquiryPrompt}

CRITICAL VETTING QUESTIONS PRIOR TO CONTRACT:
${vendor.vettingQuestions.map((q, idx) => `${idx + 1}. ${q}`).join('\n')}

HIDDEN COST WATCHLIST:
${vendor.hiddenCostWarnings.map((w) => `• ${w}`).join('\n')}`;

    navigator.clipboard.writeText(fullText);
    setCopiedQuestions(true);
    setTimeout(() => setCopiedQuestions(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="vendor-inquiry-title"
    >
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
          aria-label="Close Inquiry Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              {vendor.category} RFP Generator
            </span>
            <h2 id="vendor-inquiry-title" className="text-lg font-bold text-slate-900 dark:text-white">
              {vendor.vendorRole}
            </h2>
          </div>
        </div>

        {/* Inquiry Draft Section */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Outreach Message (Email / WhatsApp RFP)
              </label>
              <button
                type="button"
                onClick={handleCopyInquiry}
                className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
              >
                {copiedText ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy Pitch
                  </>
                )}
              </button>
            </div>
            <textarea
              readOnly
              rows={4}
              value={vendor.defaultInquiryPrompt}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-mono leading-relaxed resize-none focus:outline-none"
            />
          </div>

          {/* Vetting Questions */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              <HelpCircle className="w-4 h-4 text-rose-500" />
              <span>3 Critical Vetting Questions Before Signing</span>
            </div>
            <div className="space-y-2">
              {vendor.vettingQuestions.map((question, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 flex items-start gap-2.5"
                >
                  <span className="w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold text-[11px] flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <p className="mt-0.5 leading-relaxed">{question}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Hidden Costs Warnings */}
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-300 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold uppercase tracking-wide">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              Hidden Cost Alerts for this Category:
            </div>
            <ul className="list-disc pl-5 space-y-0.5 text-[11px] opacity-90">
              {vendor.hiddenCostWarnings.map((warning, idx) => (
                <li key={idx}>{warning}</li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Done
            </button>
            <button
              type="button"
              onClick={handleCopyAll}
              className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-500/20 transition-all flex items-center gap-1.5"
            >
              {copiedQuestions ? (
                <>
                  <Check className="w-4 h-4" />
                  Full RFP Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Complete Dossier
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
