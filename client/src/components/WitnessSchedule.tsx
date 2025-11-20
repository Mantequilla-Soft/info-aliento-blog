import { useWitnessSchedule, useWitnesses } from '@/hooks/useWitnesses';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useLocation } from 'wouter';
import { Clock, Calendar, Activity, Timer } from 'lucide-react';

interface WitnessScheduleProps {
  witnessName?: string; // Optional: highlight this witness in the schedule
  showFullBackupList?: boolean; // Optional: show full backup witness list (default: false)
}

export default function WitnessSchedule({ witnessName, showFullBackupList = false }: WitnessScheduleProps) {
  const { schedule, isLoading, isError } = useWitnessSchedule();
  const { witnesses: allWitnessesData } = useWitnesses('', 'rank', false);
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Block Production Schedule</CardTitle>
          <CardDescription>Loading schedule data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError || !schedule) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Block Production Schedule</CardTitle>
          <CardDescription>Unable to load schedule data</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Failed to fetch witness schedule. Please try again later.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { currentWitness, upcomingWitnesses, backupWitnesses, allScheduledWitnesses, currentBlock, nextShuffleBlock } = schedule;
  const blocksUntilShuffle = nextShuffleBlock - currentBlock;

  // Create a Set of backup witnesses for O(1) lookup
  const backupWitnessSet = new Set(backupWitnesses);
  
  // Separate upcoming witnesses into top 20 and backup
  const upcomingTop20 = upcomingWitnesses.filter(w => !backupWitnessSet.has(w));
  const upcomingBackup = upcomingWitnesses
    .map((witness, index) => ({ witness, position: index + 1 }))
    .filter(({ witness }) => backupWitnessSet.has(witness));

  // Check if the provided witness is in the schedule
  const isWitnessInUpcoming = witnessName && upcomingWitnesses.includes(witnessName);
  const isWitnessBackup = witnessName && backupWitnesses.includes(witnessName);
  const isWitnessCurrent = witnessName && currentWitness === witnessName;
  
  // Helper function to format time until block
  const formatTimeToBlock = (blocksAway: number) => {
    const seconds = blocksAway * 3;
    if (seconds < 60) {
      return `~${seconds}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return remainingSeconds > 0 ? `~${minutes}m ${remainingSeconds}s` : `~${minutes}m`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return minutes > 0 ? `~${hours}h ${minutes}m` : `~${hours}h`;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Block Production Schedule
        </CardTitle>
        <CardDescription>
          Real-time witness block production order and schedule
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Block Producer */}
        <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              CURRENTLY PRODUCING
            </h4>
            <Badge variant="default" className="animate-pulse">
              LIVE
            </Badge>
          </div>
          <button
            onClick={() => setLocation(`/witness/@${currentWitness}`)}
            className="flex items-center gap-3 w-full hover:bg-primary/5 rounded-lg p-2 transition-colors"
          >
            <Avatar className="h-12 w-12 border-2 border-primary">
              <AvatarImage src={`https://images.hive.blog/u/${currentWitness}/avatar`} alt={currentWitness} />
              <AvatarFallback>{currentWitness.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="text-left">
              <p className="font-bold text-lg">@{currentWitness}</p>
              <p className="text-sm text-muted-foreground">
                Block #{currentBlock.toLocaleString()}
              </p>
            </div>
          </button>
          {isWitnessCurrent && (
            <Badge variant="default" className="mt-2">
              This is your witness!
            </Badge>
          )}
        </div>

        {/* Schedule Info */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
          <Calendar className="h-4 w-4" />
          <span>
            Next shuffle in <strong>{blocksUntilShuffle.toLocaleString()}</strong> blocks
          </span>
        </div>

        {/* Witness Status Alert (if provided) */}
        {witnessName && (
          <div className="bg-muted/20 rounded-lg p-4 border">
            <h4 className="font-semibold mb-2">@{witnessName} Schedule Status</h4>
            {isWitnessCurrent && (
              <p className="text-sm text-green-600 dark:text-green-400">
                ✓ Currently producing blocks
              </p>
            )}
            {isWitnessInUpcoming && (
              <p className="text-sm text-blue-600 dark:text-blue-400">
                ⏱ Position #{upcomingWitnesses.indexOf(witnessName) + 1} in upcoming schedule (~{(upcomingWitnesses.indexOf(witnessName) + 1) * 3} seconds)
              </p>
            )}
            {isWitnessBackup && (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                ⏸ Backup witness (not in top 20)
              </p>
            )}
            {!isWitnessCurrent && !isWitnessInUpcoming && !isWitnessBackup && (
              <p className="text-sm text-muted-foreground">
                Not currently in the active schedule
              </p>
            )}
          </div>
        )}

        {/* Upcoming Witnesses */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <span className="text-primary">→</span>
            Next 20 Witnesses
          </h4>
          <TooltipProvider>
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {upcomingWitnesses.map((witness, index) => {
                const isHighlighted = witnessName === witness;
                const isBackup = backupWitnessSet.has(witness);
                const blocksAway = index + 1;
                
                // Skip backup witnesses in this section
                if (isBackup) return null;
                
                const button = (
                  <button
                    onClick={() => setLocation(`/witness/@${witness}`)}
                    className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${
                      isHighlighted
                        ? 'bg-primary/20 border-primary hover:bg-primary/30'
                        : 'bg-muted/30 border-muted hover:bg-muted/50'
                    }`}
                  >
                    <span className="text-xs font-mono text-muted-foreground w-5">
                      {index + 1}.
                    </span>
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={`https://images.hive.blog/u/${witness}/avatar`} alt={witness} />
                      <AvatarFallback className="text-xs">
                        {witness.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium truncate">
                      {witness}
                    </span>
                  </button>
                );
                
                return (
                  <Tooltip key={`${witness}-${index}`}>
                    <TooltipTrigger asChild>
                      {button}
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-xs">
                        <p className="font-semibold">@{witness}</p>
                        <p className="text-muted-foreground">Position #{index + 1}</p>
                        <p className="text-primary">Next block in {formatTimeToBlock(blocksAway)}</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </TooltipProvider>
        </div>
        
        {/* Upcoming Witnesses (Backup) */}
        {upcomingBackup.length > 0 && (
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Timer className="h-4 w-4 text-primary" />
              <span>Upcoming Witnesses</span>
              <Badge variant="outline" className="text-xs">
                {upcomingBackup.length}
              </Badge>
            </h4>
            <p className="text-sm text-muted-foreground mb-3">
              These backup witnesses (ranked 21+) are scheduled to produce blocks soon
            </p>
            <TooltipProvider>
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {upcomingBackup.map(({ witness, position }) => {
                  const isHighlighted = witnessName === witness;
                  
                  const button = (
                    <button
                      onClick={() => setLocation(`/witness/@${witness}`)}
                      className={`flex items-center gap-2 p-2 rounded-lg border-2 transition-colors ${
                        isHighlighted
                          ? 'bg-primary/20 border-primary hover:bg-primary/30'
                          : 'bg-primary/5 border-primary/40 hover:bg-primary/10'
                      }`}
                    >
                      <span className="text-xs font-mono text-muted-foreground w-5">
                        {position}.
                      </span>
                      <Avatar className="h-6 w-6 ring-2 ring-primary/50">
                        <AvatarImage src={`https://images.hive.blog/u/${witness}/avatar`} alt={witness} />
                        <AvatarFallback className="text-xs bg-primary/20">
                          {witness.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium truncate">
                        {witness}
                      </span>
                    </button>
                  );
                  
                  return (
                    <Tooltip key={`backup-${witness}-${position}`}>
                      <TooltipTrigger asChild>
                        {button}
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-xs">
                          <p className="font-semibold flex items-center gap-1">
                            <Timer className="h-3 w-3" />
                            @{witness}
                          </p>
                          <p className="text-muted-foreground">Backup witness (Rank 21+)</p>
                          <p className="text-muted-foreground">Position #{position} in queue</p>
                          <p className="text-primary font-semibold">
                            Next block in {formatTimeToBlock(position)}
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </TooltipProvider>
          </div>
        )}
        
        {/* Backup Witnesses Schedule */}
        {showFullBackupList && allWitnessesData.length > 20 && (
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Timer className="h-4 w-4" />
              Backup Witnesses Schedule
              <Badge variant="outline" className="text-xs">
                {allWitnessesData.length - 20}
              </Badge>
            </h4>
            <p className="text-sm text-muted-foreground mb-3">
              Witnesses ranked 21+ produce blocks less frequently in the rotation
            </p>
            <div className="bg-muted/20 rounded-lg border p-3 sm:p-4 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 sm:gap-x-6 gap-y-1 text-xs sm:text-sm">
                {allWitnessesData.slice(20).map((witness: import('@/types/hive').Witness) => {
                  const isHighlighted = witnessName === witness.name;
                  return (
                    <button
                      key={witness.name}
                      onClick={() => setLocation(`/witness/@${witness.name}`)}
                      className={`flex items-center gap-2 py-1 px-2 rounded hover:bg-muted/50 transition-colors text-left ${
                        isHighlighted ? 'bg-primary/10' : ''
                      }`}
                    >
                      <span className="text-muted-foreground font-mono text-xs w-8">({witness.rank})</span>
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={`https://images.hive.blog/u/${witness.name}/avatar`} alt={witness.name} />
                        <AvatarFallback className="text-[8px]">
                          {witness.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium truncate">{witness.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="border-t pt-4 space-y-2">
          <h5 className="text-xs font-semibold text-muted-foreground uppercase">Legend</h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
              <span>Currently producing blocks</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary/30" />
              <span>Top 20 witnesses (frequent)</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-3 h-3" />
              <span>Schedule shuffles every ~1 hour</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
