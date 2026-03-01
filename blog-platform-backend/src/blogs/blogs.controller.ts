import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus,
  Param, ParseUUIDPipe, Patch, Post, Query,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { BlogsService } from './blogs.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { FeedQueryDto } from './dto/feed-query.dto';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { BlogDetail, BlogFeedItem, PaginatedResult } from './types/blog.types';

@Controller('blogs')
export class BlogsController {
  constructor(private readonly blogsService: BlogsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateBlogDto, @CurrentUser('id') userId: string): Promise<BlogDetail> {
    return this.blogsService.create(dto, userId);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBlogDto,
    @CurrentUser('id') userId: string,
  ): Promise<BlogDetail> {
    return this.blogsService.update(id, dto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') userId: string): Promise<void> {
    return this.blogsService.remove(id, userId);
  }
}

// Public read endpoints — skip throttle.
// Next.js SSR hits these from the server (IP: ::1) on every page load.
// With a per-IP rate limit, the server itself gets throttled instantly.
// These are read-only public routes with no security risk from skipping throttle.
@Public()
@SkipThrottle()
@Controller('public')
export class PublicBlogsController {
  constructor(private readonly blogsService: BlogsService) {}

  @Get('feed')
  @HttpCode(HttpStatus.OK)
  getFeed(@Query() query: FeedQueryDto): Promise<PaginatedResult<BlogFeedItem>> {
    return this.blogsService.getPublicFeed(query);
  }

  @Get('blogs/:slug')
  @HttpCode(HttpStatus.OK)
  findBySlug(@Param('slug') slug: string): Promise<BlogDetail> {
    return this.blogsService.findBySlug(slug);
  }
}
