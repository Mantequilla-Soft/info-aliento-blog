import { useQuery } from '@tanstack/react-query';
import { getRecentWitnessVotes, getRecentVoteCount, WitnessVoteOperation } from '@/api/hive-hafsql';

/**
 * Hook to fetch recent witness vote activity from HAFBE API
 */
export function useRecentWitnessActivity(witnessName: string, hours: number = 24) {
  // Increase page size for longer time ranges to show more results
  // Year view (8760h) gets 500, 30d+ gets 200, 24h gets 100
  const pageSize = hours >= 8760 ? 500 : hours > 24 ? 200 : 100;
  
  const { data: votes = [], isLoading, isError, error } = useQuery({
    queryKey: ['recent-witness-activity', witnessName, hours],
    queryFn: () => getRecentWitnessVotes(witnessName, hours, pageSize),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!witnessName,
  });

  // Sort by timestamp descending (most recent first)
  // HAFBE API already returns votes sorted by timestamp DESC, but we sort again for safety
  const sortedVotes = [...votes].sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    return timeB - timeA;
  });

  return {
    votes: sortedVotes,
    isLoading,
    isError,
    error
  };
}

/**
 * Hook to fetch 24-hour vote count summary
 */
export function useRecentVoteCount(witnessName: string) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['recent-vote-count', witnessName],
    queryFn: () => getRecentVoteCount(witnessName),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!witnessName,
  });

  return {
    voteCount: data || { approvals: 0, removals: 0, net: 0 },
    isLoading,
    isError,
    error
  };
}
