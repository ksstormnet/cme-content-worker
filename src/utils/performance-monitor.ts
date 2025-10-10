// Performance monitoring and benchmarking utilities
// Stateless performance tracking - no singleton, no persistent state

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

// Factory function to create a performance tracker for a request
export function createPerformanceTracker(route: string, method: string = 'GET'): PerformanceTracker {
  return new PerformanceTracker(route, method)
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

  // Finish tracking and return benchmark
  finish(success: boolean = true, error?: string): PerformanceBenchmark {
    const totalTime = performance.now() - this.startTime
    const renderTime = totalTime - this.dbQueryTime - this.imageProcessTime

    return {
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
  }
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

// Performance header helper - stateless function
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
