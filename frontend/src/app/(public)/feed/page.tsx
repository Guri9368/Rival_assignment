import { Suspense } from 'react';
import { Metadata } from 'next';
import { BlogCard } from '@/components/BlogCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageSpinner } from '@/components/ui/Spinner';

export const metadata: Metadata = { title: 'Feed' };
export const revalidate = 30;

interface FeedPageProps {
  searchParams: Promise<{ page?: string; tag?: string }>;
}

async function FeedContent({ page, tag }: { page: number; tag?: string }) {
  const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';
  const query = new URLSearchParams({ page: String(page), limit: '10' });
  if (tag) query.set('tag', tag);

  let result: { data: any[]; meta: any };
  try {
    const res = await fetch(`${API}/public/feed?${query}`, {
      next: { revalidate: 30 },
      headers: { 'x-internal-request': '1' }, // mark as internal so we can skip throttle
    });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    result = await res.json();
  } catch {
    return (
      <EmptyState
        title="Could not load posts"
        description="Failed to connect to the backend. Make sure the API is running."
      />
    );
  }

  if (result.data.length === 0) {
    return (
      <EmptyState
        title="No posts yet"
        description="Be the first to publish something."
      />
    );
  }

  return (
    <div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {result.data.map((blog: any) => <BlogCard key={blog.id} blog={blog} />)}
      </div>
      {result.meta.totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2 text-sm text-slate-600">
          {result.meta.hasPreviousPage && (
            <a href={`/feed?page=${page - 1}${tag ? `&tag=${tag}` : ''}`}
              className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-white transition-colors bg-white">
              ← Previous
            </a>
          )}
          <span className="px-4 py-2 text-slate-500">
            Page {result.meta.page} of {result.meta.totalPages}
          </span>
          {result.meta.hasNextPage && (
            <a href={`/feed?page=${page + 1}${tag ? `&tag=${tag}` : ''}`}
              className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-white transition-colors bg-white">
              Next →
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export default async function FeedPage({ searchParams }: FeedPageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? '1'));
  const tag = params.tag;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Latest Posts</h1>
        {tag && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-sm text-slate-500">Filtered by:</span>
            <span className="text-sm bg-slate-900 text-white px-3 py-1 rounded-full">#{tag}</span>
            <a href="/feed" className="text-sm text-slate-500 hover:text-slate-700 underline">clear</a>
          </div>
        )}
      </div>
      <Suspense fallback={<PageSpinner />}>
        <FeedContent page={page} tag={tag} />
      </Suspense>
    </div>
  );
}
