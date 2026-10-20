import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Header } from '../Header';

describe('Header component', () => {
  const defaultProps = {
    onLoadPreset: vi.fn(),
    activeVertical: 'wedding' as const,
    hasCustomKey: false,
    onOpenKeyModal: vi.fn(),
    onOpenCrisisModal: vi.fn(),
    onOpenExportModal: vi.fn(),
    onOpenSavedPlansModal: vi.fn(),
    savedPlansCount: 3,
    darkMode: false,
    onToggleDarkMode: vi.fn(),
    onNewPlanClick: vi.fn(),
  };

  it('renders brand title and CSEP badge', () => {
    render(<Header {...defaultProps} />);
    expect(screen.getByText('EventCraft AI')).toBeInTheDocument();
    expect(screen.getByText('CSEP')).toBeInTheDocument();
  });

  it('renders My Plans button with saved plans count', () => {
    render(<Header {...defaultProps} savedPlansCount={5} />);
    const myPlansBtn = screen.getByLabelText(/Open Saved Events Library/i);
    expect(myPlansBtn).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();

    fireEvent.click(myPlansBtn);
    expect(defaultProps.onOpenSavedPlansModal).toHaveBeenCalledTimes(1);
  });

  it('handles preset button clicks', () => {
    render(<Header {...defaultProps} />);
    const birthdayBtn = screen.getByTitle(/Load Cyberpunk Neon Loft/i);
    fireEvent.click(birthdayBtn);
    expect(defaultProps.onLoadPreset).toHaveBeenCalledWith('birthday');
  });

  it('triggers What-If crisis and export modals', () => {
    render(<Header {...defaultProps} />);
    const crisisBtn = screen.getByTitle(/Test crisis mitigation/i);
    fireEvent.click(crisisBtn);
    expect(defaultProps.onOpenCrisisModal).toHaveBeenCalledTimes(1);

    const exportBtn = screen.getByTitle(/Export complete master plan/i);
    fireEvent.click(exportBtn);
    expect(defaultProps.onOpenExportModal).toHaveBeenCalledTimes(1);
  });

  it('toggles dark mode', () => {
    render(<Header {...defaultProps} />);
    const themeBtn = screen.getByLabelText(/Switch to dark mode/i);
    fireEvent.click(themeBtn);
    expect(defaultProps.onToggleDarkMode).toHaveBeenCalledTimes(1);
  });
});
