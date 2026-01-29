
export const PAGES = {
  HOME: '/',
  RECIPES: '/recipes',
  SOCIAL: '/social',
  ADMIN_PANEL: '/admin',
  RECIPE: (id:number): string => `/recipes/${id}`,
  PROFILE: (id: string): string => `/profile/${id}`,
}