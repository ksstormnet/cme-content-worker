import React, { useMemo } from 'react';
import type { ContentBlock } from '../../../types/database';

interface PreviewPanelProps {
  blocks: ContentBlock[];
  title: string;
  excerpt: string;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({ blocks, title, excerpt }) => {
  // Render blocks using the existing block-renderer logic
  const previewHtml = useMemo(() => {
    // Use server-side renderer (imported dynamically to avoid issues)
    // For now, we'll do a simple client-side preview
    return renderBlocksPreview(blocks);
  }, [blocks]);

  return (
    <div className="preview-panel">
      <div className="preview-header">
        <h3>Preview</h3>
      </div>
      <div className="preview-content">
        {title && <h1 className="preview-title">{title}</h1>}
        {excerpt && <p className="preview-excerpt">{excerpt}</p>}
        <div
          className="preview-blocks"
          dangerouslySetInnerHTML={{ __html: previewHtml }}
        />
      </div>
    </div>
  );
};

// Simple client-side block renderer for preview
function renderBlocksPreview(blocks: ContentBlock[]): string {
  if (!blocks || blocks.length === 0) {
    return '<p class="preview-empty">Start writing to see preview...</p>';
  }

  const sortedBlocks = blocks.sort((a, b) => a.block_order - b.block_order);

  return sortedBlocks.map(block => {
    try {
      const content = typeof block.content === 'string'
        ? JSON.parse(block.content)
        : block.content;

      switch (block.block_type) {
        case 'heading':
          const level = content.level || 2;
          return `<h${level} class="content-heading">${escapeHtml(content.text)}</h${level}>`;

        case 'paragraph':
          return `<p class="content-paragraph">${processFormatting(content.text)}</p>`;

        case 'accent_tip':
          const tipType = content.type || 'tip';
          const icon = getTipIcon(tipType);
          return `<aside class="accent-tip accent-tip--${tipType}">
            <div class="accent-tip__icon">${icon}</div>
            <div class="accent-tip__content">${processFormatting(content.text)}</div>
          </aside>`;

        case 'quote':
          let quoteHtml = `<blockquote class="content-quote">
            <p class="quote-text">${processFormatting(content.text)}</p>`;
          if (content.citation) {
            quoteHtml += `<cite class="quote-citation">— ${escapeHtml(content.citation)}</cite>`;
          }
          quoteHtml += '</blockquote>';
          return quoteHtml;

        case 'image':
          let imgHtml = `<figure class="content-image" style="text-align: ${content.alignment || 'center'}">
            <img src="${escapeHtml(content.url)}" alt="${escapeHtml(content.alt || '')}" class="responsive-image" />`;
          if (content.caption) {
            imgHtml += `<figcaption class="image-caption">${escapeHtml(content.caption)}</figcaption>`;
          }
          imgHtml += '</figure>';
          return imgHtml;

        case 'cta':
          const target = content.external ? '_blank' : '_self';
          const rel = content.external ? 'noopener noreferrer' : '';
          return `<div class="content-cta" style="text-align: center">
            <a href="${escapeHtml(content.url)}" class="cta-button cta-button--${content.type}" target="${target}" rel="${rel}">
              ${escapeHtml(content.text)}
            </a>
          </div>`;

        case 'divider':
          return '<hr class="content-divider" />';

        case 'list':
          const listTag = content.ordered ? 'ol' : 'ul';
          const items = content.items.map((item: string) =>
            `<li>${processFormatting(item)}</li>`
          ).join('\n');
          return `<${listTag} class="content-list">${items}</${listTag}>`;

        default:
          return `<!-- Unknown block type: ${block.block_type} -->`;
      }
    } catch (error) {
      console.error('Error rendering block:', error);
      return `<!-- Error rendering block -->`;
    }
  }).join('\n');
}

function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function processFormatting(text: string): string {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');
}

function getTipIcon(type: string): string {
  const icons: Record<string, string> = {
    tip: '💡',
    warning: '⚠️',
    info: 'ℹ️',
    success: '✅'
  };
  return icons[type] || icons.tip;
}

export default PreviewPanel;
