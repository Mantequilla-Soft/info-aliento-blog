import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { formatHivePower } from '@/lib/utils';
import { useLocation } from 'wouter';

interface Delegation {
  delegator?: string;
  delegatee?: string;
  amount: string;
  operation_id: string;
  block_num: number;
}

interface DelegationsModalProps {
  open: boolean;
  onClose: () => void;
  accountName: string;
}

export default function DelegationsModal({ open, onClose, accountName }: DelegationsModalProps) {
  const [, setLocation] = useLocation();
  const [outgoing, setOutgoing] = useState<Delegation[]>([]);
  const [incoming, setIncoming] = useState<Delegation[]>([]);
  const [loading, setLoading] = useState(false);
  const [vestToHpRatio, setVestToHpRatio] = useState(0.0005);

  useEffect(() => {
    if (open && accountName) {
      fetchDelegations();
    }
  }, [open, accountName]);

  const fetchDelegations = async () => {
    setLoading(true);
    try {
      // Fetch VESTS to HP ratio first
      const propsResponse = await fetch('https://api.hive.blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'condenser_api.get_dynamic_global_properties',
          params: [],
          id: 1
        })
      });
      const propsData = await propsResponse.json();
      if (propsData.result) {
        const totalVestingFund = parseFloat(propsData.result.total_vesting_fund_hive);
        const totalVestingShares = parseFloat(propsData.result.total_vesting_shares);
        setVestToHpRatio(totalVestingFund / totalVestingShares);
      }

      // Fetch delegations via backend proxy (avoids CORS issues in production)
      const delegationsResponse = await fetch(`/api/balance/accounts/${accountName}/delegations`);
      const delegationsData = await delegationsResponse.json();
      
      setOutgoing(delegationsData.outgoing_delegations || []);
      setIncoming(delegationsData.incoming_delegations || []);
    } catch (error) {
      console.error('Error fetching delegations:', error);
    } finally {
      setLoading(false);
    }
  };

  const convertVestsToHP = (vests: string) => {
    // Balance Tracker API returns VESTS in satoshis (smallest unit)
    // Need to divide by 1,000,000 first to get actual VESTS
    const vestAmount = parseFloat(vests) / 1000000;
    return formatHivePower(vestAmount * vestToHpRatio);
  };

  const renderDelegationsList = (delegations: Delegation[], type: 'outgoing' | 'incoming') => {
    if (loading) {
      return (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-muted/30 rounded-md">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (delegations.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <p>No {type} delegations</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {delegations.map((delegation) => {
          const account = type === 'outgoing' ? delegation.delegatee : delegation.delegator;
          const hp = convertVestsToHP(delegation.amount);
          
          if (!account) return null;
          
          return (
            <div 
              key={`${delegation.delegator}-${delegation.delegatee}`}
              className="flex items-center justify-between p-3 bg-muted/30 rounded-md hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={`https://images.hive.blog/u/${account}/avatar`} alt={account} />
                  <AvatarFallback>{account.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <button
                    onClick={() => {
                      setLocation(`/@${account}`);
                      onClose();
                    }}
                    className="font-medium text-primary hover:underline cursor-pointer"
                  >
                    @{account}
                  </button>
                  <p className="text-xs text-muted-foreground">
                    {type === 'outgoing' ? 'Receiving delegation' : 'Delegating to you'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-primary">{hp}</p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>@{accountName}'s Delegations</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="incoming" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="incoming">
              Incoming ({incoming.length})
            </TabsTrigger>
            <TabsTrigger value="outgoing">
              Outgoing ({outgoing.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="incoming" className="mt-4">
            {renderDelegationsList(incoming, 'incoming')}
          </TabsContent>
          
          <TabsContent value="outgoing" className="mt-4">
            {renderDelegationsList(outgoing, 'outgoing')}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
