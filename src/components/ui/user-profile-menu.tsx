import * as React from "react"
import { useState, useEffect } from "react"
import {
  User,
  Settings,
  Moon,
  Sun,
  Monitor,
  LogOut,
  Palette,
  Accessibility,
  ChevronRight,
  Shield,
  HelpCircle,
  Zap,
  Bell,
  Database
} from "lucide-react"
import { Button } from "./button-v2"
import { Avatar, AvatarImage, AvatarFallback } from "./avatar"
import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { Switch } from "./switch"
import { Label } from "./label"
import { Badge } from "./badge"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem
} from "./dropdown-menu"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./sheet"
import { cn } from "../../lib/utils"

interface UserProfile {
  name: string
  email: string
  avatar?: string
  initials: string
  role?: string
  preferences: {
    theme: 'light' | 'dark' | 'system'
    reducedMotion: boolean
    highContrast: boolean
    soundEnabled: boolean
    notificationsEnabled: boolean
    densityMode: 'compact' | 'comfortable' | 'spacious'
    focusAssistance: boolean
  }
}

interface UserProfileMenuProps {
  className?: string
}

export function UserProfileMenu({ className }: UserProfileMenuProps) {
  const [user, setUser] = useState<UserProfile>({
    name: "LibreOllama User",
    email: "user@example.com",
    initials: "LU",
    role: "Pro User",
    preferences: {
      theme: 'system',
      reducedMotion: false,
      highContrast: false,
      soundEnabled: true,
      notificationsEnabled: true,
      densityMode: 'comfortable',
      focusAssistance: true
    }
  })

  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  // Load user preferences from localStorage
  useEffect(() => {
    const savedPreferences = localStorage.getItem('user-preferences')
    if (savedPreferences) {
      try {
        const preferences = JSON.parse(savedPreferences)
        setUser(prev => ({ ...prev, preferences: { ...prev.preferences, ...preferences } }))
      } catch (error) {
        console.error('Failed to load user preferences:', error)
      }
    }
  }, [])

  // Save preferences to localStorage
  const updatePreference = <K extends keyof UserProfile['preferences']>(
    key: K, 
    value: UserProfile['preferences'][K]
  ) => {
    setUser(prev => {
      const newPreferences = { ...prev.preferences, [key]: value }
      localStorage.setItem('user-preferences', JSON.stringify(newPreferences))
      
      // Apply theme immediately
      if (key === 'theme') {
        applyTheme(value as string)
      }
      
      // Apply accessibility settings
      if (key === 'reducedMotion') {
        document.documentElement.style.setProperty(
          '--motion-reduce', 
          value ? 'reduce' : 'auto'
        )
      }
      
      if (key === 'highContrast') {
        document.documentElement.classList.toggle('high-contrast', value as boolean)
      }
      
      return { ...prev, preferences: newPreferences }
    })
  }

  const applyTheme = (theme: string) => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      root.classList.add(mediaQuery.matches ? 'dark' : 'light')
    } else {
      root.classList.add(theme)
    }
  }

  // Apply initial theme
  useEffect(() => {
    applyTheme(user.preferences.theme)
  }, [user.preferences.theme])

  const handleSignOut = () => {
    // Clear user data and redirect to login
    localStorage.removeItem('user-preferences')
    console.log('User signed out')
    // In a real app, this would redirect to login or clear authentication
  }

  const getThemeIcon = () => {
    switch (user.preferences.theme) {
      case 'light': return Sun
      case 'dark': return Moon
      default: return Monitor
    }
  }

  const ThemeIcon = getThemeIcon()

  return (
    <DropdownMenu>      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "relative rounded-full p-0 transition-colors duration-200",
            className
          )}
          size="icon"
        >
          <Avatar className="h-full w-full border-2 border-accent-primary flex items-center justify-center">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="bg-accent-subtle text-accent-emphasis text-xs font-medium">
              {user.initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium leading-none">{user.name}</p>
              {user.role && (
                <Badge variant="secondary" className="text-xs">
                  {user.role}
                </Badge>
              )}
            </div>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {/* Quick Theme Toggle */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <ThemeIcon className="mr-2 h-4 w-4" />
            <span>Theme</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup 
              value={user.preferences.theme} 
              onValueChange={(value) => updatePreference('theme', value as any)}
            >
              <DropdownMenuRadioItem value="light">
                <Sun className="mr-2 h-4 w-4" />
                Light
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">
                <Moon className="mr-2 h-4 w-4" />
                Dark
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system">
                <Monitor className="mr-2 h-4 w-4" />
                System
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* Quick Accessibility Toggle */}
        <DropdownMenuItem 
          onClick={() => updatePreference('focusAssistance', !user.preferences.focusAssistance)}
        >
          <Zap className="mr-2 h-4 w-4" />
          <span>Focus Assistance</span>
          <div className="ml-auto">
            <div className={cn(
              "h-4 w-7 rounded-full transition-colors",
              user.preferences.focusAssistance ? "bg-blue-600" : "bg-gray-200"
            )}>
              <div className={cn(
                "h-3 w-3 rounded-full bg-white transition-transform mt-0.5",
                user.preferences.focusAssistance ? "translate-x-3.5" : "translate-x-0.5"
              )} />
            </div>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem 
          onClick={() => updatePreference('notificationsEnabled', !user.preferences.notificationsEnabled)}
        >
          <Bell className="mr-2 h-4 w-4" />
          <span>Notifications</span>
          <div className="ml-auto">
            <div className={cn(
              "h-4 w-7 rounded-full transition-colors",
              user.preferences.notificationsEnabled ? "bg-blue-600" : "bg-gray-200"
            )}>
              <div className={cn(
                "h-3 w-3 rounded-full bg-white transition-transform mt-0.5",
                user.preferences.notificationsEnabled ? "translate-x-3.5" : "translate-x-0.5"
              )} />
            </div>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Settings */}
        <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <SheetTrigger asChild>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
              <ChevronRight className="ml-auto h-4 w-4" />
            </DropdownMenuItem>
          </SheetTrigger>
          
          <SheetContent className="w-96 sm:w-[480px]">
            <SheetHeader>
              <SheetTitle>Settings & Preferences</SheetTitle>
            </SheetHeader>
            
            <div className="space-y-6 mt-6">
              {/* Profile Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className="bg-blue-100 text-blue-700 text-lg font-medium">
                        {user.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                      {user.role && (
                        <Badge variant="outline" className="text-xs mt-1">
                          {user.role}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Appearance */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center">
                    <Palette className="mr-2 h-4 w-4" />
                    Appearance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="theme" className="text-sm">Theme</Label>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="w-32">
                            <ThemeIcon className="mr-2 h-3 w-3" />
                            <span className="capitalize">{user.preferences.theme}</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuRadioGroup 
                            value={user.preferences.theme} 
                            onValueChange={(value) => updatePreference('theme', value as any)}
                          >
                            <DropdownMenuRadioItem value="light">
                              <Sun className="mr-2 h-4 w-4" />
                              Light
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="dark">
                              <Moon className="mr-2 h-4 w-4" />
                              Dark
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="system">
                              <Monitor className="mr-2 h-4 w-4" />
                              System
                            </DropdownMenuRadioItem>
                          </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="density" className="text-sm">UI Density</Label>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="w-32">
                            <span className="capitalize">{user.preferences.densityMode}</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuRadioGroup 
                            value={user.preferences.densityMode} 
                            onValueChange={(value) => updatePreference('densityMode', value as any)}
                          >
                            <DropdownMenuRadioItem value="compact">Compact</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="comfortable">Comfortable</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="spacious">Spacious</DropdownMenuRadioItem>
                          </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Accessibility */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center">
                    <Accessibility className="mr-2 h-4 w-4" />
                    Accessibility
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm">Reduced Motion</Label>
                      <p className="text-xs text-muted-foreground">
                        Minimize animations and transitions
                      </p>
                    </div>
                    <Switch
                      checked={user.preferences.reducedMotion}
                      onCheckedChange={(checked) => updatePreference('reducedMotion', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm">High Contrast</Label>
                      <p className="text-xs text-muted-foreground">
                        Enhance color contrast for better visibility
                      </p>
                    </div>
                    <Switch
                      checked={user.preferences.highContrast}
                      onCheckedChange={(checked) => updatePreference('highContrast', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm">Focus Assistance</Label>
                      <p className="text-xs text-muted-foreground">
                        ADHD-friendly focus features and suggestions
                      </p>
                    </div>
                    <Switch
                      checked={user.preferences.focusAssistance}
                      onCheckedChange={(checked) => updatePreference('focusAssistance', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm">Sound Effects</Label>
                      <p className="text-xs text-muted-foreground">
                        Audio feedback for interactions
                      </p>
                    </div>
                    <Switch
                      checked={user.preferences.soundEnabled}
                      onCheckedChange={(checked) => updatePreference('soundEnabled', checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Data & Privacy */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center">
                    <Shield className="mr-2 h-4 w-4" />
                    Data & Privacy
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-xs text-muted-foreground space-y-2">
                    <p>• All data is stored locally on your device</p>
                    <p>• No personal information is sent to external servers</p>
                    <p>• AI processing happens through your Ollama instance</p>
                    <p>• You have full control over your data</p>
                  </div>
                  
                  <Button variant="outline" size="sm" className="w-full">
                    <Database className="mr-2 h-3 w-3" />
                    Manage Local Data
                  </Button>
                </CardContent>
              </Card>
            </div>
          </SheetContent>
        </Sheet>
        
        {/* Help */}
        <DropdownMenuItem>
          <HelpCircle className="mr-2 h-4 w-4" />
          <span>Help & Support</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Sign Out */}
        <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}