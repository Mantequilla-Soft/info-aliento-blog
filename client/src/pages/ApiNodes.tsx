import { useHiveNodes } from '@/hooks/useNetworkStats';
import { useLanguage } from '@/context/LanguageContext';
import ApiNodesTable from '@/components/ApiNodesTable';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

export default function ApiNodes() {
  const { nodes, isLoading } = useHiveNodes();
  const { t } = useLanguage();

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('network.apiNodesTitle')}</h1>
          <p className="mt-2 text-muted-foreground">{t('network.apiNodesSubtitle')}</p>
        </div>
        <Link href="/">
          <Button variant="outline" className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            {t('common.back')}
          </Button>
        </Link>
      </div>

      {/* Stats Summary */}
      {!isLoading && nodes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-muted/30 rounded-lg p-4 border border-border">
            <div className="text-sm text-muted-foreground">{t('network.totalNodes')}</div>
            <div className="text-2xl font-bold text-foreground mt-1">{nodes.length}</div>
          </div>
          <div className="bg-muted/30 rounded-lg p-4 border border-border">
            <div className="text-sm text-muted-foreground">{t('network.perfectScore')}</div>
            <div className="text-2xl font-bold text-primary mt-1">
              {nodes.filter(n => n.score === '100%').length}
            </div>
          </div>
          <div className="bg-muted/30 rounded-lg p-4 border border-border">
            <div className="text-sm text-muted-foreground">{t('network.latestVersion')}</div>
            <div className="text-2xl font-bold text-foreground mt-1">
              {nodes.filter(n => n.version !== '-').sort((a, b) => 
                b.version.localeCompare(a.version, undefined, { numeric: true })
              )[0]?.version || '-'}
            </div>
          </div>
        </div>
      )}

      {/* Info Card */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex items-start gap-3">
        <span className="material-symbols-outlined text-blue-500">info</span>
        <div className="flex-1 text-sm text-foreground">
          <p className="font-medium mb-1">{t('network.tableInfo')}</p>
          <p className="text-muted-foreground">{t('network.tableInfoDetail')}</p>
        </div>
      </div>

      {/* Sortable Table */}
      <ApiNodesTable nodes={nodes} isLoading={isLoading} />
    </div>
  );
}
