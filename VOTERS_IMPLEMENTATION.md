# Voters List Implementation - Current vs HAF SQL

## Current Implementation (WITHOUT HAF SQL)

### What It Shows
The current voters list displays **only major HP holders** who vote for the witness. This typically represents **80-90% of the total voting power**.

### How It Works
Since the Hive blockchain API doesn't provide a direct method to get ALL voters for a witness, we use multiple approaches to find major stakeholders:

1. **Top Vesting Delegators** - Queries accounts with largest delegations
2. **Known Major Stakeholders** - Hardcoded list of ~40 major accounts (blocktrades, smooth, gtg, etc.)
3. **Active Witnesses** - Checks all top 150 witnesses (witnesses often vote for each other)
4. **Top 1000 Accounts** - Samples from alphabetically listed accounts and sorts by HP

### Features Added (Current)
✅ **Percentage Calculation** - Each voter shows their % contribution to witness's total votes
✅ **Pie Chart** - Visual distribution of voting power (top 9 voters + "Others")
✅ **Informational Badge** - Clearly states "Showing top voters (major HP holders)"
✅ **Explanatory Note** - Blue info box explaining HAF SQL requirement for ALL voters
✅ **Sorted by Power** - Voters sorted by total governance HP (own + proxied)

### Limitations
❌ **Cannot show ALL voters** - Small HP accounts are not included
❌ **No complete count** - Cannot show "X out of Y total voters"
❌ **Slower queries** - Multiple API calls required (4 different approaches)
❌ **Incomplete data** - "Others" category in pie chart represents unshown voters

---

## With HAF SQL (Future Enhancement)

### What HAF SQL Provides
**HAF (Hive Application Framework) SQL** is a PostgreSQL database that indexes ALL Hive blockchain operations, allowing complex SQL queries.

### What You Could Do With HAF SQL

#### 1. **Complete Voter List**
```sql
SELECT account, vesting_shares 
FROM witness_votes 
WHERE witness = 'aliento' 
ORDER BY vesting_shares DESC;
```
Shows **ALL** voters, including those with just 10 HP.

#### 2. **Accurate Total Count**
```sql
SELECT COUNT(*) FROM witness_votes WHERE witness = 'aliento';
```
Display "Showing 150 out of 2,347 total voters"

#### 3. **Historical Analysis**
```sql
SELECT DATE(timestamp), COUNT(*) as new_votes
FROM witness_vote_operations
WHERE witness = 'aliento' AND approve = true
GROUP BY DATE(timestamp)
ORDER BY timestamp DESC;
```
Track when people voted for the witness over time.

#### 4. **Advanced Analytics**
- Voter retention rate
- Voting patterns (who votes together)
- Proxy chain analysis
- Geographic distribution (by IP/voting patterns)
- Voting power concentration metrics

#### 5. **Real-time Updates**
HAF SQL can provide websocket subscriptions to new votes in real-time.

### HAF SQL Setup Requirements

1. **Infrastructure**: PostgreSQL server with 500GB+ storage
2. **Sync Time**: 1-2 weeks for initial blockchain sync
3. **Maintenance**: Regular updates as blockchain grows
4. **Resources**: ~8GB RAM minimum, preferably 16GB+

### HAF SQL for Witness Operations

Running your own HAF instance benefits your witness in multiple ways:
- Direct blockchain data access (no API dependency)
- Custom analytics for your witness performance
- Community tools development
- Independence from third-party APIs

---

## Current Status

### What You Have Now
✅ Functional voter display showing major stakeholders
✅ Percentage calculations for power distribution
✅ Visual pie chart representation
✅ Clear indication this is not a complete list
✅ All voters shown with avatars, HP stats, and percentages

### What's Missing (Requires HAF SQL)
❌ Complete list of ALL voters (including small accounts)
❌ Total voter count
❌ Historical voting data
❌ Advanced analytics queries

---

## Recommendation

**Current Implementation is Good For:**
- Quick visibility of major stakeholders
- Understanding voting power distribution
- Identifying key supporters
- Production use without infrastructure overhead

**Upgrade to HAF SQL When:**
- You need complete voter lists
- Building advanced analytics features
- Want historical trend analysis
- Running witness node with capacity for HAF

---

## Data Source Clarification

**We are NOT using HAF SQL** - the current implementation uses:
- Standard Hive blockchain APIs (`condenser_api`, `database_api`)
- Multiple heuristic approaches to find major voters
- Wax library for type-safe API interactions

The pie chart and percentages are calculated from the visible major voters against the witness's total voting power from the blockchain API.

### Public HAF SQL API Investigation

We investigated the public HAF SQL API at https://hafsql-api.mahdiyari.info/ but found it **does not provide the aggregated data we need**:

**What it has:**
- ✅ Operation history (`account_witness_vote` operations by block range)
- ✅ Account data (balances, followers, etc.)
- ✅ Dynamic global properties

**What it's missing:**
- ❌ Aggregated witness voter lists (no endpoint to get all current voters for a witness)
- ❌ Account `witness_votes` array in account data
- ❌ Direct witness voter queries

**Why it doesn't work for our use case:**
To get all current voters for a witness using this API, we would need to:
1. Query ALL `account_witness_vote` operations across millions of blocks (from genesis to current)
2. Build our own state aggregation (tracking approve=true/false for each account+witness pair)
3. This would require scanning 100M+ blocks and is not practical for real-time queries

The HAF SQL API is designed for historical analysis and operation queries, not for querying current aggregated state like "all voters for witness X".

**Conclusion:** The standard Hive API approach we're using is the most practical solution without running your own HAF instance with custom state tables.
