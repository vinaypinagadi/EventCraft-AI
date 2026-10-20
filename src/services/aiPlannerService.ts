/**
 * Gemini AI Integration Service
 * Uses @google/generative-ai with Structured JSON Output (responseSchema)
 * Certified Special Events Professional (CSEP) Prompting & Zero-Key Fallback
 */

import { GoogleGenerativeAI, SchemaType, Schema } from '@google/generative-ai';
import {
  EventPlanInput,
  FullEventPlan,
  GeminiStructuredPlanResponse,
  TimelineMilestone,
} from '../types/event';
import {
  assessFeasibility,
  calculateDaysRemaining,
  computeMilestoneDueDate,
  generateDefaultBudgetDistribution,
} from '../utils/plannerLogic';
import { DEMO_PRESETS } from '../data/presets';

const STORAGE_KEY = 'EVENTCRAFT_GEMINI_API_KEY';

/**
 * Retrieve active API key from localStorage, sessionStorage, or Vite env
 */
export function getActiveApiKey(): string {
  if (typeof window !== 'undefined') {
    const sessionKey = sessionStorage.getItem(STORAGE_KEY);
    if (sessionKey?.trim()) return sessionKey.trim();

    const localKey = localStorage.getItem(STORAGE_KEY);
    if (localKey?.trim()) return localKey.trim();
  }

  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (typeof envKey === 'string' && envKey.trim()) {
    return envKey.trim();
  }

  return '';
}

/**
 * Persist user provided API key into browser storage
 */
export function saveActiveApiKey(apiKey: string, remember: boolean = false): void {
  const cleanKey = apiKey.trim();
  if (!cleanKey) {
    sessionStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY);
    return;
  }

  if (remember) {
    localStorage.setItem(STORAGE_KEY, cleanKey);
    sessionStorage.removeItem(STORAGE_KEY);
  } else {
    sessionStorage.setItem(STORAGE_KEY, cleanKey);
    localStorage.removeItem(STORAGE_KEY);
  }
}

/**
 * Sanitize user input to guard against prompt injection & control character attacks
 */
export function sanitizeInput(text: string, maxLength: number = 300): string {
  if (!text) return '';
  return text
    .replace(/[<>{}[\]\\]/g, ' ') // Strip delimiter tags
    .replace(/[\x00-\x1F\x7F]/g, ' ') // Strip non-printable ASCII
    .trim()
    .slice(0, maxLength);
}

/**
 * Response schema definition for strict typed JSON generation
 */
