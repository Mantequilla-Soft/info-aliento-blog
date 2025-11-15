/**
 * HAF SQL API Client
 * Public HAF SQL API: https://hafsql-api.mahdiyari.info/
 * 
 * This module provides functions to query historical blockchain data
 * from the HAF SQL API for analytics purposes.
 */

const HAFSQL_API = 'https://hafsql-api.mahdiyari.info';

export interface WitnessVoteOperation {
  block_num: number;
  id: string;
  account: string;
  witness: string;
  approve: boolean;
  timestamp?: string;
}

export interface DailyVoteCount {
  date: string;
  approvals: number;
  removals: number;
  net: number;
}

/**
 * Get dynamic global properties including current block number
 */
export async function getDynamicGlobalProperties() {
  try {
    const response = await fetch(`${HAFSQL_API}/chain/dynamic-global-properties`);
    if (!response.ok) {
      throw new Error(`HAF SQL API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching dynamic global properties from HAF SQL:', error);
    throw error;
  }
}

/**
 * Get recent witness vote operations for a specific witness
 * 
 * @param witnessName - The witness account name
 * @param hours - Number of hours to look back (default: 24)
 * @returns Array of witness vote operations
 */
export async function getRecentWitnessVotes(
  witnessName: string,
  hours: number = 24
): Promise<WitnessVoteOperation[]> {
  try {
    // Get current block number
    const dgp = await getDynamicGlobalProperties();
    const currentBlock = dgp.block_num;
    
    // Calculate block range (3 seconds per block = 1200 blocks per hour)
    const blocksPerHour = 1200;
    const startBlock = currentBlock - (blocksPerHour * hours);
    
    console.log(`Fetching witness votes from HAF SQL: blocks ${startBlock} to ${currentBlock}`);
    
    // Fetch operations
    const response = await fetch(
      `${HAFSQL_API}/operations/by-range/account_witness_vote?block_range=${startBlock}-${currentBlock}`
    );
    
    if (!response.ok) {
      throw new Error(`HAF SQL API error: ${response.status}`);
    }
    
    const allVotes: WitnessVoteOperation[] = await response.json();
    
    console.log(`Found ${allVotes.length} total witness vote operations`);
    
    // Filter for this specific witness
    const witnessVotes = allVotes.filter(v => v.witness === witnessName);
    
    console.log(`Found ${witnessVotes.length} votes for witness ${witnessName}`);
    
    return witnessVotes;
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
    const votes = await getRecentWitnessVotes(witnessName, days * 24);
    
    // Group by day
    const byDay: Record<string, DailyVoteCount> = {};
    
    for (const vote of votes) {
      // Estimate timestamp from block number
      // Block 0 was at 2016-03-24T16:05:00Z
      // Each block is 3 seconds
      const genesisBlock = 0;
      const genesisTimestamp = new Date('2016-03-24T16:05:00Z').getTime();
      const estimatedTimestamp = genesisTimestamp + (vote.block_num - genesisBlock) * 3000;
      const date = new Date(estimatedTimestamp).toISOString().split('T')[0];
      
      if (!byDay[date]) {
        byDay[date] = { date, approvals: 0, removals: 0, net: 0 };
      }
      
      if (vote.approve) {
        byDay[date].approvals++;
        byDay[date].net++;
      } else {
        byDay[date].removals++;
        byDay[date].net--;
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
