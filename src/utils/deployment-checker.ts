import { Env } from '../types/database'

export interface DeploymentCheck {
  name: string
  status: 'pass' | 'fail' | 'warning'
  message: string
  details?: string
  critical: boolean
}

export interface DeploymentReadiness {
  ready: boolean
  score: number
  checks: DeploymentCheck[]
  criticalFailures: number
  warnings: number
  timestamp: string
}

// Comprehensive deployment readiness checker
export async function checkDeploymentReadiness(env: Env): Promise<DeploymentReadiness> {
  const checks: DeploymentCheck[] = []
  
  // 1. Database connectivity and schema
  await checkDatabase(env, checks)
  
  // 2. R2 storage connectivity
  await checkR2Storage(env, checks)
  
  // 3. Template system
  await checkTemplateSystem(env, checks)
  
  // 4. Environment variables
  checkEnvironmentVariables(env, checks)
  
  // 5. Content validation
  await checkContentIntegrity(env, checks)
  
  // 6. Performance baselines
  await checkPerformanceBaselines(env, checks)
  
  // Calculate results
  const criticalFailures = checks.filter(c => c.critical && c.status === 'fail').length
  const warnings = checks.filter(c => c.status === 'warning').length
  const passes = checks.filter(c => c.status === 'pass').length
  
  const ready = criticalFailures === 0
  const score = Math.round((passes / checks.length) * 100)
  
  return {
    ready,
    score,
    checks,
    criticalFailures,
    warnings,
    timestamp: new Date().toISOString()
  }
}

// Database connectivity and schema validation
async function checkDatabase(env: Env, checks: DeploymentCheck[]): Promise<void> {
  try {
    // Test basic connectivity
    const testResult = await env.DB.prepare('SELECT 1 as test').first()
    
    if (testResult && testResult.test === 1) {
      checks.push({
        name: 'Database Connectivity',
        status: 'pass',
        message: 'Database is accessible and responsive',
        critical: true
      })
    } else {
      checks.push({
        name: 'Database Connectivity',
        status: 'fail',
        message: 'Database connectivity test failed',
        critical: true
      })
      return
    }
    
    // Check required tables exist
    const requiredTables = ['posts', 'content_blocks', 'images', 'categories', 'users']
    
    for (const table of requiredTables) {
      try {
        await env.DB.prepare(`SELECT COUNT(*) as count FROM ${table}`).first()
        checks.push({
          name: `Table: ${table}`,
          status: 'pass',
          message: `Table ${table} exists and is accessible`,
          critical: true
        })
      } catch (error) {
        checks.push({
          name: `Table: ${table}`,
          status: 'fail',
          message: `Table ${table} is missing or inaccessible`,
          details: error instanceof Error ? error.message : 'Unknown error',
          critical: true
        })
      }
    }
    
    // Check for sample data
    try {
      const postCount = await env.DB.prepare('SELECT COUNT(*) as count FROM posts WHERE status = "published"').first()
      const count = (postCount as any)?.count || 0
      
      if (count > 0) {
        checks.push({
          name: 'Sample Content',
          status: 'pass',
          message: `Found ${count} published posts`,
          critical: false
        })
      } else {
        checks.push({
          name: 'Sample Content',
          status: 'warning',
          message: 'No published posts found - site will be empty',
          critical: false
        })
      }
    } catch (error) {
      checks.push({
        name: 'Sample Content',
        status: 'fail',
        message: 'Unable to check for published content',
        details: error instanceof Error ? error.message : 'Unknown error',
        critical: false
      })
    }
    
  } catch (error) {
    checks.push({
      name: 'Database Connectivity',
      status: 'fail',
      message: 'Unable to connect to database',
      details: error instanceof Error ? error.message : 'Unknown error',
      critical: true
    })
  }
}

