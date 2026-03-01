// ─── Auth ─────────────────────────────────────────────────────────────────────
export type Role = 'USER' | 'ADMIN';
export type BlogStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface UserInfo {
  id: string;
  email: string;
  username: string;
  role: Role;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserInfo;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// ─── Blogs ────────────────────────────────────────────────────────────────────
export interface BlogAuthor {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface BlogFeedItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  status: BlogStatus;
  publishedAt: string | null;
  likeCount: number;
  commentCount: number;
  tags: string[];
  author: BlogAuthor;
  createdAt: string;
}

export interface BlogDetail extends BlogFeedItem {
  content: string;
  summary: string | null;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

// ─── Likes ────────────────────────────────────────────────────────────────────
export interface LikeResult {
  liked: boolean;
  likeCount: number;
}

// ─── Comments ─────────────────────────────────────────────────────────────────
export interface CommentAuthor {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface CommentItem {
  id: string;
  body: string;
  isEdited: boolean;
  parentId: string | null;
  author: CommentAuthor;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedComments {
  data: CommentItem[];
  meta: PaginationMeta;
}

// ─── API Error ────────────────────────────────────────────────────────────────
export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
}
