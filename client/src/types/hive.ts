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
  isActive: boolean; // Flag to indicate if the witness is active (signed a block in last 24 hours)
  isDisabled?: boolean; // Flag to indicate if the witness is disabled (signing key is null key)
  isStale?: boolean; // Flag to indicate if the witness is stale (hasn't signed in 24 hours but has valid key)
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
  governanceVoteExpiration?: string | null; // Timestamp when governance votes expire
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

export interface WitnessSchedule {
  id: number;
  current_virtual_time: string;
  next_shuffle_block_num: number;
  current_shuffled_witnesses: string[];
  num_scheduled_witnesses: number;
  elected_weight: number;
  timeshare_weight: number;
  miner_weight: number;
  witness_pay_normalization_factor: number;
  median_props: any;
  majority_version: string;
  max_voted_witnesses: number;
  max_miner_witnesses: number;
  max_runner_witnesses: number;
  hardfork_required_witnesses: number;
  account_subsidy_rd: any;
  account_subsidy_witness_rd: any;
  min_witness_account_subsidy_decay: number;
}

export interface WitnessScheduleDisplay {
  currentWitness: string;
  upcomingWitnesses: string[];
  backupWitnesses: string[];
  allScheduledWitnesses: string[];
  currentSlot: number;
  nextShuffleBlock: number;
  currentBlock: number;
}
