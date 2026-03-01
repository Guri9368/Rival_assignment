'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RegisterSchema, RegisterInput } from '@/features/auth/schemas';
import { registerAction } from '@/features/auth/actions';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ROUTES } from '@/lib/constants';

export default function RegisterPage() {
  const [serverError, setServerError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    setServerError('');
    const result = await registerAction(data);
    if (result?.error) setServerError(result.error);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href={ROUTES.feed} className="text-2xl font-bold text-slate-900">BlogPlatform</Link>
          <p className="mt-2 text-sm text-slate-500">Create your account</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          {serverError && <ErrorMessage message={serverError} className="mb-5" />}
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input label="Display Name" placeholder="John Doe" error={errors.displayName?.message} {...register('displayName')} />
            <Input label="Username" placeholder="johndoe" error={errors.username?.message} {...register('username')} />
            <Input label="Email" type="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
            <Input label="Password" type="password" placeholder="Min 8 chars, uppercase, number, symbol" error={errors.password?.message} {...register('password')} />
            <Button type="submit" size="lg" loading={isSubmitting} className="mt-2 w-full">
              Create account
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link href={ROUTES.login} className="font-medium text-slate-900 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
