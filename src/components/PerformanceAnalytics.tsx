import React, { useState, useEffect } from 'react';
import { useAdvancedFeatures } from '../hooks/use-advanced-features';
import type { ModelAnalytics, SystemHealth } from '../lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { RefreshCw, TrendingUp, Clock, Zap, Database, HardDrive } from 'lucide-react';

export function PerformanceAnalytics() {
  const { getModelAnalytics, getSystemHealth, loading, error } = useAdvancedFeatures();
  
  const [modelAnalytics, setModelAnalytics] = useState<ModelAnalytics[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setRefreshing(true);
    try {
      // Get all model analytics
      const analytics = await getModelAnalytics();
      if (Array.isArray(analytics)) {
        setModelAnalytics(analytics);
      }

      // Get system health
      const health = await getSystemHealth();
      if (health) {
        setSystemHealth(health);
      }
    } finally {
      setRefreshing(false);
    }
  };

  const formatResponseTime = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatTokenCount = (count: number): string => {
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
    return `${(count / 1000000).toFixed(1)}M`;
  };

  const getPerformanceColor = (score: number): string => {
    if (score >= 50) return 'text-green-600';
    if (score >= 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceBadge = (score: number): { variant: any, label: string } => {
    if (score >= 50) return { variant: 'default', label: 'Excellent' };
    if (score >= 20) return { variant: 'secondary', label: 'Good' };
    return { variant: 'destructive', label: 'Slow' };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Analytics</h2>
          <p className="text-muted-foreground">
            Monitor model performance and system health metrics
          </p>
        </div>
        <Button 
          onClick={loadAnalytics} 
          disabled={refreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="models" className="space-y-4">
        <TabsList>
          <TabsTrigger value="models">Model Performance</TabsTrigger>
          <TabsTrigger value="system">System Health</TabsTrigger>
        </TabsList>

        <TabsContent value="models" className="space-y-4">
          {modelAnalytics.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center space-y-2">
                  <TrendingUp className="w-8 h-8 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">No model analytics available yet</p>
                  <p className="text-sm text-muted-foreground">
                    Performance data will appear after using models
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {modelAnalytics.map((analytics) => {
                const perfBadge = getPerformanceBadge(analytics.performanceScore);
                return (
                  <Card key={analytics.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{analytics.modelName}</CardTitle>
                        <Badge variant={perfBadge.variant}>{perfBadge.label}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Avg Response</span>
                          </div>
                          <div className="font-medium">
                            {formatResponseTime(analytics.averageResponseTime)}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Speed</span>
                          </div>
                          <div className={`font-medium ${getPerformanceColor(analytics.performanceScore)}`}>
                            {analytics.performanceScore.toFixed(1)} t/s
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Total Requests</span>
                          <span className="font-medium">{analytics.totalRequests}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Tokens Generated</span>
                          <span className="font-medium">{formatTokenCount(analytics.totalTokensGenerated)}</span>
                        </div>
                        {analytics.lastUsed && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Last Used</span>
                            <span className="font-medium">
                              {new Date(analytics.lastUsed).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Performance</span>
                          <span className="font-medium">{analytics.performanceScore.toFixed(1)}%</span>
                        </div>
                        <Progress value={Math.min(analytics.performanceScore, 100)} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          {systemHealth ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Database
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <span className="text-muted-foreground">Active Sessions</span>
                      <div className="font-medium">{systemHealth.database.activeSessions}</div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-muted-foreground">Total Messages</span>
                      <div className="font-medium">{systemHealth.database.totalMessages}</div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-muted-foreground">Active Agents</span>
                      <div className="font-medium">{systemHealth.database.activeAgents}</div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-muted-foreground">Schema Version</span>
                      <div className="font-medium">v{systemHealth.database.schemaVersion}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <HardDrive className="w-5 h-5" />
                    Cache
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Cached Entries</span>
                      <span className="font-medium">{systemHealth.cache.totalEntries}</span>
                    </div>
                    <Badge variant="outline" className="w-full justify-center">
                      {systemHealth.cache.totalEntries > 0 ? 'Cache Active' : 'Cache Empty'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">System Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Badge variant="default" className="w-full justify-center">
                      System Healthy
                    </Badge>
                    <div className="text-xs text-muted-foreground text-center">
                      Last updated: {new Date(systemHealth.timestamp).toLocaleString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center space-y-2">
                  <Database className="w-8 h-8 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">Loading system health...</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}