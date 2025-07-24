import { createReactBlockSpec } from '@blocknote/react';

// Example: Custom callout block that matches your design system
export const calloutBlock = createReactBlockSpec(
  {
    type: 'callout',
    propSchema: {
      type: {
        default: 'info',
        values: ['info', 'warning', 'error', 'success'],
      },
      title: {
        default: '',
      },
    },
    content: 'inline',
  },
  {
    render: (props) => {
      const { block, editor } = props;
      const { type, title } = block.props;
      
      // Map to your design system colors
      const typeStyles = {
        info: {
          background: 'var(--status-info-bg)',
          border: 'var(--border-focus)',
          text: 'var(--text-primary)',
        },
        warning: {
          background: 'var(--status-warning-bg)',
          border: 'var(--status-warning)',
          text: 'var(--text-primary)',
        },
        error: {
          background: 'var(--status-error-bg)',
          border: 'var(--status-error)',
          text: 'var(--text-primary)',
        },
        success: {
          background: 'var(--status-success-bg)',
          border: 'var(--status-success)',
          text: 'var(--text-primary)',
        },
      };
      
      const style = typeStyles[type as 'info' | 'warning' | 'error' | 'success'];
      
      return (
        <div
          style={{
            backgroundColor: style.background,
            borderLeft: `4px solid ${style.border}`,
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-4)',
            margin: 'var(--space-2) 0',
          }}
        >
          {title && (
            <div
              style={{
                fontWeight: '600',
                marginBottom: 'var(--space-2)',
                color: style.text,
              }}
            >
              {title}
            </div>
          )}
          <div
            style={{
              color: style.text,
            }}
          >
            {/* Inline content will be rendered here by BlockNote */}
          </div>
        </div>
      );
    },
  }
);

// Example: Custom code block with syntax highlighting
export const codeBlock = createReactBlockSpec(
  {
    type: 'code',
    propSchema: {
      language: {
        default: 'javascript',
        values: ['javascript', 'typescript', 'python', 'html', 'css'],
      },
    },
    content: 'none',
  },
  {
    render: (props) => {
      const { block } = props;
      const { language } = block.props;
      
      return (
        <div
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-primary)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-4)',
            margin: 'var(--space-2) 0',
            fontFamily: 'monospace',
            fontSize: '0.875rem',
          }}
        >
          <div
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-tertiary)',
              marginBottom: 'var(--space-2)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {language}
          </div>
          <pre
            style={{
              margin: 0,
              color: 'var(--text-primary)',
              whiteSpace: 'pre-wrap',
            }}
          >
            {/* Code content would be stored in block data */}
          </pre>
        </div>
      );
    },
  }
);

// Schema configuration with custom blocks
export const customBlockSchema = {
  // Include all default blocks
  // paragraph: defaultBlocks.paragraph,
  // heading: defaultBlocks.heading,
  // Add your custom blocks
  callout: calloutBlock,
  code: codeBlock,
}; 