import { useState } from 'react';
import { useWitnesses } from '@/hooks/useWitnesses';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useIsMobile as useMobile } from '@/hooks/use-mobile';
import { Skeleton } from '@/components/ui/skeleton';
import VoteModal from '../modals/VoteModal';
import { useKeychain } from '@/context/KeychainContext';
import { useLanguage } from '@/context/LanguageContext';
import LoginModal from '../modals/LoginModal';
import { Link } from 'wouter';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

type SortOption = 'rank' | 'votes' | 'name' | 'lastBlock';

export default function WitnessList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('rank');
  const [selectedWitness, setSelectedWitness] = useState<string | null>(null);
  const [voteModalOpen, setVoteModalOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [isUnvoteAction, setIsUnvoteAction] = useState(false);
  const [hideInactive, setHideInactive] = useState(false);
  
  // Access user data from the Keychain context to get witness votes
  const { isLoggedIn, user } = useKeychain();
  const { t } = useLanguage();
  const isMobile = useMobile();
  
  // Get witnesses data with real-time updates, including pagination and inactive filter
  const { 
    witnesses, 
    isLoading, 
    currentBlockProducer, 
    currentPage,
    totalPages,
    goToPage,
    isFetching,
    totalWitnessesLoaded
  } = useWitnesses(searchTerm, sortBy, hideInactive);
  
  // Check if the user has voted for a specific witness
  const hasVotedForWitness = (witnessName: string): boolean => {
    // Return false if user is not logged in or has no witness votes
    if (!isLoggedIn || !user || !user.witnessVotes) return false;
    
    // Check if the witness name is in the user's witness votes array
    return user.witnessVotes.includes(witnessName);
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value as SortOption);
  };

  const handleHideInactiveChange = (checked: boolean) => {
    setHideInactive(checked);
  };

  // Handle vote or unvote action
  const handleVoteClick = (witnessName: string, unvote: boolean = false) => {
    // If user is not logged in, show login modal
    if (!isLoggedIn) {
      setLoginModalOpen(true);
      return;
    }
    
    // For voting (not unvoting):
    // Don't proceed if user has already voted for this witness
    if (!unvote && hasVotedForWitness(witnessName)) {
      console.log(`User has already voted for ${witnessName}`);
      return;
    }
    
    // For unvoting:
    // Don't proceed if user hasn't voted for this witness
    if (unvote && !hasVotedForWitness(witnessName)) {
      console.log(`User hasn't voted for ${witnessName}, can't unvote`);
      return;
    }
    
    // Set the action type (vote or unvote)
    setIsUnvoteAction(unvote);
    
    // Open vote/unvote confirmation modal
    setSelectedWitness(witnessName);
    setVoteModalOpen(true);
  };

  return (
    <div>
      {/* Search and Filter */}
      <div className="mb-4 flex flex-col gap-4">
        {/* Search Input */}
        <div className="relative w-full">
          <Input
            type="text"
            placeholder={t('witnesses.search')}
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full pl-4 pr-10"
          />
          <span className="material-symbols-outlined absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
            search
          </span>
        </div>
        
        {/* Filter Controls - Stacked on mobile, row on larger screens */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          {/* Hide Inactive Toggle */}
          <div className="flex items-center space-x-2">
            <Switch
              id="hide-inactive"
              checked={hideInactive}
              onCheckedChange={handleHideInactiveChange}
            />
            <Label 
              htmlFor="hide-inactive" 
              className="text-sm cursor-pointer"
            >
              {t('witnesses.hideInactive')}
            </Label>
          </div>
          
          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{t('sort.by')}:</span>
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder={t('sort.placeholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rank">{t('witnesses.rank')}</SelectItem>
                <SelectItem value="votes">{t('witnesses.votes')}</SelectItem>
                <SelectItem value="name">{t('witnesses.name')}</SelectItem>
                <SelectItem value="lastBlock">{t('witnesses.lastBlock')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Mobile Card View */}
      {isMobile && (
        <div className="md:hidden">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-card p-4 border border-border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      <Skeleton className="h-12 w-12 rounded-full mr-4" />
                      <div>
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-4 w-16 mt-1" />
                      </div>
                    </div>
                    <Skeleton className="h-8 w-16" />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <ul className="divide-y divide-border bg-card shadow rounded-lg border border-border">
              {witnesses.map((witness: any, index: number) => (
                <li 
                  key={`${witness.name}-${index}`} 
                  className={`px-4 py-4 overflow-hidden
                    ${witness.name === 'aliento' ? 'bg-primary/10' : ''} 
                    ${!witness.isActive ? 'bg-muted opacity-75' : ''} 
                    ${witness.name === currentBlockProducer ? 'animate-pulse bg-green-400/20 dark:bg-green-600/20' : ''}
                  `}
                >
                  <div className="flex flex-wrap justify-between items-start gap-2">
                    <Link href={`/witness/${witness.name}`} className="flex items-center hover:opacity-90 transition-opacity">
                      <div className="mr-3 flex-shrink-0">
                        <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                          <AvatarImage src={witness.profileImage} alt={witness.name} />
                          <AvatarFallback>{witness.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="min-w-0 max-w-[60%]">
                        <div className="flex items-center gap-1">
                          <h3 className="text-sm sm:text-base font-medium text-foreground truncate">@{witness.name}</h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-1 mt-1">
                          <p className="text-xs sm:text-sm text-muted-foreground">#{witness.rank}</p>
                          <p className="text-xs text-muted-foreground hidden sm:inline">{witness.version}</p>
                          {witness.name === currentBlockProducer && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 text-xs animate-pulse border-green-400/50">
                                    Signing
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">Currently signing blocks</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          {witness.isDisabled ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge variant="destructive" className="bg-red-600 hover:bg-red-700 text-xs">
                                    Disabled
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">Witness is disabled (null signing key)</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : witness.isStale ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge className="bg-yellow-600 hover:bg-yellow-700 text-xs">
                                    Stale
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">No blocks signed in last 24 hours</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : !witness.isActive && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge variant="outline" className="bg-destructive/10 text-destructive text-xs">
                                    Inactive
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">No blocks signed in last 72 hours</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </div>
                    </Link>
                    {/* Vote button for mobile view */}
                    <div className="flex-shrink-0">
                      {hasVotedForWitness(witness.name) ? (
                        // If user has already voted for this witness, show unvote button
                        <Button 
                          size="sm"
                          variant="outline"
                          className="text-muted-foreground text-xs"
                          onClick={() => handleVoteClick(witness.name, true)}
                        >
                          {t('witnesses.unvote')}
                        </Button>
                      ) : (
                        // If user hasn't voted for this witness, show vote button
                        <Button 
                          size="sm"
                          className="text-xs"
                          onClick={() => handleVoteClick(witness.name)}
                        >
                          {t('witnesses.vote')}
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs sm:text-sm">
                    <div className="overflow-hidden">
                      <dt className="text-muted-foreground truncate">{t('witnesses.votes')}</dt>
                      <dd className="font-medium text-foreground truncate">{witness.votesHivePower}</dd>
                    </div>
                    <div className="overflow-hidden">
                      <dt className="text-muted-foreground truncate">{t('witnesses.lastBlock')}</dt>
                      <dd className="font-medium text-foreground truncate">{witness.lastBlock}</dd>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Desktop Table View */}
      {!isMobile && (
        <div className="hidden md:block">
          <div className="bg-card overflow-hidden shadow rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('witnesses.rank')}</TableHead>
                  <TableHead>{t('witnesses.name')}</TableHead>
                  <TableHead>{t('witnesses.votes')}</TableHead>
                  <TableHead>{t('witnesses.lastBlock')}</TableHead>
                  <TableHead>{t('witnesses.fee')}</TableHead>
                  <TableHead>{t('witnesses.action')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Skeleton className="h-10 w-10 rounded-full mr-4" />
                          <div className="flex flex-col">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-16 mt-1" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  <>
                    {witnesses.map((witness: any, index: number) => (
                      <TableRow 
                        key={`${witness.name}-${index}`} 
                        className={`
                          ${witness.name === 'aliento' ? 'bg-primary/10' : 'hover:bg-muted/50'}
                          ${!witness.isActive ? 'bg-muted/60 opacity-80' : ''}
                          ${witness.name === currentBlockProducer ? 'animate-pulse bg-green-400/20 dark:bg-green-600/20' : ''}
                        `}
                      >
                        <TableCell className="text-sm text-muted-foreground">
                          #{witness.rank}
                        </TableCell>
                        <TableCell>
                          <Link href={`/witness/${witness.name}`} className="flex items-center hover:opacity-90 transition-opacity">
                            <Avatar className="h-10 w-10 mr-4">
                              <AvatarImage src={witness.profileImage} alt={witness.name} />
                              <AvatarFallback>{witness.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-medium text-foreground">@{witness.name}</div>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <p className="text-xs text-muted-foreground">{witness.version}</p>
                                {witness.name === currentBlockProducer && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 text-xs animate-pulse border-green-400/50">
                                          Signing
                                        </Badge>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p className="text-xs">Currently signing blocks</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                                {witness.isDisabled ? (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Badge variant="destructive" className="bg-red-600 hover:bg-red-700 text-xs">
                                          Disabled
                                        </Badge>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p className="text-xs">Witness is disabled (null signing key)</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                ) : witness.isStale ? (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Badge className="bg-yellow-600 hover:bg-yellow-700 text-xs">
                                          Stale
                                        </Badge>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p className="text-xs">No blocks signed in last 24 hours</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                ) : !witness.isActive && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Badge variant="outline" className="bg-destructive/10 text-destructive text-xs">
                                          Inactive
                                        </Badge>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p className="text-xs">No blocks signed in last 72 hours</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </div>
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell className="text-sm font-medium">{witness.votesHivePower}</TableCell>
                        <TableCell className="text-sm">{witness.lastBlock}</TableCell>
                        <TableCell className="text-sm">{witness.priceFeed}</TableCell>
                        <TableCell>
                          {hasVotedForWitness(witness.name) ? (
                            // If user has already voted for this witness, show unvote button
                            <Button 
                              variant="link"
                              className="text-muted-foreground hover:text-destructive/80 p-0"
                              onClick={() => handleVoteClick(witness.name, true)}
                            >
                              {t('witnesses.unvote')}
                            </Button>
                          ) : (
                            // If user hasn't voted for this witness, show vote button
                            <Button 
                              variant="link"
                              className="text-primary hover:text-primary/80 p-0"
                              onClick={() => handleVoteClick(witness.name)}
                            >
                              {t('witnesses.vote')}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Pagination at bottom only */}
      {!isLoading && (
        <>
          <div className="mt-8 border-t border-border pt-4">
            <div className="flex flex-col items-center justify-center">
              {/* Page Buttons */}
              <div className="flex items-center justify-center space-x-2 my-4">
                {/* Previous Page Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0 || isFetching}
                  className="h-8 w-8 p-0"
                >
                  <span className="sr-only">Previous Page</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </Button>
                
                {/* Page Numbers */}
                {Array.from({ length: totalPages }).map((_, index) => {
                  // If we have a lot of pages, show a limited range around the current page
                  const pageNum = index;
                  const showPage = 
                    pageNum === 0 || // Always show first page
                    pageNum === totalPages - 1 || // Always show last page
                    (pageNum >= currentPage - 2 && pageNum <= currentPage + 2); // Show 2 pages before and after current
                  
                  if (!showPage && pageNum === currentPage - 3) {
                    return <div key={`bottom-ellipsis-prev-${pageNum}`} className="text-muted-foreground">...</div>;
                  }
                  
                  if (!showPage && pageNum === currentPage + 3) {
                    return <div key={`bottom-ellipsis-next-${pageNum}`} className="text-muted-foreground">...</div>;
                  }
                  
                  if (!showPage) return null;
                  
                  return (
                    <Button
                      key={`bottom-page-${pageNum}`}
                      variant={pageNum === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => goToPage(pageNum)}
                      disabled={isFetching}
                      className="h-8 w-8 p-0"
                    >
                      <span className="sr-only">Page {pageNum + 1}</span>
                      {pageNum + 1}
                    </Button>
                  );
                })}
                
                {/* Next Page Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages - 1 || isFetching}
                  className="h-8 w-8 p-0"
                >
                  <span className="sr-only">Next Page</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </Button>
              </div>

              {/* Bottom Loading Indicator */}
              {isFetching && (
                <div className="flex items-center justify-center mb-2">
                  <span className="animate-spin mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                  </span>
                  <span className="text-sm text-muted-foreground">Loading page {currentPage + 1}...</span>
                </div>
              )}

              {/* Show witness count */}
              <div className="text-sm text-muted-foreground text-center">
                Showing witnesses {currentPage * 100 + 1}-{currentPage * 100 + 100} {hideInactive ? '(active only)' : ''}
                <div className="mt-1 text-xs text-muted-foreground">
                  Page {currentPage + 1} of 6
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modals */}
      {selectedWitness && (
        <VoteModal
          open={voteModalOpen}
          onClose={() => setVoteModalOpen(false)}
          witness={selectedWitness}
          unvote={isUnvoteAction}
        />
      )}

      <LoginModal
        open={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
      />
    </div>
  );
}