import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public handleReload = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 space-y-3 m-4">
          <div className="flex items-center gap-2 font-black text-sm uppercase">
            <AlertTriangle className="text-rose-600" size={18} />
            <span>{this.props.fallbackTitle || 'Se produjo un error visual recuperable'}</span>
          </div>
          <p className="text-xs text-rose-700">
            {this.state.error?.message || 'Error inesperado al renderizar este componente.'}
          </p>
          <button
            onClick={this.handleReload}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-xs"
          >
            <RefreshCw size={14} /> Reintentar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
