/**
 * WordPress Block Mapper
 * Maps WordPress blocks to our internal content block system
 * Handles GenerateBlocks, GeneratePress, and core WordPress blocks
 */

import { ContentBlock } from '../types/database.js';
import { 
  WordPressGenerateBlocksClient, 
  GenerateBlocksConfig, 
  GenerateBlocksStorage 
} from './wordpress-generateblocks.js';

export interface WordPressPost {
  id: number;
  title: { rendered: string };
  content: { rendered: string };
  excerpt?: { rendered: string };
  slug: string;
  date: string;
  categories: number[];
  featured_media?: number;
  _embedded?: {
    'wp:featuredmedia'?: Array<{
      source_url: string;
      alt_text: string;
      title?: { rendered: string };
    }>;
    'wp:term'?: Array<Array<{
      name: string;
      slug: string;
    }>>;
  };
}

export interface BlockMappingResult {
  blocks: ContentBlock[];
  generatedElements: string[];
  requiredConfigs: string[];
  unmappedBlocks: string[];
}

/**
 * WordPress to CME Block Mapper
 */
export class WordPressBlockMapper {
  private generateBlocksClient: WordPressGenerateBlocksClient;
  private storage: GenerateBlocksStorage;

  constructor(generateBlocksClient: WordPressGenerateBlocksClient, storage: GenerateBlocksStorage) {
    this.generateBlocksClient = generateBlocksClient;
    this.storage = storage;
  }

  /**
   * Map WordPress post content to our content blocks
   */
  async mapPostContent(wpPost: WordPressPost, postId: number): Promise<BlockMappingResult> {
    const htmlContent = wpPost.content.rendered;
    
    // Extract GenerateBlocks element IDs first
    const elementIds = this.generateBlocksClient.extractElementIds(htmlContent);
    
    // Fetch or retrieve GenerateBlocks configurations
    const configs = await this.ensureGenerateBlocksConfigs(elementIds);
    
    // Parse HTML into block structures
    const blocks = this.parseHTMLToBlocks(htmlContent, postId, configs);
    
    return {
      blocks,
      generatedElements: elementIds,
      requiredConfigs: elementIds,
      unmappedBlocks: this.findUnmappedBlockTypes(htmlContent)
    };
  }

  /**
   * Ensure GenerateBlocks configurations are available
   * Fetches from WordPress API if not in database
   */
  private async ensureGenerateBlocksConfigs(elementIds: string[]): Promise<Map<string, GenerateBlocksConfig>> {
    const configMap = new Map<string, GenerateBlocksConfig>();
    const missingIds: string[] = [];
    
    // Check which configs we already have
    for (const elementId of elementIds) {
      const existingConfig = await this.storage.getConfig(elementId);
      if (existingConfig) {
        configMap.set(elementId, existingConfig);
      } else {
        missingIds.push(elementId);
      }
    }
    
    // Fetch missing configurations from WordPress API
    if (missingIds.length > 0) {
      console.log(`Fetching ${missingIds.length} GenerateBlocks configurations from WordPress...`);
      const newConfigs = await this.generateBlocksClient.fetchElementConfigs(missingIds);
      
      // Store new configurations
      await this.storage.storeConfigs(newConfigs);
      
      // Add to map
      for (const config of newConfigs) {
        configMap.set(config.element_id, config);
      }
    }
    
    return configMap;
  }

  /**
   * Parse HTML content into structured content blocks
   */
  private parseHTMLToBlocks(
    htmlContent: string, 
    postId: number, 
    gbConfigs: Map<string, GenerateBlocksConfig>
  ): ContentBlock[] {
    const blocks: ContentBlock[] = [];
    let blockOrder = 0;

    // Split content by major HTML elements
    const elements = this.parseHTMLElements(htmlContent);
    
    for (const element of elements) {
      const block = this.mapElementToBlock(element, postId, blockOrder++, gbConfigs);
      if (block) {
        blocks.push(block);
      }
    }
    
    return blocks;
  }

