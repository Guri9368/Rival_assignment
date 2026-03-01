import { apiClient, serverFetch } from './client';
import { BlogDetail, BlogFeedItem, PaginatedResult } from '@/types/api.types';

export interface FeedParams {
  page?: number;
  limit?: number;
  tag?: string;
  author?: string;
}

export interface CreateBlogData {
  title: string;
  content: string;
  excerpt?: string;
  status?: 'DRAFT' | 'PUBLISHED';
  tags?: string[];
  coverImage?: string;
}

export const blogsApi = {
  // Public — no auth needed
  getFeed: (params: FeedParams = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.tag) query.set('tag', params.tag);
    if (params.author) query.set('author', params.author);
    const qs = query.toString();
    return apiClient.get<PaginatedResult<BlogFeedItem>>(`/public/feed${qs ? `?${qs}` : ''}`);
  },

  getBySlug: (slug: string) =>
    apiClient.get<BlogDetail>(`/public/blogs/${slug}`),

  // Server-side versions (for SSR/ISR pages)
  serverGetFeed: (params: FeedParams = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.tag) query.set('tag', params.tag);
    const qs = query.toString();
    return serverFetch<PaginatedResult<BlogFeedItem>>(`/public/feed${qs ? `?${qs}` : ''}`, undefined, {
      next: { revalidate: 30 },
    });
  },

  serverGetBySlug: (slug: string) =>
    serverFetch<BlogDetail>(`/public/blogs/${slug}`, undefined, {
      next: { revalidate: 60 },
    }),

  // Auth required
  create: (data: CreateBlogData) =>
    apiClient.post<BlogDetail>('/blogs', data),

  update: (id: string, data: Partial<CreateBlogData>) =>
    apiClient.patch<BlogDetail>(`/blogs/${id}`, data),

  delete: (id: string) =>
    apiClient.delete<void>(`/blogs/${id}`),
};
