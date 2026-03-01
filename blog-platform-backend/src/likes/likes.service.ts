import {
  ConflictException, Injectable, Logger, NotFoundException, UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { LikesRepository } from './likes.repository';
import { LikeResult } from './types/like.types';

@Injectable()
export class LikesService {
  private readonly logger = new Logger(LikesService.name);

  constructor(private readonly likesRepository: LikesRepository) {}

  async like(userId: string, blogId: string): Promise<LikeResult> {
    await this.assertBlogExists(blogId);
    try {
      const result = await this.likesRepository.like(userId, blogId);
      this.logger.log(`User ${userId} liked blog ${blogId}`);
      return result;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('You have already liked this post');
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('Blog post not found');
      }
      throw error;
    }
  }

  async unlike(userId: string, blogId: string): Promise<LikeResult> {
    await this.assertBlogExists(blogId);
    try {
      const result = await this.likesRepository.unlike(userId, blogId);
      if (result === null) {
        throw new UnprocessableEntityException('You have not liked this post');
      }
      this.logger.log(`User ${userId} unliked blog ${blogId}`);
      return result;
    } catch (error) {
      if (error instanceof UnprocessableEntityException) throw error;
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('Blog post not found');
      }
      throw error;
    }
  }

  private async assertBlogExists(blogId: string): Promise<void> {
    const exists = await this.likesRepository.blogExists(blogId);
    if (!exists) throw new NotFoundException('Blog post not found');
  }
}