# Additional User Statistics - Enhancement Ideas

## Currently Available Data (From Hive API)

### ✅ Already Implemented
- Own Hive Power
- Effective Hive Power (with delegations)
- Proxied Hive Power
- Governance Power
- Witness votes list
- Proxy status

### 📊 Available But Not Yet Displayed

#### 1. **Author & Curation Rewards** ⭐ (High Priority)
Data from `condenser_api.get_accounts`:
- `curation_rewards` - Total lifetime curation rewards (in VESTS)
- `posting_rewards` - Total lifetime author rewards (in VESTS)

**Display Ideas:**
```typescript
// Lifetime Earnings Card
{
  authorRewards: "20,401 HP", // Convert posting_rewards from VESTS to HP
  curationRewards: "28,689 HP", // Convert curation_rewards from VESTS to HP
  totalEarnings: "49,090 HP",
  ratio: "70% Curation / 30% Author" // Shows earning strategy
}
```

#### 2. **Pending Rewards**
- `reward_hive_balance` - Pending HIVE rewards
- `reward_hbd_balance` - Pending HBD rewards  
- `reward_vesting_balance` - Pending HP rewards (in VESTS)
- `reward_vesting_hive` - Pending HP rewards (in HIVE)

**Display Ideas:**
```typescript
// Pending Rewards Card
{
  pendingHive: "0.123 HIVE",
  pendingHBD: "5.678 HBD",
  pendingHP: "12.345 HP",
  claimable: true // Show claim button if > 0
}
```

#### 3. **Account Activity Metrics**
- `last_root_post` - Last post date (not comment)
- `last_post` - Last post/comment date
- `total_posts` - Total posts + comments count
- `last_vote_time` - Last voting activity

**Display Ideas:**
```typescript
// Activity Card
{
  lastPost: "2 days ago",
  totalPosts: "12,802 posts",
  lastVote: "3 hours ago",
  accountAge: "6.9 years", // From created date
  postsPerDay: "5.1" // total_posts / days_since_created
}
```

#### 4. **Savings & Balances**
- `hive_balance` - Liquid HIVE balance
- `hbd_balance` - Liquid HBD balance
- `savings_hive_balance` - HIVE in savings
- `savings_hbd_balance` - HBD in savings
- `savings_withdraw_requests` - Pending withdrawals

**Display Ideas:**
```typescript
// Balances Card
{
  liquidHive: "100.500 HIVE",
  liquidHBD: "50.250 HBD",
  savingsHive: "1,000.000 HIVE",
  savingsHBD: "500.000 HBD",
  totalValue: "$X USD" // Calculate at current prices
}
```

#### 5. **Reputation Score**
- `reputation` - Raw reputation score

**Display:**
```typescript
// Convert raw to readable
reputation: "79.26" // Already available in HAF SQL
reputationBar: "Progress to 80" // Visual bar
```

#### 6. **Delegation Status**
- `delegated_vesting_shares` - HP delegated out
- `received_vesting_shares` - HP delegated in

**Display:**
```typescript
// Delegation Card
{
  delegatedOut: "5,000 HP to X accounts",
  receivedIn: "216,360 HP from X accounts",
  netDelegation: "+211,360 HP" // received - delegated
}
```

#### 7. **Power Down Status**
- `vesting_withdraw_rate` - Weekly power down amount
- `to_withdraw` - Total amount being powered down
- `withdrawn` - Amount already withdrawn
- `next_vesting_withdrawal` - Next withdrawal date

**Display:**
```typescript
// Power Down Card (if active)
{
  weeklyAmount: "858 HP per week",
  totalPowerDown: "11,156 HP",
  remaining: "11,156 HP (13 weeks)",
  nextDate: "Nov 21, 2025"
}
```

#### 8. **Follower/Following Stats**
Available from HAF SQL API:
- `followers` - Total followers count
- `followings` - Total following count

**Display:**
```typescript
// Social Stats Card
{
  followers: "3,983",
  following: "632",
  ratio: "6.3x" // followers/following ratio
}
```

