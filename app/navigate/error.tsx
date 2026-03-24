'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';

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
      <h2 className="text-xl font-semibold">导航错误 | Navigation Error</h2>
      <p className="text-muted-foreground text-center max-w-md">
        {error.message || 'Something went wrong!'}
      </p>
      <div className="flex gap-2">
        <Button onClick={reset}>重试 | Retry</Button>
        <Link href="/">
          <Button variant="outline">返回首页 | Home</Button>
        </Link>
      </div>
    </div>
  );
}
