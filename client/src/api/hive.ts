import { HiveNode, NetworkStats, Witness, UserData, WitnessVoter, ProxyAccount, AccountRewards } from '@/types/hive';
import { formatNumberWithCommas, formatHivePower, formatLargeNumber } from '@/lib/utils';

// Default API node to use if we can't fetch the best nodes
const DEFAULT_API_NODE = 'https://api.hive.blog';

// Cache the best node to reduce API calls
let cachedBestNode: string | null = null;
let cachedNodeList: HiveNode[] = [];

// Function to get the best available Hive node
export const getBestHiveNode = async (): Promise<string> => {
  if (cachedBestNode) {
    return cachedBestNode;
  }

  try {
    const nodes = await getHiveNodes();
    
    // Find a node with 100% score
    const bestNode = nodes.find(node => node.score === '100%');
    
    // Make sure we have a valid node with URL
    if (bestNode && bestNode.url) {
      // Check if the URL already has https:// prefix
      cachedBestNode = bestNode.url.startsWith('http') ? bestNode.url : `https://${bestNode.url}`;
      console.log("Using Hive node:", cachedBestNode);
      return cachedBestNode;
    }
    
    // If no 100% node is found, use the first available node
    if (nodes.length > 0 && nodes[0].url) {
      cachedBestNode = nodes[0].url.startsWith('http') ? nodes[0].url : `https://${nodes[0].url}`;
      console.log("Using fallback Hive node:", cachedBestNode);
      return cachedBestNode;
    }
    
    return DEFAULT_API_NODE;
  } catch (error) {
    console.error('Error getting best Hive node:', error);
    return DEFAULT_API_NODE;
  }
};

// Function to clear the nodes cache (useful for testing)
export const clearNodesCache = () => {
  cachedNodeList = [];
  cachedBestNode = null;
};

// Function to get available Hive API nodes
export const getHiveNodes = async (): Promise<HiveNode[]> => {
  if (cachedNodeList.length > 0) {
    return cachedNodeList;
  }

  try {
    // Use beacon API to fetch node information
    const response = await fetch('https://beacon.peakd.com/api/nodes');
    const data = await response.json();
    
    // Format node data
    const nodes = data.map((node: any) => ({
      url: node.endpoint || node.url, // Use endpoint property if available (contains full URL)
      name: node.name || node.endpoint || node.url,
      version: node.version || '-',
      lastUpdate: node.updated_at || 'unknown',
      score: `${node.score}%`,
      scoreValue: node.score, // Keep numeric value for sorting
      tests: node.success && node.fail !== undefined ? `${node.success} / ${node.success + node.fail}` : '-'
    }));
    
    // Sort by score (desc), then version (desc), then name (asc)
    const sortedNodes = nodes.sort((a: any, b: any) => {
      // First sort by score (higher is better)
      if (b.scoreValue !== a.scoreValue) {
        return b.scoreValue - a.scoreValue;
      }
      
      // Then by version (newer is better)
      if (a.version !== b.version && a.version !== '-' && b.version !== '-') {
        return b.version.localeCompare(a.version, undefined, { numeric: true });
      }
      
      // Finally by name (alphabetical)
      return a.name.localeCompare(b.name);
    });
    
    cachedNodeList = sortedNodes;
    return sortedNodes;
  } catch (error) {
    console.error('Error fetching Hive nodes:', error);
    return [];
  }
};

// Conversion rate from VESTS to HIVE (HP)
let vestToHpRatio: number | null = null;

