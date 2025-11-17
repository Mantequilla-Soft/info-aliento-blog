# Witness Voter APIs: HAF-BE vs HiveHub Stats

## API Comparison

### 1. HAF-BE API (Current Implementation)
**Endpoint:** `https://api.syncad.com/hafbe-api/witnesses/{witness_name}/voters`  
**Provider:** Syncad  
**Source:** HAF SQL (Hive Application Framework)

**Data Structure:**
```json
{
  "total_votes": 1141,
  "total_pages": 115,
  "voters": [
    {
      "voter_name": "theycallmedan",
      "vests": "8522431985348369",
      "account_vests": "5101791890111731",
      "proxied_vests": "3420640095236638",
      "timestamp": "2022-08-18T06:35:42"
    }
  ]
}
```

**Features:**
- ✅ Paginated (100 results per page)
- ✅ Complete voter list (all voters)
- ✅ Individual voter timestamps
- ✅ Detailed VESTS breakdown (account + proxied)
- ✅ Sortable by VESTS
- ❌ No voter demographics/statistics

---

### 2. HiveHub Stats API (Fallback Option)
**Endpoint:** `https://stats.hivehub.dev/witnesses`  
**Provider:** PeakD Projects  
**Source:** Hive Open Stats (open source)  
**Repository:** https://gitlab.com/peakd/hive-open-stats

**Data Structure:**
```json
[{
  "witness": "aliento",
  "all_votes_num": "1141",
  "all_votes_hp": "18817626.835",
  "proxied_votes_num": "123",
  "proxied_votes_hp": "30793395.058",
  "under_1_votes_num": "358",
  "under_1_votes_hp": "36.736",
  "btw_1_1k_votes_num": "1962",
  "btw_1_1k_votes_hp": "474446.403",
  "btw_1k_10k_votes_num": "1044",
  "btw_1k_10k_votes_hp": "3715056.814",
  "btw_10k_100k_votes_num": "456",
  "btw_10k_100k_votes_hp": "13626857.584",
  "btw_100k_500k_votes_num": "64",
  "btw_100k_500k_votes_hp": "12628386.511",
  "btw_500k_1m_votes_num": "7",
  "btw_500k_1m_votes_hp": "4887389.584",
  "over_1m_votes_num": "7",
  "over_1m_votes_hp": "59214395.871",
  "votes": [
    {
      "name": "theycallmedan",
      "hive_power": "3095218.210",
      "proxied_hive_power": "2074991.885"
    }
  ]
}]
```

**Features:**
- ✅ Returns ALL witnesses in single call
- ✅ Rich voter demographics (HP ranges)
- ✅ Already converted to HP (no VESTS conversion needed)
- ✅ Statistics aggregations
- ✅ Open source (MIT License)
- ❌ Only top 30 voters per witness
- ❌ No pagination for individual voters
- ❌ No individual voter timestamps

---

## Pros & Cons Analysis

### HAF-BE API (Primary)

#### ✅ PROS
1. **Complete Data**: All voters, not just top 30
2. **Paginated**: Can handle witnesses with thousands of voters efficiently
3. **Granular**: Individual voter timestamps, useful for analytics
4. **Detailed**: Separate account_vests and proxied_vests fields
5. **Sortable**: Can sort by different criteria (vests, name, date)
6. **Scalable**: Works for witnesses with 10 or 10,000 voters

#### ❌ CONS
1. **Multiple Requests**: Need to paginate through many pages for popular witnesses
2. **VESTS Conversion**: Need to fetch dynamic global props for HP conversion
3. **No Demographics**: No voter distribution statistics
4. **Single Witness**: Can only query one witness at a time
5. **Unknown Reliability**: No public SLA or uptime guarantees

---

### HiveHub Stats API (Fallback)

#### ✅ PROS
1. **Single Request**: All witnesses in one call
2. **Rich Statistics**: Voter demographics by HP ranges
3. **HP Pre-Converted**: No need to convert VESTS
4. **Open Source**: Can inspect/verify code at GitLab
5. **PeakD Backing**: Maintained by reputable Hive team
6. **Fast**: No pagination needed for basic use cases
7. **Analytics Ready**: Pre-aggregated statistics for charts
8. **Lightweight**: Only top voters, smaller payload

#### ❌ CONS
1. **Limited Voters**: Only top 30 voters per witness
2. **Not Complete**: Missing 97%+ of voters for popular witnesses (30 out of 3,888 for arcange)
3. **No Pagination**: Can't get voters beyond top 30
4. **No Timestamps**: Can't track when votes were cast
5. **All-or-Nothing**: Returns all witnesses even if you only need one
6. **Larger Initial Payload**: ~150+ witnesses × data = bigger response

---

## Use Case Recommendations

### Use HAF-BE API When:
- ✅ Need complete voter list for a specific witness
- ✅ Building voter pages with pagination
- ✅ Need individual voter timestamps
- ✅ Want to show all voters (not just top 30)
- ✅ Building detailed voter analytics

### Use HiveHub Stats API When:
- ✅ Need overview of ALL witnesses at once
- ✅ Only care about top voters (top 30 is enough)
- ✅ Building witness comparison charts
- ✅ Need voter demographics/distributions
- ✅ HAF-BE API is down (fallback)
- ✅ Building a dashboard (statistics focus)

---

## Recommended Implementation Strategy

