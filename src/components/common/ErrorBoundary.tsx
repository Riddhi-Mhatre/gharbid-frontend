import { Component, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error?: Error; }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 p-12 text-center">
          <AlertTriangle className="text-primary" size={48} />
          <h2 className="text-xl font-display font-bold">Something went wrong</h2>
          <p className="text-muted text-sm">{this.state.error?.message}</p>
          <button
            className="btn-primary"
            onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
            id="error-boundary-reload"
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
