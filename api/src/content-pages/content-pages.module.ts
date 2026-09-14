import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { ContentPagesController } from './content-pages.controller.js';
import { ContentPagesService } from './content-pages.service.js';

@Module({
  imports: [AuthModule],
  controllers: [ContentPagesController],
  providers: [ContentPagesService],
})
export class ContentPagesModule {}
