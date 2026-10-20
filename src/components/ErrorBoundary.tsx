import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Enterprise React Error Boundary
 * Catches unhandled runtime exceptions gracefully, offering single-click state recovery.
 */
export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Uncaught error inside EventCraft component tree:', error, errorInfo);
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          role="alert"
          aria-live="assertive"
          className="min-h-[400px] flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950"
        >
          <div className="max-w-md w-full p-6 bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900 shadow-xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <AlertOctagon className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Something encountered an issue
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                EventCraft protected your saved plans. You can safely reload the workspace.
              </p>
            </div>

            {this.state.error && (
              <pre className="text-[11px] font-mono text-left bg-slate-100 dark:bg-slate-800 p-3 rounded-lg overflow-x-auto text-slate-700 dark:text-slate-300 max-h-32">
                {this.state.error.message}
              </pre>
            )}

            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-md shadow-rose-500/20"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
