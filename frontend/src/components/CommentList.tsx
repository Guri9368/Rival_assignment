'use client';

import { useState, useEffect, useCallback } from 'react';
import { CommentItem as CommentItemType } from '@/types/api.types';
import { commentsApi } from '@/lib/api/comments.api';
import { CommentItem } from './CommentItem';
import { CommentForm } from './CommentForm';
import { Button } from './ui/Button';
import { Spinner } from './ui/Spinner';
import { EmptyState } from './ui/EmptyState';

interface CommentListProps {
  blogId: string;
  initialCount: number;
  isLoggedIn: boolean;
}

export function CommentList({ blogId, initialCount, isLoggedIn }: CommentListProps) {
  const [comments, setComments] = useState<CommentItemType[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchComments = useCallback(async (pageNum: number, append = false) => {
    try {
      const res = await commentsApi.getComments(blogId, pageNum);
      setComments((prev) => append ? [...prev, ...res.data] : res.data);
      setHasMore(res.meta.hasNextPage);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [blogId]);

  useEffect(() => { fetchComments(1); }, [fetchComments]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    setLoadingMore(true);
    fetchComments(nextPage, true);
  };

  const onCommentAdded = (comment: CommentItemType) => {
    setComments((prev) => [comment, ...prev]);
  };

  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold text-slate-900 mb-6">
        Comments{initialCount > 0 && (
          <span className="text-slate-400 font-normal text-base ml-2">({initialCount})</span>
        )}
      </h2>

      {isLoggedIn ? (
        <CommentForm blogId={blogId} onCommentAdded={onCommentAdded} />
      ) : (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-500 text-center">
          <a href="/login" className="font-medium text-slate-900 hover:underline">Sign in</a> to leave a comment
        </div>
      )}

      <div className="mt-6 divide-y divide-slate-100">
        {loading ? (
          <div className="flex justify-center py-8"><Spinner className="h-6 w-6" /></div>
        ) : comments.length === 0 ? (
          <EmptyState title="No comments yet" description="Be the first to share your thoughts." />
        ) : (
          comments.map((c) => <CommentItem key={c.id} comment={c} />)
        )}
      </div>

      {hasMore && !loading && (
        <div className="mt-4 flex justify-center">
          <Button variant="secondary" size="sm" loading={loadingMore} onClick={loadMore}>
            Load more comments
          </Button>
        </div>
      )}
    </section>
  );
}
