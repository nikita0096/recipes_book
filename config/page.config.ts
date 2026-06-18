
export const PAGES = {
  HOME: '/',
  RECIPES: '/recipes',
  ABOUT: '/about',
  ADMIN_PANEL: '/admin',
  SIGNIN: (pathname: string) => `/auth/signin?from=${encodeURIComponent(pathname)}`,
  SIGNUP: (pathname: string) => `/auth/signup?from=${encodeURIComponent(pathname)}`,
  RESET_PASSWORD: (pathname: string) => `/auth/reset-password?from=${encodeURIComponent(pathname)}`,
  UPDATE_PASSWORD: (pathname: string) => `/auth/update-password?from=${encodeURIComponent(pathname)}`,
  RECIPE: (slug: string): string => `/recipes/${slug}`,
  PROFILE: (id: string): string => `/profile/${id}`,
  ADMIN_RECIPE_PAGE: (id: string): string => `/admin/recipes/${id}`,
  TERMS: '/legal/terms',
  PRIVACY: '/legal/privacy',
  REFUND: '/legal/refund',
}