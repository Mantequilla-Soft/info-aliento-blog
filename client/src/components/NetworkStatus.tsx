import { useNetworkStats, useHiveNodes } from '@/hooks/useNetworkStats';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';
import { Link } from 'wouter';
import ApiNodesTable from './ApiNodesTable';

export default function NetworkStatus() {
  const { stats, isLoading: statsLoading } = useNetworkStats();
  const { nodes, isLoading: nodesLoading } = useHiveNodes();
  const { t } = useLanguage();

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-foreground">{t('network.title')}</h2>
        <p className="mt-2 text-muted-foreground">{t('network.subtitle')}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Network Stats Cards */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary p-2 bg-primary/10 rounded-full">speed</span>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">{t('network.blockHeight')}</h3>
                {statsLoading ? (
                  <Skeleton className="h-8 w-24 mt-1" />
                ) : (
                  <p className="text-2xl font-semibold text-foreground">{stats?.blockHeight}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary p-2 bg-primary/10 rounded-full">bolt</span>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">{t('network.transactions')}</h3>
                {statsLoading ? (
                  <Skeleton className="h-8 w-24 mt-1" />
                ) : (
                  <p className="text-2xl font-semibold text-foreground">{stats?.txPerDay}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary p-2 bg-primary/10 rounded-full">account_balance</span>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">{t('network.activeWitnesses')}</h3>
                {statsLoading ? (
                  <Skeleton className="h-8 w-10 mt-1" />
                ) : (
                  <p className="text-2xl font-semibold text-foreground">{stats?.activeWitnesses}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary p-2 bg-primary/10 rounded-full">trending_up</span>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">{t('network.hivePrice')}</h3>
                {statsLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-semibold text-foreground">{stats?.hivePrice}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* API Nodes Status - Preview */}
      <div className="mt-12">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-foreground">{t('network.apiNodes')}</h3>
          <Link href="/api-nodes">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              {t('network.viewAll')}
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Button>
          </Link>
        </div>
        
        {/* Preview Table - Top 5 nodes */}
        <ApiNodesTable nodes={nodes} isLoading={nodesLoading} limit={5} />
        
        {/* View All Link for Mobile */}
        {!nodesLoading && nodes.length > 5 && (
          <div className="mt-4 text-center">
            <Link href="/api-nodes">
              <Button variant="link" className="text-primary">
                {t('network.viewAllNodes', { count: nodes.length })}
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
