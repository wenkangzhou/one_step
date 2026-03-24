import { Mountain } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <div className="relative">
        <Mountain className="h-12 w-12 text-forest-600 animate-pulse" />
      </div>
      <p className="text-muted-foreground animate-pulse">Loading...</p>
    </div>
  );
}