// R2 storage connectivity check
async function checkR2Storage(env: Env, checks: DeploymentCheck[]): Promise<void> {
  try {
    // Test R2 connectivity with a simple operation
    const testKey = `deployment-test-${Date.now()}.txt`
    const testContent = 'Deployment readiness test'
    
    // Try to put and get a test file
    await env.IMAGES.put(testKey, testContent)
    const retrieved = await env.IMAGES.get(testKey)
    
    if (retrieved) {
      const content = await retrieved.text()
      
      if (content === testContent) {
        checks.push({
          name: 'R2 Storage Connectivity',
          status: 'pass',
          message: 'R2 bucket is accessible and functional',
          critical: true
        })
        
        // Clean up test file
        await env.IMAGES.delete(testKey)
      } else {
        checks.push({
          name: 'R2 Storage Connectivity',
          status: 'fail',
          message: 'R2 bucket connectivity failed - content mismatch',
          critical: true
        })
      }
    } else {
      checks.push({
        name: 'R2 Storage Connectivity',
        status: 'fail',
        message: 'R2 bucket is not accessible',
        critical: true
      })
    }
    
  } catch (error) {
    checks.push({
      name: 'R2 Storage Connectivity',
      status: 'fail',
      message: 'Unable to access R2 storage',
      details: error instanceof Error ? error.message : 'Unknown error',
      critical: true
    })
  }
}

// Template system validation
async function checkTemplateSystem(env: Env, checks: DeploymentCheck[]): Promise<void> {
  try {
    const { templateRenderer } = await import('../utils/template-renderer')
    
    // Check if templates are loaded
    const availableTemplates = templateRenderer.getAvailableTemplates()
    
    const requiredTemplates = ['PAGE_FRAME', 'SEO_META_TEMPLATE', 'HEADER', 'FOOTER', 'POST_NAVIGATION']
    const missingTemplates = requiredTemplates.filter(t => !availableTemplates.includes(t))
    
    if (missingTemplates.length === 0) {
      checks.push({
        name: 'Template System',
        status: 'pass',
        message: `All ${requiredTemplates.length} required templates are loaded`,
        critical: true
      })
    } else {
      checks.push({
        name: 'Template System',
        status: 'fail',
        message: `Missing required templates: ${missingTemplates.join(', ')}`,
        critical: true
      })
    }
    
    // Test template rendering with sample data
    try {
      const sampleVariables = {
        PAGE_TITLE: 'Deployment Test',
        META_DESCRIPTION: 'Test description',
        PAGE_URL: 'https://cruisemadeeasy.com/test/',
        CANONICAL_URL: 'https://cruisemadeeasy.com/test/',
        POST_CONTENT: '<p>Test content</p>',
        HERO_CONTENT: '<h1>Test</h1>',
        BLOG_CTA_CONTENT: '',
        POST_NAVIGATION_CONTENT: '',
        OG_TYPE: 'article',
        OG_TITLE: 'Test',
        OG_DESCRIPTION: 'Test',
        TWITTER_TITLE: 'Test',
        TWITTER_DESCRIPTION: 'Test',
        FEATURED_IMAGE_URL: '',
        FEATURED_IMAGE_THUMBNAIL: '',
        FEATURED_IMAGE_SOCIAL: '',
        FEATURED_IMAGE_ALT: '',
        FEATURED_IMAGE_WIDTH: '1200',
        FEATURED_IMAGE_HEIGHT: '630',
        IS_ARTICLE: true,
        HAS_FEATURED_IMAGE: false,
        HAS_TWITTER_IMAGE: false,
        TWITTER_IMAGE_URL: ''
      }
      
      const html = templateRenderer.renderPage(sampleVariables)
      
      if (html.includes('<!DOCTYPE html>') && html.includes('<title>Deployment Test</title>')) {
        checks.push({
          name: 'Template Rendering',
          status: 'pass',
          message: 'Template rendering is functional',
          critical: true
        })
      } else {
        checks.push({
          name: 'Template Rendering',
          status: 'fail',
          message: 'Template rendering produced invalid output',
          critical: true
        })
      }
      
    } catch (error) {
      checks.push({
        name: 'Template Rendering',
        status: 'fail',
        message: 'Template rendering failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        critical: true
      })
    }
    
  } catch (error) {
    checks.push({
      name: 'Template System',
      status: 'fail',
      message: 'Unable to load template system',
      details: error instanceof Error ? error.message : 'Unknown error',
      critical: true
    })
  }
}

