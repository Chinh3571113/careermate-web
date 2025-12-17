export default function JobActivitiesLoading() {
  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[16rem_minmax(0,1fr)] gap-6 items-start">
          {/* Sidebar skeleton */}
          <aside className="hidden lg:block">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="h-10 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Content skeleton */}
          <section className="space-y-6">
            {/* Header skeleton */}
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>

            {/* Stats Cards skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="w-8 h-8 bg-gray-200 rounded"></div>
                  </div>
                  <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                </div>
              ))}
            </div>

            {/* Activity Timeline skeleton */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
              <div className="space-y-6">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex space-x-4">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                      {i !== 5 && <div className="w-0.5 h-full bg-gray-200 mt-2"></div>}
                    </div>
                    <div className="flex-1 pb-6">
                      <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4 mb-3"></div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
