import { searchRecipesByIngredients, getRecipeInformation } from './api.js'
import {
  saveIngredients,
  getIngredients,
  clearIngredients,
  getFavoriteRecipes,
} from './storage.js'
import {
  renderRecipeCards,
  renderIngredientHistory,
  showLoading,
  hideLoading,
  showError,
  closeRecipeModal,
  toggleView,
  loadPartials,
} from './ui.js'
import {
  loadCategories,
  renderCategoryFilters,
  filterRecipesByCategories,
  renderActiveFilters,
} from './categories.js'

// Element and state variables
let ingredientsInput,
  searchBtn,
  clearBtn,
  resultsSection,
  closeModalBtn,
  homeLink,
  favoritesLink,
  siteTitle
let allRecipes = [],
  categories = [],
  activeFilters = []

async function init() {
  await loadPartials()

  // Getting DOM Elements
  ingredientsInput = document.getElementById('ingredients-input')
  searchBtn = document.getElementById('search-btn')
  clearBtn = document.getElementById('clear-btn')
  resultsSection = document.getElementById('results-section')
  closeModalBtn = document.querySelector('.close-modal')
  homeLink = document.getElementById('home-link')
  favoritesLink = document.getElementById('favorites-link')
  siteTitle = document.getElementById('site-title')

  renderIngredientHistory(getIngredients())

  // Load categories and render filters
  try {
    const data = await loadCategories()
    categories = data.categories
    renderCategoryFilters(categories, handleFilterChange)
  } catch (error) {
    console.error('Error loading categories:', error)
  }

  // Listeners
  searchBtn.addEventListener('click', handleSearch)
  clearBtn.addEventListener('click', handleClear)
  closeModalBtn.addEventListener('click', closeRecipeModal)
  homeLink.addEventListener('click', () => toggleView('home'))
  favoritesLink.addEventListener('click', handleFavoritesView)
  siteTitle.addEventListener('click', () => toggleView('home'))
  ingredientsInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch()
  })
}

async function handleSearch() {
  const text = ingredientsInput.value.trim()
  if (!text) return showError('Please enter at least one ingredient.')

  const ingredients = text
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s)
  if (!ingredients.length) return showError('Please enter valid ingredients.')

  saveIngredients(ingredients)
  renderIngredientHistory(getIngredients())

  showLoading()
  resultsSection.classList.add('hidden')

  try {
    const recipes = await searchRecipesByIngredients(ingredients)
    allRecipes = recipes

    // = active filters => details are obtained to filter
    if (activeFilters.length) {
      allRecipes = await Promise.all(
        recipes.map(async (recipe) => {
          try {
            const details = await getRecipeInformation(recipe.id)
            return {
              ...recipe,
              diets: details.diets || [],
              dishTypes: details.dishTypes || [],
            }
          } catch (error) {
            console.error(
              `Error fetching details for recipe ${recipe.id}:`,
              error,
            )
            return recipe
          }
        }),
      )
    }

    updateRecipeCards()
    hideLoading()
    resultsSection.classList.remove('hidden')
  } catch (error) {
    hideLoading()
    showError('Failed to fetch recipes. Please try again later.')
    console.error('Search error:', error)
  }
}

function updateRecipeCards() {
  const filtered = activeFilters.length
    ? filterRecipesByCategories(allRecipes, activeFilters)
    : allRecipes
  renderRecipeCards(filtered, 'results-container')
  renderActiveFilters(activeFilters, handleRemoveFilter)
}

function handleFilterChange(category, isActive) {
  if (isActive && !activeFilters.includes(category)) {
    activeFilters.push(category)
  } else {
    activeFilters = activeFilters.filter((c) => c !== category)
  }
  if (allRecipes.length) updateRecipeCards()
}

function handleRemoveFilter(category) {
  activeFilters = activeFilters.filter((c) => c !== category)
  const filterElement = document.querySelector(
    `.filter-button[data-category="${category}"]`,
  )
  if (filterElement) {
    filterElement.classList.remove('active')
    const checkIcon = filterElement.querySelector('.check-icon')
    if (checkIcon) checkIcon.remove()
  }
  if (allRecipes.length) updateRecipeCards()
}

function handleClear() {
  ingredientsInput.value = ''
  clearIngredients()
  renderIngredientHistory([])
  resultsSection.classList.add('hidden')
  activeFilters = []
  renderCategoryFilters(categories, handleFilterChange, activeFilters)
  renderActiveFilters(activeFilters, handleRemoveFilter)
  allRecipes = []
}

function handleFavoritesView(e) {
  e.preventDefault()
  toggleView('favorites')
  const favorites = getFavoriteRecipes()
  renderRecipeCards(favorites, 'favorites-container', true)
}

document.addEventListener('DOMContentLoaded', init)
