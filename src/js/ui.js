import {
  isRecipeFavorite,
  saveFavoriteRecipe,
  removeFavoriteRecipe,
} from './storage.js'
import { getRecipeInformation } from './api.js'

// Load header and footer
export async function loadPartials() {
  try {
    const [headerHtml, footerHtml] = await Promise.all([
      fetch('/partials/header.html').then((res) => res.text()),
      fetch('/partials/footer.html').then((res) => res.text()),
    ])
    document.getElementById('header').innerHTML = headerHtml
    document.getElementById('footer').innerHTML = footerHtml
  } catch (error) {
    console.error('Error loading partials:', error)
  }
}

// Render recipes cards
export function renderRecipeCards(recipes, containerId, isFavorites = false) {
  const container = document.getElementById(containerId)
  container.innerHTML = ''

  if (!recipes?.length) {
    container.innerHTML = `
      <div class="no-results">
        <p>${
          isFavorites
            ? 'No favorite recipes yet. Explore recipes and save your favorites!'
            : 'No recipes found. Try different ingredients or check your spelling.'
        }
        </p>
      </div>
    `
    return
  }

  recipes.forEach((recipe, index) => {
    const card = document.createElement('div')
    card.className = 'recipe-card'
    card.dataset.id = recipe.id
    card.style.animation = `fadeIn 0.5s ease forwards ${index * 0.1}s`
    card.style.opacity = '0'

    const favorite = isRecipeFavorite(recipe.id)
    card.innerHTML = `
      <img src="${recipe.image}" alt="${recipe.title}" class="recipe-image">
      <div class="recipe-info">
        <h3 class="recipe-title">${recipe.title}</h3>
        <div class="recipe-ingredients">
          <div class="ingredients-list">${renderIngredientTags(recipe)}</div>
        </div>
        <div class="recipe-actions">
          <button class="view-recipe">View Recipe</button>
          ${
            isFavorites
              ? '<button class="remove-favorite">Remove</button>'
              : `<button class="save-recipe ${favorite ? 'saved' : ''}">${favorite ? 'Saved' : 'Save'}</button>`
          }
        </div>
      </div>
    `

    // Events
    card
      .querySelector('.view-recipe')
      .addEventListener('click', () => openRecipeModal(recipe.id))

    if (isFavorites) {
      card.querySelector('.remove-favorite').addEventListener('click', () => {
        removeFavoriteRecipe(recipe.id)
        card.style.animation = 'fadeOut 0.3s ease forwards'
        setTimeout(() => {
          card.remove()
          if (!container.querySelectorAll('.recipe-card').length) {
            renderRecipeCards([], containerId, true)
          }
        }, 300)
      })
    } else {
      const saveBtn = card.querySelector('.save-recipe')
      saveBtn.addEventListener('click', () => {
        if (!favorite) {
          saveFavoriteRecipe(recipe)
          saveBtn.textContent = 'Saved'
          saveBtn.classList.add('saved')
          saveBtn.style.animation = 'bounce 0.5s ease'
          setTimeout(() => (saveBtn.style.animation = ''), 500)
        } else {
          removeFavoriteRecipe(recipe.id)
          saveBtn.textContent = 'Save'
          saveBtn.classList.remove('saved')
        }
      })
    }

    container.appendChild(card)
  })

  // Insert animation if it doesn't exist
  if (!document.getElementById('animation-styles')) {
    const style = document.createElement('style')
    style.id = 'animation-styles'
    style.textContent = `
      @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes fadeOut { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(20px); } }
      @keyframes bounce { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.02); } }
    `
    document.head.appendChild(style)
  }
}

// Generate HTML for ingredient labels
function renderIngredientTags(recipe) {
  let html = ''

  // Show up to 3 ingredients (used)
  if (recipe.usedIngredients?.length) {
    recipe.usedIngredients
      .slice(0, 3)
      .forEach(
        (i) => (html += `<span class="ingredient-tag used">${i.name}</span>`),
      )
  }
  // Show up to 3 ingredients (missing)
  if (recipe.missedIngredients?.length) {
    recipe.missedIngredients
      .slice(0, 3)
      .forEach(
        (i) =>
          (html += `<span class="ingredient-tag missing">${i.name}</span>`),
      )
  }
  const total =
    (recipe.usedIngredients?.length || 0) +
    (recipe.missedIngredients?.length || 0)
  if (total > 6)
    html += `<span class="ingredient-tag">+${total - 6} more</span>`
  // Diets available (max 2)
  if (recipe.diets?.length) {
    recipe.diets
      .slice(0, 2)
      .forEach((d) => (html += `<span class="ingredient-tag">${d}</span>`))
  }

  return html
}

