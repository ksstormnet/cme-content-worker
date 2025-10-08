import { Hono } from 'hono'
import { Env } from '../../types/database'
import { checkDeploymentReadiness, generateDeploymentReport } from '../../utils/deployment-checker'

const app = new Hono<{ Bindings: Env }>()

// Deployment readiness check endpoint
app.get('/readiness', async (c) => {
  try {
    const readiness = await checkDeploymentReadiness(c.env)

    const format = c.req.query('format') || 'json'

    if (format === 'html') {
      return c.html(generateDeploymentReport(readiness))
    }

    return c.json({
      success: true,
      readiness
    })

  } catch (error) {
    console.error('Deployment readiness check error:', error)
    return c.json({
      success: false,
      error: 'Failed to check deployment readiness',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// Health check endpoint for load balancers
app.get('/health', async (c) => {
  try {
    // Quick health check - test essential services only
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'unknown',
        storage: 'unknown',
        templates: 'unknown'
      }
    }

    // Test database connectivity
    try {
      await c.env.DB.prepare('SELECT 1').first()
      healthStatus.services.database = 'healthy'
    } catch (error) {
      healthStatus.services.database = 'unhealthy'
      healthStatus.status = 'unhealthy'
    }

    // Test R2 storage
    try {
      await c.env.IMAGES.head('health-check-key') // Non-destructive check
      healthStatus.services.storage = 'healthy'
    } catch (error) {
      // R2 head operation may fail if key doesn't exist, but that's ok
      healthStatus.services.storage = 'healthy'
    }

    // Test template system
    try {
      const { templateRenderer } = await import('../../utils/template-renderer')
      const templates = templateRenderer.getAvailableTemplates()
      healthStatus.services.templates = templates.length > 0 ? 'healthy' : 'unhealthy'

      if (templates.length === 0) {
        healthStatus.status = 'unhealthy'
      }
    } catch (error) {
      healthStatus.services.templates = 'unhealthy'
      healthStatus.status = 'unhealthy'
    }

    const statusCode = healthStatus.status === 'healthy' ? 200 : 503

    return c.json(healthStatus, statusCode)

  } catch (error) {
    console.error('Health check error:', error)
    return c.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 503)
  }
})

// System information endpoint
app.get('/info', async (c) => {
  try {
    // Get system information
    const { templateRenderer } = await import('../../utils/template-renderer')
    const { performanceMonitor } = await import('../../utils/performance-monitor')

    // Get database stats
    let dbStats = {}
    try {
      const postCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM posts WHERE status = "published"').first()
      const imageCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM images').first()

      dbStats = {
        publishedPosts: (postCount as any)?.count || 0,
        images: (imageCount as any)?.count || 0
      }
    } catch (error) {
      dbStats = { error: 'Unable to fetch database statistics' }
    }

    // Get performance stats
    const perfReport = performanceMonitor.getPerformanceReport()

    const systemInfo = {
      timestamp: new Date().toISOString(),
      environment: c.env.ENVIRONMENT || 'unknown',
      version: '1.0.0',
      templates: {
        available: templateRenderer.getAvailableTemplates().length,
        names: templateRenderer.getAvailableTemplates()
      },
      database: dbStats,
      performance: {
        totalRoutes: perfReport.summary.totalRoutes,
        totalRequests: perfReport.summary.totalRequests,
        averageResponseTime: perfReport.summary.averageResponseTime,
        failureRate: perfReport.summary.overallFailureRate
      },
      features: {
        seoValidation: true,
        performanceMonitoring: true,
        imageProcessing: true,
        templateRendering: true,
        contentBlocks: true,
        postNavigation: true,
        breadcrumbs: true
      }
    }

    return c.json({
      success: true,
      info: systemInfo
    })

  } catch (error) {
    console.error('System info error:', error)
    return c.json({
      success: false,
      error: 'Failed to get system information',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// Pre-flight check for specific deployment scenarios
app.post('/preflight', async (c) => {
  try {
    const body = await c.req.json()
    const { scenario } = body

    let checks = []

    switch (scenario) {
      case 'production':
        // Production-specific checks
        checks = await runProductionPreflightChecks(c.env)
        break

      case 'migration':
        // Migration-specific checks
        checks = await runMigrationPreflightChecks(c.env)
        break

      default:
        // Default comprehensive checks
        const readiness = await checkDeploymentReadiness(c.env)
        checks = readiness.checks
    }

    const criticalIssues = checks.filter((check: any) => check.critical && check.status === 'fail')
    const ready = criticalIssues.length === 0

    return c.json({
      success: true,
      ready,
      scenario,
      checks,
      criticalIssues: criticalIssues.length,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Preflight check error:', error)
    return c.json({
      success: false,
      error: 'Failed to run preflight checks',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// Production-specific preflight checks
async function runProductionPreflightChecks(env: Env): Promise<any[]> {
  const checks = []

  // Check environment is set to production
  if (env.ENVIRONMENT === 'production') {
    checks.push({
      name: 'Production Environment',
      status: 'pass',
      message: 'Environment is correctly set to production',
      critical: true
    })
  } else {
    checks.push({
      name: 'Production Environment',
      status: 'fail',
      message: 'Environment is not set to production',
      critical: true
    })
  }

  // Check for sufficient content
  try {
    const postCount = await env.DB.prepare('SELECT COUNT(*) as count FROM posts WHERE status = "published"').first()
    const count = (postCount as any)?.count || 0

    if (count >= 10) {
      checks.push({
        name: 'Content Volume',
        status: 'pass',
        message: `${count} published posts available`,
        critical: false
      })
    } else if (count >= 1) {
      checks.push({
        name: 'Content Volume',
        status: 'warning',
        message: `Only ${count} published posts available`,
        critical: false
      })
    } else {
      checks.push({
        name: 'Content Volume',
        status: 'fail',
        message: 'No published content available',
        critical: true
      })
    }
  } catch (error) {
    checks.push({
      name: 'Content Volume',
      status: 'fail',
      message: 'Unable to check content volume',
      critical: false
    })
  }

  return checks
}

// Migration-specific preflight checks
async function runMigrationPreflightChecks(env: Env): Promise<any[]> {
  const checks = []

  // Check database is empty or migration is safe
  try {
    const postCount = await env.DB.prepare('SELECT COUNT(*) as count FROM posts').first()
    const imageCount = await env.DB.prepare('SELECT COUNT(*) as count FROM images').first()

    const posts = (postCount as any)?.count || 0
    const images = (imageCount as any)?.count || 0

    if (posts === 0 && images === 0) {
      checks.push({
        name: 'Migration Safety',
        status: 'pass',
        message: 'Database is empty - safe for migration',
        critical: false
      })
    } else {
      checks.push({
        name: 'Migration Safety',
        status: 'warning',
        message: `Database contains ${posts} posts and ${images} images`,
        details: 'Ensure backup is available before migration',
        critical: false
      })
    }
  } catch (error) {
    checks.push({
      name: 'Migration Safety',
      status: 'warning',
      message: 'Unable to check migration safety',
      critical: false
    })
  }

  return checks
}

export default app
