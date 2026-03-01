import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { blogsApi } from '@/lib/api/blogs.api';
import { getSession } from '@/lib/session';
import { LikeButton } from '@/components/LikeButton';
import { CommentList } from '@/components/CommentList';
import { Badge } from '@/components/ui/Badge';
import { formatDate, getInitials } from '@/lib/utils';
import { ApiError } from '@/lib/api/client';

export const revalidate = 60;

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const blog = await blogsApi.serverGetBySlug(slug);
    return { title: blog.title, description: blog.excerpt ?? blog.summary ?? undefined };
  } catch {
    return { title: 'Blog Post' };
  }
}

export default async function BlogDetailPage({ params }: Props) {
  const { slug } = await params;

  // Run in parallel — don't block blog render on session check
  let blog: Awaited<ReturnType<typeof blogsApi.serverGetBySlug>>;
  try {
    blog = await blogsApi.serverGetBySlug(slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const { accessToken } = await getSession();
  const isLoggedIn = !!accessToken;
  const initials = getInitials(blog.author.displayName, blog.author.username);

  return (
    <article className="max-w-3xl mx-auto">
      {/* Cover image */}
      {blog.coverImage && (
        <div className="mb-8 rounded-2xl overflow-hidden h-64 sm:h-80 bg-slate-100">
          <img src={blog.coverImage} alt={blog.title} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Tags */}
      {blog.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {blog.tags.map((tag) => (
            <a key={tag} href={`/feed?tag=${tag}`}>
              <Badge variant="outline">#{tag}</Badge>
            </a>
          ))}
        </div>
      )}

      {/* Title */}
      <h1 className="text-4xl font-bold text-slate-900 leading-tight">{blog.title}</h1>

      {/* Author + Like */}
      <div className="mt-5 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
            {initials}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {blog.author.displayName ?? blog.author.username}
            </p>
            <p className="text-xs text-slate-500">
              @{blog.author.username} · {formatDate(blog.publishedAt)}
            </p>
          </div>
        </div>
        {/* isLoggedIn passed from server — no JS cookie reading */}
        <LikeButton
          blogId={blog.id}
          initialCount={blog.likeCount}
          isLoggedIn={isLoggedIn}
        />
      </div>

      {/* AI Summary */}
      {blog.summary && (
        <div className="mt-8 p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">AI Summary</p>
          <p className="text-sm text-slate-700 leading-relaxed">{blog.summary}</p>
        </div>
      )}

      {/* Content */}
      <div className="mt-8 text-slate-800 leading-relaxed whitespace-pre-wrap text-base">
        {blog.content}
      </div>

      <hr className="my-10 border-slate-200" />

      {/* Comments — isLoggedIn passed through */}
      <CommentList blogId={blog.id} initialCount={blog.commentCount} isLoggedIn={isLoggedIn} />
    </article>
  );
}
