import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useRecentWitnessActivity, useRecentVoteCount } from '@/hooks/useRecentActivity';
import { useLocation } from 'wouter';
import { CheckCircle2, XCircle } from 'lucide-react';

interface RecentActivityProps {
  witnessName: string;
}

export default function RecentActivity({ witnessName }: RecentActivityProps) {
  const { votes, isLoading } = useRecentWitnessActivity(witnessName, 24);
  const { voteCount, isLoading: isLoadingCount } = useRecentVoteCount(witnessName);
  const [, setLocation] = useLocation();

  // Calculate time ago from block number
  const getTimeAgo = (blockNum: number, currentBlock: number = 101208406) => {
    const blockDiff = currentBlock - blockNum;
    const secondsAgo = blockDiff * 3;
    
    const hoursAgo = Math.floor(secondsAgo / 3600);
    const minutesAgo = Math.floor((secondsAgo % 3600) / 60);
    
    if (hoursAgo > 0) {
      return `${hoursAgo}h ago`;
    } else if (minutesAgo > 0) {
      return `${minutesAgo}m ago`;
    } else {
      return 'Just now';
    }
  };

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span>24-Hour Activity</span>
            {!isLoadingCount && (
              <Badge 
                variant={voteCount.net > 0 ? "default" : voteCount.net < 0 ? "destructive" : "secondary"}
                className="text-sm"
              >
                {voteCount.net > 0 ? '+' : ''}{voteCount.net} net votes
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Recent voting activity from HAF SQL blockchain data
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingCount ? (
            <div className="flex gap-4">
              <Skeleton className="h-16 w-1/3" />
              <Skeleton className="h-16 w-1/3" />
              <Skeleton className="h-16 w-1/3" />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {voteCount.approvals}
                </div>
                <div className="text-sm text-muted-foreground">New Votes</div>
              </div>
              <div className="bg-red-50 dark:bg-red-950 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {voteCount.removals}
                </div>
                <div className="text-sm text-muted-foreground">Unvotes</div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {voteCount.net > 0 ? '+' : ''}{voteCount.net}
                </div>
                <div className="text-sm text-muted-foreground">Net Change</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity Feed</CardTitle>
          <CardDescription>
            Last {votes.length} vote operations in the past 24 hours
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
              <p>No voting activity in the last 24 hours</p>
              <p className="text-sm mt-2">This witness has a stable voter base</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {votes.map((vote) => (
                <div
                  key={vote.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    vote.approve 
                      ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800' 
                      : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {vote.approve ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    )}
                    
                    <button 
                      onClick={() => setLocation(`/@${vote.account}`)}
                      className="flex items-center gap-2 hover:opacity-80"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage 
                          src={`https://images.hive.blog/u/${vote.account}/avatar`} 
                          alt={vote.account} 
                        />
                        <AvatarFallback>{vote.account.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">@{vote.account}</span>
                    </button>
                    
                    <span className="text-sm text-muted-foreground">
                      {vote.approve ? 'voted' : 'unvoted'}
                    </span>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    {getTimeAgo(vote.block_num)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
