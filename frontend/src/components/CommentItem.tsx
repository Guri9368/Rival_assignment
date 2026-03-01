import { CommentItem as CommentItemType } from '@/types/api.types';
import { formatRelativeTime, getInitials } from '@/lib/utils';

interface CommentItemProps {
  comment: CommentItemType;
}

export function CommentItem({ comment }: CommentItemProps) {
  const initials = getInitials(comment.author.displayName, comment.author.username);
  return (
    <div className="flex gap-3 py-4">
      <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-semibold flex-shrink-0">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-sm font-semibold text-slate-900">
            {comment.author.displayName ?? comment.author.username}
          </span>
          <span className="text-xs text-slate-400">
            @{comment.author.username} · {formatRelativeTime(comment.createdAt)}
          </span>
          {comment.isEdited && (
            <span className="text-xs text-slate-400 italic">(edited)</span>
          )}
        </div>
        <p className="mt-1 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
          {comment.body}
        </p>
      </div>
    </div>
  );
}
