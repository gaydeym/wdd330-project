const API_KEY = import.meta.env.VITE_SPOONACULAR_API_KEY || ''
const BASE_URL = 'https://api.spoonacular.com'

async function fetchFromAPI(endpoint) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}&apiKey=${API_KEY}`)

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('API request failed:', error)
    throw error
  }
}

export function searchRecipesByIngredients(ingredients, number = 12) {
  const ingredientsParam = ingredients.join(',')
  return fetchFromAPI(
    `/recipes/findByIngredients?ingredients=${ingredientsParam}&number=${number}&ranking=1&ignorePantry=false`,
  )
}

export function getRecipeInformation(recipeId) {
  return fetchFromAPI(`/recipes/${recipeId}/information?includeNutrition=true`)
}
