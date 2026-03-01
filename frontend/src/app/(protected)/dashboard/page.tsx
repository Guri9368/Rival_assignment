'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { blogsApi } from '@/lib/api/blogs.api';
import { deleteBlogAction } from '@/features/blogs/actions';
import { BlogFeedItem } from '@/types/api.types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageSpinner } from '@/components/ui/Spinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { formatDate } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import { ApiError } from '@/lib/api/client';

export default function DashboardPage() {
  const [blogs, setBlogs] = useState<BlogFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    blogsApi.getFeed({ limit: 50 })
      .then((r) => setBlogs(r.data))
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Failed to load blogs.'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this blog post?')) return;
    setDeleting(id);
    const result = await deleteBlogAction(id);
    if (result?.error) {
      alert(result.error);
    } else {
      setBlogs((prev) => prev.filter((b) => b.id !== id));
    }
    setDeleting(null);
  };

  if (loading) return <PageSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-slate-900">My Blogs</h1>
        <Link href={ROUTES.newBlog}>
          <Button>+ New Blog</Button>
        </Link>
      </div>

      {error && <ErrorMessage message={error} className="mb-6" />}

      {blogs.length === 0 ? (
        <EmptyState
          title="No blog posts yet"
          description="Start writing your first post."
          action={<Link href={ROUTES.newBlog}><Button>Write your first post</Button></Link>}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {blogs.map((blog) => (
            <div key={blog.id} className="bg-white border border-slate-200 rounded-xl p-5 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-semibold text-slate-900 truncate">{blog.title}</h2>
                  <Badge variant={blog.status === 'PUBLISHED' ? 'default' : 'outline'}>
                    {blog.status}
                  </Badge>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {formatDate(blog.publishedAt ?? blog.createdAt)} · {blog.likeCount} likes · {blog.commentCount} comments
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {blog.status === 'PUBLISHED' && (
                  <Link href={ROUTES.blogDetail(blog.slug)}>
                    <Button variant="ghost" size="sm">View</Button>
                  </Link>
                )}
                <Link href={ROUTES.editBlog(blog.id)}>
                  <Button variant="secondary" size="sm">Edit</Button>
                </Link>
                <Button
                  variant="danger" size="sm"
                  loading={deleting === blog.id}
                  onClick={() => handleDelete(blog.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
