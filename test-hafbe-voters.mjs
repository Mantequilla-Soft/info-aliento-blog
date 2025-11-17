// Test script for HAF-BE API voter endpoint
const witnessName = 'aliento';
const page = 1;
const pageSize = 10;

console.log(`Testing HAF-BE API for witness: ${witnessName}\n`);

try {
  const response = await fetch(
    `https://api.syncad.com/hafbe-api/witnesses/${witnessName}/voters?page=${page}&page-size=${pageSize}&sort=vests&direction=desc`
  );

  if (!response.ok) {
    console.error(`HTTP Error: ${response.status} ${response.statusText}`);
    process.exit(1);
  }

  const data = await response.json();
  
  console.log('=== Response Summary ===');
  console.log(`Total votes: ${data.total_votes}`);
  console.log(`Total pages: ${data.total_pages}`);
  console.log(`Voters in this page: ${data.voters?.length || 0}\n`);
  
  console.log('=== Top 5 Voters ===');
  data.voters?.slice(0, 5).forEach((voter, index) => {
    const accountVests = parseFloat(voter.account_vests) / 1000000;
    const proxiedVests = parseFloat(voter.proxied_vests) / 1000000;
    const totalVests = parseFloat(voter.vests) / 1000000;
    
    console.log(`\n${index + 1}. ${voter.voter_name}`);
    console.log(`   Account VESTS: ${accountVests.toLocaleString()}`);
    console.log(`   Proxied VESTS: ${proxiedVests.toLocaleString()}`);
    console.log(`   Total VESTS: ${totalVests.toLocaleString()}`);
    console.log(`   Voted on: ${voter.timestamp}`);
  });

  console.log('\n✅ HAF-BE API test successful!');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