  /**
   * Parse HTML into structured elements
   */
  private parseHTMLElements(html: string): HTMLElement[] {
    // This is a simplified parser - in production you'd use a proper HTML parser
    const elements: HTMLElement[] = [];
    
    // Remove empty paragraphs and normalize whitespace
    const cleanHtml = html
      .replace(/<p>\s*<\/p>/g, '')
      .replace(/\n\s*\n/g, '\n')
      .trim();
    
    // Split by block-level elements (simplified approach)
    const blockElements = cleanHtml.split(/(?=<(?:p|h[1-6]|div|figure|blockquote|ul|ol|table|hr))/);
    
    for (const elementHtml of blockElements) {
      if (elementHtml.trim()) {
        elements.push({
          tagName: this.extractTagName(elementHtml),
          innerHTML: elementHtml.trim(),
          className: this.extractClassName(elementHtml),
          getAttribute: (name: string) => this.extractAttribute(elementHtml, name)
        } as HTMLElement);
      }
    }
    
    return elements;
  }

  /**
   * Map HTML element to content block
   */
  private mapElementToBlock(
    element: HTMLElement, 
    postId: number, 
    blockOrder: number, 
    gbConfigs: Map<string, GenerateBlocksConfig>
  ): ContentBlock | null {
    const tagName = element.tagName?.toLowerCase() || this.extractTagName(element.innerHTML);
    const className = element.className || this.extractClassName(element.innerHTML);
    
    // Determine block type based on HTML structure
    let blockType: ContentBlock['block_type'];
    let content: any = {};

    switch (tagName) {
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        blockType = 'heading';
        content = {
          level: parseInt(tagName[1]) as 1 | 2 | 3 | 4 | 5 | 6,
          text: this.extractTextContent(element.innerHTML),
          anchor: this.extractAttribute(element.innerHTML, 'id')
        };
        break;

      case 'p':
        // Check if it's a special paragraph type
        if (className.includes('wp-block-button') || element.innerHTML.includes('wp-block-button')) {
          return this.mapButtonBlock(element, postId, blockOrder);
        }
        
        blockType = 'paragraph';
        content = {
          text: element.innerHTML,
          alignment: this.extractAlignment(className)
        };
        break;

      case 'figure':
        if (className.includes('wp-block-image')) {
          return this.mapImageBlock(element, postId, blockOrder);
        }
        blockType = 'figure';
        content = this.mapFigureContent(element);
        break;

      case 'div':
        return this.mapDivBlock(element, postId, blockOrder, gbConfigs);

      case 'blockquote':
        blockType = 'quote';
        content = this.mapQuoteContent(element);
        break;

      case 'ul':
      case 'ol':
        blockType = 'list';
        content = this.mapListContent(element, tagName === 'ol');
        break;

      case 'table':
        blockType = 'table';
        content = this.mapTableContent(element);
        break;

      case 'hr':
        blockType = 'divider';
        content = {};
        break;

      default:
        // Unknown element type
        console.warn(`Unknown block element: ${tagName} with classes: ${className}`);
        return null;
    }

    return {
      id: 0, // Will be set by database
      post_id: postId,
      block_type: blockType,
      block_order: blockOrder,
      content: JSON.stringify(content),
      created_at: new Date().toISOString()
    };
  }

  /**
   * Map div elements (including GenerateBlocks)
   */
  private mapDivBlock(
    element: HTMLElement, 
    postId: number, 
    blockOrder: number, 
    gbConfigs: Map<string, GenerateBlocksConfig>
  ): ContentBlock | null {
    const className = element.className || this.extractClassName(element.innerHTML);
    const innerHTML = element.innerHTML;

    // GeneratePress Section
    if (className.includes('gbp-section')) {
      return {
        id: 0,
        post_id: postId,
        block_type: 'section',
        block_order: blockOrder,
        content: JSON.stringify({
          headline: this.extractTextContent(innerHTML.match(/<h[1-6][^>]*class="[^"]*gbp-section__headline[^"]*"[^>]*>(.*?)<\/h[1-6]>/)?.[1] || ''),
          style: 'default',
          backgroundColor: this.extractStyleValue(innerHTML, 'background-color')
        }),
        created_at: new Date().toISOString()
      };
    }

    // GenerateBlocks Container
    const gbElementMatch = className.match(/gb-element-([a-f0-9]+)/);
    if (gbElementMatch) {
      const elementId = gbElementMatch[1];
      const config = gbConfigs.get(elementId);
      
      return {
        id: 0,
        post_id: postId,
        block_type: 'container',
        block_order: blockOrder,
        content: JSON.stringify({
          elementId: `gb-element-${elementId}`,
          className: className,
          style: config ? this.parseStylesFromConfig(config) : {}
        }),
        created_at: new Date().toISOString()
      };
    }

    // WordPress Columns
    if (className.includes('wp-block-columns')) {
      return {
        id: 0,
        post_id: postId,
        block_type: 'columns',
        block_order: blockOrder,
        content: JSON.stringify({
          columns: (innerHTML.match(/wp-block-column/g) || []).length,
          alignment: this.extractAlignment(className)
        }),
        created_at: new Date().toISOString()
      };
    }

    // WordPress Button Group
    if (className.includes('wp-block-buttons')) {
      return {
        id: 0,
        post_id: postId,
        block_type: 'cta-group',
        block_order: blockOrder,
        content: JSON.stringify({
          alignment: this.extractAlignment(className),
          buttons: this.extractButtons(innerHTML)
        }),
        created_at: new Date().toISOString()
      };
    }

    // Generic div - might contain other content
    return {
      id: 0,
      post_id: postId,
      block_type: 'paragraph',
      block_order: blockOrder,
      content: JSON.stringify({
        text: innerHTML,
        alignment: this.extractAlignment(className)
      }),
      created_at: new Date().toISOString()
    };
  }

