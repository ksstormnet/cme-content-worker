import { 
  ContentBlock, 
  HeadingBlockContent,
  ParagraphBlockContent, 
  ImageBlockContent, 
  AccentTipBlockContent, 
  QuoteBlockContent, 
  CTABlockContent,
  ListBlockContent,
  TableBlockContent,
  ColumnsBlockContent,
  ColumnBlockContent,
  SectionBlockContent,
  ContainerBlockContent,
  CTAGroupBlockContent,
  FigureBlockContent
} from "../types/database";

/**
 * Block Renderer - Converts content blocks to accessible HTML
 * Implements WCAG 2.1 AA compliance with proper ARIA attributes
 */

export interface BlockRendererOptions {
  baseUrl?: string;
  includeWrappers?: boolean;
  enableLazyLoading?: boolean;
}

export class BlockRenderer {
  private options: BlockRendererOptions;

  constructor(options: BlockRendererOptions = {}) {
    this.options = {
      baseUrl: '',
      includeWrappers: true,
      enableLazyLoading: true,
      ...options
    };
  }

  /**
   * Render multiple content blocks to HTML
   */
  renderBlocks(blocks: ContentBlock[]): string {
    if (!blocks || blocks.length === 0) {
      return '';
    }

    // Sort blocks by order
    const sortedBlocks = blocks.sort((a, b) => a.block_order - b.block_order);
    
    const renderedBlocks = sortedBlocks.map(block => this.renderBlock(block));
    
    if (this.options.includeWrappers) {
      return `<div class="content-blocks" role="main" aria-label="Article content">\n${renderedBlocks.join('\n')}\n</div>`;
    }
    
    return renderedBlocks.join('\n');
  }

  /**
   * Render a single content block to HTML
   */
  renderBlock(block: ContentBlock): string {
    try {
      const content = typeof block.content === 'string' 
        ? JSON.parse(block.content) 
        : block.content;

      switch (block.block_type) {
        case 'heading':
          return this.renderHeading(content as HeadingBlockContent, block.id);
        case 'paragraph':
          return this.renderParagraph(content as ParagraphBlockContent, block.id);
        case 'image':
          return this.renderImage(content as ImageBlockContent, block.id);
        case 'accent_tip':
          return this.renderAccentTip(content as AccentTipBlockContent, block.id);
        case 'quote':
          return this.renderQuote(content as QuoteBlockContent, block.id);
        case 'cta':
          return this.renderCTA(content as CTABlockContent, block.id);
        case 'divider':
          return this.renderDivider(block.id);
        case 'list':
          return this.renderList(content as ListBlockContent, block.id);
        case 'table':
          return this.renderTable(content as TableBlockContent, block.id);
        case 'columns':
          return this.renderColumns(content as ColumnsBlockContent, block.id);
        case 'column':
          return this.renderColumn(content as ColumnBlockContent, block.id);
        case 'section':
          return this.renderSection(content as SectionBlockContent, block.id);
        case 'container':
          return this.renderContainer(content as ContainerBlockContent, block.id);
        case 'cta-group':
          return this.renderCTAGroup(content as CTAGroupBlockContent, block.id);
        case 'figure':
          return this.renderFigure(content as FigureBlockContent, block.id);
        default:
          console.warn(`Unknown block type: ${block.block_type}`);
          return `<!-- Unknown block type: ${block.block_type} -->`;
      }
    } catch (error) {
      console.error(`Error rendering block ${block.id}:`, error);
      return `<!-- Error rendering block ${block.id}: ${error} -->`;
    }
  }

  /**
   * Render heading block with proper semantic levels
   */
  private renderHeading(content: HeadingBlockContent, blockId: number): string {
    const level = Math.max(1, Math.min(6, content.level || 2));
    const id = content.anchor || `heading-${blockId}`;
    const alignment = content.alignment ? ` style="text-align: ${content.alignment}"` : '';
    
    return `<h${level} id="${this.escapeHtml(id)}" class="content-heading"${alignment} aria-label="Heading: ${this.escapeHtml(content.text)}">
  ${this.escapeHtml(content.text)}
</h${level}>`;
  }

