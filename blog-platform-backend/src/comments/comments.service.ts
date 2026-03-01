import {
  Injectable, Logger, NotFoundException, UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CommentsRepository } from './comments.repository';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CommentsQueryDto } from './dto/comments-query.dto';
import { CommentItem, PaginatedComments } from './types/comment.types';

@Injectable()
export class CommentsService {
  private readonly logger = new Logger(CommentsService.name);

  constructor(private readonly commentsRepository: CommentsRepository) {}

  async create(blogId: string, authorId: string, dto: CreateCommentDto): Promise<CommentItem> {
    await this.assertBlogExists(blogId);

    if (dto.parentId) {
      const valid = await this.commentsRepository.parentCommentIsValid(dto.parentId, blogId);
      if (!valid) throw new UnprocessableEntityException('Parent comment not found or does not belong to this post');
    }

    try {
      const comment = await this.commentsRepository.create(blogId, authorId, dto.body, dto.parentId);
      this.logger.log(`Comment ${comment.id} created on blog ${blogId} by user ${authorId}`);
      return comment;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new NotFoundException('Blog post or parent comment no longer exists');
      }
      throw error;
    }
  }

  async findByBlog(blogId: string, query: CommentsQueryDto): Promise<PaginatedComments> {
    await this.assertBlogExists(blogId);
    return this.commentsRepository.findByBlog(blogId, query);
  }

  private async assertBlogExists(blogId: string): Promise<void> {
    const exists = await this.commentsRepository.blogExists(blogId);
    if (!exists) throw new NotFoundException('Blog post not found');
  }
}