'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { BlogForm } from '@/components/BlogForm';
import { blogsApi } from '@/lib/api/blogs.api';
import { updateBlogAction } from '@/features/blogs/actions';
import { BlogDetail } from '@/types/api.types';
import { PageSpinner } from '@/components/ui/Spinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ROUTES } from '@/lib/constants';
import { ApiError } from '@/lib/api/client';

export default function EditBlogPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [blog, setBlog] = useState<BlogDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // We need the blog's slug to fetch it from the public API
    // Dashboard would ideally have a /blogs/:id endpoint — fallback: get from feed
    blogsApi.getFeed({ limit: 50 })
      .then((r) => {
        const found = r.data.find((b) => b.id === id);
        if (found) {
          return blogsApi.getBySlug(found.slug);
        }
        throw new ApiError(404, 'Blog not found');
      })
      .then(setBlog)
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Failed to load blog.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (data: Parameters<typeof updateBlogAction>[1]) => {
    const result = await updateBlogAction(id, data);
    if (result?.error) return result;
    router.push(ROUTES.dashboard);
  };

  if (loading) return <PageSpinner />;
  if (error) return <div className="max-w-3xl mx-auto mt-8"><ErrorMessage message={error} /></div>;

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Edit Blog Post</h1>
      <div className="bg-white border border-slate-200 rounded-2xl p-8">
        <BlogForm initial={blog ?? undefined} onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