const planResponseSchema: Schema = {
  type: SchemaType.OBJECT,
  description: 'Complete celebration & event master blueprint',
  properties: {
    title: {
      type: SchemaType.STRING,
      description: 'Engaging, celebratory title for this specific event',
    },
    tagline: {
      type: SchemaType.STRING,
      description: 'Inspiring 1-sentence design vision and tagline',
    },
    budgetItems: {
      type: SchemaType.ARRAY,
      description: 'Dynamic budget allocation breakdown across standard event pillars',
      items: {
        type: SchemaType.OBJECT,
        properties: {
          category: {
            type: SchemaType.STRING,
            description: 'One of: venue, catering, decor, entertainment, logistics, contingency',
          },
          name: { type: SchemaType.STRING },
          percentage: { type: SchemaType.NUMBER, description: 'Percentage allocation (sums with others to ~100)' },
          costSavingTip: { type: SchemaType.STRING, description: 'Concrete CSEP-level cost-cutting advice' },
          notes: { type: SchemaType.STRING, description: 'Detailed scope of this line item' },
        },
        required: ['category', 'name', 'percentage', 'costSavingTip', 'notes'],
      },
    },
    milestones: {
      type: SchemaType.ARRAY,
      description: 'Reverse-engineered macro timeline milestones leading up to event day',
      items: {
        type: SchemaType.OBJECT,
        properties: {
          timeframe: { type: SchemaType.STRING, description: 'e.g. 6 Months Out, 1 Month Out, 1 Week Out' },
          title: { type: SchemaType.STRING },
          description: { type: SchemaType.STRING },
          category: { type: SchemaType.STRING },
          critical: { type: SchemaType.BOOLEAN },
          daysOffsetFromEvent: { type: SchemaType.NUMBER, description: 'Negative number for days before event, e.g. -90' },
        },
        required: ['timeframe', 'title', 'description', 'category', 'critical', 'daysOffsetFromEvent'],
      },
    },
    runOfShow: {
      type: SchemaType.ARRAY,
      description: 'Hour-by-hour day-of event execution schedule',
      items: {
        type: SchemaType.OBJECT,
        properties: {
          time: { type: SchemaType.STRING, description: 'e.g. 02:00 PM' },
          activity: { type: SchemaType.STRING },
          owner: { type: SchemaType.STRING },
          location: { type: SchemaType.STRING },
          notes: { type: SchemaType.STRING },
        },
        required: ['time', 'activity', 'owner', 'location', 'notes'],
      },
    },
    vendors: {
      type: SchemaType.ARRAY,
      description: 'Critical vendor checklist tailored to the vertical with hidden cost alerts',
      items: {
        type: SchemaType.OBJECT,
        properties: {
          category: { type: SchemaType.STRING },
          vendorRole: { type: SchemaType.STRING },
          criticality: { type: SchemaType.STRING, description: 'High, Medium, or Low' },
          percentageOfBudget: { type: SchemaType.NUMBER },
          hiddenCostWarnings: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
          defaultInquiryPrompt: { type: SchemaType.STRING },
          vettingQuestions: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
        },
        required: [
          'category',
          'vendorRole',
          'criticality',
          'percentageOfBudget',
          'hiddenCostWarnings',
          'defaultInquiryPrompt',
          'vettingQuestions',
        ],
      },
    },
    concepts: {
      type: SchemaType.ARRAY,
      description: '3 Distinct creative theme and culinary concepts',
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          tagline: { type: SchemaType.STRING },
          description: { type: SchemaType.STRING },
          colorPalette: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                name: { type: SchemaType.STRING },
                hex: { type: SchemaType.STRING },
              },
              required: ['name', 'hex'],
            },
          },
          decorElements: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
          signatureMenu: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                course: { type: SchemaType.STRING },
                name: { type: SchemaType.STRING },
                description: { type: SchemaType.STRING },
                dietaryTags: {
                  type: SchemaType.ARRAY,
                  items: { type: SchemaType.STRING },
                },
              },
              required: ['course', 'name', 'description', 'dietaryTags'],
            },
          },
          engagementActivities: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
        },
        required: ['name', 'tagline', 'description', 'colorPalette', 'decorElements', 'signatureMenu', 'engagementActivities'],
      },
    },
  },
  required: ['title', 'tagline', 'budgetItems', 'milestones', 'runOfShow', 'vendors', 'concepts'],
};

/**
 * Generate full event plan via Gemini 2.5 Flash Structured JSON Output,
 * or gracefully synthesize using CSEP deterministic logic when no API key is present.
 */