// Opens the modal with recipe
export async function openRecipeModal(recipeId) {
  const modal = document.getElementById('recipe-modal')
  const content = document.getElementById('modal-content')

  content.innerHTML = `
    <div class="loading-spinner">
      <div class="spinner"></div>
      <p>Loading recipe details...</p>
    </div>
  `
  modal.classList.remove('hidden')

  try {
    const recipe = await getRecipeInformation(recipeId)
    content.innerHTML = `
      <div class="recipe-detail">
        <h2>${recipe.title}</h2>
        <img src="${recipe.image}" alt="${recipe.title}">
        <div class="recipe-meta">
          <div><span>${recipe.readyInMinutes}</span><p>Minutes</p></div>
          <div><span>${recipe.servings}</span><p>Servings</p></div>
          ${recipe.healthScore ? `<div><span>${recipe.healthScore}</span><p>Health Score</p></div>` : ''}
        </div>
        ${
          recipe.diets?.length
            ? `
          <div class="recipe-categories">
            <h3>Diet Categories</h3>
            <div class="ingredients-list">
              ${recipe.diets.map((d) => `<span class="ingredient-tag">${d}</span>`).join('')}
            </div>
          </div>
        `
            : ''
        }
        <div class="recipe-ingredients">
          <h3>Ingredients</h3>
          <ul>${recipe.extendedIngredients.map((i) => `<li>${i.original}</li>`).join('')}</ul>
        </div>
        <div class="recipe-instructions">
          <h3>Instructions</h3>
          ${
            recipe.instructions
              ? `<div>${recipe.instructions}</div>`
              : recipe.analyzedInstructions?.[0]?.steps
                ? `<ol>${recipe.analyzedInstructions[0].steps.map((step) => `<li>${step.step}</li>`).join('')}</ol>`
                : '<p>No instructions available for this recipe.</p>'
          }
        </div>
        ${
          recipe.nutrition
            ? `<div class="recipe-nutrition">
                <h3>Nutrition Information</h3>
                <ul>${recipe.nutrition.nutrients
                  .slice(0, 6)
                  .map(
                    (n) =>
                      `<li><strong>${n.name}:</strong> ${n.amount}${n.unit}</li>`,
                  )
                  .join('')}</ul>
              </div>`
            : ''
        }
      </div>
    `
  } catch (error) {
    console.error('Error loading recipe details:', error)
    content.innerHTML = `
      <div class="error-message">
        <h3>Error Loading Recipe</h3>
        <p>Sorry, we couldn't load the recipe details. Please try again later.</p>
      </div>
    `
  }
}

// Close modal
export function closeRecipeModal() {
  document.getElementById('recipe-modal').classList.add('hidden')
}

// Renders the ingredient history
export function renderIngredientHistory(ingredients) {
  const container = document.getElementById('history-tags')
  container.innerHTML = ''
  const historySection = document.getElementById('ingredients-history')
  if (!ingredients?.length) return historySection.classList.add('hidden')

  historySection.classList.remove('hidden')
  ingredients.forEach((ingredient, index) => {
    const tag = document.createElement('span')
    tag.className = 'history-tag'
    tag.textContent = ingredient
    tag.style.animation = `fadeIn 0.3s ease forwards ${index * 0.05}s`
    tag.style.opacity = '0'
    tag.addEventListener('click', () => {
      const input = document.getElementById('ingredients-input')
      input.value = input.value.trim()
        ? `${input.value.trim()}, ${ingredient}`
        : ingredient
      tag.style.animation = 'bounce 0.5s ease'
      setTimeout(() => (tag.style.animation = ''), 500)
    })
    container.appendChild(tag)
  })
}

// Spinner
export function showLoading() {
  document.getElementById('loading').classList.remove('hidden')
}
export function hideLoading() {
  document.getElementById('loading').classList.add('hidden')
}

// Displays an error message in the results section
export function showError(message) {
  const resultsSection = document.getElementById('results-section')
  resultsSection.classList.remove('hidden')
  document.getElementById('results-container').innerHTML = `
    <div class="error-message">
      <h3>Error</h3>
      <p>${message}</p>
    </div>
  `
}

// Home or favorites view
export function toggleView(view) {
  const homeLink = document.getElementById('home-link')
  const favoritesLink = document.getElementById('favorites-link')
  const searchSection = document.getElementById('search-section')
  const resultsSection = document.getElementById('results-section')
  const favoritesSection = document.getElementById('favorites-section')

  if (view === 'home') {
    homeLink.classList.add('active')
    favoritesLink.classList.remove('active')
    searchSection.classList.remove('hidden')
    resultsSection.classList.remove('hidden')
    favoritesSection.classList.add('hidden')
  } else if (view === 'favorites') {
    homeLink.classList.remove('active')
    favoritesLink.classList.add('active')
    searchSection.classList.add('hidden')
    resultsSection.classList.add('hidden')
    favoritesSection.classList.remove('hidden')
  }
}
