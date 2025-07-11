import Table from '@tiptap/extension-table';
import { Plugin, PluginKey } from 'prosemirror-state';
import { columnResizing, tableEditing } from 'prosemirror-tables';

const CustomTable = Table.extend({
  addProseMirrorPlugins() {
    const { isResizable } = this.options;
    if (!isResizable) {
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