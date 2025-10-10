/**
 * Tiptap Extension for Accent Tip / Callout blocks
 */
import { Node, mergeAttributes } from '@tiptap/core';

export interface AccentTipOptions {
  types: Array<'tip' | 'warning' | 'alert' | 'info' | 'success'>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    accentTip: {
      setAccentTip: (type?: 'tip' | 'warning' | 'alert' | 'info' | 'success') => ReturnType;
      toggleAccentTip: (type?: 'tip' | 'warning' | 'alert' | 'info' | 'success') => ReturnType;
    };
  }
}

export const AccentTipExtension = Node.create<AccentTipOptions>({
  name: 'accentTip',

  group: 'block',

  content: 'inline*',

  defining: true,

  addOptions() {
    return {
      types: ['tip', 'warning', 'alert', 'info', 'success'],
    };
  },

  addAttributes() {
    return {
      type: {
        default: 'tip',
        parseHTML: element => element.getAttribute('data-type') || 'tip',
        renderHTML: attributes => {
          return {
            'data-type': attributes.type,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="accent-tip"]',
      },
      {
        tag: 'aside.accent-tip',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const type = node.attrs.type || 'tip';
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'accent-tip',
        class: `accent-tip accent-tip--${type}`,
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setAccentTip:
        (type = 'tip') =>
        ({ commands }) => {
          return commands.setNode(this.name, { type });
        },
      toggleAccentTip:
        (type = 'tip') =>
        ({ commands }) => {
          return commands.toggleNode(this.name, 'paragraph', { type });
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-t': () => this.editor.commands.toggleAccentTip('tip'),
      'Mod-Shift-w': () => this.editor.commands.toggleAccentTip('warning'),
      'Mod-Shift-a': () => this.editor.commands.toggleAccentTip('alert'),
      'Mod-Shift-i': () => this.editor.commands.toggleAccentTip('info'),
      'Mod-Shift-s': () => this.editor.commands.toggleAccentTip('success'),
    };
  },
});
