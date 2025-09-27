import { TemplateVariables } from '../types/template-variables'

export interface SEOValidationResult {
  isValid: boolean
  score: number  // 0-100
  errors: SEOError[]
  warnings: SEOWarning[]
  recommendations: SEORecommendation[]
}

export interface SEOError {
  type: 'title' | 'description' | 'image' | 'schema' | 'breadcrumb' | 'canonical'
  message: string
  field?: string
}

export interface SEOWarning {
  type: 'length' | 'quality' | 'performance' | 'accessibility'
  message: string
  field?: string
}

export interface SEORecommendation {
  type: 'content' | 'technical' | 'performance'
  message: string
  priority: 'high' | 'medium' | 'low'
}

// Comprehensive SEO validation for template variables
export function validateSEOMetadata(variables: TemplateVariables): SEOValidationResult {
  const errors: SEOError[] = []
  const warnings: SEOWarning[] = []
  const recommendations: SEORecommendation[] = []
  
  // 1. Title validation
  validateTitle(variables, errors, warnings, recommendations)
  
  // 2. Meta description validation
  validateMetaDescription(variables, errors, warnings, recommendations)
  
  // 3. Image validation
  validateFeaturedImage(variables, errors, warnings, recommendations)
  
  // 4. URL and canonical validation
  validateUrls(variables, errors, warnings, recommendations)
  
  // 5. Schema.org validation
  validateSchema(variables, errors, warnings, recommendations)
  
  // 6. Breadcrumb validation
  validateBreadcrumbs(variables, errors, warnings, recommendations)
  
  // 7. Social media validation
  validateSocialMedia(variables, errors, warnings, recommendations)
  
  // 8. Date validation
  validateDates(variables, errors, warnings, recommendations)
  
  // Calculate score
  const score = calculateSEOScore(errors, warnings, recommendations)
  
  return {
    isValid: errors.length === 0,
    score,
    errors,
    warnings,
    recommendations
  }
}

// Title validation
function validateTitle(variables: TemplateVariables, errors: SEOError[], warnings: SEOWarning[], recommendations: SEORecommendation[]) {
  if (!variables.PAGE_TITLE) {
    errors.push({
      type: 'title',
      message: 'Page title is required',
      field: 'PAGE_TITLE'
    })
    return
  }
  
  const titleLength = variables.PAGE_TITLE.length
  
  if (titleLength < 30) {
    warnings.push({
      type: 'length',
      message: 'Title is too short (under 30 characters)',
      field: 'PAGE_TITLE'
    })
  } else if (titleLength > 60) {
    warnings.push({
      type: 'length',
      message: 'Title may be truncated in search results (over 60 characters)',
      field: 'PAGE_TITLE'
    })
  }
  
  if (!variables.PAGE_TITLE.includes('Cruise Made Easy')) {
    recommendations.push({
      type: 'content',
      message: 'Consider including brand name "Cruise Made Easy" in title',
      priority: 'medium'
    })
  }
}

// Meta description validation
function validateMetaDescription(variables: TemplateVariables, errors: SEOError[], warnings: SEOWarning[], recommendations: SEORecommendation[]) {
  if (!variables.META_DESCRIPTION) {
    errors.push({
      type: 'description',
      message: 'Meta description is required',
      field: 'META_DESCRIPTION'
    })
    return
  }
  
  const descLength = variables.META_DESCRIPTION.length
  
  if (descLength < 120) {
    warnings.push({
      type: 'length',
      message: 'Meta description is too short (under 120 characters)',
      field: 'META_DESCRIPTION'
    })
  } else if (descLength > 160) {
    warnings.push({
      type: 'length',
      message: 'Meta description may be truncated (over 160 characters)',
      field: 'META_DESCRIPTION'
    })
  }
  
  // Check for cruise-related keywords
  const cruiseKeywords = ['cruise', 'norwegian', 'ncl', 'sailing']
  const hasKeywords = cruiseKeywords.some(keyword => 
    variables.META_DESCRIPTION.toLowerCase().includes(keyword)
  )
  
  if (!hasKeywords) {
    recommendations.push({
      type: 'content',
      message: 'Consider including cruise-related keywords in meta description',
      priority: 'medium'
    })
  }
}

