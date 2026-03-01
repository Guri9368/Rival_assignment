import Link from 'next/link';
import { BlogFeedItem } from '@/types/api.types';
import { Badge } from './ui/Badge';
import { formatDate, getInitials, truncate } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';

interface BlogCardProps {
  blog: BlogFeedItem;
}

export function BlogCard({ blog }: BlogCardProps) {
  const initials = getInitials(blog.author.displayName, blog.author.username);
  return (
    <article className="group bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md hover:border-slate-300 transition-all duration-200">
      {blog.coverImage && (
        <Link href={ROUTES.blogDetail(blog.slug)}>
          <div className="h-48 overflow-hidden bg-slate-100">
            <img
              src={blog.coverImage}
              alt={blog.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        </Link>
      )}
      <div className="p-5">
        {/* Tags */}
        {blog.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {blog.tags.slice(0, 3).map((tag) => (
              <Badge key={tag}>#{tag}</Badge>
            ))}
          </div>
        )}

        {/* Title */}
        <Link href={ROUTES.blogDetail(blog.slug)}>
          <h2 className="text-lg font-bold text-slate-900 leading-snug group-hover:text-slate-600 transition-colors line-clamp-2">
            {blog.title}
          </h2>
        </Link>

        {/* Excerpt */}
        {blog.excerpt && (
          <p className="mt-2 text-sm text-slate-500 line-clamp-2">
            {truncate(blog.excerpt, 120)}
          </p>
        )}

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between">
          {/* Author */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
              {initials}
            </div>
            <div>
              <p className="text-xs font-medium text-slate-700">
                {blog.author.displayName ?? blog.author.username}
              </p>
              <p className="text-xs text-slate-400">{formatDate(blog.publishedAt)}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 text-slate-400">
            <span className="flex items-center gap-1 text-xs">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
              </svg>
              {blog.likeCount}
            </span>
            <span className="flex items-center gap-1 text-xs">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {blog.commentCount}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
