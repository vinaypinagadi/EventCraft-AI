import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ErrorBoundary } from '../ErrorBoundary';

const GoodComponent = () => <div>Safe Component Loaded</div>;
const FaultyComponent = () => {
  throw new Error('Test crash in child component');
};

describe('ErrorBoundary component', () => {
  it('renders children normally when no exception is thrown', () => {
    render(
      <ErrorBoundary>
        <GoodComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText('Safe Component Loaded')).toBeInTheDocument();
  });

  it('renders fallback error message when child throws', () => {
    // Suppress console.error during expected test error
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <FaultyComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Something encountered an issue/i)).toBeInTheDocument();
    expect(screen.getByText(/Test crash in child component/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reload Application/i })).toBeInTheDocument();

    spy.mockRestore();
  });
});
