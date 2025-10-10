/**
 * TipTap Extension for Columns Container
 *
 * Container node that holds 2-4 Column children with configurable layout
 * and gap spacing. Supports nested block content within each column.
 */
import { Node, mergeAttributes } from '@tiptap/core';
import { Node as PMNode } from '@tiptap/pm/model';
import { TextSelection } from '@tiptap/pm/state';

export interface ColumnsOptions {
  columnCounts: Array<2 | 3 | 4>;
  gaps: Array<'none' | 'small' | 'medium' | 'large'>;
  alignments: Array<'left' | 'center' | 'right'>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    columns: {
      /**
       * Insert a new columns block with N empty columns
       */
      insertColumns: (columnCount?: 2 | 3 | 4) => ReturnType;

      /**
       * Set the number of columns (redistributes content)
       */
      setColumnCount: (count: 2 | 3 | 4) => ReturnType;

      /**
       * Set the gap size between columns
       */
      setColumnGap: (gap: 'none' | 'small' | 'medium' | 'large') => ReturnType;

      /**
       * Set the column alignment
       */
      setColumnAlignment: (alignment: 'left' | 'center' | 'right') => ReturnType;
    };
  }
}

export const ColumnsExtension = Node.create<ColumnsOptions>({
  name: 'columns',

  group: 'block',

  content: 'column{2,4}',

  defining: true,

  addOptions() {
    return {
      columnCounts: [2, 3, 4],
      gaps: ['none', 'small', 'medium', 'large'],
      alignments: ['left', 'center', 'right'],
    };
  },

  addAttributes() {
    return {
      columnCount: {
        default: 2,
        parseHTML: element => {
          const count = parseInt(element.getAttribute('data-column-count') || '2', 10);
          return [2, 3, 4].includes(count) ? count : 2;
        },
        renderHTML: attributes => ({
          'data-column-count': attributes.columnCount,
        }),
      },
      gap: {
        default: 'medium',
        parseHTML: element => element.getAttribute('data-gap') || 'medium',
        renderHTML: attributes => ({
          'data-gap': attributes.gap,
        }),
      },
      alignment: {
        default: 'left',
        parseHTML: element => element.getAttribute('data-alignment') || 'left',
        renderHTML: attributes => ({
          'data-alignment': attributes.alignment,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="columns"]',
      },
      {
        tag: 'div.content-columns',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const { columnCount, gap, alignment } = node.attrs;

    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'columns',
        class: `content-columns columns-count--${columnCount} columns-gap--${gap} columns-align--${alignment}`,
      }),
      0, // Content placeholder for child column nodes
    ];
  },

  addCommands() {
    return {
      insertColumns:
        (columnCount = 2) =>
        ({ commands, state }) => {
          // Validate column count
          if (![2, 3, 4].includes(columnCount)) {
            console.warn(`Invalid column count: ${columnCount}. Using 2.`);
            columnCount = 2;
          }

          // Create array of column nodes, each with an initial paragraph
          const columns = Array.from({ length: columnCount }, () => ({
            type: 'column',
            content: [
              {
                type: 'paragraph',
              },
            ],
          }));

          // Insert the columns block with column children
          return commands.insertContent({
            type: this.name,
            attrs: {
              columnCount,
              gap: 'medium',
              alignment: 'left',
            },
            content: columns,
          });
        },

      setColumnCount:
        count =>
        ({ tr, state, dispatch }) => {
          // Validate column count
          if (![2, 3, 4].includes(count)) {
            console.warn(`Invalid column count: ${count}`);
            return false;
          }

          const { selection } = state;
          const { $from } = selection;

          // Find the columns node
          let columnsPos: number | null = null;
          let columnsNode: PMNode | null = null;

          for (let d = $from.depth; d > 0; d--) {
            const node = $from.node(d);
            if (node.type.name === 'columns') {
              columnsPos = $from.before(d);
              columnsNode = node;
              break;
            }
          }

          if (!columnsPos || !columnsNode) {
            return false;
          }

          if (!dispatch) {
            return true;
          }

          const currentCount = columnsNode.attrs.columnCount;
          const currentColumns: PMNode[] = [];

          // Collect current column nodes
          columnsNode.forEach(child => {
            if (child.type.name === 'column') {
              currentColumns.push(child);
            }
          });

          let newColumns: PMNode[];

          if (count > currentCount) {
            // Adding columns - keep existing columns and add empty ones
            const emptyColumns = Array.from(
              { length: count - currentCount },
              () =>
                state.schema.nodes.column.create({}, [
                  state.schema.nodes.paragraph.create(),
                ])
            );
            newColumns = [...currentColumns, ...emptyColumns];
          } else {
            // Removing columns - keep first N columns, merge content from removed columns into last kept column
            const keptColumns = currentColumns.slice(0, count);
            const removedColumns = currentColumns.slice(count);

            // Collect content from removed columns
            const orphanedContent: PMNode[] = [];
            removedColumns.forEach(col => {
              col.forEach(contentNode => {
                orphanedContent.push(contentNode);
              });
            });

            // If there's orphaned content, append it to the last kept column
            if (orphanedContent.length > 0 && keptColumns.length > 0) {
              const lastColumn = keptColumns[keptColumns.length - 1];
              const lastColumnContent: PMNode[] = [];
              lastColumn.forEach(node => lastColumnContent.push(node));

              // Recreate last column with appended content
              keptColumns[keptColumns.length - 1] = state.schema.nodes.column.create(
                lastColumn.attrs,
                [...lastColumnContent, ...orphanedContent]
              );
            }

            newColumns = keptColumns;
          }

          // Create new columns node with updated column count and children
          const newColumnsNode = state.schema.nodes.columns.create(
            {
              ...columnsNode.attrs,
              columnCount: count,
            },
            newColumns
          );

          // Replace the old columns node
          tr.replaceWith(columnsPos, columnsPos + columnsNode.nodeSize, newColumnsNode);

          dispatch(tr);
          return true;
        },

      setColumnGap:
        gap =>
        ({ tr, state, dispatch }) => {
          const { selection } = state;
          const { $from } = selection;

          // Find the columns node
          for (let d = $from.depth; d > 0; d--) {
            const node = $from.node(d);
            if (node.type.name === 'columns') {
              const pos = $from.before(d);
              if (dispatch) {
                tr.setNodeMarkup(pos, undefined, { ...node.attrs, gap });
                dispatch(tr);
              }
              return true;
            }
          }

          return false;
        },

      setColumnAlignment:
        alignment =>
        ({ tr, state, dispatch }) => {
          const { selection } = state;
          const { $from } = selection;

          // Find the columns node
          for (let d = $from.depth; d > 0; d--) {
            const node = $from.node(d);
            if (node.type.name === 'columns') {
              const pos = $from.before(d);
              if (dispatch) {
                tr.setNodeMarkup(pos, undefined, { ...node.attrs, alignment });
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
      // Insert 2-column layout
      'Mod-Shift-2': () => this.editor.commands.insertColumns(2),

      // Insert 3-column layout
      'Mod-Shift-3': () => this.editor.commands.insertColumns(3),

      // Insert 4-column layout
      'Mod-Shift-4': () => this.editor.commands.insertColumns(4),
    };
  },
});
