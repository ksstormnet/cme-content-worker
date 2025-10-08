/**
 * Tiptap Extension for CTA (Call-to-Action) button blocks
 */
import { Node, mergeAttributes } from '@tiptap/core';

export interface CTAOptions {
  types: Array<'primary' | 'secondary'>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    cta: {
      setCTA: (options: {
        text: string;
        url: string;
        type?: 'primary' | 'secondary';
        external?: boolean;
      }) => ReturnType;
    };
  }
}

export const CTAExtension = Node.create<CTAOptions>({
  name: 'cta',

  group: 'block',

  atom: true,

  addOptions() {
    return {
      types: ['primary', 'secondary'],
    };
  },

  addAttributes() {
    return {
      text: {
        default: 'Click Here',
        parseHTML: element => element.getAttribute('data-text'),
        renderHTML: attributes => ({
          'data-text': attributes.text,
        }),
      },
      url: {
        default: '',
        parseHTML: element => element.getAttribute('data-url'),
        renderHTML: attributes => ({
          'data-url': attributes.url,
        }),
      },
      buttonType: {
        default: 'primary',
        parseHTML: element => element.getAttribute('data-button-type') || 'primary',
        renderHTML: attributes => ({
          'data-button-type': attributes.buttonType,
        }),
      },
      external: {
        default: false,
        parseHTML: element => element.getAttribute('data-external') === 'true',
        renderHTML: attributes => ({
          'data-external': attributes.external,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="cta"]',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const { text, url, buttonType, external } = node.attrs;
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'cta',
        class: 'content-cta-editor',
        style: 'text-align: center; padding: 1rem; border: 2px dashed #ccc; border-radius: 0.5rem;',
      }),
      [
        'a',
        {
          href: url || '#',
          class: `cta-button cta-button--${buttonType}`,
          target: external ? '_blank' : '_self',
          rel: external ? 'noopener noreferrer' : '',
          style: 'padding: 0.75rem 1.5rem; border-radius: 0.5rem; text-decoration: none; display: inline-block; font-weight: 600;',
        },
        text || 'Click Here',
      ],
    ];
  },

  addCommands() {
    return {
      setCTA:
        options =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },
});
