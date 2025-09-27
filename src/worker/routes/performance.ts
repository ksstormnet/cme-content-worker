import { Hono } from 'hono'
import { Env } from '../../types/database'
import { performanceMonitor } from '../../utils/performance-monitor'

const app = new Hono<{ Bindings: Env }>()

// Get performance statistics for a specific route
app.get('/stats/:route', async (c) => {
  try {
    const route = c.req.param('route')
    const method = c.req.query('method') || 'GET'
    
    // Decode route parameter (handles URL encoding)
    const decodedRoute = decodeURIComponent(route)
    
    const stats = performanceMonitor.getRouteStats(decodedRoute, method)
    
    if (!stats) {
      return c.json({
        success: false,
        error: 'No performance data available for this route'
      }, 404)
    }
    
    return c.json({
      success: true,
      route: decodedRoute,
      method,
      stats
    })
    
  } catch (error) {
    console.error('Performance stats error:', error)
    return c.json({
      success: false,
      error: 'Failed to get performance statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// Get all performance statistics
app.get('/stats', async (c) => {
  try {
    const allStats = performanceMonitor.getAllStats()
    
    return c.json({
      success: true,
      totalRoutes: allStats.length,
      stats: allStats
    })
    
  } catch (error) {
    console.error('All performance stats error:', error)
    return c.json({
      success: false,
      error: 'Failed to get all performance statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// Get comprehensive performance report
app.get('/report', async (c) => {
  try {
    const format = c.req.query('format') || 'json'
    const report = performanceMonitor.getPerformanceReport()
    
    if (format === 'html') {
      return c.html(generatePerformanceReportHTML(report))
    }
    
    return c.json({
      success: true,
      report
    })
    
  } catch (error) {
    console.error('Performance report error:', error)
    return c.json({
      success: false,
      error: 'Failed to generate performance report',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// Clear performance metrics
app.delete('/metrics', async (c) => {
  try {
    performanceMonitor.clearMetrics()
    
    return c.json({
      success: true,
      message: 'Performance metrics cleared'
    })
    
  } catch (error) {
    console.error('Clear metrics error:', error)
    return c.json({
      success: false,
      error: 'Failed to clear performance metrics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// Performance monitoring dashboard
app.get('/dashboard', async (c) => {
  try {
    const report = performanceMonitor.getPerformanceReport()
    
    return c.html(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>CME Performance Dashboard</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; background: #f5f6fa; }
          .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px; text-align: center; }
          .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
          .stat-card { background: white; padding: 25px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
          .stat-value { font-size: 2.5em; font-weight: bold; color: #333; margin: 10px 0; }
          .stat-label { color: #666; font-size: 0.9em; text-transform: uppercase; letter-spacing: 1px; }
          .section { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 30px; }
          .section h2 { margin: 0 0 20px 0; color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th, td { text-align: left; padding: 12px; border-bottom: 1px solid #eee; }
          th { background: #f8f9fa; font-weight: 600; color: #333; }
          .badge { padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: bold; }
          .badge-success { background: #d4edda; color: #155724; }
          .badge-warning { background: #fff3cd; color: #856404; }
          .badge-danger { background: #f8d7da; color: #721c24; }
          .performance-bar { height: 20px; background: #e9ecef; border-radius: 10px; overflow: hidden; position: relative; }
          .performance-fill { height: 100%; transition: width 0.3s ease; border-radius: 10px; }
          .perf-excellent { background: linear-gradient(90deg, #28a745, #20c997); }
          .perf-good { background: linear-gradient(90deg, #20c997, #ffc107); }
          .perf-fair { background: linear-gradient(90deg, #ffc107, #fd7e14); }
          .perf-poor { background: linear-gradient(90deg, #fd7e14, #dc3545); }
          .refresh-btn { background: #667eea; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; float: right; }
          .refresh-btn:hover { background: #5a6fd8; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>CME Performance Dashboard</h1>
            <p>Real-time performance monitoring for Cruise Made Easy Content Worker</p>
            <button class="refresh-btn" onclick="location.reload()">Refresh Data</button>
          </div>
          
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">${report.summary.totalRoutes}</div>
              <div class="stat-label">Active Routes</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${report.summary.totalRequests.toLocaleString()}</div>
              <div class="stat-label">Total Requests</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${report.summary.averageResponseTime.toFixed(0)}ms</div>
              <div class="stat-label">Avg Response Time</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${(report.summary.overallFailureRate * 100).toFixed(2)}%</div>
              <div class="stat-label">Failure Rate</div>
            </div>
          </div>
          
          ${report.slowRoutes.length > 0 ? generateSlowRoutesSection(report.slowRoutes) : ''}
          ${report.fastRoutes.length > 0 ? generateFastRoutesSection(report.fastRoutes) : ''}
          ${generateAllRoutesSection(report.allRoutes)}
          
          <div class="section">
            <p style="text-align: center; color: #666; margin: 0;">
              Last updated: ${new Date(report.timestamp).toLocaleString()}
            </p>
          </div>
        </div>
        
        <script>
          // Auto-refresh every 30 seconds
          setTimeout(() => location.reload(), 30000);
        </script>
      </body>
      </html>
    `)
    
  } catch (error) {
    console.error('Performance dashboard error:', error)
    return c.html(`
      <html>
        <body>
          <h1>Performance Dashboard Error</h1>
          <p>Unable to load performance data: ${error instanceof Error ? error.message : 'Unknown error'}</p>
        </body>
      </html>
    `, 500)
  }
})

function generatePerformanceReportHTML(report: any): string {
  // Similar to dashboard but more detailed
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Performance Report - CME Content Worker</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
        .section { background: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 8px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 10px; text-align: left; border: 1px solid #ddd; }
        th { background: #f2f2f2; }
        .metric { display: inline-block; margin: 10px; padding: 15px; background: white; border-radius: 5px; border: 1px solid #ddd; }
        .slow { color: #d32f2f; }
        .fast { color: #388e3c; }
      </style>
    </head>
    <body>
      <h1>Performance Report</h1>
      <div class="section">
        <h2>Summary</h2>
        <div class="metric">Total Routes: ${report.summary.totalRoutes}</div>
        <div class="metric">Total Requests: ${report.summary.totalRequests}</div>
        <div class="metric">Avg Response: ${report.summary.averageResponseTime.toFixed(2)}ms</div>
        <div class="metric">Failure Rate: ${(report.summary.overallFailureRate * 100).toFixed(2)}%</div>
      </div>
      
      ${report.slowRoutes.length > 0 ? `
      <div class="section">
        <h2>Slow Routes (>1000ms)</h2>
        <table>
          <tr><th>Route</th><th>Avg Total Time</th><th>Avg Render Time</th><th>Cache Hit Rate</th></tr>
          ${report.slowRoutes.map((route: any) => `
            <tr>
              <td>${route.route}</td>
              <td class="slow">${route.averageTotalTime.toFixed(2)}ms</td>
              <td>${route.averageRenderTime.toFixed(2)}ms</td>
              <td>${(route.cacheHitRate * 100).toFixed(1)}%</td>
            </tr>
          `).join('')}
        </table>
      </div>
      ` : ''}
      
      <div class="section">
        <p>Generated at: ${report.timestamp}</p>
      </div>
    </body>
    </html>
  `
}

function generateSlowRoutesSection(slowRoutes: any[]): string {
  return `
    <div class="section">
      <h2>🐌 Slow Routes (>1000ms)</h2>
      <table>
        <thead>
          <tr><th>Route</th><th>Requests</th><th>Avg Time</th><th>P95 Time</th><th>Failure Rate</th><th>Performance</th></tr>
        </thead>
        <tbody>
          ${slowRoutes.map(route => `
            <tr>
              <td><strong>${route.route}</strong></td>
              <td>${route.totalRequests.toLocaleString()}</td>
              <td>${route.averageTotalTime.toFixed(0)}ms</td>
              <td>${route.p95TotalTime.toFixed(0)}ms</td>
              <td>${(route.failureRate * 100).toFixed(1)}%</td>
              <td>
                <div class="performance-bar">
                  <div class="performance-fill perf-poor" style="width: ${Math.min(100, (route.averageTotalTime / 2000) * 100)}%"></div>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `
}

function generateFastRoutesSection(fastRoutes: any[]): string {
  return `
    <div class="section">
      <h2>⚡ Fast Routes (<200ms)</h2>
      <table>
        <thead>
          <tr><th>Route</th><th>Requests</th><th>Avg Time</th><th>Cache Hit</th></tr>
        </thead>
        <tbody>
          ${fastRoutes.slice(0, 5).map(route => `
            <tr>
              <td><strong>${route.route}</strong></td>
              <td>${route.totalRequests.toLocaleString()}</td>
              <td>${route.averageTotalTime.toFixed(0)}ms</td>
              <td><span class="badge badge-success">${(route.cacheHitRate * 100).toFixed(0)}%</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `
}

function generateAllRoutesSection(allRoutes: any[]): string {
  return `
    <div class="section">
      <h2>📊 All Routes Performance</h2>
      <table>
        <thead>
          <tr><th>Route</th><th>Requests</th><th>Success Rate</th><th>Avg Time</th><th>Render Time</th><th>DB Time</th><th>Status</th></tr>
        </thead>
        <tbody>
          ${allRoutes.map(route => {
            const successRate = ((route.totalRequests - (route.totalRequests * route.failureRate)) / route.totalRequests) * 100
            let statusBadge = 'badge-success'
            let statusText = 'Healthy'
            
            if (route.averageTotalTime > 1000) {
              statusBadge = 'badge-danger'
              statusText = 'Slow'
            } else if (route.averageTotalTime > 500) {
              statusBadge = 'badge-warning'  
              statusText = 'Medium'
            }
            
            return `
              <tr>
                <td><strong>${route.route}</strong></td>
                <td>${route.totalRequests.toLocaleString()}</td>
                <td>${successRate.toFixed(1)}%</td>
                <td>${route.averageTotalTime.toFixed(0)}ms</td>
                <td>${route.averageRenderTime.toFixed(0)}ms</td>
                <td>${route.averageDbQueryTime.toFixed(0)}ms</td>
                <td><span class="badge ${statusBadge}">${statusText}</span></td>
              </tr>
            `
          }).join('')}
        </tbody>
      </table>
    </div>
  `
}

export default app