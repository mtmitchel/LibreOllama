import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

/**
 * Design System Grid Component
 * 
 * DLS Compliant Layout Primitive for CSS Grid layouts
 * - Uses design tokens for all spacing values
 * - Supports responsive grid configurations
 * - Flexible column/row definitions
 * - Perfect for complex page structures and dashboards
 */

const gridVariants = cva(
  'grid',
  {
    variants: {
      columns: {
        '1': 'grid-cols-1',
        '2': 'grid-cols-2',
        '3': 'grid-cols-3',
        '4': 'grid-cols-4',
        '5': 'grid-cols-5',
        '6': 'grid-cols-6',
        '7': 'grid-cols-7',
        '8': 'grid-cols-8',
        '9': 'grid-cols-9',
        '10': 'grid-cols-10',
        '11': 'grid-cols-11',
        '12': 'grid-cols-12',
        auto: 'grid-cols-[repeat(auto-fit,minmax(0,1fr))]',
        'auto-sm': 'grid-cols-[repeat(auto-fit,minmax(200px,1fr))]',
        'auto-md': 'grid-cols-[repeat(auto-fit,minmax(300px,1fr))]',
        'auto-lg': 'grid-cols-[repeat(auto-fit,minmax(400px,1fr))]',
      },
      rows: {
        '1': 'grid-rows-1',
        '2': 'grid-rows-2',
        '3': 'grid-rows-3',
        '4': 'grid-rows-4',
        '5': 'grid-rows-5',
        '6': 'grid-rows-6',
        auto: 'grid-rows-[repeat(auto-fit,minmax(0,1fr))]',
      },
      gap: {
        '0': 'gap-0',
        '0-5': 'gap-[var(--space-0-5)]',
        '1': 'gap-[var(--space-1)]',
        '1-5': 'gap-[var(--space-1-5)]',
        '2': 'gap-[var(--space-2)]',
        '2-5': 'gap-[var(--space-2-5)]',
        '3': 'gap-[var(--space-3)]',
        '4': 'gap-[var(--space-4)]',
        '5': 'gap-[var(--space-5)]',
        '6': 'gap-[var(--space-6)]',
        '8': 'gap-[var(--space-8)]',
        '10': 'gap-[var(--space-10)]',
        '12': 'gap-[var(--space-12)]',
      },
      gapX: {
        '0': 'gap-x-0',
        '0-5': 'gap-x-[var(--space-0-5)]',
        '1': 'gap-x-[var(--space-1)]',
        '1-5': 'gap-x-[var(--space-1-5)]',
        '2': 'gap-x-[var(--space-2)]',
        '2-5': 'gap-x-[var(--space-2-5)]',
        '3': 'gap-x-[var(--space-3)]',
        '4': 'gap-x-[var(--space-4)]',
        '5': 'gap-x-[var(--space-5)]',
        '6': 'gap-x-[var(--space-6)]',
        '8': 'gap-x-[var(--space-8)]',
        '10': 'gap-x-[var(--space-10)]',
        '12': 'gap-x-[var(--space-12)]',
      },
      gapY: {
        '0': 'gap-y-0',
        '0-5': 'gap-y-[var(--space-0-5)]',
        '1': 'gap-y-[var(--space-1)]',
        '1-5': 'gap-y-[var(--space-1-5)]',
        '2': 'gap-y-[var(--space-2)]',
        '2-5': 'gap-y-[var(--space-2-5)]',
        '3': 'gap-y-[var(--space-3)]',
        '4': 'gap-y-[var(--space-4)]',
        '5': 'gap-y-[var(--space-5)]',
        '6': 'gap-y-[var(--space-6)]',
        '8': 'gap-y-[var(--space-8)]',
        '10': 'gap-y-[var(--space-10)]',
        '12': 'gap-y-[var(--space-12)]',
      },
      justify: {
        start: 'justify-start',
        center: 'justify-center',
        end: 'justify-end',
        between: 'justify-between',
        around: 'justify-around',
        evenly: 'justify-evenly',
        stretch: 'justify-stretch',
      },
      align: {
        start: 'items-start',
        center: 'items-center',
        end: 'items-end',
        stretch: 'items-stretch',
        baseline: 'items-baseline',
      },
      placeItems: {
        start: 'place-items-start',
        center: 'place-items-center',
        end: 'place-items-end',
        stretch: 'place-items-stretch',
      },
    },
    defaultVariants: {
      gap: '3',
      columns: '1',
      align: 'stretch',
      justify: 'start',
    },
  }
);

type GridTag = 'div' | 'section' | 'main' | 'article';

