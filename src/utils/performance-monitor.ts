// Performance monitoring and benchmarking utilities

export interface PerformanceMetrics {
  renderTime: number        // Template rendering time in ms
  dbQueryTime: number      // Database query time in ms
  imageProcessTime: number // Image variant processing time in ms
  totalTime: number        // Total request processing time in ms
  templateCount: number    // Number of templates rendered
  variableCount: number    // Number of template variables populated
  contentBlockCount: number // Number of content blocks processed
  cacheHit: boolean        // Whether result was from cache
}

export interface PerformanceBenchmark {
  route: string
  method: string
  timestamp: string
  metrics: PerformanceMetrics
  success: boolean
  error?: string
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, PerformanceBenchmark[]> = new Map()
  
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }
  
  // Start performance tracking for a request
  startTracking(route: string, method: string = 'GET'): PerformanceTracker {
    return new PerformanceTracker(route, method)
  }
  
  // Record performance benchmark
  recordBenchmark(benchmark: PerformanceBenchmark): void {
    const key = `${benchmark.method}:${benchmark.route}`
    
    if (!this.metrics.has(key)) {
      this.metrics.set(key, [])
    }
    
    const routeMetrics = this.metrics.get(key)!
    routeMetrics.push(benchmark)
    
    // Keep only last 100 measurements per route
    if (routeMetrics.length > 100) {
      routeMetrics.shift()
    }
  }
  
  // Get performance statistics for a route
  getRouteStats(route: string, method: string = 'GET'): RoutePerformanceStats | null {
    const key = `${method}:${route}`
    const benchmarks = this.metrics.get(key)
    
    if (!benchmarks || benchmarks.length === 0) {
      return null
    }
    
    const successfulBenchmarks = benchmarks.filter(b => b.success)
    const metrics = successfulBenchmarks.map(b => b.metrics)
    
    if (metrics.length === 0) {
      return null
    }
    
    return {
      route,
      method,
      totalRequests: benchmarks.length,
      successfulRequests: successfulBenchmarks.length,
      failureRate: (benchmarks.length - successfulBenchmarks.length) / benchmarks.length,
      averageRenderTime: average(metrics.map(m => m.renderTime)),
      averageDbQueryTime: average(metrics.map(m => m.dbQueryTime)),
      averageTotalTime: average(metrics.map(m => m.totalTime)),
      p95RenderTime: percentile(metrics.map(m => m.renderTime), 0.95),
      p95TotalTime: percentile(metrics.map(m => m.totalTime), 0.95),
      medianRenderTime: percentile(metrics.map(m => m.renderTime), 0.5),
      medianTotalTime: percentile(metrics.map(m => m.totalTime), 0.5),
      cacheHitRate: metrics.filter(m => m.cacheHit).length / metrics.length,
      lastUpdated: new Date().toISOString()
    }
  }
  
  // Get all route statistics
  getAllStats(): RoutePerformanceStats[] {
    const stats: RoutePerformanceStats[] = []
    
    for (const [key] of this.metrics.entries()) {
      const [method, route] = key.split(':', 2)
      const routeStats = this.getRouteStats(route, method)
      if (routeStats) {
        stats.push(routeStats)
      }
    }
    
    return stats.sort((a, b) => b.averageTotalTime - a.averageTotalTime)
  }
  
  // Clear performance data
  clearMetrics(): void {
    this.metrics.clear()
  }
  
  // Get performance report
  getPerformanceReport(): PerformanceReport {
    const allStats = this.getAllStats()
    
    const slowRoutes = allStats.filter(s => s.averageTotalTime > 1000) // > 1 second
    const fastRoutes = allStats.filter(s => s.averageTotalTime < 200)  // < 200ms
    const highFailureRoutes = allStats.filter(s => s.failureRate > 0.05) // > 5% failure
    
    const totalRequests = allStats.reduce((sum, s) => sum + s.totalRequests, 0)
    const totalFailures = allStats.reduce((sum, s) => sum + (s.totalRequests - s.successfulRequests), 0)
    
    return {
      summary: {
        totalRoutes: allStats.length,
        totalRequests,
        totalFailures,
        overallFailureRate: totalRequests > 0 ? totalFailures / totalRequests : 0,
        averageResponseTime: allStats.length > 0 
          ? allStats.reduce((sum, s) => sum + s.averageTotalTime, 0) / allStats.length 
          : 0
      },
      slowRoutes,
      fastRoutes: fastRoutes.slice(0, 10), // Top 10 fastest
      highFailureRoutes,
      allRoutes: allStats,
      timestamp: new Date().toISOString()
    }
  }
}

export class PerformanceTracker {
  private startTime: number
  private dbStartTime: number = 0
  private imageStartTime: number = 0
  private templateCount: number = 0
  private variableCount: number = 0
  private contentBlockCount: number = 0
  private cacheHit: boolean = false
  private dbQueryTime: number = 0
  private imageProcessTime: number = 0
  
