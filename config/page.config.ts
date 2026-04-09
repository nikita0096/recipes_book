
export const PAGES = {
  HOME: '/',
  RECIPES: '/recipes',
  ABOUT: '/about',
  ADMIN_PANEL: '/admin',
  LOGIN: '/login',
  RECIPE: (id: string): string => `/recipes/${id}`,
  PROFILE: (id: string): string => `/profile/${id}`,
  ADMIN_RECIPE_PAGE: (id: string): string => `/admin/recipes/${id}`,
}