import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function TransactionHistoryLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          {/* Sidebar Skeleton */}
          <aside className="hidden lg:block">
            <Card>
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          </aside>

          {/* Main Content Skeleton */}
          <main className="space-y-6">
            {/* Header Card Skeleton */}
            <Card className="shadow-sm border border-gray-200">
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-5 w-32" />
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-7 w-48" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Card Skeleton */}
            <Card className="shadow-sm border border-gray-200">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-8 w-32" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Table Card Skeleton */}
            <Card className="shadow-sm border border-gray-200">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-9 w-32" />
                  </div>

                  {/* Table Header */}
                  <div className="grid grid-cols-5 gap-4 pb-3 border-b">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                  </div>

                  {/* Table Rows */}
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="grid grid-cols-5 gap-4 py-4 border-b">
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-5 w-20" />
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </div>
  );
}
