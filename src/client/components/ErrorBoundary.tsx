import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[Dhadhan HUB] Uncaught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] p-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center text-red-500 mx-auto mb-6">
              <AlertTriangle size={32} />
            </div>
            <h1 className="text-2xl font-black text-[#0B1630] mb-2">Something went wrong</h1>
            <p className="text-sm text-[#64748B] mb-2 leading-relaxed">
              An unexpected error occurred. This has been logged for investigation.
            </p>
            {this.state.error && (
              <p className="text-xs text-red-400 bg-red-50 rounded-xl p-3 mb-6 font-mono break-all">
                {this.state.error.message}
              </p>
            )}
            <button
              onClick={this.handleReset}
              className="bg-[#F97316] text-white px-8 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 mx-auto hover:bg-[#ea580c] transition-all shadow-lg shadow-orange-500/20 active:scale-[0.98] cursor-pointer"
            >
              <RefreshCw size={16} /> Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