  /**
   * Render paragraph with proper alignment and formatting
   */
  private renderParagraph(content: ParagraphBlockContent, blockId: number): string {
    const alignment = content.alignment ? ` style="text-align: ${content.alignment}"` : '';
    const summary = this.generateTextSummary(content.text);
    
    return `<p class="content-paragraph"${alignment} aria-label="${this.escapeHtml(summary)}">
  ${this.processTextFormatting(content.text)}
</p>`;
  }

  /**
   * Render image with accessibility features
   */
  private renderImage(content: ImageBlockContent, blockId: number): string {
    const url = this.resolveImageUrl(content.url);
    const alt = this.escapeHtml(content.alt || '');
    const alignment = content.alignment || 'center';
    const sizeClass = content.size ? `image-${content.size}` : 'image-medium';
    const captionId = content.caption ? `caption-${blockId}` : undefined;
    
    const lazyLoading = this.options.enableLazyLoading ? ' loading="lazy"' : '';
    
    let html = `<figure class="content-image ${sizeClass}" style="text-align: ${alignment}">
  <img src="${url}" alt="${alt}"${lazyLoading} class="responsive-image"`;
    
    if (captionId) {
      html += ` aria-describedby="${captionId}"`;
    }
    
    html += ' />';
    
    if (content.caption) {
      html += `\n  <figcaption id="${captionId}" class="image-caption">
    ${this.escapeHtml(content.caption)}
  </figcaption>`;
    }
    
    html += '\n</figure>';
    
    return html;
  }

  /**
   * Render accent tip with appropriate ARIA role
   */
  private renderAccentTip(content: AccentTipBlockContent, blockId: number): string {
    const type = content.type || 'tip';
    const roleMap = {
      tip: 'note',
      warning: 'alert',
      info: 'note',
      success: 'status'
    };
    const role = roleMap[type] || 'note';
    const icon = this.getAccentTipIcon(type);
    
    return `<aside role="${role}" class="accent-tip accent-tip--${type}" aria-label="${type}: ${this.generateTextSummary(content.text)}">
  <div class="accent-tip__icon" aria-hidden="true">${icon}</div>
  <div class="accent-tip__content">
    ${this.processTextFormatting(content.text)}
  </div>
</aside>`;
  }

  /**
   * Render blockquote with citation
   */
  private renderQuote(content: QuoteBlockContent, blockId: number): string {
    const alignment = content.alignment ? ` style="text-align: ${content.alignment}"` : '';
    let html = `<blockquote class="content-quote"${alignment} aria-label="Quote: ${this.generateTextSummary(content.text)}">
  <p class="quote-text">${this.processTextFormatting(content.text)}</p>`;
    
    if (content.citation) {
      html += `\n  <cite class="quote-citation">— ${this.escapeHtml(content.citation)}</cite>`;
    }
    
    html += '\n</blockquote>';
    
    return html;
  }

  /**
   * Render call-to-action button
   */
  private renderCTA(content: CTABlockContent, blockId: number): string {
    const url = this.escapeHtml(content.url);
    const text = this.escapeHtml(content.text);
    const style = content.style || 'primary';
    const target = content.external ? ' target="_blank" rel="noopener noreferrer"' : '';
    const ariaLabel = content.external 
      ? `${text} (opens in new window)`
      : text;
    
    return `<div class="content-cta" style="text-align: center">
  <a href="${url}" class="cta-button cta-button--${style}" aria-label="${ariaLabel}"${target}>
    ${text}
  </a>
</div>`;
  }

  /**
   * Render visual divider
   */
  private renderDivider(blockId: number): string {
    return `<hr class="content-divider" role="separator" aria-label="Content section separator" />`;
  }