  // Helper methods for content extraction

  private mapImageBlock(element: HTMLElement, postId: number, blockOrder: number): ContentBlock {
    const innerHTML = element.innerHTML;
    const img = innerHTML.match(/<img[^>]*>/)?.[0] || '';
    
    return {
      id: 0,
      post_id: postId,
      block_type: 'image',
      block_order: blockOrder,
      content: JSON.stringify({
        url: this.extractAttribute(img, 'src') || '',
        alt: this.extractAttribute(img, 'alt') || '',
        caption: this.extractTextContent(innerHTML.match(/<figcaption[^>]*>(.*?)<\/figcaption>/)?.[1] || ''),
        alignment: this.extractAlignment(element.className || ''),
        size: this.extractSize(element.className || '')
      }),
      created_at: new Date().toISOString()
    };
  }

  private mapButtonBlock(element: HTMLElement, postId: number, blockOrder: number): ContentBlock {
    const innerHTML = element.innerHTML;
    const link = innerHTML.match(/<a[^>]*>(.*?)<\/a>/)?.[0] || '';
    
    return {
      id: 0,
      post_id: postId,
      block_type: 'cta',
      block_order: blockOrder,
      content: JSON.stringify({
        text: this.extractTextContent(link),
        url: this.extractAttribute(link, 'href') || '',
        type: innerHTML.includes('is-style-outline') ? 'secondary' : 'primary',
        external: this.extractAttribute(link, 'target') === '_blank'
      }),
      created_at: new Date().toISOString()
    };
  }

  private mapQuoteContent(element: HTMLElement) {
    const innerHTML = element.innerHTML;
    const cite = innerHTML.match(/<cite[^>]*>(.*?)<\/cite>/)?.[1];
    
    return {
      text: this.extractTextContent(innerHTML.replace(/<cite[^>]*>.*?<\/cite>/, '')),
      citation: cite ? this.extractTextContent(cite) : undefined,
      alignment: this.extractAlignment(element.className || '')
    };
  }

  private mapListContent(element: HTMLElement, ordered: boolean) {
    const innerHTML = element.innerHTML;
    const items = innerHTML.match(/<li[^>]*>(.*?)<\/li>/g) || [];
    
    return {
      ordered,
      items: items.map(item => this.extractTextContent(item.replace(/<\/?li[^>]*>/g, '')))
    };
  }

  private mapTableContent(element: HTMLElement) {
    const innerHTML = element.innerHTML;
    const rows = innerHTML.match(/<tr[^>]*>(.*?)<\/tr>/gs) || [];
    const caption = innerHTML.match(/<caption[^>]*>(.*?)<\/caption>/)?.[1];
    
    return {
      caption: caption ? this.extractTextContent(caption) : undefined,
      hasHeader: innerHTML.includes('<th'),
      rows: rows.map(row => {
        const cells = row.match(/<t[hd][^>]*>(.*?)<\/t[hd]>/gs) || [];
        return cells.map(cell => this.extractTextContent(cell.replace(/<\/?t[hd][^>]*>/g, '')));
      })
    };
  }

