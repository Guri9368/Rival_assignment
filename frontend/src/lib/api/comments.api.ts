import { apiClient } from './client';
import { PaginatedComments, CommentItem } from '@/types/api.types';

export const commentsApi = {
  getComments: (blogId: string, page = 1, limit = 20) =>
    apiClient.get<PaginatedComments>(`/blogs/${blogId}/comments?page=${page}&limit=${limit}`),

  addComment: (blogId: string, body: string, parentId?: string) =>
    apiClient.post<CommentItem>(`/blogs/${blogId}/comments`, { body, parentId }),
};
