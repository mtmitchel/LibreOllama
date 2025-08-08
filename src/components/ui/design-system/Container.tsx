import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

/**
 * Design System Container Component
 * 
 * DLS Compliant Layout Primitive for page content containers
 * - Consistent max-width and horizontal padding
 * - Responsive breakpoint handling
 * - Automatic centering and margins
 * - Perfect for main page content areas
 * - Eliminates layout inconsistencies across pages
 */

const containerVariants = cva(
  'mx-auto w-full',
  {
    variants: {
      size: {
        sm: 'max-w-2xl',          // 672px - Small content like articles
        md: 'max-w-4xl',          // 896px - Standard page content
        lg: 'max-w-6xl',          // 1152px - Wide layouts
        xl: 'max-w-7xl',          // 1280px - Very wide layouts
        '2xl': 'max-w-[1400px]',  // 1400px - Ultra-wide dashboards
        full: 'max-w-none',       // No max width restriction
        prose: 'max-w-3xl',       // 768px - Optimized for reading
      },
      padding: {
        none: 'px-0',
        sm: 'px-[var(--space-4)]',      // 32px
        md: 'px-[var(--space-6)]',      // 48px  
        lg: 'px-[var(--space-8)]',      // 64px
        responsive: `
          px-[var(--space-4)]           
          sm:px-[var(--space-6)]        
          lg:px-[var(--space-8)]        
        `,
      },
      verticalPadding: {
        none: 'py-0',
        sm: 'py-[var(--space-4)]',
        md: 'py-[var(--space-6)]',
        lg: 'py-[var(--space-8)]',
        xl: 'py-[var(--space-12)]',
      },
      center: {
        true: 'mx-auto',
        false: 'mx-0',
      },
    },
    defaultVariants: {
      size: 'md',
      padding: 'responsive',
      verticalPadding: 'none',
      center: true,
    },
  }
);

export interface ContainerProps extends VariantProps<typeof containerVariants> {
  children: React.ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  style?: React.CSSProperties;
  role?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  id?: string;
}

export const Container = forwardRef<HTMLDivElement, ContainerProps>(({
  children,
  size = 'md',
  padding = 'responsive',
  verticalPadding = 'none',
  center = true,
  className = '',
  as: Component = 'div',
  style,
  role,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  id,
  ...props
}, ref) => {
  return (
    <Component
      ref={ref}
      id={id}
      role={role}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      style={style}
      className={containerVariants({
        size,
        padding,
        verticalPadding,
        center,
        className,
      })}
      {...props}
    >
      {children}
    </Component>
  );
});

Container.displayName = 'Container';

/**
 * Section - Page section with consistent spacing
 */
export interface SectionProps extends ContainerProps {
  spacing?: 'sm' | 'md' | 'lg' | 'xl';
  background?: 'default' | 'muted' | 'subtle' | 'surface';
  bordered?: boolean;
}

export const Section = forwardRef<HTMLDivElement, SectionProps>(({
  spacing = 'lg',
  background = 'default',
  bordered = false,
  className = '',
  verticalPadding,
  ...props
}, ref) => {
  const spacingMap = {
    sm: 'md',
    md: 'lg',
    lg: 'xl',
    xl: 'xl',
  } as const;

  const backgroundClasses = {
    default: '',
    muted: 'bg-[var(--bg-muted)]',
    subtle: 'bg-[var(--bg-subtle)]',
    surface: 'bg-[var(--bg-surface)]',
  };

  const borderClass = bordered ? 'border-t border-[var(--border-subtle)]' : '';

  return (
    <Container
      ref={ref}
      as="section"
      verticalPadding={verticalPadding || spacingMap[spacing]}
      className={`
        ${backgroundClasses[background]}
        ${borderClass}
        ${className}
      `}
      {...props}
    />
  );
});

Section.displayName = 'Section';

/**
 * Page - Full page wrapper with consistent layout
 */
export interface PageProps extends ContainerProps {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  sidebar?: React.ReactNode;
  sidebarWidth?: 'sm' | 'md' | 'lg';
  sidebarPosition?: 'left' | 'right';
  fullHeight?: boolean;
}