// Function to ensure we have the vests to hp ratio
const ensureVestToHpRatio = async (): Promise<number> => {
  if (vestToHpRatio !== null) {
    return vestToHpRatio;
  }

  try {
    const apiNode = await getBestHiveNode();
    const response = await fetch(apiNode, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "jsonrpc": "2.0",
        "method": "condenser_api.get_dynamic_global_properties",
        "params": [],
        "id": 1
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error status: ${response.status}`);
    }
    
    const data = await response.json();
    const props = data.result;
    
    // Calculate the VESTS to HP ratio
    const totalHive = parseFloat(props.total_vesting_fund_hive.split(' ')[0]);
    const totalVests = parseFloat(props.total_vesting_shares.split(' ')[0]);
    vestToHpRatio = totalHive / totalVests;
    console.log('Updated VESTS to HP ratio:', vestToHpRatio);
    
    return vestToHpRatio;
  } catch (error) {
    console.error('Error getting VESTS to HP ratio:', error);
    // Use a reasonable fallback value based on typical ratio
    return 0.5 / 1000000; // This is an approximation, use actual value when available
  }
};

// Get network statistics (block height, tx per day, etc.)
export const getNetworkStats = async (): Promise<NetworkStats> => {
  try {
    const apiNode = await getBestHiveNode();
    
    console.log('Making API call to:', apiNode);
    
    // Dynamic properties request
    let resultResponse;
    try {
      resultResponse = await fetch(apiNode, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          "jsonrpc": "2.0",
          "method": "condenser_api.get_dynamic_global_properties",
          "params": [],
          "id": 1
        })
      });
      
      // Check response status
      if (!resultResponse.ok) {
        throw new Error(`HTTP error status: ${resultResponse.status}`);
      }
    } catch (fetchError) {
      console.error('Fetch error getting dynamic properties:', fetchError);
      // If the best node fails, try the default node
      if (apiNode !== DEFAULT_API_NODE) {
        console.log('Trying default API node as fallback');
        resultResponse = await fetch(DEFAULT_API_NODE, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            "jsonrpc": "2.0",
            "method": "condenser_api.get_dynamic_global_properties",
            "params": [],
            "id": 1
          })
        });
        
        if (!resultResponse.ok) {
          throw new Error(`Fallback HTTP error status: ${resultResponse.status}`);
        }
      } else {
        throw fetchError;
      }
    }
    
    const data = await resultResponse.json();
    const props = data.result;
    
    // Calculate the VESTS to HP ratio as per https://developers.hive.io/tutorials-recipes/vest-to-hive.html
    const totalHive = parseFloat(props.total_vesting_fund_hive.split(' ')[0]);
    const totalVests = parseFloat(props.total_vesting_shares.split(' ')[0]);
    vestToHpRatio = totalHive / totalVests;
    console.log('VESTS to HP ratio:', vestToHpRatio);
    
    // Price feed request
    let priceResult;
    try {
      priceResult = await fetch(apiNode, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          "jsonrpc": "2.0",
          "method": "condenser_api.get_current_median_history_price",
          "params": [],
          "id": 1
        })
      });
      
      if (!priceResult.ok) {
        throw new Error(`Price feed HTTP error status: ${priceResult.status}`);
      }
    } catch (priceError) {
      console.error('Error fetching price feed:', priceError);
      // Try default node as a fallback if we're not already using it
      if (apiNode !== DEFAULT_API_NODE) {
        console.log('Using fallback node for price feed');
        priceResult = await fetch(DEFAULT_API_NODE, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            "jsonrpc": "2.0",
            "method": "condenser_api.get_current_median_history_price",
            "params": [],
            "id": 1
          })
        });
      } else {
        throw priceError;
      }
    }
    
    const priceData = await priceResult.json();
    const price = priceData.result;
    
    // Get active witnesses that have signed blocks in the last 24 hours
    let witnessResult;
    try {
      witnessResult = await fetch(apiNode, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          "jsonrpc": "2.0",
          "method": "condenser_api.get_witnesses_by_vote",
          "params": ["", 1000], // Get up to 1000 witnesses
          "id": 2
        })
      });
      
      if (!witnessResult.ok) {
        throw new Error(`Witness HTTP error status: ${witnessResult.status}`);
      }
    } catch (witnessError) {
      console.error('Error fetching witness data:', witnessError);
      // Try default node as a fallback
      if (apiNode !== DEFAULT_API_NODE) {
        console.log('Using fallback node for witness data');
        witnessResult = await fetch(DEFAULT_API_NODE, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            "jsonrpc": "2.0",
            "method": "condenser_api.get_witnesses_by_vote",
            "params": ["", 1000],
            "id": 2
          })
        });
      } else {
        throw witnessError;
      }
    }
    
    const witnessData = await witnessResult.json();
    const witnesses = witnessData.result;
    
    // Calculate how many witnesses have signed a block in the last 24 hours
    // Current block - 28800 = block from 24 hours ago (assuming 3 second block time)
    const currentBlockNum = props.head_block_number;
    const blockFrom24HoursAgo = currentBlockNum - (24 * 60 * 60 / 3);
    
    // Count witnesses that have a recent block (in the last 24 hours)
    const activeWitnessCount = witnesses.filter((witness: any) => {
      const lastBlock = parseInt(witness.last_confirmed_block_num);
      return lastBlock > blockFrom24HoursAgo;
    }).length;
    
    // Format the price as USD - handle potential parsing errors
    let hivePrice = 0;
    try {
      const basePrice = parseFloat(price.base.split(' ')[0]);
      const quotePrice = parseFloat(price.quote.split(' ')[0]);
      if (quotePrice !== 0) {
        hivePrice = basePrice / quotePrice;
      }
    } catch (priceParseError) {
      console.error('Error parsing price data:', priceParseError);
      hivePrice = 0;
    }
    
    return {
      blockHeight: props.head_block_number.toLocaleString(),
      txPerDay: Math.round(props.current_aslot / 1440 * 20).toLocaleString(), // Rough estimate
      activeWitnesses: activeWitnessCount.toString(), // Total witnesses that signed a block in last 24 hours
      hivePrice: hivePrice > 0 ? `$${hivePrice.toFixed(3)}` : "N/A"
    };
  } catch (error) {
    console.error('Error fetching network stats:', error);
    // Log more detailed error information
    console.log('API Node used:', await getBestHiveNode());
    return {
      blockHeight: "Unknown",
      txPerDay: "Unknown",
      activeWitnesses: "Unknown",
      hivePrice: "Unknown"
    };
  }
};

// Get witness information
export const getWitnesses = async (offset: number = 0, limit: number = 100): Promise<Witness[]> => {
  try {
    const apiNode = await getBestHiveNode();
    console.log(`Fetching witnesses from: ${apiNode} (offset: ${offset}, limit: ${limit})`);
    
    // Request witness data with pagination
    let result;
    try {
      // For pagination, we need to get the last witness name from the previous batch
      // For the first batch (offset=0), we use empty string
      let startFrom = "";
      
      // If we're requesting a subsequent batch, first fetch just the witness at position offset-1
      if (offset > 0) {
        try {
          // First get the previous witness to use as a starting point
          const prevResult = await fetch(apiNode, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              "jsonrpc": "2.0",
              "method": "condenser_api.get_witnesses_by_vote",
              "params": ["", offset],
              "id": 1
            })
          });
          
          if (prevResult.ok) {
            const prevData = await prevResult.json();
            const witnesses = prevData.result;
            if (witnesses && witnesses.length > 0) {
              // Get the last witness from previous batch
              startFrom = witnesses[witnesses.length - 1].owner;
            }
          }
        } catch (error) {
          console.error('Error fetching starting point for pagination:', error);
          // Continue with empty startFrom as fallback
        }
      }
      
      // Now fetch the actual witnesses we want to display
      result = await fetch(apiNode, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          "jsonrpc": "2.0",
          "method": "condenser_api.get_witnesses_by_vote",
          "params": [startFrom, limit], // Fetch witnesses with pagination
          "id": 1
        })
      });
      
      if (!result.ok) {
        throw new Error(`Witness list HTTP error status: ${result.status}`);
      }
    } catch (fetchError) {
      console.error('Error fetching witness list:', fetchError);
      // Try default node as a fallback if we're not already using it
      if (apiNode !== DEFAULT_API_NODE) {
        console.log('Using fallback node for witness list');
        result = await fetch(DEFAULT_API_NODE, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            "jsonrpc": "2.0",
            "method": "condenser_api.get_witnesses_by_vote",
            "params": ["", limit], // Fallback to first batch
            "id": 1
          })
        });
      } else {
        throw fetchError;
      }
    }
    
    const data = await result.json();
    const witnesses = data.result;
    
    // Ensure we have the vests to HP ratio before processing
    await ensureVestToHpRatio();
    
    // Get dynamic global properties to determine current block number
    let globalProps;
    try {
      const propsResponse = await fetch(apiNode, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          "jsonrpc": "2.0",
          "method": "condenser_api.get_dynamic_global_properties",
          "params": [],
          "id": 1
        })
      });
      
      if (!propsResponse.ok) {
        throw new Error(`Global props HTTP error status: ${propsResponse.status}`);
      }
      
      const propsData = await propsResponse.json();
      globalProps = propsData.result;
    } catch (error) {
      console.error('Error fetching global properties:', error);
      // Use a fallback approach if we can't get the current block
      globalProps = { head_block_number: 0 };
    }
    
    // Calculate the block number from 72 hours ago (assuming 3 second block time)
    const currentBlockNum = globalProps.head_block_number;
    const blocksIn72Hours = (72 * 60 * 60) / 3; // 72 hours in blocks
    const blockFrom72HoursAgo = currentBlockNum - blocksIn72Hours;
      
    // Format the witness data
    return witnesses.map((witness: any, index: number) => {
      // Convert VESTS to actual Hive Power using the conversion rate
      const vestAmount = parseFloat(witness.votes || '0');
      // Divide by 1,000,000 to account for the scale of VESTS in Hive blockchain
      const hiveAmount = vestAmount * (vestToHpRatio || 0.0005) / 1000000;
      
      // Format Hive Power using our utility function
      const formattedHp = formatHivePower(hiveAmount);
      
      // Format last block number with commas (PeakD style - no # prefix)
      const blockNum = parseInt(witness.last_confirmed_block_num || '0');
      const formattedBlockNum = formatNumberWithCommas(blockNum);
      
      // Check if the witness is active (has signed a block in the last 72 hours)
      const isActive = blockNum > blockFrom72HoursAgo;
      
      return {
        id: witness.id,
        name: witness.owner,
        rank: offset + index + 1, // Calculate actual rank based on page offset
        url: witness.url,
        votes: witness.votes,
        votesHivePower: formattedHp,
        lastBlock: formattedBlockNum,
        missedBlocks: witness.total_missed,
        priceFeed: `$${parseFloat(witness.hbd_exchange_rate.base).toFixed(3)}`,
        version: witness.running_version,
        created: witness.created,
        profileImage: `https://images.hive.blog/u/${witness.owner}/avatar`,
        isActive: isActive
      };
    });
  } catch (error) {
    console.error('Error fetching witnesses:', error);
    return [];
  }
};

