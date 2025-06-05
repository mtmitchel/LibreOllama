import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "./theme-provider" // Corrected import path
import { Button } from "./button-v2"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu"

export function ThemeToggle() { // This is the version using DropdownMenu and effectiveTheme
  const { setTheme, theme } = useTheme()

  // Determine the effective theme, considering 'system'
  const [effectiveTheme, setEffectiveTheme] = React.useState(theme);

  React.useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setEffectiveTheme(mediaQuery.matches ? 'dark' : 'light');
      const handler = (e: MediaQueryListEvent) => setEffectiveTheme(e.matches ? 'dark' : 'light');
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      setEffectiveTheme(theme);
    }
  }, [theme]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="transition-colors duration-200"
        >
          {effectiveTheme === 'light' && <Sun className="h-[18px] w-[18px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />}
          {effectiveTheme === 'dark' && <Moon className="absolute h-[18px] w-[18px] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}