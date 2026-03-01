import {
  ForbiddenException, Injectable, Logger, NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { BlogStatus } from '@prisma/client';
import { BlogsRepository } from './blogs.repository';
import { SlugService } from './slug.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { FeedQueryDto } from './dto/feed-query.dto';
import { BlogDetail, BlogFeedItem, PaginatedResult } from './types/blog.types';
import { BLOG_SUMMARY_QUEUE, GENERATE_SUMMARY_JOB } from '../queue/queue.constants';
import { SummaryJobPayload } from '../queue/queue.types';

@Injectable()
export class BlogsService {
  private readonly logger = new Logger(BlogsService.name);

  constructor(
    private readonly blogsRepository: BlogsRepository,
    private readonly slugService: SlugService,
    @InjectQueue(BLOG_SUMMARY_QUEUE)
    private readonly summaryQueue: Queue<SummaryJobPayload>,
  ) {}

  async create(dto: CreateBlogDto, authorId: string): Promise<BlogDetail> {
    const slug = await this.slugService.generateUniqueSlug(dto.title);
    const isPublishing = dto.status === BlogStatus.PUBLISHED;

    const blog = await this.blogsRepository.create({
      title: dto.title,
      slug,
      content: dto.content,
      excerpt: dto.excerpt,
      coverImage: dto.coverImage,
      tags: dto.tags ?? [],
      status: dto.status ?? BlogStatus.DRAFT,
      publishedAt: isPublishing ? new Date() : null,
      author: { connect: { id: authorId } },
    });

    // Enqueue summary job AFTER HTTP response is returned
    // This does NOT block the response — fire and forget
    if (isPublishing) {
      await this.enqueueSummaryJob(blog);
    }

    this.logger.log(`Blog created: ${blog.id} by user: ${authorId}`);
    return blog;
  }

  async update(id: string, dto: UpdateBlogDto, requesterId: string): Promise<BlogDetail> {
    const blog = await this.findBlogOrFail(id);
    this.assertOwnership(blog, requesterId);

    const slug = dto.title && dto.title !== blog.title
      ? await this.slugService.generateUniqueSlug(dto.title, id)
      : undefined;

    const isTransitioningToPublished =
      dto.status === BlogStatus.PUBLISHED && blog.status !== BlogStatus.PUBLISHED;

    const updatedBlog = await this.blogsRepository.update(id, {
      ...(dto.title !== undefined && { title: dto.title }),
      ...(slug !== undefined && { slug }),
      ...(dto.content !== undefined && { content: dto.content }),
      ...(dto.excerpt !== undefined && { excerpt: dto.excerpt }),
      ...(dto.coverImage !== undefined && { coverImage: dto.coverImage }),
      ...(dto.tags !== undefined && { tags: dto.tags }),
      ...(dto.status !== undefined && { status: dto.status }),
      ...(isTransitioningToPublished && { publishedAt: new Date() }),
    });

    // Enqueue summary job when DRAFT transitions to PUBLISHED
    if (isTransitioningToPublished) {
      await this.enqueueSummaryJob(updatedBlog);
    }

    this.logger.log(`Blog updated: ${id} by user: ${requesterId}`);
    return updatedBlog;
  }

  async remove(id: string, requesterId: string): Promise<void> {
    const blog = await this.findBlogOrFail(id);
    this.assertOwnership(blog, requesterId);
    await this.blogsRepository.softDelete(id);
    this.logger.log(`Blog soft-deleted: ${id} by user: ${requesterId}`);
  }

  async findBySlug(slug: string): Promise<BlogDetail> {
    const blog = await this.blogsRepository.findBySlug(slug);
    if (!blog) throw new NotFoundException('Blog post not found');
    return blog;
  }

  async getPublicFeed(query: FeedQueryDto): Promise<PaginatedResult<BlogFeedItem>> {
    return this.blogsRepository.findPublishedFeed(query);
  }

  // ── Private Helpers ────────────────────────────────────────────────────────

  private async enqueueSummaryJob(blog: BlogDetail): Promise<void> {
    try {
      const job = await this.summaryQueue.add(
        GENERATE_SUMMARY_JOB,
        {
          blogId: blog.id,
          title: blog.title,
          content: blog.content,
        },
        {
          // Delay by 1s to ensure the DB write is fully committed
          // before the worker reads the blog record
          delay: 1000,
          jobId: `summary-${blog.id}`, // idempotent — prevents duplicate jobs
        },
      );

      this.logger.log(
        `Summary job enqueued for blog: ${blog.id} (jobId: ${job.id})`,
      );
    } catch (error) {
      // Log but DO NOT throw — a queue failure must never fail the HTTP request
      this.logger.error(
        `Failed to enqueue summary job for blog: ${blog.id}`,
        error instanceof Error ? error.stack : error,
      );
    }
  }

  private async findBlogOrFail(id: string): Promise<BlogDetail> {
    const blog = await this.blogsRepository.findById(id);
    if (!blog) throw new NotFoundException('Blog post not found');
    return blog;
  }

  private assertOwnership(blog: BlogDetail, requesterId: string): void {
    if (blog.author.id !== requesterId) {
      throw new ForbiddenException(
        'You do not have permission to modify this blog post',
      );
    }
  }
}