// Get user account information
export const getUserAccount = async (username: string): Promise<any> => {
  try {
    const apiNode = await getBestHiveNode();
    console.log(`Fetching account ${username} from:`, apiNode);
    
    // Request account data
    let result;
    try {
      result = await fetch(apiNode, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          "jsonrpc": "2.0",
          "method": "condenser_api.get_accounts",
          "params": [[username]],
          "id": 1
        })
      });
      
      if (!result.ok) {
        throw new Error(`Account fetch HTTP error status: ${result.status}`);
      }
    } catch (fetchError) {
      console.error(`Error fetching account ${username}:`, fetchError);
      // Try default node as a fallback
      if (apiNode !== DEFAULT_API_NODE) {
        console.log('Using fallback node for account info');
        result = await fetch(DEFAULT_API_NODE, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            "jsonrpc": "2.0",
            "method": "condenser_api.get_accounts",
            "params": [[username]],
            "id": 1
          })
        });
      } else {
        throw fetchError;
      }
    }
    
    const data = await result.json();
    const accounts = data.result;
    
    if (!accounts || accounts.length === 0) {
      return null;
    }
    
    return accounts[0];
  } catch (error) {
    console.error(`Error fetching account ${username}:`, error);
    return null;
  }
};

// Get user's witness votes
export const getUserWitnessVotes = async (username: string): Promise<string[]> => {
  try {
    const account = await getUserAccount(username);
    
    if (!account) {
      return [];
    }
    
    // Witness votes are stored in the account's 'witness_votes' array
    return account.witness_votes || [];
  } catch (error) {
    console.error(`Error fetching witness votes for ${username}:`, error);
    return [];
  }
};

