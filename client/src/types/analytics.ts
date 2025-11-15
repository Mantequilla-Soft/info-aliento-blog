/**
 * TypeScript types for HAF-style analytics
 */

export interface WitnessVotingPattern {
  witnessName: string;
  coVoted: {
    witness: string;
    count: number;
    percentage: string;
  }[];
  totalVoters: number;
  sampleSize: number;
}

export interface WitnessRankData {
  witnessName: string;
  currentRank: number;
  currentVotes: string;
  lastBlock: number;
  version: string;
  url: string;
}

export interface AccountOperation {
  block: number;
  timestamp: string;
  operation: string;
  data: any;
}

export interface WitnessVoteChange {
  timestamp: string;
  witness: string;
  approve: boolean;
  block: number;
}

export interface VotingPowerDistribution {
  distribution: {
    rank: number;
    witness: string;
    votes: string;
    percentage: string;
    lastBlock: number;
  }[];
  metrics: {
    totalVotes: string;
    top10Concentration: string;
    top20Concentration: string;
    witnesses: number;
  };
}

export interface ProxyDelegator {
  account: string;
  vestingShares: string;
  created: string;
}

export interface MissedBlocksAnalysis {
  witness: string;
  totalMissed: number;
  lastBlock: number;
  missedPercentage: string;
  created: string;
  reliability: string;
}
