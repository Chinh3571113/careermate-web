export default function RoadmapLoading() {
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

            {/* Progress Overview skeleton */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="text-center">
                    <div className="h-16 bg-gray-200 rounded-full w-16 mx-auto mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto mb-1"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/3 mx-auto"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Roadmap Timeline skeleton */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
              
              {/* Timeline items */}
              <div className="space-y-8">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="relative pl-8">
                    {/* Timeline dot */}
                    <div className="absolute left-0 top-1">
                      <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                    </div>
                    
                    {/* Timeline content */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-6 bg-gray-200 rounded w-20"></div>
                      </div>
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                      
                      {/* Milestone cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                        {[1, 2].map((j) => (
                          <div key={j} className="border border-gray-200 rounded-lg p-4">
                            <div className="h-5 bg-gray-200 rounded w-2/3 mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
                            <div className="h-4 bg-gray-200 rounded w-4/5"></div>
                          </div>
                        ))}
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
