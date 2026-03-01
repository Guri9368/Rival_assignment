'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginSchema, LoginInput } from '@/features/auth/schemas';
import { loginAction } from '@/features/auth/actions';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ROUTES } from '@/lib/constants';
import type { Metadata } from 'next';

export default function LoginPage() {
  const [serverError, setServerError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setServerError('');
    const result = await loginAction(data);
    if (result?.error) setServerError(result.error);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href={ROUTES.feed} className="text-2xl font-bold text-slate-900">BlogPlatform</Link>
          <p className="mt-2 text-sm text-slate-500">Sign in to your account</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          {serverError && <ErrorMessage message={serverError} className="mb-5" />}
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input label="Email" type="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
            <Input label="Password" type="password" placeholder="••••••••" error={errors.password?.message} {...register('password')} />
            <Button type="submit" size="lg" loading={isSubmitting} className="mt-2 w-full">
              Sign in
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Don&apos;t have an account?{' '}
          <Link href={ROUTES.register} className="font-medium text-slate-900 hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
