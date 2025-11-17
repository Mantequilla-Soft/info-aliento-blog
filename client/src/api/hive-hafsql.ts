/**
 * HAFBE API Client (HAF Block Explorer)
 * Public HAFBE API: https://api.syncad.com/hafbe-api/
 * 
 * This module provides functions to query historical blockchain data
 * from the HAFBE API for analytics purposes.
 * 
 * HAFBE provides richer data than raw HAF SQL including:
 * - Vote operations with vesting shares (HP)
 * - Accurate timestamps from blockchain
 * - Pagination support
 * - Complete witness statistics
 */

const HAFBE_API = '/api/hafbe';

export interface WitnessVoteOperation {
  voter_name: string;  // Account that voted
  approve: boolean;    // true = vote, false = unvote
  vests: string;       // Total vesting shares at vote time
  account_vests: string; // Account's own vesting shares
  proxied_vests: string; // Proxied vesting shares
  timestamp: string;   // Blockchain timestamp
  
  // Legacy fields for backward compatibility
  block_num?: number;
  id?: string;
  account?: string;
  witness?: string;
}

export interface ProxyDelegator {
  account: string;          // Account that delegated proxy
  proxy_date: string;       // When they set the proxy
  proxied_vests: string;    // Total vesting power contributed
}

export interface DailyVoteCount {
  date: string;
  approvals: number;
  removals: number;
  net: number;
  hpGained: number;    // Total HP from new votes
  hpLost: number;      // Total HP from unvotes
  hpNetChange: number; // Net HP change
}

/**
 * Get the global VESTS to HP conversion ratio
 */
export async function getVestsToHPRatio(): Promise<number> {
  try {
    // Fetch from main Hive API (you can replace with your existing cached value)
    const response = await fetch('https://api.hive.blog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'condenser_api.get_dynamic_global_properties',
        params: [],
        id: 1
      })
    });
    
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    
    const { result } = await response.json();
    const totalVestingFund = parseFloat(result.total_vesting_fund_hive.split(' ')[0]);
    const totalVestingShares = parseFloat(result.total_vesting_shares.split(' ')[0]);
    
    return totalVestingFund / totalVestingShares;
  } catch (error) {
    console.error('Error fetching VESTS to HP ratio:', error);
    // Fallback ratio if API fails
    return 0.000494;
  }
}

/**
 * Get recent witness vote operations for a specific witness
 * 
 * @param witnessName - The witness account name
 * @param hours - Number of hours to look back (default: 24)
 * @param pageSize - Number of results per page (default: 100)
 * @returns Array of witness vote operations with HP data
 */
export async function getRecentWitnessVotes(
  witnessName: string,
  hours: number = 24,
  pageSize: number = 100
): Promise<WitnessVoteOperation[]> {
  try {
    console.log(`Fetching witness votes from HAFBE API for ${witnessName}`);
    
    // Fetch from HAFBE API via proxy - votes are sorted by timestamp DESC (most recent first)
    const response = await fetch(
      `${HAFBE_API}/witnesses/${witnessName}/votes/history?page=1&page-size=${pageSize}`
    );
    
    if (!response.ok) {
      throw new Error(`HAFBE API error: ${response.status}`);
    }
    
    const data = await response.json();
    const allVotes: WitnessVoteOperation[] = data.votes_history || [];
    
    console.log(`Found ${allVotes.length} total votes, filtering by ${hours}h`);
    
    // Filter by time range
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    const recentVotes = allVotes.filter(vote => {
      const voteTime = new Date(vote.timestamp);
      return voteTime >= cutoffTime;
    });
    
    console.log(`Found ${recentVotes.length} votes in the last ${hours} hours`);
    
    return recentVotes;
  } catch (error) {
    console.error(`Error fetching recent witness votes for ${witnessName}:`, error);
    return [];
  }
}

/**
 * Get witness vote trends over multiple days
 * 
 * @param witnessName - The witness account name
 * @param days - Number of days to analyze (default: 7)
 * @returns Array of daily vote counts
 */
export async function getWitnessVoteTrends(
  witnessName: string,
  days: number = 7
): Promise<DailyVoteCount[]> {
  try {
    // Fetch more votes to ensure we get all votes in the time range
    // Year view needs 1000 results, others use 500
    const pageSize = days >= 365 ? 1000 : 500;
    const votes = await getRecentWitnessVotes(witnessName, days * 24, pageSize);
    
    // Get VESTS to HP ratio
    const vestsToHp = await getVestsToHPRatio();
    
    // Group by day
    const byDay: Record<string, DailyVoteCount> = {};
    
    for (const vote of votes) {
      // Use the actual timestamp from HAFBE API
      const date = vote.timestamp.split('T')[0];
      
      // Convert VESTS to HP
      const voteHP = parseFloat(vote.vests || '0') * vestsToHp / 1000000;
      
      if (!byDay[date]) {
        byDay[date] = { 
          date, 
          approvals: 0, 
          removals: 0, 
          net: 0,
          hpGained: 0,
          hpLost: 0,
          hpNetChange: 0
        };
      }
      
      if (vote.approve) {
        byDay[date].approvals++;
        byDay[date].net++;
        byDay[date].hpGained += voteHP;
        byDay[date].hpNetChange += voteHP;
      } else {
        byDay[date].removals++;
        byDay[date].net--;
        byDay[date].hpLost += voteHP;
        byDay[date].hpNetChange -= voteHP;
      }
    }
    
    // Convert to array and sort by date
    return Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error(`Error fetching witness vote trends for ${witnessName}:`, error);
    return [];
  }
}

/**
 * Get recent vote count (last 24 hours)
 * 
 * @param witnessName - The witness account name
 * @returns Object with approval and removal counts
 */
export async function getRecentVoteCount(witnessName: string): Promise<{ approvals: number; removals: number; net: number }> {
  try {
    const votes = await getRecentWitnessVotes(witnessName, 24);
    
    const approvals = votes.filter(v => v.approve).length;
    const removals = votes.filter(v => !v.approve).length;
    
    return {
      approvals,
      removals,
      net: approvals - removals
    };
  } catch (error) {
    console.error(`Error fetching recent vote count for ${witnessName}:`, error);
    return { approvals: 0, removals: 0, net: 0 };
  }
}

/**
 * Get list of accounts that have proxied their voting power to a specific account
 * 
 * @param accountName - The proxy account name
 * @param page - Page number (default: 1, 100 results per page)
 * @returns Array of proxy delegators with their voting power
 */
export async function getProxyDelegators(
  accountName: string,
  page: number = 1
): Promise<{ delegators: ProxyDelegator[]; total: number; totalPages: number }> {
  try {
    console.log(`Fetching proxy delegators for ${accountName} from HAFBE API`);
    
    const response = await fetch(
      `${HAFBE_API}/accounts/${accountName}/proxy-power?page=${page}`
    );
    
    if (!response.ok) {
      if (response.status === 404) {
        // Account has no proxy delegators
        return { delegators: [], total: 0, totalPages: 0 };
      }
      throw new Error(`HAFBE API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // API returns array directly, not an object
    if (Array.isArray(data)) {
      return {
        delegators: data,
        total: data.length,
        totalPages: 1
      };
    }
    
    return { delegators: [], total: 0, totalPages: 0 };
  } catch (error) {
    console.error(`Error fetching proxy delegators for ${accountName}:`, error);
    return { delegators: [], total: 0, totalPages: 0 };
  }
}
