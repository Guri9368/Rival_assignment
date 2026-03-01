import { BlogStatus } from '@prisma/client';

export interface BlogAuthorInfo {
  readonly id: string;
  readonly username: string;
  readonly displayName: string | null;
  readonly avatarUrl: string | null;
}

export interface BlogFeedItem {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly excerpt: string | null;
  readonly coverImage: string | null;
  readonly status: BlogStatus;
  readonly publishedAt: Date | null;
  readonly likeCount: number;
  readonly commentCount: number;
  readonly tags: string[];
  readonly author: BlogAuthorInfo;
  readonly createdAt: Date;
}

export interface BlogDetail extends BlogFeedItem {
  readonly content: string;
  readonly summary: string | null;
}

export interface PaginationMeta {
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages: number;
  readonly hasNextPage: boolean;
  readonly hasPreviousPage: boolean;
}

export interface PaginatedResult<T> {
  readonly data: T[];
  readonly meta: PaginationMeta;
}