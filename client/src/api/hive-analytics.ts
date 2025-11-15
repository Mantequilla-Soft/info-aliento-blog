/**
 * HAF-style Analytics Module
 * 
 * This module provides advanced blockchain analytics using Hive's database_api
 * Similar to HAF SQL but using the JSON-RPC interface
 */

import { createHiveChain } from '@hiveio/wax';
import WaxExtendedData from '@hiveio/wax-api-jsonrpc';

// Cached Wax chain for analytics
let analyticsWaxChain: any = null;

const getAnalyticsWaxChain = async () => {
  if (analyticsWaxChain) return analyticsWaxChain;
  const chain = await createHiveChain({ apiEndpoint: 'https://api.hive.blog' });
  analyticsWaxChain = chain.extend(WaxExtendedData);
  return analyticsWaxChain;
};

/**
 * Get witness voting patterns
 * Shows which witnesses are frequently voted together
 */
export const getWitnessVotingPatterns = async (witnessName: string, sampleSize: number = 100) => {
  try {
    const chain = await getAnalyticsWaxChain();
    
    // Get voters for this witness using list_witness_votes
    const votesResult = await chain.api.database_api.list_witness_votes({
      start: [witnessName],
      limit: sampleSize,
      order: 'by_witness_account'
    });
    
    const votes = votesResult?.votes || [];
    const voterAccounts = votes
      .filter((vote: any) => vote.witness === witnessName)
      .map((vote: any) => vote.account);
    
    if (voterAccounts.length === 0) {
      return { witnessName, coVoted: [], totalVoters: 0 };
    }
    
    // Get accounts and their witness votes
    const accounts = await chain.api.condenser_api.get_accounts([voterAccounts.slice(0, 50)]);
    
    // Count co-voted witnesses
    const witnessVoteCount: { [key: string]: number } = {};
    
    for (const account of accounts) {
      if (account.witness_votes) {
        for (const votedWitness of account.witness_votes) {
          if (votedWitness !== witnessName) {
            witnessVoteCount[votedWitness] = (witnessVoteCount[votedWitness] || 0) + 1;
          }
        }
      }
    }
    
    // Sort by frequency
    const coVoted = Object.entries(witnessVoteCount)
      .map(([witness, count]) => ({ witness, count, percentage: (count / accounts.length * 100).toFixed(1) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
    
    return {
      witnessName,
      coVoted,
      totalVoters: voterAccounts.length,
      sampleSize: accounts.length
    };
  } catch (error) {
    console.error('Error getting witness voting patterns:', error);
    return { witnessName, coVoted: [], totalVoters: 0, sampleSize: 0 };
  }
};

/**
 * Get witness rank history (simplified version using current data)
 * In a full HAF SQL implementation, this would query historical blocks
 */
export const getWitnessRankHistory = async (witnessName: string) => {
  try {
    const chain = await getAnalyticsWaxChain();
    
    // Get current witness data
    const witness = await chain.api.condenser_api.get_witness_by_account([witnessName]);
    
    if (!witness) {
      return null;
    }
    
    // Get all witnesses to determine current rank
    const allWitnesses = await chain.api.condenser_api.get_witnesses_by_vote(['', 200]);
    const currentRank = allWitnesses.findIndex((w: any) => w.owner === witnessName) + 1;
    
    return {
      witnessName,
      currentRank,
      currentVotes: witness.votes,
      lastBlock: witness.last_confirmed_block_num,
      version: witness.running_version,
      url: witness.url
    };
  } catch (error) {
    console.error('Error getting witness rank history:', error);
    return null;
  }
};

/**
 * Get account operation history
 * Fetches recent operations for an account (witness_vote, transfer, etc.)
 */
export const getAccountOperations = async (
  account: string,
  limit: number = 100,
  operationType?: string
) => {
  try {
    const chain = await getAnalyticsWaxChain();
    
    // Get account history using condenser_api (more widely supported)
    const history = await chain.api.condenser_api.get_account_history([account, -1, limit]);
    
    if (!history || history.length === 0) {
      return [];
    }
    
    // Filter by operation type if specified
    let operations = history;
    if (operationType) {
      operations = operations.filter((op: any) => op[1]?.op?.[0] === operationType);
    }
    
    return operations.map((op: any) => ({
      block: op[1].block,
      timestamp: op[1].timestamp,
      operation: op[1].op[0],
      data: op[1].op[1]
    }));
  } catch (error) {
    console.error('Error getting account operations:', error);
    return [];
  }
};

/**
 * Get witness vote changes for an account
 * Shows when an account voted/unvoted for witnesses
 */
export const getAccountWitnessVoteHistory = async (account: string, limit: number = 50) => {
  try {
    const operations = await getAccountOperations(account, limit, 'account_witness_vote');
    
    return operations.map((op: any) => ({
      timestamp: op.timestamp,
      witness: op.data.witness,
      approve: op.data.approve,
      block: op.block
    }));
  } catch (error) {
    console.error('Error getting witness vote history:', error);
    return [];
  }
};

/**
 * Analyze voting power distribution across top witnesses
 */
export const analyzeVotingPowerDistribution = async (topN: number = 50) => {
  try {
    const chain = await getAnalyticsWaxChain();
    
    const witnesses = await chain.api.condenser_api.get_witnesses_by_vote(['', topN]);
    
    const totalVotes = witnesses.reduce((sum: number, w: any) => 
      sum + parseFloat(w.votes), 0
    );
    
    const distribution = witnesses.map((w: any, index: number) => {
      const votes = parseFloat(w.votes);
      return {
        rank: index + 1,
        witness: w.owner,
        votes: w.votes,
        percentage: ((votes / totalVotes) * 100).toFixed(2),
        lastBlock: w.last_confirmed_block_num
      };
    });
    
    // Calculate concentration metrics
    const top10Percentage = distribution
      .slice(0, 10)
      .reduce((sum: number, w: any) => sum + parseFloat(w.percentage), 0);
    
    const top20Percentage = distribution
      .slice(0, 20)
      .reduce((sum: number, w: any) => sum + parseFloat(w.percentage), 0);
    
    return {
      distribution,
      metrics: {
        totalVotes: totalVotes.toLocaleString(),
        top10Concentration: `${top10Percentage.toFixed(2)}%`,
        top20Concentration: `${top20Percentage.toFixed(2)}%`,
        witnesses: topN
      }
    };
  } catch (error) {
    console.error('Error analyzing voting power distribution:', error);
    return null;
  }
};

/**
 * Find accounts with proxy set to a specific account
 * Useful for seeing who delegates their witness votes
 */
export const getProxyDelegators = async (proxyAccount: string, limit: number = 100) => {
  try {
    const chain = await getAnalyticsWaxChain();
    
    // Get witness voters to find accounts
    const votesResult = await chain.api.database_api.list_witness_votes({
      start: [''],
      limit: 1000,
      order: 'by_witness_account'
    });
    
    const votes = votesResult?.votes || [];
    const uniqueAccounts = Array.from(new Set(votes.map((v: any) => v.account))).slice(0, limit);
    
    // Check which accounts have this proxy set
    const delegators = [];
    const batchSize = 50;
    
    for (let i = 0; i < uniqueAccounts.length; i += batchSize) {
      const batch = uniqueAccounts.slice(i, i + batchSize);
      const accounts = await chain.api.condenser_api.get_accounts([batch]);
      
      for (const account of accounts) {
        if (account.proxy === proxyAccount) {
          delegators.push({
            account: account.name,
            vestingShares: account.vesting_shares,
            created: account.created
          });
        }
      }
    }
    
    return delegators;
  } catch (error) {
    console.error('Error getting proxy delegators:', error);
    return [];
  }
};

/**
 * Get witness missed blocks analysis
 */
export const getWitnessMissedBlocksAnalysis = async (witnessName: string) => {
  try {
    const chain = await getAnalyticsWaxChain();
    
    const witness = await chain.api.condenser_api.get_witness_by_account([witnessName]);
    
    if (!witness) {
      return null;
    }
    
    const totalMissed = parseInt(witness.total_missed);
    const lastBlock = parseInt(witness.last_confirmed_block_num);
    
    // Get global properties to calculate total possible blocks
    const globalProps = await chain.api.condenser_api.get_dynamic_global_properties([]);
    const headBlock = globalProps.head_block_number;
    
    // Estimate blocks since witness was created
    const created = new Date(witness.created);
    const now = new Date();
    const secondsSinceCreation = (now.getTime() - created.getTime()) / 1000;
    const blocksSinceCreation = Math.floor(secondsSinceCreation / 3);
    
    // Estimate total blocks this witness should have produced (rough calculation)
    // Witnesses produce blocks in rounds, approximately 1 block per round
    const estimatedTotalBlocks = Math.floor(blocksSinceCreation / 21); // 21 witnesses per round
    
    const missedPercentage = estimatedTotalBlocks > 0 
      ? ((totalMissed / estimatedTotalBlocks) * 100).toFixed(4)
      : '0';
    
    return {
      witness: witnessName,
      totalMissed,
      lastBlock,
      missedPercentage,
      created: witness.created,
      reliability: (100 - parseFloat(missedPercentage)).toFixed(4)
    };
  } catch (error) {
    console.error('Error getting missed blocks analysis:', error);
    return null;
  }
};
