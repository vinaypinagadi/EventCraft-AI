/**
 * Unit Tests for CSEP Planning Engine & Deterministic Calculations
 * Tests feasibility thresholds, budget rebalancing, timeline math, and crisis simulator
 */

import { describe, it, expect } from 'vitest';
import {
  assessFeasibility,
  rebalanceBudget,
  calculateDaysRemaining,
  computeMilestoneDueDate,
  generateDefaultBudgetDistribution,
  applyCrisisAdjustment,
  exportBudgetToCSV,
  exportPlanToMarkdown,
  formatCurrency,
} from '../plannerLogic';
import { DEMO_PRESETS } from '../../data/presets';
import { BudgetItem } from '../../types/event';

describe('Financial Feasibility Engine (assessFeasibility)', () => {
  it('flags unrealistically low budgets with a critical warning', () => {
    // Wedding with 200 guests and only ₹1,00,000 budget (₹500/head vs ₹1,800 min benchmark)
    const result = assessFeasibility(100000, 200, 'wedding', 'INR', 'tier1');
    expect(result.level).toBe('critical');
    expect(result.perGuestSpend).toBe(500);
    expect(result.details.length).toBeGreaterThan(0);
    expect(result.message).toContain('Budget Strain Warning');
  });

  it('identifies moderate feasibility with actionable advisory for tight budgets', () => {
    // Wedding with 100 guests and $25,000 budget in tier2 ($250/head, between min $120 and optimal $320)
    const result = assessFeasibility(25000, 100, 'wedding', 'USD', 'tier2');
    expect(result.level).toBe('warning');
    expect(result.perGuestSpend).toBe(250);
    expect(result.message).toContain('Moderate Feasibility');
  });

  it('confirms optimal status for healthy per-head allocations', () => {
    // Wedding with 150 guests and ₹15,00,000 budget in tier2 (₹10,000/head > optimal ₹4,500)
    const result = assessFeasibility(1500000, 150, 'wedding', 'INR', 'tier2');
    expect(result.level).toBe('optimal');
    expect(result.perGuestSpend).toBe(10000);
    expect(result.message).toContain('Healthy Budget');
  });

  it('adapts benchmarks based on event vertical (Community vs Wedding)', () => {
    // $25/head would be critical for wedding, but optimal for a community festival
    const weddingResult = assessFeasibility(2500, 100, 'wedding', 'USD', 'tier2');
    const communityResult = assessFeasibility(2500, 100, 'community', 'USD', 'tier2');

    expect(weddingResult.level).toBe('critical');
    expect(communityResult.level).toBe('warning');
  });

  it('handles edge cases safely with zero or negative guest count', () => {
    const zeroResult = assessFeasibility(5000, 0, 'birthday', 'USD', 'tier2');
    expect(zeroResult.level).toBe('critical');
    expect(zeroResult.perGuestSpend).toBe(0);
  });
});

describe('Budget Rebalancing Engine (rebalanceBudget)', () => {
  const initialItems: BudgetItem[] = [
    {
      id: 'item-venue',
      category: 'venue',
      name: 'Venue Rental',
      percentage: 30,
      allocatedAmount: 30000,
      locked: false,
      costSavingTip: '',
      notes: '',
    },
    {
      id: 'item-catering',
      category: 'catering',
      name: 'Catering',
      percentage: 35,
      allocatedAmount: 35000,
      locked: false,
      costSavingTip: '',
      notes: '',
    },
    {
      id: 'item-decor',
      category: 'decor',
      name: 'Decor',
      percentage: 15,
      allocatedAmount: 15000,
      locked: false,
      costSavingTip: '',
      notes: '',
    },
    {
      id: 'item-entertainment',
      category: 'entertainment',
      name: 'Entertainment',
      percentage: 10,
      allocatedAmount: 10000,
      locked: false,
      costSavingTip: '',
      notes: '',
    },
    {
      id: 'item-contingency',
      category: 'contingency',
      name: 'Contingency',
      percentage: 10,
      allocatedAmount: 10000,
      locked: true, // Locked!
      costSavingTip: '',
      notes: '',
    },
  ];

  it('keeps locked items intact and maintains strict 100% total sum', () => {
    // Increase venue from 30% to 40%
    const rebalanced = rebalanceBudget(initialItems, 'item-venue', 40, 100000);

    const venue = rebalanced.find((i) => i.id === 'item-venue');
    const contingency = rebalanced.find((i) => i.id === 'item-contingency');

    expect(venue?.percentage).toBe(40);
    // Locked contingency must stay exactly 10%
    expect(contingency?.percentage).toBe(10);

    // Total percentage must sum strictly to 100%
    const totalPercentage = rebalanced.reduce((sum, i) => sum + i.percentage, 0);
    expect(Math.round(totalPercentage * 10) / 10).toBe(100);

    // Sum of allocated amounts should equal total budget
    const totalAllocated = rebalanced.reduce((sum, i) => sum + i.allocatedAmount, 0);
    expect(Math.abs(totalAllocated - 100000)).toBeLessThanOrEqual(5);
  });

  it('handles decreasing a category percentage correctly', () => {
    // Decrease catering from 35% to 20%
    const rebalanced = rebalanceBudget(initialItems, 'item-catering', 20, 100000);

    const catering = rebalanced.find((i) => i.id === 'item-catering');
    expect(catering?.percentage).toBe(20);

    const totalPercentage = rebalanced.reduce((sum, i) => sum + i.percentage, 0);
    expect(Math.round(totalPercentage * 10) / 10).toBe(100);
  });
});