// Featured image validation
function validateFeaturedImage(variables: TemplateVariables, errors: SEOError[], warnings: SEOWarning[], recommendations: SEORecommendation[]) {
  if (variables.IS_ARTICLE && !variables.FEATURED_IMAGE_URL) {
    warnings.push({
      type: 'quality',
      message: 'Articles should have a featured image',
      field: 'FEATURED_IMAGE_URL'
    })
  }
  
  if (variables.FEATURED_IMAGE_URL) {
    if (!variables.FEATURED_IMAGE_ALT) {
      errors.push({
        type: 'image',
        message: 'Featured image alt text is required',
        field: 'FEATURED_IMAGE_ALT'
      })
    }
    
    // Check image dimensions
    const width = parseInt(variables.FEATURED_IMAGE_WIDTH || '0')
    const height = parseInt(variables.FEATURED_IMAGE_HEIGHT || '0')
    
    if (width < 1200 || height < 630) {
      warnings.push({
        type: 'quality',
        message: 'Featured image should be at least 1200x630 for optimal social sharing',
        field: 'FEATURED_IMAGE_URL'
      })
    }
    
    // Check for WebP support
    if (!variables.FEATURED_IMAGE_WEBP) {
      recommendations.push({
        type: 'performance',
        message: 'Consider adding WebP image variants for better performance',
        priority: 'low'
      })
    }
  }
}

// URL validation
function validateUrls(variables: TemplateVariables, errors: SEOError[], warnings: SEOWarning[], recommendations: SEORecommendation[]) {
  if (!variables.PAGE_URL) {
    errors.push({
      type: 'canonical',
      message: 'Page URL is required',
      field: 'PAGE_URL'
    })
  } else {
    if (!variables.PAGE_URL.startsWith('https://')) {
      errors.push({
        type: 'canonical',
        message: 'Page URL must use HTTPS',
        field: 'PAGE_URL'
      })
    }
  }
  
  if (!variables.CANONICAL_URL) {
    errors.push({
      type: 'canonical',
      message: 'Canonical URL is required',
      field: 'CANONICAL_URL'
    })
  }
}

// Schema.org validation
function validateSchema(variables: TemplateVariables, errors: SEOError[], warnings: SEOWarning[], recommendations: SEORecommendation[]) {
  if (variables.IS_ARTICLE && !variables.SCHEMA_JSON) {
    warnings.push({
      type: 'quality',
      message: 'Articles should have Schema.org structured data',
      field: 'SCHEMA_JSON'
    })
  }
  
  if (variables.SCHEMA_JSON) {
    try {
      const schema = JSON.parse(variables.SCHEMA_JSON)
      
      // Validate required BlogPosting fields
      if (schema['@type'] === 'BlogPosting') {
        const requiredFields = ['headline', 'datePublished', 'author', 'publisher']
        
        for (const field of requiredFields) {
          if (!schema[field]) {
            warnings.push({
              type: 'quality',
              message: `Schema.org BlogPosting missing required field: ${field}`,
              field: 'SCHEMA_JSON'
            })
          }
        }
      }
    } catch (error) {
      errors.push({
        type: 'schema',
        message: 'Schema.org JSON is invalid',
        field: 'SCHEMA_JSON'
      })
    }
  }
}

// Breadcrumb validation
function validateBreadcrumbs(variables: TemplateVariables, errors: SEOError[], warnings: SEOWarning[], recommendations: SEORecommendation[]) {
  if (variables.IS_ARTICLE && !variables.HAS_BREADCRUMBS) {
    recommendations.push({
      type: 'content',
      message: 'Consider adding breadcrumbs for better navigation and SEO',
      priority: 'medium'
    })
  }
  
  if (variables.HAS_BREADCRUMBS && variables.BREADCRUMBS_JSON) {
    try {
      const breadcrumbs = JSON.parse(variables.BREADCRUMBS_JSON)
      
      if (!breadcrumbs.itemListElement || breadcrumbs.itemListElement.length < 2) {
        warnings.push({
          type: 'quality',
          message: 'Breadcrumbs should have at least 2 items',
          field: 'BREADCRUMBS_JSON'
        })
      }
    } catch (error) {
      errors.push({
        type: 'breadcrumb',
        message: 'Breadcrumbs JSON is invalid',
        field: 'BREADCRUMBS_JSON'
      })
    }
  }
}

