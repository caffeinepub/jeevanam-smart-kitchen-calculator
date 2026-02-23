import { useState, useEffect } from 'react';
import { useActor } from './useActor';
import { useQueryClient } from '@tanstack/react-query';

const HEALTH_CHECK_INTERVAL = 5000; // Check every 5 seconds

export function useBackendHealth() {
    const { actor } = useActor();
    const queryClient = useQueryClient();
    const [isHealthy, setIsHealthy] = useState(true);
    const [lastHealthCheck, setLastHealthCheck] = useState<number>(Date.now());

    // Health monitoring: periodically check if backend is responsive
    useEffect(() => {
        if (!actor) return;

        const checkHealth = async () => {
            try {
                // Try a lightweight query to check if backend is responsive
                await actor.getAllCategories();
                
                // If we were unhealthy and now healthy, invalidate all queries to refresh data
                if (!isHealthy) {
                    console.log('[useBackendHealth] Backend recovered, invalidating all queries');
                    setIsHealthy(true);
                    queryClient.invalidateQueries();
                } else {
                    setIsHealthy(true);
                }
                
                setLastHealthCheck(Date.now());
            } catch (error: any) {
                const errorStr = error?.message?.toLowerCase() || '';
                const isCanisterStopped = errorStr.includes('ic0508') || 
                                         (errorStr.includes('canister') && errorStr.includes('stopped'));
                
                if (isCanisterStopped) {
                    console.log('[useBackendHealth] Backend canister is stopped, marking as unhealthy');
                    setIsHealthy(false);
                }
            }
        };

        // Initial health check
        checkHealth();

        // Set up periodic health checks
        const interval = setInterval(checkHealth, HEALTH_CHECK_INTERVAL);

        return () => clearInterval(interval);
    }, [actor, isHealthy, queryClient]);

    return {
        isHealthy,
        lastHealthCheck
    };
}
