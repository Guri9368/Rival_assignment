import { Controller, Delete, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { LikesService } from './likes.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { LikeResult } from './types/like.types';

@Controller('blogs/:blogId/like')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  like(@Param('blogId', ParseUUIDPipe) blogId: string, @CurrentUser('id') userId: string): Promise<LikeResult> {
    return this.likesService.like(userId, blogId);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  unlike(@Param('blogId', ParseUUIDPipe) blogId: string, @CurrentUser('id') userId: string): Promise<LikeResult> {
    return this.likesService.unlike(userId, blogId);
  }
}