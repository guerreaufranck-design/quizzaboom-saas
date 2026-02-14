import React, { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-qb-dark flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <div className="text-8xl mb-6">💥</div>
            <h1 className="text-3xl font-bold text-white mb-3">
              Oops, something went wrong!
            </h1>
            <p className="text-white/60 mb-8">
              Don't worry, your data is safe. Try reloading the page.
            </p>
            {this.state.error && (
              <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-red-300 text-sm font-mono truncate">
                  {this.state.error.message}
                </p>
              </div>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleGoHome}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-colors"
              >
                Go Home
              </button>
              <button
                onClick={this.handleReload}
                className="px-6 py-3 bg-gradient-to-r from-qb-cyan to-qb-purple text-white rounded-xl font-bold transition-transform hover:scale-105"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
