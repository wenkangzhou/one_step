'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <h2 className="text-xl font-semibold">出错了 | Error</h2>
      <p className="text-muted-foreground text-center max-w-md">
        {error.message || 'Something went wrong!'}
      </p>
      <Button onClick={reset}>重试 | Retry</Button>
    </div>
  );
}
