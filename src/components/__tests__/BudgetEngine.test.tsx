import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BudgetEngine } from '../BudgetEngine';
import { BudgetItem } from '../../types/event';

const mockBudgetItems: BudgetItem[] = [
  {
    id: 'b-1',
    category: 'venue',
    name: 'Heritage Palace Rental',
    allocatedAmount: 1000000,
    percentage: 35.7,
    locked: false,
    costSavingTip: 'Book weekday slots for 15% discount.',
    notes: 'Includes lawn access.',
  },
  {
    id: 'b-2',
    category: 'catering',
    name: 'Multi-Cuisine Royal Feast',
    allocatedAmount: 800000,
    percentage: 28.6,
    locked: false,
    costSavingTip: 'Limit live stations to 3 to reduce staff costs.',
    notes: '220 guests full dinner.',
  },
  {
    id: 'b-3',
    category: 'contingency',
    name: 'Emergency Cushion Reserve',
    allocatedAmount: 280000,
    percentage: 10.0,
    locked: true,
    costSavingTip: 'Do not reallocate prior to event day.',
    notes: 'Weather & overtime cushion.',
  },
];

describe('BudgetEngine component', () => {
  const defaultProps = {
    items: mockBudgetItems,
    totalBudget: 2800000,
    currency: 'INR' as const,
    contingencyPercentage: 10,
    onUpdateItems: vi.fn(),
    onResetDistribution: vi.fn(),
  };

  it('renders budget allocator header and allocated percentage', () => {
    render(<BudgetEngine {...defaultProps} />);
    expect(screen.getByText(/Dynamic Budget Allocator/i)).toBeInTheDocument();
    expect(screen.getByText('Heritage Palace Rental')).toBeInTheDocument();
    expect(screen.getByText('Multi-Cuisine Royal Feast')).toBeInTheDocument();
  });

  it('renders contingency safety notice with protection badge', () => {
    render(<BudgetEngine {...defaultProps} />);
    expect(screen.getByText(/Contingency Reserve: 10%/i)).toBeInTheDocument();
    expect(screen.getByText('Protected')).toBeInTheDocument();
  });

  it('toggles lock state on an unlocked item', () => {
    render(<BudgetEngine {...defaultProps} />);
    const lockBtn = screen.getByLabelText(/Lock Heritage Palace Rental/i);
    fireEvent.click(lockBtn);

    expect(defaultProps.onUpdateItems).toHaveBeenCalledTimes(1);
    const updatedCall = defaultProps.onUpdateItems.mock.calls[0]![0] as BudgetItem[];
    const venueItem = updatedCall.find((i: BudgetItem) => i.id === 'b-1');
    expect(venueItem?.locked).toBe(true);
  });

  it('triggers reset distribution callback on reset button click', () => {
    render(<BudgetEngine {...defaultProps} />);
    const resetBtn = screen.getByTitle(/Reset to recommended CSEP distribution/i);
    fireEvent.click(resetBtn);
    expect(defaultProps.onResetDistribution).toHaveBeenCalledTimes(1);
  });

  it('renders accessible sliders with range attributes', () => {
    render(<BudgetEngine {...defaultProps} />);
    const slider = screen.getByLabelText(/Adjust budget share for Heritage Palace Rental/i);
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveAttribute('type', 'range');
    expect(slider).toHaveAttribute('aria-valuemin', '1');
    expect(slider).toHaveAttribute('aria-valuemax', '65');
  });
});
