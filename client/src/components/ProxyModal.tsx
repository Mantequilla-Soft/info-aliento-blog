import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Users } from 'lucide-react';
import { getProxyDelegators, getVestsToHPRatio, type ProxyDelegator } from '@/api/hive-hafsql';
import { useLocation } from 'wouter';

interface ProxyModalProps {
  open: boolean;
  onClose: () => void;
  accountName: string;
  totalProxiedHP?: string; // Optional display value
}

export default function ProxyModal({ open, onClose, accountName, totalProxiedHP }: ProxyModalProps) {
  const [delegators, setDelegators] = useState<ProxyDelegator[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [vestsToHp, setVestsToHp] = useState<number>(0.000494);
  const [, setLocation] = useLocation();

  // Fetch VESTS to HP ratio
  useEffect(() => {
    getVestsToHPRatio().then(ratio => setVestsToHp(ratio));
  }, []);

  // Fetch proxy delegators when modal opens
  useEffect(() => {
    if (open && accountName) {
      setIsLoading(true);
      getProxyDelegators(accountName)
        .then(result => {
          // Sort delegators by proxied_vests (descending - highest first)
          const sortedDelegators = [...result.delegators].sort((a, b) => {
            const vestsA = parseFloat(a.proxied_vests || '0');
            const vestsB = parseFloat(b.proxied_vests || '0');
            return vestsB - vestsA; // Descending order
          });
          setDelegators(sortedDelegators);
          setTotal(result.total);
        })
        .finally(() => setIsLoading(false));
    }
  }, [open, accountName]);

  // Convert VESTS to HP
  const vestsToHivePower = (vests: string): number => {
    const vestsNum = parseFloat(vests || '0');
    return vestsNum * vestsToHp / 1000000;
  };

  // Format HP for display
  const formatHP = (hp: number): string => {
    if (hp >= 1000000) {
      return `${(hp / 1000000).toFixed(2)}M HP`;
    } else if (hp >= 1000) {
      return `${(hp / 1000).toFixed(1)}K HP`;
    } else if (hp >= 1) {
      return `${hp.toFixed(0)} HP`;
    } else {
      return `${hp.toFixed(3)} HP`;
    }
  };

  // Format date
  const formatDate = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Proxy Delegators for @{accountName}
          </DialogTitle>
          <DialogDescription>
            {total > 0 ? (
              <>
                {total} account{total !== 1 ? 's' : ''} delegated their witness voting power to @{accountName}
                {totalProxiedHP && <span className="font-semibold"> · Total: {totalProxiedHP}</span>}
              </>
            ) : (
              `No accounts have set @${accountName} as their witness proxy`
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ) : delegators.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No proxy delegators found</p>
              <p className="text-sm mt-2">
                This account doesn't have any accounts proxying their witness votes through them
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {delegators.map((delegator) => {
                const hp = vestsToHivePower(delegator.proxied_vests);
                return (
                  <button
                    key={delegator.account}
                    onClick={() => {
                      setLocation(`/@${delegator.account}`);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors text-left"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarImage 
                          src={`https://images.hive.blog/u/${delegator.account}/avatar`} 
                          alt={delegator.account} 
                        />
                        <AvatarFallback>
                          {delegator.account.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">@{delegator.account}</div>
                        <div className="text-xs text-muted-foreground">
                          Proxy set on {formatDate(delegator.proxy_date)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <div className="font-semibold text-primary">{formatHP(hp)}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {total > 100 && (
          <div className="text-center text-sm text-muted-foreground pt-3 border-t">
            Showing first 100 of {total} proxy delegators
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
