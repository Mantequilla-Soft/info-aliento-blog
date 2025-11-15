/**
 * Test script for HAF-style analytics functions
 * Run with: node test-analytics.mjs
 */

import { createHiveChain } from '@hiveio/wax';
import WaxExtendedData from '@hiveio/wax-api-jsonrpc';

console.log('🔍 Testing HAF-style Analytics Functions\n');

// Initialize Wax chain
let analyticsWaxChain = null;

const getAnalyticsWaxChain = async () => {
  if (analyticsWaxChain) return analyticsWaxChain;
  const chain = await createHiveChain({ apiEndpoint: 'https://api.hive.blog' });
  analyticsWaxChain = chain.extend(WaxExtendedData);
  return analyticsWaxChain;
};

// Test 1: Witness Voting Patterns
async function testWitnessVotingPatterns() {
  console.log('📊 Test 1: Witness Voting Patterns');
  console.log('Testing with witness: gtg\n');
  
  try {
    const chain = await getAnalyticsWaxChain();
    
    const votesResult = await chain.api.database_api.list_witness_votes({
      start: ['gtg'],
      limit: 50,
      order: 'by_witness_account'
    });
    
    const votes = votesResult?.votes || [];
    const voterAccounts = votes
      .filter(vote => vote.witness === 'gtg')
      .map(vote => vote.account)
      .slice(0, 20);
    
    console.log(`✅ Found ${voterAccounts.length} voters for gtg`);
    console.log('Sample voters:', voterAccounts.slice(0, 5).join(', '));
    
    // Get their other witness votes
    const accounts = await chain.api.condenser_api.get_accounts([voterAccounts.slice(0, 10)]);
    
    const witnessVoteCount = {};
    for (const account of accounts) {
      if (account.witness_votes) {
        for (const votedWitness of account.witness_votes) {
          if (votedWitness !== 'gtg') {
            witnessVoteCount[votedWitness] = (witnessVoteCount[votedWitness] || 0) + 1;
          }
        }
      }
    }
    
    const coVoted = Object.entries(witnessVoteCount)
      .map(([witness, count]) => ({ witness, count, percentage: (count / accounts.length * 100).toFixed(1) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    console.log('\nTop 10 witnesses frequently voted with gtg:');
    coVoted.forEach((w, i) => {
      console.log(`  ${i + 1}. ${w.witness.padEnd(20)} - ${w.count} votes (${w.percentage}%)`);
    });
    
    console.log('\n✅ Test 1 passed!\n');
  } catch (error) {
    console.error('❌ Test 1 failed:', error.message);
  }
}

// Test 2: Account Operation History
async function testAccountOperationHistory() {
  console.log('📊 Test 2: Account Operation History');
  console.log('Testing with account: aliento\n');
  
  try {
    const chain = await getAnalyticsWaxChain();
    
    const history = await chain.api.condenser_api.get_account_history(['aliento', -1, 20]);
    
    if (!history || history.length === 0) {
      console.log('No history found');
      return;
    }
    
    console.log(`✅ Found ${history.length} recent operations\n`);
    
    const operations = history
      .map(op => ({
        block: op[1].block,
        timestamp: op[1].timestamp,
        operation: op[1].op[0],
        data: op[1].op[1]
      }))
      .slice(0, 10);
    
    console.log('Last 10 operations:');
    operations.forEach((op, i) => {
      console.log(`  ${i + 1}. Block ${op.block} - ${op.operation}`);
    });
    
    console.log('\n✅ Test 2 passed!\n');
  } catch (error) {
    console.error('❌ Test 2 failed:', error.message);
  }
}

// Test 3: Voting Power Distribution
async function testVotingPowerDistribution() {
  console.log('📊 Test 3: Voting Power Distribution');
  console.log('Analyzing top 20 witnesses\n');
  
  try {
    const chain = await getAnalyticsWaxChain();
    
    const witnesses = await chain.api.condenser_api.get_witnesses_by_vote(['', 20]);
    
    const totalVotes = witnesses.reduce((sum, w) => sum + parseFloat(w.votes), 0);
    
    const distribution = witnesses.map((w, index) => {
      const votes = parseFloat(w.votes);
      return {
        rank: index + 1,
        witness: w.owner,
        votes: w.votes,
        percentage: ((votes / totalVotes) * 100).toFixed(2),
        lastBlock: w.last_confirmed_block_num
      };
    });
    
    const top10Percentage = distribution
      .slice(0, 10)
      .reduce((sum, w) => sum + parseFloat(w.percentage), 0);
    
    console.log('Top 10 witnesses:');
    distribution.slice(0, 10).forEach(w => {
      console.log(`  ${w.rank}. ${w.witness.padEnd(20)} - ${w.percentage}% of top 20`);
    });
    
    console.log(`\n✅ Top 10 control ${top10Percentage.toFixed(2)}% of voting power (in top 20)`);
    console.log('✅ Test 3 passed!\n');
  } catch (error) {
    console.error('❌ Test 3 failed:', error.message);
  }
}

// Test 4: Witness Missed Blocks Analysis
async function testMissedBlocksAnalysis() {
  console.log('📊 Test 4: Witness Missed Blocks Analysis');
  console.log('Testing with witness: gtg\n');
  
  try {
    const chain = await getAnalyticsWaxChain();
    
    const witness = await chain.api.condenser_api.get_witness_by_account(['gtg']);
    
    if (!witness) {
      console.log('Witness not found');
      return;
    }
    
    const totalMissed = parseInt(witness.total_missed);
    const lastBlock = parseInt(witness.last_confirmed_block_num);
    
    const globalProps = await chain.api.condenser_api.get_dynamic_global_properties([]);
    const headBlock = globalProps.head_block_number;
    
    const created = new Date(witness.created);
    const now = new Date();
    const secondsSinceCreation = (now.getTime() - created.getTime()) / 1000;
    const blocksSinceCreation = Math.floor(secondsSinceCreation / 3);
    const estimatedTotalBlocks = Math.floor(blocksSinceCreation / 21);
    
    const missedPercentage = estimatedTotalBlocks > 0 
      ? ((totalMissed / estimatedTotalBlocks) * 100).toFixed(4)
      : '0';
    
    const reliability = (100 - parseFloat(missedPercentage)).toFixed(4);
    
    console.log(`Witness: ${witness.owner}`);
    console.log(`Created: ${witness.created}`);
    console.log(`Total Missed Blocks: ${totalMissed.toLocaleString()}`);
    console.log(`Last Confirmed Block: ${lastBlock.toLocaleString()}`);
    console.log(`Current Head Block: ${headBlock.toLocaleString()}`);
    console.log(`Estimated Total Blocks: ${estimatedTotalBlocks.toLocaleString()}`);
    console.log(`Missed Percentage: ${missedPercentage}%`);
    console.log(`Reliability: ${reliability}%`);
    
    console.log('\n✅ Test 4 passed!\n');
  } catch (error) {
    console.error('❌ Test 4 failed:', error.message);
  }
}

// Test 5: Witness Rank Information
async function testWitnessRank() {
  console.log('📊 Test 5: Witness Rank Information');
  console.log('Testing with witness: aliento\n');
  
  try {
    const chain = await getAnalyticsWaxChain();
    
    const witness = await chain.api.condenser_api.get_witness_by_account(['aliento']);
    
    if (!witness) {
      console.log('Witness not found');
      return;
    }
    
    const allWitnesses = await chain.api.condenser_api.get_witnesses_by_vote(['', 200]);
    const currentRank = allWitnesses.findIndex(w => w.owner === 'aliento') + 1;
    
    console.log(`Witness: ${witness.owner}`);
    console.log(`Current Rank: ${currentRank > 0 ? currentRank : 'Not in top 200'}`);
    console.log(`Votes: ${witness.votes}`);
    console.log(`Version: ${witness.running_version}`);
    console.log(`URL: ${witness.url}`);
    console.log(`Last Block: ${witness.last_confirmed_block_num}`);
    
    console.log('\n✅ Test 5 passed!\n');
  } catch (error) {
    console.error('❌ Test 5 failed:', error.message);
  }
}

// Run all tests
async function runAllTests() {
  console.log('═══════════════════════════════════════════════════════════\n');
  
  await testWitnessVotingPatterns();
  await testAccountOperationHistory();
  await testVotingPowerDistribution();
  await testMissedBlocksAnalysis();
  await testWitnessRank();
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🎉 All tests completed!\n');
}

runAllTests().catch(console.error);
