/**
 * Tiptap Extension for Image blocks (Phase 1 placeholder)
 * Phase 2 will integrate with media library
 */
import { Node, mergeAttributes } from '@tiptap/core';

export interface ImageOptions {
  inline: boolean;
  allowBase64: boolean;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    imagePlaceholder: {
      setImage: (options: {
        src: string;
        alt?: string;
        caption?: string;
        alignment?: 'left' | 'center' | 'right';
        size?: 'thumbnail' | 'medium' | 'large' | 'full';
      }) => ReturnType;
      setImageCaption: (caption: string | null) => ReturnType;
      setImageAlignment: (alignment: 'left' | 'center' | 'right') => ReturnType;
      setImageSize: (size: 'thumbnail' | 'medium' | 'large' | 'full') => ReturnType;
    };
  }
}

export const ImagePlaceholderExtension = Node.create<ImageOptions>({
  name: 'image',

  group: 'block',

  atom: true,

  addOptions() {
    return {
      inline: false,
      allowBase64: false,
    };
  },

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: element => element.getAttribute('src'),
        renderHTML: attributes => ({
          src: attributes.src,
        }),
      },
      alt: {
        default: null,
        parseHTML: element => element.getAttribute('alt'),
        renderHTML: attributes => ({
          alt: attributes.alt,
        }),
      },
      caption: {
        default: null,
        parseHTML: element => element.getAttribute('data-caption'),
        renderHTML: attributes => ({
          'data-caption': attributes.caption,
        }),
      },
      alignment: {
        default: 'center',
        parseHTML: element => element.getAttribute('data-alignment') || 'center',
        renderHTML: attributes => ({
          'data-alignment': attributes.alignment,
        }),
      },
      size: {
        default: 'large',
        parseHTML: element => element.getAttribute('data-size') || 'large',
        renderHTML: attributes => ({
          'data-size': attributes.size,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'img[src]',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const { caption } = node.attrs;

    if (caption) {
      return [
        'figure',
        {
          class: 'content-image',
          style: `text-align: ${node.attrs.alignment || 'center'}`,
        },
        [
          'img',
          mergeAttributes(HTMLAttributes, {
            draggable: false,
            style: 'max-width: 100%; height: auto;',
          }),
        ],
        [
          'figcaption',
          {
            class: 'image-caption',
            style: 'margin-top: 0.5rem; font-size: 0.875rem; color: #6b7280;',
          },
          caption,
        ],
      ];
    }

    return [
      'img',
      mergeAttributes(HTMLAttributes, {
        draggable: false,
        style: 'max-width: 100%; height: auto;',
      }),
    ];
  },

  addCommands() {
    return {
      setImage:
        options =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
      setImageCaption:
        caption =>
        ({ commands }) => {
          return commands.updateAttributes(this.name, { caption });
        },
      setImageAlignment:
        alignment =>
        ({ commands }) => {
          return commands.updateAttributes(this.name, { alignment });
        },
      setImageSize:
        size =>
        ({ commands }) => {
          return commands.updateAttributes(this.name, { size });
        },
    };
  },
});