// Social media validation
function validateSocialMedia(variables: TemplateVariables, errors: SEOError[], warnings: SEOWarning[], recommendations: SEORecommendation[]) {
  // Open Graph validation
  if (!variables.OG_TITLE) {
    warnings.push({
      type: 'quality',
      message: 'Open Graph title is recommended',
      field: 'OG_TITLE'
    })
  }
  
  if (!variables.OG_DESCRIPTION) {
    warnings.push({
      type: 'quality',
      message: 'Open Graph description is recommended',
      field: 'OG_DESCRIPTION'
    })
  }
  
  // Twitter Card validation
  if (!variables.TWITTER_TITLE) {
    warnings.push({
      type: 'quality',
      message: 'Twitter title is recommended',
      field: 'TWITTER_TITLE'
    })
  }
  
  if (!variables.TWITTER_DESCRIPTION) {
    warnings.push({
      type: 'quality',
      message: 'Twitter description is recommended',
      field: 'TWITTER_DESCRIPTION'
    })
  }
  
  if (variables.FEATURED_IMAGE_URL && !variables.TWITTER_IMAGE_URL) {
    recommendations.push({
      type: 'content',
      message: 'Consider adding Twitter image for better social sharing',
      priority: 'low'
    })
  }
}

// Date validation
function validateDates(variables: TemplateVariables, errors: SEOError[], warnings: SEOWarning[], recommendations: SEORecommendation[]) {
  if (variables.IS_ARTICLE) {
    if (!variables.PUBLISHED_DATE_ISO) {
      warnings.push({
        type: 'quality',
        message: 'Published date in ISO format is recommended for articles',
        field: 'PUBLISHED_DATE_ISO'
      })
    }
    
    if (!variables.MODIFIED_DATE_ISO) {
      warnings.push({
        type: 'quality',
        message: 'Modified date in ISO format is recommended for articles',
        field: 'MODIFIED_DATE_ISO'
      })
    }
  }
}

// Calculate SEO score (0-100)
function calculateSEOScore(errors: SEOError[], warnings: SEOWarning[], recommendations: SEORecommendation[]): number {
  let score = 100
  
  // Deduct points for errors (critical issues)
  score -= errors.length * 15
  
  // Deduct points for warnings (important issues)
  score -= warnings.length * 5
  
  // Minor deduction for missing recommendations
  score -= recommendations.length * 2
  
  return Math.max(0, score)
}

// Generate SEO report as HTML
export function generateSEOReport(validation: SEOValidationResult): string {
  const { score, errors, warnings, recommendations } = validation
  
  let report = `
    <div class="seo-report">
      <h2>SEO Validation Report</h2>
      <div class="seo-score score-${getScoreClass(score)}">
        <h3>Overall Score: ${score}/100</h3>
        <div class="score-bar">
          <div class="score-fill" style="width: ${score}%"></div>
        </div>
      </div>
  `
  
  if (errors.length > 0) {
    report += '<div class="seo-errors"><h4>Critical Issues (Must Fix)</h4><ul>'
    errors.forEach(error => {
      report += `<li><strong>${error.type}:</strong> ${error.message}</li>`
    })
    report += '</ul></div>'
  }
  
  if (warnings.length > 0) {
    report += '<div class="seo-warnings"><h4>Important Issues (Should Fix)</h4><ul>'
    warnings.forEach(warning => {
      report += `<li><strong>${warning.type}:</strong> ${warning.message}</li>`
    })
    report += '</ul></div>'
  }
  
  if (recommendations.length > 0) {
    report += '<div class="seo-recommendations"><h4>Recommendations</h4><ul>'
    recommendations.forEach(rec => {
      report += `<li class="priority-${rec.priority}"><strong>${rec.type}:</strong> ${rec.message}</li>`
    })
    report += '</ul></div>'
  }
  
  report += '</div>'
  
  return report
}

function getScoreClass(score: number): string {
  if (score >= 90) return 'excellent'
  if (score >= 80) return 'good'  
  if (score >= 70) return 'fair'
  if (score >= 60) return 'poor'
  return 'critical'
}

// Quick SEO check for debugging
export function quickSEOCheck(variables: TemplateVariables): string {
  const validation = validateSEOMetadata(variables)
  
  let summary = `SEO Score: ${validation.score}/100\n`
  
  if (validation.errors.length > 0) {
    summary += `❌ ${validation.errors.length} critical errors\n`
  }
  
  if (validation.warnings.length > 0) {
    summary += `⚠️  ${validation.warnings.length} warnings\n`
  }
  
  if (validation.recommendations.length > 0) {
    summary += `💡 ${validation.recommendations.length} recommendations\n`
  }
  
  return summary
}