describe('Timeline & Date Arithmetic (TimelineEngine)', () => {
  it('correctly calculates days remaining between dates', () => {
    const ref = new Date('2026-10-01T00:00:00Z');
    const target = '2026-10-15';
    const days = calculateDaysRemaining(target, ref);
    expect(days).toBe(14);
  });

  it('computes offset milestone due dates accurately', () => {
    const eventDate = '2026-12-31';
    // 30 days prior
    const dueDate = computeMilestoneDueDate(eventDate, -30);
    expect(dueDate).toBe('2026-12-01');
  });

  it('generates base distribution respecting default 10% contingency', () => {
    const items = generateDefaultBudgetDistribution(
      100000,
      'wedding',
      { venue: 5, catering: 5, decor: 3, entertainment: 3, logistics: 2 },
      10
    );

    const contingency = items.find((i) => i.category === 'contingency');
    expect(contingency?.percentage).toBe(10);
    expect(contingency?.locked).toBe(true);

    const sum = items.reduce((acc, curr) => acc + curr.percentage, 0);
    expect(Math.round(sum * 10) / 10).toBe(100);
  });
});

describe('Crisis Simulator (applyCrisisAdjustment)', () => {
  const basePlan = DEMO_PRESETS.wedding;

  it('handles guest spike scenario by increasing guest count and recalculating spend', () => {
    const initialGuests = basePlan.input.guestCount;
    const adjusted = applyCrisisAdjustment(basePlan, 'guest_spike');

    expect(adjusted.input.guestCount).toBe(Math.round(initialGuests * 1.25));
    expect(adjusted.source).toBe('modified');
    expect(adjusted.timeline.milestones[0]?.critical).toBe(true);
    expect(adjusted.timeline.milestones[0]?.title).toContain('+25% Guests');
  });

  it('handles rain forecast by shifting layout indoor and reallocating contingency', () => {
    const adjusted = applyCrisisAdjustment(basePlan, 'rain_forecast');

    expect(adjusted.input.setting).toBe('indoor');
    const logistics = adjusted.budget.items.find((i) => i.category === 'logistics');
    expect(logistics?.notes).toContain('waterproof');
    expect(adjusted.timeline.milestones[0]?.title).toContain('Wet-Weather');
  });

  it('handles 15% budget cut while preserving essential contingency', () => {
    const originalBudget = basePlan.budget.totalBudget;
    const adjusted = applyCrisisAdjustment(basePlan, 'budget_cut');

    expect(adjusted.budget.totalBudget).toBe(Math.round(originalBudget * 0.85));
    const totalAllocated = adjusted.budget.items.reduce((s, i) => s + i.allocatedAmount, 0);
    expect(Math.abs(totalAllocated - adjusted.budget.totalBudget)).toBeLessThanOrEqual(10);
  });

  it('handles vendor cancellation with emergency RFP escalation', () => {
    const adjusted = applyCrisisAdjustment(basePlan, 'vendor_cancel');
    const highCritVendor = adjusted.vendors.find((v) => v.criticality === 'High');

    expect(highCritVendor?.defaultInquiryPrompt).toContain('URGENT BACKUP RFP');
    expect(adjusted.timeline.milestones[0]?.timeframe).toBe('CRITICAL ESCALATION');
  });
});

describe('Export Functions', () => {
  const plan = DEMO_PRESETS.birthday;

  it('exports budget to valid CSV format', () => {
    const csv = exportBudgetToCSV(plan.budget.items, plan.input.currency, plan.budget.totalBudget);
    expect(csv).toContain('Category,Item Name,Allocation (%),Allocated Amount (USD),Locked');
    expect(csv).toContain('"TOTAL","All Combined Pillars"');
  });

  it('exports entire plan to markdown document', () => {
    const md = exportPlanToMarkdown(plan);
    expect(md).toContain('# Maya\'s \'Electric 30\'');
    expect(md).toContain('## 1. Executive Summary');
    expect(md).toContain('## 2. Dynamic Budget Allocation');
    expect(md).toContain('## 3. Reverse-Engineered Timeline Milestones');
    expect(md).toContain('## 4. Day-Of Execution: Run-of-Show');
  });
});

describe('Currency Formatter', () => {
  it('formats INR correctly', () => {
    const str = formatCurrency(2500000, 'INR');
    expect(str).toContain('25,00,000');
  });

  it('formats USD correctly', () => {
    const str = formatCurrency(5000, 'USD');
    expect(str).toContain('$5,000');
  });
});
