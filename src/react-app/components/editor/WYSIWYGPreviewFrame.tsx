import React, { useEffect, useRef } from 'react';
import { EditorContent, Editor } from '@tiptap/react';
import { COMPILED_TEMPLATES } from '../../../utils/compiled-templates.js';
import './WYSIWYGPreviewFrame.css';

interface WYSIWYGPreviewFrameProps {
  editor: Editor | null;
  title: string;
  category: string;
  author: string;
  publishedDate: string;
  featuredImageUrl: string;
  sidebarCollapsed: boolean;
}

export const WYSIWYGPreviewFrame: React.FC<WYSIWYGPreviewFrameProps> = ({
  editor,
  title,
  category,
  author,
  publishedDate,
  featuredImageUrl,
  sidebarCollapsed
}) => {
  const frameRef = useRef<HTMLDivElement>(null);

  // Inject blog CSS into the page (scoped to preview frame)
  useEffect(() => {
    if (!frameRef.current) return;

    // Load CDN stylesheets dynamically
    const cdnStylesheets = [
      'https://cdn.cruisemadeeasy.com/blog-css/core-variables.css',
      'https://cdn.cruisemadeeasy.com/blog-css/core-blocks.min.css',
      'https://cdn.cruisemadeeasy.com/blog-css/core-classic-theme.min.css',
      'https://cdn.cruisemadeeasy.com/blog-css/theme-main.min.css',
      'https://cdn.cruisemadeeasy.com/blog-css/theme-inline.min.css',
      'https://cdn.cruisemadeeasy.com/blog-css/component-header.css',
      'https://cdn.cruisemadeeasy.com/blog-css/component-hero.css',
      'https://cdn.cruisemadeeasy.com/blog-css/component-blog-cta.css',
      'https://cdn.cruisemadeeasy.com/blog-css/component-footer.css'
    ];

    const head = document.head;
    const loadedLinks: HTMLLinkElement[] = [];

    cdnStylesheets.forEach(href => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.dataset.wysiwyg = 'true';
      head.appendChild(link);
      loadedLinks.push(link);
    });

    // Cleanup on unmount
    return () => {
      loadedLinks.forEach(link => link.remove());
    };
  }, []);

  // Convert category slug to human-readable format
  const formatCategory = (slug: string): string => {
    if (!slug) return 'Uncategorized';
    return slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Replace placeholders in hero template
  const renderHero = () => {
    let heroHtml = COMPILED_TEMPLATES.HERO;
    heroHtml = heroHtml.replace('{{POST_TITLE}}', title || 'Untitled Post');
    heroHtml = heroHtml.replace('{{POST_AUTHOR}}', author || 'Cruise Made EASY');
    heroHtml = heroHtml.replace('{{POST_CATEGORY}}', formatCategory(category));
    heroHtml = heroHtml.replace('{{POST_DATE}}', publishedDate || new Date().toLocaleDateString());
    return heroHtml;
  };

  return (
    <div className={`wysiwyg-preview-frame ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`} ref={frameRef}>
      {/* Blog Hero with Featured Image */}
      <div className="blog-hero-preview" style={featuredImageUrl ? {
        background: `linear-gradient(0deg, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.3) 70%, transparent), linear-gradient(to left, rgba(12, 29, 61, 0.77) 0%, rgba(12, 29, 61, 0.77) 100%), url(${featuredImageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        minHeight: '400px',
        display: 'flex',
        alignItems: 'flex-end',
        padding: '2rem'
      } : {}}>
        <div dangerouslySetInnerHTML={{ __html: renderHero() }} style={featuredImageUrl ? { color: 'white' } : {}} />
      </div>

      {/* Editable Content Area */}
      <div className="blog-content-area">
        <div className="content-wrapper">
          <EditorContent editor={editor} className="wysiwyg-editor" />
        </div>
      </div>

      {/* Blog CTA */}
      <div
        className="blog-cta-preview"
        dangerouslySetInnerHTML={{ __html: COMPILED_TEMPLATES.BLOG_CTA }}
      />
    </div>
  );
};

export default WYSIWYGPreviewFrame;
