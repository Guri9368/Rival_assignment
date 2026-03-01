export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export const ROUTES = {
  home: '/',
  feed: '/feed',
  login: '/login',
  register: '/register',
  dashboard: '/dashboard',
  newBlog: '/dashboard/new',
  editBlog: (id: string) => `/dashboard/${id}/edit`,
  blogDetail: (slug: string) => `/blogs/${slug}`,
} as const;

export const COOKIE_KEYS = {
  accessToken: 'access_token',
  refreshToken: 'refresh_token',
} as const;

export const PAGE_SIZE = 10;
