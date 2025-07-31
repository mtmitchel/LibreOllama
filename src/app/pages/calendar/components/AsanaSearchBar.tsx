import React from 'react';
import { Search } from 'lucide-react';

interface AsanaSearchBarProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}

export const AsanaSearchBar: React.FC<AsanaSearchBarProps> = ({ 
  placeholder = "Search events and tasks...",
  value, 
  onChange 
}) => {
  return (
    <div className="cal-asana-search-container" style={{ width: '100%', maxWidth: '500px' }}>
      <Search size={16} className="cal-asana-search-icon" />
      <input
        type="text"
        className="cal-asana-search"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: '100%' }}
      />
    </div>
  );
};