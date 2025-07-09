import { Extension } from '@tiptap/core';
import { ReactRenderer } from '@tiptap/react';
import Suggestion from '@tiptap/suggestion';
import tippy, { Instance as TippyInstance } from 'tippy.js';
import { TiptapSlashCommand } from './TiptapSlashCommand';

export interface SlashCommandItem {
  title: string;
  description: string;
  command: (props: any) => void;
}

export const SlashCommandExtension = Extension.create({
  name: 'slashCommand',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        startOfLine: false,
        command: ({ editor, range, props }: any) => {
          props.command(editor, range);
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});

let component: ReactRenderer | null = null;
let popup: TippyInstance | null = null;

export const SlashCommandSuggestion = {
  items: ({ query }: { query: string }) => {
    // The items are handled within the TiptapSlashCommand component
    // This just returns a placeholder to keep the suggestion plugin happy
    return [{ query }];
  },

  render: () => {
    return {
      onStart: (props: any) => {
        component = new ReactRenderer(TiptapSlashCommand, {
          props: {
            ...props,
            onSelect: (item: any) => {
              item.command(props.editor);
              props.command({ editor: props.editor, range: props.range, props: item });
            },
          },
          editor: props.editor,
        });

        if (!props.clientRect) {
          return;
        }

        popup = tippy('body', {
          getReferenceClientRect: props.clientRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'bottom-start',
          theme: 'slash-command',
          maxWidth: 'none',
          offset: [0, 8],
          popperOptions: {
            strategy: 'fixed',
          },
        })[0];
      },

      onUpdate(props: any) {
        component?.updateProps({
          ...props,
          onSelect: (item: any) => {
            item.command(props.editor);
            props.command({ editor: props.editor, range: props.range, props: item });
          },
        });

        if (!props.clientRect) {
          return;
        }

        popup?.setProps({
          getReferenceClientRect: props.clientRect,
        });
      },

      onKeyDown(props: any) {
        if (props.event.key === 'Escape') {
          popup?.hide();
          return true;
        }

        return (component?.ref as any)?.onKeyDown?.(props.event) || false;
      },

      onExit() {
        popup?.destroy();
        component?.destroy();
        popup = null;
        component = null;
      },
    };
  },
};

// Create the extension with the suggestion configuration
export const createSlashCommandExtension = () => {
  return SlashCommandExtension.configure({
    suggestion: SlashCommandSuggestion,
  });
};

export default createSlashCommandExtension; 