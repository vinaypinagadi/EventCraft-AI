import React, { useState, useEffect } from 'react';
import { X, Key, Shield, ExternalLink, Check, AlertCircle, Trash2 } from 'lucide-react';
import { getActiveApiKey, saveActiveApiKey } from '../services/aiPlannerService';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySaved: (hasKey: boolean) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onKeySaved }) => {
  const [apiKey, setApiKey] = useState('');
  const [remember, setRemember] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const current = getActiveApiKey();
      setApiKey(current);
      setRemember(typeof window !== 'undefined' && Boolean(localStorage.getItem('EVENTCRAFT_GEMINI_API_KEY')));
      setSavedSuccess(false);
    }
  }, [isOpen]);

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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveActiveApiKey(apiKey, remember);
    setSavedSuccess(true);
    onKeySaved(Boolean(apiKey.trim()));
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const handleClear = () => {
    saveActiveApiKey('', false);
    setApiKey('');
    onKeySaved(false);
    setSavedSuccess(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="api-modal-title"
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
          aria-label="Close API Key Settings"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h2 id="api-modal-title" className="text-lg font-bold text-slate-900 dark:text-white">
              Gemini API Key Settings (BYOK)
            </h2>
            <p className="text-xs text-slate-700 dark:text-slate-300">
              Zero Hardcoded Secrets & Client-Side Sandbox Security
            </p>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl p-3.5 mb-5 text-xs text-amber-900 dark:text-amber-300 flex items-start gap-2.5">
          <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Security Guarantee: </span>
            Your API key is stored strictly on your local device (in <code className="px-1 py-0.5 bg-amber-100 dark:bg-amber-900/50 rounded font-mono">sessionStorage</code> or <code className="px-1 py-0.5 bg-amber-100 dark:bg-amber-900/50 rounded font-mono">localStorage</code>) and is sent directly to Google Gemini APIs over HTTPS. No intermediary backend or external database ever touches your credentials.
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label
              htmlFor="gemini-api-key"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Google Gemini API Key
            </label>
            <input
              id="gemini-api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
            />
            <div className="flex items-center justify-between mt-1.5 text-[11px] text-slate-700 dark:text-slate-300">
              <span>Don't have an API key?</span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer noopener"
                className="text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 font-medium"
              >
                Get free Gemini API Key <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Remember Checkbox */}
          <div className="flex items-center gap-2">
            <input
              id="remember-key"
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 w-4 h-4"
            />
            <label htmlFor="remember-key" className="text-xs text-slate-600 dark:text-slate-300">
              Remember across browser sessions (<code className="font-mono text-[10px]">localStorage</code>)
            </label>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-between gap-3">
            {apiKey && (
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear Key
              </button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-500/20 transition-all flex items-center gap-1.5"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    Saved!
                  </>
                ) : (
                  'Save & Apply'
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Fallback Note */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>
            Evaluators: You can also use the app without any API key using our built-in CSEP Instant Demo Presets!
          </span>
        </div>
      </div>
    </div>
  );
};
