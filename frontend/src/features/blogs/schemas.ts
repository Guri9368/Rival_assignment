import { z } from 'zod';

export const BlogSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(300),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  excerpt: z.string().max(500).optional(),
  coverImage: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  tags: z.string().optional(), // comma-separated string from form
  status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
});

export type BlogInput = z.infer<typeof BlogSchema>;
