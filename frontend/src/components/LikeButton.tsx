'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { likesApi } from '@/lib/api/likes.api';
import { ApiError } from '@/lib/api/client';
import { ROUTES } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface LikeButtonProps {
  blogId: string;
  initialCount: number;
  initialLiked?: boolean;
  isLoggedIn: boolean;  // passed from server component — no cookie reading needed
}

export function LikeButton({ blogId, initialCount, initialLiked = false, isLoggedIn }: LikeButtonProps) {
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  const handleClick = () => {
    if (!isLoggedIn) {
      router.push(ROUTES.login);
      return;
    }

    const nextLiked = !liked;
    const nextCount = nextLiked ? count + 1 : count - 1;

    // Optimistic update immediately
    setLiked(nextLiked);
    setCount(nextCount);
    setError('');

    startTransition(async () => {
      try {
        const result = nextLiked
          ? await likesApi.like(blogId)
          : await likesApi.unlike(blogId);
        setLiked(result.liked);
        setCount(result.likeCount);
      } catch (err) {
        // Revert on failure
        setLiked(liked);
        setCount(count);
        if (err instanceof ApiError) {
          if (err.status === 401) {
            router.push(ROUTES.login);
          } else {
            setError(err.message);
          }
        }
      }
    });
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        onClick={handleClick}
        disabled={isPending}
        aria-label={liked ? 'Unlike this post' : 'Like this post'}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all duration-150',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          liked
            ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50',
        )}
      >
        <svg
          className={cn('w-4 h-4 transition-transform duration-150', liked && 'scale-110')}
          fill={liked ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 20 20"
          strokeWidth={liked ? 0 : 1.5}
        >
          <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
        </svg>
        <span>{count}</span>
      </button>
      {error && <p className="text-xs text-red-500 px-1">{error}</p>}
    </div>
  );
}
