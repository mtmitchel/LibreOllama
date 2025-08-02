import { Plugin } from 'prosemirror-state';

export function createLinkInterceptPlugin(onLinkClick: (url: string) => void) {
  return new Plugin({
    props: {
      handleDOMEvents: {
        click: (view, event) => {
          // Find if the clicked element is a link or inside a link
          let target = event.target as HTMLElement;
          let linkElement = null;
          
          // Walk up the DOM tree to find a link element
          while (target && target !== view.dom) {
            if (target.tagName === 'A' && target.href) {
              linkElement = target as HTMLAnchorElement;
              break;
            }
            target = target.parentElement as HTMLElement;
          }
          
          if (linkElement) {
            const href = linkElement.href;
            
            // Check if it's an external HTTP/HTTPS link
            if (href.startsWith('http://') || href.startsWith('https://')) {
              // Prevent default browser navigation
              event.preventDefault();
              event.stopPropagation();
              
              // Call the custom handler
              onLinkClick(href);
              
              // Return true to prevent other handlers
              return true;
            }
          }
          
          // Allow normal editor behavior for non-links
          return false;
        }
      }
    }
  });
}