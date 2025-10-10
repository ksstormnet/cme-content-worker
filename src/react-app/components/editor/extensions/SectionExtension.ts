/**
 * TipTap Extension for Section blocks with nested content support
 *
 * Provides a container block for grouping content with styling options:
 * - Background/text colors
 * - Padding presets
 * - Full-width layout option
 * - Style presets (default, accent, highlight)
 * - Nested block support
 */
import { Node, mergeAttributes } from '@tiptap/core';

export interface SectionOptions {
  paddingSizes: Array<'none' | 'small' | 'medium' | 'large'>;
  styles: Array<'default' | 'accent' | 'highlight'>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    section: {
      /**
       * Set a section block with the specified attributes
       */
      setSection: (attributes?: {
        backgroundColor?: string | null;
        textColor?: string | null;
        padding?: 'none' | 'small' | 'medium' | 'large';
        fullWidth?: boolean;
        style?: 'default' | 'accent' | 'highlight';
      }) => ReturnType;
      /**
       * Wrap the current selection in a section block
       */
      wrapInSection: (attributes?: {
        backgroundColor?: string | null;
        textColor?: string | null;
        padding?: 'none' | 'small' | 'medium' | 'large';
        fullWidth?: boolean;
        style?: 'default' | 'accent' | 'highlight';
      }) => ReturnType;
      /**
       * Extract content from the current section block
       */
      unwrapSection: () => ReturnType;
    };
  }
}

export const SectionExtension = Node.create<SectionOptions>({
  name: 'section',

  group: 'block',

  content: 'block+',

  defining: true,

  isolating: true,

  addOptions() {
    return {
      paddingSizes: ['none', 'small', 'medium', 'large'],
      styles: ['default', 'accent', 'highlight'],
    };
  },

  addAttributes() {
    return {
      backgroundColor: {
        default: null,
        parseHTML: element => {
          const color = element.getAttribute('data-background-color');
          return color || null;
        },
        renderHTML: attributes => {
          if (!attributes.backgroundColor) {
            return {};
          }
          return {
            'data-background-color': attributes.backgroundColor,
          };
        },
      },
      textColor: {
        default: null,
        parseHTML: element => {
          const color = element.getAttribute('data-text-color');
          return color || null;
        },
        renderHTML: attributes => {
          if (!attributes.textColor) {
            return {};
          }
          return {
            'data-text-color': attributes.textColor,
          };
        },
      },
      padding: {
        default: 'medium',
        parseHTML: element => {
          const padding = element.getAttribute('data-padding');
          return this.options.paddingSizes.includes(padding as any)
            ? padding
            : 'medium';
        },
        renderHTML: attributes => ({
          'data-padding': attributes.padding,
        }),
      },
      fullWidth: {
        default: false,
        parseHTML: element => element.getAttribute('data-full-width') === 'true',
        renderHTML: attributes => ({
          'data-full-width': attributes.fullWidth ? 'true' : 'false',
        }),
      },
      style: {
        default: 'default',
        parseHTML: element => {
          const style = element.getAttribute('data-style');
          return this.options.styles.includes(style as any)
            ? style
            : 'default';
        },
        renderHTML: attributes => ({
          'data-style': attributes.style,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'section[data-type="section"]',
      },
      {
        // WordPress Generateblocks compatibility
        tag: 'div.gbp-section',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const { backgroundColor, textColor, padding, fullWidth, style } = node.attrs;

    // Build CSS classes
    const classes = [
      'content-section',
      `section-padding--${padding}`,
      `section-style--${style}`,
    ];

    if (fullWidth) {
      classes.push('section-full-width');
    }

    // Build inline styles
    const styles: string[] = [];
    if (backgroundColor) {
      styles.push(`background-color: ${backgroundColor}`);
    }
    if (textColor) {
      styles.push(`color: ${textColor}`);
    }

    return [
      'section',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'section',
        class: classes.join(' '),
        style: styles.length > 0 ? styles.join('; ') : undefined,
      }),
      0, // Content placeholder for nested blocks
    ];
  },

  addCommands() {
    return {
      setSection:
        (attributes = {}) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: attributes,
            content: [
              {
                type: 'paragraph',
              },
            ],
          });
        },
      wrapInSection:
        (attributes = {}) =>
        ({ commands, state, chain }) => {
          // Get current selection
          const { from, to } = state.selection;

          // Check if selection is already in a section
          const isInSection = state.doc.resolve(from).parent.type.name === this.name;

          if (isInSection) {
            // If already in a section, just update attributes
            return commands.updateAttributes(this.name, attributes);
          }

          // Wrap selection in section
          return chain()
            .insertContentAt(
              { from, to },
              {
                type: this.name,
                attrs: attributes,
                content: state.doc.slice(from, to).content.toJSON(),
              }
            )
            .run();
        },
      unwrapSection:
        () =>
        ({ commands, state, tr }) => {
          const { $from, $to } = state.selection;

          // Find the section node
          let sectionDepth = -1;
          for (let d = $from.depth; d >= 0; d--) {
            if ($from.node(d).type.name === this.name) {
              sectionDepth = d;
              break;
            }
          }

          if (sectionDepth === -1) {
            return false;
          }

          // Get section node and position
          const section = $from.node(sectionDepth);
          const sectionPos = $from.start(sectionDepth) - 1;

          // Extract content from section
          const content = section.content;

          // Delete section and insert content at same position
          tr.delete(sectionPos, sectionPos + section.nodeSize);

          if (content.size > 0) {
            tr.insert(sectionPos, content);
          }

          return commands.setTextSelection({
            from: sectionPos,
            to: sectionPos + content.size,
          });
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      // Wrap selection in section
      'Mod-Alt-s': () => this.editor.commands.wrapInSection(),

      // Unwrap section
      'Mod-Shift-s': () => this.editor.commands.unwrapSection(),
    };
  },
});
