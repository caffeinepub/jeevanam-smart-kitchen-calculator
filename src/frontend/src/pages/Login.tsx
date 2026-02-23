import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChefHat, Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useActor } from '../hooks/useActor';

export default function Login() {
  const { login, isLoggingIn, identity, loginStatus } = useInternetIdentity();
  const { actor } = useActor();

  useEffect(() => {
    if (identity && actor && loginStatus === 'success') {
      actor.setupAdmin().then(() => {
        window.location.href = '/';
      }).catch(console.error);
    }
  }, [identity, actor, loginStatus]);

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
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Standardize recipes, control costs, and optimize your kitchen operations
            </p>
          </div>
          <Button
            onClick={login}
            disabled={isLoggingIn}
            className="w-full h-12 text-base font-semibold bg-gradient-to-r from-[oklch(0.62_0.15_35)] to-[oklch(0.55_0.18_30)] hover:from-[oklch(0.58_0.15_35)] hover:to-[oklch(0.51_0.18_30)] text-white shadow-md"
            size="lg"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Connecting...
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
