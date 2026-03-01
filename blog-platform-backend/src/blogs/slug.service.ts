import { Injectable } from '@nestjs/common';
import { BlogsRepository } from './blogs.repository';

@Injectable()
export class SlugService {
  constructor(private readonly blogsRepository: BlogsRepository) {}

  private toSlug(title: string): string {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 280);
  }

  async generateUniqueSlug(title: string, excludeId?: string): Promise<string> {
    const base = this.toSlug(title);
    if (!(await this.blogsRepository.slugExists(base, excludeId))) return base;

    for (let i = 0; i < 5; i++) {
      const suffix = Math.random().toString(36).slice(2, 6);
      const candidate = `${base}-${suffix}`;
      if (!(await this.blogsRepository.slugExists(candidate, excludeId))) return candidate;
    }

    return `${base}-${Date.now().toString(36)}`;
  }
}