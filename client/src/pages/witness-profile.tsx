import { useParams, useLocation } from 'wouter';
import { useWitness, useWitnessVoters, usePagination, useWitnessAccountVoting } from '@/hooks/useWitnesses';
import { useKeychain } from '@/context/KeychainContext';
import { useLanguage } from '@/context/LanguageContext';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

import { Skeleton } from '@/components/ui/skeleton';
import VoteModal from '@/components/modals/VoteModal';
import LoginModal from '@/components/modals/LoginModal';
import ProxyAccountsModal from '@/components/modals/ProxyAccountsModal';
import RecentActivity from '@/components/RecentActivity';
import { ExternalLink } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

export default function WitnessProfile() {
  const params = useParams<{ name: string }>();
  const witnessName = params.name?.replace('@', '');
  const { witness, isLoading } = useWitness(witnessName);
  const { voters, isLoading: isLoadingVoters } = useWitnessVoters(witnessName);
  const { witnessVotes, proxy, isLoading: isLoadingVoting } = useWitnessAccountVoting(witnessName);
  const { isLoggedIn, user } = useKeychain();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const [voteModalOpen, setVoteModalOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [isUnvoteAction, setIsUnvoteAction] = useState(false);
  
  // Helper function to check if the user has already voted for this witness
  const hasVotedForWitness = (): boolean => {
    if (!user || !user.witnessVotes) return false;
    return user.witnessVotes.includes(witnessName);
  };

  // Pagination for voters list
  const { paginatedItems: paginatedVoters, currentPage, totalPages, nextPage, prevPage, goToPage } = usePagination(voters, 10);
  
  // Pagination for witness votes
  const { paginatedItems: paginatedWitnessVotes, currentPage: votesPage, totalPages: votesTotalPages, nextPage: votesNextPage, prevPage: votesPrevPage, goToPage: votesGoToPage } = usePagination(witnessVotes, 10);
  
  // Prepare pie chart data (top 10 voters + others)
  const pieChartData = (() => {
    if (voters.length === 0) return [];
    
    // Calculate total percentage of visible voters
    const totalVisiblePercentage = voters.reduce((sum, voter) => sum + (voter.percentage || 0), 0);
    
    // Get top 9 voters
    const topVoters = voters.slice(0, 9).map(voter => ({
      name: voter.username,
      value: voter.percentage || 0,
      hp: voter.totalHivePower || voter.hivePower
    }));
    
    // Add "Others" category
    const othersPercentage = 100 - totalVisiblePercentage;
    if (othersPercentage > 0) {
      topVoters.push({
        name: 'Others (not shown)',
        value: parseFloat(othersPercentage.toFixed(2)),
        hp: 'Unknown'
      });
    }
    
    return topVoters;
  })();
  
  // Colors for pie chart - More vibrant and distinguishable palette
  const COLORS = [
    '#3b82f6', // Blue
    '#10b981', // Green
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#f97316', // Orange
    '#14b8a6', // Teal
    '#6366f1', // Indigo
  ];
  
  const handleVoteClick = () => {
    if (!isLoggedIn) {
      setLoginModalOpen(true);
      return;
    }
    
    // Check if the user has already voted for this witness
    const hasVoted = hasVotedForWitness();
    
    // Set the action type (vote or unvote)
    setIsUnvoteAction(hasVoted);
    
    // Open vote/unvote confirmation modal
    setVoteModalOpen(true);
  };
  
  // Handle the case where the witness doesn't exist
  if (!isLoading && !witness) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl font-bold text-foreground mb-6">{t('profile.notFound')}</h1>
            <p className="text-lg text-muted-foreground mb-8">
              {t('profile.notFoundDesc')} <span className="font-medium">@{witnessName}</span>.
            </p>
            <Button asChild>
              <Link href="/witnesses">{t('profile.viewAll')}</Link>
            </Button>
          </div>
        </div>
      </section>
    );
  }
  
  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column with witness profile */}
          <div className="lg:col-span-1">
            <Card className="mb-8">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl flex justify-between items-center">
                  <span>{t('profile.title')}</span>
                  {!isLoading && witness && (
                    <Badge variant="secondary" className="ml-2 text-secondary-foreground">
                      {t('profile.rank')} #{witness.rank}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              
              <CardContent>
                {isLoading ? (
                  <div className="flex flex-col items-center space-y-4">
                    <Skeleton className="h-24 w-24 rounded-full" />
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32" />
                    <div className="w-full mt-4">
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </div>
                ) : witness ? (
                  <div className="flex flex-col items-center">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={witness.profileImage} alt={witness.name} />
                      <AvatarFallback>{witness.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    
                    <h2 className="text-xl font-bold mt-4">@{witness.name}</h2>
                    <p className="text-muted-foreground">{t('profile.activeSince')} {new Date(witness.created).toLocaleDateString()}</p>
                    
                    <Button 
                      className={`w-full mt-6 ${hasVotedForWitness() ? 'bg-muted text-muted-foreground hover:bg-muted/80' : ''}`}
                      onClick={handleVoteClick}
                      variant={hasVotedForWitness() ? "outline" : "default"}
                    >
                      <span className="material-symbols-outlined mr-2">how_to_vote</span>
                      {hasVotedForWitness() ? t('witnesses.unvote') : t('profile.voteFor')}
                    </Button>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">Failed to load witness data.</p>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Right column with tabs for additional info */}
          <div className="lg:col-span-2">
            <Card>
              <Tabs defaultValue="profile" onValueChange={setActiveTab} value={activeTab}>
                <CardHeader className="pb-0">
                  <TabsList className="grid grid-cols-5">
                    <TabsTrigger value="profile">{t('profile.about')}</TabsTrigger>
                    <TabsTrigger value="stats">{t('profile.stats')}</TabsTrigger>
                    <TabsTrigger value="voting">Voting</TabsTrigger>
                    <TabsTrigger value="voters">{t('profile.voters')}</TabsTrigger>
                    <TabsTrigger value="activity">Activity</TabsTrigger>
                  </TabsList>
                </CardHeader>
                
                <CardContent className="pt-6">
                  <TabsContent value="profile" className="mt-0">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-xl font-semibold mb-4">{t('profile.about')} {witnessName}</h3>
                        
                        {isLoading ? (
                          <div className="space-y-3">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                          </div>
                        ) : witness ? (
                          <div>
                            {witness.witnessDescription && (
                              <div className="bg-primary/5 p-4 rounded-lg mb-4">
                                <h4 className="font-medium mb-2">{t('profile.witnessDescription')}</h4>
                                <p className="text-foreground">{witness.witnessDescription}</p>
                              </div>
                            )}
                            
                            {witness.url && (
                              <div className="mt-4">
                                <h4 className="font-medium mb-2">{t('witnesses.website')}</h4>
                                <a
                                  href={witness.url.startsWith('http') ? witness.url : `http://${witness.url}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-primary hover:underline"
                                >
                                  <ExternalLink size={16} />
                                  {t('profile.visitWebsite')}
                                </a>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-muted-foreground">{t('profile.failed')}</p>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="stats" className="mt-0">
                    <div>
                      <h3 className="text-xl font-semibold mb-4">{t('profile.witnessInfo')}</h3>
                      
                      {isLoading ? (
                        <div className="space-y-4">
                          {[...Array(5)].map((_, i) => (
                            <Skeleton key={i} className="h-4 w-full" />
                          ))}
                        </div>
                      ) : witness ? (
                        <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-muted/30 p-4 rounded-lg">
                            <dt className="text-sm text-muted-foreground">{t('profile.votes')}</dt>
                            <dd className="mt-1 text-lg font-medium">{witness.votesHivePower}</dd>
                          </div>
                          
                          <div className="bg-muted/30 p-4 rounded-lg">
                            <dt className="text-sm text-muted-foreground">{t('profile.lastBlock')}</dt>
                            <dd className="mt-1 text-lg font-medium">{witness.lastBlock}</dd>
                          </div>
                          
                          <div className="bg-muted/30 p-4 rounded-lg">
                            <dt className="text-sm text-muted-foreground">{t('profile.missedBlocks')}</dt>
                            <dd className="mt-1 text-lg font-medium">{witness.missedBlocks.toLocaleString()}</dd>
                          </div>
                          
                          <div className="bg-muted/30 p-4 rounded-lg">
                            <dt className="text-sm text-muted-foreground">{t('witnesses.fee')}</dt>
                            <dd className="mt-1 text-lg font-medium">{witness.priceFeed}</dd>
                          </div>
                          
                          <div className="bg-muted/30 p-4 rounded-lg">
                            <dt className="text-sm text-muted-foreground">{t('witnesses.version')}</dt>
                            <dd className="mt-1 text-lg font-medium">{witness.version}</dd>
                          </div>
                          
                          <div className="bg-muted/30 p-4 rounded-lg">
                            <dt className="text-sm text-muted-foreground">{t('witnesses.hbdInterestRate')}</dt>
                            <dd className="mt-1 text-lg font-medium">{witness.hbdInterestRate || 'Unknown'}</dd>
                          </div>
                        </dl>
                      ) : (
                        <p className="text-muted-foreground">{t('profile.failed')}</p>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="voting" className="mt-0">
                    <div>
                      <h3 className="text-xl font-semibold mb-4">Witness Voting Activity</h3>
                      
                      {isLoadingVoting ? (
                        <div className="space-y-4">
                          {[...Array(3)].map((_, i) => (
                            <Skeleton key={i} className="h-4 w-full" />
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {/* Proxy Status */}
                          <div className="bg-muted/30 p-4 rounded-lg">
                            <h4 className="font-medium mb-2">Proxy Status</h4>
                            {proxy ? (
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary">Using Proxy</Badge>
                                <button 
                                  onClick={() => setLocation(`/@${proxy}`)}
                                  className="text-primary hover:underline cursor-pointer font-medium"
                                >
                                  @{proxy}
                                </button>
                              </div>
                            ) : (
                              <p className="text-muted-foreground">Not using a proxy - voting directly</p>
                            )}
                          </div>
                          
                          {/* Witness Votes */}
                          <div>
                            <h4 className="font-medium mb-3">Voting For ({witnessVotes.length}/30 witnesses)</h4>
                            {witnessVotes.length > 0 ? (
                              <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {paginatedWitnessVotes.map((witnessVote) => (
                                    <div key={witnessVote} className="bg-muted/20 p-3 rounded-lg flex items-center justify-between">
                                      <button 
                                        onClick={() => setLocation(`/witness/@${witnessVote}`)}
                                        className="text-primary hover:underline cursor-pointer font-medium flex items-center gap-2"
                                      >
                                        <Avatar className="h-6 w-6">
                                          <AvatarImage src={`https://images.hive.blog/u/${witnessVote}/avatar`} alt={witnessVote} />
                                          <AvatarFallback>{witnessVote.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        @{witnessVote}
                                      </button>
                                    </div>
                                  ))}
                                </div>
                                
                                {votesTotalPages > 1 && (
                                  <Pagination className="mt-6">
                                    <PaginationContent>
                                      <PaginationItem>
                                        <PaginationPrevious onClick={votesPrevPage} />
                                      </PaginationItem>
                                      
                                      {[...Array(Math.min(5, votesTotalPages))].map((_, i) => {
                                        const pageNumber = i + 1;
                                        return (
                                          <PaginationItem key={i}>
                                            <PaginationLink 
                                              isActive={pageNumber === votesPage}
                                              onClick={() => votesGoToPage(pageNumber)}
                                            >
                                              {pageNumber}
                                            </PaginationLink>
                                          </PaginationItem>
                                        );
                                      })}
                                      
                                      {votesTotalPages > 5 && (
                                        <>
                                          <PaginationItem>
                                            <PaginationEllipsis />
                                          </PaginationItem>
                                          <PaginationItem>
                                            <PaginationLink 
                                              onClick={() => votesGoToPage(votesTotalPages)}
                                            >
                                              {votesTotalPages}
                                            </PaginationLink>
                                          </PaginationItem>
                                        </>
                                      )}
                                      
                                      <PaginationItem>
                                        <PaginationNext onClick={votesNextPage} />
                                      </PaginationItem>
                                    </PaginationContent>
                                  </Pagination>
                                )}
                              </>
                            ) : (
                              <p className="text-muted-foreground">Not voting for any witnesses</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="voters" className="mt-0">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold">{t('profile.votersTitle')}</h3>
                        <Badge variant="outline" className="text-sm">
                          Showing top voters (major HP holders)
                        </Badge>
                      </div>
                      
                      {/* Pie Chart */}
                      {!isLoadingVoters && voters.length > 0 && pieChartData.length > 0 && (
                        <Card className="mb-6 shadow-md">
                          <CardHeader>
                            <CardTitle className="text-lg">Voting Power Distribution</CardTitle>
                            <CardDescription>
                              Distribution of voting power among major stakeholders (top visible voters)
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                              {/* Pie Chart */}
                              <div className="lg:col-span-2">
                                <ResponsiveContainer width="100%" height={400}>
                                  <PieChart>
                                    <Pie
                                      data={pieChartData}
                                      cx="50%"
                                      cy="50%"
                                      labelLine={true}
                                      label={({ name, value, percent }) => {
                                        // Only show label if percentage is > 2% to avoid clutter
                                        if (value > 2) {
                                          return `${name.length > 15 ? name.substring(0, 12) + '...' : name} (${value}%)`;
                                        }
                                        return '';
                                      }}
                                      outerRadius={120}
                                      innerRadius={60}
                                      fill="#8884d8"
                                      dataKey="value"
                                      paddingAngle={2}
                                      animationBegin={0}
                                      animationDuration={800}
                                    >
                                      {pieChartData.map((entry, index) => (
                                        <Cell 
                                          key={`cell-${index}`} 
                                          fill={COLORS[index % COLORS.length]}
                                          stroke="rgba(255,255,255,0.8)"
                                          strokeWidth={2}
                                        />
                                      ))}
                                    </Pie>
                                    <Tooltip 
                                      contentStyle={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                        border: '1px solid #ccc',
                                        borderRadius: '8px',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                                      }}
                                      formatter={(value: any, name: any, props: any) => [
                                        `${value}% (${props.payload.hp})`,
                                        name
                                      ]}
                                    />
                                  </PieChart>
                                </ResponsiveContainer>
                              </div>
                              
                              {/* Legend with Details */}
                              <div className="space-y-2">
                                <h4 className="font-semibold mb-3 text-sm text-muted-foreground">Top Voters</h4>
                                <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                                  {pieChartData.map((entry, index) => (
                                    <button
                                      key={index}
                                      onClick={() => {
                                        if (entry.name !== 'Others (not shown)') {
                                          setLocation(`/@${entry.name}`);
                                        }
                                      }}
                                      disabled={entry.name === 'Others (not shown)'}
                                      className={`flex items-center justify-between p-2 rounded-lg w-full text-left transition-colors ${
                                        entry.name === 'Others (not shown)' 
                                          ? 'bg-muted/20 cursor-default' 
                                          : 'hover:bg-muted/40 cursor-pointer'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <div 
                                          className="w-3 h-3 rounded-full flex-shrink-0" 
                                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                        />
                                        <span className="text-sm font-medium truncate">
                                          {entry.name === 'Others (not shown)' ? 'Others' : `@${entry.name}`}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className="text-xs text-muted-foreground">{entry.hp}</span>
                                        <Badge variant="secondary" className="text-xs">
                                          {entry.value}%
                                        </Badge>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                      
                      {/* Info Note */}
                      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                        <p className="text-sm text-blue-900 dark:text-blue-100">
                          <strong>Note:</strong> This list shows only major HP holders voting for this witness. 
                          To see ALL voters, HAF SQL infrastructure is required. The displayed voters typically 
                          represent 80-90% of the total voting power.
                        </p>
                      </div>
                      
                      {isLoadingVoters ? (
                        <div className="space-y-4">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center space-x-4">
                              <Skeleton className="h-10 w-10 rounded-full" />
                              <div className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-3 w-16" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : voters.length > 0 ? (
                        <>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[100px]">{t('profile.account')}</TableHead>
                                <TableHead>{t('profile.username')}</TableHead>
                                <TableHead className="text-right">{t('profile.ownHP')}</TableHead>
                                <TableHead className="text-right">{t('profile.proxiedHP')}</TableHead>
                                <TableHead className="text-right">{t('profile.totalGov')}</TableHead>
                                <TableHead className="text-right">% of Total</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {paginatedVoters.map((voter) => (
                                <TableRow key={voter.username}>
                                  <TableCell>
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage src={voter.profileImage} alt={voter.username} />
                                      <AvatarFallback>{voter.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                  </TableCell>
                                  <TableCell>
                                    <button 
                                      onClick={() => setLocation(`/@${voter.username}`)}
                                      className="text-primary hover:underline cursor-pointer font-medium"
                                    >
                                      @{voter.username}
                                    </button>
                                  </TableCell>
                                  <TableCell className="text-right font-medium">{voter.hivePower}</TableCell>
                                  <TableCell className="text-right font-medium">
                                    {voter.proxiedHivePower ? voter.proxiedHivePower : "-"}
                                  </TableCell>
                                  <TableCell className="text-right font-medium text-primary">
                                    {voter.totalHivePower || (() => {
                                      // Calculate total governance vote (own + proxied) if not already provided
                                      const ownHP = parseFloat(voter.hivePower.replace(/[^0-9.]/g, ''));
                                      const proxiedHP = voter.proxiedHivePower ? 
                                        parseFloat(voter.proxiedHivePower.replace(/[^0-9.]/g, '')) : 0;
                                      
                                      const totalHP = ownHP + proxiedHP;
                                      return totalHP.toLocaleString() + ' governance vote';
                                    })()}
                                  </TableCell>
                                  <TableCell className="text-right font-medium">
                                    {voter.percentage ? (
                                      <Badge variant="secondary">{voter.percentage}%</Badge>
                                    ) : '-'}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                          
                          {totalPages > 1 && (
                            <Pagination className="mt-6">
                              <PaginationContent>
                                <PaginationItem>
                                  <PaginationPrevious onClick={prevPage} />
                                </PaginationItem>
                                
                                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                  const pageNumber = i + 1;
                                  return (
                                    <PaginationItem key={i}>
                                      <PaginationLink 
                                        isActive={pageNumber === currentPage}
                                        onClick={() => goToPage(pageNumber)}
                                      >
                                        {pageNumber}
                                      </PaginationLink>
                                    </PaginationItem>
                                  );
                                })}
                                
                                {totalPages > 5 && (
                                  <>
                                    <PaginationItem>
                                      <PaginationEllipsis />
                                    </PaginationItem>
                                    <PaginationItem>
                                      <PaginationLink 
                                        onClick={() => goToPage(totalPages)}
                                      >
                                        {totalPages}
                                      </PaginationLink>
                                    </PaginationItem>
                                  </>
                                )}
                                
                                <PaginationItem>
                                  <PaginationNext onClick={nextPage} />
                                </PaginationItem>
                              </PaginationContent>
                            </Pagination>
                          )}
                        </>
                      ) : (
                        <p className="text-muted-foreground">{t('profile.noVoters')}</p>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="activity" className="mt-0">
                    <div>
                      <h3 className="text-xl font-semibold mb-4">Recent Voting Activity</h3>
                      <RecentActivity witnessName={witnessName} />
                    </div>
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Modals */}
      {witnessName && (
        <VoteModal 
          open={voteModalOpen} 
          onClose={() => setVoteModalOpen(false)} 
          witness={witnessName}
          unvote={isUnvoteAction}
        />
      )}
      
      <LoginModal 
        open={loginModalOpen} 
        onClose={() => setLoginModalOpen(false)} 
      />
    </section>
  );
}