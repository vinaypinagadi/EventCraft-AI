import { useState, useEffect, useCallback } from 'react';
import { EventVertical, FullEventPlan } from '../types/event';
import { DEMO_PRESETS } from '../data/presets';
import {
  clonePlan,
  loadActivePlanId,
  loadSavedPlans,
  saveActivePlanId,
  saveSavedPlans,
  LEGACY_PLAN_KEY,
} from '../utils/planStorage';

/**
 * Custom hook for comprehensive Multi-Event management and persistence.
 * Synchronizes the active plan with the user's saved plans library and local storage.
 */
export function useSavedPlans() {
  const [savedPlans, setSavedPlans] = useState<FullEventPlan[]>(() => loadSavedPlans());
  const [activePlan, setActivePlan] = useState<FullEventPlan | null>(() => {
    const plans = loadSavedPlans();
    const activeId = loadActivePlanId(plans);
    return plans.find((p) => p.id === activeId) ?? plans[0] ?? DEMO_PRESETS.wedding;
  });

  // Sync saved plans collection to localStorage
  useEffect(() => {
    saveSavedPlans(savedPlans);
  }, [savedPlans]);

  // Sync active plan ID and legacy key to localStorage
  useEffect(() => {
    if (activePlan) {
      saveActivePlanId(activePlan.id);
      try {
        localStorage.setItem(LEGACY_PLAN_KEY, JSON.stringify(activePlan));
      } catch {
        // Safe catch for storage quota limits
      }
    }
  }, [activePlan]);

  const updateActivePlan = useCallback((updatedPlan: FullEventPlan) => {
    setActivePlan(updatedPlan);
    setSavedPlans((prev) =>
      prev.map((p) => (p.id === updatedPlan.id ? updatedPlan : p))
    );
  }, []);

  const selectPlan = useCallback((planId: string): boolean => {
    const found = savedPlans.find((p) => p.id === planId);
    if (found) {
      setActivePlan(found);
      saveActivePlanId(planId);
      return true;
    }
    return false;
  }, [savedPlans]);

  const duplicatePlan = useCallback((planId: string): FullEventPlan | null => {
    const target = savedPlans.find((p) => p.id === planId);
    if (!target) return null;

    const cloned = clonePlan(target);
    setSavedPlans((prev) => [cloned, ...prev]);
    setActivePlan(cloned);
    saveActivePlanId(cloned.id);
    return cloned;
  }, [savedPlans]);

  const renamePlan = useCallback((planId: string, newTitle: string) => {
    const cleanTitle = newTitle.trim();
    if (!cleanTitle) return;

    setSavedPlans((prev) =>
      prev.map((p) => {
        if (p.id === planId) {
          return {
            ...p,
            lastUpdated: new Date().toISOString(),
            input: { ...p.input, eventName: cleanTitle },
            summary: { ...p.summary, title: cleanTitle },
          };
        }
        return p;
      })
    );

    setActivePlan((current) => {
      if (current?.id === planId) {
        return {
          ...current,
          lastUpdated: new Date().toISOString(),
          input: { ...current.input, eventName: cleanTitle },
          summary: { ...current.summary, title: cleanTitle },
        };
      }
      return current;
    });
  }, []);

  const deletePlan = useCallback((planId: string): boolean => {
    if (savedPlans.length <= 1) {
      return false; // Cannot delete the only remaining plan
    }

    const remaining = savedPlans.filter((p) => p.id !== planId);
    setSavedPlans(remaining);

    setActivePlan((current) => {
      if (current?.id === planId) {
        const nextPlan: FullEventPlan | null = remaining[0] ?? null;
        if (nextPlan) {
          saveActivePlanId(nextPlan.id);
        }
        return nextPlan;
      }
      return current;
    });

    return true;
  }, [savedPlans]);

  const importPlan = useCallback((newPlan: FullEventPlan) => {
    setSavedPlans((prev) => [newPlan, ...prev.filter((p) => p.id !== newPlan.id)]);
    setActivePlan(newPlan);
    saveActivePlanId(newPlan.id);
  }, []);

  const loadPreset = useCallback((vertical: EventVertical): FullEventPlan => {
    const preset = DEMO_PRESETS[vertical];
    setSavedPlans((prev) => {
      const exists = prev.some((p) => p.id === preset.id);
      return exists ? prev : [preset, ...prev];
    });
    setActivePlan(preset);
    saveActivePlanId(preset.id);
    return preset;
  }, []);

  const saveNewPlan = useCallback((plan: FullEventPlan) => {
    setSavedPlans((prev) => [plan, ...prev.filter((p) => p.id !== plan.id)]);
    setActivePlan(plan);
    saveActivePlanId(plan.id);
  }, []);

  return {
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
  };
}
