import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/context/LanguageContext';
import { HiveNode } from '@/types/hive';

type SortField = 'name' | 'version' | 'score' | 'tests';
type SortDirection = 'asc' | 'desc';

interface ApiNodesTableProps {
  nodes: HiveNode[];
  isLoading: boolean;
  limit?: number;
}

export default function ApiNodesTable({ nodes, isLoading, limit }: ApiNodesTableProps) {
  const { t } = useLanguage();
  const [sortField, setSortField] = useState<SortField>('score');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Default to descending for score, ascending for others
      setSortField(field);
      setSortDirection(field === 'score' ? 'desc' : 'asc');
    }
  };

  const sortedNodes = useMemo(() => {
    if (!nodes.length) return [];

    const sorted = [...nodes].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'name':
          comparison = (a.name || a.url).localeCompare(b.name || b.url);
          break;
        case 'version':
          if (a.version === '-' && b.version !== '-') return sortDirection === 'asc' ? 1 : -1;
          if (b.version === '-' && a.version !== '-') return sortDirection === 'asc' ? -1 : 1;
          comparison = a.version.localeCompare(b.version, undefined, { numeric: true });
          break;
        case 'score':
          comparison = (a.scoreValue || 0) - (b.scoreValue || 0);
          break;
        case 'tests':
          const aSuccess = parseInt(a.tests?.split(' / ')[0] || '0');
          const bSuccess = parseInt(b.tests?.split(' / ')[0] || '0');
          comparison = aSuccess - bSuccess;
          break;
      }

      return sortDirection === 'desc' ? -comparison : comparison;
    });

    return limit ? sorted.slice(0, limit) : sorted;
  }, [nodes, sortField, sortDirection, limit]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <span className="material-symbols-outlined text-xs opacity-30">unfold_more</span>;
    }
    return (
      <span className="material-symbols-outlined text-xs">
        {sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}
      </span>
    );
  };

  return (
    <>
      {/* Desktop View - Sortable Table */}
      <div className="hidden md:block">
        <Card className="overflow-hidden border-border">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead 
                    className="font-medium cursor-pointer hover:bg-muted/70 transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-2">
                      {t('network.nodeName')}
                      <SortIcon field="name" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="font-medium cursor-pointer hover:bg-muted/70 transition-colors"
                    onClick={() => handleSort('version')}
                  >
                    <div className="flex items-center gap-2">
                      {t('network.version')}
                      <SortIcon field="version" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="font-medium cursor-pointer hover:bg-muted/70 transition-colors text-right"
                    onClick={() => handleSort('score')}
                  >
                    <div className="flex items-center justify-end gap-2">
                      {t('network.score')}
                      <SortIcon field="score" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="font-medium cursor-pointer hover:bg-muted/70 transition-colors text-right"
                    onClick={() => handleSort('tests')}
                  >
                    <div className="flex items-center justify-end gap-2">
                      {t('network.tests')}
                      <SortIcon field="tests" />
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: limit || 10 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  sortedNodes.map((node, index) => (
                    <TableRow key={index} className={index % 2 === 0 ? 'bg-muted/20' : ''}>
                      <TableCell className="text-sm font-medium text-primary hover:text-primary/80">
                        <a href={node.url.startsWith('http') ? node.url : `https://${node.url}`} target="_blank" rel="noopener noreferrer">
                          {node.name || node.url}
                        </a>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {node.version}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge 
                          variant={node.score === '100%' ? 'default' : 'outline'}
                          className={`${node.score === '100%' ? 'bg-primary/20 text-primary' : 'text-muted-foreground'} min-w-[60px] text-center`}
                        >
                          {node.score}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {node.tests}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* Mobile View - Cards */}
      <div className="md:hidden space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: limit || 10 }).map((_, i) => (
              <Card key={i} className="p-4">
                <Skeleton className="h-5 w-2/3 mb-3" />
                <div className="grid grid-cols-2 gap-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {sortedNodes.map((node, index) => (
              <Card key={index} className="overflow-hidden border-border">
                <div className="p-4 bg-muted/30 border-b border-border flex justify-between items-center">
                  <div className="font-medium text-primary truncate mr-2">
                    <a href={node.url.startsWith('http') ? node.url : `https://${node.url}`} target="_blank" rel="noopener noreferrer">
                      {node.name || node.url}
                    </a>
                  </div>
                  <Badge 
                    variant={node.score === '100%' ? 'default' : 'outline'}
                    className={`${node.score === '100%' ? 'bg-primary/20 text-primary' : 'text-muted-foreground'} min-w-[60px] text-center`}
                  >
                    {node.score}
                  </Badge>
                </div>
                <div className="p-4 text-sm">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <div className="text-muted-foreground">{t('network.version')}:</div>
                    <div>{node.version}</div>
                    <div className="text-muted-foreground">{t('network.tests')}:</div>
                    <div>{node.tests}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
