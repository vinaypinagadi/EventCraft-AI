import { describe, it, expect, beforeEach } from 'vitest';
import {
  clonePlan,
  validateImportedPlan,
  loadSavedPlans,
  loadActivePlanId,
  saveSavedPlans,
  saveActivePlanId,
} from '../planStorage';
import { DEMO_PRESETS } from '../../data/presets';

describe('planStorage utilities', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loads default demo presets when storage is empty', () => {
    const plans = loadSavedPlans();
    expect(plans.length).toBe(3);
    expect(plans[0]!.id).toBe(DEMO_PRESETS.wedding.id);
  });

  it('saves and reloads plans correctly', () => {
    const testPlans = [DEMO_PRESETS.wedding];
    saveSavedPlans(testPlans);
    const loaded = loadSavedPlans();
    expect(loaded.length).toBe(1);
    expect(loaded[0]!.id).toBe(DEMO_PRESETS.wedding.id);
  });

  it('loads and saves active plan ID', () => {
    const plans = [DEMO_PRESETS.wedding, DEMO_PRESETS.birthday];
    saveActivePlanId(DEMO_PRESETS.birthday.id);
    const activeId = loadActivePlanId(plans);
    expect(activeId).toBe(DEMO_PRESETS.birthday.id);
  });

  it('falls back to first plan if active ID is not found in plans', () => {
    const plans = [DEMO_PRESETS.wedding];
    saveActivePlanId('non-existent-id');
    const activeId = loadActivePlanId(plans);
    expect(activeId).toBe(DEMO_PRESETS.wedding.id);
  });

  it('clones a plan with new ID and custom name', () => {
    const original = DEMO_PRESETS.wedding;
    const cloned = clonePlan(original, 'My Custom Jaipur Wedding');

    expect(cloned.id).not.toBe(original.id);
    expect(cloned.id).toContain('plan-copy-');
    expect(cloned.summary.title).toBe('My Custom Jaipur Wedding');
    expect(cloned.input.eventName).toBe('My Custom Jaipur Wedding');
    expect(cloned.budget.totalBudget).toBe(original.budget.totalBudget);
  });

  it('validates a valid imported plan JSON', () => {
    const validData = {
      summary: { title: 'Imported Gala' },
      budget: { totalBudget: 50000 },
      timeline: { milestones: [] },
      vendors: [],
      ideation: { concepts: [] },
    };

    const validated = validateImportedPlan(validData);
    expect(validated).not.toBeNull();
    expect(validated?.summary.title).toBe('Imported Gala');
    expect(validated?.id).toContain('plan-import-');
  });

  it('rejects invalid plan JSON', () => {
    expect(validateImportedPlan(null)).toBeNull();
    expect(validateImportedPlan({})).toBeNull();
    expect(validateImportedPlan([])).toBeNull();
    expect(validateImportedPlan('not an object')).toBeNull();
    expect(validateImportedPlan({ summary: { title: 123 } })).toBeNull();
  });

  it('rejects payload with prototype pollution attempt', () => {
    const maliciousPayload = JSON.parse('{"__proto__": {"polluted": true}, "summary": {"title": "Hack"}}');
    expect(validateImportedPlan(maliciousPayload)).toBeNull();
  });
});
