import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, RefreshCw, ChefHat } from 'lucide-react';
import { isCanisterStoppedError, isNetworkError, isAuthError, getErrorMessage, getRecoveryInstructions } from '@/utils/errorHandling';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Error boundary component that catches unhandled errors during app initialization and runtime
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Error info:', errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    
    // Reload the page to restart the app
    window.location.reload();
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const error = this.state.error;
      const errorMessage = getErrorMessage(error);
      const recoveryInstructions = getRecoveryInstructions(error);
      
      // Determine error type for styling
      const isServiceUnavailable = isCanisterStoppedError(error);
      const isConnectionError = isNetworkError(error);
      const isAuthentication = isAuthError(error);

      return (
        <div className="min-h-screen bg-gradient-to-br from-[oklch(0.97_0.01_60)] to-[oklch(0.95_0.02_80)] flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[oklch(0.62_0.15_35)] to-[oklch(0.55_0.18_30)] rounded-2xl shadow-lg mb-4">
                <ChefHat className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-[oklch(0.35_0.08_35)] mb-2">
                Jeevanam Kitchen
              </h1>
              <p className="text-muted-foreground">Smart Calculator</p>
            </div>

            {/* Error Alert */}
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-5 w-5" />
              <AlertTitle className="text-lg font-semibold">
                {isServiceUnavailable && 'Service Temporarily Unavailable'}
                {isConnectionError && 'Connection Error'}
                {isAuthentication && 'Authentication Error'}
                {!isServiceUnavailable && !isConnectionError && !isAuthentication && 'Something Went Wrong'}
              </AlertTitle>
              <AlertDescription className="mt-2 space-y-2">
                <p className="font-medium">{errorMessage}</p>
                <p className="text-sm">{recoveryInstructions}</p>
              </AlertDescription>
            </Alert>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={this.handleRetry}
                size="lg"
                className="bg-gradient-to-r from-[oklch(0.62_0.15_35)] to-[oklch(0.55_0.18_30)] hover:from-[oklch(0.58_0.15_35)] hover:to-[oklch(0.51_0.18_30)]"
              >
                <RefreshCw className="mr-2 h-5 w-5" />
                Retry
              </Button>
              
              {isAuthentication && (
                <Button
                  onClick={() => {
                    localStorage.clear();
                    window.location.href = '/';
                  }}
                  variant="outline"
                  size="lg"
                >
                  Clear Data & Restart
                </Button>
              )}
            </div>

            {/* Technical Details (Collapsible) */}
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-8 p-4 bg-white rounded-lg border border-[oklch(0.88_0.03_60)]">
                <summary className="cursor-pointer font-medium text-sm text-muted-foreground hover:text-foreground">
                  Technical Details (Development Only)
                </summary>
                <div className="mt-4 space-y-2">
                  <div className="text-xs">
                    <strong>Error:</strong>
                    <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto">
                      {error.toString()}
                    </pre>
                  </div>
                  {this.state.errorInfo && (
                    <div className="text-xs">
                      <strong>Component Stack:</strong>
                      <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
