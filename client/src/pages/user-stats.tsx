import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/context/LanguageContext';
import { useKeychain } from '@/context/KeychainContext';
import { useLocation } from 'wouter';
import { formatHivePower } from '@/lib/utils';
import { getUserData } from '@/api/hive';
import { UserData } from '@/types/hive';
import { useQuery } from '@tanstack/react-query';
import ProxyModal from '@/components/ProxyModal';
import DelegationsModal from '@/components/DelegationsModal';
import { getWitnessByName } from '@/api/hive';

// Component to display individual witness vote with data
function WitnessVoteItem({ witnessName, index, isOwnProfile, isLoggedIn, onRemove, onNavigate }: {
  witnessName: string;
  index: number;
  isOwnProfile: boolean;
  isLoggedIn: boolean;
  onRemove: () => void;
  onNavigate: () => void;
}) {
  const [, setLocation] = useLocation();
  
  // Fetch witness data
  const { data: witnessData } = useQuery({
    queryKey: ['witness', witnessName],
    queryFn: () => getWitnessByName(witnessName),
    staleTime: 30 * 1000, // 30 seconds
  });

  return (
    <div className="flex justify-between items-center p-3 bg-muted/30 rounded-md hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3 flex-1">
        <span className="text-muted-foreground text-sm">{index + 1}.</span>
        <Avatar className="h-8 w-8">
          <AvatarImage src={`https://images.hive.blog/u/${witnessName}/avatar`} alt={witnessName} />
          <AvatarFallback>{witnessName.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex items-center gap-2 flex-1">
          <button
            onClick={() => setLocation(`/witness/@${witnessName}`)}
            className="font-medium text-primary hover:underline cursor-pointer"
          >
            @{witnessName}
          </button>
          {witnessData ? (
            <>
              <Badge variant="outline" className="text-xs">
                Rank #{witnessData.rank || '?'}
              </Badge>
              {witnessData.isDisabled ? (
                <Badge 
                  variant="destructive"
                  className="text-xs bg-red-600 hover:bg-red-700"
                >
                  Disabled
                </Badge>
              ) : witnessData.isStale ? (
                <Badge 
                  variant="default"
                  className="text-xs bg-yellow-600 hover:bg-yellow-700"
                >
                  Stale
                </Badge>
              ) : witnessData.isActive ? (
                <Badge variant="default" className="text-xs">
                  Active
                </Badge>
              ) : (
                <Badge 
                  variant="destructive"
                  className="text-xs bg-red-600 hover:bg-red-700"
                >
                  Inactive
                </Badge>
              )}
            </>
          ) : (
            <span className="text-xs text-muted-foreground">Loading...</span>
          )}
        </div>
      </div>
      {isOwnProfile && isLoggedIn && (
        <Button 
          variant="destructive" 
          size="sm"
          onClick={onRemove}
        >
          Remove
        </Button>
      )}
    </div>
  );
}

export default function UserStats() {
  const { t } = useLanguage();
  const { user: loggedInUser, isLoggedIn, voteWitness } = useKeychain();
  const [location, setLocation] = useLocation();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [proxyModalOpen, setProxyModalOpen] = useState(false);
  const [delegationsModalOpen, setDelegationsModalOpen] = useState(false);
  
  // Extract username from URL path
  const getUsername = () => {
    if (location === '/user-stats' && loggedInUser?.username) {
      return loggedInUser.username;
    }
    // For URLs like /@eddiespino or /eddiespino, extract the username
    const match = location.match(/^\/(@)?([^/]+)$/);
    // match[2] contains the username without the @ symbol
    return match ? match[2] : null;
  };

  const username = getUsername();
  const isOwnProfile = isLoggedIn && username === loggedInUser?.username;

  // Fetch user data for the specified username
  const { data: user, isLoading, error, refetch } = useQuery({
    queryKey: ['userData', username],
    queryFn: () => username ? getUserData(username) : null,
    enabled: !!username,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error('Error refreshing user data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Redirect to home if no username can be determined
  useEffect(() => {
    if (!username && location !== '/user-stats') {
      setLocation('/');
    }
  }, [username, location, setLocation]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 p-6 bg-card rounded-lg border">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="text-center sm:text-left space-y-2">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">User Not Found</h1>
          <p className="text-muted-foreground mb-4">
            The user "@{username}" could not be found on the Hive blockchain.
          </p>
          <Button onClick={() => setLocation('/')}>
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* User Profile Header */}
        <div className="flex flex-col items-center gap-4 mb-8 p-8 bg-card rounded-lg border relative">
          <Button 
            onClick={handleRefresh}
            variant="outline"
            disabled={isRefreshing}
            className="absolute right-4 top-4"
            size="sm"
          >
            <span className="material-symbols-outlined text-sm">
              {isRefreshing ? 'sync' : 'refresh'}
            </span>
          </Button>
          
          <Avatar className="h-24 w-24">
            <AvatarImage src={user?.profileImage} alt={user?.username || 'User'} />
            <AvatarFallback>
              {user?.username?.substring(0, 2).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="text-center">
            <h1 className="text-4xl font-bold">@{user?.username}</h1>
            <p className="text-muted-foreground mt-2">
              {isOwnProfile ? 'Your Hive Statistics' : `${user.username}'s Hive Statistics`}
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              {user?.proxy ? (
                <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  Proxy: @{user.proxy}
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-primary/10">
                  {user?.witnessVotes?.length || 0}/30 witness votes
                </Badge>
              )}
              
              {/* Show proxy users link if there are people using this account as proxy */}
              {parseFloat(user?.proxiedHivePower?.replace(/[^0-9.]/g, '') || '0') > 0 && (
                <button
                  onClick={() => setProxyModalOpen(true)}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  View Proxy Users
                </button>
              )}
            </div>
            
            {/* Governance vote expiration */}
            {user?.governanceVoteExpiration && (
              <p className="text-xs text-muted-foreground mt-2">
                <span className="font-medium">Vote expiration:</span>{' '}
                {new Date(user.governanceVoteExpiration).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            )}
          </div>
        </div>

        {/* Power Analysis Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl">Hive Power Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Own HP */}
                    <Card>
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="text-sm text-muted-foreground">Own HP</div>
                          <div className="text-2xl font-bold">{user?.hivePower}</div>
                          <div className="text-xs text-muted-foreground">
                            Hive Power owned directly by this account
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Effective HP */}
                    <Card 
                      className="cursor-pointer hover:border-primary hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 relative overflow-hidden group bg-gradient-to-br from-card to-primary/5"
                      onClick={() => setDelegationsModalOpen(true)}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                      <CardContent className="p-4 relative">
                        <div className="space-y-2">
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            Effective HP
                            <svg className="h-3 w-3 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                          </div>
                          <div className="text-2xl font-bold group-hover:text-primary transition-colors">{user?.effectiveHivePower}</div>
                          <div className="text-xs text-muted-foreground">
                            Total effective Hive Power including delegations in/out
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Proxied HP */}
                    <Card 
                      className="cursor-pointer hover:border-primary hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 relative overflow-hidden group bg-gradient-to-br from-card to-primary/5"
                      onClick={() => setProxyModalOpen(true)}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                      <CardContent className="p-4 relative">
                        <div className="space-y-2">
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            Proxied HP
                            <svg className="h-3 w-3 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </div>
                          <div className="text-2xl font-bold group-hover:text-primary transition-colors">{user?.proxiedHivePower}</div>
                          <div className="text-xs text-muted-foreground">
                            Hive Power proxied to this account by other users
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Governance Power */}
                    <Card>
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="text-sm text-muted-foreground">Governance Power</div>
                          <div className="text-2xl font-bold">
                            {formatHivePower(
                              (parseFloat(user?.hivePower?.replace(/[^0-9.]/g, '') || '0') + 
                               parseFloat(user?.proxiedHivePower?.replace(/[^0-9.]/g, '') || '0'))
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Voting power for governance decisions and witness votes (own HP + proxied HP)
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  <p className="text-xs text-center text-muted-foreground mt-4">
                    💡 Click on <span className="font-medium">Effective HP</span> or <span className="font-medium">Proxied HP</span> to view detailed information
                  </p>
                </div>
          </CardContent>
        </Card>

        {/* Earnings Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl">Lifetime Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {user?.rewards ? (
                    <>
                      {/* Summary Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Author Rewards */}
                        <Card className="border-l-4 border-l-green-500">
                          <CardContent className="p-4">
                            <div className="space-y-2">
                              <div className="text-sm text-muted-foreground">Author Rewards</div>
                              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {user.rewards.authorRewards}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {user.rewards.authorPercentage.toFixed(1)}% of total earnings
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Curation Rewards */}
                        <Card className="border-l-4 border-l-blue-500">
                          <CardContent className="p-4">
                            <div className="space-y-2">
                              <div className="text-sm text-muted-foreground">Curation Rewards</div>
                              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {user.rewards.curationRewards}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {user.rewards.curationPercentage.toFixed(1)}% of total earnings
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Total Rewards */}
                        <Card className="border-l-4 border-l-primary">
                          <CardContent className="p-4">
                            <div className="space-y-2">
                              <div className="text-sm text-muted-foreground">Total Lifetime</div>
                              <div className="text-2xl font-bold text-primary">
                                {user.rewards.totalRewards}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Combined author + curation
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Earning Strategy Indicator */}
                      <Card>
                        <CardContent className="p-6">
                          <h4 className="font-semibold mb-3">Earning Strategy</h4>
                          <div className="space-y-3">
                            {/* Progress Bar */}
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-8 bg-muted rounded-full overflow-hidden flex">
                                <div 
                                  className="bg-green-500 flex items-center justify-center text-white text-xs font-medium"
                                  style={{ width: `${user.rewards.authorPercentage}%` }}
                                >
                                  {user.rewards.authorPercentage > 10 && `${user.rewards.authorPercentage.toFixed(0)}%`}
                                </div>
                                <div 
                                  className="bg-blue-500 flex items-center justify-center text-white text-xs font-medium"
                                  style={{ width: `${user.rewards.curationPercentage}%` }}
                                >
                                  {user.rewards.curationPercentage > 10 && `${user.rewards.curationPercentage.toFixed(0)}%`}
                                </div>
                              </div>
                            </div>
                            
                            {/* Legend */}
                            <div className="flex justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-green-500 rounded"></div>
                                <span>Author ({user.rewards.authorRewards})</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                                <span>Curation ({user.rewards.curationRewards})</span>
                              </div>
                            </div>

                            {/* Strategy Description */}
                            <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                              <p className="text-sm text-muted-foreground">
                                {user.rewards.authorPercentage > user.rewards.curationPercentage ? (
                                  <><strong>Content Creator Focus:</strong> This account earns more from creating posts ({user.rewards.authorPercentage.toFixed(0)}%) than curating content ({user.rewards.curationPercentage.toFixed(0)}%).</>
                                ) : user.rewards.curationPercentage > user.rewards.authorPercentage ? (
                                  <><strong>Curator Focus:</strong> This account earns more from curating content ({user.rewards.curationPercentage.toFixed(0)}%) than creating posts ({user.rewards.authorPercentage.toFixed(0)}%).</>
                                ) : (
                                  <><strong>Balanced Approach:</strong> This account has a balanced earning strategy between content creation and curation.</>
                                )}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No earnings data available</p>
                    </div>
                  )}
            </div>
          </CardContent>
        </Card>

        {/* Witness Votes Section */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl">{isOwnProfile ? 'Your Witness Votes' : `@${user?.username}'s Witness Votes`}</CardTitle>
              {user?.proxy ? (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  Proxy: @{user.proxy}
                </Badge>
              ) : (
                <Badge className="bg-primary text-primary-foreground">
                  {user?.witnessVotes?.length || 0} / 30
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {user?.proxy ? (
                <div className="text-center py-8">
                      <div className="flex flex-col items-center gap-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={`https://images.hive.blog/u/${user.proxy}/avatar`} alt={`@${user.proxy}`} />
                          <AvatarFallback>
                            {user.proxy.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-lg font-medium">@{user.proxy}</p>
                          <p className="text-muted-foreground text-sm">
                            {isOwnProfile ? 'You have delegated your witness votes to this account' : `${user.username} has delegated their witness votes to @${user.proxy}`}
                          </p>
                        </div>
                        <Button 
                          variant="outline" 
                          onClick={() => setLocation(`/@${user.proxy}`)}
                        >
                          View @{user.proxy}'s Profile
                        </Button>
                      </div>
                    </div>
                  ) : user?.witnessVotes && user.witnessVotes.length > 0 ? (
                    <div className="space-y-2">
                      {user.witnessVotes.map((witnessName, index) => (
                        <WitnessVoteItem 
                          key={witnessName}
                          witnessName={witnessName}
                          index={index}
                          isOwnProfile={isOwnProfile}
                          isLoggedIn={isLoggedIn}
                          onRemove={() => voteWitness(witnessName, false)}
                          onNavigate={() => setLocation(`/witness/@${witnessName}`)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">{isOwnProfile ? 'You haven\'t voted for any witnesses yet' : `${user?.username} hasn't voted for any witnesses yet`}</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => setLocation('/witnesses')}
                      >
                        Browse Witnesses
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {username && (
        <>
          <ProxyModal
            open={proxyModalOpen}
            onClose={() => setProxyModalOpen(false)}
            accountName={username}
            totalProxiedHP={user?.proxiedHivePower}
          />
          <DelegationsModal
            open={delegationsModalOpen}
            onClose={() => setDelegationsModalOpen(false)}
            accountName={username}
          />
        </>
      )}
    </div>
  );
}
