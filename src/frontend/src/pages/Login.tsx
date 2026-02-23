import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ChefHat, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useActor } from '../hooks/useActor';
import { isCanisterStoppedError, getErrorMessage } from '../hooks/useQueries';

export default function Login() {
  const { login, isLoggingIn, identity, loginStatus } = useInternetIdentity();
  const { actor, isFetching } = useActor();
  const [isSettingUpAdmin, setIsSettingUpAdmin] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [isCanisterStopped, setIsCanisterStopped] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const setupAdminAndRedirect = async () => {
      // Only proceed if we have identity, actor is ready, login succeeded, and we're not already setting up
      if (identity && actor && loginStatus === 'success' && !isSettingUpAdmin && !isFetching) {
        setIsSettingUpAdmin(true);
        setSetupError(null);
        setIsCanisterStopped(false);
        
        try {
          console.log('Setting up admin with principal:', identity.getPrincipal().toString());
          await actor.setupAdmin();
          console.log('Admin setup successful, redirecting to dashboard');
          
          // Small delay to ensure backend state is persisted
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Navigate to dashboard
          window.location.href = '/';
        } catch (error: any) {
          console.error('Admin setup failed:', error);
          const errorMessage = getErrorMessage(error);
          setSetupError(errorMessage);
          
          // Check if it's a canister stopped error
          if (isCanisterStoppedError(error)) {
            setIsCanisterStopped(true);
            setRetryCount(prev => prev + 1);
            
            // Auto-retry after delay for canister stopped errors
            if (retryCount < 3) {
              const delay = Math.min(2000 * Math.pow(2, retryCount), 8000);
              console.log(`Auto-retrying admin setup in ${delay}ms (attempt ${retryCount + 1})`);
              setTimeout(() => {
                setIsSettingUpAdmin(false);
              }, delay);
            } else {
              setIsSettingUpAdmin(false);
            }
          } else {
            setIsSettingUpAdmin(false);
          }
        }
      }
    };

    setupAdminAndRedirect();
  }, [identity, actor, loginStatus, isSettingUpAdmin, isFetching, retryCount]);

  const handleRetrySetup = () => {
    setSetupError(null);
    setIsCanisterStopped(false);
    setRetryCount(0);
    setIsSettingUpAdmin(false);
  };

  const isLoading = isLoggingIn || isSettingUpAdmin || isFetching;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[oklch(0.95_0.02_60)] via-[oklch(0.97_0.015_80)] to-[oklch(0.93_0.025_40)] p-4">
      <Card className="w-full max-w-md shadow-xl border-[oklch(0.88_0.03_60)]">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-[oklch(0.62_0.15_35)] to-[oklch(0.55_0.18_30)] rounded-2xl flex items-center justify-center shadow-lg">
            <ChefHat className="w-9 h-9 text-white" />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold text-[oklch(0.35_0.08_35)]">
              Jeevanam Kitchen
            </CardTitle>
            <CardDescription className="text-base mt-2 text-[oklch(0.50_0.05_35)]">
              Smart Production Calculator
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {setupError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>
                {isCanisterStopped ? 'Service Temporarily Unavailable' : 'Setup Error'}
              </AlertTitle>
              <AlertDescription className="space-y-3">
                <p>{setupError}</p>
                {isCanisterStopped ? (
                  <>
                    <p className="text-sm">
                      The backend canister is currently stopped. This usually resolves automatically within a few moments.
                      {retryCount > 0 && retryCount < 3 && ` Automatically retrying... (Attempt ${retryCount + 1}/3)`}
                      {retryCount >= 3 && ' Maximum retry attempts reached.'}
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRetrySetup}
                        disabled={isLoading}
                        className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry Now
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.location.reload()}
                      >
                        Refresh Page
                      </Button>
                    </div>
                  </>
                ) : (
                  <p className="text-sm mt-2">Please try logging in again.</p>
                )}
              </AlertDescription>
            </Alert>
          )}
          
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Standardize recipes, control costs, and optimize your kitchen operations
            </p>
          </div>
          
          <Button
            onClick={login}
            disabled={isLoading}
            className="w-full h-12 text-base font-semibold bg-gradient-to-r from-[oklch(0.62_0.15_35)] to-[oklch(0.55_0.18_30)] hover:from-[oklch(0.58_0.15_35)] hover:to-[oklch(0.51_0.18_30)] text-white shadow-md"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {isSettingUpAdmin ? (
                  retryCount > 0 ? `Retrying setup (${retryCount}/3)...` : 'Setting up access...'
                ) : (
                  'Connecting...'
                )}
              </>
            ) : (
              'Login to Continue'
            )}
          </Button>
          
          <p className="text-xs text-center text-muted-foreground">
            Secure authentication powered by Internet Identity
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
