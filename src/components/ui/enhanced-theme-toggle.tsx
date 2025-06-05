import * as React from 'react';
import { Moon, Sun, Monitor, Palette, RotateCcw } from 'lucide-react';
import { useEnhancedTheme, useThemeCustomization } from './enhanced-theme-provider';
import { Button } from './button-v2';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { Badge } from './badge';

interface ThemeToggleProps {
  showCustomization?: boolean;
  variant?: 'default' | 'compact';
}

export function EnhancedThemeToggle({ 
  showCustomization = true, 
  variant = 'default' 
}: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme } = useEnhancedTheme();
  const { customization, setCustomization, resetCustomization, presets } = useThemeCustomization();

  const themeIcon = {
    light: Sun,
    dark: Moon,
    system: Monitor,
  };

  const ThemeIcon = themeIcon[theme];

  const colorOptions = [
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Green', value: '#10b981' },
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Orange', value: '#f59e0b' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Pink', value: '#ec4899' },
  ];

  const radiusOptions = [
    { name: 'None', value: 'none' as const },
    { name: 'Small', value: 'sm' as const },
    { name: 'Medium', value: 'md' as const },
    { name: 'Large', value: 'lg' as const },
  ];

  const fontScaleOptions = [
    { name: 'Small', value: 'sm' as const },
    { name: 'Default', value: 'base' as const },
    { name: 'Large', value: 'lg' as const },
  ];

  if (variant === 'compact') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ThemeIcon className="h-4 w-4" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setTheme('light')}>
            <Sun className="mr-2 h-4 w-4" />
            Light
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme('dark')}>
            <Moon className="mr-2 h-4 w-4" />
            Dark
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme('system')}>
            <Monitor className="mr-2 h-4 w-4" />
            System
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="relative transition-colors duration-200"
        >
          <ThemeIcon className="h-5 w-5" />
          {Object.keys(customization).length > 0 && (
            <div className="absolute -top-1 -right-1 h-2 w-2 bg-blue-500 rounded-full" />
          )}
          <span className="sr-only">Toggle theme and customization</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center justify-between">
          Theme Settings
          {theme === 'system' && (
            <Badge variant="secondary" className="text-xs">
              {resolvedTheme}
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Theme Selection */}
        <DropdownMenuItem onClick={() => setTheme('light')}>
          <Sun className="mr-2 h-4 w-4" />
          Light
          {theme === 'light' && <div className="ml-auto h-2 w-2 bg-blue-500 rounded-full" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          <Moon className="mr-2 h-4 w-4" />
          Dark
          {theme === 'dark' && <div className="ml-auto h-2 w-2 bg-blue-500 rounded-full" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          <Monitor className="mr-2 h-4 w-4" />
          System
          {theme === 'system' && <div className="ml-auto h-2 w-2 bg-blue-500 rounded-full" />}
        </DropdownMenuItem>

        {showCustomization && (
          <>
            <DropdownMenuSeparator />
            
            {/* Customization Options */}
            <DropdownMenuLabel className="flex items-center">
              <Palette className="mr-2 h-4 w-4" />
              Customization
            </DropdownMenuLabel>
            
            {/* Presets */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Presets</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => setCustomization(presets.default)}>
                  Default
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCustomization(presets.minimal)}>
                  Minimal
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCustomization(presets.rounded)}>
                  Rounded
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCustomization(presets.large)}>
                  Large Text
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            
            {/* Primary Color */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <div className="flex items-center">
                  Primary Color
                  {customization.primaryColor && (
                    <div 
                      className="ml-2 h-3 w-3 rounded-full border border-gray-300" 
                      style={{ backgroundColor: customization.primaryColor }}
                    />
                  )}
                </div>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {colorOptions.map((color) => (
                  <DropdownMenuItem 
                    key={color.value}
                    onClick={() => setCustomization({ primaryColor: color.value })}
                  >
                    <div 
                      className="mr-2 h-4 w-4 rounded-full border border-gray-300" 
                      style={{ backgroundColor: color.value }}
                    />
                    {color.name}
                    {customization.primaryColor === color.value && (
                      <div className="ml-auto h-2 w-2 bg-blue-500 rounded-full" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            
            {/* Border Radius */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Border Radius</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {radiusOptions.map((option) => (
                  <DropdownMenuItem 
                    key={option.value}
                    onClick={() => setCustomization({ borderRadius: option.value })}
                  >
                    {option.name}
                    {customization.borderRadius === option.value && (
                      <div className="ml-auto h-2 w-2 bg-blue-500 rounded-full" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            
            {/* Font Scale */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Font Size</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {fontScaleOptions.map((option) => (
                  <DropdownMenuItem 
                    key={option.value}
                    onClick={() => setCustomization({ fontScale: option.value })}
                  >
                    {option.name}
                    {customization.fontScale === option.value && (
                      <div className="ml-auto h-2 w-2 bg-blue-500 rounded-full" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            
            {/* Reset Customization */}
            {Object.keys(customization).length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={resetCustomization}
                  className="text-red-600 dark:text-red-400"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset Customization
                </DropdownMenuItem>
              </>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Simple theme toggle without customization
export function SimpleThemeToggle() {
  return <EnhancedThemeToggle showCustomization={false} variant="compact" />;
}