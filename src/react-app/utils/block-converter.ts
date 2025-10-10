/**
 * Block Converter - Converts between Tiptap JSON and ContentBlock format
 * Now supports recursive nesting for section/columns blocks
 */

import type {
  ContentBlock,
  HeadingBlockContent,
  ParagraphBlockContent,
  ImageBlockContent,
  AccentTipBlockContent,
  QuoteBlockContent,
  CTABlockContent,
  ListBlockContent,
  SectionBlockContent,
  ColumnsBlockContent,
  ColumnBlockContent
} from '../../types/database';

const MAX_NESTING_DEPTH = 5;

/**
 * Convert Tiptap JSON structure to ContentBlock array
 */
export function tiptapToBlocks(tiptapJson: any): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  let blockOrder = 0;

  if (!tiptapJson || !tiptapJson.content) {
    return blocks;
  }

  tiptapJson.content.forEach((node: any) => {
    const block = convertNodeToBlock(node, blockOrder, 0);
    if (block) {
      blocks.push(block);
      blockOrder++;
    }
  });

  return blocks;
}

/**
 * Convert a single Tiptap node to a ContentBlock with recursive nesting support
 */
function convertNodeToBlock(node: any, blockOrder: number, depth: number): Partial<ContentBlock> | null {
  // Enforce depth limit
  if (depth > MAX_NESTING_DEPTH) {
    console.warn('Max nesting depth exceeded, skipping block');
    return null;
  }

  switch (node.type) {
    case 'heading':
      return {
        block_type: 'heading',
        block_order: blockOrder,
        content: JSON.stringify({
          level: node.attrs?.level || 2,
          text: extractTextFromNode(node),
          anchor: node.attrs?.anchor
        } as HeadingBlockContent)
      };

    case 'paragraph':
      const text = extractTextFromNode(node);
      // Skip empty paragraphs
      if (!text.trim()) return null;

      return {
        block_type: 'paragraph',
        block_order: blockOrder,
        content: JSON.stringify({
          text: text,
          alignment: node.attrs?.textAlign || 'left'
        } as ParagraphBlockContent)
      };

    case 'callout':
    case 'accentTip':
      return {
        block_type: 'accent_tip',
        block_order: blockOrder,
        content: JSON.stringify({
          text: extractTextFromNode(node),
          type: node.attrs?.type || 'tip'
        } as AccentTipBlockContent)
      };

    case 'blockquote':
      return {
        block_type: 'quote',
        block_order: blockOrder,
        content: JSON.stringify({
          text: extractTextFromNode(node),
          citation: node.attrs?.citation,
          alignment: node.attrs?.textAlign || 'left'
        } as QuoteBlockContent)
      };

    case 'image':
      return {
        block_type: 'image',
        block_order: blockOrder,
        content: JSON.stringify({
          url: node.attrs?.src || '',
          alt: node.attrs?.alt || '',
          caption: node.attrs?.caption,
          alignment: node.attrs?.alignment || 'center',
          size: node.attrs?.size || 'large'
        } as ImageBlockContent)
      };

    case 'cta':
      return {
        block_type: 'cta',
        block_order: blockOrder,
        content: JSON.stringify({
          text: node.attrs?.text || 'Click Here',
          url: node.attrs?.url || '',
          type: node.attrs?.buttonType || 'primary',
          style: node.attrs?.style || 'button',
          external: node.attrs?.external || false
        } as CTABlockContent)
      };

    case 'divider':
    case 'horizontalRule':
      return {
        block_type: 'divider',
        block_order: blockOrder,
        content: '{}'
      };

    case 'bulletList':
    case 'orderedList':
      return {
        block_type: 'list',
        block_order: blockOrder,
        content: JSON.stringify({
          ordered: node.type === 'orderedList',
          items: extractListItems(node)
        } as ListBlockContent)
      };

    case 'section':
      return {
        block_type: 'section',
        block_order: blockOrder,
        content: JSON.stringify({
          headline: node.attrs?.headline,
          style: node.attrs?.style || 'default',
          backgroundColor: node.attrs?.backgroundColor,
          textColor: node.attrs?.textColor,
          padding: node.attrs?.padding || 'medium',
          fullWidth: node.attrs?.fullWidth || false,
          children: convertNestedContent(node, depth)
        } as SectionBlockContent)
      };

    case 'columns':
      return {
        block_type: 'columns',
        block_order: blockOrder,
        content: JSON.stringify({
          columnCount: node.attrs?.columnCount || 2,
          gap: node.attrs?.gap || 'medium',
          alignment: node.attrs?.alignment || 'left',
          children: convertColumnsContent(node, depth)
        } as ColumnsBlockContent)
      };

    default:
      console.warn('Unknown node type:', node.type);
      return null;
  }
}

/**
 * Convert nested content from a parent node (like section) to ContentBlock[]
 * Omits post_id and id since they will be assigned by database
 */
