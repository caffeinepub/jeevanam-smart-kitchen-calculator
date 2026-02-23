import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Ingredient, RecipeCostAnalysis, DashboardStats, RawMaterial } from '../backend';

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

// Helper to detect canister stopped errors
export function isCanisterStoppedError(error: any): boolean {
  if (!error?.message) return false;
  const errorStr = error.message.toLowerCase();
  return errorStr.includes('ic0508') || 
         (errorStr.includes('canister') && errorStr.includes('stopped')) ||
         errorStr.includes('service temporarily unavailable');
}

// Helper to get user-friendly error message
export function getErrorMessage(error: any): string {
  if (!error?.message) return 'An unexpected error occurred';
  
  const errorStr = error.message.toLowerCase();
  
  if (isCanisterStoppedError(error)) {
    return 'Service temporarily unavailable. The backend is currently stopped. Please wait a moment and try again.';
  }
  
  if (errorStr.includes('admin not set up') || errorStr.includes('only the admin')) {
    return 'Authentication error: Admin access not properly configured. Please log out and log back in.';
  }
  
  if (errorStr.includes('reject')) {
    return 'Request was rejected by the service. Please try again.';
  }
  
  if (errorStr.includes('already exists')) {
    return 'This item already exists';
  }
  
  if (errorStr.includes('not found')) {
    return 'Item not found';
  }
  
  if (errorStr.includes('cannot be negative')) {
    return 'Value cannot be negative';
  }
  
  if (errorStr.includes('cannot be empty')) {
    return 'Value cannot be empty';
  }
  
  // Return original message if it's user-friendly
  if (!errorStr.includes('actor') && !errorStr.includes('undefined')) {
    return error.message;
  }
  
  return 'An unexpected error occurred. Please try again.';
}

// Recipe queries
export function useGetAllRecipes() {
  const { actor, isFetching } = useActor();

  return useQuery<Recipe[]>({
    queryKey: ['recipes'],
    queryFn: async () => {
      if (!actor) return [];
      
      // Get all categories from backend
      const categories = await actor.getAllCategories();
      const allRecipes: Recipe[] = [];
      
      // For each category, get recipes
      for (const category of categories) {
        const recipeNames = await actor.getRecipesByCategory(category);
        
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
            console.error(`Failed to fetch recipe ${recipeName}:`, error);
          }
        }
      }
      
      return allRecipes;
    },
    enabled: !!actor && !isFetching,
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
      ingredients: Array<{ name: string; quantityPerPortion: number; unit: string }>;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.addRecipe(recipe.name, recipe.category, recipe.portionWeight, recipe.ingredients);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
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
  });
}

// Cost queries
export function useSetIngredientCost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ingredientName,
      costPerUnit,
      unit,
    }: {
      ingredientName: string;
      costPerUnit: number;
      unit: string;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.setIngredientCost(ingredientName, costPerUnit, unit);
      
      // Also save to localStorage for UI persistence
      const storedCosts = localStorage.getItem('jeevanam_ingredient_costs');
      const costs = storedCosts ? JSON.parse(storedCosts) : {};
      costs[ingredientName] = {
        cost: costPerUnit,
        unit,
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem('jeevanam_ingredient_costs', JSON.stringify(costs));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredientCosts'] });
    },
  });
}

export function useUpdateIngredientCost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ingredientName,
      newCostPerUnit,
    }: {
      ingredientName: string;
      newCostPerUnit: number;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.updateIngredientCost(ingredientName, newCostPerUnit);
      
      // Also update localStorage
      const storedCosts = localStorage.getItem('jeevanam_ingredient_costs');
      const costs = storedCosts ? JSON.parse(storedCosts) : {};
      if (costs[ingredientName]) {
        costs[ingredientName].cost = newCostPerUnit;
        costs[ingredientName].lastUpdated = new Date().toISOString();
        localStorage.setItem('jeevanam_ingredient_costs', JSON.stringify(costs));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredientCosts'] });
    },
  });
}

export function useCalculateCost() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({ recipeName, quantity }: { recipeName: string; quantity: number }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.calculateCost(recipeName, quantity);
    },
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
      if (!actor) return [];
      return actor.getAllRawMaterials();
    },
    enabled: !!actor && !isFetching,
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
      // Enhanced error logging for debugging
      console.error('Add raw material error details:', {
        message: error?.message,
        name: error?.name,
        isCanisterStopped: isCanisterStoppedError(error),
        friendlyMessage: getErrorMessage(error),
      });
    },
    retry: (failureCount, error: any) => {
      // Don't retry on validation errors or duplicate errors
      const errorStr = error?.message?.toLowerCase() || '';
      if (errorStr.includes('already exists') || 
          errorStr.includes('cannot be negative') || 
          errorStr.includes('cannot be empty') ||
          errorStr.includes('admin not set up') ||
          errorStr.includes('only the admin')) {
        return false;
      }
      
      // Retry up to 3 times for canister stopped errors with exponential backoff
      if (isCanisterStoppedError(error) && failureCount < 3) {
        return true;
      }
      
      // Retry once for other rejection errors
      if (errorStr.includes('reject') && failureCount < 1) {
        return true;
      }
      
      return false;
    },
    retryDelay: (attemptIndex) => {
      // Exponential backoff: 2s, 4s, 8s for canister stopped errors
      return Math.min(2000 * Math.pow(2, attemptIndex), 8000);
    },
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
      console.error('Edit raw material error details:', {
        message: error?.message,
        name: error?.name,
        isCanisterStopped: isCanisterStoppedError(error),
        friendlyMessage: getErrorMessage(error),
      });
    },
    retry: (failureCount, error: any) => {
      const errorStr = error?.message?.toLowerCase() || '';
      
      if (errorStr.includes('already exists') || 
          errorStr.includes('cannot be negative') || 
          errorStr.includes('cannot be empty') ||
          errorStr.includes('not found') ||
          errorStr.includes('admin not set up') ||
          errorStr.includes('only the admin')) {
        return false;
      }
      
      if (isCanisterStoppedError(error) && failureCount < 3) {
        return true;
      }
      
      if (errorStr.includes('reject') && failureCount < 1) {
        return true;
      }
      
      return false;
    },
    retryDelay: (attemptIndex) => {
      return Math.min(2000 * Math.pow(2, attemptIndex), 8000);
    },
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
      console.error('Delete raw material error details:', {
        message: error?.message,
        name: error?.name,
        isCanisterStopped: isCanisterStoppedError(error),
        friendlyMessage: getErrorMessage(error),
      });
    },
    retry: (failureCount, error: any) => {
      const errorStr = error?.message?.toLowerCase() || '';
      
      if (errorStr.includes('not found') ||
          errorStr.includes('admin not set up') ||
          errorStr.includes('only the admin')) {
        return false;
      }
      
      if (isCanisterStoppedError(error) && failureCount < 3) {
        return true;
      }
      
      if (errorStr.includes('reject') && failureCount < 1) {
        return true;
      }
      
      return false;
    },
    retryDelay: (attemptIndex) => {
      return Math.min(2000 * Math.pow(2, attemptIndex), 8000);
    },
  });
}