export async function generateEventPlan(
  input: EventPlanInput,
  apiKeyOverride?: string
): Promise<FullEventPlan> {
  const apiKey = (apiKeyOverride || getActiveApiKey()).trim();

  // Run deterministic feasibility check
  const feasibility = assessFeasibility(
    input.totalBudget,
    input.guestCount,
    input.vertical,
    input.currency,
    input.cityTier
  );

  const daysRemaining = calculateDaysRemaining(input.eventDate);
  const isSprintMode = daysRemaining <= 14;

  // If no API key is configured, synthesize a high-fidelity plan deterministically
  if (!apiKey) {
    return generateDeterministicFallbackPlan(input, feasibility, daysRemaining, isSprintMode);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Use gemini-2.5-flash as specified in prompt
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: planResponseSchema,
        temperature: 0.4,
      },
    });

    const sanitizedEventName = sanitizeInput(input.eventName, 120);
    const sanitizedCity = sanitizeInput(input.cityName, 80);
    const sanitizedCustoms = sanitizeInput(input.culturalCustoms, 300);
    const sanitizedDietary = input.dietaryRequirements.map((d) => sanitizeInput(d, 40)).join(', ');
    const sanitizedThemes = input.themeKeywords.map((t) => sanitizeInput(t, 40)).join(', ');

    const prompt = `You are a Principal Event Strategist and Certified Special Events Professional (CSEP).
Generate an exhaustive, realistic event master blueprint for the following event:

EVENT PROFILE:
- Vertical: ${input.vertical.toUpperCase()}
- Event Name: "${sanitizedEventName || 'Grand Celebration'}"
- Guest Count: ${input.guestCount} attendees
- Event Date: ${input.eventDate} (${daysRemaining} days remaining from today. ${isSprintMode ? 'NOTE: SPRINT TIMELINE APPLIES (< 14 days)!' : ''})
- Duration: ${input.durationHours} hours
- Location: ${sanitizedCity || 'Metropolitan Area'} (${input.cityTier})
- Setting: ${input.setting.toUpperCase()}
- Total Budget: ${input.currency} ${input.totalBudget} (Reserve strictly ${input.contingencyPercentage}% for Contingency)
- Priority Preferences: Catering=${input.priorityWeights.catering}/5, Venue=${input.priorityWeights.venue}/5, Decor=${input.priorityWeights.decor}/5, Entertainment=${input.priorityWeights.entertainment}/5, Logistics=${input.priorityWeights.logistics}/5
- Vibe & Themes: ${sanitizedThemes || 'Sophisticated and memorable'}
- Dietary Mandates: ${sanitizedDietary || 'Standard diverse menu'}
- Cultural Customs: ${sanitizedCustoms || 'Standard celebrations'}

CRITICAL GUIDELINES:
1. Budget Items: Return 6 categories (venue, catering, decor, entertainment, logistics, contingency). Percentages MUST sum to exactly 100%. Category 'contingency' MUST equal ${input.contingencyPercentage}%. Provide real, practical cost-saving tips.
2. Timeline: ${isSprintMode ? 'Use Sprint Mode daily checkpoints for the remaining days.' : 'Reverse-engineer macro milestones (from 6/3/1 months out down to 1 week out).'}
3. Run-of-Show: Provide realistic hour-by-hour day-of schedule matching the ${input.durationHours} hour duration.
4. Vendors: Provide 4-6 prioritized vendors tailored to ${input.vertical}. Highlight real hidden cost traps (overtime fees, permits, corkage, cleanup fees) and 3 vetting questions.
5. Concepts: Provide 3 creative concepts with complementary hex color swatches, decor items, signature menu items with dietary tags, and interactive guest activities.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const parsed: GeminiStructuredPlanResponse = JSON.parse(responseText);

    return assembleFullPlanFromLLM(input, parsed, feasibility, daysRemaining, isSprintMode);
  } catch (error) {
    console.warn('Gemini API call failed, falling back to deterministic CSEP blueprint:', error);
    return generateDeterministicFallbackPlan(input, feasibility, daysRemaining, isSprintMode);
  }
}

/**
 * Merge LLM structured JSON response with deterministic validation & budget calculations
 */
function assembleFullPlanFromLLM(
  input: EventPlanInput,
  data: GeminiStructuredPlanResponse,
  feasibility: ReturnType<typeof assessFeasibility>,
  daysRemaining: number,
  isSprintMode: boolean
): FullEventPlan {
  // Budget items calculation
  const totalBudget = input.totalBudget;
  let items = data.budgetItems.map((item, idx) => ({
    id: `budget-llm-${idx}-${Date.now()}`,
    category: item.category,
    name: item.name,
    percentage: item.percentage,
    allocatedAmount: Math.round((item.percentage / 100) * totalBudget),
    locked: item.category === 'contingency',
    costSavingTip: item.costSavingTip,
    notes: item.notes,
  }));

  // Ensure total percentage is exactly 100
  const currentSum = items.reduce((acc, i) => acc + i.percentage, 0);
  if (Math.abs(currentSum - 100) > 0.5) {
    const diff = 100 - currentSum;
    const adjustTarget = items.find((i) => i.category !== 'contingency') || items[0];
    if (adjustTarget) {
      adjustTarget.percentage += diff;
      adjustTarget.allocatedAmount = Math.round((adjustTarget.percentage / 100) * totalBudget);
    }
  }

  // Milestones conversion
  const milestones: TimelineMilestone[] = data.milestones.map((m, idx) => ({
    id: `m-llm-${idx}-${Date.now()}`,
    timeframe: m.timeframe,
    title: m.title,
    description: m.description,
    dueDate: computeMilestoneDueDate(input.eventDate, m.daysOffsetFromEvent),
    daysRemaining: Math.max(0, daysRemaining + m.daysOffsetFromEvent),
    category: m.category,
    completed: false,
    critical: m.critical,
  }));

  // Run of show
  const runOfShow = data.runOfShow.map((r, idx) => ({
    id: `ros-llm-${idx}-${Date.now()}`,
    time: r.time,
    activity: r.activity,
    owner: r.owner,
    location: r.location,
    notes: r.notes,
  }));

  // Vendors
  const vendors = data.vendors.map((v, idx) => ({
    id: `v-llm-${idx}-${Date.now()}`,
    category: v.category,
    vendorRole: v.vendorRole,
    criticality: v.criticality,
    status: 'Not Started' as const,
    estimatedBudget: Math.round((v.percentageOfBudget / 100) * totalBudget),
    hiddenCostWarnings: v.hiddenCostWarnings,
    defaultInquiryPrompt: v.defaultInquiryPrompt,
    vettingQuestions: v.vettingQuestions,
  }));

  // Concepts
  const concepts = data.concepts.map((c, idx) => ({
    id: `concept-llm-${idx}-${Date.now()}`,
    name: c.name,
    tagline: c.tagline,
    description: c.description,
    colorPalette: c.colorPalette,
    decorElements: c.decorElements,
    signatureMenu: c.signatureMenu,
    engagementActivities: c.engagementActivities,
  }));

  return {
    id: `plan-${Date.now()}`,
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    source: 'ai',
    input,
    summary: {
      title: data.title || input.eventName,
      tagline: data.tagline || 'Custom Curated Event Experience',
      perGuestSpend: feasibility.perGuestSpend,
      feasibility,
      contingencyAmount: Math.round((input.contingencyPercentage / 100) * totalBudget),
    },
    budget: {
      totalBudget,
      currency: input.currency,
      contingencyPercentage: input.contingencyPercentage,
      items,
    },
    timeline: {
      isSprintMode,
      daysRemaining,
      milestones,
      runOfShow,
    },
    vendors,
    ideation: {
      concepts,
      activeConceptId: concepts[0]?.id,
    },
  };
}

/**
 * Deterministic fallback plan synthesis when API key is unavailable or offline
 */
function generateDeterministicFallbackPlan(
  input: EventPlanInput,
  feasibility: ReturnType<typeof assessFeasibility>,
  daysRemaining: number,
  isSprintMode: boolean
): FullEventPlan {
  // Use vertical template preset as a smart base, then customize dynamically to input
  const basePreset = DEMO_PRESETS[input.vertical];
  const totalBudget = input.totalBudget;

  const budgetItems = generateDefaultBudgetDistribution(
    totalBudget,
    input.vertical,
    input.priorityWeights,
    input.contingencyPercentage
  );

  // Adapt milestones dynamically to dates
  const milestones: TimelineMilestone[] = basePreset.timeline.milestones.map((m, idx) => {
    const offset = isSprintMode ? -(idx * 2) : -(idx * 25);
    return {
      ...m,
      id: `m-synth-${idx}-${Date.now()}`,
      dueDate: computeMilestoneDueDate(input.eventDate, offset),
      daysRemaining: Math.max(0, daysRemaining + offset),
      timeframe: isSprintMode
        ? `Sprint Checkpoint ${idx + 1}`
        : m.timeframe,
    };
  });

  // Scale vendors by budget
  const vendors = basePreset.vendors.map((v, idx) => ({
    ...v,
    id: `v-synth-${idx}-${Date.now()}`,
    estimatedBudget: Math.round((totalBudget / basePreset.vendors.length) * (v.criticality === 'High' ? 1.4 : 0.8)),
  }));

  return {
    id: `plan-synth-${Date.now()}`,
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    source: 'preset',
    input,
    summary: {
      title: input.eventName || basePreset.summary.title,
      tagline: basePreset.summary.tagline,
      perGuestSpend: feasibility.perGuestSpend,
      feasibility,
      contingencyAmount: Math.round((input.contingencyPercentage / 100) * totalBudget),
    },
    budget: {
      totalBudget,
      currency: input.currency,
      contingencyPercentage: input.contingencyPercentage,
      items: budgetItems,
    },
    timeline: {
      isSprintMode,
      daysRemaining,
      milestones,
      runOfShow: basePreset.timeline.runOfShow,
    },
    vendors,
    ideation: {
      concepts: basePreset.ideation.concepts,
      activeConceptId: basePreset.ideation.concepts[0]?.id,
    },
  };
}
