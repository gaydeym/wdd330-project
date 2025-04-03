// Claves para localStorage
const INGREDIENTS_KEY = 'recipeFinderIngredients'
const FAVORITES_KEY = 'recipeFinderFavorites'

// Save ingredients to localStorage. Last 10
export function saveIngredients(ingredients) {
  try {
    const existingIngredients = getIngredients()
    const newIngredients = [
      ...new Set([
        ...existingIngredients,
        ...ingredients.map((i) => i.trim().toLowerCase()),
      ]),
    ].slice(-10)

    localStorage.setItem(INGREDIENTS_KEY, JSON.stringify(newIngredients))
  } catch (error) {
    console.error('Error saving ingredients:', error)
  }
}

// Get saved ingredients
export function getIngredients() {
  try {
    return JSON.parse(localStorage.getItem(INGREDIENTS_KEY)) || []
  } catch (error) {
    console.error('Error retrieving ingredients:', error)
    return []
  }
}

// Clean ingredients from localStorage
export function clearIngredients() {
  try {
    localStorage.removeItem(INGREDIENTS_KEY)
  } catch (error) {
    console.error('Error clearing ingredients:', error)
  }
}

// Save a recipe to favorites
export function saveFavoriteRecipe(recipe) {
  try {
    const favorites = getFavoriteRecipes()
    if (!favorites.some((fav) => fav.id === recipe.id)) {
      favorites.push({
        id: recipe.id,
        title: recipe.title,
        image: recipe.image,
        usedIngredientCount: recipe.usedIngredientCount,
        missedIngredientCount: recipe.missedIngredientCount,
        usedIngredients: recipe.usedIngredients,
        missedIngredients: recipe.missedIngredients,
      })
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites))
    }
  } catch (error) {
    console.error('Error saving favorite recipe:', error)
  }
}

// Get favorite recipes
export function getFavoriteRecipes() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY)) || []
  } catch (error) {
    console.error('Error retrieving favorite recipes:', error)
    return []
  }
}

// Remove a recipe from favorites
export function removeFavoriteRecipe(recipeId) {
  try {
    const updatedFavorites = getFavoriteRecipes().filter(
      (recipe) => recipe.id !== recipeId,
    )
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavorites))
  } catch (error) {
    console.error('Error removing favorite recipe:', error)
  }
}

// Check if a recipe is in favorites
export function isRecipeFavorite(recipeId) {
  try {
    return getFavoriteRecipes().some((recipe) => recipe.id === recipeId)
  } catch (error) {
    console.error('Error checking favorite recipe:', error)
    return false
  }
}