export interface GridProps extends VariantProps<typeof gridVariants> {
  children: React.ReactNode;
  className?: string;
  as?: GridTag;
  style?: React.CSSProperties;
  role?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  id?: string;
}

export const Grid = forwardRef<HTMLDivElement, GridProps>(({
  children,
  columns = '1',
  rows,
  gap = '3',
  gapX,
  gapY,
  justify = 'start',
  align = 'stretch',
  placeItems,
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
  const Comp = Component as any;
  return (
    <Comp
      ref={ref as any}
      id={id}
      role={role}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      style={style}
      className={gridVariants({
        columns,
        rows,
        gap,
        gapX,
        gapY,
        justify,
        align,
        placeItems,
        className,
      })}
      {...(props as any)}
    >
      {children}
    </Comp>
  );
});

Grid.displayName = 'Grid';

/**
 * Grid Item - For controlling individual grid items
 */
const gridItemVariants = cva(
  '',
  {
    variants: {
      colSpan: {
        '1': 'col-span-1',
        '2': 'col-span-2',
        '3': 'col-span-3',
        '4': 'col-span-4',
        '5': 'col-span-5',
        '6': 'col-span-6',
        '7': 'col-span-7',
        '8': 'col-span-8',
        '9': 'col-span-9',
        '10': 'col-span-10',
        '11': 'col-span-11',
        '12': 'col-span-12',
        full: 'col-span-full',
        auto: 'col-auto',
      },
      rowSpan: {
        '1': 'row-span-1',
        '2': 'row-span-2',
        '3': 'row-span-3',
        '4': 'row-span-4',
        '5': 'row-span-5',
        '6': 'row-span-6',
        full: 'row-span-full',
        auto: 'row-auto',
      },
      colStart: {
        '1': 'col-start-1',
        '2': 'col-start-2',
        '3': 'col-start-3',
        '4': 'col-start-4',
        '5': 'col-start-5',
        '6': 'col-start-6',
        '7': 'col-start-7',
        '8': 'col-start-8',
        '9': 'col-start-9',
        '10': 'col-start-10',
        '11': 'col-start-11',
        '12': 'col-start-12',
        '13': 'col-start-13',
        auto: 'col-start-auto',
      },
      colEnd: {
        '1': 'col-end-1',
        '2': 'col-end-2',
        '3': 'col-end-3',
        '4': 'col-end-4',
        '5': 'col-end-5',
        '6': 'col-end-6',
        '7': 'col-end-7',
        '8': 'col-end-8',
        '9': 'col-end-9',
        '10': 'col-end-10',
        '11': 'col-end-11',
        '12': 'col-end-12',
        '13': 'col-end-13',
        auto: 'col-end-auto',
      },
      rowStart: {
        '1': 'row-start-1',
        '2': 'row-start-2',
        '3': 'row-start-3',
        '4': 'row-start-4',
        '5': 'row-start-5',
        '6': 'row-start-6',
        '7': 'row-start-7',
        auto: 'row-start-auto',
      },
      rowEnd: {
        '1': 'row-end-1',
        '2': 'row-end-2',
        '3': 'row-end-3',
        '4': 'row-end-4',
        '5': 'row-end-5',
        '6': 'row-end-6',
        '7': 'row-end-7',
        auto: 'row-end-auto',
      },
      justifySelf: {
        auto: 'justify-self-auto',
        start: 'justify-self-start',
        end: 'justify-self-end',
        center: 'justify-self-center',
        stretch: 'justify-self-stretch',
      },
      alignSelf: {
        auto: 'self-auto',
        start: 'self-start',
        end: 'self-end',
        center: 'self-center',
        stretch: 'self-stretch',
        baseline: 'self-baseline',
      },
    },
  }
);

type GridItemTag = 'div' | 'section' | 'article' | 'main';

export interface GridItemProps extends VariantProps<typeof gridItemVariants> {
  children: React.ReactNode;
  className?: string;
  as?: GridItemTag;
  style?: React.CSSProperties;
  id?: string;
}

export const GridItem = forwardRef<HTMLDivElement, GridItemProps>(({
  children,
  colSpan,
  rowSpan,
  colStart,
  colEnd,
  rowStart,
  rowEnd,
  justifySelf,
  alignSelf,
  className = '',
  as: Component = 'div',
  style,
  id,
  ...props
}, ref) => {
  const CompItem = Component as any;
  return (
    <CompItem
      ref={ref as any}
      id={id}
      style={style}
      className={gridItemVariants({
        colSpan,
        rowSpan,
        colStart,
        colEnd,
        rowStart,
        rowEnd,
        justifySelf,
        alignSelf,
        className,
      })}
      {...(props as any)}
    >
      {children}
    </CompItem>
  );
});

GridItem.displayName = 'GridItem';

/**
 * Common Grid Patterns - Pre-configured grids for frequent use cases
 */

/**
 * Card Grid - Optimized for card layouts
 */
export interface CardGridProps extends Omit<GridProps, 'columns'> {
  minCardWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export const CardGrid = forwardRef<HTMLDivElement, CardGridProps>(({
  minCardWidth = 'md',
  gap = '4',
  ...props
}, ref) => {
  const cardWidthMap = {
    sm: 'auto-sm',  // min 200px
    md: 'auto-md',  // min 300px
    lg: 'auto-lg',  // min 400px
    xl: 'auto',     // flexible
  };

  return (
    <Grid
      ref={ref}
      columns={cardWidthMap[minCardWidth] as GridProps['columns']}
      gap={gap}
      {...props}
    />
  );
});

CardGrid.displayName = 'CardGrid';

/**
 * Dashboard Grid - Optimized for dashboard layouts
 */
export interface DashboardGridProps extends Omit<GridProps, 'columns'> {
  columns?: '2' | '3' | '4';
  breakpoint?: 'sm' | 'md' | 'lg';
}

export const DashboardGrid = forwardRef<HTMLDivElement, DashboardGridProps>(({
  columns = '3',
  gap = '6',
  className = '',
  ...props
}, ref) => {
  return (
    <Grid
      ref={ref}
      columns={columns}
      gap={gap}
      className={`
        grid-cols-1
        md:grid-cols-2
        lg:grid-cols-${columns}
        ${className}
      `}
      {...props}
    />
  );
});

DashboardGrid.displayName = 'DashboardGrid';

/**
 * Sidebar Layout - Two-column layout with sidebar
 */
export interface SidebarLayoutProps extends Omit<GridProps, 'columns' | 'rows'> {
  sidebarWidth?: 'sm' | 'md' | 'lg' | 'xl';
  sidebarPosition?: 'left' | 'right';
  collapseSidebar?: boolean;
}

export const SidebarLayout = forwardRef<HTMLDivElement, SidebarLayoutProps>(({
  sidebarWidth = 'md',
  sidebarPosition = 'left',
  collapseSidebar = false,
  gap = '6',
  className = '',
  children,
  ...props
}, ref) => {
  const sidebarSizes = {
    sm: '200px',
    md: '280px', 
    lg: '320px',
    xl: '400px',
  };

  const gridTemplate = collapseSidebar 
    ? '1fr'
    : sidebarPosition === 'left' 
      ? `${sidebarSizes[sidebarWidth]} 1fr`
      : `1fr ${sidebarSizes[sidebarWidth]}`;

  return (
    <Grid
      ref={ref}
      gap={gap}
      className={`min-h-screen ${className}`}
      style={{ gridTemplateColumns: gridTemplate }}
      {...props}
    >
      {children}
    </Grid>
  );
});

SidebarLayout.displayName = 'SidebarLayout';

/**
 * Masonry Grid - Pinterest-style masonry layout (CSS-only approximation)
 */
export interface MasonryGridProps extends Omit<GridProps, 'columns' | 'rows'> {
  columnWidth?: 'sm' | 'md' | 'lg';
}

export const MasonryGrid = forwardRef<HTMLDivElement, MasonryGridProps>(({
  columnWidth = 'md',
  gap = '4',
  className = '',
  ...props
}, ref) => {
  const columnWidths = {
    sm: '250px',
    md: '300px',
    lg: '350px',
  };

  return (
    <div
      ref={ref}
      className={`
        columns-[${columnWidths[columnWidth]}]
        gap-[var(--space-${gap})]
        ${className}
      `}
      style={{
        columnFill: 'balance',
        columnGap: `var(--space-${gap})`,
      }}
      {...props}
    >
      {props.children}
    </div>
  );
});

MasonryGrid.displayName = 'MasonryGrid';

/**
 * Auto Grid - Automatically sizes columns based on content
 */
export interface AutoGridProps extends Omit<GridProps, 'columns'> {
  minItemWidth?: string;
  maxColumns?: number;
}

export const AutoGrid = forwardRef<HTMLDivElement, AutoGridProps>(({
  minItemWidth = '250px',
  maxColumns = 12,
  gap = '4',
  style,
  ...props
}, ref) => {
  return (
    <Grid
      ref={ref}
      gap={gap}
      style={{
        gridTemplateColumns: `repeat(auto-fit, minmax(${minItemWidth}, 1fr))`,
        ...style,
      }}
      {...props}
    />
  );
});

AutoGrid.displayName = 'AutoGrid';