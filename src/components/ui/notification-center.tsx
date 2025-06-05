import * as React from "react"
import { useState, useEffect, useCallback } from "react"
import {
  Bell,
  Check,
  X,
  Clock,
  Zap,
  Brain,
  Settings,
  Filter,
  MoreHorizontal,
  Trash2,
  Archive,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import { Button } from "./button-v2"
import { Badge } from "./badge"
import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { Separator } from "./separator"
import { ScrollArea } from "./scroll-area"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./sheet"
import { Switch } from "./switch"
import { Label } from "./label"
import { cn } from "@/lib/utils"
import { SmartNotification } from "@/lib/types"
import { smartNotificationEngine } from "@/lib/smart-notifications"
import { designTokens } from "@/lib/design-tokens"

interface NotificationCenterProps {
  className?: string
}

interface NotificationItemProps {
  notification: SmartNotification
  onAction: (notificationId: string, actionId: string) => void
  onMarkAsRead: (notificationId: string) => void
  onDelete: (notificationId: string) => void
  isExpanded?: boolean
  onToggleExpand?: () => void
}

const priorityColors = {
  low: "border-l-blue-500 bg-blue-50/50",
  medium: "border-l-yellow-500 bg-yellow-50/50", 
  high: "border-l-red-500 bg-red-50/50"
}

const typeIcons = {
  break: Clock,
  reminder: Bell,
  suggestion: Brain,
  insight: Zap,
  "energy-check": Zap
}

function NotificationItem({ 
  notification, 
  onAction, 
  onMarkAsRead, 
  onDelete,
  isExpanded = false,
  onToggleExpand
}: NotificationItemProps) {
  const Icon = typeIcons[notification.type] || Bell
  const timeAgo = React.useMemo(() => {
    const now = new Date()
    const created = new Date(notification.createdAt)
    const diffInMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }, [notification.createdAt])

  return (
    <Card className={cn(
      "transition-all duration-300 border-l-4 relative overflow-hidden group",
      priorityColors[notification.priority],
      !notification.isRead && "shadow-lg hover:shadow-xl",
      notification.isRead && "opacity-75 hover:opacity-90",
      "hover:scale-[1.02] hover:-translate-y-0.5"
    )}>
      {/* Priority Visual Indicator */}
      <div className={cn(
        "absolute top-0 right-0 w-0 h-0 border-l-[20px] border-b-[20px] border-l-transparent",
        notification.priority === 'high' ? "border-b-red-400" :
        notification.priority === 'medium' ? "border-b-yellow-400" :
        "border-b-blue-400"
      )} />
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className={cn(
              "flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0",
              notification.priority === 'high' ? "bg-red-100 text-red-600" :
              notification.priority === 'medium' ? "bg-yellow-100 text-yellow-600" :
              "bg-blue-100 text-blue-600"
            )}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <CardTitle className="text-sm font-semibold leading-tight text-gray-900">
                  {notification.title}
                </CardTitle>
                {!notification.isRead && (
                  <div className="h-2.5 w-2.5 bg-blue-500 rounded-full flex-shrink-0 animate-pulse" />
                )}
              </div>
              <div className="flex items-center space-x-2">
                <p className="text-xs text-gray-500 font-medium">{timeAgo}</p>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs px-1.5 py-0.5",
                    notification.priority === 'high' ? "bg-red-50 text-red-700 border-red-300" :
                    notification.priority === 'medium' ? "bg-yellow-50 text-yellow-700 border-yellow-300" :
                    "bg-blue-50 text-blue-700 border-blue-300"
                  )}
                >
                  {notification.priority}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            {notification.actions && notification.actions.length > 0 && onToggleExpand && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleExpand}
                className="h-7 w-7 p-0 hover:bg-gray-100"
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMarkAsRead(notification.id)}
              className="h-7 w-7 p-0 text-gray-400 hover:text-green-600 hover:bg-green-50"
              title="Mark as read"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(notification.id)}
              className="h-7 w-7 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
              title="Delete notification"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <p className="text-sm text-gray-700 leading-relaxed mb-3">
          {notification.message}
        </p>
        
        {/* Notification Actions */}
        {isExpanded && notification.actions && notification.actions.length > 0 && (
          <div className="space-y-2">
            <Separator />
            <div className="flex flex-wrap gap-2 pt-2">
              {notification.actions.map((action) => (
                <Button
                  key={action.id}
                  variant={action.id === 'dismiss' ? "outline" : "default"}
                  size="sm"
                  onClick={() => onAction(notification.id, action.id)}
                  className="text-xs"
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        )}
        
        {/* Context Information */}
        {notification.contextAware && notification.timing && (
          <div className="mt-3 pt-2 border-t border-gray-100">
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              {notification.timing.energyLevelTrigger && (
                <span>Energy: {notification.timing.energyLevelTrigger}</span>
              )}
              {notification.priority && (
                <Badge variant="outline" className="text-xs">
                  {notification.priority} priority
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function NotificationCenter({ className }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<SmartNotification[]>([])
  const [expandedNotifications, setExpandedNotifications] = useState<Set<string>>(new Set())
  const [isOpen, setIsOpen] = useState(false)
  const [showOnlyUnread, setShowOnlyUnread] = useState(false)
  const [preferences, setPreferences] = useState({
    breakReminders: true,
    achievementNotifications: true,
    insightNotifications: true,
    energyAwareNotifications: true,
    contextAwareNotifications: true,
    quietHours: { start: '22:00', end: '08:00' },
    maxNotificationsPerHour: 3
  })

  // Load initial notifications
  useEffect(() => {
    // Simulate some initial notifications for demo
    const mockNotifications: SmartNotification[] = [
      {
        id: "welcome-1",
        type: "insight",
        title: "🎉 Welcome to LibreOllama!",
        message: "Your enhanced workspace is ready. Try the command palette (Ctrl+K) to get started quickly.",
        priority: "medium",
        contextAware: false,
        timing: { scheduledFor: new Date().toISOString() },
        actions: [
          { id: "tour", label: "Take a tour", action: "start-tour" },
          { id: "dismiss", label: "Got it!", action: "dismiss" }
        ],
        isRead: false,
        createdAt: new Date().toISOString()
      },
      {
        id: "focus-tip-1",
        type: "suggestion",
        title: "💡 Focus Mode Tip",
        message: "You can enable focus mode anytime with Ctrl+. to minimize distractions and boost productivity.",
        priority: "low",
        contextAware: true,
        timing: { scheduledFor: new Date().toISOString() },
        actions: [
          { id: "try-focus", label: "Try Focus Mode", action: "enable-focus-mode" },
          { id: "later", label: "Maybe later", action: "dismiss" }
        ],
        isRead: false,
        createdAt: new Date(Date.now() - 300000).toISOString() // 5 minutes ago
      }
    ]
    setNotifications(mockNotifications)
  }, [])

  // Periodically check for new notifications
  useEffect(() => {
    const interval = setInterval(() => {
      // In a real app, this would check the notification engine
      // For now, we'll simulate checking every 30 seconds
      const context = {
        currentTime: new Date(),
        recentActivity: [],
        upcomingEvents: []
      }
      
      const newNotifications = smartNotificationEngine.generateNotifications(context)
      if (newNotifications.length > 0) {
        setNotifications(prev => [...newNotifications, ...prev])
      }
    }, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const unreadCount = notifications.filter(n => !n.isRead).length
  const filteredNotifications = showOnlyUnread 
    ? notifications.filter(n => !n.isRead)
    : notifications

  const handleAction = useCallback((notificationId: string, actionId: string) => {
    // Mark notification as read when action is taken
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId 
          ? { ...n, isRead: true }
          : n
      )
    )

    // Handle specific actions
    switch (actionId) {
      case 'dismiss':
        break
      case 'enable-focus-mode':
        // Dispatch focus mode event
        window.dispatchEvent(new CustomEvent('enable-focus-mode'))
        break
      case 'start-tour':
        // Dispatch tour event
        window.dispatchEvent(new CustomEvent('start-onboarding-tour'))
        break
      default:
        console.log(`Action ${actionId} triggered for notification ${notificationId}`)
    }
  }, [])

  const handleMarkAsRead = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId
          ? { ...n, isRead: true }
          : n
      )
    )
  }, [])

  const handleDelete = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
  }, [])

  const handleToggleExpand = useCallback((notificationId: string) => {
    setExpandedNotifications(prev => {
      const newSet = new Set(prev)
      if (newSet.has(notificationId)) {
        newSet.delete(notificationId)
      } else {
        newSet.add(notificationId)
      }
      return newSet
    })
  }, [])

  const handleMarkAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, isRead: true }))
    )
  }, [])

  const handleClearAll = useCallback(() => {
    setNotifications([])
  }, [])

  const updatePreferences = useCallback((newPrefs: Partial<typeof preferences>) => {
    setPreferences(prev => ({ ...prev, ...newPrefs }))
    // Update notification engine preferences
    smartNotificationEngine.updatePreferences(newPrefs)
  }, [])
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "relative transition-colors duration-200",
            className
          )}
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        >
          <Bell className={cn(
            "h-4 w-4 transition-all duration-200",
            unreadCount > 0 && "animate-bounce"
          )} />
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1">
              <Badge
                variant="destructive"
                className="h-5 w-5 p-0 text-xs flex items-center justify-center min-w-[20px] animate-pulse shadow-lg bg-gradient-to-br from-red-500 to-red-600"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            </div>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-96 sm:w-[480px] p-0 bg-white/95 backdrop-blur-xl border-0 shadow-2xl">
        <SheetHeader className="p-6 pb-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-600">
                <Bell className="h-4 w-4" />
              </div>
              <span className="text-lg font-bold text-gray-900">Notifications</span>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 border-blue-300">
                  {unreadCount} new
                </Badge>
              )}
            </SheetTitle>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowOnlyUnread(!showOnlyUnread)}
                className={cn(
                  "text-xs h-8 px-3 rounded-lg transition-all duration-200",
                  showOnlyUnread
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-gray-600 hover:bg-blue-100 hover:text-blue-700"
                )}
              >
                <Filter className="h-3 w-3 mr-1" />
                Unread
              </Button>
              
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Notification Settings</SheetTitle>
                  </SheetHeader>
                  
                  <div className="space-y-6 mt-6">
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Notification Types</h4>
                      {Object.entries({
                        breakReminders: "Break Reminders",
                        achievementNotifications: "Achievement Celebrations",
                        insightNotifications: "Daily Insights",
                        energyAwareNotifications: "Energy-Based Suggestions",
                        contextAwareNotifications: "Smart Context Suggestions"
                      }).map(([key, label]) => (
                        <div key={key} className="flex items-center justify-between">
                          <Label htmlFor={key} className="text-sm">{label}</Label>
                          <Switch
                            id={key}
                            checked={preferences[key as keyof typeof preferences] as boolean}
                            onCheckedChange={(checked) => 
                              updatePreferences({ [key]: checked })
                            }
                          />
                        </div>
                      ))}
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium">Behavior</h4>
                      <div className="space-y-2 text-sm text-gray-600">
                        <p>• Quiet hours: {preferences.quietHours.start} - {preferences.quietHours.end}</p>
                        <p>• Max per hour: {preferences.maxNotificationsPerHour}</p>
                        <p>• ADHD-friendly patterns enabled</p>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </SheetHeader>
        
        {notifications.length > 0 && (
          <div className="px-6 pb-4 border-b border-gray-100">
            <div className="flex space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
                className="text-xs h-8 px-4 bg-white hover:bg-green-50 border-green-200 text-green-700 hover:text-green-800 font-medium rounded-lg"
              >
                <Check className="h-3 w-3 mr-2" />
                Mark all read
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                className="text-xs h-8 px-4 bg-white hover:bg-red-50 border-red-200 text-red-600 hover:text-red-700 font-medium rounded-lg"
              >
                <Trash2 className="h-3 w-3 mr-2" />
                Clear all
              </Button>
            </div>
          </div>
        )}
        
        <ScrollArea className="flex-1 px-6">
          <div className="space-y-4 pb-6">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-16">
                <div className="mb-6">
                  <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100">
                    <Bell className="h-8 w-8 text-gray-300" />
                  </div>
                  <p className="text-lg font-semibold text-gray-900 mb-2">
                    {showOnlyUnread ? 'All caught up!' : 'No notifications yet'}
                  </p>
                  <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
                    {showOnlyUnread
                      ? 'No unread notifications. You\'re all caught up with your workspace updates.'
                      : 'We\'ll notify you about important updates, insights, and helpful suggestions to boost your productivity.'
                    }
                  </p>
                </div>
                {!showOnlyUnread && notifications.length === 0 && (
                  <div className="text-xs text-gray-400 space-y-1">
                    <p>• Break reminders when you need them</p>
                    <p>• Smart insights about your work patterns</p>
                    <p>• Context-aware suggestions</p>
                  </div>
                )}
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onAction={handleAction}
                  onMarkAsRead={handleMarkAsRead}
                  onDelete={handleDelete}
                  isExpanded={expandedNotifications.has(notification.id)}
                  onToggleExpand={() => handleToggleExpand(notification.id)}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}