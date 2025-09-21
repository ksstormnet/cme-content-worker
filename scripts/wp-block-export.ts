#!/usr/bin/env node
/**
 * WordPress Block Types & Patterns Export Script
 * Session 2: Block Types & Patterns Export
 * 
 * Exports complete WordPress block system including:
 * - All registered block types with attributes and configurations
 * - Block patterns and categories
 * - Template parts and page templates
 * - GeneratePress/GenerateBlocks specific components
 */

import { promises as fs } from 'fs';
import { createWordPressAPI } from '../src/utils/wp-api.js';

interface BlockType {
  name: string;
  title: string;
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

interface BlockPattern {
  name: string;
  title: string;
  description?: string;
  content: string;
  categories?: string[];
  keywords?: string[];
  blockTypes?: string[];
  postTypes?: string[];
  inserter?: boolean;
}

interface TemplatePart {
  id: string;
  slug: string;
  theme: string;
  type: string;
  source: string;
  content: {
    raw: string;
    rendered?: string;
  };
  title: {
    raw: string;
    rendered?: string;
  };
  description?: string;
  status: string;
  author: number;
  has_theme_file: boolean;
}

interface ExportResult {
  timestamp: string;
  session: string;
  source_site: string;
  summary: {
    total_blocks: number;
    generatepress_blocks: number;
    generateblocks_blocks: number;
    core_blocks: number;
    third_party_blocks: number;
    patterns: number;
    pattern_categories: number;
    template_parts: number;
    templates: number;
  };
  blocks: {
    all: BlockType[];
    generatepress: BlockType[];
    generateblocks: BlockType[];
    core: BlockType[];
    third_party: BlockType[];
  };
  patterns: {
    patterns: BlockPattern[];
    categories: any[];
  };
  templates: {
    template_parts: TemplatePart[];
    page_templates: any[];
  };
  component_index: Record<string, any>;
}

class WordPressBlockExporter {
  private api: any;
  private results: ExportResult;

  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      session: '2',
      source_site: 'https://cruisemadeeasy.com',
      summary: {
        total_blocks: 0,
        generatepress_blocks: 0,
        generateblocks_blocks: 0,
        core_blocks: 0,
        third_party_blocks: 0,
        patterns: 0,
        pattern_categories: 0,
        template_parts: 0,
        templates: 0
      },
      blocks: {
        all: [],
        generatepress: [],
        generateblocks: [],
        core: [],
        third_party: []
      },
      patterns: {
        patterns: [],
        categories: []
      },
      templates: {
        template_parts: [],
        page_templates: []
      },
      component_index: {}
    };
  }

  async initialize(): Promise<void> {
    console.log('🚀 Starting WordPress Block Export - Session 2');
    console.log('═══════════════════════════════════════════════════');
    
    this.api = await createWordPressAPI();
    
    // Test connection
    const connectionTest = await this.api.testConnection();
    if (!connectionTest.success) {
      throw new Error(`Failed to connect to WordPress API: ${connectionTest.error}`);
    }

    console.log(`✅ Connected to: ${connectionTest.data.site_name}`);
    console.log(`📍 Site URL: ${this.results.source_site}`);
    console.log('');
  }

  /**
   * Export all WordPress block types
   */
  async exportBlockTypes(): Promise<void> {
    console.log('📦 Exporting WordPress Block Types...');
    
    try {
      const response = await this.api.makeRequest('/wp/v2/block-types');
      
      if (!response.success) {
        throw new Error(`Failed to fetch block types: ${response.error}`);
      }

      const blockTypes = response.data;
      console.log(`   Found ${Array.isArray(blockTypes) ? blockTypes.length : Object.keys(blockTypes).length} registered block types`);

      // Process and categorize blocks
      const blocksArray = Array.isArray(blockTypes) ? blockTypes : Object.values(blockTypes);
      
      for (const blockData of blocksArray) {
        const block: BlockType = {
          ...(blockData as any)
        };

        this.results.blocks.all.push(block);

        // Categorize blocks
        const blockName = block.name || '';
        if (blockName.startsWith('generatepress/')) {
          this.results.blocks.generatepress.push(block);
          this.results.summary.generatepress_blocks++;
        } else if (blockName.startsWith('generateblocks/') || blockName.startsWith('generateblocks-pro/')) {
          this.results.blocks.generateblocks.push(block);
          this.results.summary.generateblocks_blocks++;
        } else if (blockName.startsWith('core/')) {
          this.results.blocks.core.push(block);
          this.results.summary.core_blocks++;
        } else {
          this.results.blocks.third_party.push(block);
          this.results.summary.third_party_blocks++;
        }
      }

      this.results.summary.total_blocks = this.results.blocks.all.length;
      
      console.log(`   ✅ Processed ${this.results.summary.total_blocks} block types:`);
      console.log(`      - GeneratePress: ${this.results.summary.generatepress_blocks}`);
      console.log(`      - GenerateBlocks: ${this.results.summary.generateblocks_blocks}`);
      console.log(`      - WordPress Core: ${this.results.summary.core_blocks}`);
      console.log(`      - Third Party: ${this.results.summary.third_party_blocks}`);
      
    } catch (error) {
      console.error('❌ Block types export failed:', error);
      throw error;
    }
  }

  /**
   * Export block patterns and categories
   */
  async exportBlockPatterns(): Promise<void> {
    console.log('🎨 Exporting Block Patterns...');

    try {
      // Export patterns
      const patternsResponse = await this.api.makeRequest('/wp/v2/block-patterns/patterns');
      if (patternsResponse.success && patternsResponse.data) {
        this.results.patterns.patterns = patternsResponse.data;
        this.results.summary.patterns = patternsResponse.data.length;
        console.log(`   ✅ Found ${this.results.summary.patterns} block patterns`);
      }

      // Export pattern categories
      const categoriesResponse = await this.api.makeRequest('/wp/v2/block-patterns/categories');
      if (categoriesResponse.success && categoriesResponse.data) {
        this.results.patterns.categories = categoriesResponse.data;
        this.results.summary.pattern_categories = categoriesResponse.data.length;
        console.log(`   ✅ Found ${this.results.summary.pattern_categories} pattern categories`);
      }

    } catch (error) {
      console.error('❌ Block patterns export failed:', error);
      // Continue with other exports even if patterns fail
    }
  }

  /**
   * Export template parts and page templates
   */
  async exportTemplates(): Promise<void> {
    console.log('📄 Exporting Template Parts & Templates...');

    try {
      // Export template parts
      const templatePartsResponse = await this.api.makeRequest('/wp/v2/template-parts');
      if (templatePartsResponse.success && templatePartsResponse.data) {
        this.results.templates.template_parts = templatePartsResponse.data;
        this.results.summary.template_parts = templatePartsResponse.data.length;
        console.log(`   ✅ Found ${this.results.summary.template_parts} template parts`);
      }

      // Export page templates  
      const templatesResponse = await this.api.makeRequest('/wp/v2/templates');
      if (templatesResponse.success && templatesResponse.data) {
        this.results.templates.page_templates = templatesResponse.data;
        this.results.summary.templates = templatesResponse.data.length;
        console.log(`   ✅ Found ${this.results.summary.templates} page templates`);
      }

    } catch (error) {
      console.error('❌ Templates export failed:', error);
      // Continue with other exports even if templates fail
    }
  }

  /**
   * Create component index for React conversion
   */
  createComponentIndex(): void {
    console.log('📋 Creating Component Index...');

    const index = {
      blocks_by_category: {} as Record<string, string[]>,
      blocks_with_styles: [] as string[],
      blocks_with_variations: [] as string[],
      generatepress_components: {
        blocks: this.results.blocks.generatepress.map(b => b.name),
        template_parts: this.results.templates.template_parts
          .filter(t => t.theme === 'generatepress')
          .map(t => t.slug)
      },
      generateblocks_components: {
        blocks: this.results.blocks.generateblocks.map(b => b.name),
        features: [] as string[]
      },
      conversion_requirements: {
        total_components: this.results.summary.total_blocks,
        components_with_attributes: 0,
        components_with_context: 0,
        complex_components: 0
      }
    };

    // Process blocks for indexing
    for (const block of this.results.blocks.all) {
      // Group by category
      const category = block.category || 'uncategorized';
      if (!index.blocks_by_category[category]) {
        index.blocks_by_category[category] = [];
      }
      index.blocks_by_category[category].push(block.name);

      // Track blocks with styles and variations
      if (block.styles && block.styles.length > 0) {
        index.blocks_with_styles.push(block.name);
      }
      
      if (block.variations && block.variations.length > 0) {
        index.blocks_with_variations.push(block.name);
      }

      // Count conversion complexity
      if (block.attributes && Object.keys(block.attributes).length > 0) {
        index.conversion_requirements.components_with_attributes++;
      }
      
      if (block.usesContext && block.usesContext.length > 0) {
        index.conversion_requirements.components_with_context++;
      }

      if ((block.attributes && Object.keys(block.attributes).length > 5) ||
          (block.usesContext && block.usesContext.length > 2) ||
          (block.styles && block.styles.length > 3)) {
        index.conversion_requirements.complex_components++;
      }
    }

    this.results.component_index = index;
    
    console.log(`   ✅ Indexed ${this.results.summary.total_blocks} components`);
    console.log(`      - Categories: ${Object.keys(index.blocks_by_category).length}`);
    console.log(`      - With Styles: ${index.blocks_with_styles.length}`);
    console.log(`      - With Variations: ${index.blocks_with_variations.length}`);
    console.log(`      - Complex Components: ${index.conversion_requirements.complex_components}`);
  }

  /**
   * Save all export data to files
   */
  async saveExports(): Promise<void> {
    console.log('💾 Saving Export Data...');

    const exports = [
      {
        filename: 'block-types.json',
        data: {
          timestamp: this.results.timestamp,
          summary: this.results.summary,
          blocks: this.results.blocks.all
        },
        description: 'All WordPress block definitions'
      },
      {
        filename: 'block-patterns.json', 
        data: this.results.patterns,
        description: 'Block patterns and categories'
      },
      {
        filename: 'template-parts.json',
        data: this.results.templates,
        description: 'Template parts and page templates'
      },
      {
        filename: 'generatepress-blocks.json',
        data: {
          timestamp: this.results.timestamp,
          generatepress: this.results.blocks.generatepress,
          generateblocks: this.results.blocks.generateblocks,
          summary: {
            generatepress_blocks: this.results.summary.generatepress_blocks,
            generateblocks_blocks: this.results.summary.generateblocks_blocks,
            total_generate_blocks: this.results.summary.generatepress_blocks + this.results.summary.generateblocks_blocks
          },
          component_index: this.results.component_index.generatepress_components
        },
        description: 'GeneratePress/GenerateBlocks components only'
      },
      {
        filename: 'wp-block-export-complete.json',
        data: this.results,
        description: 'Complete export results with all data'
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
   * Print export summary
   */
  printSummary(): void {
    console.log('');
    console.log('📊 Export Summary - Session 2 Complete');
    console.log('═══════════════════════════════════════════════════');
    console.log(`📅 Export Date: ${this.results.timestamp}`);
    console.log(`🌐 Source Site: ${this.results.source_site}`);
    console.log('');
    console.log('📦 Block Types Exported:');
    console.log(`   Total Blocks: ${this.results.summary.total_blocks}`);
    console.log(`   ├── GeneratePress: ${this.results.summary.generatepress_blocks}`);
    console.log(`   ├── GenerateBlocks: ${this.results.summary.generateblocks_blocks}`);
    console.log(`   ├── WordPress Core: ${this.results.summary.core_blocks}`);
    console.log(`   └── Third Party: ${this.results.summary.third_party_blocks}`);
    console.log('');
    console.log('🎨 Patterns & Templates:');
    console.log(`   Block Patterns: ${this.results.summary.patterns}`);
    console.log(`   Pattern Categories: ${this.results.summary.pattern_categories}`);
    console.log(`   Template Parts: ${this.results.summary.template_parts}`);
    console.log(`   Page Templates: ${this.results.summary.templates}`);
    console.log('');
    console.log('🎯 Ready for Session 3: Theme Settings & CSS Variables');
    console.log('All block data exported and ready for React component conversion.');
  }

  /**
   * Run complete export process
   */
  async run(): Promise<void> {
    try {
      await this.initialize();
      await this.exportBlockTypes();
      await this.exportBlockPatterns();
      await this.exportTemplates();
      this.createComponentIndex();
      await this.saveExports();
      this.printSummary();
      
      console.log('\n✅ Session 2 Export Complete - All deliverables created successfully!');
      
    } catch (error) {
      console.error('\n❌ Export failed:', error);
      process.exit(1);
    }
  }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const exporter = new WordPressBlockExporter();
  exporter.run().catch(console.error);
}

export { WordPressBlockExporter };