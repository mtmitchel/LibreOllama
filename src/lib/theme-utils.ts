/**
 * Theme Utilities for LibreOllama
 * 
 * This file provides proper Tailwind CSS classes that work with the design token system
 * and ensure correct rendering in both light and dark modes.
 */

/**
 * Background color classes with proper dark mode support
 */
export const bgColors = {
  primary: 'bg-white dark:bg-slate-900',
  secondary: 'bg-gray-50 dark:bg-slate-800',
  tertiary: 'bg-gray-100 dark:bg-slate-700',
  quaternary: 'bg-gray-200 dark:bg-slate-600',
  
  // V2 specific backgrounds using CSS variables
  v2Primary: 'bg-[rgb(var(--v2-bg-primary-rgb))]',
  v2Secondary: 'bg-[rgb(var(--v2-bg-secondary-rgb))]',
  v2Tertiary: 'bg-[rgb(var(--v2-bg-tertiary-rgb))]',
  v2Quaternary: 'bg-[rgb(var(--v2-bg-quaternary-rgb))]',
} as const;

/**
 * Text color classes with proper dark mode support
 */
export const textColors = {
  primary: 'text-gray-900 dark:text-gray-100',
  secondary: 'text-gray-700 dark:text-gray-300',
  tertiary: 'text-gray-600 dark:text-gray-400',
  muted: 'text-gray-500 dark:text-gray-400',
  placeholder: 'placeholder:text-gray-400 dark:placeholder:text-gray-500',
  
  // V2 specific text colors using CSS variables
  v2Primary: 'text-[var(--v2-text-primary)]',
  v2Secondary: 'text-[var(--v2-text-secondary)]',
  v2Muted: 'text-[var(--v2-text-muted)]',
} as const;

/**
 * Border color classes with proper dark mode support
 */
export const borderColors = {
  default: 'border-gray-200 dark:border-gray-700',
  strong: 'border-gray-300 dark:border-gray-600',
  accent: 'border-blue-600 dark:border-blue-400',
  
  // V2 specific borders
  v2Default: 'border-gray-200 dark:border-slate-700',
  v2Strong: 'border-gray-300 dark:border-slate-600',
} as const;

/**
 * Accent color classes with proper dark mode support
 */
export const accentColors = {
  primary: 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600',
  primaryText: 'text-blue-600 dark:text-blue-400',
  primaryBorder: 'border-blue-600 dark:border-blue-400',
  
  success: 'bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-500 dark:hover:bg-emerald-600',
  successText: 'text-emerald-600 dark:text-emerald-400',
  
  warning: 'bg-amber-500 hover:bg-amber-600 dark:bg-amber-500 dark:hover:bg-amber-600',
  warningText: 'text-amber-600 dark:text-amber-400',
  
  error: 'bg-red-500 hover:bg-red-600 dark:bg-red-500 dark:hover:bg-red-600',
  errorText: 'text-red-600 dark:text-red-400',
} as const;

/**
 * Icon color classes with proper dark mode support
 */
export const iconColors = {
  primary: 'text-gray-700 dark:text-slate-100',
  secondary: 'text-gray-600 dark:text-slate-200',
  muted: 'text-gray-500 dark:text-slate-300',
  accent: 'text-blue-600 dark:text-blue-400',
} as const;

/**
 * Button variant classes with proper dark mode support
 */
export const buttonVariants = {
  primary: `
    bg-blue-600 text-white shadow-sm 
    hover:bg-blue-700 active:bg-blue-800 
    dark:bg-blue-500 dark:hover:bg-blue-600 dark:active:bg-blue-700
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
    dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-slate-900
  `,
  secondary: `
    bg-gray-100 text-gray-900 border border-gray-200 shadow-sm
    hover:bg-gray-200 active:bg-gray-300
    dark:bg-slate-700 dark:text-gray-100 dark:border-slate-600
    dark:hover:bg-slate-600 dark:active:bg-slate-500
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2
    dark:focus-visible:ring-gray-400 dark:focus-visible:ring-offset-slate-900
  `,
  ghost: `
    text-gray-700 hover:bg-gray-100 
    dark:text-gray-300 dark:hover:bg-slate-800
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2
    dark:focus-visible:ring-gray-400 dark:focus-visible:ring-offset-slate-900
  `,
  destructive: `
    bg-red-500 text-white shadow-sm
    hover:bg-red-600 active:bg-red-700
    dark:bg-red-600 dark:hover:bg-red-700 dark:active:bg-red-800
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2
    dark:focus-visible:ring-red-400 dark:focus-visible:ring-offset-slate-900
  `,
} as const;

