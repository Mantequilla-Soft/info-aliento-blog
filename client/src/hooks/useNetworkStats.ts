import { useQuery } from '@tanstack/react-query';
import { getNetworkStats, getHiveNodes } from '@/api/hive';

export function useNetworkStats() {
  const { data: stats, isLoading, isError, error } = useQuery({
    queryKey: ['networkStats'],
    queryFn: getNetworkStats,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    stats,
    isLoading,
    isError,
    error
  };
}

export function useHiveNodes() {
  const { data: nodes = [], isLoading, isError, error } = useQuery({
    queryKey: ['hiveNodes'],
    queryFn: getHiveNodes,
    staleTime: 1000 * 30, // 30 seconds - refresh more frequently to show latest data
  });

  return {
    nodes,
    isLoading,
    isError,
    error
  };
}
