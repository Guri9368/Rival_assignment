'use client';

import { useRouter } from 'next/navigation';
import { Metadata } from 'next';
import { BlogForm } from '@/components/BlogForm';
import { createBlogAction } from '@/features/blogs/actions';
import { ROUTES } from '@/lib/constants';

export default function NewBlogPage() {
  const router = useRouter();

  const handleSubmit = async (data: Parameters<typeof createBlogAction>[0]) => {
    const result = await createBlogAction(data);
    if (result?.error) return result;
    router.push(ROUTES.dashboard);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">New Blog Post</h1>
      <div className="bg-white border border-slate-200 rounded-2xl p-8">
        <BlogForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