  private mapFigureContent(element: HTMLElement) {
    const innerHTML = element.innerHTML;
    const img = innerHTML.match(/<img[^>]*>/)?.[0] || '';
    
    return {
      image: {
        url: this.extractAttribute(img, 'src') || '',
        alt: this.extractAttribute(img, 'alt') || '',
        caption: this.extractTextContent(innerHTML.match(/<figcaption[^>]*>(.*?)<\/figcaption>/)?.[1] || '')
      },
      alignment: this.extractAlignment(element.className || ''),
      size: this.extractSize(element.className || '')
    };
  }

  // Utility methods

  private extractTagName(html: string): string {
    const match = html.match(/<(\w+)/);
    return match ? match[1].toLowerCase() : '';
  }

  private extractClassName(html: string): string {
    const match = html.match(/class=["']([^"']*)["']/);
    return match ? match[1] : '';
  }

  private extractAttribute(html: string, attr: string): string | null {
    const regex = new RegExp(`${attr}=["']([^"']*)["']`);
    const match = html.match(regex);
    return match ? match[1] : null;
  }

  private extractTextContent(html: string): string {
    return html.replace(/<[^>]*>/g, '').trim();
  }

  private extractAlignment(className: string): string | undefined {
    if (className.includes('alignleft') || className.includes('has-text-align-left')) return 'left';
    if (className.includes('alignright') || className.includes('has-text-align-right')) return 'right';
    if (className.includes('aligncenter') || className.includes('has-text-align-center')) return 'center';
    if (className.includes('alignjustify') || className.includes('has-text-align-justify')) return 'justify';
    return undefined;
  }

  private extractSize(className: string): string | undefined {
    if (className.includes('size-thumbnail')) return 'thumbnail';
    if (className.includes('size-medium')) return 'medium';
    if (className.includes('size-large')) return 'large';
    if (className.includes('size-full')) return 'full';
    return undefined;
  }

  private extractStyleValue(html: string, property: string): string | undefined {
    const styleMatch = html.match(/style=["']([^"']*)["']/);
    if (styleMatch) {
      const style = styleMatch[1];
      const propertyMatch = style.match(new RegExp(`${property}:\\s*([^;]+)`));
      return propertyMatch ? propertyMatch[1].trim() : undefined;
    }
    return undefined;
  }

  private extractButtons(html: string): Array<any> {
    const buttonDivs = html.match(/<div[^>]*class="[^"]*wp-block-button[^"]*"[^>]*>.*?<\/div>/gs) || [];
    
    return buttonDivs.map(buttonDiv => {
      const link = buttonDiv.match(/<a[^>]*>(.*?)<\/a>/)?.[0] || '';
      return {
        text: this.extractTextContent(link),
        url: this.extractAttribute(link, 'href') || '',
        type: buttonDiv.includes('is-style-outline') ? 'secondary' : 'primary',
        external: this.extractAttribute(link, 'target') === '_blank'
      };
    });
  }

  private parseStylesFromConfig(config: GenerateBlocksConfig): Record<string, any> {
    // Parse GenerateBlocks configuration into style object
    const styles: Record<string, any> = {};
    
    if (config.configuration) {
      const cfg = config.configuration;
      
      if (cfg.backgroundColor) styles.backgroundColor = cfg.backgroundColor;
      if (cfg.textColor) styles.color = cfg.textColor;
      if (cfg.padding) styles.padding = cfg.padding;
      if (cfg.margin) styles.margin = cfg.margin;
      if (cfg.borderRadius) styles.borderRadius = cfg.borderRadius;
      if (cfg.fontSize) styles.fontSize = cfg.fontSize;
      if (cfg.fontWeight) styles.fontWeight = cfg.fontWeight;
    }
    
    return styles;
  }

  private findUnmappedBlockTypes(html: string): string[] {
    const unmapped: string[] = [];
    
    // Look for WordPress block classes we haven't mapped
    const blockClasses = html.match(/wp-block-[\w-]+/g) || [];
    const uniqueClasses = [...new Set(blockClasses)];
    
    for (const className of uniqueClasses) {
      // Check if this is a block type we handle
      const isHandled = [
        'wp-block-image',
        'wp-block-button',
        'wp-block-buttons',
        'wp-block-columns',
        'wp-block-column',
        'wp-block-quote',
        'wp-block-list',
        'wp-block-table'
      ].some(handled => className.includes(handled));
      
      if (!isHandled) {
        unmapped.push(className);
      }
    }
    
    return [...new Set(unmapped)];
  }
}