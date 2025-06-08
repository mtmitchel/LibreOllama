import { Search, Bell, Sun, Moon, HelpCircle } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

export const TopBar = () => {
  const { theme, setTheme } = useTheme();
  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return (
    <header className="flex items-center justify-between h-[73px] px-6 border-b border-border-subtle bg-surface flex-shrink-0">
      <div className="relative w-full max-w-sm">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
        <input 
          type="search" 
          placeholder="Search workspace..." 
          className="w-full pl-10 pr-4 py-2 rounded-md bg-bg-secondary border border-transparent focus:border-primary focus:ring-0 focus:outline-none" 
        />
      </div>
      <div className="flex items-center gap-2">
        <button 
          onClick={toggleTheme} 
          className="p-2 rounded-full hover:bg-bg-secondary transition-colors" 
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button className="p-2 rounded-full hover:bg-bg-secondary transition-colors">
          <Bell size={18} />
        </button>
        <button className="p-2 rounded-full hover:bg-bg-secondary transition-colors">
          <HelpCircle size={18} />
        </button>
        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-white ml-2">
          A
        </div>
      </div>
    </header>
  );
};
