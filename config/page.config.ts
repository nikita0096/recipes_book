
export const PAGES = {
  HOME: '/',
  RECIPES: '/recipes',
  ABOUT: '/about',
  ADMIN_PANEL: '/admin',
  SIGNIN: (pathname: string) => `/auth/signin?from=${encodeURIComponent(pathname)}`,
  SIGNUP: (pathname: string) => `/auth/signup?from=${encodeURIComponent(pathname)}`,
  RECIPE: (id: string): string => `/recipes/${id}`,
  PROFILE: (id: string): string => `/profile/${id}`,
  ADMIN_RECIPE_PAGE: (id: string): string => `/admin/recipes/${id}`,
}