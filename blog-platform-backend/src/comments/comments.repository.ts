import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CommentItem, PaginatedComments } from './types/comment.types';
import { CommentsQueryDto } from './dto/comments-query.dto';

const COMMENT_SELECT = {
  id: true,
  body: true,
  isEdited: true,
  parentId: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
    },
  },
} satisfies Prisma.CommentSelect;

@Injectable()
export class CommentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    blogId: string,
    authorId: string,
    body: string,
    parentId?: string,
  ): Promise<CommentItem> {
    const [comment] = await this.prisma.$transaction([
      this.prisma.comment.create({
        data: {
          body,
          parentId: parentId ?? null,
          blogId,
          userId: authorId,
        },
        select: COMMENT_SELECT,
      }),
      this.prisma.blog.update({
        where: { id: blogId },
        data: { commentCount: { increment: 1 } },
        select: { id: true },
      }),
    ]);

    const raw = comment as any;
    return {
      id: raw.id,
      body: raw.body,
      isEdited: raw.isEdited,
      parentId: raw.parentId,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      author: raw.user,
    };
  }

  async findByBlog(
    blogId: string,
    query: CommentsQueryDto,
  ): Promise<PaginatedComments> {
    const { page, limit, mode } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.CommentWhereInput = {
      blogId,
      deletedAt: null,
      ...(mode === 'top-level' ? { parentId: null } : {}),
    };

    const [total, comments] = await this.prisma.$transaction([
      this.prisma.comment.count({ where }),
      this.prisma.comment.findMany({
        where,
        select: COMMENT_SELECT,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: (comments as any[]).map((c) => ({
        id: c.id,
        body: c.body,
        isEdited: c.isEdited,
        parentId: c.parentId,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        author: c.user,
      })),
      meta: {
        page, limit, total, totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async blogExists(blogId: string): Promise<boolean> {
    const blog = await this.prisma.blog.findFirst({
      where: { id: blogId, deletedAt: null },
      select: { id: true },
    });
    return blog !== null;
  }

  async parentCommentIsValid(parentId: string, blogId: string): Promise<boolean> {
    const parent = await this.prisma.comment.findFirst({
      where: { id: parentId, blogId, parentId: null, deletedAt: null },
      select: { id: true },
    });
    return parent !== null;
  }
}
