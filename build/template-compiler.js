// Build-time template and CSS compiler
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const TEMPLATE_DIR = path.join(__dirname, '../src/templates')
const SOURCE_TEMPLATE_DIR = '/data/Development/repo/Cruise-Made-Easy/cme-posts-abstraction/templates'
const CSS_OUTPUT_DIR = path.join(__dirname, '../public/css')
const TEMPLATE_OUTPUT_FILE = path.join(__dirname, '../src/utils/compiled-templates.ts')

// No HTML minification - keep templates readable
const preserveFormatting = {
  collapseWhitespace: false,
  removeComments: false,
  minifyCSS: false,
  minifyJS: false
}

async function triggerTemplateCSSBuild() {
  console.log('🎨 Triggering CSS minification at template source...')
  
  const buildScriptPath = path.join(SOURCE_TEMPLATE_DIR, 'build-minified-css.js')
  
  if (!fs.existsSync(buildScriptPath)) {
    console.log('ℹ️ No CSS build script found at template source - skipping')
    return
  }
  
  try {
    execSync(`node "${buildScriptPath}"`, { 
      stdio: 'inherit',
      cwd: SOURCE_TEMPLATE_DIR
    })
    console.log('✅ Template CSS minification completed')
  } catch (error) {
    console.error('❌ Failed to run template CSS build:', error.message)
  }
}

async function compileTemplates() {
  console.log('📄 Compiling HTML templates (unminified for readability)...')
  
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
    // No minification - keep templates readable
    const key = file.replace('.html', '').replace(/-/g, '_').toUpperCase()
    
    templates[key] = content
    console.log(`✅ Compiled ${file} (${content.length} chars, unminified)`)
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
  
  fs.writeFileSync(TEMPLATE_OUTPUT_FILE, tsContent)
  console.log(`📦 Templates bundled to: ${TEMPLATE_OUTPUT_FILE}`)
  console.log(`📊 Total templates: ${Object.keys(templates).length}`)
  
  return templates
}

async function buildAll() {
  console.log('🚀 Starting build process...')
  
  // Trigger CSS minification at template source
  await triggerTemplateCSSBuild()
  
  // Then compile templates
  await compileTemplates()
  
  console.log('✨ Build complete!')
}

// Check if this module is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  buildAll().catch(console.error)
}

export { compileTemplates, triggerTemplateCSSBuild, buildAll }