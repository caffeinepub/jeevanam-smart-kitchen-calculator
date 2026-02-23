import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Ingredient, RecipeCostAnalysis, DashboardStats, RawMaterial } from '../backend';
import { shouldRetryError, calculateRetryDelay, isCanisterStoppedError, getErrorMessage } from '@/utils/errorHandling';

// Re-export error handling utilities for convenience
export { isCanisterStoppedError, getErrorMessage };

interface Recipe {
  name: string;
  category: string;
  portionWeight: number;
  ingredients: Ingredient[];
}

interface ProductionRecord {
  date: string;
  recipeName: string;
  quantity: number;
  cost: number;
  ingredients: Array<{ name: string; quantity: number; unit: string }>;
}

// Local storage key for production history
const PRODUCTION_HISTORY_KEY = 'jeevanam_production_history';

// Helper to get production history from localStorage
const getProductionHistory = (): ProductionRecord[] => {
  try {
    const stored = localStorage.getItem(PRODUCTION_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Helper to save production history to localStorage
const saveProductionHistory = (history: ProductionRecord[]) => {
  localStorage.setItem(PRODUCTION_HISTORY_KEY, JSON.stringify(history));
};

// Recipe queries
export function useGetAllRecipes() {
  const { actor, isFetching } = useActor();

  return useQuery<Recipe[]>({
    queryKey: ['recipes'],
    queryFn: async () => {
      console.log('[useGetAllRecipes] Starting query, actor available:', !!actor);
      
      if (!actor) {
        console.warn('[useGetAllRecipes] Actor not available');
        return [];
      }
      
      try {
        // Get all categories from backend
        console.log('[useGetAllRecipes] Fetching categories...');
        const categories = await actor.getAllCategories();
        console.log('[useGetAllRecipes] Categories fetched:', categories);
        
        const allRecipes: Recipe[] = [];
        
        // For each category, get recipes
        for (const category of categories) {
          console.log(`[useGetAllRecipes] Fetching recipes for category: ${category}`);
          const recipeNames = await actor.getRecipesByCategory(category);
          console.log(`[useGetAllRecipes] Found ${recipeNames.length} recipes in ${category}`);
          
          // For each recipe, get its details via calculateProduction with quantity 1
          for (const recipeName of recipeNames) {
            try {
              const result = await actor.calculateProduction(recipeName, 1.0);
              allRecipes.push({
                name: recipeName,
                category,
                portionWeight: result.totalPortionWeight,
                ingredients: result.ingredients,
              });
            } catch (error) {
              console.error(`[useGetAllRecipes] Failed to fetch recipe ${recipeName}:`, error);
            }
          }
        }
        
        console.log(`[useGetAllRecipes] Successfully fetched ${allRecipes.length} recipes`);
        return allRecipes;
      } catch (error) {
        console.error('[useGetAllRecipes] Error fetching recipes:', error);
        throw error;
      }
    },
    enabled: !!actor && !isFetching,
    retry: (failureCount, error: any) => {
      const shouldRetry = shouldRetryError(error, failureCount);
      if (shouldRetry) {
        console.log(`[useGetAllRecipes] Retrying (attempt ${failureCount + 1})`);
      }
      return shouldRetry;
    },
    retryDelay: (attemptIndex) => {
      const delay = calculateRetryDelay(attemptIndex);
      console.log(`[useGetAllRecipes] Retry delay: ${delay}ms`);
      return delay;
    },
  });
}

export function useAddRecipe() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recipe: {
      name: string;
      category: string;
      portionWeight: number;
      ingredients: Ingredient[];
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.addRecipe(recipe.name, recipe.category, recipe.portionWeight, recipe.ingredients);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    retry: (failureCount, error: any) => shouldRetryError(error, failureCount),
    retryDelay: (attemptIndex) => calculateRetryDelay(attemptIndex),
  });
}

// Category queries
export function useGetAllCategories() {
  const { actor, isFetching } = useActor();

  return useQuery<string[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllCategories();
    },
    enabled: !!actor && !isFetching,
    retry: (failureCount, error: any) => shouldRetryError(error, failureCount),
    retryDelay: (attemptIndex) => calculateRetryDelay(attemptIndex),
  });
}

export function useGetRecipesByCategory(category: string) {
  const { actor, isFetching } = useActor();

  return useQuery<string[]>({
    queryKey: ['recipes', 'category', category],
    queryFn: async () => {
      if (!actor || !category) return [];
      return actor.getRecipesByCategory(category);
    },
    enabled: !!actor && !isFetching && !!category,
    retry: (failureCount, error: any) => shouldRetryError(error, failureCount),
    retryDelay: (attemptIndex) => calculateRetryDelay(attemptIndex),
  });
}

// Production calculation
export function useCalculateProduction() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({ recipeName, quantity }: { recipeName: string; quantity: number }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.calculateProduction(recipeName, quantity);
    },
    retry: (failureCount, error: any) => shouldRetryError(error, failureCount),
    retryDelay: (attemptIndex) => calculateRetryDelay(attemptIndex),
  });
}

// Store issue slip
export function useGetStoreIssueSlip() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({ recipeName, quantity }: { recipeName: string; quantity: number }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.getStoreIssueSlip(recipeName, quantity);
    },
    retry: (failureCount, error: any) => shouldRetryError(error, failureCount),
    retryDelay: (attemptIndex) => calculateRetryDelay(attemptIndex),
  });
}

