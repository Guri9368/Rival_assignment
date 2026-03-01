import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { LikesController } from './likes.controller';
import { LikesService } from './likes.service';
import { LikesRepository } from './likes.repository';

@Module({
  imports: [PrismaModule],
  controllers: [LikesController],
  providers: [LikesService, LikesRepository],
})
export class LikesModule {}