// Get witness account voting information (votes + proxy)
export const getWitnessAccountVoting = async (username: string): Promise<{ witnessVotes: string[], proxy: string | null }> => {
  try {
    const account = await getUserAccount(username);
    
    if (!account) {
      return { witnessVotes: [], proxy: null };
    }
    
    // Witness votes are stored in the account's 'witness_votes' array
    const witnessVotes = account.witness_votes || [];
    
    // Proxy is a string field (empty if not proxying)
    const proxy = account.proxy && account.proxy.trim() !== '' ? account.proxy : null;
    
    return { witnessVotes, proxy };
  } catch (error) {
    console.error(`Error fetching witness account voting for ${username}:`, error);
    return { witnessVotes: [], proxy: null };
  }
};

// Calculate user's Hive Power
export const calculateUserHivePower = async (username: string): Promise<string> => {
  try {
    const account = await getUserAccount(username);
    
    if (!account) {
      return '0 HP';
    }
    
    // Ensure we have the vests to HP ratio before processing
    await ensureVestToHpRatio();
    
    // Calculate Hive Power from vesting shares
    // Format is like: "3714.812943 VESTS"
    const vestingShares = parseFloat(account.vesting_shares.split(' ')[0]);
    
    // Only use the account's own vesting shares, ignoring delegations in or out
    // as requested by the user
    
    // Calculate Hive Power
    const hivePower = vestingShares * (vestToHpRatio || 0.0005);
    
    // Format Hive Power
    return formatHivePower(hivePower);
  } catch (error) {
    console.error(`Error calculating Hive Power for ${username}:`, error);
    return '0 HP';
  }
};

// Calculate user's effective Hive Power (including delegations)
export const calculateEffectiveHivePower = async (username: string): Promise<string> => {
  try {
    const account = await getUserAccount(username);
    
    if (!account) {
      return '0 HP';
    }
    
    // Ensure we have the vests to HP ratio before processing
    await ensureVestToHpRatio();
    
    // Calculate Effective Hive Power from vesting shares
    const vestingShares = parseFloat(account.vesting_shares.split(' ')[0]);
    const delegatedVestingShares = parseFloat(account.delegated_vesting_shares.split(' ')[0]);
    const receivedVestingShares = parseFloat(account.received_vesting_shares.split(' ')[0]);
    
    // Total effective vesting shares = own + received - delegated
    const effectiveVests = vestingShares + receivedVestingShares - delegatedVestingShares;
    
    // Calculate Hive Power
    const hivePower = effectiveVests * (vestToHpRatio || 0.0005);
    
    // Format Hive Power
    return formatHivePower(hivePower);
  } catch (error) {
    console.error(`Error calculating effective Hive Power for ${username}:`, error);
    return '0 HP';
  }
};

