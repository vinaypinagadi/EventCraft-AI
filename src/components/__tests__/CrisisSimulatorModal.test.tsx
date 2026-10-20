import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CrisisSimulatorModal } from '../CrisisSimulatorModal';

describe('CrisisSimulatorModal component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onApplyCrisis: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all crisis drills when open', () => {
    render(<CrisisSimulatorModal {...defaultProps} />);
    expect(screen.getByText(/"What-If" Crisis Simulator & Stress Tester/i)).toBeInTheDocument();
    expect(screen.getByText(/Guest Headcount Surges/i)).toBeInTheDocument();
    expect(screen.getByText(/Severe Wet Weather/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Budget Cut by 15%/i)).toBeInTheDocument();
    expect(screen.getByText(/Critical Vendor Cancellation/i)).toBeInTheDocument();
  });

  it('triggers onApplyCrisis with scenario type on click', () => {
    render(<CrisisSimulatorModal {...defaultProps} />);
    const drillBtns = screen.getAllByText('Simulate & Recalculate');
    fireEvent.click(drillBtns[1]!); // Second drill is Severe Wet Weather

    expect(defaultProps.onApplyCrisis).toHaveBeenCalledWith('rain_forecast');
  });

  it('calls onClose when close button is clicked', () => {
    render(<CrisisSimulatorModal {...defaultProps} />);
    const closeBtn = screen.getByLabelText(/Close Simulator/i);
    fireEvent.click(closeBtn);

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(<CrisisSimulatorModal {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });
});
