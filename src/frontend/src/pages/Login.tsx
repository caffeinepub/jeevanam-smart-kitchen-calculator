import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ChefHat, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useActor } from '../hooks/useActor';
import { isCanisterStoppedError, getErrorMessage } from '../hooks/useQueries';

export default function Login() {
  const { login, isLoggingIn, identity, loginStatus, loginError } = useInternetIdentity();
  const { actor, isFetching } = useActor();
  const [isSettingUpAdmin, setIsSettingUpAdmin] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRecovering, setIsRecovering] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string>('');

  const isReady = !!actor && !isFetching;

  useEffect(() => {
    const setupAdmin = async () => {
      if (!identity || !actor || !isReady) {
        console.log('[Login] Setup conditions not met:', {
          hasIdentity: !!identity,
          hasActor: !!actor,
          isReady,
          identityPrincipal: identity?.getPrincipal().toString()
        });
        return;
      }
      
      if (isSettingUpAdmin) {
        console.log('[Login] Setup already in progress, skipping');
        return;
      }

      console.log('[Login] Starting admin setup process');
      console.log('[Login] Identity principal:', identity.getPrincipal().toString());
      console.log('[Login] Actor available:', !!actor);

      setIsSettingUpAdmin(true);
      setSetupError(null);
      setErrorDetails('');

      let attempts = 0;
      const maxAttempts = 5;

      const attemptSetup = async (): Promise<boolean> => {
        attempts++;
        console.log(`[Login] Admin setup attempt ${attempts}/${maxAttempts}`);

        try {
          console.log('[Login] Calling actor.setupAdmin()...');
          await actor.setupAdmin();
          console.log('[Login] Admin setup successful');
          setIsRecovering(false);
          
          // Navigate to dashboard after successful setup
          setTimeout(() => {
            console.log('[Login] Navigating to dashboard');
            window.location.href = '/dashboard';
          }, 500);
          
          return true;
        } catch (error: any) {
          console.error(`[Login] Admin setup error (attempt ${attempts}):`, {
            error,
            errorName: error?.name,
            errorMessage: error?.message,
            errorStack: error?.stack,
            errorType: typeof error,
            errorKeys: error ? Object.keys(error) : [],
            isCanisterStopped: isCanisterStoppedError(error)
          });
          
          // Capture detailed error information
          const detailedError = `
Error Type: ${error?.name || 'Unknown'}
Error Message: ${error?.message || 'No message'}
Error String: ${String(error)}
Is Canister Stopped: ${isCanisterStoppedError(error)}
Attempt: ${attempts}/${maxAttempts}
Identity Principal: ${identity?.getPrincipal().toString()}
Actor Available: ${!!actor}
          `.trim();
          
          setErrorDetails(detailedError);
          
          if (isCanisterStoppedError(error)) {
            setIsRecovering(true);
            setRetryCount(attempts);
            
            if (attempts < maxAttempts) {
              const delay = Math.min(2000 * Math.pow(2, attempts - 1), 16000);
              console.log(`[Login] Retrying in ${delay}ms...`);
              setSetupError(`Service is initializing after deployment. Retrying automatically... (Attempt ${attempts}/${maxAttempts})`);
              
              await new Promise(resolve => setTimeout(resolve, delay));
              return attemptSetup();
            } else {
              setSetupError(
                'The backend service is still initializing after deployment. This may take a few moments. Please wait 30-60 seconds and click "Retry Setup" below.'
              );
              setIsRecovering(false);
              return false;
            }
          } else {
            // For non-canister-stopped errors, provide detailed feedback
            const friendlyMessage = getErrorMessage(error);
            setSetupError(`${friendlyMessage}\n\nTechnical details: ${error?.message || 'Unknown error'}`);
            return false;
          }
        }
      };

      const success = await attemptSetup();
      
      if (!success) {
        setIsSettingUpAdmin(false);
      }
    };

    setupAdmin();
  }, [identity, actor, isReady]);

  const handleManualRetry = async () => {
    if (!actor) {
      console.error('[Login] Cannot retry: actor not available');
      setSetupError('Backend connection not available. Please refresh the page and try again.');
      return;
    }
    
    console.log('[Login] Manual retry initiated');
    setIsSettingUpAdmin(true);
    setSetupError(null);
    setErrorDetails('');
    setRetryCount(0);
    setIsRecovering(true);

    try {
      console.log('[Login] Calling actor.setupAdmin() (manual retry)...');
      await actor.setupAdmin();
      console.log('[Login] Manual retry successful');
      setIsRecovering(false);
      
      setTimeout(() => {
        console.log('[Login] Navigating to dashboard');
        window.location.href = '/dashboard';
      }, 500);
    } catch (error: any) {
      console.error('[Login] Manual retry error:', {
        error,
        errorName: error?.name,
        errorMessage: error?.message,
        errorStack: error?.stack,
        isCanisterStopped: isCanisterStoppedError(error)
      });
      
      const detailedError = `
Error Type: ${error?.name || 'Unknown'}
Error Message: ${error?.message || 'No message'}
Error String: ${String(error)}
Is Canister Stopped: ${isCanisterStoppedError(error)}
Identity Principal: ${identity?.getPrincipal().toString()}
Actor Available: ${!!actor}
      `.trim();
      
      setErrorDetails(detailedError);
      setSetupError(`${getErrorMessage(error)}\n\nTechnical details: ${error?.message || 'Unknown error'}`);
      setIsRecovering(false);
      setIsSettingUpAdmin(false);
    }
  };

  const handleLogin = async () => {
    console.log('[Login] Login button clicked');
    console.log('[Login] Current login status:', loginStatus);
    
    try {
      console.log('[Login] Calling login()...');
      await login();
      console.log('[Login] Login call completed');
    } catch (error: any) {
      console.error('[Login] Login error:', {
        error,
        errorName: error?.name,
        errorMessage: error?.message,
        errorStack: error?.stack
      });
      setSetupError(`Login failed: ${error?.message || 'Unknown error'}`);
    }
  };

  // Log Internet Identity errors
  useEffect(() => {
    if (loginError) {
      console.error('[Login] Internet Identity login error:', {
        error: loginError,
        errorName: loginError?.name,
        errorMessage: loginError?.message,
        errorStack: loginError?.stack
      });
      setSetupError(`Authentication failed: ${loginError.message}`);
    }
  }, [loginError]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[oklch(0.97_0.015_60)] via-[oklch(0.95_0.02_80)] to-[oklch(0.93_0.03_100)] p-4">
      <Card className="w-full max-w-md shadow-xl border-[oklch(0.88_0.03_60)]">
        <CardHeader className="text-center space-y-4 bg-gradient-to-r from-[oklch(0.97_0.015_60)] to-[oklch(0.95_0.02_80)]">
          <div className="flex justify-center">
            <div className="p-4 bg-gradient-to-br from-[oklch(0.62_0.15_35)] to-[oklch(0.55_0.18_30)] rounded-full shadow-lg">
              <ChefHat className="h-12 w-12 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-[oklch(0.35_0.08_35)]">
            Jeevanam Kitchen
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            Professional Kitchen Management System
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {setupError && (
            <Alert variant="destructive" className="border-[oklch(0.55_0.18_30)]">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>
                {isRecovering ? 'System Initializing' : 'Setup Error'}
              </AlertTitle>
              <AlertDescription className="space-y-3">
                <p className="whitespace-pre-wrap">{setupError}</p>
                {retryCount > 0 && (
                  <p className="text-sm font-medium">
                    Retry attempt: {retryCount}/5
                  </p>
                )}
                {errorDetails && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm font-medium">
                      Show technical details
                    </summary>
                    <pre className="mt-2 text-xs bg-black/10 p-2 rounded overflow-x-auto whitespace-pre-wrap">
                      {errorDetails}
                    </pre>
                  </details>
                )}
                {!isRecovering && (
                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleManualRetry}
                      disabled={isSettingUpAdmin}
                      className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      {isSettingUpAdmin ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Retrying...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Retry Setup
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {isSettingUpAdmin && !setupError && (
            <Alert className="border-[oklch(0.62_0.15_35)] bg-[oklch(0.97_0.015_60)]">
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertTitle>Setting up your account</AlertTitle>
              <AlertDescription>
                {isRecovering 
                  ? `Waiting for backend to initialize... (Attempt ${retryCount}/5)`
                  : 'Please wait while we configure your admin access...'
                }
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <Button
              onClick={handleLogin}
              disabled={isLoggingIn || isSettingUpAdmin}
              className="w-full h-12 text-base bg-gradient-to-r from-[oklch(0.62_0.15_35)] to-[oklch(0.55_0.18_30)] hover:from-[oklch(0.58_0.15_35)] hover:to-[oklch(0.51_0.18_30)] text-white shadow-md"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Login with Internet Identity'
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground space-y-2">
              <p>Secure authentication powered by Internet Computer</p>
              <p className="text-xs">
                First-time users will be automatically set up as admin
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
