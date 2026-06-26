import React from 'react';

interface State { hasError: boolean; error?: Error }

export default class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('App error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-muted/30">
          <div className="max-w-md text-center bg-card border rounded-xl p-8 shadow-sm">
            <div className="text-5xl mb-3">⚠️</div>
            <h1 className="text-xl font-bold mb-2">Something went wrong</h1>
            <p className="text-sm text-muted-foreground mb-4">
              We couldn't load the store. This is usually a temporary connection issue with our backend.
              Please refresh the page or try again shortly.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium text-sm hover:opacity-90"
            >
              Reload page
            </button>
            {this.state.error?.message && (
              <p className="text-[10px] text-muted-foreground mt-4 break-all">{this.state.error.message}</p>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
