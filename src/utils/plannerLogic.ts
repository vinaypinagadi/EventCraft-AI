/**
 * Core Deterministic Planning Logic & Financial Algorithms
 * Implements CSEP Standards for Budget Allocation, Timeline Reverse-Engineering & Feasibility
 */

import {
  BudgetItem,
  CityTier,
  CrisisScenario,
  Currency,
  EventVertical,
  FeasibilityAssessment,
  FullEventPlan,
  PriorityWeights,
} from '../types/event';

// Benchmark per-head spending ranges [min, optimal]
const BENCHMARK_RANGES: Record<EventVertical, Record<Currency, [number, number]>> = {
  wedding: {
    INR: [1800, 4500],
    USD: [120, 320],
  },
  birthday: {
    INR: [650, 1600],
    USD: [40, 110],
  },
  community: {
    INR: [250, 750],
    USD: [15, 55],
  },
};

// City tier cost multipliers
const CITY_TIER_MULTIPLIERS: Record<CityTier, number> = {
  tier1: 1.25,
  tier2: 1.0,
  tier3: 0.8,
  destination: 1.35,
};

/**
 * Format monetary amount with localized currency symbol and numbering
 */
export function formatCurrency(amount: number, currency: Currency): string {
  const rounded = Math.round(amount);
  if (currency === 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(rounded);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(rounded);
}

/**
 * Calculate per-guest budget feasibility against empirical industry standards
 */
export function assessFeasibility(
  totalBudget: number,
  guestCount: number,
  vertical: EventVertical,
  currency: Currency,
  cityTier: CityTier
): FeasibilityAssessment {
  if (guestCount <= 0 || totalBudget <= 0) {
    return {
      level: 'critical',
      perGuestSpend: 0,
      minRecommendedSpend: 0,
      optimalSpend: 0,
      message: 'Invalid budget or guest count entered.',
      details: ['Ensure both guest count and budget are greater than zero.'],
    };
  }

  const rawPerGuest = totalBudget / guestCount;
  const multiplier = CITY_TIER_MULTIPLIERS[cityTier];
  const [baseMin, baseOptimal] = BENCHMARK_RANGES[vertical][currency];

  const minSpend = Math.round(baseMin * multiplier);
  const optimalSpend = Math.round(baseOptimal * multiplier);

  const details: string[] = [];

  if (rawPerGuest < minSpend) {
    const deficit = Math.round((minSpend - rawPerGuest) * guestCount);
    const suggestedGuests = Math.floor(totalBudget / minSpend);
    details.push(
      `Per-guest allocation of ${formatCurrency(rawPerGuest, currency)} is below the minimum viable benchmark of ${formatCurrency(minSpend, currency)} for a ${vertical} in a ${cityTier} location.`
    );
    details.push(
      `Actionable adjustments: Increase total budget by ${formatCurrency(deficit, currency)} OR cap guest count at ${suggestedGuests} attendees.`
    );
    return {
      level: 'critical',
      perGuestSpend: Math.round(rawPerGuest),
      minRecommendedSpend: minSpend,
      optimalSpend: optimalSpend,
      message: `Budget Strain Warning: Allocated ${formatCurrency(rawPerGuest, currency)}/guest is significantly below standard market viability.`,
      details,
    };
  }

  if (rawPerGuest < optimalSpend) {
    details.push(
      `Per-guest allocation of ${formatCurrency(rawPerGuest, currency)} is viable for a modest setup, but tight for premium decor and high-tier catering.`
    );
    details.push(
      `We recommend prioritizing must-have vendor contracts first and maintaining a 10% contingency buffer.`
    );
    return {
      level: 'warning',
      perGuestSpend: Math.round(rawPerGuest),
      minRecommendedSpend: minSpend,
      optimalSpend: optimalSpend,
      message: `Moderate Feasibility: Feasible with mindful vendor negotiations. Optimal benchmark is ${formatCurrency(optimalSpend, currency)}/guest.`,
      details,
    };
  }

  details.push(
    `Per-guest allocation of ${formatCurrency(rawPerGuest, currency)} provides ample room for quality venues, premium hospitality, and guest experiences.`
  );
  return {
    level: 'optimal',
    perGuestSpend: Math.round(rawPerGuest),
    minRecommendedSpend: minSpend,
    optimalSpend: optimalSpend,
    message: `Healthy Budget: Excellent allocation supporting full guest hospitality and high production values.`,
    details,
  };
}

/**
 * Rebalance unlocked budget percentages when one item is changed, ensuring exact 100% total
 */
export function rebalanceBudget(
  items: BudgetItem[],
  changedId: string,
  newPercentage: number,
  totalBudget: number
): BudgetItem[] {
  // Clamp newPercentage between 1 and 90
  const clampedNew = Math.max(1, Math.min(90, Math.round(newPercentage * 10) / 10));

  const targetItem = items.find((i) => i.id === changedId);
  if (!targetItem) return items;

  const oldPercentage = targetItem.percentage;
  const delta = clampedNew - oldPercentage;

  // Find all unlocked items other than the one being edited
  const otherUnlocked = items.filter((i) => i.id !== changedId && !i.locked);

  // If no other unlocked items exist, we cannot shift percentage
  if (otherUnlocked.length === 0) {
    return items;
  }

  const otherUnlockedSum = otherUnlocked.reduce((sum, item) => sum + item.percentage, 0);

  // Distribute delta proportionally across other unlocked items
  const updatedItems = items.map((item) => {
    if (item.id === changedId) {
      return {
        ...item,
        percentage: clampedNew,
        allocatedAmount: Math.round((clampedNew / 100) * totalBudget),
      };
    }
    if (item.locked) {
      return {
        ...item,
        allocatedAmount: Math.round((item.percentage / 100) * totalBudget),
      };
    }

    // Proportionally deduct / add
    const proportion = otherUnlockedSum > 0 ? item.percentage / otherUnlockedSum : 1 / otherUnlocked.length;
    const itemDelta = delta * proportion;
    const adjusted = Math.max(1, item.percentage - itemDelta);
    const rounded = Math.round(adjusted * 10) / 10;

    return {
      ...item,
      percentage: rounded,
      allocatedAmount: Math.round((rounded / 100) * totalBudget),
    };
  });

  // Reconcile rounding discrepancies so sum is strictly 100.0%
  const totalPercentage = updatedItems.reduce((acc, curr) => acc + curr.percentage, 0);
  const discrepancy = Math.round((100 - totalPercentage) * 10) / 10;

  if (discrepancy !== 0) {
    const candidate = updatedItems.find((i) => i.id !== changedId && !i.locked);
    if (candidate) {
      candidate.percentage = Math.round((candidate.percentage + discrepancy) * 10) / 10;
      candidate.allocatedAmount = Math.round((candidate.percentage / 100) * totalBudget);
    }
  }

  return updatedItems;
}

/**
 * Calculate days remaining between target event date and today (or reference date)
 */
export function calculateDaysRemaining(targetDate: string, referenceDate: Date = new Date()): number {
  const target = new Date(targetDate);
  const targetMidnight = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const refMidnight = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );

  const diffMs = targetMidnight.getTime() - refMidnight.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Format a relative milestone due date string (YYYY-MM-DD) based on offset days from eventDate
 */
export function computeMilestoneDueDate(eventDateStr: string, offsetDays: number): string {
  const eventDate = new Date(eventDateStr);
  const dueDate = new Date(eventDate);
  dueDate.setDate(dueDate.getDate() + offsetDays);
  return dueDate.toISOString().split('T')[0] ?? eventDateStr;
}

/**
 * Generate default base budget distribution conforming to priority weights & contingency
 */
export function generateDefaultBudgetDistribution(
  totalBudget: number,
  vertical: EventVertical,
  weights: PriorityWeights,
  contingencyPercent: number = 10
): BudgetItem[] {
  const clampedContingency = Math.max(8, Math.min(15, contingencyPercent));
  const availablePercentage = 100 - clampedContingency;

  // Base proportions tailored to vertical
  let baseWeights: Record<'venue' | 'catering' | 'decor' | 'entertainment' | 'logistics', number>;

  if (vertical === 'wedding') {
    baseWeights = {
      catering: 35 * (weights.catering / 5),
      venue: 25 * (weights.venue / 5),
      decor: 15 * (weights.decor / 5),
      entertainment: 15 * (weights.entertainment / 5),
      logistics: 10 * (weights.logistics / 5),
    };
  } else if (vertical === 'community') {
    baseWeights = {
      logistics: 35 * (weights.logistics / 5), // Permits, staging, sanitation, security
      venue: 20 * (weights.venue / 5),
      catering: 20 * (weights.catering / 5),
      entertainment: 15 * (weights.entertainment / 5),
      decor: 10 * (weights.decor / 5),
    };
  } else {
    // Birthday
    baseWeights = {
      venue: 25 * (weights.venue / 5),
      catering: 35 * (weights.catering / 5),
      entertainment: 20 * (weights.entertainment / 5),
      decor: 15 * (weights.decor / 5),
      logistics: 5 * (weights.logistics / 5),
    };
  }

  const weightSum =
    baseWeights.venue +
    baseWeights.catering +
    baseWeights.decor +
    baseWeights.entertainment +
    baseWeights.logistics;

  const venuePct = Math.round((baseWeights.venue / weightSum) * availablePercentage * 10) / 10;
  const cateringPct = Math.round((baseWeights.catering / weightSum) * availablePercentage * 10) / 10;
  const decorPct = Math.round((baseWeights.decor / weightSum) * availablePercentage * 10) / 10;
  const entertainmentPct =
    Math.round((baseWeights.entertainment / weightSum) * availablePercentage * 10) / 10;
  const logisticsPct =
    Math.round(
      (availablePercentage - (venuePct + cateringPct + decorPct + entertainmentPct)) * 10
    ) / 10;

  return [
    {
      id: 'budget-venue',
      category: 'venue',
      name: vertical === 'community' ? 'Public Park/Ground Permit & Infrastructure' : 'Venue & Hall Rental',
      percentage: venuePct,
      allocatedAmount: Math.round((venuePct / 100) * totalBudget),
      locked: false,
      costSavingTip:
        vertical === 'wedding'
          ? 'Book a non-Saturday or morning slot to negotiate 15-20% off venue tariffs.'
          : 'Check municipal council rates for community grounds rather than private commercial spaces.',
      notes: 'Includes facility fees, setup hours, cleaning deposit, and parking.',
    },
    {
      id: 'budget-catering',
      category: 'catering',
      name: vertical === 'birthday' ? 'Birthday Cake, Buffet & Beverages' : 'Food, Beverage & Hospitality',
      percentage: cateringPct,
      allocatedAmount: Math.round((cateringPct / 100) * totalBudget),
      locked: false,
      costSavingTip:
        'Opt for live interactive counters rather than expansive redundant buffet spreads to minimize food wastage by ~22%.',
      notes: 'Includes servers, standard cutlery, non-alcoholic drinks, and cleanup.',
    },
    {
      id: 'budget-decor',
      category: 'decor',
      name: vertical === 'wedding' ? 'Stage, Floral & Ambient Decor' : 'Theme Decor & Signage',
      percentage: decorPct,
      allocatedAmount: Math.round((decorPct / 100) * totalBudget),
      locked: false,
      costSavingTip:
        'Leverage dynamic warm LED lighting and fabric drapes instead of expensive cut flowers which wilt quickly.',
      notes: 'Covers entryway arches, centerpieces, backdrops, and mood lighting.',
    },
    {
      id: 'budget-entertainment',
      category: 'entertainment',
      name:
        vertical === 'community'
          ? 'Sound System, MC & Local Performers'
          : vertical === 'birthday'
          ? 'Games Host, Magician/DJ & Music'
          : 'DJ, Sound, Live Band & Emcee',
      percentage: entertainmentPct,
      allocatedAmount: Math.round((entertainmentPct / 100) * totalBudget),
      locked: false,
      costSavingTip:
        'Hire a versatile anchor who doubles as game organizer and sound controller.',
      notes: 'Audio-visual rentals, microphones, speakers, performer honorarium.',
    },
    {
      id: 'budget-logistics',
      category: 'logistics',
      name:
        vertical === 'community'
          ? 'Municipal Permits, Crowd Security & Sanitation'
          : 'Logistics, Transport & Invitations',
      percentage: logisticsPct,
      allocatedAmount: Math.round((logisticsPct / 100) * totalBudget),
      locked: false,
      costSavingTip:
        'Use digital animated invites and QR-code RSVP tracking to save $300-$800 on physical printing and courier charges.',
      notes: 'Signage, waste management bins, security staff, and transit support.',
    },
    {
      id: 'budget-contingency',
      category: 'contingency',
      name: 'Emergency Contingency Reserve',
      percentage: clampedContingency,
      allocatedAmount: Math.round((clampedContingency / 100) * totalBudget),
      locked: true, // Contingency locked by default for financial safety
      costSavingTip:
        'Only release contingency funds for unpreventable surges (weather changes, sudden overtime, or medical kits).',
      notes: 'Guards against overtime penalties, last-minute vendor surge pricing, and weather adjustments.',
    },
  ];
}

/**
 * Apply Crisis / What-If adjustments dynamically to an active plan
 */
export function applyCrisisAdjustment(
  plan: FullEventPlan,
  scenarioType: CrisisScenario['type']
): FullEventPlan {
  const cloned: FullEventPlan = JSON.parse(JSON.stringify(plan));
  cloned.source = 'modified';
  cloned.lastUpdated = new Date().toISOString();

  switch (scenarioType) {
    case 'guest_spike': {
      // Guest count +25%
      const newGuestCount = Math.round(cloned.input.guestCount * 1.25);
      cloned.input.guestCount = newGuestCount;

      // Re-evaluate feasibility
      const feasibility = assessFeasibility(
        cloned.budget.totalBudget,
        newGuestCount,
        cloned.input.vertical,
        cloned.input.currency,
        cloned.input.cityTier
      );
      cloned.summary.feasibility = feasibility;
      cloned.summary.perGuestSpend = feasibility.perGuestSpend;

      // Add emergency milestone for catering headcount lock
      cloned.timeline.milestones.unshift({
        id: `milestone-crisis-${Date.now()}`,
        timeframe: 'Immediate Priority',
        title: 'Lock Scaled Catering & Seating Plan (+25% Guests)',
        description: `Guest count surged from ${plan.input.guestCount} to ${newGuestCount}. Contact caterer and rental vendor immediately to request batch buffet scaling and extra 30 chairs.`,
        dueDate: new Date().toISOString().split('T')[0] ?? '',
        daysRemaining: 1,
        category: 'catering',
        completed: false,
        critical: true,
      });
      break;
    }

    case 'rain_forecast': {
      // Switch setting to hybrid/indoor and tap contingency
      cloned.input.setting = 'indoor';

      // Tap 50% of contingency into venue/logistics for marquee/canopy
      const contingencyItem = cloned.budget.items.find((i) => i.category === 'contingency');
      const logisticsItem = cloned.budget.items.find((i) => i.category === 'logistics');

      if (contingencyItem && logisticsItem) {
        const transferPct = Math.round((contingencyItem.percentage * 0.4) * 10) / 10;
        contingencyItem.percentage -= transferPct;
        contingencyItem.allocatedAmount = Math.round(
          (contingencyItem.percentage / 100) * cloned.budget.totalBudget
        );
        logisticsItem.percentage += transferPct;
        logisticsItem.allocatedAmount = Math.round(
          (logisticsItem.percentage / 100) * cloned.budget.totalBudget
        );
        logisticsItem.notes += ' [Updated: Includes waterproof marquee & heavy-duty flooring hire]';
      }

      // Add emergency rain protocol to Run-of-Show
      cloned.timeline.runOfShow = cloned.timeline.runOfShow.map((item) => {
        if (item.location.toLowerCase().includes('lawn') || item.location.toLowerCase().includes('outdoor')) {
          return {
            ...item,
            location: 'Covered Banquet / Waterproof Pavilion',
            notes: `${item.notes} (Shifted indoors due to precipitation protocol)`.trim(),
          };
        }
        return item;
      });

      cloned.timeline.milestones.unshift({
        id: `milestone-rain-${Date.now()}`,
        timeframe: 'Weather Protocol Triggered',
        title: 'Activate Wet-Weather Backup Layout & Tenting',
        description: 'Verify canopy waterproofing, electrical cord insulation, and indoor guest transit pathway.',
        dueDate: new Date().toISOString().split('T')[0] ?? '',
        daysRemaining: 2,
        category: 'logistics',
        completed: false,
        critical: true,
      });
      break;
    }

    case 'budget_cut': {
      // Cut total budget by 15%
      const newTotal = Math.round(cloned.budget.totalBudget * 0.85);
      cloned.budget.totalBudget = newTotal;
      cloned.input.totalBudget = newTotal;

      // Recalculate allocated amounts while trimming decor & entertainment slightly
      const decorItem = cloned.budget.items.find((i) => i.category === 'decor');
      const entItem = cloned.budget.items.find((i) => i.category === 'entertainment');
      const catItem = cloned.budget.items.find((i) => i.category === 'catering');

      if (decorItem && entItem && catItem) {
        decorItem.percentage = Math.max(8, decorItem.percentage - 2);
        entItem.percentage = Math.max(8, entItem.percentage - 2);
        catItem.percentage += 4; // protect food quality
      }

      cloned.budget.items = cloned.budget.items.map((item) => ({
        ...item,
        allocatedAmount: Math.round((item.percentage / 100) * newTotal),
      }));

      cloned.summary.contingencyAmount = Math.round(
        (cloned.budget.contingencyPercentage / 100) * newTotal
      );

      const feasibility = assessFeasibility(
        newTotal,
        cloned.input.guestCount,
        cloned.input.vertical,
        cloned.input.currency,
        cloned.input.cityTier
      );
      cloned.summary.feasibility = feasibility;
      cloned.summary.perGuestSpend = feasibility.perGuestSpend;
      break;
    }

    case 'vendor_cancel': {
      // Find highest criticality vendor
      const keyVendor = cloned.vendors.find((v) => v.criticality === 'High') || cloned.vendors[0];
      if (keyVendor) {
        keyVendor.status = 'Not Started';
        keyVendor.defaultInquiryPrompt = `URGENT BACKUP RFP: Due to an unforeseen emergency cancellation, we have an immediate opening for ${keyVendor.vendorRole} for an event on ${cloned.input.eventDate}. Immediate quote and availability needed.`;

        cloned.timeline.milestones.unshift({
          id: `milestone-cancel-${Date.now()}`,
          timeframe: 'CRITICAL ESCALATION',
          title: `Emergency Replacement: Source ${keyVendor.vendorRole}`,
          description: `Primary ${keyVendor.vendorRole} became unavailable. Broadcast urgent inquiries to vetted secondary network and negotiate expedited agreement.`,
          dueDate: new Date().toISOString().split('T')[0] ?? '',
          daysRemaining: 1,
          category: keyVendor.category,
          completed: false,
          critical: true,
        });
      }
      break;
    }
  }

  return cloned;
}

/**
 * Generate CSV representation of the budget breakdown
 */
export function exportBudgetToCSV(budgetItems: BudgetItem[], currency: Currency, totalBudget: number): string {
  const headers = ['Category', 'Item Name', 'Allocation (%)', `Allocated Amount (${currency})`, 'Locked', 'Cost Saving Tip', 'Notes'];
  const rows = budgetItems.map((item) => [
    `"${item.category}"`,
    `"${item.name.replace(/"/g, '""')}"`,
    `${item.percentage.toFixed(1)}%`,
    item.allocatedAmount,
    item.locked ? 'Yes' : 'No',
    `"${item.costSavingTip.replace(/"/g, '""')}"`,
    `"${item.notes.replace(/"/g, '""')}"`,
  ]);

  rows.push([
    '"TOTAL"',
    '"All Combined Pillars"',
    '100.0%',
    totalBudget,
    '-',
    '-',
    '-',
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Generate Markdown summary of the entire event plan
 */
export function exportPlanToMarkdown(plan: FullEventPlan): string {
  const { input, summary, budget, timeline, vendors, ideation } = plan;

  return `# ${summary.title}
**Event Concept & Blueprint** | *Generated via EventCraft AI (CSEP Certified Standards)*
*Last Updated: ${new Date(plan.lastUpdated).toLocaleDateString()}*

---

## 1. Executive Summary
- **Event Vertical:** ${input.vertical.toUpperCase()}
- **Date & Timeline:** ${input.eventDate} (${timeline.daysRemaining} days remaining ${timeline.isSprintMode ? '- **SPRINT MODE**' : ''})
- **Location:** ${input.cityName} (${input.cityTier}) | Setting: ${input.setting}
- **Guest Count:** ${input.guestCount} Attendees
- **Total Budget:** ${formatCurrency(budget.totalBudget, input.currency)}
- **Per-Guest Allocation:** ${formatCurrency(summary.perGuestSpend, input.currency)} / guest (${summary.feasibility.level.toUpperCase()})
- **Contingency Buffer:** ${formatCurrency(summary.contingencyAmount, input.currency)} (${budget.contingencyPercentage}%)

> **Feasibility Assessment:** ${summary.feasibility.message}

---

## 2. Dynamic Budget Allocation
| Pillar | Category Name | Allocation (%) | Amount (${input.currency}) | Cost Saving Strategy |
|---|---|---|---|---|
${budget.items
  .map(
    (b) =>
      `| ${b.category.toUpperCase()} | ${b.name} | ${b.percentage}% | ${formatCurrency(
        b.allocatedAmount,
        input.currency
      )} | ${b.costSavingTip} |`
  )
  .join('\n')}

---

## 3. Reverse-Engineered Timeline Milestones
${timeline.milestones
  .map(
    (m) =>
      `- [${m.completed ? 'x' : ' '}] **[${m.timeframe}]** ${m.title} *(Due: ${m.dueDate})* - ${
        m.description
      }${m.critical ? ' **[CRITICAL]**' : ''}`
  )
  .join('\n')}

---

## 4. Day-Of Execution: Run-of-Show
| Time | Milestone / Activity | Responsible Lead | Location | Operational Notes |
|---|---|---|---|---|
${timeline.runOfShow
  .map((r) => `| ${r.time} | ${r.activity} | ${r.owner} | ${r.location} | ${r.notes} |`)
  .join('\n')}

---

## 5. Vendor Procurement Checklist
${vendors
  .map(
    (v) => `### ${v.vendorRole} (${v.category}) - **Criticality: ${v.criticality}** [Status: ${v.status}]
- **Estimated Budget:** ${formatCurrency(v.estimatedBudget, input.currency)}
- **Hidden Cost Traps:** ${v.hiddenCostWarnings.join(', ')}
- **Key Vetting Questions:**
${v.vettingQuestions.map((q) => `  1. ${q}`).join('\n')}
`
  )
  .join('\n')}

---

## 6. Curated Creative Concepts
${ideation.concepts
  .map(
    (c, idx) => `### Concept ${idx + 1}: ${c.name}
*${c.tagline}*
${c.description}

- **Color Palette:** ${c.colorPalette.map((p) => `${p.name} (${p.hex})`).join(', ')}
- **Key Decor Elements:** ${c.decorElements.join(', ')}
- **Signature Menu Highlights:**
${c.signatureMenu.map((m) => `  - **${m.course}: ${m.name}** - ${m.description}`).join('\n')}
- **Guest Engagement:** ${c.engagementActivities.join(', ')}
`
  )
  .join('\n')}
`;
}
