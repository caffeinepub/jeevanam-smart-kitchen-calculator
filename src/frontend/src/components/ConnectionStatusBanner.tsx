import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Loader2, WifiOff } from 'lucide-react';
import { useBackendHealth } from '@/hooks/useBackendHealth';
import { Button } from '@/components/ui/button';

/**
 * Banner component that displays connection status and alerts when service is unavailable
 */
export function ConnectionStatusBanner() {
  const { isHealthy, isChecking, lastError, retryCount, checkHealthNow } = useBackendHealth();
  const [showRecoveryMessage, setShowRecoveryMessage] = useState(false);
  const [wasUnhealthy, setWasUnhealthy] = useState(false);

  // Track recovery transitions
  useEffect(() => {
    if (!isHealthy) {
      setWasUnhealthy(true);
      setShowRecoveryMessage(false);
    } else if (wasUnhealthy && isHealthy) {
      // Service recovered
      setShowRecoveryMessage(true);
      setWasUnhealthy(false);
      
      // Auto-dismiss recovery message after 5 seconds
      const timer = setTimeout(() => {
        setShowRecoveryMessage(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [isHealthy, wasUnhealthy]);

  // Don't show banner if everything is healthy and no recovery message
  if (isHealthy && !showRecoveryMessage) {
    return null;
  }

  // Show recovery success message
  if (showRecoveryMessage) {
    return (
      <div className="fixed top-16 left-0 right-0 z-40 animate-in slide-in-from-top">
        <div className="container mx-auto px-4 py-2">
          <Alert className="bg-green-50 border-green-200 shadow-md">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <AlertDescription className="text-green-800 font-medium ml-2">
              Connection restored! The service is now available.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Show error banner when unhealthy
  return (
    <div className="fixed top-16 left-0 right-0 z-40 animate-in slide-in-from-top">
      <div className="container mx-auto px-4 py-2">
        <Alert variant="destructive" className="shadow-lg">
          <div className="flex items-start gap-3">
            {isChecking ? (
              <Loader2 className="h-5 w-5 animate-spin flex-shrink-0 mt-0.5" />
            ) : (
              <WifiOff className="h-5 w-5 flex-shrink-0 mt-0.5" />
            )}
            
            <div className="flex-1 min-w-0">
              <AlertDescription className="space-y-2">
                <div className="font-semibold">
                  {isChecking ? 'Reconnecting...' : 'Service Temporarily Unavailable'}
                </div>
                <div className="text-sm">
                  {lastError || 'Unable to connect to the backend service. The system will automatically retry.'}
                </div>
                {retryCount > 0 && (
                  <div className="text-xs opacity-90">
                    Retry attempt: {retryCount}
                  </div>
                )}
              </AlertDescription>
            </div>

            {!isChecking && (
              <Button
                onClick={checkHealthNow}
                variant="outline"
                size="sm"
                className="flex-shrink-0 bg-white hover:bg-gray-50"
              >
                Retry Now
              </Button>
            )}
          </div>
        </Alert>
      </div>
    </div>
  );
}
