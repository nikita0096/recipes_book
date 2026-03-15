
export const PAGES = {
  HOME: '/',
  RECIPES: '/recipes',
  SOCIAL: '/social',
  ADMIN_PANEL: '/admin',
  RECIPE: (id: string): string => `/recipes/${id}`,
  PROFILE: (id: string): string => `/profile/${id}`,
  ADMIN_RECIPE_PAGE: (id: string): string => `/admin/recipes/${id}`,
}