# HAF SQL API Analytics Features

While the public HAF SQL API at https://hafsql-api.mahdiyari.info/ cannot provide complete voter lists, it CAN be used for valuable analytics features.

## Available Analytics with HAF SQL API

### 1. **Recent Voting Activity**
Track recent witness votes in real-time:
```
GET /operations/by-range/account_witness_vote?block_range=START-END
```

**Use case:** Show "Recent voters for @aliento" in last 24 hours

**Implementation:**
```javascript
// Get blocks from last 24 hours (~28,800 blocks)
const currentBlock = 101208406;
const blocksPerDay = 28800; // 3 seconds per block
const startBlock = currentBlock - blocksPerDay;

const response = await fetch(
  `https://hafsql-api.mahdiyari.info/operations/by-range/account_witness_vote?block_range=${startBlock}-${currentBlock}`
);
const votes = await response.json();

// Filter for specific witness
const alientoVotes = votes.filter(v => v.witness === 'aliento' && v.approve === true);
```

### 2. **Vote Trend Analysis**
Track voting patterns over time:

**Weekly vote activity:**
```javascript
// Get last 7 days of blocks
const blocksPerWeek = 28800 * 7;
const weeklyVotes = await getVotesByRange(currentBlock - blocksPerWeek, currentBlock);

// Group by day
const dailyVotes = groupByDay(weeklyVotes);
// Result: [{ date: '2025-11-08', newVotes: 5, unvotes: 1 }, ...]
```

**Display:** Line chart showing daily vote changes

### 3. **Unvote Detection**
Monitor accounts that stopped voting:
```javascript
const unvotes = votes.filter(v => v.witness === 'aliento' && v.approve === false);
```

**Use case:** Alert system for lost votes

### 4. **Voter Engagement Timeline**
Show when major voters first voted:
```javascript
// For each major voter, find their first vote block
async function getFirstVoteBlock(account, witness) {
  // Binary search through blocks to find first vote
  // This requires multiple queries but is doable for individual accounts
}
```

### 5. **Voting Pattern Correlation**
Find accounts that vote/unvote at similar times:
```javascript
// Analyze vote operations to find coordinated voting
const voteEvents = await getVotesByRange(startBlock, endBlock);
const groupedByBlock = groupBy(voteEvents, 'block_num');

// Find blocks with multiple votes for same witness
const coordinatedVotes = groupedByBlock.filter(group => group.length > 1);
```

### 6. **Historical Witness Comparison**
Compare voting activity across witnesses:
```javascript
const allVotes = await getVotesByRange(startBlock, endBlock);
const byWitness = groupBy(allVotes, 'witness');

// Result: { 'aliento': 45, 'gtg': 123, 'blocktrades': 89 }
```

## UI Feature Ideas

### Feature 1: "Recent Activity" Tab
```
Recent Voting Activity (Last 24h)
┌─────────────────────────────────┐
│ 🟢 @user123 voted 2 hours ago   │
│ 🟢 @voter456 voted 5 hours ago  │
│ 🔴 @former789 unvoted 12h ago   │
└─────────────────────────────────┘
```

### Feature 2: "Vote Trends" Chart
```
Weekly Vote Activity
    ^
 15 │     ▄▄
    │   ▄▄  ▄▄
 10 │ ▄▄      ▄▄
    │            ▄▄
  5 │              ▄▄
    └────────────────>
     Mon ... Sun
```

### Feature 3: "Voting Momentum" Badge
```
🔥 Hot: +12 votes this week
📉 Declining: -5 votes this week
➡️  Stable: ±2 votes this week
```

## Implementation Priority

### High Priority (Easy wins)
1. ✅ **Recent Activity Feed** - Show last 100 votes (24h typically)
2. ✅ **Daily Vote Counter** - Display new votes today
3. ✅ **Unvote Alerts** - Highlight recent unvotes

### Medium Priority (Requires caching)
4. ⏳ **Weekly Trend Chart** - Line graph of daily vote counts
5. ⏳ **Vote Velocity** - Calculate votes/day over last 30 days

### Low Priority (Complex queries)
6. ❓ **Voter Timeline** - When each major voter first voted
7. ❓ **Correlation Analysis** - Which accounts vote together

## Technical Considerations

### Caching Strategy
- Cache vote operations per day (immutable once day passes)
- Update only current day's data
- Store in browser localStorage or backend cache

### Query Limits
- HAF SQL API may have rate limits
- Each block range query can return many operations
- Optimize by querying only necessary block ranges

### Performance
- Recent activity (last 28,800 blocks): ~1-2 second query
- Weekly data: Requires multiple queries or wider range
- Consider backend caching for better UX

## Example Implementation

```javascript
// client/src/api/hive-hafsql.ts

const HAFSQL_API = 'https://hafsql-api.mahdiyari.info';

export async function getRecentWitnessVotes(
  witnessName: string, 
  hours: number = 24
): Promise<WitnessVoteOperation[]> {
  // Get current block
  const dgp = await fetch(`${HAFSQL_API}/chain/dynamic-global-properties`);
  const { block_num } = await dgp.json();
  
  // Calculate block range
  const blocksPerHour = 1200; // 3 seconds per block
  const startBlock = block_num - (blocksPerHour * hours);
  
  // Fetch operations
  const response = await fetch(
    `${HAFSQL_API}/operations/by-range/account_witness_vote?block_range=${startBlock}-${block_num}`
  );
  
  const allVotes = await response.json();
  
  // Filter for this witness
  return allVotes.filter(v => v.witness === witnessName);
}

export async function getWitnessVoteTrends(
  witnessName: string,
  days: number = 7
): Promise<DailyVoteCount[]> {
  const votes = await getRecentWitnessVotes(witnessName, days * 24);
  
  // Group by day
  const byDay = votes.reduce((acc, vote) => {
    const date = new Date(vote.timestamp).toISOString().split('T')[0];
    if (!acc[date]) acc[date] = { date, approvals: 0, removals: 0 };
    
    if (vote.approve) acc[date].approvals++;
    else acc[date].removals++;
    
    return acc;
  }, {});
  
  return Object.values(byDay);
}
```

## Summary

While HAF SQL API can't replace our current voter list implementation, it's excellent for:
- ✅ **Real-time activity feeds**
- ✅ **Trend analysis**
- ✅ **Historical vote tracking**
- ✅ **Engagement analytics**

These features would complement the existing voter list and provide additional insights into witness support dynamics.
