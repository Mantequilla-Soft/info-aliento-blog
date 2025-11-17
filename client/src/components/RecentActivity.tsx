import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRecentWitnessActivity } from '@/hooks/useRecentActivity';
import { useLocation } from 'wouter';
import { CheckCircle2, XCircle, TrendingUp, TrendingDown, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getVestsToHPRatio } from '@/api/hive-hafsql';
import ProxyModal from './ProxyModal';

interface RecentActivityProps {
  witnessName: string;
}

export default function RecentActivity({ witnessName }: RecentActivityProps) {
  const [timeRange, setTimeRange] = useState<24 | 168 | 720 | 8760>(720); // Default 30d (720h), yearly is 8760h
  const [loadingYear, setLoadingYear] = useState(false);
  const { votes, isLoading } = useRecentWitnessActivity(witnessName, timeRange);
  const [, setLocation] = useLocation();
  const [vestsToHp, setVestsToHp] = useState<number>(0.000494); // Default fallback
  const [proxyModalOpen, setProxyModalOpen] = useState(false);
  const [selectedProxyAccount, setSelectedProxyAccount] = useState<string>('');
  const [selectedProxyHP, setSelectedProxyHP] = useState<string>('');
  
  // Get time range label
  const getTimeRangeLabel = () => {
    switch(timeRange) {
      case 24: return '24 hours';
      case 168: return '7 days';
      case 720: return '30 days';
      case 8760: return '1 year';
      default: return '30 days';
    }
  };
  
  // Calculate vote count from actual votes (not separate API call)
  const voteCount = {
    approvals: votes.filter(v => v.approve).length,
    removals: votes.filter(v => !v.approve).length,
    net: votes.filter(v => v.approve).length - votes.filter(v => !v.approve).length
  };
  
  // Handle year view loading
  const handleLoadYear = () => {
    setLoadingYear(true);
    setTimeRange(8760);
    // Reset loading state after a delay
    setTimeout(() => setLoadingYear(false), 1000);
  };

  // Fetch VESTS to HP conversion ratio
  useEffect(() => {
    getVestsToHPRatio().then(ratio => setVestsToHp(ratio));
  }, []);

  // Convert VESTS to HP
  const vestsToHivePower = (vests: string): number => {
    return parseFloat(vests) * vestsToHp / 1000000;
  };

  // Format HP for display
  const formatHP = (hp: number): string => {
    if (hp >= 1000000) {
      return `${(hp / 1000000).toFixed(1)}M HP`;
    } else if (hp >= 1000) {
      return `${(hp / 1000).toFixed(1)}K HP`;
    } else if (hp >= 1) {
      return `${hp.toFixed(0)} HP`;
    } else {
      return `${hp.toFixed(3)} HP`;
    }
  };

  // Calculate time ago from timestamp
  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const voteTime = new Date(timestamp);
    const diffMs = now.getTime() - voteTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `${diffDays}d ago`;
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else if (diffMins > 0) {
      return `${diffMins}m ago`;
    } else {
      return 'Just now';
    }
  };

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-2">
            <CardTitle className="text-lg flex flex-wrap items-center gap-2">
              <span className="whitespace-nowrap">{getTimeRangeLabel()} Activity</span>
              <Badge 
                variant={voteCount.net > 0 ? "default" : voteCount.net < 0 ? "destructive" : "secondary"}
                className="text-xs sm:text-sm"
              >
                {voteCount.net > 0 ? '+' : ''}{voteCount.net} net votes
              </Badge>
            </CardTitle>
            
            <div className="flex items-center gap-2 flex-wrap">
              <Tabs value={timeRange === 8760 ? "720" : timeRange.toString()} onValueChange={(v) => setTimeRange(Number(v) as 24 | 168 | 720)}>
                <TabsList>
                  <TabsTrigger value="24" className="text-xs sm:text-sm">24h</TabsTrigger>
                  <TabsTrigger value="168" className="text-xs sm:text-sm">7d</TabsTrigger>
                  <TabsTrigger value="720" className="text-xs sm:text-sm">30d</TabsTrigger>
                </TabsList>
              </Tabs>
              
              {timeRange !== 8760 && (
                <button
                  onClick={handleLoadYear}
                  disabled={loadingYear}
                  className="px-3 py-1.5 text-xs sm:text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors whitespace-nowrap"
                >
                  {loadingYear ? 'Loading...' : 'Load Year'}
                </button>
              )}
            </div>
          </div>
          <CardDescription>
            Recent voting activity from HAFBE API blockchain data
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg text-center">
                <div className="text-3xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
                  {voteCount.approvals}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">New Votes</div>
              </div>
              <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg text-center">
                <div className="text-3xl sm:text-2xl font-bold text-red-600 dark:text-red-400">
                  {voteCount.removals}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">Unvotes</div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg text-center">
                <div className="text-3xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {voteCount.net > 0 ? '+' : ''}{voteCount.net}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">Net Change</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Feed */}
      <Card className="relative">
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity Feed</CardTitle>
          <CardDescription>
            Last {votes.length} vote operations in the past {getTimeRangeLabel()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : votes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No voting activity in the past {getTimeRangeLabel()}</p>
              <p className="text-sm mt-2">This witness has a stable voter base</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {votes.map((vote, index) => {
                const accountHP = vestsToHivePower(vote.account_vests);
                const proxiedHP = vestsToHivePower(vote.proxied_vests);
                const totalHP = accountHP + proxiedHP;
                const voterName = vote.voter_name || vote.account || 'unknown';
                
                return (
                  <div
                    key={`${voterName}-${vote.timestamp || index}`}
                    className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 p-3 rounded-lg border ${
                      vote.approve 
                        ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800' 
                        : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {vote.approve ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                      )}
                      
                      <button 
                        onClick={() => setLocation(`/@${voterName}`)}
                        className="flex items-center gap-2 hover:opacity-80 min-w-0 flex-1"
                      >
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarImage 
                            src={`https://images.hive.blog/u/${voterName}/avatar`} 
                            alt={voterName} 
                          />
                          <AvatarFallback>{voterName.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col items-start min-w-0 flex-1">
                          <span className="font-medium text-sm truncate max-w-full flex items-center gap-1">
                            @{voterName}
                            {proxiedHP > 0 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedProxyAccount(voterName);
                                  setSelectedProxyHP(formatHP(proxiedHP));
                                  setProxyModalOpen(true);
                                }}
                                className="inline-flex items-center hover:opacity-70"
                                title="View proxy delegators"
                              >
                                <Users className="h-3 w-3 text-primary" />
                              </button>
                            )}
                          </span>
                          <span className="text-xs text-muted-foreground truncate max-w-full">
                            {formatHP(totalHP)}
                            {proxiedHP > 0 && (
                              <span className="ml-1 opacity-70 hidden sm:inline">
                                ({formatHP(accountHP)} + {formatHP(proxiedHP)} proxy)
                              </span>
                            )}
                          </span>
                        </div>
                      </button>
                      
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                          {vote.approve ? 'voted' : 'unvoted'}
                        </span>
                        {vote.approve ? (
                          <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                    
                    <div className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap flex-shrink-0">
                      {getTimeAgo(vote.timestamp)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      
      <ProxyModal
        open={proxyModalOpen}
        onClose={() => setProxyModalOpen(false)}
        accountName={selectedProxyAccount}
        totalProxiedHP={selectedProxyHP}
      />
    </div>
  );
}
