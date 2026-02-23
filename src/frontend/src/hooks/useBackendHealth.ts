import { useState, useEffect, useCallback } from 'react';
import { useActor } from './useActor';
import { useQueryClient } from '@tanstack/react-query';
import { isCanisterStoppedError, isNetworkError, getErrorMessage, calculateRetryDelay } from '@/utils/errorHandling';

const HEALTH_CHECK_INTERVAL = 10000; // Check every 10 seconds when healthy
const UNHEALTHY_CHECK_INTERVAL = 3000; // Check every 3 seconds when unhealthy
const MAX_RETRY_ATTEMPTS = 10;

export function useBackendHealth() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const [isHealthy, setIsHealthy] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [lastHealthCheck, setLastHealthCheck] = useState<number>(Date.now());
  const [lastError, setLastError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const checkHealth = useCallback(async () => {
    if (!actor) {
      setIsHealthy(false);
      setLastError('Backend actor not initialized');
      return false;
    }

    setIsChecking(true);

    try {
      // Use the dedicated health check endpoint
      const result = await actor.checkHealth();
      
      if (result) {
        const wasUnhealthy = !isHealthy;
        
        setIsHealthy(true);
        setLastError(null);
        setRetryCount(0);
        setLastHealthCheck(Date.now());
        
        // If we recovered from unhealthy state, invalidate all queries
        if (wasUnhealthy) {
          console.log('[useBackendHealth] Backend recovered, invalidating all queries');
          queryClient.invalidateQueries();
        }
        
        return true;
      } else {
        throw new Error('Health check returned false');
      }
    } catch (error: any) {
      console.error('[useBackendHealth] Health check failed:', error);
      
      const errorMessage = getErrorMessage(error);
      const isCanisterError = isCanisterStoppedError(error);
      const isNetError = isNetworkError(error);
      
      setIsHealthy(false);
      setLastError(errorMessage);
      setLastHealthCheck(Date.now());
      
      // Increment retry count for canister/network errors
      if (isCanisterError || isNetError) {
        setRetryCount(prev => Math.min(prev + 1, MAX_RETRY_ATTEMPTS));
      }
      
      return false;
    } finally {
      setIsChecking(false);
    }
  }, [actor, isHealthy, queryClient]);

  // Manual health check trigger
  const checkHealthNow = useCallback(() => {
    checkHealth();
  }, [checkHealth]);

  // Periodic health monitoring
  useEffect(() => {
    if (!actor) return;

    // Initial health check
    checkHealth();

    // Set up periodic checks with adaptive interval
    const interval = isHealthy ? HEALTH_CHECK_INTERVAL : UNHEALTHY_CHECK_INTERVAL;
    
    const intervalId = setInterval(() => {
      checkHealth();
    }, interval);

    return () => clearInterval(intervalId);
  }, [actor, isHealthy, checkHealth]);

  return {
    isHealthy,
    isChecking,
    lastHealthCheck,
    lastError,
    retryCount,
    checkHealthNow,
  };
}
