import React, { useState } from 'react';
import {
  Sparkles,
  Palette,
  UtensilsCrossed,
  PartyPopper,
  Check,
  Copy,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { ThemeConcept } from '../types/event';

interface IdeationEngineProps {
  concepts: ThemeConcept[];
  activeConceptId?: string;
  onSelectActiveConcept: (conceptId: string) => void;
  onOpenCrisisSimulator: () => void;
}

export const IdeationEngine: React.FC<IdeationEngineProps> = ({
  concepts,
  activeConceptId,
  onSelectActiveConcept,
  onOpenCrisisSimulator,
}) => {
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const handleCopyColor = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-rose-500" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Personalized Creative Themes & Culinary Blueprints
              </h2>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">
              Select your favorite curated aesthetic. Each concept includes harmonious color palettes, signature menus, and memorable guest engagement touchpoints.
            </p>
          </div>

          {/* Quick Trigger to Crisis Simulator */}
          <button
            onClick={onOpenCrisisSimulator}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors shadow-sm self-start sm:self-auto"
          >
            <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Launch "What-If" Crisis Co-Pilot</span>
          </button>
        </div>
      </div>

      {/* Concept Cards Carousel/Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {concepts.map((concept, idx) => {
          const isSelected = activeConceptId === concept.id || (!activeConceptId && idx === 0);

          return (
            <div
              key={concept.id}
              className={`bg-white dark:bg-slate-900 rounded-2xl p-5 border flex flex-col justify-between transition-all ${
                isSelected
                  ? 'border-rose-500 ring-2 ring-rose-500/20 shadow-md'
                  : 'border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div>
                {/* Concept Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                      Option {idx + 1}
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-snug">
                      {concept.name}
                    </h3>
                  </div>

                  {isSelected && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                      Active
                    </span>
                  )}
                </div>

                <p className="text-xs italic text-rose-800/90 dark:text-rose-300/90 font-medium mb-2">
                  "{concept.tagline}"
                </p>

                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                  {concept.description}
                </p>

                {/* Color Swatches */}
                <div className="mb-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1 mb-2">
                    <Palette className="w-3.5 h-3.5 text-rose-500" />
                    Color Palette (Click to Copy):
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    {concept.colorPalette.map((color) => (
                      <button
                        key={color.hex}
                        type="button"
                        onClick={() => handleCopyColor(color.hex)}
                        className="group flex flex-col items-center p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-rose-400 transition-all text-center focus:outline-none focus:ring-1 focus:ring-rose-500"
                        title={`Copy ${color.name} (${color.hex})`}
                      >
                        <div
                          className="w-full h-8 rounded-lg shadow-inner mb-1 flex items-center justify-center text-white"
                          style={{ backgroundColor: color.hex }}
                        >
                          {copiedHex === color.hex ? (
                            <Check className="w-3 h-3 stroke-[3]" />
                          ) : (
                            <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </div>
                        <span className="text-[10px] font-bold truncate max-w-full text-slate-900 dark:text-white">
                          {color.name}
                        </span>
                        <span className="text-[9px] font-mono text-slate-700 dark:text-slate-300">
                          {color.hex}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Decor Highlights */}
                <div className="mb-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 block">
                    Signature Decor Elements:
                  </span>
                  <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1 pl-4 list-disc">
                    {concept.decorElements.map((decor, dIdx) => (
                      <li key={dIdx} className="leading-snug">
                        {decor}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Signature Menu */}
                <div className="mb-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1 mb-1.5">
                    <UtensilsCrossed className="w-3.5 h-3.5 text-amber-500" />
                    Curated Menu Highlights:
                  </span>
                  <div className="space-y-2">
                    {concept.signatureMenu.map((item, mIdx) => (
                      <div
                        key={mIdx}
                        className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs"
                      >
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {item.name}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400">
                            {item.course}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-700 dark:text-slate-300 mb-1">
                          {item.description}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {item.dietaryTags.map((tag) => (
                            <span
                              key={tag}
                              className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Guest Engagement */}
                <div className="mb-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1 mb-1.5">
                    <PartyPopper className="w-3.5 h-3.5 text-purple-500" />
                    Guest Engagement Activities:
                  </span>
                  <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1 pl-4 list-disc">
                    {concept.engagementActivities.map((act, aIdx) => (
                      <li key={aIdx} className="leading-snug">
                        {act}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Select Concept Button */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => onSelectActiveConcept(concept.id)}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    isSelected
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  {isSelected ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Selected Blueprint</span>
                    </>
                  ) : (
                    <span>Choose This Theme</span>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
