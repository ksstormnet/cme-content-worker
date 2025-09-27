import { TemplateVariables, TemplateValidation, REQUIRED_TEMPLATE_VARIABLES } from '../types/template-variables'
import { COMPILED_TEMPLATES } from './compiled-templates'

// Template rendering with validation and optimization
export class TemplateRenderer {
  private static instance: TemplateRenderer
  private compiledTemplates: Record<string, string> = {}
  
  constructor() {
    // Initialize with pre-compiled templates
    this.compiledTemplates = COMPILED_TEMPLATES
    console.log('✅ Template renderer initialized with', Object.keys(this.compiledTemplates).length, 'templates')
  }
  
  static getInstance(): TemplateRenderer {
    if (!TemplateRenderer.instance) {
      TemplateRenderer.instance = new TemplateRenderer()
    }
    return TemplateRenderer.instance
  }
  
  // Initialize with compiled templates (backwards compatibility)
  initializeTemplates(templates: Record<string, string>): void {
    this.compiledTemplates = { ...this.compiledTemplates, ...templates }
  }
  
  // Render complete page with validation
  renderPage(variables: TemplateVariables): string {
    try {
      // Validate required variables
      const validation = this.validateVariables(variables)
      if (!validation.isValid) {
        throw new Error(`Missing required variables: ${validation.missingRequired.join(', ')}`)
      }
      
      // 1. Render SEO metadata with variables
      const seoMeta = this.renderTemplate('SEO_META_TEMPLATE', variables)
      
      // 2. Load static components (header, footer)
      const header = this.getTemplate('HEADER')
      const footer = this.getTemplate('FOOTER')
      
      // 3. Assemble complete page variables
      const pageVariables = {
        ...variables,
        SEO_META_CONTENT: seoMeta,
        HEADER_CONTENT: header,
        FOOTER_CONTENT: footer
      }
      
      // 4. Render final page
      const html = this.renderTemplate('PAGE_FRAME', pageVariables)
      
      // 5. Validate output
      this.validateOutput(html)
      
      return html
      
    } catch (error) {
      console.error('Template rendering error:', error)
      return this.renderErrorPage(error, 'page rendering')
    }
  }
  
  // Safe template rendering with variable substitution and conditionals
  private renderTemplate(templateName: string, variables: Record<string, any>): string {
    let template = this.getTemplate(templateName)
    
    // Process conditional blocks first ({{#CONDITION}}...{{/CONDITION}})
    template = this.processConditionals(template, variables)
    
    // Then process regular variables
    return template.replace(/\{\{([\w_]+)\}\}/g, (match, key) => {
      const value = variables[key]
      
      if (value === undefined || value === null) {
        console.warn(`Missing template variable: ${key} in ${templateName}`)
        return '' // Return empty string for missing variables
      }
      
      // Ensure value is string and escape if needed
      return String(value)
    })
  }

  // Process conditional template blocks
  private processConditionals(template: string, variables: Record<string, any>): string {
    // Process {{#CONDITION}}content{{/CONDITION}} blocks
    const conditionalRegex = /\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g
    
    return template.replace(conditionalRegex, (match, condition, content) => {
      const conditionValue = variables[condition]
      
      // Show content if condition is truthy
      if (conditionValue) {
        return content
      }
      
      return '' // Hide content if condition is falsy
    })
  }
  
  // Get compiled template with validation
  private getTemplate(templateName: string): string {
    const template = this.compiledTemplates[templateName]
    
    if (!template) {
      throw new Error(`Template not found: ${templateName}. Available templates: ${Object.keys(this.compiledTemplates).join(', ')}`)
    }
    
    return template
  }
  
  // Validate required variables are present
  validateVariables(variables: TemplateVariables): TemplateValidation {
    const missingRequired: string[] = []
    const warnings: string[] = []
    
    for (const field of REQUIRED_TEMPLATE_VARIABLES) {
      if (!variables[field]) {
        missingRequired.push(field)
      }
    }
    
    // Check for optional but recommended fields
    if (!variables.FEATURED_IMAGE_URL && variables.IS_ARTICLE) {
      warnings.push('Featured image recommended for articles')
    }
    
    if (!variables.SCHEMA_JSON) {
      warnings.push('Schema.org JSON-LD recommended for SEO')
    }
    
    return {
      isValid: missingRequired.length === 0,
      missingRequired,
      warnings
    }
  }
  
  // Validate rendered HTML output
  private validateOutput(html: string): void {
    // Basic HTML validation
    if (!html.includes('<!DOCTYPE html>')) {
      throw new Error('Invalid HTML: Missing DOCTYPE')
    }
    
    if (!html.includes('<title>')) {
      throw new Error('Invalid HTML: Missing title tag')
    }
    
    if (html.length < 1000) {
      console.warn('HTML output seems too short:', html.length, 'characters')
    }
    
    // Check for unresolved template variables
    const unresolvedVars = html.match(/\{\{[\w_]+\}\}/g)
    if (unresolvedVars && unresolvedVars.length > 0) {
      console.warn('Unresolved template variables found:', unresolvedVars)
    }
  }
  
  // Error page rendering
  private renderErrorPage(error: Error, context: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page Unavailable - Cruise Made Easy</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; text-align: center; }
    .error { color: #666; margin: 20px 0; }
  </style>
</head>
<body>
  <h1>Page Temporarily Unavailable</h1>
  <p class="error">We're having trouble loading this page. Please try again in a few moments.</p>
  <p><a href="/">← Return to Homepage</a></p>
  <!-- Error: ${error.message} in ${context} -->
</body>
</html>`
  }
  
  // Get available template names
  getAvailableTemplates(): string[] {
    return Object.keys(this.compiledTemplates)
  }
}

// Export singleton instance
export const templateRenderer = TemplateRenderer.getInstance()