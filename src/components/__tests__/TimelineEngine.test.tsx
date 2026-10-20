import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TimelineEngine } from '../TimelineEngine';
import { RunOfShowItem, TimelineMilestone } from '../../types/event';

const mockMilestones: TimelineMilestone[] = [
  {
    id: 'm-1',
    timeframe: '6 Months Out',
    title: 'Finalize Palace Contract & Deposit',
    description: 'Lock in date and secure legal permits.',
    dueDate: '2026-04-20',
    daysRemaining: 180,
    category: 'Venue',
    completed: true,
    critical: true,
  },
  {
    id: 'm-2',
    timeframe: '3 Months Out',
    title: 'Food Tasting & Menu Selection',
    description: 'Sample 5-course royal menu with family.',
    dueDate: '2026-07-20',
    daysRemaining: 90,
    category: 'Catering',
    completed: false,
    critical: false,
  },
];

const mockRunOfShow: RunOfShowItem[] = [
  {
    id: 'ros-1',
    time: '04:00 PM',
    activity: 'Guest Arrival & Welcome Drinks',
    owner: 'Hospitality Lead',
    location: 'Courtyard',
    notes: 'Serve signature sherbets.',
  },
];

describe('TimelineEngine component', () => {
  const defaultProps = {
    milestones: mockMilestones,
    runOfShow: mockRunOfShow,
    daysRemaining: 180,
    isSprintMode: false,
    eventDate: '2026-10-24',
    onToggleMilestone: vi.fn(),
  };

  it('renders reverse timeline header with event date', () => {
    render(<TimelineEngine {...defaultProps} />);
    expect(screen.getByText(/Reverse-Engineered Event Timeline/i)).toBeInTheDocument();
    expect(screen.getByText('2026-10-24')).toBeInTheDocument();
    expect(screen.getByText(/Finalize Palace Contract/i)).toBeInTheDocument();
  });

  it('switches between Macro Countdown and Day-Of Run-of-Show tabs', () => {
    render(<TimelineEngine {...defaultProps} />);
    const runOfShowTab = screen.getByRole('tab', { name: /Day-Of Run-of-Show/i });
    fireEvent.click(runOfShowTab);

    expect(screen.getByText('Guest Arrival & Welcome Drinks')).toBeInTheDocument();
    expect(screen.getByText('Hospitality Lead')).toBeInTheDocument();
  });

  it('triggers milestone toggle on checkbox click', () => {
    render(<TimelineEngine {...defaultProps} />);
    const toggleBtn = screen.getByLabelText(/Mark Food Tasting & Menu Selection as completed/i);
    fireEvent.click(toggleBtn);
    expect(defaultProps.onToggleMilestone).toHaveBeenCalledWith('m-2');
  });

  it('displays sprint mode badge when sprint mode is active', () => {
    render(<TimelineEngine {...defaultProps} daysRemaining={7} isSprintMode={true} />);
    expect(screen.getByText(/Sprint Mode Active/i)).toBeInTheDocument();
  });
});
