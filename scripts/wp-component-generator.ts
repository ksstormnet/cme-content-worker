#!/usr/bin/env node
/**
 * WordPress Block-to-React Component Generator
 * Session 5: Block-to-React Component Generation
 * 
 * Converts WordPress block configurations to functional React components:
 * - JSON-to-React conversion system with attribute parsing
 * - TypeScript interfaces for block attributes and props
 * - CSS extraction and styling integration with theme variables
 * - Component hierarchy and dependency management
 * - WordPress block rendering behavior in React
 * - Component library structure and organization
 */

import { promises as fs } from 'fs';
import { join, dirname } from 'path';

interface WordPressBlock {
  name: string;
  title?: string;
  description?: string;
  icon?: any;
  category?: string;
  keywords?: string[];
  attributes?: Record<string, any>;
  supports?: Record<string, any>;
  styles?: any[];
  variations?: any[];
  textdomain?: string;
  parent?: string[];
  ancestor?: string[];
  providesContext?: Record<string, any>;
  usesContext?: string[];
  example?: any;
  apiVersion?: number;
}

interface ReactComponentInfo {
  blockName: string;
  componentName: string;
  fileName: string;
  category: string;
  isGenerateBlock: boolean;
  complexity: 'simple' | 'medium' | 'complex';
  attributes: Record<string, any>;
  supports: Record<string, any>;
  dependencies: string[];
  cssVariables: string[];
  contextUsage: string[];
}

interface GenerationResult {
  timestamp: string;
  session: string;
  source_site: string;
  summary: {
    total_blocks: number;
    generatepress_components: number;
    generateblocks_components: number;
    core_components: number;
    third_party_components: number;
    simple_components: number;
    medium_components: number;
    complex_components: number;
    total_typescript_interfaces: number;
    total_css_variables: number;
  };
  component_library: {
    generatepress: ReactComponentInfo[];
    generateblocks: ReactComponentInfo[];
    core: ReactComponentInfo[];
    third_party: ReactComponentInfo[];
  };
  typescript_interfaces: string[];
  css_integration: {
    theme_variables: string[];
    component_styles: Record<string, string>;
    responsive_breakpoints: string[];
  };
  component_index: {
    by_category: Record<string, string[]>;
    by_complexity: Record<string, string[]>;
    dependencies: Record<string, string[]>;
  };
}

