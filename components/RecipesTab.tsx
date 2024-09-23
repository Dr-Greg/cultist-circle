import React, { useState, useEffect } from "react"; // Import useEffect
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Import Select components

interface Recipe {
  name: string;
  ingredients: string[];
}

interface RecipesData {
  [key: string]: Recipe;
}

export const RecipesTab: React.FC<{
  tarkovItems: Record<string, string[]>;
}> = ({ tarkovItems }) => {
  const [tarkovRecipes, setTarkovRecipes] = useState<RecipesData>({});
  const [selectedRecipe, setSelectedRecipe] = useState<string | null>(null); // Define selectedRecipe state

  useEffect(() => {
    // Fetch the JSON data
    const fetchRecipes = async () => {
      try {
        const response = await fetch("/tarkovRecipes.json");
        if (!response.ok) throw new Error("Network response was not ok");
        const data: RecipesData = await response.json();
        setTarkovRecipes(data);
      } catch (error) {
        console.error("Failed to fetch recipes:", error);
      }
    };

    fetchRecipes();
  }, []);

  const renderIngredients = (ingredients: string[]) => {
    return ingredients.map((ingredient, index) => (
      <li key={index}>{ingredient}</li>
    ));
  };

  return (
    <div className="space-y-4 text-secondary ">
      <h2 className="text-2xl font-bold text-gray-200">Crafting Recipes</h2>
      {/* Replace the recipe display with a Select dropdown */}
      <Select onValueChange={setSelectedRecipe}>
        <SelectTrigger className="w-full bg-gray-800">
          <SelectValue placeholder="Choose a recipe" />
        </SelectTrigger>
        <SelectContent>
          {Object.keys(tarkovRecipes).map((recipe) => (
            <SelectItem key={recipe} value={recipe}>
              {recipe}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedRecipe && tarkovRecipes[selectedRecipe] && (
        <div className="bg-gray-700 p-4 rounded-lg">
          {/* <h3 className="text-xl font-semibold text-gray-100 mb-2">
            {selectedRecipe}
          </h3> */}
          <h4 className="text-lg mb-1">Required Items:</h4>
          <ul className="list-disc list-inside text-gray-300">
            {renderIngredients(tarkovRecipes[selectedRecipe].ingredients)}
          </ul>
        </div>
      )}
      {/* End of New Recipe Section */}
    </div>
  );
};
