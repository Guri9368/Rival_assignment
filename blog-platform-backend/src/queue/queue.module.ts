import { BullModule } from '@nestjs/bull';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { BLOG_SUMMARY_QUEUE } from './queue.constants';
import { BlogSummaryProcessor } from './blog-summary.processor';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: 50,
          removeOnFail: 100,
        },
      }),
    }),
    BullModule.registerQueue({ name: BLOG_SUMMARY_QUEUE }),
    PrismaModule,
  ],
  providers: [BlogSummaryProcessor],
  exports: [BullModule],  // Export entire BullModule so any module can inject queues
})
export class QueueModule {}
