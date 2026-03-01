'use client';

import { useState } from 'react';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Button } from './ui/Button';
import { ErrorMessage } from './ui/ErrorMessage';
import { BlogDetail } from '@/types/api.types';

interface BlogFormProps {
  initial?: BlogDetail;
  onSubmit: (data: {
    title: string;
    content: string;
    excerpt: string;
    coverImage: string;
    tags: string[];
    status: 'DRAFT' | 'PUBLISHED';
  }) => Promise<{ error?: string } | void>;
}

export function BlogForm({ initial, onSubmit }: BlogFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [content, setContent] = useState(initial?.content ?? '');
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? '');
  const [coverImage, setCoverImage] = useState(initial?.coverImage ?? '');
  const [tags, setTags] = useState((initial?.tags ?? []).join(', '));
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>(initial?.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent, submitStatus: 'DRAFT' | 'PUBLISHED') => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required.');
      return;
    }
    setLoading(true);
    setError('');
    const result = await onSubmit({
      title: title.trim(),
      content: content.trim(),
      excerpt: excerpt.trim(),
      coverImage: coverImage.trim(),
      tags: tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean),
      status: submitStatus,
    });
    if (result?.error) setError(result.error);
    setLoading(false);
  };

  return (
    <form className="flex flex-col gap-5" onSubmit={(e) => handleSubmit(e, status)}>
      {error && <ErrorMessage message={error} />}

      <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Your blog title..." required />
      <Textarea label="Content" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write your content here..." className="min-h-[300px]" required />
      <Input label="Excerpt (optional)" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Short description shown in feed..." />
      <Input label="Cover Image URL (optional)" value={coverImage} onChange={(e) => setCoverImage(e.target.value)} placeholder="https://..." type="url" />
      <Input label="Tags (comma separated)" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="nextjs, typescript, webdev" />

      <div className="flex items-center gap-3 pt-2">
        <Button type="button" variant="secondary" loading={loading} onClick={(e) => handleSubmit(e as any, 'DRAFT')}>
          Save as Draft
        </Button>
        <Button type="button" loading={loading} onClick={(e) => handleSubmit(e as any, 'PUBLISHED')}>
          {initial ? 'Update & Publish' : 'Publish'}
        </Button>
      </div>
    </form>
  );
}
