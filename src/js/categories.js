// Loading categories from categories.json
export async function loadCategories() {
  try {
    const response = await fetch('/json/categories.json')
    if (!response.ok)
      throw new Error(`Error loading categories: ${response.status}`)
    return await response.json()
  } catch (error) {
    console.error('Error loading categories:', error)
    return { categories: [] }
  }
}

// Gets the categories associated with a recipe
export function getCategoriesForRecipe(recipe, categories) {
  if (!recipe || !categories?.length) return []

  const recipeTags = [...(recipe.diets || []), ...(recipe.dishTypes || [])].map(
    (tag) => tag.toLowerCase(),
  )

  const matched = categories
    .filter((category) => recipeTags.includes(category.name.toLowerCase()))
    .map((category) => category.name)

  return [...new Set(matched)]
}

// Renders category filter buttons
export function renderCategoryFilters(
  categories,
  onFilterChange,
  activeFilters = [],
) {
  const container = document.getElementById('category-filters')
  const wrapper = document.getElementById('filter-categories')
  container.innerHTML = ''

  if (!categories?.length) {
    wrapper.classList.add('hidden')
    return
  }
  wrapper.classList.remove('hidden')

  categories.forEach((category, index) => {
    const isActive = activeFilters.includes(category.name)
    const btn = document.createElement('button')
    btn.className = `filter-button ${isActive ? 'active' : ''}`
    btn.dataset.category = category.name
    // btn.title = category.description
    btn.dataset.tooltip = category.description;
    btn.style.animation = `fadeIn 0.3s ease forwards ${index * 0.05}s`
    btn.style.opacity = '0'
    btn.innerHTML = `${isActive ? '<span class="check-icon">✓</span>' : ''}${category.name}`

    btn.addEventListener('click', () => {
      const active = btn.classList.contains('active')
      btn.classList.toggle('active')
      if (active) {
        const icon = btn.querySelector('.check-icon')
        if (icon) icon.remove()
      } else {
        if (!btn.querySelector('.check-icon')) {
          const icon = document.createElement('span')
          icon.className = 'check-icon'
          icon.textContent = '✓'
          btn.insertBefore(icon, btn.firstChild)
        }
      }
      onFilterChange(category.name, !active)
    })

    container.appendChild(btn)
  })
}

// Filter recipes by active categories
export function filterRecipesByCategories(recipes, categoryFilters) {
  if (!categoryFilters?.length) return recipes

  return recipes.filter((recipe) => {
    const diets = recipe.diets?.map((d) => d.toLowerCase()) || []
    const dishTypes = recipe.dishTypes?.map((d) => d.toLowerCase()) || []
    return categoryFilters.some(
      (filter) =>
        diets.includes(filter.toLowerCase()) ||
        dishTypes.includes(filter.toLowerCase()),
    )
  })
}

// Renders the active filters in the interface
export function renderActiveFilters(activeFilters, onRemoveFilter) {
  const container = document.getElementById('active-filters')
  container.innerHTML = ''

  if (!activeFilters?.length) {
    container.classList.add('hidden')
    return
  }
  container.classList.remove('hidden')

  activeFilters.forEach((filter, index) => {
    const div = document.createElement('div')
    div.className = 'active-filter'
    div.style.animation = `fadeIn 0.3s ease forwards ${index * 0.05}s`
    div.style.opacity = '0'
    div.innerHTML = `${filter}<span class="remove">×</span>`

    div.addEventListener('click', () => {
      onRemoveFilter(filter)
      div.style.animation = 'fadeOut 0.3s ease forwards'
      setTimeout(() => div.remove(), 300)
    })

    container.appendChild(div)
  })
}