// Count free witness votes
export const getFreeWitnessVotes = async (username: string): Promise<number> => {
  try {
    const account = await getUserAccount(username);
    
    if (!account) {
      return 0;
    }
    
    // Each Hive account can vote for up to 30 witnesses
    const maxWitnessVotes = 30;
    
    // Get current witness votes
    const witnessVotes = account.witness_votes || [];
    
    // Calculate remaining/free votes
    return maxWitnessVotes - witnessVotes.length;
  } catch (error) {
    console.error(`Error calculating free witness votes for ${username}:`, error);
    return 0;
  }
};

// Calculate proxied Hive Power (HP proxied to account)
export const calculateProxiedHivePower = async (username: string): Promise<string> => {
  try {
    const apiNode = await getBestHiveNode();
    
    // Get the user's account to check their proxied_vsf_votes field
    const accountResponse = await fetch(apiNode, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "jsonrpc": "2.0",
        "method": "condenser_api.get_accounts",
        "params": [[username]],
        "id": 1
      })
    });
    
    if (!accountResponse.ok) {
      throw new Error(`Failed to fetch account ${username}`);
    }
    
    const accountData = await accountResponse.json();
    const account = accountData.result?.[0];
    
    if (!account) {
      console.log(`Account ${username} not found`);
      return '0.000 HP';
    }
    
    console.log(`${username} has no proxy set, checking for incoming proxied power`);
    
    // Ensure we have the vests to HP ratio before processing
    await ensureVestToHpRatio();
    
    // The proxied_vsf_votes field contains the total voting power being proxied TO this account
    // This is the correct field to use for calculating incoming proxied power
    let totalProxiedVests = 0;
    
    if (account.proxied_vsf_votes && Array.isArray(account.proxied_vsf_votes)) {
      // Sum all the proxied voting power (each element represents different types of votes)
      // Usually only the first element contains witness votes
      for (const vests of account.proxied_vsf_votes) {
        const vestValue = typeof vests === 'string' ? parseFloat(vests) : vests;
        if (typeof vestValue === 'number' && vestValue > 0) {
          totalProxiedVests += vestValue;
        }
      }
    }
    
    if (totalProxiedVests === 0) {
      console.log(`No proxy accounts found for ${username}`);
      return '0.000 HP';
    }
    
    // Convert VSF votes to VESTS (divide by 1 million) then to HP
    const proxiedVestsInHiveUnits = totalProxiedVests / 1000000;
    const proxiedHivePower = proxiedVestsInHiveUnits * (vestToHpRatio || 0.0005);
    
    console.log(`${username} has ${formatHivePower(proxiedHivePower)} in proxied power from ${totalProxiedVests} VSF votes`);
    return formatHivePower(proxiedHivePower);
    
  } catch (error) {
    console.error(`Error calculating proxied Hive Power for ${username}:`, error);
    return '0.000 HP';
  }
};

// Get account rewards (author and curation)
export const getAccountRewards = async (username: string): Promise<AccountRewards> => {
  try {
    const account = await getUserAccount(username);
    
    if (!account) {
      return {
        authorRewards: '0 HP',
        curationRewards: '0 HP',
        totalRewards: '0 HP',
        authorPercentage: 0,
        curationPercentage: 0,
        authorRewardsRaw: 0,
        curationRewardsRaw: 0
      };
    }
    
    // Get rewards from account (these are integers representing HP * 1000)
    // The API returns rewards as integers without decimals, scaled by 1000
    const authorHPScaled = parseFloat(account.posting_rewards || '0');
    const curationHPScaled = parseFloat(account.curation_rewards || '0');
    
    // Divide by 1000 to get actual HP values
    const authorHP = authorHPScaled / 1000;
    const curationHP = curationHPScaled / 1000;
    const totalHP = authorHP + curationHP;
    
    console.log(`${username} rewards - Author: ${authorHP.toFixed(0)} HP, Curation: ${curationHP.toFixed(0)} HP`);
    
    return {
      authorRewards: formatHivePower(authorHP),
      curationRewards: formatHivePower(curationHP),
      totalRewards: formatHivePower(totalHP),
      authorPercentage: totalHP > 0 ? (authorHP / totalHP) * 100 : 0,
      curationPercentage: totalHP > 0 ? (curationHP / totalHP) * 100 : 0,
      authorRewardsRaw: authorHP,
      curationRewardsRaw: curationHP
    };
  } catch (error) {
    console.error(`Error getting account rewards for ${username}:`, error);
    return {
      authorRewards: '0 HP',
      curationRewards: '0 HP',
      totalRewards: '0 HP',
      authorPercentage: 0,
      curationPercentage: 0,
      authorRewardsRaw: 0,
      curationRewardsRaw: 0
    };
  }
};

