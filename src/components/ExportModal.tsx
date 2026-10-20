import React, { useState, useEffect } from 'react';
import { X, FileText, Table, FileCode, Printer, Check, Download } from 'lucide-react';
import { FullEventPlan } from '../types/event';
import { exportBudgetToCSV, exportPlanToMarkdown } from '../utils/plannerLogic';

interface ExportModalProps {
  plan: FullEventPlan | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ plan, isOpen, onClose }) => {
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !plan) return null;

  const triggerDownload = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportMarkdown = () => {
    const md = exportPlanToMarkdown(plan);
    const safeName = plan.input.eventName.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'event_plan';
    triggerDownload(md, `${safeName}_blueprint.md`, 'text/markdown');
    setDownloadSuccess('md');
    setTimeout(() => setDownloadSuccess(null), 2000);
  };

  const handleExportCSV = () => {
    const csv = exportBudgetToCSV(
      plan.budget.items,
      plan.input.currency,
      plan.budget.totalBudget
    );
    const safeName = plan.input.eventName.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'event_budget';
    triggerDownload(csv, `${safeName}_budget.csv`, 'text/csv');
    setDownloadSuccess('csv');
    setTimeout(() => setDownloadSuccess(null), 2000);
  };

  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(plan, null, 2);
    const safeName = plan.input.eventName.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'event_plan';
    triggerDownload(jsonStr, `${safeName}_master.json`, 'application/json');
    setDownloadSuccess('json');
    setTimeout(() => setDownloadSuccess(null), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
          aria-label="Close Export Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h2 id="export-modal-title" className="text-lg font-bold text-slate-900 dark:text-white">
              Export Celebration Blueprint
            </h2>
            <p className="text-xs text-slate-700 dark:text-slate-300">
              Download deliverables for clients, committees, and vendors
            </p>
          </div>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          {/* Markdown Dossier */}
          <button
            type="button"
            onClick={handleExportMarkdown}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-rose-400 dark:hover:border-rose-600 bg-slate-50 dark:bg-slate-850 hover:bg-rose-50/20 dark:hover:bg-rose-950/20 text-left transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2">
                <FileText className="w-4 h-4" />
              </div>
              <div className="font-bold text-sm text-slate-900 dark:text-white">
                Markdown Dossier (.md)
              </div>
              <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-1">
                Full executive plan with budget tables, run-of-show & concepts.
              </p>
            </div>
            <span className="mt-3 text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
              {downloadSuccess === 'md' ? <Check className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
              {downloadSuccess === 'md' ? 'Downloaded!' : 'Download .md'}
            </span>
          </button>

          {/* Budget CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 bg-slate-50 dark:bg-slate-850 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 text-left transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2">
                <Table className="w-4 h-4" />
              </div>
              <div className="font-bold text-sm text-slate-900 dark:text-white">
                Budget Spreadsheet (.csv)
              </div>
              <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-1">
                Line-item allocations, tips, and totals for Excel or Google Sheets.
              </p>
            </div>
            <span className="mt-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              {downloadSuccess === 'csv' ? <Check className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
              {downloadSuccess === 'csv' ? 'Downloaded!' : 'Download .csv'}
            </span>
          </button>

          {/* JSON Data Object */}
          <button
            type="button"
            onClick={handleExportJSON}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-600 bg-slate-50 dark:bg-slate-850 hover:bg-purple-50/20 dark:hover:bg-purple-950/20 text-left transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-2">
                <FileCode className="w-4 h-4" />
              </div>
              <div className="font-bold text-sm text-slate-900 dark:text-white">
                State Data (.json)
              </div>
              <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-1">
                Full structured data format for backup or external API ingestion.
              </p>
            </div>
            <span className="mt-3 text-xs font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1">
              {downloadSuccess === 'json' ? <Check className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
              {downloadSuccess === 'json' ? 'Downloaded!' : 'Download .json'}
            </span>
          </button>

          {/* Print / PDF */}
          <button
            type="button"
            onClick={handlePrint}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center mb-2">
                <Printer className="w-4 h-4" />
              </div>
              <div className="font-bold text-sm text-slate-900 dark:text-white">
                Print / Save as PDF
              </div>
              <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-1">
                Browser print formatted document for physical event day clipboards.
              </p>
            </div>
            <span className="mt-3 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Printer className="w-3.5 h-3.5" />
              Print View
            </span>
          </button>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
