export function Skeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className="h-4 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-800"
        />
      ))}
    </div>
  );
}
