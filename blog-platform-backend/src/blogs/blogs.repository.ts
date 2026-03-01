import { Injectable } from '@nestjs/common';
import { BlogStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BlogDetail, BlogFeedItem, PaginatedResult } from './types/blog.types';
import { FeedQueryDto } from './dto/feed-query.dto';

const FEED_ITEM_SELECT = {
  id: true, title: true, slug: true, excerpt: true,
  coverImage: true, status: true, publishedAt: true,
  likeCount: true, commentCount: true, tags: true, createdAt: true,
  author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
} satisfies Prisma.BlogSelect;

const BLOG_DETAIL_SELECT = {
  ...FEED_ITEM_SELECT,
  content: true,
  summary: true,
} satisfies Prisma.BlogSelect;

@Injectable()
export class BlogsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.BlogCreateInput): Promise<BlogDetail> {
    return this.prisma.blog.create({ data, select: BLOG_DETAIL_SELECT }) as unknown as BlogDetail;
  }

  async update(id: string, data: Prisma.BlogUpdateInput): Promise<BlogDetail> {
    return this.prisma.blog.update({ where: { id }, data, select: BLOG_DETAIL_SELECT }) as unknown as BlogDetail;
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.blog.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async findById(id: string): Promise<BlogDetail | null> {
    return this.prisma.blog.findFirst({ where: { id, deletedAt: null }, select: BLOG_DETAIL_SELECT }) as unknown as BlogDetail | null;
  }

  async findBySlug(slug: string): Promise<BlogDetail | null> {
    return this.prisma.blog.findFirst({ where: { slug, status: BlogStatus.PUBLISHED, deletedAt: null }, select: BLOG_DETAIL_SELECT }) as unknown as BlogDetail | null;
  }

  async slugExists(slug: string, excludeId?: string): Promise<boolean> {
    const blog = await this.prisma.blog.findFirst({
      where: { slug, deletedAt: null, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    });
    return blog !== null;
  }

  async findPublishedFeed(query: FeedQueryDto): Promise<PaginatedResult<BlogFeedItem>> {
    const { page, limit, tag, author } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.BlogWhereInput = {
      status: BlogStatus.PUBLISHED,
      deletedAt: null,
      ...(tag ? { tags: { has: tag } } : {}),
      ...(author ? { author: { username: { equals: author, mode: 'insensitive' } } } : {}),
    };

    const [total, blogs] = await this.prisma.$transaction([
      this.prisma.blog.count({ where }),
      this.prisma.blog.findMany({
        where, select: FEED_ITEM_SELECT,
        orderBy: { publishedAt: 'desc' },
        skip, take: limit,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: blogs as unknown as BlogFeedItem[],
      meta: { page, limit, total, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 },
    };
  }
}