// Get complete user data including profile, Hive Power and witness votes
export const getUserData = async (username: string): Promise<UserData> => {
  try {
    // Get the user's account to check for proxy setting
    const account = await getUserAccount(username);
    const proxy = account?.proxy || null;
    
    if (proxy) {
      console.log(`User ${username} has proxy set to: ${proxy}`);
    }
    
    // Get user's own Hive Power (without delegations)
    const hivePower = await calculateUserHivePower(username);
    
    // Get user's effective Hive Power (including delegations)
    const effectiveHivePower = await calculateEffectiveHivePower(username);
    
    // Get user's proxied Hive Power
    const proxiedHivePower = await calculateProxiedHivePower(username);
    
    // Get user's witness votes
    const witnessVotes = await getUserWitnessVotes(username);
    
    // Calculate free witness votes
    const freeWitnessVotes = await getFreeWitnessVotes(username);
    
    // Get lifetime rewards
    const rewards = await getAccountRewards(username);
    
    // Return complete user data
    return {
      username,
      profileImage: `https://images.hive.blog/u/${username}/avatar`,
      hivePower,
      effectiveHivePower,
      proxiedHivePower,
      freeWitnessVotes,
      witnessVotes,
      proxy,
      rewards
    };
  } catch (error) {
    console.error(`Error getting complete user data for ${username}:`, error);
    // Return minimal data in case of error
    return {
      username,
      profileImage: `https://images.hive.blog/u/${username}/avatar`
    };
  }
};

export const getWitnessByName = async (name: string): Promise<Witness | null> => {
  try {
    const apiNode = await getBestHiveNode();
    console.log(`Fetching witness ${name} from:`, apiNode);
    
    // Request witness data
    let result;
    try {
      result = await fetch(apiNode, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          "jsonrpc": "2.0",
          "method": "condenser_api.get_witness_by_account",
          "params": [name],
          "id": 1
        })
      });
      
      if (!result.ok) {
        throw new Error(`Witness fetch HTTP error status: ${result.status}`);
      }
    } catch (fetchError) {
      console.error(`Error fetching witness ${name}:`, fetchError);
      // Try default node as a fallback if we're not already using it
      if (apiNode !== DEFAULT_API_NODE) {
        console.log('Using fallback node for specific witness');
        result = await fetch(DEFAULT_API_NODE, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            "jsonrpc": "2.0",
            "method": "condenser_api.get_witness_by_account",
            "params": [name],
            "id": 1
          })
        });
      } else {
        throw fetchError;
      }
    }
    
    const data = await result.json();
    const witness = data.result;
    
    if (!witness) {
      return null;
    }
    
    // Log the witness object to inspect properties
    console.log(`Witness data for ${name}:`, witness);
    
    // Fetch the user account information to get the witness_description from posting_metadata
    let witnessDescription;
    try {
      const userAccount = await getUserAccount(name);
      
      if (userAccount && 
          userAccount.posting_json_metadata && 
          typeof userAccount.posting_json_metadata === 'string') {
        // Parse the JSON metadata to extract the witness description
        try {
          const metadata = JSON.parse(userAccount.posting_json_metadata);
          if (metadata.profile && metadata.profile.witness_description) {
            witnessDescription = metadata.profile.witness_description;
            console.log(`Found witness description for ${name}:`, witnessDescription);
          }
        } catch (jsonError) {
          console.error(`Error parsing JSON metadata for ${name}:`, jsonError);
        }
      }
    } catch (accountError) {
      console.error(`Error fetching account for witness ${name}:`, accountError);
    }
    
    // Ensure we have the vests to HP ratio before processing
    await ensureVestToHpRatio();
    
    // Convert VESTS to actual Hive Power using the conversion rate
    const vestAmount = parseFloat(witness.votes);
    // Divide by 1,000,000 to account for the scale of VESTS in Hive blockchain
    const hiveAmount = vestAmount * (vestToHpRatio || 0.0005) / 1000000;
    
    // Format Hive Power using our utility function
    const formattedHp = formatHivePower(hiveAmount);
    
    // Format last block number with commas (PeakD style - no # prefix)
    const blockNum = parseInt(witness.last_confirmed_block_num);
    const formattedBlockNum = formatNumberWithCommas(blockNum);
    
    // Fetch all witnesses to determine rank
    const allWitnesses = await getWitnesses();
    const rank = allWitnesses.findIndex(w => w.name === name) + 1;
    
    // Get dynamic global properties to determine current block number
    let globalProps;
    try {
      const propsResponse = await fetch(apiNode, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          "jsonrpc": "2.0",
          "method": "condenser_api.get_dynamic_global_properties",
          "params": [],
          "id": 1
        })
      });
      
      if (!propsResponse.ok) {
        throw new Error(`Global props HTTP error status: ${propsResponse.status}`);
      }
      
      const propsData = await propsResponse.json();
      globalProps = propsData.result;
    } catch (error) {
      console.error('Error fetching global properties:', error);
      // Use a fallback approach if we can't get the current block
      globalProps = { head_block_number: 0 };
    }
    
    // Calculate the block number from 72 hours ago (assuming 3 second block time)
    const currentBlockNum = globalProps.head_block_number;
    const blocksIn72Hours = (72 * 60 * 60) / 3; // 72 hours in blocks
    const blockFrom72HoursAgo = currentBlockNum - blocksIn72Hours;
    
    // Check if the witness is active (has signed a block in the last 72 hours)
    const isActive = blockNum > blockFrom72HoursAgo;
    
    // Get the HBD interest rate from the witness-specific props
    let hbdInterestRate;
    try {
      // According to the API response, the witness's proposed HBD interest rate is in witness.props.hbd_interest_rate
      // It's stored as a percentage value * 100 (e.g., 20% is stored as 2000)
      if (witness.props && typeof witness.props.hbd_interest_rate === 'number') {
        const witnessInterestRate = witness.props.hbd_interest_rate / 100;
        hbdInterestRate = `${witnessInterestRate.toFixed(2)}%`;
        console.log(`Witness ${name} HBD interest rate: ${hbdInterestRate}`);
      } else {
        // Fallback to global HBD interest rate if witness doesn't have one set
        const globalInterestRate = globalProps.hbd_interest_rate / 100;
        hbdInterestRate = `${globalInterestRate.toFixed(2)}%`;
        console.log(`Using global HBD interest rate: ${hbdInterestRate}`);
      }
    } catch (error) {
      console.error('Error getting HBD interest rate:', error);
      hbdInterestRate = 'Unknown';
    }
    
    return {
      id: witness.id,
      name: witness.owner,
      rank: rank,
      url: witness.url,
      votes: witness.votes,
      votesHivePower: formattedHp,
      lastBlock: formattedBlockNum,
      missedBlocks: witness.total_missed,
      priceFeed: `$${parseFloat(witness.hbd_exchange_rate.base).toFixed(3)}`,
      version: witness.running_version,
      created: witness.created,
      profileImage: `https://images.hive.blog/u/${witness.owner}/avatar`,
      isActive: isActive,
      witnessDescription: witnessDescription,
      hbdInterestRate: hbdInterestRate
    };
  } catch (error) {
    console.error(`Error fetching witness ${name}:`, error);
    return null;
  }
};

