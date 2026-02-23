import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { isCanisterStoppedError, getErrorMessage } from '../hooks/useQueries';
import { useActor } from '../hooks/useActor';
import { LogIn, AlertCircle, ChefHat, Loader2 } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { login, loginStatus, identity } = useInternetIdentity();
  const { actor } = useActor();
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<any>(null);
  const [isSettingUpAdmin, setIsSettingUpAdmin] = useState(false);

  useEffect(() => {
    console.log('[Login] Component mounted');
    console.log('[Login] Login status:', loginStatus);
    console.log('[Login] Identity available:', !!identity);
    console.log('[Login] Actor available:', !!actor);
  }, [loginStatus, identity, actor]);

  useEffect(() => {
    const setupAdmin = async () => {
      if (loginStatus === 'success' && identity && actor) {
        console.log('[Login] Login successful, setting up admin...');
        console.log('[Login] Identity principal:', identity.getPrincipal().toString());
        
        setIsSettingUpAdmin(true);
        setError(null);
        setErrorDetails(null);

        try {
          console.log('[Login] Calling setupAdmin...');
          await actor.setupAdmin();
          console.log('[Login] Admin setup successful, navigating to dashboard');
          navigate({ to: '/' });
        } catch (err: any) {
          console.error('[Login] Admin setup error:', {
            error: err,
            message: err?.message,
            name: err?.name,
            stack: err?.stack,
            type: typeof err,
            isCanisterStopped: isCanisterStoppedError(err),
          });

          const errorMessage = getErrorMessage(err);
          setError(errorMessage);
          setErrorDetails(err);
        } finally {
          setIsSettingUpAdmin(false);
        }
      }
    };

    setupAdmin();
  }, [loginStatus, identity, actor, navigate]);

  const handleLogin = async () => {
    console.log('[Login] Login button clicked');
    setError(null);
    setErrorDetails(null);

    try {
      console.log('[Login] Calling login()...');
      await login();
      console.log('[Login] Login call completed');
    } catch (err: any) {
      console.error('[Login] Login error:', {
        error: err,
        message: err?.message,
        name: err?.name,
        stack: err?.stack,
        type: typeof err,
        isCanisterStopped: isCanisterStoppedError(err),
      });

      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      setErrorDetails(err);
    }
  };

  const isLoading = loginStatus === 'logging-in' || isSettingUpAdmin;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[oklch(0.97_0.01_60)] to-[oklch(0.95_0.02_80)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-[oklch(0.88_0.03_60)] shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-[oklch(0.62_0.15_35)] to-[oklch(0.55_0.18_30)] rounded-2xl flex items-center justify-center shadow-lg">
            <ChefHat className="w-8 h-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-[oklch(0.35_0.08_35)]">
              Jeevanam Kitchen
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Smart Calculator for Recipe Management
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Authentication Error</AlertTitle>
              <AlertDescription className="space-y-2">
                <p>{error}</p>
                {isCanisterStoppedError(errorDetails) && (
                  <p className="text-sm">
                    The backend service is temporarily unavailable. Please wait a moment and try again.
                  </p>
                )}
              </AlertDescription>
            </Alert>
          )}

          {isSettingUpAdmin && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertTitle>Setting up your account...</AlertTitle>
              <AlertDescription>
                Please wait while we configure your admin access.
              </AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full h-12 bg-gradient-to-r from-[oklch(0.62_0.15_35)] to-[oklch(0.55_0.18_30)] hover:from-[oklch(0.58_0.15_35)] hover:to-[oklch(0.51_0.18_30)] text-white text-base font-semibold shadow-md"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {isSettingUpAdmin ? 'Setting up...' : 'Connecting...'}
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-5 w-5" />
                Login with Internet Identity
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Secure authentication powered by Internet Computer
          </p>

          {process.env.NODE_ENV === 'development' && errorDetails && (
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                Technical Details (Development Only)
              </summary>
              <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                {JSON.stringify(
                  {
                    message: errorDetails?.message,
                    name: errorDetails?.name,
                    type: typeof errorDetails,
                  },
                  null,
                  2
                )}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