function convertNestedContent(parentNode: any, depth: number): ContentBlock[] {
  if (!parentNode.content || depth >= MAX_NESTING_DEPTH) {
    return [];
  }

  const nestedBlocks: ContentBlock[] = [];
  let blockOrder = 0;

  parentNode.content.forEach((childNode: any) => {
    const block = convertNodeToBlock(childNode, blockOrder, depth + 1);
    if (block) {
      // Omit post_id and id for nested blocks
      const { post_id, id, ...blockWithoutIds } = block as any;
      nestedBlocks.push(blockWithoutIds as ContentBlock);
      blockOrder++;
    }
  });

  return nestedBlocks;
}

/**
 * Convert columns node content to ColumnBlockContent[]
 * Handles special column structure
 */
function convertColumnsContent(columnsNode: any, depth: number): ColumnBlockContent[] {
  if (!columnsNode.content || depth >= MAX_NESTING_DEPTH) {
    return [];
  }

  return columnsNode.content
    .filter((node: any) => node.type === 'column')
    .map((columnNode: any) => {
      const columnContent: ColumnBlockContent = {
        width: columnNode.attrs?.width
      };

      // Convert nested blocks inside column
      if (columnNode.content && columnNode.content.length > 0) {
        const nestedBlocks: ContentBlock[] = [];
        let blockOrder = 0;

        columnNode.content.forEach((childNode: any) => {
          const block = convertNodeToBlock(childNode, blockOrder, depth + 1);
          if (block) {
            // Omit post_id and id for nested blocks
            const { post_id, id, ...blockWithoutIds } = block as any;
            nestedBlocks.push(blockWithoutIds as ContentBlock);
            blockOrder++;
          }
        });

        columnContent.children = nestedBlocks;
      }

      return columnContent;
    });
}

/**
 * Extract text content from a Tiptap node (with formatting)
 */
function extractTextFromNode(node: any): string {
  if (!node.content) return '';

  return node.content.map((child: any) => {
    if (child.type === 'text') {
      let text = child.text || '';

      // Apply formatting marks
      if (child.marks) {
        child.marks.forEach((mark: any) => {
          switch (mark.type) {
            case 'bold':
            case 'strong':
              text = `**${text}**`;
              break;
            case 'italic':
            case 'em':
              text = `*${text}*`;
              break;
            case 'code':
              text = `\`${text}\``;
              break;
            case 'link':
              text = `[${text}](${mark.attrs?.href || ''})`;
              break;
          }
        });
      }

      return text;
    } else if (child.type === 'hardBreak') {
      return '\n';
    } else {
      // Recursively extract from nested nodes
      return extractTextFromNode(child);
    }
  }).join('');
}

/**
 * Extract list items from a list node
 */
function extractListItems(listNode: any): string[] {
  if (!listNode.content) return [];

  return listNode.content
    .filter((node: any) => node.type === 'listItem')
    .map((item: any) => extractTextFromNode(item));
}

/**
 * Convert ContentBlock array to Tiptap JSON structure
 */
export function blocksToTiptap(blocks: ContentBlock[]): any {
  const content = blocks
    .sort((a, b) => a.block_order - b.block_order)
    .map(convertBlockToNode)
    .filter(node => node !== null);

  return {
    type: 'doc',
    content: content
  };
}

/**
 * Convert a single ContentBlock to a Tiptap node with recursive nesting support
 */
function convertBlockToNode(block: ContentBlock): any | null {
  const content = typeof block.content === 'string'
    ? JSON.parse(block.content)
    : block.content;

  switch (block.block_type) {
    case 'heading':
      const headingContent = content as HeadingBlockContent;
      return {
        type: 'heading',
        attrs: {
          level: headingContent.level || 2,
          anchor: headingContent.anchor
        },
        content: textToNodes(headingContent.text)
      };

    case 'paragraph':
      const paragraphContent = content as ParagraphBlockContent;
      return {
        type: 'paragraph',
        attrs: { textAlign: paragraphContent.alignment || 'left' },
        content: textToNodes(paragraphContent.text)
      };

    case 'accent_tip':
      const tipContent = content as AccentTipBlockContent;
      return {
        type: 'accentTip',
        attrs: { type: tipContent.type || 'tip' },
        content: textToNodes(tipContent.text)
      };

    case 'quote':
      const quoteContent = content as QuoteBlockContent;
      return {
        type: 'blockquote',
        attrs: {
          textAlign: quoteContent.alignment || 'left',
          citation: quoteContent.citation
        },
        content: textToNodes(quoteContent.text)
      };

    case 'image':
      const imageContent = content as ImageBlockContent;
      return {
        type: 'image',
        attrs: {
          src: imageContent.url,
          alt: imageContent.alt,
          caption: imageContent.caption,
          alignment: imageContent.alignment || 'center',
          size: imageContent.size || 'large'
        }
      };

    case 'cta':
      const ctaContent = content as CTABlockContent;
      return {
        type: 'cta',
        attrs: {
          text: ctaContent.text,
          url: ctaContent.url,
          buttonType: ctaContent.type,
          style: ctaContent.style || 'button',
          external: ctaContent.external
        }
      };

    case 'divider':
      return {
        type: 'horizontalRule'
      };

    case 'list':
      const listContent = content as ListBlockContent;
      return {
        type: listContent.ordered ? 'orderedList' : 'bulletList',
        content: listContent.items.map(item => ({
          type: 'listItem',
          content: textToNodes(item)
        }))
      };

    case 'section':
      const sectionContent = content as SectionBlockContent;
      return {
        type: 'section',
        attrs: {
          headline: sectionContent.headline,
          style: sectionContent.style || 'default',
          backgroundColor: sectionContent.backgroundColor,
          textColor: sectionContent.textColor,
          padding: sectionContent.padding || 'medium',
          fullWidth: sectionContent.fullWidth || false
        },
        content: convertNestedBlocks(sectionContent.children || [])
      };

    case 'columns':
      const columnsContent = content as ColumnsBlockContent;
      return {
        type: 'columns',
        attrs: {
          columnCount: columnsContent.columnCount || 2,
          gap: columnsContent.gap || 'medium',
          alignment: columnsContent.alignment || 'left'
        },
        content: convertColumnNodes(columnsContent.children || [])
      };

    default:
      console.warn('Unknown block type:', block.block_type);
      return null;
  }
}