---

## 📈 Advanced Analytics (Requires Additional API Calls)

### Using HAF SQL Operations History

#### 9. **Earnings Timeline** (Last 30 Days)
Query `author_reward` and `curation_reward` operations:
- Daily/weekly earning trends
- Recent post rewards
- Curation effectiveness

**Implementation:**
```javascript
// Query operations by type
GET /operations/by-range/author_reward,curation_reward?block_range=LAST_30_DAYS

// Aggregate by day
{
  dailyAuthorRewards: [{date: "2025-11-14", amount: "5.2 HP"}, ...],
  dailyCurationRewards: [{date: "2025-11-14", amount: "8.1 HP"}, ...],
  chart: LineChart // Show 30-day trend
}
```

#### 10. **Post Performance Stats**
Query recent posts and analyze:
- Average post rewards
- Most successful post
- Post frequency
- Engagement metrics

**Data from operations:**
```javascript
// Query comment operations for posts
const posts = await getAccountPosts(username, 30);

{
  avgReward: "12.5 HP per post",
  topPost: {title: "...", reward: "45 HP"},
  postsLastMonth: 15,
  avgCommentsPerPost: 8.3
}
```

#### 11. **Voting Behavior Analysis**
Query `vote` operations:
- Voting frequency
- Average vote value
- Accounts most voted for
- Voting patterns (time of day, etc.)

**Implementation:**
```javascript
// Query vote operations
GET /operations/by-range/vote?block_range=LAST_30_DAYS

{
  totalVotes: "1,234 votes cast",
  avgVotesPerDay: "41",
  topVotedAuthors: ["author1", "author2", ...],
  votingPower: "Consistent at 95%+"
}
```

#### 12. **Transfer History**
Query `transfer` operations:
- Recent transfers in/out
- Transfer volume
- Most frequent transfer partners

#### 13. **Comment Activity**
Query `comment` operations:
- Comments vs Posts ratio
- Reply frequency
- Engagement score

---

## 🎨 UI Component Ideas

### New Tab: "Earnings"
```
┌─────────────────────────────────────────┐
│ Lifetime Earnings                       │
│ ┌─────────────┐ ┌─────────────┐        │
│ │ Author      │ │ Curation    │        │
│ │ 20,401 HP   │ │ 28,689 HP   │        │
│ └─────────────┘ └─────────────┘        │
│                                         │
│ 30-Day Earnings Chart                  │
│ [Line chart showing daily rewards]     │
└─────────────────────────────────────────┘
```

### New Tab: "Activity"
```
┌─────────────────────────────────────────┐
│ Account Activity                        │
│ • Last Post: 2 days ago                │
│ • Total Posts: 12,802                  │
│ • Account Age: 6.9 years              │
│ • Posts/Day: 5.1                       │
│ • Reputation: 79.26 ⭐                 │
│                                         │
│ Recent Posts (with rewards)            │
│ [List of recent posts]                 │
└─────────────────────────────────────────┘
```

### New Tab: "Balances"
```
┌─────────────────────────────────────────┐
│ Wallet Balances                         │
│ ┌──────────┐ ┌──────────┐             │
│ │ Liquid   │ │ Savings  │             │
│ │ 100 HIVE │ │ 1K HIVE  │             │
│ │ 50 HBD   │ │ 500 HBD  │             │
│ └──────────┘ └──────────┘             │
│                                         │
│ Pending Rewards                        │
│ [Claimable rewards if any]            │
│                                         │
│ Power Down Status                      │
│ [Power down details if active]        │
└─────────────────────────────────────────┘
```

---

## 🚀 Implementation Priority

### Phase 1: Easy Wins (Already Available Data)
1. ✅ **Author & Curation Rewards** - Lifetime earnings display
2. ✅ **Pending Rewards** - Show claimable rewards
3. ✅ **Activity Metrics** - Last post, total posts, account age
4. ✅ **Reputation** - Visual display with progress bar
5. ✅ **Follower Stats** - From HAF SQL