/**
 * Input classes with proper dark mode support
 */
export const inputClasses = `
  bg-white dark:bg-slate-800
  border border-gray-200 dark:border-slate-600
  text-gray-900 dark:text-gray-100
  placeholder:text-gray-400 dark:placeholder:text-gray-500
  focus:border-blue-500 dark:focus:border-blue-400
  focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20
  disabled:bg-gray-50 dark:disabled:bg-slate-900
  disabled:text-gray-500 dark:disabled:text-gray-400
`;

/**
 * Card classes with proper dark mode support
 */
export const cardClasses = `
  bg-white dark:bg-slate-800
  border border-gray-200 dark:border-slate-700
  shadow-sm hover:shadow-md
  transition-shadow duration-200
`;

/**
 * Navigation item classes with proper dark mode support
 */
export const navItemClasses = {
  base: `
    flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium
    transition-all duration-200
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
    dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-slate-900
  `,
  inactive: `
    text-gray-700 hover:bg-gray-100 hover:text-gray-900
    dark:text-gray-300 dark:hover:bg-slate-800 dark:hover:text-gray-100
  `,
  active: `
    bg-blue-50 text-blue-700 
    dark:bg-blue-900/30 dark:text-blue-400
  `,
} as const;

/**
 * Dropdown menu classes with proper dark mode support
 */
export const dropdownClasses = {
  content: `
    bg-white dark:bg-slate-800
    border border-gray-200 dark:border-slate-700
    shadow-lg
  `,
  item: `
    text-gray-700 hover:bg-gray-100 hover:text-gray-900
    dark:text-gray-300 dark:hover:bg-slate-700 dark:hover:text-gray-100
    focus:bg-gray-100 dark:focus:bg-slate-700
    focus:outline-none
  `,
  separator: 'bg-gray-200 dark:bg-slate-700',
} as const;

/**
 * Badge classes with proper dark mode support
 */
export const badgeClasses = {
  default: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  secondary: 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-300',
  destructive: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
} as const;

/**
 * Utility function to combine classes safely
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Get theme-aware classes for a component
 */
export function getThemeClasses(component: keyof typeof themeMap) {
  return themeMap[component];
}

/**
 * Complete theme mapping for all components
 */
export const themeMap = {
  // Layout
  body: cn(bgColors.v2Primary, textColors.v2Primary),
  sidebar: cn(bgColors.v2Secondary, borderColors.v2Default),
  topbar: cn(bgColors.v2Secondary, borderColors.v2Default),
  main: bgColors.v2Primary,
  
  // Components
  card: cardClasses,
  button: buttonVariants,
  input: inputClasses,
  navItem: navItemClasses,
  dropdown: dropdownClasses,
  badge: badgeClasses,
  
  // Colors
  bg: bgColors,
  text: textColors,
  border: borderColors,
  accent: accentColors,
  icon: iconColors,
} as const;

/**
 * Focus ring classes that work in both themes
 */
export const focusRing = {
  default: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-slate-900',
  inset: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400',
} as const;

/**
 * Hover classes that work in both themes
 */
export const hoverEffects = {
  bg: 'hover:bg-gray-100 dark:hover:bg-slate-800',
  bgAccent: 'hover:bg-blue-50 dark:hover:bg-blue-900/30',
  text: 'hover:text-gray-900 dark:hover:text-gray-100',
  textAccent: 'hover:text-blue-700 dark:hover:text-blue-300',
  opacity: 'hover:opacity-80',
  scale: 'hover:scale-105 transition-transform',
} as const;

/**
 * Transition classes
 */
export const transitions = {
  default: 'transition-all duration-200',
  fast: 'transition-all duration-150',
  slow: 'transition-all duration-300',
  colors: 'transition-colors duration-200',
  shadow: 'transition-shadow duration-200',
  transform: 'transition-transform duration-200',
} as const;
