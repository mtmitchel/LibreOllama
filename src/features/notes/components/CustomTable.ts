import Table from '@tiptap/extension-table';
import { columnResizing, tableEditing } from 'prosemirror-tables';

const CustomTable = Table.extend({
  addProseMirrorPlugins() {
    const resizable = this.options.resizable;
    if (!resizable) {
      return [tableEditing()];
    }

    return [
      columnResizing({
        handleWidth: this.options.handleWidth,
        cellMinWidth: this.options.cellMinWidth,
        lastColumnResizable: this.options.lastColumnResizable,
      }),
      tableEditing(),
    ];
  },
}).configure({
  resizable: true,
});

export default CustomTable; 