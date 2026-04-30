"use client";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-40 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mt-2" />
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-28 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="h-8 w-28 bg-gray-200 dark:bg-gray-700 rounded-full" />
        </div>
      </div>
      <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl" />
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
      <div className="space-y-3">
        <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-7 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded mt-2" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        ))}
      </div>
      <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl" />
    </div>
  );
}

export function QueuePageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-pulse">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 space-y-6">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-2xl mb-3" />
            <div className="h-7 w-40 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded mt-2" />
          </div>
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-14 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function AdminSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        ))}
      </div>
      <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl" />
    </div>
  );
}
