import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Aereo GeoMeasure render error", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="fatal-state">
          <div className="fatal-state-icon"><AlertTriangle size={22} /></div>
          <h1>Workspace couldn’t load</h1>
          <p>The interface hit an unexpected error. Reload the workspace to try again.</p>
          <button className="button button-primary" onClick={() => window.location.reload()}>
            <RotateCcw size={16} /> Reload workspace
          </button>
        </main>
      );
    }
    return this.props.children;
  }
}