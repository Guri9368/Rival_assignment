import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LikeResult } from './types/like.types';

@Injectable()
export class LikesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async like(userId: string, blogId: string): Promise<LikeResult> {
    const [, blog] = await this.prisma.$transaction([
      this.prisma.like.create({ data: { userId, blogId }, select: { id: true } }),
      this.prisma.blog.update({
        where: { id: blogId },
        data: { likeCount: { increment: 1 } },
        select: { likeCount: true },
      }),
    ]);
    return { liked: true, likeCount: blog.likeCount };
  }

  async unlike(userId: string, blogId: string): Promise<LikeResult | null> {
    const [deleteResult, blog] = await this.prisma.$transaction([
      this.prisma.like.deleteMany({ where: { userId, blogId } }),
      this.prisma.blog.update({
        where: { id: blogId },
        data: { likeCount: { decrement: 1 } },
        select: { likeCount: true },
      }),
    ]);

    if (deleteResult.count === 0) return null;
    return { liked: false, likeCount: Math.max(0, blog.likeCount) };
  }

  async blogExists(blogId: string): Promise<boolean> {
    const blog = await this.prisma.blog.findFirst({
      where: { id: blogId, deletedAt: null },
      select: { id: true },
    });
    return blog !== null;
  }
}