  /**
   * Render list (ordered or unordered)
   */
  private renderList(content: ListBlockContent, blockId: number): string {
    const listType = content.ordered ? 'ol' : 'ul';
    const items = content.items.map(item => 
      `  <li>${this.processTextFormatting(item)}</li>`
    ).join('\n');
    
    return `<${listType} class="content-list" aria-label="${content.ordered ? 'Ordered' : 'Unordered'} list with ${content.items.length} items">
${items}
</${listType}>`;
  }

  /**
   * Render data table with accessibility features
   */
  private renderTable(content: TableBlockContent, blockId: number): string {
    if (!content.rows || content.rows.length === 0) {
      return '<!-- Empty table -->';
    }

    const caption = content.caption 
      ? `\n  <caption>${this.escapeHtml(content.caption)}</caption>` 
      : '';
    
    let html = `<div class="table-wrapper" role="region" tabindex="0" aria-label="Data table">
  <table class="content-table"${caption ? ` aria-describedby="table-caption-${blockId}"` : ''}>`;
    
    if (caption) {
      html += `\n    <caption id="table-caption-${blockId}">${this.escapeHtml(content.caption!)}</caption>`;
    }
    
    // Render header if present
    if (content.hasHeader && content.rows.length > 0) {
      html += '\n    <thead>\n      <tr>';
      content.rows[0].forEach(cell => {
        html += `\n        <th scope="col">${this.processTextFormatting(cell)}</th>`;
      });
      html += '\n      </tr>\n    </thead>';
    }
    
    // Render body rows
    html += '\n    <tbody>';
    const startIndex = (content.hasHeader && content.rows.length > 0) ? 1 : 0;
    
    for (let i = startIndex; i < content.rows.length; i++) {
      html += '\n      <tr>';
      content.rows[i].forEach((cell, cellIndex) => {
        const tag = cellIndex === 0 ? 'th' : 'td';
        const scope = cellIndex === 0 ? ' scope="row"' : '';
        html += `\n        <${tag}${scope}>${this.processTextFormatting(cell)}</${tag}>`;
      });
      html += '\n      </tr>';
    }
    
    html += '\n    </tbody>\n  </table>\n</div>';
    
    return html;
  }

  /**
   * Render multi-column layout
   */
  private renderColumns(content: ColumnsBlockContent, blockId: number): string {
    const alignment = content.alignment || 'left';
    return `<div class="wp-block-columns is-layout-flex" style="justify-content: ${alignment}">
  <!-- Columns content will be rendered by individual column blocks -->
</div>`;
  }

  /**
   * Render individual column
   */
  private renderColumn(content: ColumnBlockContent, blockId: number): string {
    const width = content.width || 'auto';
    return `<div class="wp-block-column" style="flex-basis: ${width}">
  <!-- Column content rendered separately -->
</div>`;
  }

  /**
   * Render GeneratePress section
   */
  private renderSection(content: SectionBlockContent, blockId: number): string {
    const style = content.style || 'default';
    const bgColor = content.backgroundColor ? ` style="background-color: ${content.backgroundColor}"` : '';
    
    let html = `<div class="gbp-section gbp-section--${style}"${bgColor} role="region" aria-label="Content section">
  <div class="gbp-section__inner">`;

    if (content.headline) {
      html += `\n    <h2 class="gbp-section__headline">${this.escapeHtml(content.headline)}</h2>`;
    }

    html += '\n  </div>\n</div>';
    return html;
  }

  /**
   * Render GenerateBlocks container
   */
  private renderContainer(content: ContainerBlockContent, blockId: number): string {
    const elementId = content.elementId || `gb-element-${blockId}`;
    const className = content.className || '';
    const styles = content.style ? ` style="${this.objectToStyle(content.style)}"` : '';

    return `<div class="${elementId} ${className}"${styles} role="group">
  <!-- Container content rendered separately -->
</div>`;
  }

