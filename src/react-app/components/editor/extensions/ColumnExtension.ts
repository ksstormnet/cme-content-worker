/**
 * TipTap Extension for Individual Column
 *
 * Child node of Columns container that holds block content.
 * Must be isolated to prevent content leaking between columns.
 */
import { Node, mergeAttributes } from '@tiptap/core';
import { Node as PMNode } from '@tiptap/pm/model';
import { TextSelection } from '@tiptap/pm/state';

export interface ColumnOptions {
  widths: Array<string>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    column: {
      /**
       * Set the width of the current column (flex-basis value)
       */
      setColumnWidth: (width: string | null) => ReturnType;
    };
  }
}

export const ColumnExtension = Node.create<ColumnOptions>({
  name: 'column',

  content: 'block+',

  defining: true,

  isolating: true, // Critical - prevents content from leaking between columns

  addOptions() {
    return {
      widths: ['auto', '25%', '33.333%', '50%', '66.666%', '75%'],
    };
  },

  addAttributes() {
    return {
      width: {
        default: null,
        parseHTML: element => element.getAttribute('data-width') || null,
        renderHTML: attributes => {
          if (!attributes.width) {
            return {};
          }
          return {
            'data-width': attributes.width,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="column"]',
      },
      {
        tag: 'div.content-column',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const { width } = node.attrs;

    // Build style object
    const style: Record<string, string> = {};
    if (width) {
      style['flex-basis'] = width;
    }

    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'column',
        class: 'content-column',
        style: Object.keys(style).length > 0
          ? Object.entries(style).map(([key, value]) => `${key}: ${value}`).join('; ')
          : undefined,
      }),
      0, // Content placeholder for block nodes
    ];
  },

  addCommands() {
    return {
      setColumnWidth:
        width =>
        ({ tr, state, dispatch }) => {
          const { selection } = state;
          const { $from } = selection;

          // Find the column node
          for (let d = $from.depth; d > 0; d--) {
            const node = $from.node(d);
            if (node.type.name === 'column') {
              const pos = $from.before(d);
              if (dispatch) {
                tr.setNodeMarkup(pos, undefined, { ...node.attrs, width });
                dispatch(tr);
              }
              return true;
            }
          }

          return false;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      // Backspace at the start of an empty column - remove the entire columns block
      Backspace: ({ editor }) => {
        const { state } = editor;
        const { selection } = state;
        const { $from, empty } = selection;

        // Only proceed if selection is empty (no text selected)
        if (!empty) {
          return false;
        }

        // Check if we're in a column
        let columnDepth = -1;
        for (let d = $from.depth; d > 0; d--) {
          if ($from.node(d).type.name === 'column') {
            columnDepth = d;
            break;
          }
        }

        if (columnDepth === -1) {
          return false;
        }

        const column = $from.node(columnDepth);

        // Check if cursor is at the start of the column
        const columnStart = $from.start(columnDepth);
        if ($from.pos !== columnStart) {
          return false;
        }

        // Check if column is empty (only has one empty paragraph)
        if (column.childCount !== 1) {
          return false;
        }

        const firstChild = column.firstChild;
        if (!firstChild || firstChild.type.name !== 'paragraph' || firstChild.content.size > 0) {
          return false;
        }

        // Find the columns parent
        let columnsDepth = -1;
        for (let d = columnDepth - 1; d > 0; d--) {
          if ($from.node(d).type.name === 'columns') {
            columnsDepth = d;
            break;
          }
        }

        if (columnsDepth === -1) {
          return false;
        }

        const columns = $from.node(columnsDepth);
        const columnsPos = $from.before(columnsDepth);

        // Check if ALL columns are empty
        let allEmpty = true;
        columns.forEach(col => {
          if (col.type.name !== 'column') {
            return;
          }
          if (col.childCount !== 1) {
            allEmpty = false;
            return;
          }
          const child = col.firstChild;
          if (!child || child.type.name !== 'paragraph' || child.content.size > 0) {
            allEmpty = false;
          }
        });

        // If all columns are empty, delete the entire columns block
        if (allEmpty) {
          const tr = state.tr;
          tr.delete(columnsPos, columnsPos + columns.nodeSize);

          // Insert a paragraph to replace the deleted columns
          tr.insert(columnsPos, state.schema.nodes.paragraph.create());

          // Set selection to the new paragraph
          const newSelection = TextSelection.near(tr.doc.resolve(columnsPos + 1));
          tr.setSelection(newSelection);

          editor.view.dispatch(tr);
          return true;
        }

        return false;
      },

      // Tab - move to next column
      Tab: ({ editor }) => {
        const { state } = editor;
        const { selection } = state;
        const { $from } = selection;

        // Find current column
        let columnDepth = -1;
        for (let d = $from.depth; d > 0; d--) {
          if ($from.node(d).type.name === 'column') {
            columnDepth = d;
            break;
          }
        }

        if (columnDepth === -1) {
          return false;
        }

        // Find columns parent
        let columnsDepth = -1;
        for (let d = columnDepth - 1; d > 0; d--) {
          if ($from.node(d).type.name === 'columns') {
            columnsDepth = d;
            break;
          }
        }

        if (columnsDepth === -1) {
          return false;
        }

        const columns = $from.node(columnsDepth);
        const currentColumnIndex = $from.index(columnsDepth);

        // If not the last column, move to next column
        if (currentColumnIndex < columns.childCount - 1) {
          const nextColumnPos = $from.after(columnDepth) + 1;
          const tr = state.tr;
          const newSelection = TextSelection.near(tr.doc.resolve(nextColumnPos));
          tr.setSelection(newSelection);
          editor.view.dispatch(tr);
          return true;
        }

        return false;
      },

      // Shift+Tab - move to previous column
      'Shift-Tab': ({ editor }) => {
        const { state } = editor;
        const { selection } = state;
        const { $from } = selection;

        // Find current column
        let columnDepth = -1;
        for (let d = $from.depth; d > 0; d--) {
          if ($from.node(d).type.name === 'column') {
            columnDepth = d;
            break;
          }
        }

        if (columnDepth === -1) {
          return false;
        }

        // Find columns parent
        let columnsDepth = -1;
        for (let d = columnDepth - 1; d > 0; d--) {
          if ($from.node(d).type.name === 'columns') {
            columnsDepth = d;
            break;
          }
        }

        if (columnsDepth === -1) {
          return false;
        }

        const currentColumnIndex = $from.index(columnsDepth);

        // If not the first column, move to previous column
        if (currentColumnIndex > 0) {
          const prevColumnPos = $from.before(columnDepth) - 1;
          const tr = state.tr;
          const resolvedPos = tr.doc.resolve(prevColumnPos);

          // Find the last position in the previous column
          const prevColumn = resolvedPos.node(columnDepth);
          const prevColumnEnd = prevColumnPos;

          const newSelection = TextSelection.near(tr.doc.resolve(prevColumnEnd));
          tr.setSelection(newSelection);
          editor.view.dispatch(tr);
          return true;
        }

        return false;
      },
    };
  },
});
