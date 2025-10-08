import { Hono } from 'hono'
import { Env } from '../../types/database'
import { templateRenderer } from '../../utils/template-renderer'
import { generatePostVariables, generateBlogListingVariables } from '../../utils/template-variable-generator'
import { performanceMonitor, addPerformanceHeaders } from '../../utils/performance-monitor'
import { edgeCaseHandler } from '../../utils/edge-case-handler'

const app = new Hono<{ Bindings: Env }>()

// Homepage route - render blog listing
app.get('/', async (c) => {
  const tracker = performanceMonitor.startTracking('/')

  try {
    console.log('🏠 Rendering homepage with template system')

    // Generate variables for homepage
    const variables = await generateBlogListingVariables(undefined, undefined, c.env)
    tracker.setVariableCount(Object.keys(variables).length)

    // Add body classes for WordPress compatibility
    const enhancedVariables = {
      ...variables,
      BODY_CLASSES: 'home blog wp-embed-responsive generatepress hfeed no-sidebar'
    }

    // Render complete HTML page
    tracker.incrementTemplateCount()
    const html = templateRenderer.renderPage(enhancedVariables)

    // Create response with performance headers
    const response = new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300, s-maxage=3600', // 5min browser, 1hr CDN
        'X-Rendered-By': 'CME-Template-Engine',
        'X-Template-Version': '1.0'
      }
    })

    return addPerformanceHeaders(response, tracker)

  } catch (error) {
    console.error('Homepage rendering error:', error)
    tracker.finish(false, error instanceof Error ? error.message : 'Unknown error')

    // Determine appropriate error response
    let statusCode = 500
    let errorContext = 'homepage'

    if (error instanceof Error) {
      if (error.message.includes('Database')) {
        statusCode = 503 // Service Unavailable
        errorContext = 'homepage-database'
      } else if (error.message.includes('Template')) {
        statusCode = 500 // Internal Server Error
        errorContext = 'homepage-template'
      }
    }

    // Return enhanced error page
    return new Response(templateRenderer.renderErrorPage(error as Error, errorContext), {
      status: statusCode,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate', // Don't cache errors
        'Retry-After': statusCode === 503 ? '60' : undefined // Retry after 1 minute for service unavailable
      }
    })
  }
})

// Category listing route
app.get('/category/:categorySlug', async (c) => {
  try {
    const categorySlug = c.req.param('categorySlug')
    console.log('📂 Rendering category page:', categorySlug)

    // Get category info from database
    const categoryResult = await c.env.DB.prepare(`
      SELECT name, slug FROM categories WHERE slug = ? LIMIT 1
    `).bind(categorySlug).first()

    if (!categoryResult) {
      // Return 404 for invalid category
      return new Response('Category not found', { status: 404 })
    }

    // Generate variables for category listing
    const variables = await generateBlogListingVariables(categorySlug, categoryResult.name as string, c.env)

    // Add body classes
    const enhancedVariables = {
      ...variables,
      BODY_CLASSES: `archive category category-${categorySlug} wp-embed-responsive generatepress hfeed no-sidebar`
    }

    // Render complete HTML page
    const html = templateRenderer.renderPage(enhancedVariables)

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300, s-maxage=3600',
        'X-Rendered-By': 'CME-Template-Engine',
        'X-Category': categorySlug
      }
    })

  } catch (error) {
    console.error('Category page rendering error:', error)
    return new Response(templateRenderer.renderErrorPage(error as Error, 'category page'), {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    })
  }
})

// Handle trailing slash redirects for post URLs
app.get('/:category/:slug/', async (c) => {
  const category = c.req.param('category')
  const slug = c.req.param('slug')
  // Redirect to canonical URL without trailing slash
  return c.redirect(`/${category}/${slug}`, 301)
})

// Individual post route
app.get('/:category/:slug', async (c) => {
  const category = c.req.param('category')
  const slug = c.req.param('slug')
  const tracker = performanceMonitor.startTracking(`/${category}/${slug}`)

  try {
    console.log('📄 Rendering post:', category, '/', slug)

    // Get post data with content from JSON field (no content_blocks JOIN)
    tracker.startDbQuery()
    const postResult = await c.env.DB.prepare(`
      SELECT
        p.id, p.title, p.slug, p.excerpt, p.featured_image_url,
        p.published_date, p.updated_at, p.meta_description, p.author_id,
        p.category, p.content,
        u.name as author_name
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.category = ? AND p.slug = ? AND p.status = 'published'
      LIMIT 1
    `).bind(category, slug).first()
    tracker.endDbQuery()

    if (!postResult) {
      tracker.finish(false, 'Post not found')
      const edgeCase = edgeCaseHandler.handleMissingPost(category, slug, c.env)
      return edgeCase.response!
    }

    // Parse content blocks from JSON field with edge case handling
    let contentBlocks = []
    try {
      if (postResult.content) {
        const contentData = JSON.parse(postResult.content as string)
        // Support both {"blocks": [...]} and direct [...] formats
        contentBlocks = Array.isArray(contentData) ? contentData : (contentData.blocks || [])
      }
    } catch (parseError) {
      console.error('Error parsing content JSON:', parseError)
      contentBlocks = []
    }

    // Handle corrupted content blocks
    const blockEdgeCase = edgeCaseHandler.handleCorruptedContentBlocks(contentBlocks)
    if (blockEdgeCase.handled) {
      contentBlocks = blockEdgeCase.fallbackData
    }

    tracker.setContentBlockCount(contentBlocks.length)

    // Create post data object
    const postData = {
      id: String(postResult.id),
      title: postResult.title as string,
      slug: postResult.slug as string,
      excerpt: postResult.excerpt as string || '',
      content_blocks: contentBlocks,
      category: postResult.category as string,
      featured_image_id: postResult.featured_image_url as string,
      published_date: postResult.published_date as string,
      updated_at: postResult.updated_at as string,
      meta_description: postResult.meta_description as string,
      author_name: postResult.author_name as string
    }

    // Generate comprehensive template variables
    if (postData.featured_image_id) {
      tracker.startImageProcessing()
    }

    const variables = await generatePostVariables(postData, c.env)

    if (postData.featured_image_id) {
      tracker.endImageProcessing()
    }

    tracker.setVariableCount(Object.keys(variables).length)

    // Add body classes for WordPress compatibility
    const enhancedVariables = {
      ...variables,
      BODY_CLASSES: `single single-post postid-${postData.id} single-format-standard wp-embed-responsive generatepress hfeed no-sidebar`
    }

    // Render complete HTML page
    tracker.incrementTemplateCount()
    const html = templateRenderer.renderPage(enhancedVariables)

    const response = new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=600, s-maxage=7200', // 10min browser, 2hr CDN
        'X-Rendered-By': 'CME-Template-Engine',
        'X-Post-ID': postData.id,
        'X-Category': category
      }
    })

    return addPerformanceHeaders(response, tracker)

  } catch (error) {
    console.error('Post rendering error:', error)
    tracker.finish(false, error instanceof Error ? error.message : 'Unknown error')

    return new Response(templateRenderer.renderErrorPage(error as Error, 'post page'), {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    })
  }
})

// Health check endpoint for template system
app.get('/api/template/health', async (c) => {
  try {
    const availableTemplates = templateRenderer.getAvailableTemplates()

    return c.json({
      success: true,
      message: 'Template system healthy',
      data: {
        templates: availableTemplates.length,
        templateNames: availableTemplates,
        renderingEngine: 'CME-Template-Engine-v1.0'
      }
    })
  } catch (error) {
    console.error('Template health check error:', error)
    return c.json({
      success: false,
      error: 'Template system error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

export default app