// Environment variables validation
function checkEnvironmentVariables(env: Env, checks: DeploymentCheck[]): void {
  // Check if we're in production environment
  const isProduction = env.ENVIRONMENT === 'production'
  
  if (isProduction) {
    checks.push({
      name: 'Environment',
      status: 'pass',
      message: 'Running in production environment',
      critical: true
    })
  } else {
    checks.push({
      name: 'Environment',
      status: 'warning',
      message: `Running in ${env.ENVIRONMENT || 'unknown'} environment`,
      details: 'Ensure ENVIRONMENT=production for live deployment',
      critical: false
    })
  }
  
  // Check for required bindings
  if (env.DB) {
    checks.push({
      name: 'Database Binding',
      status: 'pass',
      message: 'Database binding is configured',
      critical: true
    })
  } else {
    checks.push({
      name: 'Database Binding',
      status: 'fail',
      message: 'Database binding is missing',
      details: 'Ensure D1 database is bound as "DB"',
      critical: true
    })
  }
  
  if (env.IMAGES) {
    checks.push({
      name: 'R2 Binding',
      status: 'pass',
      message: 'R2 bucket binding is configured',
      critical: true
    })
  } else {
    checks.push({
      name: 'R2 Binding',
      status: 'fail',
      message: 'R2 bucket binding is missing',
      details: 'Ensure R2 bucket is bound as "IMAGES"',
      critical: true
    })
  }
}

// Content integrity checks
async function checkContentIntegrity(env: Env, checks: DeploymentCheck[]): Promise<void> {
  try {
    // Check for orphaned content blocks
    const orphanedBlocks = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM content_blocks cb
      LEFT JOIN posts p ON cb.post_id = p.id
      WHERE p.id IS NULL
    `).first()
    
    const orphanCount = (orphanedBlocks as any)?.count || 0
    
    if (orphanCount === 0) {
      checks.push({
        name: 'Content Integrity',
        status: 'pass',
        message: 'No orphaned content blocks found',
        critical: false
      })
    } else {
      checks.push({
        name: 'Content Integrity',
        status: 'warning',
        message: `Found ${orphanCount} orphaned content blocks`,
        details: 'Consider cleaning up orphaned content blocks',
        critical: false
      })
    }
    
    // Check for missing featured images
    const postsWithMissingImages = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM posts p
      LEFT JOIN images i ON p.featured_image_id = i.id
      WHERE p.featured_image_id IS NOT NULL AND i.id IS NULL
    `).first()
    
    const missingImageCount = (postsWithMissingImages as any)?.count || 0
    
    if (missingImageCount === 0) {
      checks.push({
        name: 'Image References',
        status: 'pass',
        message: 'All image references are valid',
        critical: false
      })
    } else {
      checks.push({
        name: 'Image References',
        status: 'warning',
        message: `Found ${missingImageCount} posts with missing featured images`,
        critical: false
      })
    }
    
  } catch (error) {
    checks.push({
      name: 'Content Integrity',
      status: 'warning',
      message: 'Unable to check content integrity',
      details: error instanceof Error ? error.message : 'Unknown error',
      critical: false
    })
  }
}

