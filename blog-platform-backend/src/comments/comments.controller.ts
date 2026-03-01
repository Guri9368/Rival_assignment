import {
  Body, Controller, Get, HttpCode, HttpStatus,
  Param, ParseUUIDPipe, Post, Query,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CommentsQueryDto } from './dto/comments-query.dto';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CommentItem, PaginatedComments } from './types/comment.types';

@Controller('blogs/:blogId/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Param('blogId', ParseUUIDPipe) blogId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCommentDto,
  ): Promise<CommentItem> {
    return this.commentsService.create(blogId, userId, dto);
  }

  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  findByBlog(
    @Param('blogId', ParseUUIDPipe) blogId: string,
    @Query() query: CommentsQueryDto,
  ): Promise<PaginatedComments> {
    return this.commentsService.findByBlog(blogId, query);
  }
}