// Use the WitnessVoter type from types/hive.ts

// Get voters for a specific witness
export const getProxyAccounts = async (username: string): Promise<ProxyAccount[]> => {
  try {
    const apiNode = await getBestHiveNode();
    
    // Get the VESTS to HP ratio
    await ensureVestToHpRatio();
    
    const proxyAccounts: ProxyAccount[] = [];
    
    // Use witness voting data to find actual proxy relationships
    // Get all voters for this witness to see which votes come through proxies
    console.log(`Getting witness voters for ${username} to find proxy relationships`);
    
    const response = await fetch(apiNode, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "jsonrpc": "2.0",
        "method": "database_api.list_witness_votes",
        "params": {
          "start": [username],
          "limit": 1000,
          "order": "by_witness_account"
        },
        "id": 1
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      const votes = data.result?.votes || [];
      
      console.log(`Found ${votes.length} votes for witness ${username}`);
      
      // Get unique voter accounts that vote for this witness
      const voterAccounts = votes
        .filter((vote: any) => vote.witness === username)
        .map((vote: any) => vote.account);
      
      // Check these voters in batches to see which ones have proxy set to this username
      const batchSize = 50;
      for (let i = 0; i < voterAccounts.length; i += batchSize) {
        const batch = voterAccounts.slice(i, i + batchSize);
        
        try {
          const accountsResponse = await fetch(apiNode, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              "jsonrpc": "2.0",
              "method": "condenser_api.get_accounts",
              "params": [batch],
              "id": 8
            })
          });
          
          if (accountsResponse.ok) {
            const accountsData = await accountsResponse.json();
            const accounts = accountsData.result || [];
            
            for (const account of accounts) {
              if (account.proxy === username) {
                // Calculate Hive Power
                const vestingShares = parseFloat(account.vesting_shares.split(' ')[0]);
                const hivePower = vestingShares * (vestToHpRatio || 0.0005);
                
                proxyAccounts.push({
                  username: account.name,
                  hivePower: formatHivePower(hivePower),
                  profileImage: `https://images.hive.blog/u/${account.name}/avatar`
                });
                
                console.log(`Found actual proxy account: ${account.name} -> ${username} (${formatHivePower(hivePower)})`);
              }
            }
          }
          
          // Small delay to prevent API overload
          if (i + batchSize < voterAccounts.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } catch (error) {
          console.error(`Error checking voter batch:`, error);
        }
      }
    } else {
      console.log(`Failed to get witness votes for ${username}`);
    }
    
    console.log(`Found ${proxyAccounts.length} actual proxy relationships for ${username}`);
    
    // Sort by HP descending
    return proxyAccounts.sort((a, b) => {
      const aHP = parseFloat(a.hivePower.replace(/[^0-9.]/g, ''));
      const bHP = parseFloat(b.hivePower.replace(/[^0-9.]/g, ''));
      return bHP - aHP;
    });
  } catch (error) {
    console.error(`Error fetching proxy accounts for ${username}:`, error);
    return [];
  }
};

