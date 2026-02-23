import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface RecipeCostAnalysis {
    breakdown: Array<CostBreakdown>;
    costPerPortion: number;
    totalBatchCost: number;
}
export interface RawMaterial {
    id: bigint;
    unitType: string;
    rawMaterialName: string;
    pricePerUnit: number;
}
export interface Ingredient {
    quantityPerPortion: number;
    rawMaterialId: bigint;
    unit: string;
}
export interface DashboardStats {
    totalIngredients: bigint;
    averageFoodCostPercentage: number;
    mostProducedItem: string;
    totalRecipes: bigint;
}
export interface CostBreakdown {
    costPerUnit: number;
    totalCost: number;
}
export interface backendInterface {
    addRawMaterial(rawMaterialName: string, unitType: string, pricePerUnit: number): Promise<void>;
    addRecipe(name: string, category: string, portionWeight: number, ingredients: Array<Ingredient>): Promise<void>;
    calculateCost(recipeName: string, quantity: number): Promise<RecipeCostAnalysis>;
    calculateProduction(recipeName: string, quantity: number): Promise<{
        totalPortionWeight: number;
        ingredients: Array<Ingredient>;
    }>;
    checkHealth(): Promise<boolean>;
    deleteRawMaterial(id: bigint): Promise<void>;
    editRawMaterial(id: bigint, rawMaterialName: string, unitType: string, pricePerUnit: number): Promise<void>;
    getAllCategories(): Promise<Array<string>>;
    getAllRawMaterials(): Promise<Array<RawMaterial>>;
    getDashboardStats(): Promise<DashboardStats>;
    getRawMaterial(id: bigint): Promise<RawMaterial | null>;
    getRecipesByCategory(category: string): Promise<Array<string>>;
    getStoreIssueSlip(recipeName: string, quantity: number): Promise<{
        productionQuantity: number;
        recipeName: string;
        date: string;
        ingredients: Array<Ingredient>;
    }>;
    setupAdmin(): Promise<void>;
}
