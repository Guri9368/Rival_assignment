import { apiClient } from './client';
import { LikeResult } from '@/types/api.types';

export const likesApi = {
  like: (blogId: string) =>
    apiClient.post<LikeResult>(`/blogs/${blogId}/like`),

  unlike: (blogId: string) =>
    apiClient.delete<LikeResult>(`/blogs/${blogId}/like`),
};
