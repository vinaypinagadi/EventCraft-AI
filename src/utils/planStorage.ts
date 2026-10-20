import { FullEventPlan } from '../types/event';
import { DEMO_PRESETS } from '../data/presets';

export const LOCAL_STORAGE_SAVED_PLANS_KEY = 'EVENTCRAFT_SAVED_PLANS';
export const LOCAL_STORAGE_ACTIVE_PLAN_ID_KEY = 'EVENTCRAFT_ACTIVE_PLAN_ID';
export const LEGACY_PLAN_KEY = 'EVENTCRAFT_ACTIVE_PLAN';

/**
 * Retrieve all saved plans from local storage or initialize with default demo presets.
 */
export function loadSavedPlans(): FullEventPlan[] {
  if (typeof window === 'undefined') {
    return [DEMO_PRESETS.wedding, DEMO_PRESETS.birthday, DEMO_PRESETS.community];
  }

  try {
    const rawSaved = localStorage.getItem(LOCAL_STORAGE_SAVED_PLANS_KEY);
    if (rawSaved) {
      const parsed = JSON.parse(rawSaved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }

    // Check if legacy single plan exists
    const legacyRaw = localStorage.getItem(LEGACY_PLAN_KEY);
    if (legacyRaw) {
      const parsedLegacy = JSON.parse(legacyRaw);
      if (parsedLegacy && parsedLegacy.id && parsedLegacy.summary) {
        const initial = [
          parsedLegacy,
          DEMO_PRESETS.wedding.id !== parsedLegacy.id ? DEMO_PRESETS.wedding : null,
          DEMO_PRESETS.birthday.id !== parsedLegacy.id ? DEMO_PRESETS.birthday : null,
          DEMO_PRESETS.community.id !== parsedLegacy.id ? DEMO_PRESETS.community : null,
        ].filter(Boolean) as FullEventPlan[];

        saveSavedPlans(initial);
        return initial;
      }
    }
  } catch (err) {
    console.warn('Failed to parse saved plans from localStorage, falling back to presets:', err);
  }

  // Default seed: provide all 3 rich presets so user immediately has multiple events to test
  const defaultList = [DEMO_PRESETS.wedding, DEMO_PRESETS.birthday, DEMO_PRESETS.community];
  saveSavedPlans(defaultList);
  return defaultList;
}

/**
 * Persist plans array to localStorage
 */
export function saveSavedPlans(plans: FullEventPlan[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_SAVED_PLANS_KEY, JSON.stringify(plans));
  } catch (err) {
    console.error('Error saving plans to localStorage:', err);
  }
}

/**
 * Retrieve the active plan ID from storage, ensuring it exists in the provided plans list
 */
export function loadActivePlanId(plans: FullEventPlan[]): string {
  if (plans.length === 0 || !plans[0]) return '';
  if (typeof window === 'undefined') return plans[0].id;

  try {
    const savedId = localStorage.getItem(LOCAL_STORAGE_ACTIVE_PLAN_ID_KEY);
    if (savedId && plans.some((p) => p.id === savedId)) {
      return savedId;
    }
  } catch {
    // ignore
  }

  return plans[0]?.id || '';
}

/**
 * Persist active plan ID to localStorage
 */
export function saveActivePlanId(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_ACTIVE_PLAN_ID_KEY, id);
  } catch (err) {
    console.error('Error saving active plan ID:', err);
  }
}

/**
 * Clone an existing plan with a new ID and timestamp
 */
export function clonePlan(plan: FullEventPlan, customName?: string): FullEventPlan {
  const timestamp = Date.now();
  const copyTitle = customName?.trim() || `${plan.summary.title} (Copy)`;
  const copyEventName = customName?.trim() || `${plan.input.eventName} (Copy)`;

  return {
    ...JSON.parse(JSON.stringify(plan)), // Deep clone
    id: `plan-copy-${timestamp}`,
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    source: 'modified',
    input: {
      ...plan.input,
      eventName: copyEventName,
    },
    summary: {
      ...plan.summary,
      title: copyTitle,
    },
  };
}

/**
 * Validate, sanitize, and harden an imported JSON object as a FullEventPlan.
 * Guards against Prototype Pollution (__proto__, constructor) and malformed shapes.
 */
export function validateImportedPlan(data: unknown): FullEventPlan | null {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;

  // Prototype pollution security check
  if (
    Object.prototype.hasOwnProperty.call(data, '__proto__') ||
    Object.prototype.hasOwnProperty.call(data, 'constructor') ||
    Object.prototype.hasOwnProperty.call(data, 'prototype')
  ) {
    return null;
  }

  const p = data as Record<string, unknown>;

  const summary = p.summary as Record<string, unknown> | undefined;
  const budget = p.budget as Record<string, unknown> | undefined;
  const timeline = p.timeline as Record<string, unknown> | undefined;
  const vendors = p.vendors;

  if (
    !summary ||
    typeof summary.title !== 'string' ||
    !budget ||
    typeof budget.totalBudget !== 'number' ||
    !timeline ||
    !Array.isArray(timeline.milestones) ||
    !Array.isArray(vendors)
  ) {
    return null;
  }

  // Ensure unique ID and clean ISO timestamp
  const timestamp = Date.now();
  return {
    ...(p as unknown as FullEventPlan),
    id: `plan-import-${timestamp}`,
    lastUpdated: new Date().toISOString(),
    source: 'modified',
  };
}
