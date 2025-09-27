import { Hono } from 'hono'
import { Env } from '../../types/database'
import { generatePostVariables, generateBlogListingVariables } from '../../utils/template-variable-generator'
import { validateSEOMetadata, generateSEOReport, quickSEOCheck } from '../../utils/seo-validator'

const app = new Hono<{ Bindings: Env }>()

// SEO validation endpoint for individual posts
app.get('/post/:category/:slug', async (c) => {
  try {
    const category = c.req.param('category')
    const slug = c.req.param('slug')
    
    // Get post data
    const postResult = await c.env.DB.prepare(`
      SELECT 
        p.id, p.title, p.slug, p.excerpt, p.category, p.featured_image_id,
        p.published_date, p.updated_at, p.meta_description, p.author_name,
        GROUP_CONCAT(
          json_object(
            'id', cb.id,
            'block_type', cb.block_type,
            'content', cb.content,
            'block_order', cb.block_order
          )
        ) as content_blocks_json
      FROM posts p
      LEFT JOIN content_blocks cb ON p.id = cb.post_id
      WHERE p.category = ? AND p.slug = ? AND p.status = 'published'
      GROUP BY p.id
      LIMIT 1
    `).bind(category, slug).first()
    
    if (!postResult) {
      return c.json({ error: 'Post not found' }, 404)
    }
    
    // Parse content blocks
    const contentBlocks = postResult.content_blocks_json
      ? JSON.parse(`[${(postResult.content_blocks_json as string).replace(/},{/g, '},{')}]`)
        .filter((block: any) => block.id !== null)
      : []
    
    const postData = {
      id: String(postResult.id),
      title: postResult.title as string,
      slug: postResult.slug as string,
      excerpt: postResult.excerpt as string || '',
      content_blocks: contentBlocks,
      category: postResult.category as string,
      featured_image_id: postResult.featured_image_id as string,
      published_date: postResult.published_date as string,
      updated_at: postResult.updated_at as string,
      meta_description: postResult.meta_description as string,
      author_name: postResult.author_name as string
    }
    
    // Generate template variables
    const variables = await generatePostVariables(postData, c.env)
    
    // Validate SEO
    const validation = validateSEOMetadata(variables)
    
    // Check format query parameter
    const format = c.req.query('format') || 'json'
    
    if (format === 'html') {
      const report = generateSEOReport(validation)
      return c.html(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>SEO Report: ${postData.title}</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            .seo-report { background: #f9f9f9; padding: 20px; border-radius: 8px; }
            .seo-score { text-align: center; margin-bottom: 30px; }
            .score-bar { width: 100%; height: 20px; background: #e0e0e0; border-radius: 10px; overflow: hidden; }
            .score-fill { height: 100%; transition: width 0.3s ease; }
            .score-excellent .score-fill { background: #4caf50; }
            .score-good .score-fill { background: #8bc34a; }
            .score-fair .score-fill { background: #ff9800; }
            .score-poor .score-fill { background: #f44336; }
            .score-critical .score-fill { background: #b71c1c; }
            .seo-errors { background: #ffebee; border: 1px solid #f44336; border-radius: 4px; padding: 15px; margin: 15px 0; }
            .seo-warnings { background: #fff3e0; border: 1px solid #ff9800; border-radius: 4px; padding: 15px; margin: 15px 0; }
            .seo-recommendations { background: #e8f5e8; border: 1px solid #4caf50; border-radius: 4px; padding: 15px; margin: 15px 0; }
            .priority-high { color: #d32f2f; }
            .priority-medium { color: #f57c00; }
            .priority-low { color: #388e3c; }
            ul { list-style-type: none; padding: 0; }
            li { margin: 10px 0; padding: 8px; border-left: 3px solid #ccc; background: white; }
          </style>
        </head>
        <body>
          <h1>SEO Report: ${postData.title}</h1>
          <p><strong>URL:</strong> /${category}/${slug}/</p>
          ${report}
          <div style="margin-top: 30px;">
            <a href="/api/seo/post/${category}/${slug}?format=json">View JSON Report</a> |
            <a href="/${category}/${slug}/">View Live Page</a>
          </div>
        </body>
        </html>
      `)
    }
    
    return c.json({
      success: true,
      post: {
        title: postData.title,
        category,
        slug,
        url: `/${category}/${slug}/`
      },
      seo: validation,
      quickCheck: quickSEOCheck(variables)
    })
    
  } catch (error) {
    console.error('SEO validation error:', error)
    return c.json({
      success: false,
      error: 'Failed to validate SEO',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// SEO validation endpoint for category pages
app.get('/category/:slug', async (c) => {
  try {
    const categorySlug = c.req.param('slug')
    
    // Get category info
    const categoryResult = await c.env.DB.prepare(`
      SELECT name, slug FROM categories WHERE slug = ? LIMIT 1
    `).bind(categorySlug).first()
    
    if (!categoryResult) {
      return c.json({ error: 'Category not found' }, 404)
    }
    
    // Generate template variables for category page
    const variables = await generateBlogListingVariables(categorySlug, categoryResult.name as string)
    
    // Validate SEO
    const validation = validateSEOMetadata(variables)
    
    const format = c.req.query('format') || 'json'
    
    if (format === 'html') {
      const report = generateSEOReport(validation)
      return c.html(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>SEO Report: ${categoryResult.name} Category</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            .seo-report { background: #f9f9f9; padding: 20px; border-radius: 8px; }
            .seo-score { text-align: center; margin-bottom: 30px; }
            .score-bar { width: 100%; height: 20px; background: #e0e0e0; border-radius: 10px; overflow: hidden; }
            .score-fill { height: 100%; transition: width 0.3s ease; }
            .score-excellent .score-fill { background: #4caf50; }
            .score-good .score-fill { background: #8bc34a; }
            .score-fair .score-fill { background: #ff9800; }
            .score-poor .score-fill { background: #f44336; }
            .score-critical .score-fill { background: #b71c1c; }
            .seo-errors { background: #ffebee; border: 1px solid #f44336; border-radius: 4px; padding: 15px; margin: 15px 0; }
            .seo-warnings { background: #fff3e0; border: 1px solid #ff9800; border-radius: 4px; padding: 15px; margin: 15px 0; }
            .seo-recommendations { background: #e8f5e8; border: 1px solid #4caf50; border-radius: 4px; padding: 15px; margin: 15px 0; }
            .priority-high { color: #d32f2f; }
            .priority-medium { color: #f57c00; }
            .priority-low { color: #388e3c; }
            ul { list-style-type: none; padding: 0; }
            li { margin: 10px 0; padding: 8px; border-left: 3px solid #ccc; background: white; }
          </style>
        </head>
        <body>
          <h1>SEO Report: ${categoryResult.name} Category</h1>
          <p><strong>URL:</strong> /category/${categorySlug}/</p>
          ${report}
          <div style="margin-top: 30px;">
            <a href="/api/seo/category/${categorySlug}?format=json">View JSON Report</a> |
            <a href="/category/${categorySlug}/">View Live Page</a>
          </div>
        </body>
        </html>
      `)
    }
    
    return c.json({
      success: true,
      category: {
        name: categoryResult.name,
        slug: categorySlug,
        url: `/category/${categorySlug}/`
      },
      seo: validation,
      quickCheck: quickSEOCheck(variables)
    })
    
  } catch (error) {
    console.error('Category SEO validation error:', error)
    return c.json({
      success: false,
      error: 'Failed to validate category SEO',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// SEO validation endpoint for homepage
app.get('/homepage', async (c) => {
  try {
    // Generate template variables for homepage
    const variables = await generateBlogListingVariables()
    
    // Validate SEO
    const validation = validateSEOMetadata(variables)
    
    const format = c.req.query('format') || 'json'
    
    if (format === 'html') {
      const report = generateSEOReport(validation)
      return c.html(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>SEO Report: Homepage</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            .seo-report { background: #f9f9f9; padding: 20px; border-radius: 8px; }
            .seo-score { text-align: center; margin-bottom: 30px; }
            .score-bar { width: 100%; height: 20px; background: #e0e0e0; border-radius: 10px; overflow: hidden; }
            .score-fill { height: 100%; transition: width 0.3s ease; }
            .score-excellent .score-fill { background: #4caf50; }
            .score-good .score-fill { background: #8bc34a; }
            .score-fair .score-fill { background: #ff9800; }
            .score-poor .score-fill { background: #f44336; }
            .score-critical .score-fill { background: #b71c1c; }
            .seo-errors { background: #ffebee; border: 1px solid #f44336; border-radius: 4px; padding: 15px; margin: 15px 0; }
            .seo-warnings { background: #fff3e0; border: 1px solid #ff9800; border-radius: 4px; padding: 15px; margin: 15px 0; }
            .seo-recommendations { background: #e8f5e8; border: 1px solid #4caf50; border-radius: 4px; padding: 15px; margin: 15px 0; }
            .priority-high { color: #d32f2f; }
            .priority-medium { color: #f57c00; }
            .priority-low { color: #388e3c; }
            ul { list-style-type: none; padding: 0; }
            li { margin: 10px 0; padding: 8px; border-left: 3px solid #ccc; background: white; }
          </style>
        </head>
        <body>
          <h1>SEO Report: Homepage</h1>
          <p><strong>URL:</strong> /</p>
          ${report}
          <div style="margin-top: 30px;">
            <a href="/api/seo/homepage?format=json">View JSON Report</a> |
            <a href="/">View Live Page</a>
          </div>
        </body>
        </html>
      `)
    }
    
    return c.json({
      success: true,
      page: {
        title: 'Homepage',
        url: '/'
      },
      seo: validation,
      quickCheck: quickSEOCheck(variables)
    })
    
  } catch (error) {
    console.error('Homepage SEO validation error:', error)
    return c.json({
      success: false,
      error: 'Failed to validate homepage SEO',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// Bulk SEO analysis endpoint
app.get('/bulk', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '10')
    const category = c.req.query('category')
    
    let postsQuery = `
      SELECT id, title, slug, category, meta_description, featured_image_id, published_date, updated_at
      FROM posts 
      WHERE status = 'published'
    `
    const params: any[] = []
    
    if (category) {
      postsQuery += ' AND category = ?'
      params.push(category)
    }
    
    postsQuery += ' ORDER BY published_date DESC LIMIT ?'
    params.push(limit)
    
    const postsResult = await c.env.DB.prepare(postsQuery).bind(...params).all()
    
    const results = []
    
    for (const post of (postsResult.results || [])) {
      const postData = {
        id: String(post.id),
        title: post.title as string,
        slug: post.slug as string,
        excerpt: '',
        content_blocks: [],
        category: post.category as string,
        featured_image_id: post.featured_image_id as string,
        published_date: post.published_date as string,
        updated_at: post.updated_at as string,
        meta_description: post.meta_description as string,
        author_name: 'Cruise Made EASY'
      }
      
      try {
        const variables = await generatePostVariables(postData, c.env)
        const validation = validateSEOMetadata(variables)
        
        results.push({
          post: {
            title: postData.title,
            category: postData.category,
            slug: postData.slug,
            url: `/${postData.category}/${postData.slug}/`
          },
          seo: {
            score: validation.score,
            isValid: validation.isValid,
            errorCount: validation.errors.length,
            warningCount: validation.warnings.length,
            recommendationCount: validation.recommendations.length
          }
        })
      } catch (error) {
        console.error(`Error validating post ${post.slug}:`, error)
        results.push({
          post: {
            title: postData.title,
            category: postData.category,
            slug: postData.slug,
            url: `/${postData.category}/${postData.slug}/`
          },
          seo: {
            score: 0,
            isValid: false,
            errorCount: 1,
            warningCount: 0,
            recommendationCount: 0,
            error: 'Validation failed'
          }
        })
      }
    }
    
    // Calculate summary stats
    const validPosts = results.filter(r => r.seo.isValid).length
    const averageScore = results.reduce((sum, r) => sum + r.seo.score, 0) / results.length
    const totalErrors = results.reduce((sum, r) => sum + r.seo.errorCount, 0)
    const totalWarnings = results.reduce((sum, r) => sum + r.seo.warningCount, 0)
    
    return c.json({
      success: true,
      summary: {
        totalPosts: results.length,
        validPosts,
        averageScore: Math.round(averageScore),
        totalErrors,
        totalWarnings
      },
      posts: results
    })
    
  } catch (error) {
    console.error('Bulk SEO analysis error:', error)
    return c.json({
      success: false,
      error: 'Failed to perform bulk SEO analysis',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

export default app