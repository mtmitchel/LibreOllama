import type { Story } from '@ladle/react';
import React from 'react';

export const DesignTokens: Story = () => {
  return (
    <div className="space-y-12 bg-primary p-8">
      <div>
        <h1 className="mb-4 text-3xl font-bold text-primary">LibreOllama Design Tokens</h1>
        <p className="text-secondary">
          Comprehensive reference for all design tokens in the LibreOllama design system.
          These tokens ensure consistency across the entire application.
        </p>
      </div>

      {/* Color Tokens */}
      <section>
        <h2 className="mb-6 text-2xl font-semibold text-primary">Color Tokens</h2>
        
        <div className="space-y-8">
          {/* Primary Colors */}
          <div>
            <h3 className="mb-4 text-lg font-medium text-primary">Primary & Accent Colors</h3>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="border-border-default rounded-lg border bg-surface p-4">
                <div className="mb-3 h-16 w-full rounded bg-accent-primary"></div>
                <div className="text-sm">
                  <div className="font-medium text-primary">accent-primary</div>
                  <div className="text-secondary">Primary brand color</div>
                </div>
              </div>
              
              <div className="border-border-default rounded-lg border bg-surface p-4">
                <div className="mb-3 h-16 w-full rounded bg-accent-soft"></div>
                <div className="text-sm">
                  <div className="font-medium text-primary">accent-soft</div>
                  <div className="text-secondary">Subtle accent background</div>
                </div>
              </div>
            </div>
          </div>

          {/* Background Colors */}
          <div>
            <h3 className="mb-4 text-lg font-medium text-primary">Background Colors</h3>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="border-border-default rounded-lg border bg-surface p-4">
                <div className="border-border-subtle mb-3 h-16 w-full rounded border bg-primary"></div>
                <div className="text-sm">
                  <div className="font-medium text-primary">bg-primary</div>
                  <div className="text-secondary">Main app background</div>
                </div>
              </div>
              
              <div className="border-border-default rounded-lg border bg-surface p-4">
                <div className="border-border-subtle mb-3 h-16 w-full rounded border bg-secondary"></div>
                <div className="text-sm">
                  <div className="font-medium text-primary">bg-secondary</div>
                  <div className="text-secondary">Content area background</div>
                </div>
              </div>
              
              <div className="border-border-default rounded-lg border bg-surface p-4">
                <div className="border-border-subtle mb-3 h-16 w-full rounded border bg-tertiary"></div>
                <div className="text-sm">
                  <div className="font-medium text-primary">bg-tertiary</div>
                  <div className="text-secondary">Subtle background</div>
                </div>
              </div>
              
              <div className="border-border-default rounded-lg border bg-surface p-4">
                <div className="border-border-subtle mb-3 h-16 w-full rounded border bg-surface"></div>
                <div className="text-sm">
                  <div className="font-medium text-primary">bg-surface</div>
                  <div className="text-secondary">Interactive surfaces</div>
                </div>
              </div>
            </div>
          </div>

          {/* Text Colors */}
          <div>
            <h3 className="mb-4 text-lg font-medium text-primary">Text Colors</h3>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="border-border-default rounded-lg border bg-surface p-4">
                <div className="mb-2 text-lg font-medium text-primary">Primary Text</div>
                <div className="text-sm">
                  <div className="font-medium text-primary">text-primary</div>
                  <div className="text-secondary">Main content text</div>
                </div>
              </div>
              
              <div className="border-border-default rounded-lg border bg-surface p-4">
                <div className="mb-2 text-lg font-medium text-secondary">Secondary Text</div>
                <div className="text-sm">
                  <div className="font-medium text-primary">text-secondary</div>
                  <div className="text-secondary">Descriptive text</div>
                </div>
              </div>
              
              <div className="border-border-default rounded-lg border bg-surface p-4">
                <div className="mb-2 text-lg font-medium text-tertiary">Tertiary Text</div>
                <div className="text-sm">
                  <div className="font-medium text-primary">text-tertiary</div>
                  <div className="text-secondary">Subtle/helper text</div>
                </div>
              </div>
              
              <div className="border-border-default rounded-lg border bg-surface p-4">
                <div className="mb-2 text-lg font-medium text-muted">Muted Text</div>
                <div className="text-sm">
                  <div className="font-medium text-primary">text-muted</div>
                  <div className="text-secondary">Disabled/muted text</div>
                </div>
              </div>
            </div>
          </div>

          {/* State Colors */}
          <div>
            <h3 className="mb-4 text-lg font-medium text-primary">State Colors</h3>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="border-border-default rounded-lg border bg-surface p-4">
                <div className="flex flex-col items-center space-y-2">
                  <div className="h-12 w-full rounded bg-success"></div>
                  <div className="bg-success-bg h-12 w-full rounded"></div>
                  <div className="text-sm font-medium text-success">Success</div>
                </div>
                <div className="mt-2 text-xs text-secondary">success, success-bg</div>
              </div>
              
              <div className="border-border-default rounded-lg border bg-surface p-4">
                <div className="flex flex-col items-center space-y-2">
                  <div className="h-12 w-full rounded bg-warning"></div>
                  <div className="bg-warning-bg h-12 w-full rounded"></div>
                  <div className="text-sm font-medium text-warning">Warning</div>
                </div>
                <div className="mt-2 text-xs text-secondary">warning, warning-bg</div>
              </div>
              
              <div className="border-border-default rounded-lg border bg-surface p-4">
                <div className="flex flex-col items-center space-y-2">
                  <div className="h-12 w-full rounded bg-error"></div>
                  <div className="bg-error-bg h-12 w-full rounded"></div>
                  <div className="text-sm font-medium text-error">Error</div>
                </div>
                <div className="mt-2 text-xs text-secondary">error, error-bg</div>
              </div>
            </div>
          </div>

          {/* Border Colors */}
          <div>
            <h3 className="mb-4 text-lg font-medium text-primary">Border Colors</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="border-border-default rounded-lg border bg-surface p-4">
                <div className="border-border-default mb-3 flex h-16 w-full items-center justify-center rounded border-2 text-sm text-secondary">
                  Default Border
                </div>
                <div className="text-sm">
                  <div className="font-medium text-primary">border-default</div>
                  <div className="text-secondary">Standard component borders</div>
                </div>
              </div>
              
              <div className="border-border-default rounded-lg border bg-surface p-4">
                <div className="border-border-subtle mb-3 flex h-16 w-full items-center justify-center rounded border-2 text-sm text-secondary">
                  Subtle Border
                </div>
                <div className="text-sm">
                  <div className="font-medium text-primary">border-subtle</div>
                  <div className="text-secondary">Subtle separators</div>
                </div>
              </div>
              
              <div className="border-border-default rounded-lg border bg-surface p-4">
                <div className="border-border-primary mb-3 flex h-16 w-full items-center justify-center rounded border-2 text-sm text-secondary">
                  Primary Border
                </div>
                <div className="text-sm">
                  <div className="font-medium text-primary">border-primary</div>
                  <div className="text-secondary">Emphasized borders</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Spacing Tokens */}
      <section>
        <h2 className="mb-6 text-2xl font-semibold text-primary">Spacing Tokens</h2>
        
        <div className="border-border-default rounded-lg border bg-surface p-6">
          <h3 className="mb-4 text-lg font-medium text-primary">Tailwind Spacing Scale</h3>
          <div className="space-y-4">
            {[
              { class: 'p-1', size: '4px', usage: 'Tight padding' },
              { class: 'p-2', size: '8px', usage: 'Small padding' },
              { class: 'p-3', size: '12px', usage: 'Default padding' },
              { class: 'p-4', size: '16px', usage: 'Medium padding' },
              { class: 'p-6', size: '24px', usage: 'Large padding' },
              { class: 'p-8', size: '32px', usage: 'XL padding' },
              { class: 'p-12', size: '48px', usage: 'XXL padding' }
            ].map((item) => (
              <div key={item.class} className="flex items-center gap-4">
                <div className="w-20 font-mono text-sm text-primary">{item.class}</div>
                <div className="w-16 text-sm text-secondary">{item.size}</div>
                <div className={`bg-accent-soft ${item.class} rounded`}>
                  <div className="size-8 rounded bg-accent-primary"></div>
                </div>
                <div className="text-sm text-secondary">{item.usage}</div>
              </div>
            ))}
          </div>
          
          <div className="border-border-subtle mt-6 border-t pt-6">
            <h4 className="mb-3 font-medium text-primary">Common Spacing Patterns</h4>
            <div className="space-y-2 text-sm">
              <div><code className="rounded bg-tertiary px-2 py-1 text-xs">space-y-4</code> - Vertical stack spacing</div>
              <div><code className="rounded bg-tertiary px-2 py-1 text-xs">space-x-2</code> - Horizontal spacing</div>
              <div><code className="rounded bg-tertiary px-2 py-1 text-xs">gap-4</code> - Grid/flex gap</div>
              <div><code className="rounded bg-tertiary px-2 py-1 text-xs">divide-y divide-border-subtle</code> - Divider lines</div>
            </div>
          </div>
        </div>
      </section>

      {/* Typography Tokens */}
      <section>
        <h2 className="mb-6 text-2xl font-semibold text-primary">Typography Tokens</h2>
        
        <div className="space-y-6">
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 text-lg font-medium text-primary">Text Sizes</h3>
            <div className="space-y-3">
              <div className="text-xs text-primary">text-xs: Extra small text (12px)</div>
              <div className="text-sm text-primary">text-sm: Small text (14px)</div>
              <div className="text-base text-primary">text-base: Base text (16px)</div>
              <div className="text-lg text-primary">text-lg: Large text (18px)</div>
              <div className="text-xl text-primary">text-xl: Extra large text (20px)</div>
              <div className="text-2xl text-primary">text-2xl: 2X large text (24px)</div>
              <div className="text-3xl text-primary">text-3xl: 3X large text (30px)</div>
            </div>
          </div>
          
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 text-lg font-medium text-primary">Font Weights</h3>
            <div className="space-y-3">
              <div className="font-normal text-primary">font-normal: Normal weight (400)</div>
              <div className="font-medium text-primary">font-medium: Medium weight (500)</div>
              <div className="font-semibold text-primary">font-semibold: Semibold weight (600)</div>
              <div className="font-bold text-primary">font-bold: Bold weight (700)</div>
            </div>
          </div>
          
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 text-lg font-medium text-primary">Line Heights</h3>
            <div className="space-y-4">
              <div>
                <div className="mb-1 text-sm font-medium text-primary">leading-tight</div>
                <div className="leading-tight text-secondary">
                  This text demonstrates tight line height spacing. Notice how the lines are closer together, creating a more compact appearance that works well for headings and short text blocks.
                </div>
              </div>
              <div>
                <div className="mb-1 text-sm font-medium text-primary">leading-relaxed</div>
                <div className="leading-relaxed text-secondary">
                  This text shows relaxed line height spacing. The extra space between lines improves readability for longer content and creates a more comfortable reading experience.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Animation Tokens */}
      <section>
        <h2 className="mb-6 text-2xl font-semibold text-primary">Animation Tokens</h2>
        
        <div className="space-y-6">
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 text-lg font-medium text-primary">Duration Scale</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-3">
                <div className="font-medium text-primary">150ms - Micro</div>
                <div className="mb-3 text-sm text-secondary">Hover, focus, button press</div>
                <button className="hover:bg-accent-primary/90 w-full rounded bg-accent-primary p-2 text-white transition-colors duration-150">
                  Hover me
                </button>
              </div>
              
              <div className="space-y-3">
                <div className="font-medium text-primary">200ms - State</div>
                <div className="mb-3 text-sm text-secondary">Active states, selection</div>
                <button className="border-border-default w-full rounded border bg-secondary p-2 transition-all duration-200 hover:border-accent-primary hover:shadow-sm">
                  Hover me
                </button>
              </div>
              
              <div className="space-y-3">
                <div className="font-medium text-primary">300ms - Layout</div>
                <div className="mb-3 text-sm text-secondary">Modal, accordion, drawer</div>
                <button className="border-border-default w-full rounded border bg-secondary p-2 transition-all duration-300 hover:scale-105">
                  Hover me
                </button>
              </div>
              
              <div className="space-y-3">
                <div className="font-medium text-primary">500ms - Complex</div>
                <div className="mb-3 text-sm text-secondary">Page transitions</div>
                <button className="border-border-default w-full rounded border bg-secondary p-2 transition-all duration-500 hover:rotate-3 hover:scale-110">
                  Hover me
                </button>
              </div>
            </div>
          </div>
          
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 text-lg font-medium text-primary">Easing Functions</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-3">
                <div className="font-medium text-primary">ease-out</div>
                <div className="mb-3 text-sm text-secondary">Most UI transitions</div>
                <div className="h-2 w-full overflow-hidden rounded bg-tertiary">
                  <div className="h-full w-0 bg-accent-primary transition-all duration-500 ease-out hover:w-full"></div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="font-medium text-primary">ease-in-out</div>
                <div className="mb-3 text-sm text-secondary">Balanced motion</div>
                <div className="h-2 w-full overflow-hidden rounded bg-tertiary">
                  <div className="h-full w-0 bg-success transition-all duration-500 ease-in-out hover:w-full"></div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="font-medium text-primary">ease-linear</div>
                <div className="mb-3 text-sm text-secondary">Loading indicators</div>
                <div className="h-2 w-full overflow-hidden rounded bg-tertiary">
                  <div className="h-full w-0 bg-warning transition-all duration-500 ease-linear hover:w-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Shadow Tokens */}
      <section>
        <h2 className="mb-6 text-2xl font-semibold text-primary">Shadow Tokens</h2>
        
        <div className="border-border-default rounded-lg border bg-surface p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="mb-3 flex h-16 w-full items-center justify-center rounded bg-surface text-sm text-secondary shadow-sm">
                Small
              </div>
              <div className="text-sm font-medium text-primary">shadow-sm</div>
              <div className="text-xs text-secondary">Subtle elevation</div>
            </div>
            
            <div className="text-center">
              <div className="mb-3 flex h-16 w-full items-center justify-center rounded bg-surface text-sm text-secondary shadow-md">
                Medium
              </div>
              <div className="text-sm font-medium text-primary">shadow-md</div>
              <div className="text-xs text-secondary">Card elevation</div>
            </div>
            
            <div className="text-center">
              <div className="mb-3 flex h-16 w-full items-center justify-center rounded bg-surface text-sm text-secondary shadow-lg">
                Large
              </div>
              <div className="text-sm font-medium text-primary">shadow-lg</div>
              <div className="text-xs text-secondary">Modal elevation</div>
            </div>
            
            <div className="text-center">
              <div className="mb-3 flex h-16 w-full items-center justify-center rounded bg-surface text-sm text-secondary shadow-xl">
                Extra Large
              </div>
              <div className="text-sm font-medium text-primary">shadow-xl</div>
              <div className="text-xs text-secondary">High elevation</div>
            </div>
          </div>
        </div>
      </section>

      {/* Border Radius Tokens */}
      <section>
        <h2 className="mb-6 text-2xl font-semibold text-primary">Border Radius Tokens</h2>
        
        <div className="border-border-default rounded-lg border bg-surface p-6">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            <div className="text-center">
              <div className="mb-3 h-16 w-full rounded-sm border border-accent-primary bg-accent-soft"></div>
              <div className="text-sm font-medium text-primary">rounded-sm</div>
              <div className="text-xs text-secondary">Small radius (2px)</div>
            </div>
            
            <div className="text-center">
              <div className="mb-3 h-16 w-full rounded-md border border-accent-primary bg-accent-soft"></div>
              <div className="text-sm font-medium text-primary">rounded-md</div>
              <div className="text-xs text-secondary">Medium radius (6px)</div>
            </div>
            
            <div className="text-center">
              <div className="mb-3 h-16 w-full rounded-lg border border-accent-primary bg-accent-soft"></div>
              <div className="text-sm font-medium text-primary">rounded-lg</div>
              <div className="text-xs text-secondary">Large radius (8px)</div>
            </div>
            
            <div className="text-center">
              <div className="mb-3 h-16 w-full rounded-xl border border-accent-primary bg-accent-soft"></div>
              <div className="text-sm font-medium text-primary">rounded-xl</div>
              <div className="text-xs text-secondary">XL radius (12px)</div>
            </div>
          </div>
        </div>
      </section>

      {/* Usage Guidelines */}
      <section>
        <h2 className="mb-6 text-2xl font-semibold text-primary">Usage Guidelines</h2>
        
        <div className="space-y-6">
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 text-lg font-medium text-primary">Do's and Don'ts</h3>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div>
                <h4 className="mb-3 font-medium text-success">✅ Do</h4>
                <ul className="space-y-2 text-sm text-secondary">
                  <li>• Use semantic tokens (bg-primary, text-secondary)</li>
                  <li>• Follow the standardized spacing scale</li>
                  <li>• Use motion-safe prefixes for animations</li>
                  <li>• Maintain consistent border radius within components</li>
                  <li>• Use appropriate shadow levels for elevation</li>
                </ul>
              </div>
              
              <div>
                <h4 className="mb-3 font-medium text-error">❌ Don't</h4>
                <ul className="space-y-2 text-sm text-secondary">
                  <li>• Use hard-coded colors (text-yellow-500)</li>
                  <li>• Create custom spacing values</li>
                  <li>• Force animations with reduced motion preference</li>
                  <li>• Mix different border radius sizes randomly</li>
                  <li>• Use excessive shadow elevation</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 text-lg font-medium text-primary">Implementation Examples</h3>
            <div className="space-y-4">
              <div>
                <h4 className="mb-2 font-medium text-primary">Component Structure</h4>
                <pre className="overflow-x-auto rounded bg-tertiary p-4 text-sm text-primary">
{`// ✅ Correct usage
<div className="bg-surface border border-border-default rounded-lg p-6 shadow-sm">
  <h3 className="text-lg font-medium text-primary mb-2">Title</h3>
  <p className="text-sm text-secondary">Description text</p>
</div>`}
                </pre>
              </div>
              
              <div>
                <h4 className="mb-2 font-medium text-primary">Interactive States</h4>
                <pre className="overflow-x-auto rounded bg-tertiary p-4 text-sm text-primary">
{`// ✅ Correct hover states
<button className="
  bg-accent-primary text-white px-4 py-2 rounded-lg
  transition-colors duration-150 ease-out
  motion-safe:hover:bg-accent-primary/90
  focus:ring-2 focus:ring-accent-primary focus:ring-offset-2
">
  Button
</button>`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

DesignTokens.meta = {
  title: 'Design System/Tokens/Overview',
}; 