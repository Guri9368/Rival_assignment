import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { BlogsModule } from './blogs/blogs.module';
import { LikesModule } from './likes/likes.module';
import { CommentsModule } from './comments/comments.module';
import { QueueModule } from './queue/queue.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // ─── Structured Logging (Pino) ─────────────────────────────────────────
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isProduction = config.get('NODE_ENV') === 'production';
        return {
          pinoHttp: {
            // In production: output raw JSON (fast, machine-readable)
            // In development: pretty-print with colours for readability
            transport: isProduction
              ? undefined
              : {
                  target: 'pino-pretty',
                  options: {
                    colorize: true,
                    singleLine: true,
                    translateTime: 'SYS:HH:MM:ss',
                    ignore: 'pid,hostname',
                  },
                },

            // Log level: warn in production (less noise), debug in dev
            level: isProduction ? 'warn' : 'debug',

            // Attach request ID to every log line for traceability
            genReqId: (req) =>
              (req.headers['x-request-id'] as string) ??
              `req-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,

            // Redact sensitive fields — never log passwords or tokens
            redact: {
              paths: [
                'req.headers.authorization',
                'req.headers.cookie',
                'req.body.password',
                'req.body.refreshToken',
              ],
              censor: '[REDACTED]',
            },

            // Customize the logged request fields
            customLogLevel: (_req, res) => {
              if (res.statusCode >= 500) return 'error';
              if (res.statusCode >= 400) return 'warn';
              return 'info';
            },

            // Add useful fields to every request log
            serializers: {
              req(req) {
                return {
                  id: req.id,
                  method: req.method,
                  url: req.url,
                  userAgent: req.headers['user-agent'],
                  ip: req.remoteAddress,
                };
              },
              res(res) {
                return {
                  statusCode: res.statusCode,
                };
              },
            },
          },
        };
      },
    }),

    // ─── Rate Limiting ─────────────────────────────────────────────────────
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: () => ({
        throttlers: [
          { name: 'default', ttl: 60_000, limit: 60 },
          { name: 'auth',    ttl: 60_000, limit: 10 },
          { name: 'public',  ttl: 60_000, limit: 30 },
        ],
      }),
    }),

    PrismaModule,
    QueueModule,
    AuthModule,
    BlogsModule,
    LikesModule,
    CommentsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
