import { useParams, useLocation } from 'wouter';
import { useWitness, useWitnessVoters, usePagination, useWitnessAccountVoting } from '@/hooks/useWitnesses';
import { useKeychain } from '@/context/KeychainContext';
import { useLanguage } from '@/context/LanguageContext';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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
import VoteTrends from '@/components/VoteTrends';
import ProxyModal from '@/components/ProxyModal';
import WitnessSchedule from '@/components/WitnessSchedule';
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
  const [isUnvoteAction, setIsUnvoteAction] = useState(false);
  const [proxyModalOpen, setProxyModalOpen] = useState(false);
  const [selectedProxyAccount, setSelectedProxyAccount] = useState<string>('');
  const [selectedProxyHP, setSelectedProxyHP] = useState<string>('');
  
  // Helper function to check if the user has already voted for this witness
  const hasVotedForWitness = (): boolean => {
    if (!user || !user.witnessVotes) return false;
    return user.witnessVotes.includes(witnessName);
  };

  // Pagination for voters list
  const { paginatedItems: paginatedVoters, currentPage, totalPages, nextPage, prevPage, goToPage } = usePagination(voters, 25);
  
  // Pagination for witness votes
  const { paginatedItems: paginatedWitnessVotes, currentPage: votesPage, totalPages: votesTotalPages, nextPage: votesNextPage, prevPage: votesPrevPage, goToPage: votesGoToPage } = usePagination(witnessVotes, 10);
  
  // Prepare pie chart data (top 10 voters only, no "Others" category needed)
  const pieChartData = (() => {
    if (voters.length === 0) return [];
    
    // Get top 10 voters (we have all voter data now from HAF-BE API)
    const topVoters = voters.slice(0, 10).map(voter => ({
      name: voter.username,
      value: voter.percentage || 0,
      hp: voter.totalHivePower || voter.hivePower
    }));
    
    return topVoters;
  })();
  
  // Calculate voter statistics
  const voterStats = (() => {
    if (voters.length === 0) return null;
    
    // Total HP calculation
    let totalHP = 0;
    voters.forEach(voter => {
      const ownHP = parseFloat(voter.hivePower.replace(/[^0-9.]/g, ''));
      const proxiedHP = voter.proxiedHivePower ? parseFloat(voter.proxiedHivePower.replace(/[^0-9.]/g, '')) : 0;
      totalHP += (ownHP + proxiedHP);
    });
    
    const avgHP = totalHP / voters.length;
    const topVoterPercentage = voters[0]?.percentage || 0;
    
    // Count voters with proxied power
    const votersWithProxy = voters.filter(v => v.proxiedHivePower && parseFloat(v.proxiedHivePower.replace(/[^0-9.]/g, '')) > 0).length;
    
    return {
      totalVoters: voters.length,
      totalHP: totalHP.toFixed(2),
      avgHP: avgHP.toFixed(2),
      topVoterPercentage: topVoterPercentage.toFixed(2),
      votersWithProxy
    };
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
    <section className="py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Witness Profile Header */}
          <div className="flex flex-col items-center gap-4 mb-8 p-8 bg-card rounded-lg border relative">
            {isLoading ? (
              <>
                <Skeleton className="h-24 w-24 rounded-full" />
                <div className="text-center space-y-2">
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </>
            ) : witness ? (
              <>
                <Avatar className="h-24 w-24">
                  <AvatarImage src={witness.profileImage} alt={witness.name} />
                  <AvatarFallback>{witness.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                
                <div className="text-center">
                  <h1 className="text-4xl font-bold">@{witness.name}</h1>
                  <p className="text-muted-foreground mt-2">
                    {t('profile.activeSince')} {new Date(witness.created).toLocaleDateString()}
                  </p>
                  <div className="flex flex-wrap justify-center gap-3 mt-4">
                    <Badge variant="secondary" className="text-sm">
                      {t('profile.rank')} #{witness.rank}
                    </Badge>
                    {voterStats && (
                      <Badge variant="outline" className="text-sm">
                        {voterStats.totalVoters.toLocaleString()} voters
                      </Badge>
                    )}
                  </div>
                  
                  <Button 
                    className={`mt-6 ${hasVotedForWitness() ? 'bg-muted text-muted-foreground hover:bg-muted/80' : ''}`}
                    onClick={handleVoteClick}
                    variant={hasVotedForWitness() ? "outline" : "default"}
                    size="default"
                  >
                    <span className="material-symbols-outlined mr-2">how_to_vote</span>
                    {hasVotedForWitness() ? t('witnesses.unvote') : t('profile.voteFor')}
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-center text-muted-foreground">Failed to load witness data.</p>
            )}
          </div>
          
          {/* Content sections */}
          <div className="space-y-6">
            {/* About Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">{t('profile.about')} {witnessName}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
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
              </CardContent>
            </Card>
            
            {/* Statistics Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">{t('profile.witnessInfo')}</CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
            
            {/* Voting Activity Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Witness Voting Activity</CardTitle>
              </CardHeader>
              <CardContent>
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
                      
                      {/* Witness Votes - Only show if not using proxy */}
                      {!proxy && (
                        <div>
                          <h4 className="font-medium mb-3">Voting For ({witnessVotes.length}/30 witnesses)</h4>
                          {witnessVotes.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                              {witnessVotes.map((witnessVote) => (
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
                          ) : (
                            <p className="text-muted-foreground">Not voting for any witnesses</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
              </CardContent>
            </Card>
            
            {/* Voters Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">{t('profile.votersTitle')}</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Pie Chart */}
                {!isLoadingVoters && voters.length > 0 && pieChartData.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold mb-2">Voting Power Distribution</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Distribution of voting power among top 10 voters (by governance power)
                    </p>
                    <ResponsiveContainer width="100%" height={400} className="sm:h-[450px] md:h-[500px]">
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, value }) => {
                            // Show label if percentage is > 1.5% to avoid clutter
                            if (value > 1.5) {
                              return `${name.length > 15 ? name.substring(0, 12) + '...' : name} (${value}%)`;
                            }
                            return '';
                          }}
                          outerRadius={140}
                          innerRadius={70}
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
                        <Legend 
                          verticalAlign="bottom" 
                          height={36}
                          formatter={(value) => `@${value}`}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
                
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
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[60px] sm:w-[100px]">{t('profile.account')}</TableHead>
                            <TableHead className="min-w-[120px]">{t('profile.username')}</TableHead>
                            <TableHead className="text-right min-w-[100px]">{t('profile.ownHP')}</TableHead>
                            <TableHead className="text-right min-w-[100px] hidden sm:table-cell">{t('profile.proxiedHP')}</TableHead>
                            <TableHead className="text-right min-w-[120px]">{t('profile.totalGov')}</TableHead>
                            <TableHead className="text-right min-w-[80px]">% of Total</TableHead>
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
                              <TableCell className="text-right font-medium text-sm">{voter.hivePower}</TableCell>
                              <TableCell className="text-right font-medium text-sm hidden sm:table-cell">
                                {voter.proxiedHivePower && voter.proxiedHivePower !== '-' ? (
                                  <button
                                    onClick={() => {
                                      setSelectedProxyAccount(voter.username);
                                      setSelectedProxyHP(voter.proxiedHivePower || '');
                                      setProxyModalOpen(true);
                                    }}
                                    className="text-primary hover:underline inline-flex items-center gap-1"
                                  >
                                    {voter.proxiedHivePower}
                                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                  </button>
                                ) : '-'}
                              </TableCell>
                              <TableCell className="text-right font-medium text-primary text-sm">
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
                                  <Badge variant="secondary" className="text-xs">{voter.percentage}%</Badge>
                                ) : '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    
                    {totalPages > 1 && (
                      <Pagination className="mt-6">
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious onClick={prevPage} />
                          </PaginationItem>
                          
                          {/* Show first page */}
                          {currentPage > 3 && (
                            <>
                              <PaginationItem>
                                <PaginationLink onClick={() => goToPage(1)}>
                                  1
                                </PaginationLink>
                              </PaginationItem>
                              {currentPage > 4 && (
                                <PaginationItem>
                                  <PaginationEllipsis />
                                </PaginationItem>
                              )}
                            </>
                          )}
                          
                          {/* Show pages around current page */}
                          {[...Array(5)].map((_, i) => {
                            const pageNumber = currentPage - 2 + i;
                            if (pageNumber < 1 || pageNumber > totalPages) return null;
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
                          
                          {/* Show last page */}
                          {currentPage < totalPages - 2 && (
                            <>
                              {currentPage < totalPages - 3 && (
                                <PaginationItem>
                                  <PaginationEllipsis />
                                </PaginationItem>
                              )}
                              <PaginationItem>
                                <PaginationLink onClick={() => goToPage(totalPages)}>
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
              </CardContent>
            </Card>
            
            {/* Activity Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Recent Voting Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <RecentActivity witnessName={witnessName} />
                  <VoteTrends witnessName={witnessName} />
                </div>
              </CardContent>
            </Card>
            
            {/* Block Production Schedule */}
            <WitnessSchedule witnessName={witnessName} />
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
      
      <ProxyModal
        open={proxyModalOpen}
        onClose={() => setProxyModalOpen(false)}
        accountName={selectedProxyAccount}
        totalProxiedHP={selectedProxyHP}
      />
    </section>
  );
}
