import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VendorEngine } from '../VendorEngine';
import { VendorItem } from '../../types/event';

const mockVendors: VendorItem[] = [
  {
    id: 'v-1',
    category: 'Catering',
    vendorRole: 'Master Royal Chef',
    criticality: 'High',
    status: 'Booked',
    estimatedBudget: 800000,
    hiddenCostWarnings: ['Corkage fee for outside beverages'],
    defaultInquiryPrompt: 'Inquire for 220 guest wedding catering...',
    vettingQuestions: ['Do you provide live tasting sessions?'],
  },
  {
    id: 'v-2',
    category: 'Entertainment',
    vendorRole: 'Folk Troupe & DJ',
    criticality: 'Medium',
    status: 'Shortlisted',
    estimatedBudget: 350000,
    hiddenCostWarnings: ['Overtime generator power fees'],
    defaultInquiryPrompt: 'Inquire for folk dance performance...',
    vettingQuestions: ['Do you bring your own sound monitors?'],
  },
];

describe('VendorEngine component', () => {
  const defaultProps = {
    vendors: mockVendors,
    currency: 'INR' as const,
    onUpdateVendorStatus: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders procurement matrix and booked vendor statistics', () => {
    render(<VendorEngine {...defaultProps} />);
    expect(screen.getByText(/Smart Vendor Checklist & Procurement Tracker/i)).toBeInTheDocument();
    expect(screen.getByText(/1 of 2 Booked/i)).toBeInTheDocument();
    expect(screen.getByText('Master Royal Chef')).toBeInTheDocument();
    expect(screen.getByText('Folk Troupe & DJ')).toBeInTheDocument();
  });

  it('filters vendors by criticality', () => {
    render(<VendorEngine {...defaultProps} />);
    const highFilterBtn = screen.getByRole('button', { name: /Filter vendors: High/i });
    fireEvent.click(highFilterBtn);

    expect(screen.getByText('Master Royal Chef')).toBeInTheDocument();
    expect(screen.queryByText('Folk Troupe & DJ')).not.toBeInTheDocument();
  });

  it('updates vendor procurement status via select', () => {
    render(<VendorEngine {...defaultProps} />);
    const statusSelect = screen.getByLabelText(/Procurement status for Folk Troupe & DJ/i);
    fireEvent.change(statusSelect, { target: { value: 'Contract Sent' } });

    expect(defaultProps.onUpdateVendorStatus).toHaveBeenCalledWith('v-2', 'Contract Sent');
  });

  it('opens vendor inquiry draft modal on button click', () => {
    render(<VendorEngine {...defaultProps} />);
    const draftBtns = screen.getAllByText(/Draft Inquiry & Vetting Questions/i);
    fireEvent.click(draftBtns[0]!);

    expect(screen.getByText(/Catering RFP Generator/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Master Royal Chef/i).length).toBeGreaterThan(0);
  });
});