// Cost calculation
export function useCalculateCost() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({ recipeName, quantity }: { recipeName: string; quantity: number }) => {
      console.log('[useCalculateCost] Starting cost calculation:', { recipeName, quantity });
      
      if (!actor) {
        console.error('[useCalculateCost] Actor not initialized');
        throw new Error('Actor not initialized');
      }
      
      try {
        console.log('[useCalculateCost] Calling backend calculateCost...');
        const result = await actor.calculateCost(recipeName, quantity);
        console.log('[useCalculateCost] Backend response:', result);
        return result;
      } catch (error) {
        console.error('[useCalculateCost] Error calculating cost:', {
          error,
          message: error instanceof Error ? error.message : 'Unknown error',
          recipeName,
          quantity
        });
        throw error;
      }
    },
    retry: (failureCount, error: any) => shouldRetryError(error, failureCount),
    retryDelay: (attemptIndex) => calculateRetryDelay(attemptIndex),
  });
}

// Dashboard queries
export function useGetDashboardStats() {
  const { actor, isFetching } = useActor();

  return useQuery<DashboardStats>({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      if (!actor) {
        return {
          totalRecipes: BigInt(0),
          totalIngredients: BigInt(0),
          mostProducedItem: '',
          averageFoodCostPercentage: 0,
        };
      }
      return actor.getDashboardStats();
    },
    enabled: !!actor && !isFetching,
    retry: (failureCount, error: any) => {
      const shouldRetry = shouldRetryError(error, failureCount);
      if (shouldRetry) {
        console.log(`[useGetDashboardStats] Retrying (attempt ${failureCount + 1})`);
      }
      return shouldRetry;
    },
    retryDelay: (attemptIndex) => {
      const delay = calculateRetryDelay(attemptIndex);
      console.log(`[useGetDashboardStats] Retry delay: ${delay}ms`);
      return delay;
    },
  });
}

export function useGetProductionHistory() {
  return useQuery<ProductionRecord[]>({
    queryKey: ['productionHistory'],
    queryFn: () => {
      return getProductionHistory();
    },
  });
}

// Raw Material queries
export function useGetAllRawMaterials() {
  const { actor, isFetching } = useActor();

  return useQuery<RawMaterial[]>({
    queryKey: ['rawMaterials'],
    queryFn: async () => {
      console.log('[useGetAllRawMaterials] Starting query, actor available:', !!actor);
      
      if (!actor) {
        console.warn('[useGetAllRawMaterials] Actor not available');
        return [];
      }
      
      try {
        console.log('[useGetAllRawMaterials] Fetching raw materials from backend...');
        const rawMaterials = await actor.getAllRawMaterials();
        console.log('[useGetAllRawMaterials] Successfully fetched raw materials:', rawMaterials);
        console.log('[useGetAllRawMaterials] Raw materials count:', rawMaterials.length);
        
        // Log each raw material for debugging
        rawMaterials.forEach((rm, index) => {
          console.log(`[useGetAllRawMaterials] Raw Material ${index + 1}:`, {
            id: rm.id.toString(),
            name: rm.rawMaterialName,
            unitType: rm.unitType,
            pricePerUnit: rm.pricePerUnit
          });
        });
        
        return rawMaterials;
      } catch (error) {
        console.error('[useGetAllRawMaterials] Error fetching raw materials:', {
          error,
          message: error instanceof Error ? error.message : 'Unknown error',
          isCanisterStopped: isCanisterStoppedError(error)
        });
        throw error;
      }
    },
    enabled: !!actor && !isFetching,
    retry: (failureCount, error: any) => {
      const shouldRetry = shouldRetryError(error, failureCount);
      if (shouldRetry) {
        console.log(`[useGetAllRawMaterials] Retrying (attempt ${failureCount + 1})`);
      }
      return shouldRetry;
    },
    retryDelay: (attemptIndex) => {
      const delay = calculateRetryDelay(attemptIndex);
      console.log(`[useGetAllRawMaterials] Retry delay: ${delay}ms`);
      return delay;
    },
  });
}

export function useAddRawMaterial() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      rawMaterialName,
      unitType,
      pricePerUnit,
    }: {
      rawMaterialName: string;
      unitType: string;
      pricePerUnit: number;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.addRawMaterial(rawMaterialName, unitType, pricePerUnit);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rawMaterials'] });
    },
    onError: (error: any) => {
      console.error('[useAddRawMaterial] Error details:', {
        message: error?.message,
        name: error?.name,
        isCanisterStopped: isCanisterStoppedError(error),
        friendlyMessage: getErrorMessage(error),
      });
    },
    retry: (failureCount, error: any) => shouldRetryError(error, failureCount),
    retryDelay: (attemptIndex) => calculateRetryDelay(attemptIndex),
  });
}

export function useEditRawMaterial() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      rawMaterialName,
      unitType,
      pricePerUnit,
    }: {
      id: bigint;
      rawMaterialName: string;
      unitType: string;
      pricePerUnit: number;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.editRawMaterial(id, rawMaterialName, unitType, pricePerUnit);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rawMaterials'] });
    },
    onError: (error: any) => {
      console.error('[useEditRawMaterial] Error details:', {
        message: error?.message,
        name: error?.name,
        isCanisterStopped: isCanisterStoppedError(error),
        friendlyMessage: getErrorMessage(error),
      });
    },
    retry: (failureCount, error: any) => shouldRetryError(error, failureCount),
    retryDelay: (attemptIndex) => calculateRetryDelay(attemptIndex),
  });
}

export function useDeleteRawMaterial() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.deleteRawMaterial(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rawMaterials'] });
    },
    onError: (error: any) => {
      console.error('[useDeleteRawMaterial] Error details:', {
        message: error?.message,
        name: error?.name,
        isCanisterStopped: isCanisterStoppedError(error),
        friendlyMessage: getErrorMessage(error),
      });
    },
    retry: (failureCount, error: any) => shouldRetryError(error, failureCount),
    retryDelay: (attemptIndex) => calculateRetryDelay(attemptIndex),
  });
}
