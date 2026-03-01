import { Process, Processor } from '@nestjs/bull';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type { Job } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { BLOG_SUMMARY_QUEUE, GENERATE_SUMMARY_JOB } from './queue.constants';
import { SummaryJobPayload } from './queue.types';

@Processor(BLOG_SUMMARY_QUEUE)
export class BlogSummaryProcessor {
  constructor(
    // PinoLogger automatically adds context fields (jobId, blogId) to every log line
    @InjectPinoLogger(BlogSummaryProcessor.name)
    private readonly logger: PinoLogger,
    private readonly prisma: PrismaService,
  ) {}

  @Process(GENERATE_SUMMARY_JOB)
  async handleGenerateSummary(job: Job<SummaryJobPayload>): Promise<void> {
    const { blogId, title, content } = job.data;

    // Structured log — every field is queryable in log aggregators (Loki, CloudWatch)
    this.logger.info(
      { jobId: job.id, blogId, attempt: job.attemptsMade + 1 },
      'Starting summary generation',
    );

    try {
      await job.progress(10);

      const summary = this.generateMockSummary(title, content);

      await job.progress(80);

      await this.prisma.blog.update({
        where: { id: blogId },
        data: { summary },
      });

      await job.progress(100);

      this.logger.info(
        { jobId: job.id, blogId, summaryLength: summary.length },
        'Summary generation completed successfully',
      );
    } catch (error) {
      // Structured error log — stack trace + all context in one line
      this.logger.error(
        {
          jobId: job.id,
          blogId,
          attempt: job.attemptsMade + 1,
          err: error,
        },
        'Summary generation failed — will retry',
      );

      // Re-throw so Bull marks job as failed and triggers retry
      throw error;
    }
  }

  private generateMockSummary(title: string, content: string): string {
    const plainText = content
      .replace(/#{1,6}\s/g, '')
      .replace(/\*\*|__/g, '')
      .replace(/\*|_/g, '')
      .replace(/`{1,3}[^`]*`{1,3}/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\n+/g, ' ')
      .trim();

    const sentences = plainText
      .split(/(?<=[.!?])\s+/)
      .filter((s) => s.trim().length > 10)
      .slice(0, 3)
      .join(' ');

    const summary = sentences.length > 0
      ? `${title}: ${sentences}`
      : `${title}: ${plainText.slice(0, 200)}`;

    return summary.slice(0, 500);
  }
}