export const Page = forwardRef<HTMLDivElement, PageProps>(({
  children,
  header,
  footer,
  sidebar,
  sidebarWidth = 'md',
  sidebarPosition = 'left',
  fullHeight = true,
  className = '',
  ...props
}, ref) => {
  const sidebarWidths = {
    sm: 'w-64',   // 256px
    md: 'w-80',   // 320px
    lg: 'w-96',   // 384px
  };

  if (sidebar) {
    return (
      <div
        ref={ref}
        className={`
          flex
          ${fullHeight ? 'min-h-screen' : ''}
          ${className}
        `}
      >
        {sidebarPosition === 'left' && sidebar && (
          <aside className={`${sidebarWidths[sidebarWidth]} shrink-0`}>
            {sidebar}
          </aside>
        )}
        
        <main className="flex-1 flex flex-col min-w-0">
          {header && (
            <header className="shrink-0">
              {header}
            </header>
          )}
          
          <Container className="flex-1" {...props}>
            {children}
          </Container>
          
          {footer && (
            <footer className="shrink-0">
              {footer}
            </footer>
          )}
        </main>
        
        {sidebarPosition === 'right' && sidebar && (
          <aside className={`${sidebarWidths[sidebarWidth]} shrink-0`}>
            {sidebar}
          </aside>
        )}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={`
        flex flex-col
        ${fullHeight ? 'min-h-screen' : ''}
        ${className}
      `}
    >
      {header && (
        <header className="shrink-0">
          {header}
        </header>
      )}
      
      <main className="flex-1">
        <Container {...props}>
          {children}
        </Container>
      </main>
      
      {footer && (
        <footer className="shrink-0">
          {footer}
        </footer>
      )}
    </div>
  );
});

Page.displayName = 'Page';

/**
 * Article - Optimized for long-form content
 */
export interface ArticleProps extends Omit<ContainerProps, 'size'> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  toc?: React.ReactNode;
  sidebar?: React.ReactNode;
}

export const Article = forwardRef<HTMLDivElement, ArticleProps>(({
  children,
  title,
  subtitle,
  meta,
  actions,
  toc,
  sidebar,
  className = '',
  ...props
}, ref) => {
  if (sidebar || toc) {
    return (
      <Container
        ref={ref}
        size="xl"
        className={className}
        {...props}
      >
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-[var(--space-8)]">
          <article className="lg:col-span-3 min-w-0">
            {(title || subtitle || meta || actions) && (
              <header className="mb-[var(--space-8)]">
                {title && (
                  <h1 className="text-[var(--text-h1)] font-bold text-[var(--text-primary)] mb-[var(--space-2)]">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="text-[var(--text-large)] text-[var(--text-secondary)] mb-[var(--space-4)]">
                    {subtitle}
                  </p>
                )}
                {meta && (
                  <div className="text-[var(--text-small)] text-[var(--text-muted)] mb-[var(--space-4)]">
                    {meta}
                  </div>
                )}
                {actions && (
                  <div className="flex gap-[var(--space-2)]">
                    {actions}
                  </div>
                )}
              </header>
            )}
            
            <div className="prose prose-lg max-w-none">
              {children}
            </div>
          </article>
          
          <aside className="lg:col-span-1">
            {toc && (
              <div className="sticky top-[var(--space-6)] mb-[var(--space-8)]">
                <h2 className="text-[var(--text-body)] font-semibold text-[var(--text-primary)] mb-[var(--space-3)]">
                  Table of Contents
                </h2>
                {toc}
              </div>
            )}
            {sidebar}
          </aside>
        </div>
      </Container>
    );
  }

  return (
    <Container
      ref={ref}
      size="prose"
      className={className}
      {...props}
    >
      <article>
        {(title || subtitle || meta || actions) && (
          <header className="mb-[var(--space-8)]">
            {title && (
              <h1 className="text-[var(--text-h1)] font-bold text-[var(--text-primary)] mb-[var(--space-2)]">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-[var(--text-large)] text-[var(--text-secondary)] mb-[var(--space-4)]">
                {subtitle}
              </p>
            )}
            {meta && (
              <div className="text-[var(--text-small)] text-[var(--text-muted)] mb-[var(--space-4)]">
                {meta}
              </div>
            )}
            {actions && (
              <div className="flex gap-[var(--space-2)]">
                {actions}
              </div>
            )}
          </header>
        )}
        
        <div className="prose prose-lg max-w-none">
          {children}
        </div>
      </article>
    </Container>
  );
});

Article.displayName = 'Article';

/**
 * Hero - Hero section with large content area
 */
export interface HeroProps extends ContainerProps {
  background?: 'default' | 'gradient' | 'muted' | 'brand';
  textAlign?: 'left' | 'center' | 'right';
  overlay?: boolean;
}

export const Hero = forwardRef<HTMLDivElement, HeroProps>(({
  background = 'default',
  textAlign = 'center',
  overlay = false,
  className = '',
  verticalPadding = 'xl',
  ...props
}, ref) => {
  const backgroundClasses = {
    default: '',
    gradient: 'bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)]',
    muted: 'bg-[var(--bg-muted)]',
    brand: 'bg-[var(--brand-primary)] text-[var(--text-on-brand)]',
  };

  const textAlignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  return (
    <div className={`relative ${backgroundClasses[background]}`}>
      {overlay && (
        <div className="absolute inset-0 bg-black/20" />
      )}
      <Container
        ref={ref}
        size="lg"
        verticalPadding={verticalPadding}
        className={`
          relative z-10
          ${textAlignClasses[textAlign]}
          ${className}
        `}
        {...props}
      />
    </div>
  );
});

Hero.displayName = 'Hero';