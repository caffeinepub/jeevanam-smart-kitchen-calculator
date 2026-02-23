import Map "mo:core/Map";
import List "mo:core/List";
import Float "mo:core/Float";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";



actor {
  public type IngredientQuantity = {
    quantity : Float;
    unit : Text;
  };

  public type Ingredient = {
    rawMaterialId : Nat;
    quantityPerPortion : Float;
    unit : Text;
  };

  public type Recipe = {
    name : Text;
    category : Text;
    portionWeight : Float;
    ingredients : [Ingredient];
  };

  public type CostBreakdown = {
    costPerUnit : Float;
    totalCost : Float;
  };

  public type RecipeCostAnalysis = {
    totalBatchCost : Float;
    costPerPortion : Float;
    breakdown : [CostBreakdown];
  };

  public type DashboardStats = {
    totalRecipes : Nat;
    totalIngredients : Nat;
    mostProducedItem : Text;
    averageFoodCostPercentage : Float;
  };

  public type RawMaterial = {
    id : Nat;
    rawMaterialName : Text;
    unitType : Text;
    pricePerUnit : Float;
  };

  public type Unit = {
    rawMaterialId : Nat;
    unitType : Text;
    conversionFactorToBase : Float;
  };

  let recipes = Map.empty<Text, Recipe>();
  let recipeProductionHistory = Map.empty<Text, Nat>();
  var adminId : ?Principal = null;
  var isInitialized = false;

  let ingredientsList = List.empty<Ingredient>();

  let rawMaterialsMap = Map.empty<Nat, RawMaterial>();
  var nextRawMaterialId = 1;

  public shared ({ caller }) func setupAdmin() : async () {
    switch (adminId) {
      case (null) {
        adminId := ?caller;
      };
      case (?admin) {
        if (admin != caller) {
          Runtime.trap("Only the admin can perform this action.");
        };
      };
    };
    isInitialized := true;
  };

  func checkInitialization() {
    if (not isInitialized) {
      Runtime.trap("System not initialized. Please complete admin setup.");
    };
  };

  func verifyAdmin(caller : Principal) {
    checkInitialization();
    switch (adminId) {
      case (?admin) {
        if (admin != caller) {
          Runtime.trap("Only the admin can perform this action.");
        };
      };
      case (null) {
        Runtime.trap("Admin not set up yet.");
      };
    };
  };

  public shared ({ caller }) func addRecipe(
    name : Text,
    category : Text,
    portionWeight : Float,
    ingredients : [Ingredient],
  ) : async () {
    verifyAdmin(caller);
    recipes.add(name, { name; category; portionWeight; ingredients });
  };

  public query ({ caller }) func calculateProduction(recipeName : Text, quantity : Float) : async {
    totalPortionWeight : Float;
    ingredients : [Ingredient];
  } {
    checkInitialization();
    switch (recipes.get(recipeName)) {
      case (?recipe) {
        let totalPortionWeight = recipe.portionWeight * quantity;
        let ingredients = recipe.ingredients.map(
          func(ingredient) {
            {
              ingredient with quantityPerPortion = ingredient.quantityPerPortion * quantity;
            };
          }
        );
        { totalPortionWeight; ingredients };
      };
      case (null) {
        Runtime.trap("Recipe not found");
      };
    };
  };

  public query ({ caller }) func getStoreIssueSlip(recipeName : Text, quantity : Float) : async {
    date : Text;
    recipeName : Text;
    productionQuantity : Float;
    ingredients : [Ingredient];
  } {
    checkInitialization();
    switch (recipes.get(recipeName)) {
      case (?recipe) {
        let ingredients = recipe.ingredients.map(
          func(ingredient) {
            {
              ingredient with quantityPerPortion = ingredient.quantityPerPortion * quantity;
            };
          }
        );
        {
          date = "2024-06-09";
          recipeName;
          productionQuantity = quantity;
          ingredients;
        };
      };
      case (null) {
        Runtime.trap("Recipe not found");
      };
    };
  };

  public query ({ caller }) func calculateCost(recipeName : Text, quantity : Float) : async RecipeCostAnalysis {
    checkInitialization();
    switch (recipes.get(recipeName)) {
      case (?recipe) {
        var totalCost = 0.0;
        let ingredientBreakdown = List.empty<CostBreakdown>();

        for (ingredient in recipe.ingredients.values()) {
          let ingredientQuantity = ingredient.quantityPerPortion * quantity;
          switch (rawMaterialsMap.get(ingredient.rawMaterialId)) {
            case (?rawMaterial) {
              let costPerUnit = rawMaterial.pricePerUnit;
              let convertedTotalCost = ingredientQuantity * costPerUnit;
              totalCost += convertedTotalCost;
              ingredientBreakdown.add({
                costPerUnit;
                totalCost = convertedTotalCost;
              });
            };
            case (null) {};
          };
        };

        {
          totalBatchCost = totalCost;
          costPerPortion = totalCost / quantity;
          breakdown = ingredientBreakdown.toArray();
        };
      };
      case (null) {
        Runtime.trap("Recipe not found");
      };
    };
  };

  public query ({ caller }) func getDashboardStats() : async DashboardStats {
    checkInitialization();
    let totalRecipes = recipes.size();
    let totalIngredients = getTotalIngredients();
    let mostProducedItem = getMostProducedItem();
    let averageFoodCostPercentage = calculateAverageFoodCost();
    {
      totalRecipes;
      totalIngredients;
      mostProducedItem;
      averageFoodCostPercentage;
    };
  };

  func getTotalIngredients() : Nat {
    var count = 0;
    for ((_, recipe) in recipes.entries()) {
      count += recipe.ingredients.size();
    };
    count;
  };

  func getMostProducedItem() : Text {
    var maxQty = 0;
    var mostProduced = "";
    for ((recipe, qty) in recipeProductionHistory.entries()) {
      if (qty > maxQty) {
        maxQty := qty;
        mostProduced := recipe;
      };
    };
    mostProduced;
  };

  func calculateAverageFoodCost() : Float {
    var totalFoodCost = 0.0;
    var recipeCount = 0;
    for ((name, recipe) in recipes.entries()) {
      let costOpt = calculateCostSync(name, 1.0);
      switch (costOpt) {
        case (?cost) {
          totalFoodCost += cost.costPerPortion;
          recipeCount += 1;
        };
        case (null) {};
      };
    };
    if (recipeCount == 0) { return 0.0 };
    totalFoodCost / recipeCount.toFloat();
  };

  func calculateCostSync(recipeName : Text, quantity : Float) : ?{ costPerPortion : Float } {
    switch (recipes.get(recipeName)) {
      case (?recipe) {
        var totalCost = 0.0;
        for (ingredient in recipe.ingredients.values()) {
          let ingredientQuantity = ingredient.quantityPerPortion * quantity;
          switch (rawMaterialsMap.get(ingredient.rawMaterialId)) {
            case (?rawMaterial) {
              totalCost += ingredientQuantity * rawMaterial.pricePerUnit;
            };
            case (null) {};
          };
        };
        ?{ costPerPortion = totalCost / quantity };
      };
      case (null) { null };
    };
  };

  public query ({ caller }) func getAllCategories() : async [Text] {
    checkInitialization();
    let categoriesList = List.empty<Text>();
    for ((_, recipe) in recipes.entries()) {
      if (not categoriesList.contains(recipe.category)) {
        categoriesList.add(recipe.category);
      };
    };
    categoriesList.toArray();
  };

  public query ({ caller }) func getRecipesByCategory(category : Text) : async [Text] {
    checkInitialization();
    let recipeNamesList = List.empty<Text>();
    for ((name, recipe) in recipes.entries()) {
      if (recipe.category == category) {
        recipeNamesList.add(name);
      };
    };
    recipeNamesList.toArray();
  };

  public shared ({ caller }) func addRawMaterial(rawMaterialName : Text, unitType : Text, pricePerUnit : Float) : async () {
    verifyAdmin(caller);
    if (pricePerUnit < 0.0) { Runtime.trap("Price per unit cannot be negative. ") };

    let trimmedName = rawMaterialName.trimStart(#char(' ')).trimEnd(#char(' '));
    if (trimmedName == "") {
      Runtime.trap("Raw material name cannot be empty or only whitespace.");
    };

    let exists = rawMaterialsMap.values().any(func(rm) { Text.equal(rm.rawMaterialName, rawMaterialName) });
    if (exists) {
      Runtime.trap("Raw material with this name already exists");
    };

    let newRawMaterial : RawMaterial = {
      id = nextRawMaterialId;
      rawMaterialName;
      unitType;
      pricePerUnit;
    };
    rawMaterialsMap.add(nextRawMaterialId, newRawMaterial);
    nextRawMaterialId += 1;
  };

  public query ({ caller }) func getAllRawMaterials() : async [RawMaterial] {
    checkInitialization();
    rawMaterialsMap.values().toArray();
  };

  public shared ({ caller }) func editRawMaterial(id : Nat, rawMaterialName : Text, unitType : Text, pricePerUnit : Float) : async () {
    verifyAdmin(caller);
    if (pricePerUnit < 0.0) { Runtime.trap("Price per unit cannot be negative. ") };

    let trimmedName = rawMaterialName.trimStart(#char(' ')).trimEnd(#char(' '));
    if (trimmedName == "") {
      Runtime.trap("Raw material name cannot be empty or only whitespace.");
    };

    let exists = rawMaterialsMap.values().any(func(rm) { Text.equal(rm.rawMaterialName, rawMaterialName) and rm.id != id });
    if (exists) {
      Runtime.trap("Raw material with this name already exists");
    };

    switch (rawMaterialsMap.get(id)) {
      case (null) { Runtime.trap("Raw material not found") };
      case (?_) {
        let updatedRawMaterial : RawMaterial = {
          id;
          rawMaterialName;
          unitType;
          pricePerUnit;
        };
        rawMaterialsMap.add(id, updatedRawMaterial);
      };
    };
  };

  public shared ({ caller }) func deleteRawMaterial(id : Nat) : async () {
    verifyAdmin(caller);
    switch (rawMaterialsMap.get(id)) {
      case (null) { Runtime.trap("Raw material not found") };
      case (?_) { rawMaterialsMap.remove(id) };
    };
  };

  public query ({ caller }) func getRawMaterial(id : Nat) : async ?RawMaterial {
    checkInitialization();
    rawMaterialsMap.get(id);
  };

  public query func checkHealth() : async Bool {
    true;
  };
};
