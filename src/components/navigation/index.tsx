// Navigation Components using LibreOllama Design System
import React from 'react';

// Navigation section
interface NavSectionProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function NavSection({ title, children, className = '' }: NavSectionProps) {
  return (
    <div className={`nav-section ${className}`.trim()}>
      {title && <div className="nav-section-title">{title}</div>}
      {children}
    </div>
  );
}

// Navigation item
interface NavItemProps {
  href?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  active?: boolean;
  badge?: string | number;
  onClick?: () => void;
  className?: string;
}

export function NavItem({ 
  href, 
  icon, 
  children, 
  active = false, 
  badge, 
  onClick, 
  className = '' 
}: NavItemProps) {
  const classes = `nav-item ${active ? 'active' : ''} ${className}`.trim();

  const content = (
    <>
      {icon && (
        <span className="nav-item-icon">
          {icon}
        </span>
      )}
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {children}
      </span>
      {badge && (
        <span className="nav-badge">
          {badge}
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <a href={href} className={classes}>
        {content}
      </a>
    );
  }

  return (
    <button onClick={onClick} className={classes}>
      {content}
    </button>
  );
}

// Logo component
interface LogoProps {
  className?: string;
}

export function Logo({ className = '' }: LogoProps) {
  return (
    <div className={`logo ${className}`.trim()}>
      <div className="logo-icon">
        <svg 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M9 12l2 2 4-4"/>
          <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c2.25 0 4.31.83 5.89 2.2"/>
        </svg>
      </div>
      <span>
        LibreOllama
      </span>
    </div>
  );
}

// Breadcrumb component
interface BreadcrumbProps {
  items: Array<{ label: string; href?: string; current?: boolean }>;
  className?: string;
}

export function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  return (
    <nav className={`flex items-center text-sm font-medium text-text-primary ${className}`.trim()}>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <span className="mx-2 text-text-muted">/</span>
          )}
          {item.current ? (
            <span className="text-text-primary font-semibold">
              {item.label}
            </span>
          ) : (
            <a 
              href={item.href} 
              className="no-underline text-text-secondary hover:text-text-primary transition-colors duration-150 ease-in-out"
            >
              {item.label}
            </a>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
