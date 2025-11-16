export interface HiveNode {
  url: string;
  name?: string;
  version: string;
  lastUpdate: string;
  score: string;
  scoreValue?: number;
  tests: string;
}

export interface NetworkStats {
  blockHeight: string;
  txPerDay: string;
  activeWitnesses: string;
  hivePrice: string;
}

export interface Witness {
  id: string;
  name: string;
  rank: number;
  url: string;
  votes: string;
  votesHivePower: string;
  lastBlock: string;
  missedBlocks: number;
  priceFeed: string;
  version: string;
  created: string;
  profileImage: string;
  isActive: boolean; // Flag to indicate if the witness is active (has signed a block in the last 72 hours)
  witnessDescription?: string; // The witness description from posting_metadata
  hbdInterestRate?: string; // HBD interest rate (APR)
}

export interface UserData {
  username: string;
  profileImage?: string;
  hivePower?: string;
  effectiveHivePower?: string;
  proxiedHivePower?: string;
  freeWitnessVotes?: number;
  witnessVotes?: string[];
  proxy?: string; // The account this user is proxying their votes to
  rewards?: AccountRewards; // Lifetime rewards data
}

export interface AccountRewards {
  authorRewards: string; // Lifetime author rewards in HP
  curationRewards: string; // Lifetime curation rewards in HP
  totalRewards: string; // Combined total
  authorPercentage: number; // % from authoring
  curationPercentage: number; // % from curation
  authorRewardsRaw: number; // Raw HP value for calculations
  curationRewardsRaw: number; // Raw HP value for calculations
}

export interface ProxyAccount {
  username: string;
  hivePower: string;
  profileImage: string;
  children?: ProxyAccount[];
}

export interface WitnessVoter {
  username: string;
  profileImage: string;
  hivePower: string;
  proxiedHivePower?: string;
  totalHivePower?: string;
  percentage?: number; // Percentage of witness's total voting power
  proxyAccounts?: ProxyAccount[];
}

export type VoteWitnessResponse = {
  success: boolean;
  error?: string;
  result?: any;
};

export type LoginResponse = {
  success: boolean;
  username?: string;
  error?: string;
  publicKey?: string;
  result?: any;
};
