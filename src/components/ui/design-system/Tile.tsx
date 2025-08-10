import React from 'react';

export interface TileProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label: string;
}

/**
 * Tile
 * Square action tile used by dashboard quick actions and elsewhere.
 * Keyboard and screen-reader friendly; uses button semantics.
 */
export const Tile = React.forwardRef<HTMLButtonElement, TileProps>(
  ({ icon, label, className = '', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`asana-tile ${className}`.trim()}
        aria-label={label}
        {...props}
      >
        <span className="asana-tile-icon" aria-hidden>
          {icon}
        </span>
        <span className="asana-tile-label">{label}</span>
      </button>
    );
  }
);

Tile.displayName = 'Tile';

export default Tile;


