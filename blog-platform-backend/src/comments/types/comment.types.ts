export interface CommentAuthor {
  readonly id: string;
  readonly username: string;
  readonly displayName: string | null;
  readonly avatarUrl: string | null;
}

export interface CommentItem {
  readonly id: string;
  readonly body: string;
  readonly isEdited: boolean;
  readonly parentId: string | null;
  readonly author: CommentAuthor;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface PaginationMeta {
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages: number;
  readonly hasNextPage: boolean;
  readonly hasPreviousPage: boolean;
}

export interface PaginatedComments {
  readonly data: CommentItem[];
  readonly meta: PaginationMeta;
}