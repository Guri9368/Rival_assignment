import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { PrismaModule } from '../prisma/prisma.module';
import { QueueModule } from '../queue/queue.module';
import { BlogsController, PublicBlogsController } from './blogs.controller';
import { BlogsService } from './blogs.service';
import { BlogsRepository } from './blogs.repository';
import { SlugService } from './slug.service';
import { BLOG_SUMMARY_QUEUE } from '../queue/queue.constants';

@Module({
  imports: [
    PrismaModule,
    QueueModule,
    BullModule.registerQueue({ name: BLOG_SUMMARY_QUEUE }),
  ],
  controllers: [BlogsController, PublicBlogsController],
  providers: [BlogsService, BlogsRepository, SlugService],
  exports: [BlogsService],
})
export class BlogsModule {}