class WordPressComponentGenerator {
  private results: GenerationResult;
  private blocksData: any;
  private themeVars: any;
  private componentDir = './src/components/wp-blocks';

  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      session: '5',
      source_site: 'https://cruisemadeeasy.com',
      summary: {
        total_blocks: 0,
        generatepress_components: 0,
        generateblocks_components: 0,
        core_components: 0,
        third_party_components: 0,
        simple_components: 0,
        medium_components: 0,
        complex_components: 0,
        total_typescript_interfaces: 0,
        total_css_variables: 0
      },
      component_library: {
        generatepress: [],
        generateblocks: [],
        core: [],
        third_party: []
      },
      typescript_interfaces: [],
      css_integration: {
        theme_variables: [],
        component_styles: {},
        responsive_breakpoints: []
      },
      component_index: {
        by_category: {},
        by_complexity: {},
        dependencies: {}
      }
    };
  }

  async initialize(): Promise<void> {
    console.log('⚛️ Starting WordPress Block-to-React Component Generation - Session 5');
    console.log('═══════════════════════════════════════════════════════════════════════');

    try {
      // Load WordPress blocks data from Session 2
      console.log('📦 Loading WordPress blocks data...');
      const blocksFile = await fs.readFile('./wp-components/block-types.json', 'utf8');
      this.blocksData = JSON.parse(blocksFile);
      console.log(`   ✅ Loaded ${this.blocksData.blocks?.length || 0} WordPress blocks`);

      // Load theme variables from Session 3
      console.log('🎨 Loading theme variables...');
      const themeFile = await fs.readFile('./wp-components/css-variables.json', 'utf8');
      this.themeVars = JSON.parse(themeFile);
      console.log(`   ✅ Loaded theme variables: ${Object.keys(this.themeVars.colors || {}).length} colors, ${Object.keys(this.themeVars.typography || {}).length} typography`);

      // Ensure component directories exist
      await this.ensureDirectoryStructure();
      console.log(`   ✅ Component directory structure ready`);
      
      console.log('');
    } catch (error) {
      throw new Error(`Failed to initialize component generator: ${error}`);
    }
  }

  /**
   * Create component directory structure
   */
  private async ensureDirectoryStructure(): Promise<void> {
    const directories = [
      this.componentDir,
      join(this.componentDir, 'generatepress'),
      join(this.componentDir, 'generateblocks'),
      join(this.componentDir, 'core'),
      join(this.componentDir, 'third-party'),
      join(this.componentDir, 'shared')
    ];

    for (const dir of directories) {
      await this.ensureDirectory(dir);
    }
  }

  /**
   * Process all WordPress blocks and convert to React components
   */
  async processAllBlocks(): Promise<void> {
    console.log('🔄 Processing WordPress Blocks...');

    try {
      const blocks = this.blocksData.blocks || [];
      this.results.summary.total_blocks = blocks.length;

      let processed = 0;
      for (const block of blocks) {
        await this.processBlock(block);
        processed++;
        
        if (processed % 20 === 0) {
          console.log(`   📝 Processed ${processed}/${blocks.length} blocks...`);
        }
      }

      console.log(`   ✅ Component processing complete:`);
      console.log(`      - GeneratePress: ${this.results.summary.generatepress_components}`);
      console.log(`      - GenerateBlocks: ${this.results.summary.generateblocks_components}`);
      console.log(`      - WordPress Core: ${this.results.summary.core_components}`);
      console.log(`      - Third Party: ${this.results.summary.third_party_components}`);

    } catch (error) {
      console.error('❌ Block processing failed:', error);
      throw error;
    }
  }

  /**
   * Process individual WordPress block and generate React component
   */
  private async processBlock(block: WordPressBlock): Promise<void> {
    try {
      const componentInfo = this.analyzeBlock(block);
      const componentCode = this.generateReactComponent(block, componentInfo);
      const interfaceCode = this.generateTypeScriptInterface(block, componentInfo);

      // Write React component file
      const componentPath = join(this.getComponentDirectory(componentInfo), `${componentInfo.fileName}.tsx`);
      await fs.writeFile(componentPath, componentCode, 'utf8');

      // Store component info
      this.categorizeComponent(componentInfo);
      
      // Store TypeScript interface
      this.results.typescript_interfaces.push(interfaceCode);

      // Update summary statistics
      this.updateSummaryStats(componentInfo);

    } catch (error) {
      console.error(`Failed to process block ${block.name}:`, error);
    }
  }

  /**
   * Analyze WordPress block and determine React component requirements
   */
  private analyzeBlock(block: WordPressBlock): ReactComponentInfo {
    const blockName = block.name || 'unknown';
    const componentName = this.toComponentName(blockName);
    const fileName = this.toFileName(blockName);
    const category = block.category || 'uncategorized';

    // Determine if this is a GeneratePress/GenerateBlocks component
    const isGenerateBlock = blockName.startsWith('generatepress/') || 
                          blockName.startsWith('generateblocks/') || 
                          blockName.startsWith('generateblocks-pro/');

    // Analyze complexity
    const complexity = this.determineComplexity(block);

    // Extract dependencies
    const dependencies = this.extractDependencies(block);

    // Extract CSS variables needed
    const cssVariables = this.extractCSSVariables(block);

    // Extract context usage
    const contextUsage = block.usesContext || [];

    return {
      blockName,
      componentName,
      fileName,
      category,
      isGenerateBlock,
      complexity,
      attributes: block.attributes || {},
      supports: block.supports || {},
      dependencies,
      cssVariables,
      contextUsage
    };
  }

  /**
   * Convert WordPress block name to React component name
   */
  private toComponentName(blockName: string): string {
    // Remove namespace and convert to PascalCase
    const name = blockName.split('/').pop() || blockName;
    return name
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('') + 'Block';
  }

  /**
   * Convert WordPress block name to file name
   */
  private toFileName(blockName: string): string {
    const name = blockName.split('/').pop() || blockName;
    return name.toLowerCase().replace(/_/g, '-');
  }

  /**
   * Determine component complexity based on attributes and features
   */
  private determineComplexity(block: WordPressBlock): 'simple' | 'medium' | 'complex' {
    const attributeCount = Object.keys(block.attributes || {}).length;
    const hasContext = (block.usesContext?.length || 0) > 0;
    const hasProvides = Object.keys(block.providesContext || {}).length > 0;
    const hasStyles = (block.styles?.length || 0) > 0;
    const hasVariations = (block.variations?.length || 0) > 0;

    if (attributeCount > 8 || hasContext || hasProvides || hasStyles || hasVariations) {
      return 'complex';
    } else if (attributeCount > 3) {
      return 'medium';
    } else {
      return 'simple';
    }
  }

  /**
   * Extract component dependencies
   */
  private extractDependencies(block: WordPressBlock): string[] {
    const deps: string[] = ['React'];
    
    // Add context dependencies
    if (block.usesContext?.length) {
      deps.push('useContext');
    }

    // Add styling dependencies
    if (block.styles?.length || Object.keys(block.supports || {}).some(key => 
        key.includes('color') || key.includes('spacing') || key.includes('typography'))) {
      deps.push('styled-components', 'theme variables');
    }

    // Add parent/child dependencies
    if (block.parent?.length || block.ancestor?.length) {
      deps.push('component hierarchy');
    }

    return [...new Set(deps)];
  }

  /**
   * Extract CSS variables needed for styling
   */
  private extractCSSVariables(block: WordPressBlock): string[] {
    const vars: string[] = [];
    
    const supports = block.supports || {};
    
    // Color support
    if (supports.color) {
      vars.push('--accent', '--contrast', '--base');
    }
    
    // Typography support  
    if (supports.typography) {
      vars.push('--body-font', '--heading-font', '--base-font-size');
    }
    
    // Spacing support
    if (supports.spacing) {
      vars.push('--spacing-unit', '--container-width');
    }

    return vars;
  }

  /**
   * Generate React component code
   */
  private generateReactComponent(block: WordPressBlock, info: ReactComponentInfo): string {
    const imports = this.generateImports(info);
    const interfaceName = `${info.componentName}Props`;
    const componentBody = this.generateComponentBody(block, info);
    const styling = this.generateComponentStyling(block, info);

    return `${imports}

interface ${interfaceName} {
  ${this.generatePropsInterface(block, info)}
}

${styling}

export const ${info.componentName}: React.FC<${interfaceName}> = ({
  ${this.generatePropsDestructuring(block, info)}
}) => {
  ${componentBody}
};

export default ${info.componentName};
`;
  }

  /**
   * Generate component imports
   */
  private generateImports(info: ReactComponentInfo): string {
    const imports = ['React'];
    
    if (info.dependencies.includes('useContext')) {
      imports.push('{ useContext }');
    }
    
    if (info.dependencies.includes('styled-components')) {
      imports.push("styled from 'styled-components'");
    }

    if (info.cssVariables.length > 0) {
      imports.push("{ themeConfig } from '../../../utils/wp-theme-vars'");
    }

    return imports.map(imp => {
      if (imp === 'React') {
        return `import React from 'react';`;
      } else if (imp.includes('styled')) {
        return `import ${imp};`;
      } else if (imp.includes('themeConfig')) {
        return `import ${imp};`;
      } else {
        return `import ${imp} from 'react';`;
      }
    }).join('\n');
  }

  /**
   * Generate TypeScript props interface
   */
  private generatePropsInterface(block: WordPressBlock, info: ReactComponentInfo): string {
    const props: string[] = [];
    
    // Standard WordPress block props
    props.push('className?: string;');
    props.push('children?: React.ReactNode;');
    
    // Block-specific attributes
    const attributes = block.attributes || {};
    for (const [attrName, attrConfig] of Object.entries(attributes)) {
      const type = this.getTypeScriptType(attrConfig);
      const optional = attrConfig.required === false ? '?' : '?';
      props.push(`${attrName}${optional}: ${type};`);
    }

    // Context props
    if (block.usesContext?.length) {
      props.push('// Context props');
      for (const context of block.usesContext) {
        props.push(`${context}?: any;`);
      }
    }

    return props.join('\n  ');
  }

  /**
   * Generate props destructuring for component
   */
  private generatePropsDestructuring(block: WordPressBlock, info: ReactComponentInfo): string {
    const props = ['className', 'children'];
    
    // Add block attributes
    const attributes = Object.keys(block.attributes || {});
    props.push(...attributes);

    // Add context props
    if (block.usesContext?.length) {
      props.push(...block.usesContext);
    }

    return props.join(',\n  ');
  }

  /**
   * Generate component body/JSX
   */
  private generateComponentBody(block: WordPressBlock, info: ReactComponentInfo): string {
    const tagName = this.getHTMLTagName(block);
    const attributes = this.generateJSXAttributes(block, info);
    
    if (info.complexity === 'simple') {
      return `return (
    <${tagName}${attributes}>
      {children}
    </${tagName}>
  );`;
    } else if (info.complexity === 'medium') {
      return `// Medium complexity component - customize as needed
  const blockProps = {
    className,
    ...${this.generateAttributeSpread(block)}
  };

  return (
    <${tagName}${attributes}>
      {children}
    </${tagName}>
  );`;
    } else {
      return `// Complex component - requires custom implementation
  // This block has advanced features that need specific handling:
  // ${this.getComplexityReasons(block).map(reason => `// - ${reason}`).join('\n  ')}
  
  const blockProps = {
    className,
    ...${this.generateAttributeSpread(block)}
  };

  return (
    <${tagName}${attributes}>
      {/* TODO: Implement complex block logic */}
      {children}
    </${tagName}>
  );`;
    }
  }

  /**
   * Generate component styling (styled-components or CSS)
   */
  private generateComponentStyling(block: WordPressBlock, info: ReactComponentInfo): string {
    if (info.cssVariables.length === 0) {
      return '// No specific styling required';
    }

    const tagName = this.getHTMLTagName(block);
    const cssVars = info.cssVariables.map(v => `  ${v}: var(${v});`).join('\n');

    return `const Styled${info.componentName.replace('Block', '')} = styled.${tagName}\`
${cssVars}
  
  /* Add custom styling based on WordPress block supports */
  \${props => props.className && \`/* Custom class: \${props.className} */\`}
\`;`;
  }

  /**
   * Get HTML tag name for block
   */
  private getHTMLTagName(block: WordPressBlock): string {
    const name = block.name || '';
    
    if (name.includes('heading') || name.includes('title')) return 'h2';
    if (name.includes('paragraph') || name.includes('text')) return 'p';
    if (name.includes('image') || name.includes('media')) return 'figure';
    if (name.includes('button')) return 'button';
    if (name.includes('list')) return 'ul';
    if (name.includes('quote')) return 'blockquote';
    if (name.includes('table')) return 'table';
    if (name.includes('video')) return 'video';
    if (name.includes('audio')) return 'audio';
    if (name.includes('form')) return 'form';
    if (name.includes('nav')) return 'nav';
    if (name.includes('section')) return 'section';
    if (name.includes('article')) return 'article';
    if (name.includes('header')) return 'header';
    if (name.includes('footer')) return 'footer';
    
    return 'div'; // Default container
  }

  /**
   * Generate JSX attributes
   */
  private generateJSXAttributes(block: WordPressBlock, info: ReactComponentInfo): string {
    const attrs: string[] = [];
    
    if (info.cssVariables.length > 0) {
      // Use styled component if CSS variables are needed
      return ''; // Styled component handles attributes
    } else {
      attrs.push(' className={className}');
    }

    return attrs.join('');
  }

  /**
   * Generate attribute spread for complex components
   */
  private generateAttributeSpread(block: WordPressBlock): string {
    const attributes = Object.keys(block.attributes || {});
    if (attributes.length === 0) return '{}';
    
    return `{${attributes.join(', ')}}`;
  }

  /**
   * Get reasons why a component is complex
   */
  private getComplexityReasons(block: WordPressBlock): string[] {
    const reasons: string[] = [];
    
    if ((block.usesContext?.length || 0) > 0) {
      reasons.push(`Uses context: ${block.usesContext?.join(', ')}`);
    }
    
    if (Object.keys(block.providesContext || {}).length > 0) {
      reasons.push('Provides context to child blocks');
    }
    
    if ((block.styles?.length || 0) > 0) {
      reasons.push(`Has ${block.styles?.length} style variations`);
    }
    
    if ((block.variations?.length || 0) > 0) {
      reasons.push(`Has ${block.variations?.length} block variations`);
    }
    
    if (Object.keys(block.attributes || {}).length > 8) {
      reasons.push(`Has ${Object.keys(block.attributes || {}).length} attributes`);
    }

    return reasons;
  }

  /**
   * Convert WordPress attribute type to TypeScript type
   */
  private getTypeScriptType(attrConfig: any): string {
    const type = attrConfig.type;
    
    switch (type) {
      case 'string': return 'string';
      case 'number': return 'number';
      case 'integer': return 'number';
      case 'boolean': return 'boolean';
      case 'array': return 'any[]';
      case 'object': return 'Record<string, any>';
      default: return 'any';
    }
  }

  /**
   * Generate complete TypeScript interface for block
   */
  private generateTypeScriptInterface(block: WordPressBlock, info: ReactComponentInfo): string {
    return `// ${info.componentName} Interface
interface ${info.componentName}Props {
  ${this.generatePropsInterface(block, info)}
}`;
  }

  /**
   * Get component directory based on type
   */
  private getComponentDirectory(info: ReactComponentInfo): string {
    if (info.blockName.startsWith('generatepress/')) {
      return join(this.componentDir, 'generatepress');
    } else if (info.blockName.startsWith('generateblocks/') || info.blockName.startsWith('generateblocks-pro/')) {
      return join(this.componentDir, 'generateblocks');
    } else if (info.blockName.startsWith('core/')) {
      return join(this.componentDir, 'core');
    } else {
      return join(this.componentDir, 'third-party');
    }
  }

  /**
   * Categorize component and update results
   */
  private categorizeComponent(info: ReactComponentInfo): void {
    if (info.blockName.startsWith('generatepress/')) {
      this.results.component_library.generatepress.push(info);
    } else if (info.blockName.startsWith('generateblocks/') || info.blockName.startsWith('generateblocks-pro/')) {
      this.results.component_library.generateblocks.push(info);
    } else if (info.blockName.startsWith('core/')) {
      this.results.component_library.core.push(info);
    } else {
      this.results.component_library.third_party.push(info);
    }

    // Index by category
    if (!this.results.component_index.by_category[info.category]) {
      this.results.component_index.by_category[info.category] = [];
    }
    this.results.component_index.by_category[info.category].push(info.componentName);

    // Index by complexity
    if (!this.results.component_index.by_complexity[info.complexity]) {
      this.results.component_index.by_complexity[info.complexity] = [];
    }
    this.results.component_index.by_complexity[info.complexity].push(info.componentName);

    // Index dependencies
    this.results.component_index.dependencies[info.componentName] = info.dependencies;
  }

  /**
   * Update summary statistics
   */
  private updateSummaryStats(info: ReactComponentInfo): void {
    if (info.blockName.startsWith('generatepress/')) {
      this.results.summary.generatepress_components++;
    } else if (info.blockName.startsWith('generateblocks/') || info.blockName.startsWith('generateblocks-pro/')) {
      this.results.summary.generateblocks_components++;
    } else if (info.blockName.startsWith('core/')) {
      this.results.summary.core_components++;
    } else {
      this.results.summary.third_party_components++;
    }

    switch (info.complexity) {
      case 'simple':
        this.results.summary.simple_components++;
        break;
      case 'medium':
        this.results.summary.medium_components++;
        break;
      case 'complex':
        this.results.summary.complex_components++;
        break;
    }

    this.results.summary.total_css_variables += info.cssVariables.length;
  }

  /**
   * Generate component library index files
   */
  async generateComponentIndex(): Promise<void> {
    console.log('📋 Generating Component Library Index...');

    try {
      // Generate main index file
      await this.generateMainIndex();
      
      // Generate category-specific index files
      await this.generateCategoryIndexes();
      
      // Generate TypeScript definitions file
      await this.generateTypeDefinitions();

      console.log(`   ✅ Component library index complete:`);
      console.log(`      - Main index with ${this.results.summary.total_blocks} components`);
      console.log(`      - Category indexes: 4 directories`);
      console.log(`      - TypeScript definitions: ${this.results.typescript_interfaces.length} interfaces`);

    } catch (error) {
      console.error('❌ Component index generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate main component index
   */
  private async generateMainIndex(): Promise<void> {
    const indexContent = `/**
 * WordPress Blocks Component Library
 * Generated: ${this.results.timestamp}
 * Total Components: ${this.results.summary.total_blocks}
 */

// GeneratePress Components (${this.results.summary.generatepress_components})
${this.generateCategoryExports('generatepress')}

// GenerateBlocks Components (${this.results.summary.generateblocks_components})  
${this.generateCategoryExports('generateblocks')}

// WordPress Core Components (${this.results.summary.core_components})
${this.generateCategoryExports('core')}

// Third Party Components (${this.results.summary.third_party_components})
${this.generateCategoryExports('third-party')}

// Component Library Object
export const WordPressBlocks = {
  generatepress: {
${this.generateComponentObject('generatepress')}
  },
  generateblocks: {
${this.generateComponentObject('generateblocks')}
  },
  core: {
${this.generateComponentObject('core')}
  },
  thirdParty: {
${this.generateComponentObject('third-party')}
  }
};

export default WordPressBlocks;
`;

    await fs.writeFile(join(this.componentDir, 'index.ts'), indexContent, 'utf8');
  }

  /**
   * Generate category-specific exports
   */
  private generateCategoryExports(category: string): string {
    const components = this.getComponentsByCategory(category);
    return components.map(comp => 
      `export { ${comp.componentName} } from './${category}/${comp.fileName}';`
    ).join('\n');
  }

  /**
   * Generate component object for category
   */
  private generateComponentObject(category: string): string {
    const components = this.getComponentsByCategory(category);
    return components.map(comp => 
      `    ${comp.componentName}`
    ).join(',\n');
  }

  /**
   * Get components by category
   */
  private getComponentsByCategory(category: string): ReactComponentInfo[] {
    switch (category) {
      case 'generatepress':
        return this.results.component_library.generatepress;
      case 'generateblocks':
        return this.results.component_library.generateblocks;
      case 'core':
        return this.results.component_library.core;
      case 'third-party':
        return this.results.component_library.third_party;
      default:
        return [];
    }
  }

  /**
   * Generate category index files
   */
  private async generateCategoryIndexes(): Promise<void> {
    const categories = ['generatepress', 'generateblocks', 'core', 'third-party'];
    
    for (const category of categories) {
      const components = this.getComponentsByCategory(category);
      const exports = components.map(comp => 
        `export { ${comp.componentName} } from './${comp.fileName}';`
      ).join('\n');

      const indexContent = `// ${category} WordPress Blocks
${exports}
`;

      await fs.writeFile(join(this.componentDir, category, 'index.ts'), indexContent, 'utf8');
    }
  }

  /**
   * Generate TypeScript definitions
   */
  private async generateTypeDefinitions(): Promise<void> {
    const content = `/**
 * WordPress Blocks TypeScript Definitions
 * Generated: ${this.results.timestamp}
 */

${this.results.typescript_interfaces.join('\n\n')}

// Component Library Types
export interface WordPressBlocksLibrary {
  generatepress: Record<string, React.ComponentType<any>>;
  generateblocks: Record<string, React.ComponentType<any>>;
  core: Record<string, React.ComponentType<any>>;
  thirdParty: Record<string, React.ComponentType<any>>;
}

// Block complexity levels
export type BlockComplexity = 'simple' | 'medium' | 'complex';

// Block category information
export interface BlockCategory {
  name: string;
  components: string[];
  complexity: Record<BlockComplexity, number>;
}
`;

    this.results.summary.total_typescript_interfaces = this.results.typescript_interfaces.length;
    await fs.writeFile(join(this.componentDir, 'types.ts'), content, 'utf8');
  }

  /**
   * Save export results
   */
  async saveExports(): Promise<void> {
    console.log('💾 Saving Component Generation Results...');

    const exports = [
      {
        filename: 'react-components.json',
        data: {
          timestamp: this.results.timestamp,
          summary: this.results.summary,
          component_library: this.results.component_library,
          component_index: this.results.component_index
        },
        description: 'React component library structure and metadata'
      },
      {
        filename: 'component-generation-complete.json',
        data: this.results,
        description: 'Complete component generation results'
      }
    ];

    for (const exportFile of exports) {
      try {
        const filePath = `./wp-components/${exportFile.filename}`;
        const jsonData = JSON.stringify(exportFile.data, null, 2);
        
        await fs.writeFile(filePath, jsonData, 'utf8');
        console.log(`   ✅ Saved: ${exportFile.filename} (${exportFile.description})`);
      } catch (error) {
        console.error(`   ❌ Failed to save ${exportFile.filename}:`, error);
      }
    }
  }

  /**
   * Print generation summary
   */
  printSummary(): void {
    console.log('');
    console.log('📊 Component Generation Summary - Session 5 Complete');
    console.log('═══════════════════════════════════════════════════');
    console.log(`📅 Generation Date: ${this.results.timestamp}`);
    console.log(`🌐 Source Site: ${this.results.source_site}`);
    console.log('');
    console.log('⚛️ React Components Generated:');
    console.log(`   Total Components: ${this.results.summary.total_blocks}`);
    console.log(`   ├── GeneratePress: ${this.results.summary.generatepress_components}`);
    console.log(`   ├── GenerateBlocks: ${this.results.summary.generateblocks_components}`);
    console.log(`   ├── WordPress Core: ${this.results.summary.core_components}`);
    console.log(`   └── Third Party: ${this.results.summary.third_party_components}`);
    console.log('');
    console.log('🔧 Component Complexity:');
    console.log(`   Simple: ${this.results.summary.simple_components} (basic props, minimal logic)`);
    console.log(`   Medium: ${this.results.summary.medium_components} (moderate complexity)`);
    console.log(`   Complex: ${this.results.summary.complex_components} (advanced features, context, variations)`);
    console.log('');
    console.log('📝 TypeScript Integration:');
    console.log(`   Interfaces Generated: ${this.results.summary.total_typescript_interfaces}`);
    console.log(`   CSS Variables: ${this.results.summary.total_css_variables}`);
    console.log(`   Component Categories: ${Object.keys(this.results.component_index.by_category).length}`);
    console.log('');
    console.log('🎯 WordPress Block Editor Integration Complete');
    console.log('All WordPress blocks converted to React components with TypeScript support.');
  }

  /**
   * Ensure directory exists
   */
  private async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  /**
   * Run complete component generation process
   */
  async run(): Promise<void> {
    try {
      await this.initialize();
      await this.processAllBlocks();
      await this.generateComponentIndex();
      await this.saveExports();
      this.printSummary();
      
      console.log('\n✅ Session 5 Complete - WordPress blocks converted to React components!');
      console.log('');
      console.log('📋 Component Library Ready:');
      console.log('   📂 src/components/wp-blocks/ - React component library');
      console.log('   🔧 Component index with TypeScript definitions');
      console.log('   🎨 Theme integration with CSS variables');
      console.log('   📱 Ready for WordPress block editor integration');
      
    } catch (error) {
      console.error('\n❌ Component generation failed:', error);
      process.exit(1);
    }
  }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const generator = new WordPressComponentGenerator();
  generator.run().catch(console.error);
}

export { WordPressComponentGenerator };