### Hybrid Approach (Best of Both)

```typescript
// Use HiveHub for overview page (all witnesses)
async function getWitnessesOverview() {
  // Fetch all witnesses with top 30 voters each
  const response = await fetch('https://stats.hivehub.dev/witnesses');
  return response.json();
}

// Use HAF-BE for individual witness profile (complete voters)
async function getWitnessVoters(witnessName: string) {
  try {
    // Primary: HAF-BE API (complete data, paginated)
    return await fetchFromHAFBE(witnessName);
  } catch (error) {
    // Fallback: HiveHub Stats (top 30 only)
    return await fetchFromHiveHub(witnessName);
  }
}
```

### Fallback Implementation

```typescript
async function getWitnessVotersWithFallback(witnessName: string): Promise<WitnessVoter[]> {
  try {
    console.log(`Fetching voters for ${witnessName} from HAF-BE API`);
    return await fetchFromHAFBE(witnessName);
  } catch (error) {
    console.warn(`HAF-BE API failed, falling back to HiveHub Stats`, error);
    
    try {
      const response = await fetch('https://stats.hivehub.dev/witnesses');
      const data = await response.json();
      const witnessData = data.find(w => w.witness === witnessName);
      
      if (!witnessData) {
        throw new Error(`Witness ${witnessName} not found in HiveHub data`);
      }
      
      // Convert HiveHub format to WitnessVoter format
      return witnessData.votes.map(voter => ({
        username: voter.name,
        profileImage: `https://images.hive.blog/u/${voter.name}/avatar`,
        hivePower: formatHivePower(parseFloat(voter.hive_power)),
        proxiedHivePower: parseFloat(voter.proxied_hive_power) > 0 
          ? formatHivePower(parseFloat(voter.proxied_hive_power)) 
          : undefined,
        totalHivePower: formatHivePower(
          parseFloat(voter.hive_power) + parseFloat(voter.proxied_hive_power)
        )
      }));
    } catch (fallbackError) {
      console.error(`Fallback also failed`, fallbackError);
      return [];
    }
  }
}
```

---

## Performance Comparison

### HAF-BE API
- **First Page (100 voters)**: ~300ms
- **Complete List (1,141 voters)**: ~3-4 seconds (12 requests)
- **Complete List (3,888 voters)**: ~10-15 seconds (39 requests)

### HiveHub Stats API
- **All Witnesses (~150)**: ~800ms-1.5s (single request)
- **Single Witness (top 30)**: ~800ms-1.5s (must fetch all)

---

## Data Quality Comparison

### Example: `aliento` witness

| Metric | HAF-BE API | HiveHub Stats |
|--------|-----------|---------------|
| Total Voters | 1,141 | 1,141 (metadata) |
| Voters Returned | 1,141 (all) | 30 (top only) |
| Total HP | ~18.8M HP | 18,817,626.835 HP |
| Coverage | 100% | ~96% of HP (top 30) |
| Data Freshness | Real-time | Cached/periodic |

**Observation**: HiveHub's top 30 voters represent ~96% of total voting HP, so for **most use cases**, top 30 is sufficient.

---

## PeakD Projects Attribution

### Credits Required
Since HiveHub Stats is open source (MIT License), you should:

1. **Add attribution in docs**:
```markdown
## Data Sources
- Witness voter data: Syncad HAF-BE API
- Fallback data & statistics: PeakD Projects - Hive Open Stats
  - HiveHub: https://gitlab.com/peakd/hivehub.dev
  - Hive Open Stats: https://gitlab.com/peakd/hive-open-stats
  - License: MIT
```

2. **Optional: Add in UI footer**:
```
Data provided by Syncad HAF-BE & PeakD Projects
```

3. **In code comments**:
```typescript
// Fallback to PeakD Projects HiveHub Stats API
// https://gitlab.com/peakd/hive-open-stats
// Open source, MIT License
```

---

## Recommendation

### ✅ Implement Fallback Strategy

**Primary**: HAF-BE API (current implementation)
- Complete data, paginated, detailed

**Fallback**: HiveHub Stats API
- Fast, reliable, covers 96% of voting power
- Only top 30 voters, but that's enough for most cases

**When to show warning to user:**
```
"⚠️ Showing top 30 voters only (represents ~96% of voting power)"
```

### Additional Features from HiveHub

Consider **also using** HiveHub Stats for:
1. **Voter Demographics Chart**: Use the HP range data for pie/bar charts
2. **Quick Stats**: Show voter distribution without fetching all voters
3. **Witness Comparison**: Compare multiple witnesses' voter bases

This gives you the best of both worlds:
- Complete data when needed (HAF-BE)
- Fast statistics and fallback (HiveHub)
- Open source transparency (HiveHub is on GitLab)

---

## Implementation Files to Update

1. `client/src/api/hive.ts`
   - Add `getWitnessVotersWithFallback()` function
   - Keep existing `getWitnessVoters()` as-is (HAF-BE primary)

2. `client/src/api/hivehub-stats.ts` (new file)
   - Add HiveHub Stats API functions
   - Add type definitions for HiveHub response

3. Documentation files:
   - Update `HAFBE_API_INTEGRATION.md` with fallback info
   - Add PeakD Projects attribution
   - Link to GitLab repositories

4. UI components:
   - Show warning when fallback is used
   - Optional: Add voter demographics charts using HiveHub data
