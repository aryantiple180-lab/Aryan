import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children?: ReactNode;
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
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#050a1f] text-white p-6 text-center relative overflow-hidden">
          {/* Background Effects */}
          <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-red-500/20 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-neon-purple/20 rounded-full blur-[100px] pointer-events-none"></div>

          <div className="glass-panel p-8 rounded-3xl border border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.2)] relative z-10 w-full max-w-sm">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/30">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold mb-3 text-white">System Error</h1>
            <p className="text-gray-400 mb-8">
              We're sorry, but the application encountered an unexpected error.
            </p>
            
            {process.env.NODE_ENV !== 'production' && this.state.error && (
              <div className="bg-black/50 p-4 rounded-xl text-left w-full overflow-auto mb-6 border border-white/5">
                <p className="text-red-400 font-mono text-xs">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <button
              onClick={() => window.location.reload()}
              className="w-full bg-neon-blue text-[#050a1f] py-4 rounded-2xl font-bold text-lg hover:bg-neon-blue/90 transition-colors shadow-[0_0_15px_rgba(0,243,255,0.4)]"
            >
              Restart Application
            </button>
          </div>
        </div>
      );
    }

    // @ts-ignore
    return this.props.children;
  }
}
