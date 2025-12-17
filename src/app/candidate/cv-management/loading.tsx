export default function CVManagementLoading() {
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

            {/* Default CV Card skeleton */}
            <div className="bg-gradient-to-r from-[#3a4660] to-gray-400 rounded-xl p-6 animate-pulse">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="h-6 bg-white/20 rounded w-1/4 mb-2"></div>
                  <div className="h-4 bg-white/20 rounded w-1/3"></div>
                </div>
                <div className="h-6 bg-white/20 rounded w-20"></div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 rounded"></div>
                <div className="flex-1">
                  <div className="h-5 bg-white/20 rounded w-2/3 mb-2"></div>
                  <div className="h-4 bg-white/20 rounded w-1/2"></div>
                </div>
              </div>
            </div>

            {/* Tabs skeleton */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 animate-pulse">
              <div className="border-b border-gray-200 px-6">
                <div className="flex space-x-4 py-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-10 bg-gray-200 rounded w-32"></div>
                  ))}
                </div>
              </div>

              {/* CV Cards skeleton */}
              <div className="p-6 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="w-12 h-12 bg-gray-200 rounded"></div>
                        <div className="flex-1">
                          <div className="h-5 bg-gray-200 rounded w-2/3 mb-2"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                          <div className="flex space-x-2">
                            <div className="h-6 bg-gray-200 rounded w-20"></div>
                            <div className="h-6 bg-gray-200 rounded w-24"></div>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <div className="w-8 h-8 bg-gray-200 rounded"></div>
                        <div className="w-8 h-8 bg-gray-200 rounded"></div>
                        <div className="w-8 h-8 bg-gray-200 rounded"></div>
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
