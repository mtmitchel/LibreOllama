import { invoke } from '@tauri-apps/api/core';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';

export interface BrowserWindowOptions {
  url: string;
  title?: string;
  width?: number;
  height?: number;
}

export async function openBrowserWindow(options: BrowserWindowOptions): Promise<string> {
  const label = await invoke<string>('open_browser_window', {
    options: {
      url: options.url,
      title: options.title ?? 'Browser',
      width: options.width ?? 1200,
      height: options.height ?? 800,
    },
  });
  // Ensure window exists (will be created by backend)
  WebviewWindow.getByLabel(label);
  return label;
}

export function isHttpUrl(href: string): boolean {
  try {
    const u = new URL(href);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}




