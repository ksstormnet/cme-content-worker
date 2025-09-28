// Build-time template compiler
import fs from 'fs'
import path from 'path'
import minifyHtml from 'html-minifier-terser'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const TEMPLATE_DIR = path.join(__dirname, '../src/templates')
const OUTPUT_FILE = path.join(__dirname, '../src/utils/compiled-templates.ts')

// HTML minification options
const minifyOptions = {
  collapseWhitespace: true,
  removeComments: true,
  removeEmptyAttributes: true,
  removeRedundantAttributes: true,
  useShortDoctype: true,
  minifyCSS: false, // Keep CSS references intact
  minifyJS: false   // Keep any inline JS intact
}

async function compileTemplates() {
  console.log('🔄 Compiling templates...')
  
  const templates = {}
  const templateFiles = [
    'page-frame.html',
    'seo-meta-template.html', 
    'header.html',
    'hero.html',
    'blog-cta.html',
    'post-navigation.html',
    'footer.html'
  ]
  
  for (const file of templateFiles) {
    const filePath = path.join(TEMPLATE_DIR, file)
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`Template file not found: ${file}`)
    }
    
    const content = fs.readFileSync(filePath, 'utf8')
    const minified = await minifyHtml.minify(content, minifyOptions)
    const key = file.replace('.html', '').replace(/-/g, '_').toUpperCase()
    
    templates[key] = minified
    console.log(`✅ Compiled ${file} (${content.length} → ${minified.length} chars)`)
  }
  
  // Generate TypeScript file
  const tsContent = `// Auto-generated template bundle - DO NOT EDIT
// Generated at: ${new Date().toISOString()}

export const COMPILED_TEMPLATES = ${JSON.stringify(templates, null, 2)} as const

export type TemplateNames = keyof typeof COMPILED_TEMPLATES

// Template validation
const REQUIRED_TEMPLATES: TemplateNames[] = [
  'PAGE_FRAME',
  'SEO_META_TEMPLATE', 
  'HEADER',
  'HERO',
  'BLOG_CTA',
  'POST_NAVIGATION',
  'FOOTER'
]

// Validate all required templates are present
for (const template of REQUIRED_TEMPLATES) {
  if (!COMPILED_TEMPLATES[template]) {
    throw new Error(\`Missing required template: \${template}\`)
  }
}

console.log('✅ All templates compiled and validated')
`
  
  fs.writeFileSync(OUTPUT_FILE, tsContent)
  console.log(`📦 Templates bundled to: ${OUTPUT_FILE}`)
  console.log(`📊 Total templates: ${Object.keys(templates).length}`)
  
  return templates
}

// Check if this module is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  compileTemplates().catch(console.error)
}

export { compileTemplates }