  /**
   * Render button group
   */
  private renderCTAGroup(content: CTAGroupBlockContent, blockId: number): string {
    const alignment = content.alignment || 'center';
    const justification = {
      'left': 'flex-start',
      'center': 'center', 
      'right': 'flex-end'
    }[alignment];

    const buttons = content.buttons.map((button, index) => {
      const target = button.external ? ' target="_blank" rel="noopener noreferrer"' : '';
      const ariaLabel = button.external 
        ? `${button.text} (opens in new window)`
        : button.text;
      
      return `  <div class="wp-block-button">
    <a href="${this.escapeHtml(button.url)}" class="wp-block-button__link cta-button--${button.type}" aria-label="${ariaLabel}"${target}>
      ${this.escapeHtml(button.text)}
    </a>
  </div>`;
    }).join('\n');

    return `<div class="wp-block-buttons is-content-justification-${alignment} is-layout-flex" style="justify-content: ${justification}">
${buttons}
</div>`;
  }

  /**
   * Render figure with image
   */
  private renderFigure(content: FigureBlockContent, blockId: number): string {
    const alignment = content.alignment || 'center';
    const size = content.size || 'large';
    const image = content.image;
    
    const url = this.resolveImageUrl(image.url);
    const alt = this.escapeHtml(image.alt || '');
    const captionId = image.caption ? `caption-${blockId}` : undefined;
    
    const lazyLoading = this.options.enableLazyLoading ? ' loading="lazy"' : '';
    
    let html = `<figure class="wp-block-image size-${size} align${alignment}">
  <img src="${url}" alt="${alt}"${lazyLoading} class="wp-image-${blockId}"`;
    
    if (captionId) {
      html += ` aria-describedby="${captionId}"`;
    }
    
    html += ' />';
    
    if (image.caption) {
      html += `\n  <figcaption id="${captionId}">${this.escapeHtml(image.caption)}</figcaption>`;
    }
    
    html += '\n</figure>';
    
    return html;
  }

  /**
   * Utility methods
   */

  private escapeHtml(text: string): string {
    if (!text) return '';
    // Server-safe HTML escaping without document.createElement
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private generateTextSummary(text: string, maxLength: number = 100): string {
    if (!text) return '';
    const plainText = text.replace(/<[^>]*>/g, '');
    return plainText.length > maxLength 
      ? plainText.substring(0, maxLength) + '...'
      : plainText;
  }

  private processTextFormatting(text: string): string {
    if (!text) return '';
    // Basic HTML formatting - in a real implementation, you'd want more sophisticated formatting
    // This is a simplified version for demonstration
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>');
  }

  private resolveImageUrl(url: string): string {
    if (url.startsWith('http')) {
      return url;
    }
    return this.options.baseUrl + url;
  }

  private getAccentTipIcon(type: string): string {
    const icons = {
      tip: '💡',
      warning: '⚠️',
      info: 'ℹ️',
      success: '✅'
    };
    return icons[type] || icons.tip;
  }

  private objectToStyle(styleObj: Record<string, any>): string {
    return Object.entries(styleObj)
      .map(([key, value]) => `${key}: ${value}`)
      .join('; ');
  }
}

/**
 * Default block renderer instance
 */
export const blockRenderer = new BlockRenderer();

/**
 * Convenience function for rendering blocks
 */
export function renderContentBlocks(blocks: ContentBlock[], options?: BlockRendererOptions): string {
  const renderer = options ? new BlockRenderer(options) : blockRenderer;
  return renderer.renderBlocks(blocks);
}

/**
 * Render blocks for use in future editor integration
 */
export function renderBlocksForEditor(blocks: ContentBlock[]): string {
  const renderer = new BlockRenderer({
    includeWrappers: false,
    enableLazyLoading: false
  });
  return renderer.renderBlocks(blocks);
}