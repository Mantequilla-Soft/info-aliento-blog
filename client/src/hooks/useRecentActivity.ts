import { useQuery } from '@tanstack/react-query';
import { getRecentWitnessVotes, getRecentVoteCount, WitnessVoteOperation } from '@/api/hive-hafsql';

/**
 * Hook to fetch recent witness vote activity from HAF SQL API
 */
export function useRecentWitnessActivity(witnessName: string, hours: number = 24) {
  const { data: votes = [], isLoading, isError, error } = useQuery({
    queryKey: ['recent-witness-activity', witnessName, hours],
    queryFn: () => getRecentWitnessVotes(witnessName, hours),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!witnessName,
  });

  // Sort by block number descending (most recent first)
  const sortedVotes = [...votes].sort((a, b) => b.block_num - a.block_num);

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