### Phase 2: Wallet Features
6. ⏳ **Liquid Balances** - HIVE/HBD display
7. ⏳ **Savings** - Savings balances
8. ⏳ **Delegations** - In/out delegation details
9. ⏳ **Power Down** - If active, show status

### Phase 3: Advanced Analytics (HAF SQL Operations)
10. ❓ **Earnings Timeline** - 30-day chart
11. ❓ **Post Performance** - Recent post stats
12. ❓ **Voting Analysis** - Voting patterns
13. ❓ **Transfer History** - Recent transfers

---

## 💡 Specific Implementation Example: Author Rewards

### Code Changes Needed

**1. Update API Client** (`client/src/api/hive.ts`):
```typescript
export interface AccountRewards {
  authorRewards: string; // Lifetime author rewards in HP
  curationRewards: string; // Lifetime curation rewards in HP
  totalRewards: string; // Combined total
  authorPercentage: number; // % from authoring
  curationPercentage: number; // % from curation
}

export async function getAccountRewards(username: string): Promise<AccountRewards> {
  const account = await getUserAccount(username);
  await ensureVestToHpRatio();
  
  const authorVests = parseFloat(account.posting_rewards);
  const curationVests = parseFloat(account.curation_rewards);
  
  const authorHP = authorVests * vestToHpRatio;
  const curationHP = curationVests * vestToHpRatio;
  const totalHP = authorHP + curationHP;
  
  return {
    authorRewards: formatHivePower(authorHP),
    curationRewards: formatHivePower(curationHP),
    totalRewards: formatHivePower(totalHP),
    authorPercentage: totalHP > 0 ? (authorHP / totalHP) * 100 : 0,
    curationPercentage: totalHP > 0 ? (curationHP / totalHP) * 100 : 0
  };
}
```

**2. Add to User Stats Page**:
```tsx
<TabsTrigger value="earnings">Earnings</TabsTrigger>

<TabsContent value="earnings">
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <Card>
      <CardContent className="p-4">
        <div className="text-sm text-muted-foreground">Author Rewards</div>
        <div className="text-2xl font-bold text-green-600">
          {rewards.authorRewards}
        </div>
        <div className="text-xs text-muted-foreground">
          {rewards.authorPercentage.toFixed(1)}% of total
        </div>
      </CardContent>
    </Card>
    
    <Card>
      <CardContent className="p-4">
        <div className="text-sm text-muted-foreground">Curation Rewards</div>
        <div className="text-2xl font-bold text-blue-600">
          {rewards.curationRewards}
        </div>
        <div className="text-xs text-muted-foreground">
          {rewards.curationPercentage.toFixed(1)}% of total
        </div>
      </CardContent>
    </Card>
    
    <Card>
      <CardContent className="p-4">
        <div className="text-sm text-muted-foreground">Total Lifetime</div>
        <div className="text-2xl font-bold text-primary">
          {rewards.totalRewards}
        </div>
        <div className="text-xs text-muted-foreground">
          Combined earnings
        </div>
      </CardContent>
    </Card>
  </div>
</TabsContent>
```

---

## Summary

**Easiest to implement (Phase 1):**
- ✅ Author & Curation rewards - Just convert VESTS to HP
- ✅ Pending rewards - Already in account data
- ✅ Activity metrics - Simple date/count display
- ✅ Reputation - Format raw score
- ✅ Follower stats - Available from HAF SQL

**Medium difficulty (Phase 2):**
- Balances & Savings - Display liquid/savings
- Delegations - Show in/out amounts
- Power down status - If active

**Advanced (Phase 3):**
- Earnings timeline - Requires HAF SQL operations queries
- Post performance - Parse recent posts
- Voting analysis - Aggregate vote operations

Would you like me to implement **Phase 1** (Author/Curation Rewards + Activity Metrics) first? That would be a great addition and uses data we already fetch!
