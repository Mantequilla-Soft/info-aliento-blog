import { createHiveChain } from '@hiveio/wax';
import WaxExtendedData from '@hiveio/wax-api-jsonrpc';

async function testWax() {
  try {
    console.log('Creating Hive chain with Wax...');
    const chain = await createHiveChain();
    const chainExtended = chain.extend(WaxExtendedData);
    
    console.log('✅ Wax chain created successfully!');
    
    // Test 1: Get dynamic global properties
    console.log('\n📊 Test 1: Getting dynamic global properties...');
    const props = await chainExtended.api.database_api.get_dynamic_global_properties({});
    console.log('Head block:', props.head_block_number);
    console.log('Total vesting fund:', props.total_vesting_fund_hive);
    console.log('Total vesting shares:', props.total_vesting_shares);
    
    // Test 2: Get account
    console.log('\n👤 Test 2: Getting account info...');
    const accounts = await chainExtended.api.database_api.find_accounts({ accounts: ['gtg'] });
    if (accounts && accounts.accounts && accounts.accounts.length > 0) {
      const account = accounts.accounts[0];
      console.log('Account name:', account.name);
      console.log('Vesting shares:', account.vesting_shares);
      console.log('Witness votes count:', account.witness_votes ? account.witness_votes.length : 0);
    }
    
    // Test 3: Check available APIs
    console.log('\n📦 Test 3: Available APIs...');
    console.log('Available APIs:', Object.keys(chainExtended.api));
    
    // Test 4: Try condenser_api
    console.log('\n🏛️  Test 4: Try condenser_api...');
    if (chainExtended.api.condenser_api) {
      const witnesses = await chainExtended.api.condenser_api.get_witnesses_by_vote(['', 5]);
      console.log('Found', witnesses.length, 'witnesses via condenser_api');
    }
    
    console.log('\n✅ All tests passed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

testWax();
