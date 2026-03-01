interface ErrorMessageProps {
  message: string;
  className?: string;
}

export function ErrorMessage({ message, className }: ErrorMessageProps) {
  return (
    <div className={`rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 ${className ?? ''}`}>
      {message}
    </div>
  );
}