  constructor(
    private route: string,
    private method: string
  ) {
    this.startTime = performance.now()
  }
  
  // Mark start of database operation
  startDbQuery(): void {
    this.dbStartTime = performance.now()
  }
  
  // Mark end of database operation
  endDbQuery(): void {
    if (this.dbStartTime > 0) {
      this.dbQueryTime += performance.now() - this.dbStartTime
      this.dbStartTime = 0
    }
  }
  
  // Mark start of image processing
  startImageProcessing(): void {
    this.imageStartTime = performance.now()
  }
  
  // Mark end of image processing
  endImageProcessing(): void {
    if (this.imageStartTime > 0) {
      this.imageProcessTime += performance.now() - this.imageStartTime
      this.imageStartTime = 0
    }
  }
  
  // Increment template count
  incrementTemplateCount(): void {
    this.templateCount++
  }
  
  // Set variable count
  setVariableCount(count: number): void {
    this.variableCount = count
  }
  
  // Set content block count
  setContentBlockCount(count: number): void {
    this.contentBlockCount = count
  }
  
  // Mark cache hit
  markCacheHit(): void {
    this.cacheHit = true
  }
  
  // Finish tracking and record benchmark
  finish(success: boolean = true, error?: string): PerformanceBenchmark {
    const totalTime = performance.now() - this.startTime
    const renderTime = totalTime - this.dbQueryTime - this.imageProcessTime
    
    const benchmark: PerformanceBenchmark = {
      route: this.route,
      method: this.method,
      timestamp: new Date().toISOString(),
      metrics: {
        renderTime: Math.max(0, renderTime),
        dbQueryTime: this.dbQueryTime,
        imageProcessTime: this.imageProcessTime,
        totalTime,
        templateCount: this.templateCount,
        variableCount: this.variableCount,
        contentBlockCount: this.contentBlockCount,
        cacheHit: this.cacheHit
      },
      success,
      error
    }
    
    // Record in monitor
    PerformanceMonitor.getInstance().recordBenchmark(benchmark)
    
    return benchmark
  }
}

export interface RoutePerformanceStats {
  route: string
  method: string
  totalRequests: number
  successfulRequests: number
  failureRate: number
  averageRenderTime: number
  averageDbQueryTime: number
  averageTotalTime: number
  p95RenderTime: number
  p95TotalTime: number
  medianRenderTime: number
  medianTotalTime: number
  cacheHitRate: number
  lastUpdated: string
}

export interface PerformanceReport {
  summary: {
    totalRoutes: number
    totalRequests: number
    totalFailures: number
    overallFailureRate: number
    averageResponseTime: number
  }
  slowRoutes: RoutePerformanceStats[]
  fastRoutes: RoutePerformanceStats[]
  highFailureRoutes: RoutePerformanceStats[]
  allRoutes: RoutePerformanceStats[]
  timestamp: string
}

// Utility functions
function average(numbers: number[]): number {
  if (numbers.length === 0) return 0
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length
}

function percentile(numbers: number[], p: number): number {
  if (numbers.length === 0) return 0
  
  const sorted = [...numbers].sort((a, b) => a - b)
  const index = Math.ceil(sorted.length * p) - 1
  return sorted[Math.max(0, index)]
}

// Performance logging helper
export function logPerformance(tracker: PerformanceTracker, details?: string): void {
  const benchmark = tracker.finish(true)
  
  if (benchmark.metrics.totalTime > 2000) {
    console.warn(`🐌 Slow request: ${benchmark.route} took ${benchmark.metrics.totalTime.toFixed(2)}ms`, details)
  } else if (benchmark.metrics.totalTime < 100) {
    console.log(`⚡ Fast request: ${benchmark.route} took ${benchmark.metrics.totalTime.toFixed(2)}ms`, details)
  } else {
    console.log(`📊 Request: ${benchmark.route} took ${benchmark.metrics.totalTime.toFixed(2)}ms`, details)
  }
}

// Performance header helper
export function addPerformanceHeaders(response: Response, tracker: PerformanceTracker): Response {
  const benchmark = tracker.finish(true)
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: {
      ...Object.fromEntries(response.headers.entries()),
      'X-Response-Time': `${benchmark.metrics.totalTime.toFixed(2)}ms`,
      'X-Render-Time': `${benchmark.metrics.renderTime.toFixed(2)}ms`,
      'X-DB-Time': `${benchmark.metrics.dbQueryTime.toFixed(2)}ms`,
      'X-Templates': String(benchmark.metrics.templateCount),
      'X-Variables': String(benchmark.metrics.variableCount),
      'X-Cache': benchmark.metrics.cacheHit ? 'HIT' : 'MISS'
    }
  })
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance()