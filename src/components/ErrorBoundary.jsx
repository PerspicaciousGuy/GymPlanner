import { Component } from 'react';
import { Button } from "@/components/ui/button";

/**
 * Catches render-time errors in the page tree and shows a recoverable fallback
 * instead of white-screening the whole app. React requires a class component
 * for error boundaries; this is the one sanctioned exception to functional-only.
 */
export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // No external monitoring is wired up yet; log for local debugging only.
    // User-facing UI never shows the raw error (AGENTS.md §7).
    console.error('[ErrorBoundary] Render error:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-[var(--app-radius-lg)] bg-[var(--app-surface-muted)] text-2xl">
          ⚠️
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-foreground">Something went wrong</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            This page hit an unexpected error. Your saved data is safe. Try again, or reload the app.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={this.handleReset}>Try again</Button>
          <Button onClick={() => window.location.reload()}>Reload app</Button>
        </div>
      </div>
    );
  }
}