/**
 * Convert ContentBlock[] to Tiptap nodes for nested content
 * Handles recursive conversion with empty container fallback
 */
function convertNestedBlocks(blocks: ContentBlock[]): any[] {
  if (!blocks || blocks.length === 0) {
    // Add default paragraph to prevent empty container errors
    return [{
      type: 'paragraph',
      content: [{ type: 'text', text: '' }]
    }];
  }

  const nodes = blocks
    .sort((a, b) => a.block_order - b.block_order)
    .map(convertBlockToNode)
    .filter(node => node !== null);

  // Fallback to empty paragraph if all nodes filtered out
  return nodes.length > 0 ? nodes : [{
    type: 'paragraph',
    content: [{ type: 'text', text: '' }]
  }];
}

/**
 * Convert ColumnBlockContent[] to Tiptap column nodes
 * Handles special column structure conversion
 */
function convertColumnNodes(columns: ColumnBlockContent[]): any[] {
  if (!columns || columns.length === 0) {
    // Add default empty column to prevent errors
    return [{
      type: 'column',
      content: [{
        type: 'paragraph',
        content: [{ type: 'text', text: '' }]
      }]
    }];
  }

  return columns.map((column) => {
    return {
      type: 'column',
      attrs: {
        width: column.width
      },
      content: convertNestedBlocks(column.children || [])
    };
  });
}

/**
 * Convert markdown-style text to Tiptap nodes with formatting
 */
function textToNodes(text: string): any[] {
  if (!text) return [{ type: 'text', text: '' }];

  // Simple markdown parsing - split by formatting markers
  const nodes: any[] = [];
  let currentText = '';
  let i = 0;

  while (i < text.length) {
    // Bold: **text**
    if (text.substr(i, 2) === '**') {
      if (currentText) {
        nodes.push({ type: 'text', text: currentText });
        currentText = '';
      }
      const endIndex = text.indexOf('**', i + 2);
      if (endIndex !== -1) {
        const boldText = text.substring(i + 2, endIndex);
        nodes.push({
          type: 'text',
          text: boldText,
          marks: [{ type: 'bold' }]
        });
        i = endIndex + 2;
        continue;
      }
    }

    // Italic: *text*
    if (text[i] === '*' && text[i + 1] !== '*') {
      if (currentText) {
        nodes.push({ type: 'text', text: currentText });
        currentText = '';
      }
      const endIndex = text.indexOf('*', i + 1);
      if (endIndex !== -1) {
        const italicText = text.substring(i + 1, endIndex);
        nodes.push({
          type: 'text',
          text: italicText,
          marks: [{ type: 'italic' }]
        });
        i = endIndex + 1;
        continue;
      }
    }

    // Code: `text`
    if (text[i] === '`') {
      if (currentText) {
        nodes.push({ type: 'text', text: currentText });
        currentText = '';
      }
      const endIndex = text.indexOf('`', i + 1);
      if (endIndex !== -1) {
        const codeText = text.substring(i + 1, endIndex);
        nodes.push({
          type: 'text',
          text: codeText,
          marks: [{ type: 'code' }]
        });
        i = endIndex + 1;
        continue;
      }
    }

    // Link: [text](url)
    if (text[i] === '[') {
      const closeBracket = text.indexOf(']', i + 1);
      const openParen = text.indexOf('(', closeBracket);
      const closeParen = text.indexOf(')', openParen);

      if (closeBracket !== -1 && openParen === closeBracket + 1 && closeParen !== -1) {
        if (currentText) {
          nodes.push({ type: 'text', text: currentText });
          currentText = '';
        }
        const linkText = text.substring(i + 1, closeBracket);
        const linkUrl = text.substring(openParen + 1, closeParen);
        nodes.push({
          type: 'text',
          text: linkText,
          marks: [{ type: 'link', attrs: { href: linkUrl } }]
        });
        i = closeParen + 1;
        continue;
      }
    }

    // Regular character
    currentText += text[i];
    i++;
  }

  if (currentText) {
    nodes.push({ type: 'text', text: currentText });
  }

  return nodes.length > 0 ? nodes : [{ type: 'text', text: '' }];
}