export const getWitnessVoters = async (witnessName: string): Promise<WitnessVoter[]> => {
  try {
    console.log(`Fetching voters for witness ${witnessName} from HAF-BE API`);
    
    // Get the VESTS to HP ratio for conversion
    const apiNode = await getBestHiveNode();
    const dynamicProps = await fetch(apiNode, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "jsonrpc": "2.0", 
        "method": "condenser_api.get_dynamic_global_properties",
        "id": 1
      })
    }).then(res => res.json());
    
    const totalVestingShares = parseFloat(dynamicProps.result.total_vesting_shares.split(' ')[0]);
    const totalVestingFundHive = parseFloat(dynamicProps.result.total_vesting_fund_hive.split(' ')[0]);
    const vestToHpRatio = totalVestingFundHive / totalVestingShares;
    
    console.log("VESTS to HP ratio:", vestToHpRatio);
    
    // Fetch all voters from HAF-BE API (paginated)
    const voters: WitnessVoter[] = [];
    let page = 1;
    const pageSize = 100;
    let hasMorePages = true;
    let totalVotes = 0;
    
    while (hasMorePages) {
      try {
        const response = await fetch(
          `/api/hafbe/witnesses/${witnessName}/voters?page=${page}&page-size=${pageSize}&sort=vests&direction=desc`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (!response.ok) {
          console.error(`HAF-BE API error: ${response.status} ${response.statusText}`);
          break;
        }
        
        const data = await response.json();
        
        // Store total votes count from first page
        if (page === 1) {
          totalVotes = data.total_votes || 0;
          console.log(`Total voters for ${witnessName}: ${totalVotes}`);
        }
        
        // Process voters from this page
        for (const voter of data.voters || []) {
          // Convert VESTS to HP
          const accountVests = parseFloat(voter.account_vests) / 1000000;
          const proxiedVests = parseFloat(voter.proxied_vests) / 1000000;
          const totalVests = parseFloat(voter.vests) / 1000000;
          
          const accountHP = accountVests * vestToHpRatio;
          const proxiedHP = proxiedVests * vestToHpRatio;
          const totalHP = totalVests * vestToHpRatio;
          
          voters.push({
            username: voter.voter_name,
            profileImage: `https://images.hive.blog/u/${voter.voter_name}/avatar`,
            hivePower: formatHivePower(accountHP),
            proxiedHivePower: proxiedHP > 0 ? formatHivePower(proxiedHP) : undefined,
            totalHivePower: formatHivePower(totalHP)
          });
        }
        
        // Check if there are more pages
        hasMorePages = page < (data.total_pages || 1);
        page++;
        
        // Limit to reasonable number of pages (prevent infinite loops)
        if (page > 100) {
          console.warn("Reached page limit, stopping pagination");
          break;
        }
        
      } catch (error) {
        console.error(`Error fetching page ${page}:`, error);
        break;
      }
    }
    
    console.log(`Fetched ${voters.length} voters for witness ${witnessName}`);
    
    // Get the witness data to find total votes for percentage calculation
    let totalWitnessVotesHP = 0;
    try {
      const witnessResponse = await fetch(apiNode, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          "jsonrpc": "2.0",
          "method": "condenser_api.get_witness_by_account",
          "params": [witnessName],
          "id": 2
        })
      });
      
      if (witnessResponse.ok) {
        const witnessData = await witnessResponse.json();
        if (witnessData.result && witnessData.result.votes) {
          // votes field is in VESTS (but stored as a large integer)
          const votesInVests = parseFloat(witnessData.result.votes) / 1000000;
          totalWitnessVotesHP = votesInVests * vestToHpRatio;
          console.log(`Witness ${witnessName} total votes: ${totalWitnessVotesHP.toLocaleString()} HP`);
        }
      }
    } catch (error) {
      console.error(`Error fetching witness data for percentage calculation:`, error);
    }
    
    // Calculate percentage for each voter
    if (totalWitnessVotesHP > 0) {
      return voters.map(voter => {
        const ownHP = parseFloat(voter.hivePower.replace(/[^0-9.]/g, ''));
        const proxiedHP = voter.proxiedHivePower ? parseFloat(voter.proxiedHivePower.replace(/[^0-9.]/g, '')) : 0;
        const totalVoterHP = ownHP + proxiedHP;
        const percentage = (totalVoterHP / totalWitnessVotesHP) * 100;
        
        return {
          ...voter,
          percentage: parseFloat(percentage.toFixed(2))
        };
      });
    }
    
    return voters;
    
  } catch (error) {
    console.error(`Error fetching witness voters for ${witnessName}:`, error);
    return [];
  }
};
