'use client';

import { useState } from 'react';
import { commentsApi } from '@/lib/api/comments.api';
import { CommentItem } from '@/types/api.types';
import { Button } from './ui/Button';
import { ApiError } from '@/lib/api/client';

interface CommentFormProps {
  blogId: string;
  onCommentAdded: (comment: CommentItem) => void;
}

export function CommentForm({ blogId, onCommentAdded }: CommentFormProps) {
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;

    setLoading(true);
    setError('');
    try {
      const comment = await commentsApi.addComment(blogId, body.trim());
      onCommentAdded(comment);
      setBody('');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.status === 401 ? 'Please sign in to comment.' : err.message);
      } else {
        setError('Failed to post comment. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write a comment…"
        rows={3}
        className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-none transition-colors"
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex justify-end">
        <Button type="submit" size="sm" loading={loading} disabled={!body.trim()}>
          Post comment
        </Button>
      </div>
    </form>
  );
}