// Performance baseline checks
async function checkPerformanceBaselines(env: Env, checks: DeploymentCheck[]): Promise<void> {
  try {
    // Test template rendering performance
    const start = performance.now()
    
    const { generateBlogListingVariables } = await import('../utils/template-variable-generator')
    const { templateRenderer } = await import('../utils/template-renderer')
    
    const variables = await generateBlogListingVariables()
    const html = templateRenderer.renderPage(variables)
    
    const renderTime = performance.now() - start
    
    if (renderTime < 100) {
      checks.push({
        name: 'Rendering Performance',
        status: 'pass',
        message: `Template rendering completed in ${renderTime.toFixed(2)}ms (excellent)`,
        critical: false
      })
    } else if (renderTime < 200) {
      checks.push({
        name: 'Rendering Performance',
        status: 'pass',
        message: `Template rendering completed in ${renderTime.toFixed(2)}ms (good)`,
        critical: false
      })
    } else if (renderTime < 500) {
      checks.push({
        name: 'Rendering Performance',
        status: 'warning',
        message: `Template rendering took ${renderTime.toFixed(2)}ms (acceptable)`,
        critical: false
      })
    } else {
      checks.push({
        name: 'Rendering Performance',
        status: 'warning',
        message: `Template rendering took ${renderTime.toFixed(2)}ms (slow)`,
        details: 'Consider optimizing template complexity',
        critical: false
      })
    }
    
  } catch (error) {
    checks.push({
      name: 'Rendering Performance',
      status: 'warning',
      message: 'Unable to test rendering performance',
      details: error instanceof Error ? error.message : 'Unknown error',
      critical: false
    })
  }
}

// Generate deployment report
export function generateDeploymentReport(readiness: DeploymentReadiness): string {
  const statusIcon = readiness.ready ? '✅' : '❌'
  const scoreColor = readiness.score >= 90 ? 'green' : readiness.score >= 70 ? 'orange' : 'red'
  
  let report = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Deployment Readiness Report</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; padding: 20px; border-radius: 8px; background: #f8f9fa; }
        .status-ready { color: #28a745; }
        .status-not-ready { color: #dc3545; }
        .score { font-size: 2em; font-weight: bold; color: ${scoreColor}; }
        .check-item { padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid; }
        .check-pass { border-color: #28a745; background: #d4edda; }
        .check-fail { border-color: #dc3545; background: #f8d7da; }
        .check-warning { border-color: #ffc107; background: #fff3cd; }
        .check-name { font-weight: bold; margin-bottom: 5px; }
        .check-message { margin-bottom: 5px; }
        .check-details { font-size: 0.9em; color: #666; font-style: italic; }
        .summary { background: #e9ecef; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .critical-badge { background: #dc3545; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.8em; }
        .timestamp { text-align: center; color: #666; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${statusIcon} Deployment Readiness Report</h1>
        <div class="score">${readiness.score}/100</div>
        <p class="${readiness.ready ? 'status-ready' : 'status-not-ready'}">
          ${readiness.ready ? 'Ready for Production' : 'Not Ready for Production'}
        </p>
      </div>
      
      <div class="summary">
        <h2>Summary</h2>
        <p><strong>Total Checks:</strong> ${readiness.checks.length}</p>
        <p><strong>Passed:</strong> ${readiness.checks.filter(c => c.status === 'pass').length}</p>
        <p><strong>Warnings:</strong> ${readiness.warnings}</p>
        <p><strong>Critical Failures:</strong> ${readiness.criticalFailures}</p>
      </div>
      
      <h2>Detailed Results</h2>
  `
  
  for (const check of readiness.checks) {
    const statusClass = `check-${check.status}`
    const criticalBadge = check.critical ? '<span class="critical-badge">CRITICAL</span>' : ''
    
    report += `
      <div class="check-item ${statusClass}">
        <div class="check-name">${check.name} ${criticalBadge}</div>
        <div class="check-message">${check.message}</div>
        ${check.details ? `<div class="check-details">${check.details}</div>` : ''}
      </div>
    `
  }
  
  report += `
      <div class="timestamp">
        Generated at: ${new Date(readiness.timestamp).toLocaleString()}
      </div>
    </body>
    </html>
  `
  
  return report
}