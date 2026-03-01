'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { blogsApi } from '@/lib/api/blogs.api';
import { getSession } from '@/lib/session';
import { serverFetch } from '@/lib/api/client';
import { ApiError } from '@/lib/api/client';
import { ROUTES } from '@/lib/constants';

export async function createBlogAction(data: {
  title: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  tags?: string[];
  status: 'DRAFT' | 'PUBLISHED';
}) {
  const { accessToken } = await getSession();
  if (!accessToken) redirect(ROUTES.login);

  try {
    const blog = await serverFetch<{ id: string; slug: string }>(
      '/blogs',
      accessToken,
      { method: 'POST', body: JSON.stringify(data) },
    );
    revalidatePath(ROUTES.feed);
    revalidatePath(ROUTES.dashboard);
    return { blog };
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    return { error: 'Failed to create blog.' };
  }
}

export async function updateBlogAction(
  id: string,
  data: Partial<{
    title: string;
    content: string;
    excerpt?: string;
    coverImage?: string;
    tags?: string[];
    status: 'DRAFT' | 'PUBLISHED';
  }>,
) {
  const { accessToken } = await getSession();
  if (!accessToken) redirect(ROUTES.login);

  try {
    const blog = await serverFetch<{ slug: string }>(
      `/blogs/${id}`,
      accessToken,
      { method: 'PATCH', body: JSON.stringify(data) },
    );
    revalidatePath(ROUTES.feed);
    revalidatePath(ROUTES.dashboard);
    revalidatePath(ROUTES.blogDetail(blog.slug));
    return { blog };
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    return { error: 'Failed to update blog.' };
  }
}

export async function deleteBlogAction(id: string) {
  const { accessToken } = await getSession();
  if (!accessToken) redirect(ROUTES.login);

  try {
    await serverFetch(`/blogs/${id}`, accessToken, { method: 'DELETE' });
    revalidatePath(ROUTES.feed);
    revalidatePath(ROUTES.dashboard);
    return { success: true };
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    return { error: 'Failed to delete blog.' };
  }
}
